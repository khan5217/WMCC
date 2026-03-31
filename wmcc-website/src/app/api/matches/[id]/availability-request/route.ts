import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/api-auth'
import { sendAvailabilityRequest } from '@/lib/email'
import { sendAvailabilitySMS } from '@/lib/twilio'
import crypto from 'crypto'
import { format } from 'date-fns'

interface Ctx { params: { id: string } }

const SQUAD_SIZE = 11

function isPaidMember(membershipStatus: string) {
  return membershipStatus === 'ACTIVE'
}

async function sendToPlayers(
  players: Array<{
    id: string
    contactPhone: string | null
    user: { email: string; phone: string | null; firstName: string; lastName: string }
  }>,
  eventId: string,
  matchDate: string,
  eventDesc: string,
  venue: string,
) {
  let emailsSent = 0
  let smsSent = 0
  let created = 0

  for (const player of players) {
    const existing = await prisma.availabilityRequest.findUnique({
      where: { eventId_playerId: { eventId, playerId: player.id } },
    })

    let token: string
    if (existing) {
      token = existing.token
    } else {
      token = crypto.randomBytes(32).toString('hex')
      await prisma.availabilityRequest.create({
        data: { eventId, playerId: player.id, token },
      })
      created++
    }

    const emailOk = await sendAvailabilityRequest({
      to: player.user.email,
      firstName: player.user.firstName,
      matchDate,
      opposition: eventDesc,
      venue,
      token,
    })
    if (emailOk) {
      emailsSent++
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

  return { created, emailsSent, smsSent }
}

// POST — Phase 1: send availability requests to paid members only
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

    const members = await prisma.player.findMany({
      where: { isActive: true, user: { membershipStatus: 'ACTIVE' } },
      include: { user: { select: { email: true, phone: true, firstName: true, lastName: true, membershipStatus: true } } },
    })

    const matchDate = format(match.event.date, 'EEEE d MMMM yyyy')
    const result = await sendToPlayers(members, match.eventId, matchDate, match.event.name, match.event.venue)

    return NextResponse.json({ ...result, total: members.length })
  })
}

// PUT — Phase 2: send availability requests to non-members (only when members < SQUAD_SIZE)
export async function PUT(req: NextRequest, { params }: Ctx) {
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
      return NextResponse.json({ error: 'Cannot send availability for a past event' }, { status: 400 })
    }

    // Count confirmed (AVAILABLE) paid members for this event
    const availableMembers = await prisma.availabilityRequest.count({
      where: {
        eventId: match.eventId,
        status: 'AVAILABLE',
        player: { user: { membershipStatus: 'ACTIVE' } },
      },
    })

    if (availableMembers >= SQUAD_SIZE) {
      return NextResponse.json(
        { error: `Already have ${availableMembers} members available — non-members not needed` },
        { status: 409 },
      )
    }

    const nonMembers = await prisma.player.findMany({
      where: { isActive: true, user: { membershipStatus: { not: 'ACTIVE' } } },
      include: { user: { select: { email: true, phone: true, firstName: true, lastName: true, membershipStatus: true } } },
    })

    const matchDate = format(match.event.date, 'EEEE d MMMM yyyy')
    const result = await sendToPlayers(nonMembers, match.eventId, matchDate, match.event.name, match.event.venue)

    return NextResponse.json({ ...result, total: nonMembers.length, availableMembers })
  })
}

// PATCH — send reminders to players who haven't responded (email preferred, SMS fallback)
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
          include: { user: { select: { firstName: true, email: true, phone: true } } },
        },
      },
    })

    const matchDate = format(match.event.date, 'EEEE d MMMM yyyy')
    let emailsSent = 0
    let smsSent = 0

    for (const r of pending) {
      const email = r.player.user.email
      const phone = r.player.user.phone ?? r.player.contactPhone

      // Prefer email — only fall back to SMS if no email address
      if (email) {
        const emailOk = await sendAvailabilityRequest({
          to: email,
          firstName: r.player.user.firstName,
          matchDate,
          opposition: match.event.name,
          venue: match.event.venue,
          token: r.token,
        })
        if (emailOk) {
          emailsSent++
          await prisma.availabilityRequest.update({
            where: { id: r.id },
            data: { emailReminderSentAt: new Date() },
          })
          continue
        }
      }

      if (!phone) continue
      const smsOk = await sendAvailabilitySMS({
        phone,
        firstName: r.player.user.firstName,
        matchDate,
        opposition: match.event.name,
        token: r.token,
        isReminder: true,
      })
      if (smsOk.success) {
        smsSent++
        await prisma.availabilityRequest.update({
          where: { id: r.id },
          data: { smsReminderSentAt: new Date() },
        })
      }
    }

    return NextResponse.json({ emailsSent, smsSent, pendingCount: pending.length })
  })
}
