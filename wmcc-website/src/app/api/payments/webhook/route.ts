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

  // One-time payment OR subscription checkout completed
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const { userId, membershipTier, season } = session.metadata!
    const expiryDate = new Date(`${parseInt(season) + 1}-03-31`)

    // For subscriptions, store the subscription ID in stripePaymentId for later invoice lookups
    const paymentRef = session.mode === 'subscription'
      ? (session.subscription as string)
      : (session.payment_intent as string | null)

    await prisma.membership.updateMany({
      where: { stripeSessionId: session.id },
      data: { status: 'PAID', stripePaymentId: paymentRef, paidAt: new Date() },
    })

    await prisma.user.update({
      where: { id: userId },
      data: { membershipStatus: 'ACTIVE', membershipTier: membershipTier as any, membershipExpiry: expiryDate },
    })
  }

  // Monthly subscription invoice paid — keep membership active with rolling expiry
  if (event.type === 'invoice.paid') {
    const invoice = event.data.object as Stripe.Invoice
    const subscriptionId = invoice.subscription as string | null
    if (subscriptionId) {
      const membership = await prisma.membership.findFirst({ where: { stripePaymentId: subscriptionId } })
      if (membership) {
        const newExpiry = new Date()
        newExpiry.setMonth(newExpiry.getMonth() + 1)
        await prisma.user.update({
          where: { id: membership.userId },
          data: { membershipStatus: 'ACTIVE', membershipExpiry: newExpiry },
        })
      }
    }
  }

  // Subscription cancelled
  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object as Stripe.Subscription
    const membership = await prisma.membership.findFirst({ where: { stripePaymentId: subscription.id } })
    if (membership) {
      await prisma.user.update({ where: { id: membership.userId }, data: { membershipStatus: 'EXPIRED' } })
    }
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
