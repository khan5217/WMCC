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

  // Verify player exists
  const player = await prisma.player.findUnique({ where: { id: playerId } })
  if (!player) return NextResponse.json({ error: 'Player not found' }, { status: 404 })

  // Verify team exists
  const team = await prisma.team.findUnique({ where: { id: params.id } })
  if (!team) return NextResponse.json({ error: 'Team not found' }, { status: 404 })

  try {
    // _TeamPlayers has A=Team.id, B=Player.id in the actual DB
    await prisma.$executeRaw`
      INSERT INTO "_TeamPlayers" ("A", "B") VALUES (${params.id}, ${playerId})
    `
    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error('Add player error:', error)
    const msg = (error.message ?? '') + JSON.stringify(error.meta ?? '')
    if (msg.includes('23505') || msg.includes('unique') || msg.includes('duplicate')) {
      return NextResponse.json({ error: 'Player is already in this team' }, { status: 409 })
    }
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
    // _TeamPlayers has A=Team.id, B=Player.id in the actual DB
    await prisma.$executeRaw`
      DELETE FROM "_TeamPlayers" WHERE "A" = ${params.id} AND "B" = ${playerId}
    `
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Failed to remove player' }, { status: 500 })
  }
}
