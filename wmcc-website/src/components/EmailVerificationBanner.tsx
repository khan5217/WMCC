'use client'

import { useState } from 'react'
import { MailWarning } from 'lucide-react'

export default function EmailVerificationBanner() {
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  async function resend() {
    setStatus('sending')
    try {
      const res = await fetch('/api/auth/resend-verification', { method: 'POST' })
      setStatus(res.ok ? 'sent' : 'error')
    } catch {
      setStatus('error')
    }
  }

  return (
    <div className="flex items-start gap-3 bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3">
      <MailWarning className="h-5 w-5 text-yellow-600 mt-0.5 shrink-0" />
      <div className="flex-1 text-sm">
        <span className="font-semibold text-yellow-800">Please verify your email address.</span>
        <span className="text-yellow-700"> Check your inbox for a verification link.</span>
        {status === 'idle' && (
          <button
            onClick={resend}
            className="ml-2 text-cricket-green font-medium hover:underline"
          >
            Resend email
          </button>
        )}
        {status === 'sending' && <span className="ml-2 text-gray-500">Sending…</span>}
        {status === 'sent' && <span className="ml-2 text-green-600 font-medium">Sent! Check your inbox.</span>}
        {status === 'error' && <span className="ml-2 text-red-600">Failed to send. Try again later.</span>}
      </div>
    </div>
  )
}
