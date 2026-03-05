'use client'

import { useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Lock, Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'

function strengthRules(password: string) {
  return [
    { label: 'At least 8 characters', ok: password.length >= 8 },
    { label: 'Uppercase letter', ok: /[A-Z]/.test(password) },
    { label: 'Lowercase letter', ok: /[a-z]/.test(password) },
    { label: 'Number', ok: /\d/.test(password) },
  ]
}

function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token') ?? ''

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  if (!token) {
    return (
      <div className="text-center space-y-4">
        <p className="text-sm text-gray-600">This reset link is invalid or missing a token.</p>
        <Link href="/members/forgot-password" className="text-cricket-green text-sm hover:underline">
          Request a new link
        </Link>
      </div>
    )
  }

  const rules = strengthRules(password)
  const allRulesMet = rules.every(r => r.ok)
  const confirmMismatch = confirm.length > 0 && confirm !== password

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirm) {
      toast.error('Passwords do not match')
      return
    }
    setLoading(true)
    try {
      await axios.post('/api/auth/reset-password', { token, password })
      setDone(true)
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? 'Failed to reset password')
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="text-center space-y-4">
        <p className="text-sm text-gray-600">
          Your password has been updated. All existing sessions have been signed out.
        </p>
        <button onClick={() => router.push('/members/login')} className="btn-primary w-full">
          Sign In
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="label">New Password</label>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            className="input pr-11"
            required
            autoComplete="new-password"
            placeholder="Min. 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>

        {password.length > 0 && (
          <ul className="mt-2 space-y-1">
            {rules.map(rule => (
              <li key={rule.label} className={`flex items-center gap-1.5 text-xs ${rule.ok ? 'text-green-600' : 'text-gray-400'}`}>
                {rule.ok
                  ? <CheckCircle className="h-3.5 w-3.5 flex-shrink-0" />
                  : <XCircle className="h-3.5 w-3.5 flex-shrink-0" />}
                {rule.label}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <label className="label">Confirm New Password</label>
        <input
          type={showPassword ? 'text' : 'password'}
          className={`input ${confirmMismatch ? 'border-red-400 focus:ring-red-300' : ''}`}
          required
          autoComplete="new-password"
          placeholder="Repeat your password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
        {confirmMismatch && (
          <p className="mt-1 text-xs text-red-500">Passwords do not match</p>
        )}
      </div>

      <button
        type="submit"
        disabled={loading || !allRulesMet || confirmMismatch}
        className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Updating...' : 'Reset Password'}
      </button>
    </form>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-24 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-cricket-green rounded-full flex items-center justify-center mx-auto mb-4 shadow-green">
            <Lock className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 font-serif">Reset your password</h1>
          <p className="text-gray-500 mt-2 text-sm">Choose a strong new password for your account</p>
        </div>

        <div className="card p-8">
          <Suspense fallback={<p className="text-sm text-center text-gray-500">Loading...</p>}>
            <ResetPasswordForm />
          </Suspense>
        </div>

        <div className="text-center mt-6">
          <Link href="/members/login" className="text-sm text-gray-500 hover:text-gray-700">
            Back to login
          </Link>
        </div>
      </div>
    </div>
  )
}
