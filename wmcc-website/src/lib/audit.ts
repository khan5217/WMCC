import { Prisma } from '@prisma/client'
import { prisma } from './prisma'

export async function logAudit(params: {
  actorId?: string
  action: string
  entity: string
  entityId?: string
  details?: Record<string, unknown>
  ipAddress?: string
}) {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: params.actorId ?? null,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId ?? null,
        details: (params.details as Prisma.InputJsonValue | undefined) ?? Prisma.DbNull,
        ipAddress: params.ipAddress ?? null,
      },
    })
  } catch (err) {
    // Audit log failure must never break the main operation
    console.error('Audit log write failed:', err)
  }
}
