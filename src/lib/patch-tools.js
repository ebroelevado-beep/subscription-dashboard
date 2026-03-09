const fs = require("fs");
const path = require("path");

const filePath = path.join("/home/pera/pearfect/subscription-dashboard/src/lib/copilot-tools.ts");
const lines = fs.readFileSync(filePath, "utf-8").split("\n");

// 1. Modify the signature
const signatureStart = lines.findIndex(l => l.includes("export function createUserScopedTools("));
const signatureEnd = lines.findIndex((l, i) => i > signatureStart && l.includes(") {"));

lines[signatureStart + 2] = "  userId: string,\n  allowDestructive: boolean = false";
const returnStart = lines.findIndex(l => l.includes("return ["));
lines[returnStart] = "  const tools = [";

// 2. Find line 689 which is the end of getDisciplineScores
const getDisciplineScoresEnd = lines.findIndex((l, i) => i > 600 && l.trim() === "}),");

// Prepare the new content
const newContent = `  ];

  if (!allowDestructive) {
    tools.push(
      defineTool("undoMutation", {
        description: "This tool is informational only. Undo is handled directly by the UI via a secure backend endpoint. If the user asks to undo something, tell them to use the 'Ir Atrás' button shown after each executed mutation.",
        parameters: z.object({}),
        handler: async () => ({
          message: "Undo is handled directly by the UI. Use the 'Ir Atrás' button that appears after each confirmed change."
        })
      })
    );
    return tools;
  }

  // ALLOW DESTRUCTIVE MODE ENABLED - Add all mutation tools
  tools.push(
    defineTool("updateUserConfig", {
      description: "Propose an update to the user's personal configuration (e.g. discipline penalty, currency).",
      parameters: z.object({
        disciplinePenalty: z.number().min(0.1).max(2.0).describe("0.5 to 2.0").optional(),
        currency: z.string().length(3).describe("ISO code (e.g. EUR)").optional(),
      }),
      handler: async ({ disciplinePenalty, currency }: any) => {
        const user = await prisma.user.findUnique({ where: { id: userId }, select: { disciplinePenalty: true, currency: true }});
        if (!user) return { error: "User not found." };
        const pendingChanges = { ...(disciplinePenalty !== undefined ? { disciplinePenalty } : {}), ...(currency ? { currency } : {}) };
        const { token } = await createMutationToken(userId, { toolName: "updateUserConfig", targetId: userId, action: "update", changes: pendingChanges, previousValues: { disciplinePenalty: user.disciplinePenalty, currency: user.currency } });
        await prisma.mutationAuditLog.update({ where: { token }, data: { newValues: pendingChanges } });
        return { status: "requires_confirmation", __token: token, message: "I am ready to update your configuration.", pendingChanges };
      },
    }),

    defineTool("updateClient", {
      description: "Propose an update to a client's information (name, phone, notes).",
      parameters: z.object({
        clientId: z.string().describe("The ID of the client to update."),
        name: z.string().optional().describe("New name for the client."),
        phone: z.string().optional().describe("New phone number."),
        notes: z.string().optional().describe("New notes/comments."),
      }),
      handler: async ({ clientId, name, phone, notes }: any) => {
        const client = await prisma.client.findFirst({ where: { id: clientId, userId } });
        if (!client) return { error: "Client not found or access denied." };
        const pendingChanges = { name, phone, notes };
        const { token } = await createMutationToken(userId, { toolName: "updateClient", targetId: clientId, action: "update", changes: pendingChanges, previousValues: { name: client.name, phone: client.phone, notes: client.notes } });
        await prisma.mutationAuditLog.update({ where: { token }, data: { newValues: pendingChanges } });
        return { status: "requires_confirmation", __token: token, message: \`I'm ready to update client \${client.name}.\`, pendingChanges };
      },
    }),

    defineTool("createClient", {
      description: "Propose creating a new client profile.",
      parameters: z.object({
        name: z.string().describe("The full name of the client."),
        phone: z.string().optional().describe("Optional phone number."),
        notes: z.string().optional().describe("Optional notes."),
      }),
      handler: async ({ name, phone, notes }: any) => {
        const pendingChanges = { name, phone, notes };
        const { token } = await createMutationToken(userId, { toolName: "createClient", action: "create", changes: pendingChanges, previousValues: null });
        await prisma.mutationAuditLog.update({ where: { token }, data: { newValues: pendingChanges } });
        return { status: "requires_confirmation", __token: token, message: \`I'm ready to create a new client profile for **\${name}**.\`, pendingChanges };
      },
    }),

    defineTool("assignClientToSubscription", {
      description: "Propose assigning a client to a subscription group (seat).",
      parameters: z.object({
        clientId: z.string().describe("The ID of the client."),
        subscriptionId: z.string().describe("The ID of the subscription group (instance of a plan)."),
        customPrice: z.number().describe("The price the client pays for this seat."),
        activeUntil: z.string().describe("ISO date until which the seat is paid for."),
        joinedAt: z.string().optional().describe("ISO date of joining. Defaults to today."),
        serviceUser: z.string().optional().describe("Username/Profile name in the service."),
        servicePassword: z.string().optional().describe("Password for this profile."),
      }),
      handler: async ({ clientId, subscriptionId, customPrice, activeUntil, joinedAt, serviceUser, servicePassword }: any) => {
        const client = await prisma.client.findFirst({ where: { id: clientId, userId } });
        const sub = await prisma.subscription.findFirst({ where: { id: subscriptionId, userId } });
        if (!client || !sub) return { error: "Client or Subscription not found." };
        const pendingChanges = { clientId, subscriptionId, customPrice, activeUntil, joinedAt, serviceUser, servicePassword };
        const { token } = await createMutationToken(userId, { toolName: "assignClientToSubscription", action: "create", changes: pendingChanges, previousValues: null });
        await prisma.mutationAuditLog.update({ where: { token }, data: { newValues: pendingChanges } });
        return { status: "requires_confirmation", __token: token, message: \`I'm ready to assign **\${client.name}** to **\${sub.label}**.\`, pendingChanges };
      },
    }),

    defineTool("logPayment", {
      description: "Propose registering a new payment received from a client.",
      parameters: z.object({
        clientSubscriptionId: z.string().describe("The ID of the client's seat/subscription (Not the client ID)."),
        amountPaid: z.number().describe("The amount paid by the client."),
        monthsRenewed: z.number().default(1).describe("Number of months the payment covers."),
        paidOn: z.string().optional().describe("Date of payment (ISO format). Defaults to today."),
        notes: z.string().optional().describe("Optional notes for the payment."),
      }),
      handler: async ({ clientSubscriptionId, amountPaid, monthsRenewed, paidOn, notes }: any) => {
        const cs = await prisma.clientSubscription.findFirst({ where: { id: clientSubscriptionId, subscription: { userId } }, include: { client: true, subscription: { include: { plan: { include: { platform: true } } } } } });
        if (!cs) return { error: "Client subscription not found or access denied." };
        const pendingChanges = { clientSubscriptionId, amountPaid, monthsRenewed, paidOn, notes };
        const { token } = await createMutationToken(userId, { toolName: "logPayment", targetId: clientSubscriptionId, action: "create", changes: pendingChanges, previousValues: { activeUntil: cs.activeUntil.toISOString() } });
        await prisma.mutationAuditLog.update({ where: { token }, data: { newValues: pendingChanges } });
        return { status: "requires_confirmation", __token: token, message: \`I'm ready to register a payment of \${amountPaid}€ from \${cs.client.name}.\`, pendingChanges };
      },
    }),

    // --- BULK AND POTENTIALLY DESTRUCTIVE TOOLS ---
    defineTool("deleteClients", {
      description: "Propose the COMPLETE and PERMANENT deletion of one or multiple clients. MUST narrate client info before calling.",
      parameters: z.object({
        clientIds: z.array(z.string()).describe("An array of client IDs to delete."),
      }),
      handler: async ({ clientIds }: any) => {
        const clients = await prisma.client.findMany({ where: { id: { in: clientIds }, userId }, include: { clientSubscriptions: true } });
        if (!clients.length) return { error: "Clients not found or access denied." };
        
        const previousValues = clients.map(c => ({
            id: c.id, name: c.name, phone: c.phone, notes: c.notes, createdAt: c.createdAt.toISOString(),
            disciplineScore: c.disciplineScore, dailyPenalty: c.dailyPenalty, daysOverdue: c.daysOverdue, healthStatus: c.healthStatus
        }));

        const pendingChanges = { clientIds };
        const { token } = await createMutationToken(userId, { toolName: "deleteClients", targetId: "bulk", action: "delete", changes: pendingChanges, previousValues });
        await prisma.mutationAuditLog.update({ where: { token }, data: { newValues: pendingChanges } });
        return { status: "requires_confirmation", __token: token, message: \`I am ready to permanently delete \${clients.length} client(s): \${clients.map((c: any) => c.name).join(", ")}.\`, pendingChanges };
      },
    }),

    defineTool("removeClientsFromSubscription", {
      description: "Propose unassigning one or multiple clients from their seat(s).",
      parameters: z.object({
        clientSubscriptionIds: z.array(z.string()).describe("An array of ClientSubscription pivot record IDs to delete."),
      }),
      handler: async ({ clientSubscriptionIds }: any) => {
        const css = await prisma.clientSubscription.findMany({ where: { id: { in: clientSubscriptionIds }, client: { userId } }, include: { client: true, subscription: true } });
        if (!css.length) return { error: "Client subscriptions not found or access denied." };
        
        const previousValues = css.map(c => ({
            id: c.id, clientId: c.clientId, subscriptionId: c.subscriptionId, customPrice: c.customPrice,
            activeUntil: c.activeUntil.toISOString(), joinedAt: c.joinedAt.toISOString(), leftAt: c.leftAt?.toISOString(),
            status: c.status, remainingDays: c.remainingDays, serviceUser: c.serviceUser, servicePassword: c.servicePassword
        }));

        const pendingChanges = { clientSubscriptionIds };
        const { token } = await createMutationToken(userId, { toolName: "removeClientsFromSubscription", targetId: "bulk", action: "delete", changes: pendingChanges, previousValues });
        await prisma.mutationAuditLog.update({ where: { token }, data: { newValues: pendingChanges } });
        return { status: "requires_confirmation", __token: token, message: \`I am ready to remove \${css.length} seat assignment(s).\`, pendingChanges };
      },
    }),

    defineTool("managePlatforms", {
      description: "Creates, updates, or bulk-deletes platforms based on the provided operation.",
      parameters: z.object({
        operation: z.enum(["create", "update", "delete"]),
        platformIds: z.array(z.string()).optional().describe("For 'delete', provide array of platform IDs. For 'update', provide exactly 1 ID."),
        name: z.string().optional().describe("For 'create' or 'update'."),
        icon: z.string().optional().describe("For 'create' or 'update'."),
      }),
      handler: async ({ operation, platformIds, name, icon }: any) => {
        const pendingChanges = { operation, platformIds, name, icon };
        // Get previous state if updating/deleting
        let previousValues: any = null;
        if (operation === "delete" && platformIds) {
            const platforms = await prisma.platform.findMany({ where: { id: { in: platformIds }, userId } });
            previousValues = platforms.map(p => ({ id: p.id, name: p.name, icon: p.icon }));
        } else if (operation === "update" && platformIds && platformIds[0]) {
            const p = await prisma.platform.findFirst({ where: { id: platformIds[0], userId } });
            previousValues = p ? [{ id: p.id, name: p.name, icon: p.icon }] : [];
        }

        const { token } = await createMutationToken(userId, { toolName: "managePlatforms", action: operation as any, changes: pendingChanges, previousValues });
        await prisma.mutationAuditLog.update({ where: { token }, data: { newValues: pendingChanges } });
        return { status: "requires_confirmation", __token: token, message: \`I am ready to \${operation} platform(s).\`, pendingChanges };
      },
    }),

    defineTool("managePlans", {
      description: "Creates, updates, or bulk-deletes plans.",
      parameters: z.object({
        operation: z.enum(["create", "update", "delete"]),
        planIds: z.array(z.string()).optional().describe("For 'delete' array, for 'update' single ID."),
        platformId: z.string().optional().describe("For 'create'"),
        name: z.string().optional(),
        cost: z.number().optional(),
        maxSeats: z.number().optional(),
        isActive: z.boolean().optional(),
      }),
      handler: async ({ operation, planIds, platformId, name, cost, maxSeats, isActive }: any) => {
        const pendingChanges = { operation, planIds, platformId, name, cost, maxSeats, isActive };
        let previousValues: any = null;
        if (operation === "delete" && planIds) {
            const plans = await prisma.plan.findMany({ where: { id: { in: planIds }, platform: { userId } }});
            previousValues = plans;
        } else if (operation === "update" && planIds && planIds[0]) {
            const p = await prisma.plan.findFirst({ where: { id: planIds[0], platform: { userId } } });
            previousValues = p ? [p] : [];
        }
        const { token } = await createMutationToken(userId, { toolName: "managePlans", action: operation as any, changes: pendingChanges, previousValues });
        await prisma.mutationAuditLog.update({ where: { token }, data: { newValues: pendingChanges } });
        return { status: "requires_confirmation", __token: token, message: \`I am ready to \${operation} plan(s).\`, pendingChanges };
      },
    }),

    defineTool("manageSubscriptions", {
      description: "Creates, updates, or bulk-deletes subscriptions.",
      parameters: z.object({
        operation: z.enum(["create", "update", "delete"]),
        subscriptionIds: z.array(z.string()).optional(),
        planId: z.string().optional(),
        label: z.string().optional(),
        status: z.string().optional(),
        startDate: z.string().optional(),
        activeUntil: z.string().optional(),
        masterUsername: z.string().optional(),
        masterPassword: z.string().optional(),
      }),
      handler: async ({ operation, subscriptionIds, planId, label, status, startDate, activeUntil, masterUsername, masterPassword }: any) => {
        const pendingChanges = { operation, subscriptionIds, planId, label, status, startDate, activeUntil, masterUsername, masterPassword };
        let previousValues: any = null;
        if (operation === "delete" && subscriptionIds) {
            const subs = await prisma.subscription.findMany({ where: { id: { in: subscriptionIds }, userId }});
            previousValues = subs;
        } else if (operation === "update" && subscriptionIds && subscriptionIds[0]) {
            const p = await prisma.subscription.findFirst({ where: { id: subscriptionIds[0], userId } });
            previousValues = p ? [p] : [];
        }
        const { token } = await createMutationToken(userId, { toolName: "manageSubscriptions", action: operation as any, changes: pendingChanges, previousValues });
        await prisma.mutationAuditLog.update({ where: { token }, data: { newValues: pendingChanges } });
        return { status: "requires_confirmation", __token: token, message: \`I am ready to \${operation} subscription(s).\`, pendingChanges };
      },
    }),

    defineTool("undoMutation", {
      description: "This tool is informational only. Undo is handled directly by the UI via a secure backend endpoint.",
      parameters: z.object({}),
      handler: async () => ({ message: "Undo is handled directly by the UI. Use the 'Ir Atrás' button that appears after each confirmed change." })
    })
  );

  return tools;
}
`;

const finalLines = [...lines.slice(0, getDisciplineScoresEnd + 1), newContent];
fs.writeFileSync(filePath, finalLines.join("\n"));
