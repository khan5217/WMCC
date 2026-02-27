import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-04-10',
})

export const MEMBERSHIP_PRICES: Record<string, { label: string; amount: number; description: string }> = {
  PLAYING_SENIOR: {
    label: 'Senior Playing Member',
    amount: 8000, // £80.00
    description: 'Full playing membership for senior players (18+)',
  },
  PLAYING_JUNIOR: {
    label: 'Junior Playing Member',
    amount: 4000, // £40.00
    description: 'Playing membership for junior players (under 18)',
  },
  SOCIAL: {
    label: 'Social Member',
    amount: 2500, // £25.00
    description: 'Support the club without playing',
  },
  FAMILY: {
    label: 'Family Membership',
    amount: 15000, // £150.00
    description: 'Full family membership for up to 4 members',
  },
  LIFE: {
    label: 'Life Member',
    amount: 50000, // £500.00
    description: 'Lifetime club membership',
  },
}

export async function createCheckoutSession(
  userId: string,
  membershipTier: string,
  successUrl: string,
  cancelUrl: string
): Promise<Stripe.Checkout.Session> {
  const price = MEMBERSHIP_PRICES[membershipTier]
  if (!price) throw new Error('Invalid membership tier')

  return stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'gbp',
          product_data: {
            name: `WMCC ${price.label}`,
            description: price.description,
            images: [],
          },
          unit_amount: price.amount,
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      userId,
      membershipTier,
      season: new Date().getFullYear().toString(),
    },
    customer_email: undefined, // set by user data lookup in route
  })
}
