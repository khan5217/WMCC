'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Check, Shield, Users, Trophy, Star } from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'

const TIERS = [
  {
    id: 'PLAYING_SENIOR',
    name: 'Senior Playing',
    price: '£80',
    description: 'Full playing membership for adults (18+)',
    features: [
      'Play in 1st & 2nd XI',
      'Access to all nets sessions',
      'Voting rights at AGM',
      'Members login & documents',
      'Club kit discount',
    ],
    icon: Trophy,
    recommended: true,
    color: 'border-cricket-green',
  },
  {
    id: 'PLAYING_JUNIOR',
    name: 'Junior Playing',
    price: '£40',
    description: 'Playing membership for cricketers under 18',
    features: [
      'Junior team participation',
      'Junior nets sessions',
      'ECB coaching programs',
      'Members login & documents',
    ],
    icon: Star,
    recommended: false,
    color: 'border-blue-400',
  },
  {
    id: 'SOCIAL',
    name: 'Social Member',
    price: '£25',
    description: 'Support the club without playing',
    features: [
      'Attend all home matches',
      'Club events & socials',
      'Members login & documents',
      'Newsletter updates',
    ],
    icon: Users,
    recommended: false,
    color: 'border-gray-300',
  },
  {
    id: 'FAMILY',
    name: 'Family',
    price: '£150',
    description: 'Membership for the whole family (up to 4)',
    features: [
      'Up to 4 family members',
      'Playing + social benefits',
      'Junior programs included',
      'Members login & documents',
      'Family events access',
    ],
    icon: Shield,
    recommended: false,
    color: 'border-purple-400',
  },
]

export default function MembershipPage() {
  const [selected, setSelected] = useState('PLAYING_SENIOR')
  const [step, setStep] = useState<'choose' | 'register'>('choose')
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '', password: '', confirmPassword: '',
  })

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }
    setLoading(true)
    try {
      await axios.post('/api/auth/register', {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone,
        password: form.password,
        membershipTier: selected,
      })

      // Redirect to Stripe checkout
      const res = await axios.post('/api/payments/create-checkout', {
        email: form.email,
        membershipTier: selected,
      })
      window.location.href = res.data.checkoutUrl
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="hero-gradient pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white font-serif mb-3">Join WMCC</h1>
          <p className="text-xl text-green-100 max-w-2xl mx-auto">
            Become a member of Milton Keynes&apos; premier cricket club.
            Choose the membership that&apos;s right for you.
          </p>
        </div>
      </div>

      <div className="section-padding bg-white">
        <div className="container-max">
          {step === 'choose' ? (
            <>
              <div className="text-center mb-12">
                <h2 className="section-title">Choose Your Membership</h2>
                <p className="section-subtitle">2024 Season memberships — includes full club benefits</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                {TIERS.map((tier) => {
                  const Icon = tier.icon
                  const isSelected = selected === tier.id
                  return (
                    <div
                      key={tier.id}
                      onClick={() => setSelected(tier.id)}
                      className={`card p-6 cursor-pointer border-2 transition-all relative
                        ${isSelected ? `${tier.color} shadow-lg` : 'border-gray-100 hover:border-gray-300'}
                      `}
                    >
                      {tier.recommended && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-cricket-green text-white text-xs font-bold px-3 py-1 rounded-full">
                          Most Popular
                        </div>
                      )}
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-4 ${isSelected ? 'bg-cricket-green' : 'bg-gray-100'}`}>
                        <Icon className={`h-5 w-5 ${isSelected ? 'text-white' : 'text-gray-500'}`} />
                      </div>
                      <h3 className="font-bold text-gray-900 mb-1">{tier.name}</h3>
                      <div className="text-3xl font-bold text-cricket-green mb-1">{tier.price}</div>
                      <div className="text-xs text-gray-400 mb-4">per season</div>
                      <p className="text-sm text-gray-500 mb-4">{tier.description}</p>
                      <ul className="space-y-2">
                        {tier.features.map((f) => (
                          <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                            <Check className="h-4 w-4 text-cricket-green mt-0.5 flex-shrink-0" />
                            {f}
                          </li>
                        ))}
                      </ul>
                      {isSelected && (
                        <div className="mt-4 text-center text-xs text-cricket-green font-semibold">
                          ✓ Selected
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              <div className="text-center">
                <button onClick={() => setStep('register')} className="btn-primary text-lg px-10 py-4">
                  Continue with {TIERS.find((t) => t.id === selected)?.name} →
                </button>
                <p className="text-sm text-gray-400 mt-3">
                  Secure payment via Stripe. Already a member?{' '}
                  <Link href="/members/login" className="text-cricket-green hover:underline">Sign in</Link>
                </p>
              </div>
            </>
          ) : (
            <div className="max-w-lg mx-auto">
              <button onClick={() => setStep('choose')} className="text-sm text-gray-400 hover:text-gray-600 mb-6">
                ← Change membership tier
              </button>

              <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-8 flex items-center justify-between">
                <div>
                  <div className="font-bold text-gray-900">{TIERS.find((t) => t.id === selected)?.name}</div>
                  <div className="text-sm text-gray-500">2024 Season</div>
                </div>
                <div className="text-2xl font-bold text-cricket-green">
                  {TIERS.find((t) => t.id === selected)?.price}
                </div>
              </div>

              <div className="card p-8">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Your Details</h2>
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="label">First Name *</label>
                      <input className="input" type="text" required value={form.firstName}
                        onChange={(e) => setForm({ ...form, firstName: e.target.value })} placeholder="John" />
                    </div>
                    <div>
                      <label className="label">Last Name *</label>
                      <input className="input" type="text" required value={form.lastName}
                        onChange={(e) => setForm({ ...form, lastName: e.target.value })} placeholder="Smith" />
                    </div>
                  </div>
                  <div>
                    <label className="label">Email Address *</label>
                    <input className="input" type="email" required value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="john@example.com" />
                  </div>
                  <div>
                    <label className="label">Mobile Number * <span className="text-xs text-gray-400">(for 2FA login)</span></label>
                    <input className="input" type="tel" required value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+447911123456" />
                    <p className="text-xs text-gray-400 mt-1">Include country code, e.g. +447... for UK numbers</p>
                  </div>
                  <div>
                    <label className="label">Password *</label>
                    <input className="input" type="password" required value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Min 8 chars, uppercase, number" />
                  </div>
                  <div>
                    <label className="label">Confirm Password *</label>
                    <input className="input" type="password" required value={form.confirmPassword}
                      onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} placeholder="Repeat password" />
                  </div>
                  <button type="submit" disabled={loading} className="btn-primary w-full text-base py-3.5 flex items-center justify-center gap-2">
                    {loading ? 'Processing...' : 'Proceed to Payment →'}
                  </button>
                  <p className="text-xs text-gray-400 text-center">
                    Secure payment via Stripe. By registering you agree to our{' '}
                    <Link href="/terms" className="text-cricket-green hover:underline">Terms</Link> and{' '}
                    <Link href="/privacy" className="text-cricket-green hover:underline">Privacy Policy</Link>.
                  </p>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
