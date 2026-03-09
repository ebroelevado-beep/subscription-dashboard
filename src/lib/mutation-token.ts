/**
 * Mutation Token System — Cryptographic gating for AI-driven database mutations.
 *
 * Flow:
 *   1. AI tool proposes a mutation → createMutationToken() generates a token + audit row
 *   2. User clicks "Accept" → frontend POSTs the token to /api/mutations/execute
 *   3. validateAndConsumeMutationToken() verifies token, returns stored payload
 *   4. The execute endpoint applies the mutation inside a $transaction
 */

import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";

const TOKEN_TTL_MINUTES = 5;

export interface MutationPayload {
  toolName: string;
  targetId?: string;
  action: "create" | "update" | "delete";
  changes: Record<string, unknown>;
  previousValues: Record<string, unknown> | null;
  /** Extra context needed for execution (e.g. clientSubscriptionId for logPayment) */
  executionContext?: Record<string, unknown>;
}

/**
 * Generate a crypto token and store a pending mutation in the audit log.
 * Returns the token and audit log ID so the frontend can reference them.
 */
export async function createMutationToken(
  userId: string,
  payload: MutationPayload
): Promise<{ token: string; auditLogId: string }> {
  const token = randomBytes(32).toString("hex"); // 64-char hex string
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MINUTES * 60 * 1000);

  const auditLog = await prisma.mutationAuditLog.create({
    data: {
      userId,
      toolName: payload.toolName,
      targetId: payload.targetId ?? null,
      action: payload.action,
      previousValues: (payload.previousValues ?? undefined) as any,
      // newValues is set AFTER execution
      token,
      expiresAt,
    },
  });

  return { token, auditLogId: auditLog.id };
}

/**
 * Validate a mutation token:
 *   - Exists and belongs to the user
 *   - Has not been consumed (executedAt is null)
 *   - Has not expired
 *
 * On success, marks the token as consumed (sets executedAt) and returns the audit log row.
 * On failure, throws an Error with a human-readable message.
 */
export async function validateAndConsumeMutationToken(
  token: string,
  userId: string
) {
  const auditLog = await prisma.mutationAuditLog.findUnique({
    where: { token },
  });

  if (!auditLog) {
    throw new Error("Token inválido o no encontrado.");
  }

  if (auditLog.userId !== userId) {
    throw new Error("Token no pertenece a este usuario.");
  }

  if (auditLog.executedAt) {
    throw new Error("Este cambio ya fue ejecutado.");
  }

  if (new Date() > auditLog.expiresAt) {
    throw new Error("El token ha expirado. Propón el cambio de nuevo.");
  }

  // Mark as consumed
  await prisma.mutationAuditLog.update({
    where: { id: auditLog.id },
    data: { executedAt: new Date() },
  });

  return auditLog;
}

/**
 * Mark an audit log entry as undone.
 */
export async function markAuditLogUndone(auditLogId: string) {
  await prisma.mutationAuditLog.update({
    where: { id: auditLogId },
    data: { undone: true, undoneAt: new Date() },
  });
}

/**
 * Store the newValues snapshot after a mutation has been executed.
 */
export async function setAuditLogNewValues(
  auditLogId: string,
  newValues: Record<string, unknown>
) {
  await prisma.mutationAuditLog.update({
    where: { id: auditLogId },
    data: { newValues: newValues as any },
  });
}
