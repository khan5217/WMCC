import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'
import { sendMatchFeePaymentLink } from '@/lib/email'

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

function fmt(pence: number) {
  return `£${(pence / 100).toFixed(2)}`
}

export async function POST(req: NextRequest, { params }: { params: { matchId: string } }) {
  const adminUser = await requireAdmin(req)
  if (!adminUser) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const match = await prisma.match.findUnique({
    where: { id: params.matchId },
    select: { opposition: true, date: true, venue: true },
  })
  if (!match) return NextResponse.json({ error: 'Match not found' }, { status: 404 })

  const matchDesc = `vs ${match.opposition} — ${new Date(match.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://wmccmk.co.uk'

  // Get all pending/outstanding assignments that have an email address
  const assignments = await prisma.matchFeeAssignment.findMany({
    where: {
      matchId: params.matchId,
      status: { in: ['PENDING', 'OUTSTANDING'] },
    },
    include: {
      player: {
        include: {
          user: { select: { firstName: true, lastName: true, email: true } },
        },
      },
    },
  })

  let sent = 0
  let failed = 0
  let skipped = 0

  for (const a of assignments) {
    // Resolve contact details: member account takes precedence, fallback to player contact fields
    const isGuestEmail = a.player.user.email?.includes('@wmcc.internal')
    const email = isGuestEmail ? a.player.contactEmail : a.player.user.email
    const firstName = a.player.user.firstName

    if (!email || !a.paymentToken) { skipped++; continue }

    const payLink = `${baseUrl}/match-fees/pay/${a.paymentToken}`
    const ok = await sendMatchFeePaymentLink(email, firstName, matchDesc, fmt(a.amount), payLink)

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

  return NextResponse.json({ sent, failed, skipped })
}
