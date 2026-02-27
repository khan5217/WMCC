import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import Stripe from 'stripe'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err: any) {
    console.error('Webhook signature error:', err.message)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const { userId, membershipTier, season } = session.metadata!

    // Update membership to paid
    await prisma.membership.updateMany({
      where: { stripeSessionId: session.id },
      data: {
        status: 'PAID',
        stripePaymentId: session.payment_intent as string,
        paidAt: new Date(),
      },
    })

    // Update user membership status
    const expiryDate = new Date(`${parseInt(season) + 1}-03-31`) // Season ends March 31 next year
    await prisma.user.update({
      where: { id: userId },
      data: {
        membershipStatus: 'ACTIVE',
        membershipTier: membershipTier as any,
        membershipExpiry: expiryDate,
      },
    })
  }

  if (event.type === 'payment_intent.payment_failed') {
    const pi = event.data.object as Stripe.PaymentIntent
    await prisma.membership.updateMany({
      where: { stripePaymentId: pi.id },
      data: { status: 'FAILED' },
    })
  }

  return NextResponse.json({ received: true })
}
