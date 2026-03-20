import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'
import { z } from 'zod'

const createSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['FIRST_XI', 'SECOND_XI']),
  season: z.number().int(),
  description: z.string().nullable().optional(),
})

function getAuth(req: NextRequest) {
  const token = req.cookies.get('wmcc_session')?.value
  return token ? verifyToken(token) : null
}

export async function GET(req: NextRequest) {
  const payload = getAuth(req)
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const teams = await prisma.team.findMany({
    orderBy: [{ season: 'desc' }, { type: 'asc' }],
  })

  if (teams.length === 0) return NextResponse.json([])

  // _TeamPlayers has A=Team.id, B=Player.id in the actual DB
  const rows = await prisma.$queryRaw<{
    teamId: string
    playerId: string
    jerseyNumber: number | null
    firstName: string
    lastName: string
    email: string
  }[]>`
    SELECT tp."A" as "teamId", p.id as "playerId", p."jerseyNumber",
           u."firstName", u."lastName", u.email
    FROM "_TeamPlayers" tp
    JOIN "Player" p ON p.id = tp."B"
    JOIN "User" u ON u.id = p."userId"
    ORDER BY u."firstName" ASC
  `

  const playersByTeam: Record<string, { id: string; jerseyNumber: number | null; user: { firstName: string; lastName: string; email: string } }[]> = {}
  for (const row of rows) {
    if (!playersByTeam[row.teamId]) playersByTeam[row.teamId] = []
    playersByTeam[row.teamId].push({
      id: row.playerId,
      jerseyNumber: row.jerseyNumber !== null ? Number(row.jerseyNumber) : null,
      user: { firstName: row.firstName, lastName: row.lastName, email: row.email },
    })
  }

  return NextResponse.json(teams.map(t => ({ ...t, players: playersByTeam[t.id] ?? [] })))
}

export async function POST(req: NextRequest) {
  const payload = getAuth(req)
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = await prisma.user.findUnique({ where: { id: payload.userId } })
  if (!admin || (admin.role !== 'ADMIN' && admin.role !== 'COMMITTEE')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const body = await req.json()
    const data = createSchema.parse(body)

    const team = await prisma.team.create({
      data: {
        name: data.name,
        type: data.type,
        season: data.season,
        description: data.description ?? null,
      },
    })

    return NextResponse.json(team, { status: 201 })
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    }
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'A team of that type already exists for this season' }, { status: 409 })
    }
    console.error('Create team error:', error)
    return NextResponse.json({ error: 'Failed to create team' }, { status: 500 })
  }
}
