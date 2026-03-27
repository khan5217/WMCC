import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/api-auth'
import { sendAvailabilityRequest } from '@/lib/email'
import { sendAvailabilitySMS } from '@/lib/twilio'
import crypto from 'crypto'
import { format } from 'date-fns'

interface Ctx { params: { id: string } }

// POST — admin sends availability requests to all active players
export async function POST(req: NextRequest, { params }: Ctx) {
  return withAuth(req, async (ctx) => {
    if (ctx.role !== 'ADMIN' && ctx.role !== 'COMMITTEE') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const match = await prisma.match.findUnique({
      where: { id: params.id },
      include: { team: true },
    })
    if (!match) return NextResponse.json({ error: 'Match not found' }, { status: 404 })

    if (match.date < new Date()) {
      return NextResponse.json({ error: 'Cannot send availability for a past match' }, { status: 400 })
    }

    // Get all active players with user contact info
    const players = await prisma.player.findMany({
      where: { isActive: true },
      include: { user: { select: { email: true, phone: true, firstName: true, lastName: true } } },
    })

    const matchDate = format(match.date, 'EEEE d MMMM yyyy, h:mm a')

    let emailsSent = 0
    let smsSent = 0
    let created = 0

    for (const player of players) {
      // Upsert — if already exists keep existing token so links still work
      const existing = await prisma.availabilityRequest.findUnique({
        where: { matchId_playerId: { matchId: match.id, playerId: player.id } },
      })

      let token: string
      if (existing) {
        token = existing.token
      } else {
        token = crypto.randomBytes(32).toString('hex')
        await prisma.availabilityRequest.create({
          data: { matchId: match.id, playerId: player.id, token },
        })
        created++
      }

      const emailOk = await sendAvailabilityRequest({
        to: player.user.email,
        firstName: player.user.firstName,
        matchDate,
        opposition: match.opposition,
        venue: match.venue,
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
          opposition: match.opposition,
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

// POST remind — send SMS reminder to players who haven't responded
export async function PATCH(req: NextRequest, { params }: Ctx) {
  return withAuth(req, async (ctx) => {
    if (ctx.role !== 'ADMIN' && ctx.role !== 'COMMITTEE') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const match = await prisma.match.findUnique({ where: { id: params.id } })
    if (!match) return NextResponse.json({ error: 'Match not found' }, { status: 404 })
    if (match.date < new Date()) {
      return NextResponse.json({ error: 'Match has already passed' }, { status: 400 })
    }

    const pending = await prisma.availabilityRequest.findMany({
      where: { matchId: params.id, status: 'PENDING' },
      include: {
        player: {
          include: { user: { select: { firstName: true, phone: true } } },
        },
      },
    })

    const matchDate = format(match.date, 'EEEE d MMMM yyyy, h:mm a')
    let smsSent = 0

    for (const req of pending) {
      const phone = req.player.user.phone ?? req.player.contactPhone
      if (!phone) continue
      const ok = await sendAvailabilitySMS({
        phone,
        firstName: req.player.user.firstName,
        matchDate,
        opposition: match.opposition,
        token: req.token,
        isReminder: true,
      })
      if (ok.success) {
        smsSent++
        await prisma.availabilityRequest.update({
          where: { id: req.id },
          data: { smsReminderSentAt: new Date() },
        })
      }
    }

    return NextResponse.json({ smsSent, pendingCount: pending.length })
  })
}
