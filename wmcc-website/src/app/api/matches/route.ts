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
  // Optional: attach match to an existing MatchEvent (festival day)
  eventId: z.string().nullable().optional(),
  // Optional: custom name for a newly-created event (tournament/festival name)
  eventName: z.string().nullable().optional(),
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

    const matchDate = new Date(data.date)
    const season = matchDate.getFullYear()

    let eventId = data.eventId ?? null

    // If no eventId supplied, auto-create a MatchEvent for this match
    if (!eventId) {
      const event = await prisma.matchEvent.create({
        data: {
          name: data.eventName?.trim() || `vs ${data.opposition}`,
          date: matchDate,
          venue: data.venue,
          teamId: data.teamId,
          season,
        },
      })
      eventId = event.id
    } else {
      // Verify the provided event exists
      const event = await prisma.matchEvent.findUnique({ where: { id: eventId } })
      if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    const match = await prisma.match.create({
      data: {
        teamId: data.teamId,
        eventId,
        opposition: data.opposition,
        venue: data.venue,
        isHome: data.isHome,
        date: matchDate,
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
