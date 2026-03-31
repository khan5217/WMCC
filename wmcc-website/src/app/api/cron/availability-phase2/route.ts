import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendAvailabilityRequest } from '@/lib/email'
import { sendAvailabilitySMS } from '@/lib/twilio'
import crypto from 'crypto'
import { format } from 'date-fns'

export const dynamic = 'force-dynamic'

const SQUAD_SIZE = 11
const DAYS_BEFORE_MATCH = 3

// Cron: runs daily at 08:00 UTC.
// For each upcoming match within DAYS_BEFORE_MATCH days, if confirmed paid-member
// availability is below SQUAD_SIZE and non-members have not yet been invited,
// sends Phase 2 availability requests to all active non-member players.
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() + DAYS_BEFORE_MATCH)

  // Find match events in the next DAYS_BEFORE_MATCH days that haven't passed
  const upcomingEvents = await prisma.matchEvent.findMany({
    where: { date: { gte: now, lte: cutoff } },
    select: { id: true, name: true, date: true, venue: true },
  })

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://wmccmk.co.uk'

  let totalEmailsSent = 0
  let totalSmsSent = 0
  let eventsTriggered = 0

  for (const event of upcomingEvents) {
    // Count confirmed paid members for this event
    const availableMembers = await prisma.availabilityRequest.count({
      where: {
        eventId: event.id,
        status: 'AVAILABLE',
        player: { user: { membershipStatus: 'ACTIVE' } },
      },
    })

    if (availableMembers >= SQUAD_SIZE) continue

    // Find non-member players who haven't been invited yet
    const allNonMembers = await prisma.player.findMany({
      where: { isActive: true, user: { membershipStatus: { not: 'ACTIVE' } } },
      include: { user: { select: { email: true, phone: true, firstName: true } } },
    })

    const uninvited = []
    for (const player of allNonMembers) {
      const existing = await prisma.availabilityRequest.findUnique({
        where: { eventId_playerId: { eventId: event.id, playerId: player.id } },
      })
      if (!existing) uninvited.push(player)
    }

    if (uninvited.length === 0) continue

    eventsTriggered++
    const matchDate = format(event.date, 'EEEE d MMMM yyyy')

    for (const player of uninvited) {
      const token = crypto.randomBytes(32).toString('hex')
      await prisma.availabilityRequest.create({
        data: { eventId: event.id, playerId: player.id, token },
      })

      const emailOk = await sendAvailabilityRequest({
        to: player.user.email,
        firstName: player.user.firstName,
        matchDate,
        opposition: event.name,
        venue: event.venue,
        token,
      })
      if (emailOk) {
        totalEmailsSent++
        await prisma.availabilityRequest.update({
          where: { token },
          data: { emailSentAt: new Date() },
        })
      }

      const phone = player.user.phone ?? player.contactPhone
      if (phone) {
        const smsOk = await sendAvailabilitySMS({
          phone,
          firstName: player.user.firstName,
          matchDate,
          opposition: event.name,
          token,
        })
        if (smsOk.success) {
          totalSmsSent++
          await prisma.availabilityRequest.update({
            where: { token },
            data: { smsSentAt: new Date() },
          })
        }
      }
    }
  }

  return NextResponse.json({ eventsTriggered, emailsSent: totalEmailsSent, smsSent: totalSmsSent })
}
