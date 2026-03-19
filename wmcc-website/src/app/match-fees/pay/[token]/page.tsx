'use client'

import { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import axios from 'axios'
import { CheckCircle, XCircle, CreditCard, Loader2, AlertTriangle } from 'lucide-react'

interface FeeInfo {
  id: string
  amount: number
  playerType: 'STARTER' | 'SUB'
  status: string
  match: {
    opposition: string
    date: string
    venue: string
  }
  playerName: string
  email: string | null
}

function fmt(pence: number) {
  return `£${(pence / 100).toFixed(2)}`
}

export default function PayMatchFeePage() {
  const { token } = useParams<{ token: string }>()
  const searchParams = useSearchParams()
  const success = searchParams.get('success') === '1'
  const cancelled = searchParams.get('cancelled') === '1'

  const [info, setInfo] = useState<FeeInfo | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(false)

  useEffect(() => {
    if (success) { setLoading(false); return }
    axios.get(`/api/match-fees/pay/${token}`)
      .then((res) => {
        if (res.data.status === 'PAID') {
          setError('already_paid')
        } else if (res.data.status === 'WAIVED') {
          setError('waived')
        } else {
          setInfo(res.data)
        }
      })
      .catch(() => setError('invalid'))
      .finally(() => setLoading(false))
  }, [token, success])

  const handlePay = async () => {
    setPaying(true)
    try {
      const res = await axios.post(`/api/match-fees/pay/${token}`)
      if (res.data.url) window.location.href = res.data.url
    } catch {
      alert('Failed to start payment. Please try again or contact the club.')
    } finally {
      setPaying(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Club header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-cricket-green rounded-full mb-3">
            <span className="text-white font-bold text-2xl">W</span>
          </div>
          <div className="font-bold text-gray-900 text-lg">WMCC</div>
          <div className="text-sm text-gray-500">Milton Keynes Cricket Club</div>
        </div>

        {loading ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 text-center">
            <Loader2 className="h-8 w-8 text-gray-300 animate-spin mx-auto" />
          </div>
        ) : success ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
            <CheckCircle className="h-14 w-14 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Complete!</h1>
            <p className="text-gray-500 text-sm">
              Thank you — your match fee has been paid. We&apos;ll send a confirmation to your email.
            </p>
          </div>
        ) : error === 'already_paid' ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
            <CheckCircle className="h-14 w-14 text-green-500 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-gray-900 mb-2">Already Paid</h1>
            <p className="text-gray-500 text-sm">This match fee has already been paid. Thank you!</p>
          </div>
        ) : error === 'waived' ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
            <CheckCircle className="h-14 w-14 text-blue-400 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-gray-900 mb-2">Fee Waived</h1>
            <p className="text-gray-500 text-sm">Your match fee has been waived. No payment is required.</p>
          </div>
        ) : error ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
            <XCircle className="h-14 w-14 text-red-400 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-gray-900 mb-2">Invalid Link</h1>
            <p className="text-gray-500 text-sm">This payment link is invalid or has expired. Please contact the club.</p>
          </div>
        ) : info ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-cricket-green p-6 text-center">
              <p className="text-green-100 text-sm font-medium uppercase tracking-wider mb-1">Match Fee Due</p>
              <p className="text-white text-4xl font-bold">{fmt(info.amount)}</p>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Player</p>
                <p className="font-semibold text-gray-900">{info.playerName}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Match</p>
                <p className="font-semibold text-gray-900">vs {info.match.opposition}</p>
                <p className="text-sm text-gray-500">
                  {new Date(info.match.date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
                <p className="text-sm text-gray-500">{info.match.venue}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Role</p>
                <p className="text-sm text-gray-700">{info.playerType === 'STARTER' ? 'Starting Player' : 'Substitute'}</p>
              </div>

              {cancelled && (
                <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  Payment was cancelled. You can try again below.
                </div>
              )}

              <button
                onClick={handlePay}
                disabled={paying}
                className="w-full bg-cricket-green hover:bg-cricket-dark text-white font-bold py-4 rounded-xl text-base transition-colors disabled:opacity-60 flex items-center justify-center gap-3 mt-2"
              >
                {paying ? (
                  <><Loader2 className="h-5 w-5 animate-spin" /> Processing...</>
                ) : (
                  <><CreditCard className="h-5 w-5" /> Pay {fmt(info.amount)} by Card</>
                )}
              </button>

              <p className="text-xs text-gray-400 text-center pt-1">
                Secure payment via Stripe. If you have already paid in cash or by bank transfer, please let your team manager know.
              </p>
            </div>
          </div>
        ) : null}

        <p className="text-center text-xs text-gray-400 mt-6">
          Questions? Contact <a href="mailto:contact@wmccmk.com" className="text-cricket-green hover:underline">contact@wmccmk.com</a>
        </p>
      </div>
    </div>
  )
}
