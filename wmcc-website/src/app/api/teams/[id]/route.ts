import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

function getAuth(req: NextRequest) {
  const token = req.cookies.get('wmcc_session')?.value
  return token ? verifyToken(token) : null
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const payload = getAuth(req)
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const team = await prisma.team.findUnique({
    where: { id: params.id },
    include: {
      players: {
        include: {
          user: { select: { firstName: true, lastName: true, email: true } },
        },
        orderBy: [{ user: { firstName: 'asc' } }],
      },
    },
  })

  if (!team) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(team)
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const payload = getAuth(req)
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = await prisma.user.findUnique({ where: { id: payload.userId } })
  if (!admin || (admin.role !== 'ADMIN' && admin.role !== 'COMMITTEE')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await prisma.team.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
