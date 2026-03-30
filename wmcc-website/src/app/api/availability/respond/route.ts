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
      event: true,
      player: true,
    },
  })

  if (!request) {
    return NextResponse.json({ error: 'Invalid or expired link' }, { status: 404 })
  }

  // Token expires at event date
  if (request.event.date < new Date()) {
    return NextResponse.json({ error: 'This event has already passed' }, { status: 410 })
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
      where: { eventId_playerId: { eventId: request.eventId, playerId: request.playerId } },
    })

    if (!existing) {
      const season = request.event.date.getFullYear()
      const feeProduct = await prisma.matchFeeProduct.findFirst({
        where: { season, isActive: true },
        orderBy: { createdAt: 'desc' },
      })

      await prisma.matchFeeAssignment.create({
        data: {
          eventId: request.eventId,
          playerId: request.playerId,
          feeProductId: feeProduct?.id ?? null,
          playerType: 'STARTER',
          amount: feeProduct?.starterAmount ?? 0,
          paymentToken: randomBytes(20).toString('hex'),
        },
      })
    }
  }

  // If player changed FROM available — remove their fee assignment if still unpaid
  if (status !== 'AVAILABLE' && previousStatus === 'AVAILABLE') {
    const assignment = await prisma.matchFeeAssignment.findUnique({
      where: { eventId_playerId: { eventId: request.eventId, playerId: request.playerId } },
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
