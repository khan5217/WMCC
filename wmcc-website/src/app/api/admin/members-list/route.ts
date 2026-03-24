import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  return withAuth(req, async (ctx) => {
    if (ctx.role !== 'ADMIN' && ctx.role !== 'COMMITTEE') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    const users = await prisma.user.findMany({
      orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
      select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true, role: true },
    })
    return NextResponse.json(users)
  })
}
