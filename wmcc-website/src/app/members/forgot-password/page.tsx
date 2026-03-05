'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await axios.post('/api/auth/forgot-password', { email })
      setSent(true)
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-24 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-cricket-green rounded-full flex items-center justify-center mx-auto mb-4 shadow-green">
            {sent ? <CheckCircle className="h-8 w-8 text-white" /> : <Mail className="h-8 w-8 text-white" />}
          </div>
          <h1 className="text-2xl font-bold text-gray-900 font-serif">
            {sent ? 'Check your inbox' : 'Forgot your password?'}
          </h1>
          <p className="text-gray-500 mt-2 text-sm">
            {sent
              ? `We've sent a reset link to ${email}`
              : 'Enter your email and we\'ll send you a reset link'}
          </p>
        </div>

        <div className="card p-8">
          {sent ? (
            <div className="space-y-4 text-center">
              <p className="text-sm text-gray-600">
                The link expires in <strong>1 hour</strong>. Check your spam folder if you don't see it.
              </p>
              <button
                onClick={() => { setSent(false); setEmail('') }}
                className="text-sm text-cricket-green hover:underline"
              >
                Send to a different email
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="label">Email Address</label>
                <input
                  type="email"
                  className="input"
                  required
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>
          )}
        </div>

        <div className="text-center mt-6">
          <Link href="/members/login" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
            <ArrowLeft className="h-4 w-4" />
            Back to login
          </Link>
        </div>
      </div>
    </div>
  )
}
