import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

function getAuth(req: NextRequest) {
  const token = req.cookies.get('wmcc_session')?.value
  return token ? verifyToken(token) : null
}

async function requireAdmin(req: NextRequest) {
  const payload = getAuth(req)
  if (!payload) return null
  const admin = await prisma.user.findUnique({ where: { id: payload.userId } })
  if (!admin || (admin.role !== 'ADMIN' && admin.role !== 'COMMITTEE')) return null
  return payload
}

// POST /api/teams/[id]/players — add a player to a team
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const payload = await requireAdmin(req)
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { playerId } = await req.json()
  if (!playerId) return NextResponse.json({ error: 'playerId required' }, { status: 400 })

  try {
    await prisma.team.update({
      where: { id: params.id },
      data: { players: { connect: { id: playerId } } },
    })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Failed to add player' }, { status: 500 })
  }
}

// DELETE /api/teams/[id]/players — remove a player from a team
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const payload = await requireAdmin(req)
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { playerId } = await req.json()
  if (!playerId) return NextResponse.json({ error: 'playerId required' }, { status: 400 })

  try {
    await prisma.team.update({
      where: { id: params.id },
      data: { players: { disconnect: { id: playerId } } },
    })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Failed to remove player' }, { status: 500 })
  }
}
