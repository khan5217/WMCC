import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/api-auth'

export async function GET(req: NextRequest) {
  return withAuth(req, async (ctx) => {
    if (ctx.role !== 'ADMIN' && ctx.role !== 'COMMITTEE') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = req.nextUrl
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
    const limit = 50
    const entity = searchParams.get('entity') ?? undefined
    const actorId = searchParams.get('actorId') ?? undefined

    const where = {
      ...(entity ? { entity } : {}),
      ...(actorId ? { actorId } : {}),
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          actor: { select: { firstName: true, lastName: true, email: true } },
        },
      }),
      prisma.auditLog.count({ where }),
    ])

    return NextResponse.json({ logs, total, page, pages: Math.ceil(total / limit) })
  })
}
