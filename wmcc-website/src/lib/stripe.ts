import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-04-10',
})

export type MembershipProduct = {
  tier: string
  label: string
  amount: number
  description: string
  mode: 'payment' | 'subscription'
  interval?: 'month'
  paymentMethods: string[]
}

export const MEMBERSHIP_PRODUCTS: Record<string, MembershipProduct> = {
  PLAYING_SENIOR: {
    tier: 'PLAYING_SENIOR',
    label: 'Annual Playing Membership',
    amount: 4000, // £40.00 one-off
    description: 'Full playing membership for the 2026 season — play in 1st & 2nd XI, nets sessions, voting rights at AGM.',
    mode: 'payment',
    paymentMethods: ['card'],
  },
  SOCIAL: {
    tier: 'SOCIAL',
    label: 'Monthly Supporter',
    amount: 500, // £5.00/month
    description: 'Support WMCC month-by-month — attend all home matches, club events & members-only updates. Cancel anytime.',
    mode: 'subscription',
    interval: 'month',
    paymentMethods: ['card', 'bacs_debit'],
  },
}
