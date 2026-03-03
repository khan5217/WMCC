import { NextRequest, NextResponse } from 'next/server'
import { stripe, MEMBERSHIP_PRODUCTS } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const schema = z.object({
  email: z.string().email(),
  membershipTier: z.enum(['PLAYING_SENIOR', 'SOCIAL']),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, membershipTier } = schema.parse(body)

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const product = MEMBERSHIP_PRODUCTS[membershipTier]
    const season = new Date().getFullYear()
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL!

    const lineItem: any = {
      price_data: {
        currency: 'gbp',
        product_data: {
          name: `WMCC ${product.label} — ${season}`,
          description: product.description,
        },
        unit_amount: product.amount,
        ...(product.mode === 'subscription' ? { recurring: { interval: product.interval } } : {}),
      },
      quantity: 1,
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: product.paymentMethods as any,
      line_items: [lineItem],
      mode: product.mode,
      customer_email: email,
      success_url: `${baseUrl}/membership/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/membership`,
      metadata: {
        userId: user.id,
        membershipTier,
        season: season.toString(),
      },
    })

    // Create pending membership record
    await prisma.membership.create({
      data: {
        userId: user.id,
        tier: membershipTier as any,
        season,
        amount: product.amount,
        currency: 'GBP',
        stripeSessionId: session.id,
        status: 'PENDING',
      },
    })

    return NextResponse.json({ checkoutUrl: session.url })
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    }
    console.error('Checkout error:', error)
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 })
  }
}
