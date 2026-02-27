import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'
import { z } from 'zod'

const createSchema = z.object({
  userId: z.string(),
  jerseyNumber: z.number().int().positive().nullable().optional(),
  role: z.enum(['BATSMAN', 'BOWLER', 'ALL_ROUNDER', 'WICKET_KEEPER', 'WICKET_KEEPER_BATSMAN']),
  battingStyle: z.enum(['RIGHT_HAND', 'LEFT_HAND']),
  bowlingStyle: z.enum(['RIGHT_ARM_FAST', 'RIGHT_ARM_MEDIUM', 'RIGHT_ARM_SPIN_OFF', 'RIGHT_ARM_SPIN_LEG', 'LEFT_ARM_FAST', 'LEFT_ARM_MEDIUM', 'LEFT_ARM_SPIN', 'DOES_NOT_BOWL']),
  bio: z.string().nullable().optional(),
  dateOfBirth: z.string().nullable().optional(),
  nationality: z.string().nullable().optional(),
})

function getAuth(req: NextRequest) {
  const token = req.cookies.get('wmcc_session')?.value
  return token ? verifyToken(token) : null
}

// Returns users who don't have a player profile yet
export async function GET(req: NextRequest) {
  const payload = getAuth(req)
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const users = await prisma.user.findMany({
    where: { player: null },
    select: { id: true, firstName: true, lastName: true, email: true },
    orderBy: { firstName: 'asc' },
  })

  return NextResponse.json(users)
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

    const player = await prisma.player.create({
      data: {
        userId: data.userId,
        jerseyNumber: data.jerseyNumber ?? null,
        role: data.role,
        battingStyle: data.battingStyle,
        bowlingStyle: data.bowlingStyle,
        bio: data.bio ?? null,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
        nationality: data.nationality ?? null,
      },
    })

    return NextResponse.json(player, { status: 201 })
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    }
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'This user already has a player profile' }, { status: 409 })
    }
    console.error('Create player error:', error)
    return NextResponse.json({ error: 'Failed to create player' }, { status: 500 })
  }
}
