import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { randomBytes } from 'crypto'

// GET /api/availability/respond?token=xxx&status=AVAILABLE
// Public — no auth. Called when player clicks a button in their email/SMS.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const token  = searchParams.get('token')
  const status = searchParams.get('status')

  if (!token || !status) {
    return NextResponse.json({ error: 'Missing token or status' }, { status: 400 })
  }

  const validStatuses = ['AVAILABLE', 'UNAVAILABLE', 'MAYBE']
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  const request = await prisma.availabilityRequest.findUnique({
    where: { token },
    include: {
      match: true,
      player: true,
    },
  })

  if (!request) {
    return NextResponse.json({ error: 'Invalid or expired link' }, { status: 404 })
  }

  // Token expires at match time
  if (request.match.date < new Date()) {
    return NextResponse.json({ error: 'This match has already passed' }, { status: 410 })
  }

  const previousStatus = request.status

  await prisma.availabilityRequest.update({
    where: { token },
    data: {
      status: status as 'AVAILABLE' | 'UNAVAILABLE' | 'MAYBE',
      respondedAt: new Date(),
    },
  })

  // Auto-assign match fee when player marks themselves Available
  if (status === 'AVAILABLE') {
    const existing = await prisma.matchFeeAssignment.findUnique({
      where: { matchId_playerId: { matchId: request.matchId, playerId: request.playerId } },
    })

    if (!existing) {
      const season = request.match.date.getFullYear()
      const feeProduct = await prisma.matchFeeProduct.findFirst({
        where: { season, isActive: true },
        orderBy: { createdAt: 'desc' },
      })

      // PER_DAY: check if player already has a fee for any other match on the same day
      let alreadyChargedForDay = false
      if (feeProduct?.billingPeriod === 'PER_DAY') {
        const matchDate = request.match.date
        const dayStart  = new Date(matchDate)
        dayStart.setHours(0, 0, 0, 0)
        const dayEnd = new Date(matchDate)
        dayEnd.setHours(23, 59, 59, 999)

        const sameDayFee = await prisma.matchFeeAssignment.findFirst({
          where: {
            playerId: request.playerId,
            status: { not: 'WAIVED' },
            match: { date: { gte: dayStart, lte: dayEnd } },
          },
        })
        if (sameDayFee) alreadyChargedForDay = true
      }

      if (!alreadyChargedForDay) {
        await prisma.matchFeeAssignment.create({
          data: {
            matchId: request.matchId,
            playerId: request.playerId,
            feeProductId: feeProduct?.id ?? null,
            playerType: 'STARTER',
            amount: feeProduct?.starterAmount ?? 0,
            paymentToken: randomBytes(20).toString('hex'),
            notes: feeProduct?.billingPeriod === 'PER_DAY' ? 'Day rate — charged once per day' : null,
          },
        })
      }
    }
  }

  // If player changed FROM available to unavailable/maybe — remove their fee assignment
  // only if it hasn't been paid yet (only remove if it's the fee tied to THIS match)
  if (status !== 'AVAILABLE' && previousStatus === 'AVAILABLE') {
    const assignment = await prisma.matchFeeAssignment.findUnique({
      where: { matchId_playerId: { matchId: request.matchId, playerId: request.playerId } },
    })
    if (assignment && assignment.status === 'PENDING') {
      await prisma.matchFeeAssignment.delete({ where: { id: assignment.id } })
    }
  }

  // Redirect to the confirmation page
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://wmccmk.com'
  const url  = new URL('/availability/respond', base)
  url.searchParams.set('token', token)
  url.searchParams.set('status', status)
  url.searchParams.set('confirmed', '1')

  return NextResponse.redirect(url)
}
