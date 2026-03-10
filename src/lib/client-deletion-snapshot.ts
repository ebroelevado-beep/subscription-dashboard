import type { Prisma } from "@prisma/client";

type DecimalValue = {
  toString(): string;
};

type DecimalLike = DecimalValue | number | string | null;

type DeletionSnapshotSource = {
  id: string;
  name: string;
  phone: string | null;
  notes: string | null;
  createdAt: Date;
  disciplineScore: DecimalLike;
  dailyPenalty: DecimalLike;
  daysOverdue: number;
  healthStatus: string | null;
  clientSubscriptions: Array<{
    id: string;
    clientId: string;
    subscriptionId: string;
    customPrice: DecimalLike;
    activeUntil: Date;
    joinedAt: Date;
    leftAt: Date | null;
    status: "active" | "paused";
    remainingDays: number | null;
    serviceUser: string | null;
    servicePassword: string | null;
    renewalLogs: Array<{
      id: string;
      amountPaid: DecimalLike;
      expectedAmount: DecimalLike;
      periodStart: Date;
      periodEnd: Date;
      paidOn: Date;
      dueOn: Date;
      monthsRenewed: number;
      notes: string | null;
      createdAt: Date;
    }>;
  }>;
  ownedSubscriptions: Array<{
    id: string;
  }>;
};

export type DeletedClientSnapshot = {
  id: string;
  name: string;
  phone: string | null;
  notes: string | null;
  createdAt: string;
  disciplineScore: string | null;
  dailyPenalty: string | null;
  daysOverdue: number;
  healthStatus: string | null;
  clientSubscriptions: Array<{
    id: string;
    clientId: string;
    subscriptionId: string;
    customPrice: string | null;
    activeUntil: string;
    joinedAt: string;
    leftAt: string | null;
    status: "active" | "paused";
    remainingDays: number | null;
    serviceUser: string | null;
    servicePassword: string | null;
    renewalLogs: Array<{
      id: string;
      amountPaid: string | null;
      expectedAmount: string | null;
      periodStart: string;
      periodEnd: string;
      paidOn: string;
      dueOn: string;
      monthsRenewed: number;
      notes: string | null;
      createdAt: string;
    }>;
  }>;
  ownedSubscriptionIds: string[];
};

export function serializeDeletedClients(
  clients: DeletionSnapshotSource[],
): DeletedClientSnapshot[] {
  return clients.map((client) => ({
    id: client.id,
    name: client.name,
    phone: client.phone,
    notes: client.notes,
    createdAt: client.createdAt.toISOString(),
    disciplineScore: decimalToString(client.disciplineScore),
    dailyPenalty: decimalToString(client.dailyPenalty),
    daysOverdue: client.daysOverdue,
    healthStatus: client.healthStatus,
    clientSubscriptions: client.clientSubscriptions.map((clientSubscription) => ({
      id: clientSubscription.id,
      clientId: clientSubscription.clientId,
      subscriptionId: clientSubscription.subscriptionId,
      customPrice: decimalToString(clientSubscription.customPrice),
      activeUntil: clientSubscription.activeUntil.toISOString(),
      joinedAt: clientSubscription.joinedAt.toISOString(),
      leftAt: clientSubscription.leftAt?.toISOString() ?? null,
      status: clientSubscription.status,
      remainingDays: clientSubscription.remainingDays,
      serviceUser: clientSubscription.serviceUser,
      servicePassword: clientSubscription.servicePassword,
      renewalLogs: clientSubscription.renewalLogs.map((renewalLog) => ({
        id: renewalLog.id,
        amountPaid: decimalToString(renewalLog.amountPaid),
        expectedAmount: decimalToString(renewalLog.expectedAmount),
        periodStart: renewalLog.periodStart.toISOString(),
        periodEnd: renewalLog.periodEnd.toISOString(),
        paidOn: renewalLog.paidOn.toISOString(),
        dueOn: renewalLog.dueOn.toISOString(),
        monthsRenewed: renewalLog.monthsRenewed,
        notes: renewalLog.notes,
        createdAt: renewalLog.createdAt.toISOString(),
      })),
    })),
    ownedSubscriptionIds: client.ownedSubscriptions.map((subscription) => subscription.id),
  }));
}

export function parseDeletedClientSnapshots(
  value: Record<string, unknown> | unknown,
): DeletedClientSnapshot[] {
  return Array.isArray(value) ? (value as DeletedClientSnapshot[]) : [];
}

export function buildDeletedClientRestoreData(
  userId: string,
  snapshots: DeletedClientSnapshot[],
) {
  const clients: Prisma.ClientCreateManyInput[] = snapshots.map((snapshot) => ({
    id: snapshot.id,
    userId,
    name: snapshot.name,
    phone: snapshot.phone,
    notes: snapshot.notes,
    createdAt: new Date(snapshot.createdAt),
    disciplineScore: snapshot.disciplineScore,
    dailyPenalty: snapshot.dailyPenalty,
    daysOverdue: snapshot.daysOverdue,
    healthStatus: snapshot.healthStatus,
  }));

  const clientSubscriptions: Prisma.ClientSubscriptionCreateManyInput[] = snapshots.flatMap(
    (snapshot) =>
      snapshot.clientSubscriptions.map((clientSubscription) => ({
        id: clientSubscription.id,
        clientId: clientSubscription.clientId,
        subscriptionId: clientSubscription.subscriptionId,
        customPrice: clientSubscription.customPrice ?? "0",
        activeUntil: new Date(clientSubscription.activeUntil),
        joinedAt: new Date(clientSubscription.joinedAt),
        leftAt: clientSubscription.leftAt ? new Date(clientSubscription.leftAt) : null,
        status: clientSubscription.status,
        remainingDays: clientSubscription.remainingDays,
        serviceUser: clientSubscription.serviceUser,
        servicePassword: clientSubscription.servicePassword,
      })),
  );

  const renewalLogs = snapshots.flatMap((snapshot) =>
    snapshot.clientSubscriptions.flatMap((clientSubscription) =>
      clientSubscription.renewalLogs.map((renewalLog) => ({
        id: renewalLog.id,
        clientSubscriptionId: clientSubscription.id,
        amountPaid: renewalLog.amountPaid ?? "0",
        expectedAmount: renewalLog.expectedAmount ?? "0",
        periodStart: new Date(renewalLog.periodStart),
        periodEnd: new Date(renewalLog.periodEnd),
        paidOn: new Date(renewalLog.paidOn),
        dueOn: new Date(renewalLog.dueOn),
        monthsRenewed: renewalLog.monthsRenewed,
        notes: renewalLog.notes,
        createdAt: new Date(renewalLog.createdAt),
      })),
    ),
  );

  const subscriptionOwners = snapshots
    .filter((snapshot) => snapshot.ownedSubscriptionIds.length > 0)
    .map((snapshot) => ({
      clientId: snapshot.id,
      subscriptionIds: snapshot.ownedSubscriptionIds,
    }));

  return {
    clients,
    clientSubscriptions,
    renewalLogs,
    subscriptionOwners,
  };
}

function decimalToString(value: DecimalLike): string | null {
  if (value === null) {
    return null;
  }

  if (typeof value === "number" || typeof value === "string") {
    return String(value);
  }

  return value.toString();
}
