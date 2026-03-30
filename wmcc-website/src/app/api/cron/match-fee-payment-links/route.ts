import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendMatchFeePaymentLink } from '@/lib/email'

export const dynamic = 'force-dynamic'

function fmt(pence: number) {
  return `£${(pence / 100).toFixed(2)}`
}

// Cron: runs at 08:00 UTC every day.
// Sends payment links to all players with a PENDING fee assignment for
// any match event happening today that has not yet had a link sent.
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  const dayStart = new Date(now)
  dayStart.setUTCHours(0, 0, 0, 0)
  const dayEnd = new Date(now)
  dayEnd.setUTCHours(23, 59, 59, 999)

  // Find all match events occurring today
  const events = await prisma.matchEvent.findMany({
    where: { date: { gte: dayStart, lte: dayEnd } },
    select: { id: true, name: true, date: true },
  })

  if (events.length === 0) {
    return NextResponse.json({ sent: 0, failed: 0, skipped: 0 })
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://wmccmk.co.uk'

  let sent = 0
  let failed = 0
  let skipped = 0

  for (const event of events) {
    const eventDesc = `${event.name} — ${new Date(event.date).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })}`

    // Only assignments that are PENDING and haven't had a payment link sent yet
    const assignments = await prisma.matchFeeAssignment.findMany({
      where: {
        eventId: event.id,
        status: 'PENDING',
        paymentLinkSentAt: null,
      },
      include: {
        player: {
          include: {
            user: { select: { firstName: true, email: true } },
          },
        },
      },
    })

    for (const a of assignments) {
      const isGuestEmail = a.player.user.email?.includes('@wmcc.internal')
      const email = isGuestEmail ? a.player.contactEmail : a.player.user.email
      const firstName = a.player.user.firstName

      if (!email || !a.paymentToken) { skipped++; continue }

      const payLink = `${baseUrl}/match-fees/pay/${a.paymentToken}`
      const ok = await sendMatchFeePaymentLink(email, firstName, eventDesc, fmt(a.amount), payLink)

      if (ok) {
        await prisma.matchFeeAssignment.update({
          where: { id: a.id },
          data: { paymentLinkSentAt: new Date(), status: 'OUTSTANDING' },
        })
        sent++
      } else {
        failed++
      }
    }
  }

  return NextResponse.json({ sent, failed, skipped })
}
