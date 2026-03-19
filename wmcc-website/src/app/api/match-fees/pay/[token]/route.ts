import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { stripe } from '@/lib/stripe'

export async function GET(req: NextRequest, { params }: { params: { token: string } }) {
  const assignment = await prisma.matchFeeAssignment.findUnique({
    where: { paymentToken: params.token },
    include: {
      match: { select: { opposition: true, date: true, venue: true } },
      player: {
        include: {
          user: { select: { firstName: true, lastName: true, email: true } },
        },
      },
    },
  })

  if (!assignment) return NextResponse.json({ error: 'Invalid payment link' }, { status: 404 })
  if (assignment.status === 'PAID') return NextResponse.json({ error: 'Already paid', status: 'PAID' }, { status: 200 })
  if (assignment.status === 'WAIVED') return NextResponse.json({ error: 'Fee waived', status: 'WAIVED' }, { status: 200 })

  const isGuestEmail = assignment.player.user.email?.includes('@wmcc.internal')
  const email = isGuestEmail ? assignment.player.contactEmail : assignment.player.user.email

  return NextResponse.json({
    id: assignment.id,
    amount: assignment.amount,
    playerType: assignment.playerType,
    status: assignment.status,
    match: assignment.match,
    playerName: `${assignment.player.user.firstName} ${assignment.player.user.lastName}`,
    email,
  })
}

export async function POST(req: NextRequest, { params }: { params: { token: string } }) {
  const assignment = await prisma.matchFeeAssignment.findUnique({
    where: { paymentToken: params.token },
    include: {
      match: { select: { opposition: true, date: true } },
      player: {
        include: {
          user: { select: { firstName: true, lastName: true, email: true } },
        },
      },
    },
  })

  if (!assignment) return NextResponse.json({ error: 'Invalid payment link' }, { status: 404 })
  if (assignment.status === 'PAID') return NextResponse.json({ error: 'Already paid' }, { status: 400 })

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://wmccmk.co.uk'
  const isGuestEmail = assignment.player.user.email?.includes('@wmcc.internal')
  const email = isGuestEmail ? assignment.player.contactEmail : assignment.player.user.email

  const matchDesc = `vs ${assignment.match.opposition} — ${new Date(assignment.match.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    customer_email: email ?? undefined,
    line_items: [
      {
        price_data: {
          currency: 'gbp',
          product_data: {
            name: `WMCC Match Fee — ${matchDesc}`,
            description: `${assignment.playerType === 'STARTER' ? 'Starter' : 'Substitute'} fee`,
          },
          unit_amount: assignment.amount,
        },
        quantity: 1,
      },
    ],
    metadata: {
      type: 'match_fee',
      assignmentId: assignment.id,
      token: params.token,
    },
    success_url: `${baseUrl}/match-fees/pay/${params.token}?success=1`,
    cancel_url: `${baseUrl}/match-fees/pay/${params.token}?cancelled=1`,
  })

  return NextResponse.json({ url: session.url })
}
