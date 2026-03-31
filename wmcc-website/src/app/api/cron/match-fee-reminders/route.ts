import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendMatchFeeReminder } from '@/lib/email'

export const dynamic = 'force-dynamic'

const REMINDER_GAP_DAYS = 2
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://wmccmk.co.uk'

function fmt(pence: number) {
  return `£${(pence / 100).toFixed(2)}`
}

// Cron: runs daily at 08:00 UTC.
// Sends a reminder email for every OUTSTANDING match fee assignment that has
// not been contacted in the last REMINDER_GAP_DAYS days.
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - REMINDER_GAP_DAYS)

  // OUTSTANDING assignments where last contact (reminder or initial link) was 2+ days ago
  const assignments = await prisma.matchFeeAssignment.findMany({
    where: {
      status: 'OUTSTANDING',
      AND: [
        {
          OR: [
            { lastReminderAt: null },
            { lastReminderAt: { lte: cutoff } },
          ],
        },
        {
          OR: [
            { paymentLinkSentAt: null },
            { paymentLinkSentAt: { lte: cutoff } },
          ],
        },
      ],
    },
    include: {
      event: { select: { name: true, date: true } },
      player: {
        include: {
          user: { select: { firstName: true, email: true } },
        },
      },
    },
  })

  let sent = 0
  let failed = 0
  let skipped = 0

  for (const a of assignments) {
    const isGuestEmail = a.player.user.email?.includes('@wmcc.internal')
    const email = isGuestEmail ? a.player.contactEmail : a.player.user.email
    const firstName = a.player.user.firstName

    if (!email || !a.paymentToken) { skipped++; continue }

    const eventDesc = `${a.event.name} — ${new Date(a.event.date).toLocaleDateString('en-GB', {
      day: 'numeric', month: 'short', year: 'numeric',
    })}`
    const payLink = `${BASE_URL}/match-fees/pay/${a.paymentToken}`
    const nextCount = a.reminderCount + 1

    const ok = await sendMatchFeeReminder(email, firstName, eventDesc, fmt(a.amount), payLink, nextCount)

    if (ok) {
      await prisma.matchFeeAssignment.update({
        where: { id: a.id },
        data: { reminderCount: nextCount, lastReminderAt: new Date() },
      })
      sent++
    } else {
      failed++
    }
  }

  return NextResponse.json({ sent, failed, skipped })
}
