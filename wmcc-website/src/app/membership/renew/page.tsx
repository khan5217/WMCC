'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import axios from 'axios'
import toast from 'react-hot-toast'
import { Check, Trophy, Heart, ArrowLeft } from 'lucide-react'

const PLANS = [
  {
    id: 'PLAYING_SENIOR',
    name: 'Annual Playing Membership',
    price: '£40',
    billing: 'one-off payment',
    icon: Trophy,
    features: ['Play in 1st & 2nd XI', 'All nets sessions', 'Voting rights at AGM', 'Club kit discount'],
  },
  {
    id: 'SOCIAL',
    name: 'Monthly Supporter',
    price: '£5',
    billing: 'per month',
    icon: Heart,
    features: ['Attend all home matches', 'Club events & socials', 'Newsletter & match reports'],
  },
]

export default function RenewMembershipPage() {
  const router = useRouter()
  const [user, setUser] = useState<{ email: string; membershipTier: string | null } | null>(null)
  const [selected, setSelected] = useState('PLAYING_SENIOR')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    axios.get('/api/auth/me')
      .then((res) => {
        const u = res.data.user
        setUser(u)
        if (u.membershipTier) setSelected(u.membershipTier)
      })
      .catch(() => router.push('/members/login'))
  }, [router])

  const handleRenew = async () => {
    if (!user) return
    setLoading(true)
    try {
      const res = await axios.post('/api/payments/create-checkout', {
        email: user.email,
        membershipTier: selected,
      })
      window.location.href = res.data.checkoutUrl
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? 'Could not start checkout')
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-cricket-green border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="hero-gradient pt-24 pb-10">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <Link href="/members" className="inline-flex items-center gap-1.5 text-green-200 hover:text-white text-sm mb-4">
            <ArrowLeft className="h-4 w-4" /> Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-white font-serif">Renew Membership</h1>
          <p className="text-green-200 mt-1 text-sm">Select your membership and go straight to payment — no registration needed.</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-4">
        {PLANS.map((plan) => {
          const Icon = plan.icon
          const isSelected = selected === plan.id
          return (
            <div
              key={plan.id}
              onClick={() => setSelected(plan.id)}
              className={`card p-5 cursor-pointer border-2 transition-all ${isSelected ? 'border-cricket-green shadow-lg' : 'border-gray-100 hover:border-gray-300'}`}
            >
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${isSelected ? 'bg-cricket-green' : 'bg-gray-100'}`}>
                  <Icon className={`h-5 w-5 ${isSelected ? 'text-white' : 'text-gray-500'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <h3 className="font-bold text-gray-900">{plan.name}</h3>
                    <div className="text-right shrink-0">
                      <span className="text-2xl font-bold text-cricket-green">{plan.price}</span>
                      <span className="text-xs text-gray-400 ml-1">{plan.billing}</span>
                    </div>
                  </div>
                  <ul className="mt-2 space-y-1">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                        <Check className="h-3.5 w-3.5 text-cricket-green shrink-0" /> {f}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              {isSelected && (
                <div className="mt-3 text-center text-xs text-cricket-green font-semibold">✓ Selected</div>
              )}
            </div>
          )
        })}

        <button
          onClick={handleRenew}
          disabled={loading}
          className="btn-primary w-full justify-center text-base py-4"
        >
          {loading ? 'Redirecting to payment…' : 'Proceed to Payment →'}
        </button>
        <p className="text-xs text-gray-400 text-center">
          Secure payment via Stripe. You are renewing as <strong>{user.email}</strong>.
        </p>
      </div>
    </div>
  )
}
