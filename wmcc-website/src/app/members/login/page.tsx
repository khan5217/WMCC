'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Shield, Eye, EyeOff, Smartphone, ArrowRight, Lock, CheckCircle } from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'

type Step = 'credentials' | 'otp'

const RESEND_COOLDOWN = 30

export default function MembersLoginPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('credentials')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  // Step 1 state
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  // Step 2 state
  const [userId, setUserId] = useState('')
  const [maskedPhone, setMaskedPhone] = useState('')
  const [otp, setOtp] = useState('')

  // Resend cooldown
  const [resendCooldown, setResendCooldown] = useState(0)
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const startCooldown = () => {
    setResendCooldown(RESEND_COOLDOWN)
    cooldownRef.current = setInterval(() => {
      setResendCooldown(prev => {
        if (prev <= 1) {
          clearInterval(cooldownRef.current!)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  useEffect(() => () => { if (cooldownRef.current) clearInterval(cooldownRef.current) }, [])

  const handleCredentials = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await axios.post('/api/auth/login', { email: email.trim(), password })
      if (res.data.success) {
        toast.success('Welcome back!')
        router.push('/members')
        router.refresh()
      } else {
        setUserId(res.data.userId)
        setMaskedPhone(res.data.maskedPhone)
        setStep('otp')
        startCooldown()
        toast.success(res.data.message)
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const submitOtp = async (code: string) => {
    setLoading(true)
    try {
      await axios.post('/api/auth/verify-otp', { userId, code })
      toast.success('Welcome back!')
      router.push('/members')
      router.refresh()
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? 'Verification failed')
      setLoading(false)
    }
  }

  const handleOtpChange = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 6)
    setOtp(digits)
    if (digits.length === 6) submitOtp(digits)
  }

  const handleResendOTP = async () => {
    if (resendCooldown > 0) return
    try {
      await axios.post('/api/auth/login', { email: email.trim(), password })
      toast.success('New code sent!')
      startCooldown()
    } catch {
      toast.error('Failed to resend code')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-24 px-4">
      <div className="w-full max-w-md">
        {/* Logo / header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-cricket-green rounded-full flex items-center justify-center mx-auto mb-4 shadow-green">
            {step === 'otp' ? (
              <Smartphone className="h-8 w-8 text-white" />
            ) : (
              <Lock className="h-8 w-8 text-white" />
            )}
          </div>
          <h1 className="text-2xl font-bold text-gray-900 font-serif">
            {step === 'credentials' ? 'Members Login' : 'Verify Your Identity'}
          </h1>
          <p className="text-gray-500 mt-2 text-sm">
            {step === 'credentials'
              ? 'Sign in to access your WMCC member area'
              : `Enter the 6-digit code sent to ${maskedPhone}`}
          </p>
        </div>

        {/* 2FA progress indicator */}
        <div className="flex items-center gap-2 mb-2">
          <div className="flex-1 h-1.5 rounded-full bg-cricket-green" />
          <div className={`flex-1 h-1.5 rounded-full ${step === 'otp' ? 'bg-cricket-green' : 'bg-gray-200'}`} />
        </div>
        <div className="flex text-xs text-gray-400 mb-6 gap-2">
          <div className="flex-1 text-center flex items-center justify-center gap-1">
            {step === 'otp' && <CheckCircle className="h-3 w-3 text-cricket-green" />}
            <span className={step === 'otp' ? 'text-cricket-green' : 'text-cricket-green font-medium'}>
              1. Enter credentials
            </span>
          </div>
          <div className={`flex-1 text-center ${step === 'otp' ? 'text-cricket-green font-medium' : ''}`}>
            2. SMS verification
          </div>
        </div>

        <div className="card p-8">
          {step === 'credentials' ? (
            <form onSubmit={handleCredentials} className="space-y-5">
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
              <div>
                <label className="label">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="input pr-11"
                    required
                    autoComplete="current-password"
                    placeholder="Your password"
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
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
                {loading ? 'Checking...' : 'Continue'}
                <ArrowRight className="h-4 w-4" />
              </button>
              <div className="text-center">
                <Link href="/members/forgot-password" className="text-sm text-cricket-green hover:underline">
                  Forgot your password?
                </Link>
              </div>
            </form>
          ) : (
            <div className="space-y-5">
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-sm text-blue-700">
                <div className="flex items-start gap-2">
                  <Shield className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <div>
                    A 6-digit verification code has been sent to your registered mobile number
                    ending in <strong>{maskedPhone.slice(-3)}</strong>.
                    It is valid for <strong>10 minutes</strong>.
                  </div>
                </div>
              </div>

              <div>
                <label className="label">Verification Code</label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  className="input text-center text-2xl tracking-widest font-bold"
                  required
                  placeholder="• • • • • •"
                  value={otp}
                  onChange={(e) => handleOtpChange(e.target.value)}
                  autoFocus
                  disabled={loading}
                />
                {loading && (
                  <p className="text-xs text-center text-gray-400 mt-2">Verifying...</p>
                )}
              </div>

              <div className="text-center">
                <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={resendCooldown > 0}
                  className="text-sm text-cricket-green hover:underline disabled:text-gray-400 disabled:no-underline disabled:cursor-default"
                >
                  {resendCooldown > 0
                    ? `Resend in ${resendCooldown}s`
                    : "Didn't receive it? Send again"}
                </button>
              </div>

              <button
                type="button"
                onClick={() => { setStep('credentials'); setOtp('') }}
                className="w-full text-center text-sm text-gray-400 hover:text-gray-600"
              >
                ← Back
              </button>
            </div>
          )}
        </div>

        <div className="text-center mt-6 space-y-2">
          <p className="text-sm text-gray-500">
            Not a member?{' '}
            <Link href="/membership" className="text-cricket-green font-medium hover:underline">
              Join the Club
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
