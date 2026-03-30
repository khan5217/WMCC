import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'
import { z } from 'zod'
import { randomBytes } from 'crypto'

function getAuth(req: NextRequest) {
  const token = req.cookies.get('wmcc_session')?.value
  return token ? verifyToken(token) : null
}

async function requireAdmin(req: NextRequest) {
  const payload = getAuth(req)
  if (!payload) return null
  const user = await prisma.user.findUnique({ where: { id: payload.userId } })
  if (!user || (user.role !== 'ADMIN' && user.role !== 'COMMITTEE')) return null
  return user
}

export async function GET(req: NextRequest, { params }: { params: { matchId: string } }) {
  const payload = getAuth(req)
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Resolve match → event
  const match = await prisma.match.findUnique({ where: { id: params.matchId } })
  if (!match) return NextResponse.json({ error: 'Match not found' }, { status: 404 })

  const assignments = await prisma.matchFeeAssignment.findMany({
    where: { eventId: match.eventId },
    include: {
      player: {
        include: {
          user: { select: { firstName: true, lastName: true, email: true, phone: true } },
        },
      },
      feeProduct: { select: { name: true, starterAmount: true, subAmount: true } },
    },
    orderBy: { createdAt: 'asc' },
  })

  return NextResponse.json(assignments)
}

const createSchema = z.object({
  playerId: z.string(),
  feeProductId: z.string().nullable().optional(),
  playerType: z.enum(['STARTER', 'SUB']).default('STARTER'),
  amount: z.number().int().min(0),
  notes: z.string().nullable().optional(),
})

export async function POST(req: NextRequest, { params }: { params: { matchId: string } }) {
  const adminUser = await requireAdmin(req)
  if (!adminUser) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // Resolve match → event
  const match = await prisma.match.findUnique({ where: { id: params.matchId } })
  if (!match) return NextResponse.json({ error: 'Match not found' }, { status: 404 })

  try {
    const body = await req.json()
    const data = createSchema.parse(body)

    const paymentToken = randomBytes(20).toString('hex')

    const assignment = await prisma.matchFeeAssignment.create({
      data: {
        eventId: match.eventId,
        playerId: data.playerId,
        feeProductId: data.feeProductId ?? null,
        playerType: data.playerType,
        amount: data.amount,
        paymentToken,
        notes: data.notes ?? null,
      },
      include: {
        player: {
          include: {
            user: { select: { firstName: true, lastName: true, email: true, phone: true } },
          },
        },
      },
    })

    return NextResponse.json(assignment, { status: 201 })
  } catch (err: any) {
    if (err.name === 'ZodError') return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    if (err.code === 'P2002') return NextResponse.json({ error: 'Player already assigned to this event' }, { status: 409 })
    console.error(err)
    return NextResponse.json({ error: 'Failed to create assignment' }, { status: 500 })
  }
}
