import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/api-auth'
import { sendAvailabilityRequest } from '@/lib/email'
import { sendAvailabilitySMS } from '@/lib/twilio'
import crypto from 'crypto'
import { format } from 'date-fns'

interface Ctx { params: { id: string } }

// POST — admin sends availability requests to all active players for this match's event
export async function POST(req: NextRequest, { params }: Ctx) {
  return withAuth(req, async (ctx) => {
    if (ctx.role !== 'ADMIN' && ctx.role !== 'COMMITTEE') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const match = await prisma.match.findUnique({
      where: { id: params.id },
      include: { team: true, event: true },
    })
    if (!match) return NextResponse.json({ error: 'Match not found' }, { status: 404 })

    if (match.event.date < new Date()) {
      return NextResponse.json({ error: 'Cannot send availability for a past event' }, { status: 400 })
    }

    // Get all active players with user contact info
    const players = await prisma.player.findMany({
      where: { isActive: true },
      include: { user: { select: { email: true, phone: true, firstName: true, lastName: true } } },
    })

    const matchDate = format(match.event.date, 'EEEE d MMMM yyyy')
    const eventDesc = match.event.name

    let emailsSent = 0
    let smsSent = 0
    let created = 0

    for (const player of players) {
      // Upsert — if already exists keep existing token so links still work
      const existing = await prisma.availabilityRequest.findUnique({
        where: { eventId_playerId: { eventId: match.eventId, playerId: player.id } },
      })

      let token: string
      if (existing) {
        token = existing.token
      } else {
        token = crypto.randomBytes(32).toString('hex')
        await prisma.availabilityRequest.create({
          data: { eventId: match.eventId, playerId: player.id, token },
        })
        created++
      }

      const emailOk = await sendAvailabilityRequest({
        to: player.user.email,
        firstName: player.user.firstName,
        matchDate,
        opposition: eventDesc,
        venue: match.event.venue,
        token,
      })
      if (emailOk) {
        emailsSent++
        await prisma.availabilityRequest.update({
          where: { token },
          data: { emailSentAt: new Date() },
        })
      }

      // SMS to player's phone (user phone or contactPhone for guest players)
      const phone = player.user.phone ?? player.contactPhone
      if (phone) {
        const smsOk = await sendAvailabilitySMS({
          phone,
          firstName: player.user.firstName,
          matchDate,
          opposition: eventDesc,
          token,
        })
        if (smsOk.success) {
          smsSent++
          await prisma.availabilityRequest.update({
            where: { token },
            data: { smsSentAt: new Date() },
          })
        }
      }
    }

    return NextResponse.json({ created, emailsSent, smsSent, total: players.length })
  })
}

// PATCH — send SMS reminder to players who haven't responded
export async function PATCH(req: NextRequest, { params }: Ctx) {
  return withAuth(req, async (ctx) => {
    if (ctx.role !== 'ADMIN' && ctx.role !== 'COMMITTEE') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const match = await prisma.match.findUnique({
      where: { id: params.id },
      include: { event: true },
    })
    if (!match) return NextResponse.json({ error: 'Match not found' }, { status: 404 })
    if (match.event.date < new Date()) {
      return NextResponse.json({ error: 'Event has already passed' }, { status: 400 })
    }

    const pending = await prisma.availabilityRequest.findMany({
      where: { eventId: match.eventId, status: 'PENDING' },
      include: {
        player: {
          include: { user: { select: { firstName: true, phone: true } } },
        },
      },
    })

    const matchDate = format(match.event.date, 'EEEE d MMMM yyyy')
    let smsSent = 0

    for (const r of pending) {
      const phone = r.player.user.phone ?? r.player.contactPhone
      if (!phone) continue
      const ok = await sendAvailabilitySMS({
        phone,
        firstName: r.player.user.firstName,
        matchDate,
        opposition: match.event.name,
        token: r.token,
        isReminder: true,
      })
      if (ok.success) {
        smsSent++
        await prisma.availabilityRequest.update({
          where: { id: r.id },
          data: { smsReminderSentAt: new Date() },
        })
      }
    }

    return NextResponse.json({ smsSent, pendingCount: pending.length })
  })
}
