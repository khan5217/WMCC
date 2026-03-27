import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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
      player: { include: { user: { select: { firstName: true } } } },
    },
  })

  if (!request) {
    return NextResponse.json({ error: 'Invalid or expired link' }, { status: 404 })
  }

  // Token expires at match time
  if (request.match.date < new Date()) {
    return NextResponse.json({ error: 'This match has already passed' }, { status: 410 })
  }

  await prisma.availabilityRequest.update({
    where: { token },
    data: {
      status: status as 'AVAILABLE' | 'UNAVAILABLE' | 'MAYBE',
      respondedAt: new Date(),
    },
  })

  // Redirect to the confirmation page
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://wmccmk.com'
  const url  = new URL('/availability/respond', base)
  url.searchParams.set('token', token)
  url.searchParams.set('status', status)
  url.searchParams.set('confirmed', '1')

  return NextResponse.redirect(url)
}
