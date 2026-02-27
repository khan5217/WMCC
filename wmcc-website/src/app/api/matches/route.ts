import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'
import { z } from 'zod'

const createSchema = z.object({
  teamId: z.string(),
  opposition: z.string().min(1),
  venue: z.string().min(1),
  isHome: z.boolean().default(true),
  date: z.string(),
  format: z.enum(['T20', 'ONE_DAY', 'TWO_DAY', 'FRIENDLY']),
  result: z.enum(['WIN', 'LOSS', 'DRAW', 'TIE', 'NO_RESULT', 'ABANDONED']).nullable().optional(),
  wmccScore: z.string().nullable().optional(),
  wmccOvers: z.number().nullable().optional(),
  oppositionScore: z.string().nullable().optional(),
  oppositionOvers: z.number().nullable().optional(),
  description: z.string().nullable().optional(),
  leagueName: z.string().nullable().optional(),
  isFeatured: z.boolean().default(false),
})

function getAuth(req: NextRequest) {
  const token = req.cookies.get('wmcc_session')?.value
  return token ? verifyToken(token) : null
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

    const match = await prisma.match.create({
      data: {
        teamId: data.teamId,
        opposition: data.opposition,
        venue: data.venue,
        isHome: data.isHome,
        date: new Date(data.date),
        format: data.format,
        result: data.result ?? null,
        wmccScore: data.wmccScore ?? null,
        wmccOvers: data.wmccOvers ?? null,
        oppositionScore: data.oppositionScore ?? null,
        oppositionOvers: data.oppositionOvers ?? null,
        description: data.description ?? null,
        leagueName: data.leagueName ?? null,
        isFeatured: data.isFeatured,
      },
    })

    return NextResponse.json(match, { status: 201 })
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    }
    console.error('Create match error:', error)
    return NextResponse.json({ error: 'Failed to create match' }, { status: 500 })
  }
}
