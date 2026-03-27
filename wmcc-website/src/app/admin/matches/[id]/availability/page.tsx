'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import axios from 'axios'
import toast from 'react-hot-toast'
import { ArrowLeft, Send, Bell, CheckCircle, XCircle, HelpCircle, Clock } from 'lucide-react'

type Player = {
  user: { firstName: string; lastName: string }
}

type AvailabilityRequest = {
  id: string
  status: 'PENDING' | 'AVAILABLE' | 'UNAVAILABLE' | 'MAYBE'
  respondedAt: string | null
  emailSentAt: string | null
  smsSentAt: string | null
  smsReminderSentAt: string | null
  player: Player
}

type Summary = {
  available: number
  unavailable: number
  maybe: number
  pending: number
  total: number
}

const STATUS_CONFIG = {
  AVAILABLE:   { label: 'Available',     icon: CheckCircle, colour: 'text-green-600',  bg: 'bg-green-50',  border: 'border-green-200' },
  UNAVAILABLE: { label: 'Not Available', icon: XCircle,     colour: 'text-red-600',    bg: 'bg-red-50',    border: 'border-red-200' },
  MAYBE:       { label: 'Maybe',         icon: HelpCircle,  colour: 'text-amber-600',  bg: 'bg-amber-50',  border: 'border-amber-200' },
  PENDING:     { label: 'No Response',   icon: Clock,       colour: 'text-gray-500',   bg: 'bg-gray-50',   border: 'border-gray-200' },
}

export default function AvailabilityPage() {
  const { id } = useParams<{ id: string }>()
  const [requests, setRequests]   = useState<AvailabilityRequest[]>([])
  const [summary, setSummary]     = useState<Summary | null>(null)
  const [loading, setLoading]     = useState(true)
  const [sending, setSending]     = useState(false)
  const [reminding, setReminding] = useState(false)

  const load = async () => {
    try {
      const { data } = await axios.get(`/api/matches/${id}/availability`)
      setRequests(data.requests)
      setSummary(data.summary)
    } catch {
      toast.error('Failed to load availability')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [id])

  const sendRequests = async () => {
    setSending(true)
    try {
      const { data } = await axios.post(`/api/matches/${id}/availability-request`)
      toast.success(`Sent — ${data.emailsSent} emails, ${data.smsSent} SMS`)
      load()
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? 'Failed to send')
    } finally {
      setSending(false)
    }
  }

  const sendReminders = async () => {
    setReminding(true)
    try {
      const { data } = await axios.patch(`/api/matches/${id}/availability-request`)
      toast.success(`Reminder sent to ${data.smsSent} players`)
      load()
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? 'Failed to send reminders')
    } finally {
      setReminding(false)
    }
  }

  const grouped = {
    AVAILABLE:   requests.filter(r => r.status === 'AVAILABLE'),
    MAYBE:       requests.filter(r => r.status === 'MAYBE'),
    PENDING:     requests.filter(r => r.status === 'PENDING'),
    UNAVAILABLE: requests.filter(r => r.status === 'UNAVAILABLE'),
  }

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/admin/matches`} className="text-gray-500 hover:text-gray-700">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Player Availability</h1>
      </div>

      {/* Summary cards */}
      {summary && (
        <div className="grid grid-cols-4 gap-3 mb-6">
          {(['available', 'maybe', 'pending', 'unavailable'] as const).map((key) => {
            const statusKey = key.toUpperCase() as keyof typeof STATUS_CONFIG
            const cfg = STATUS_CONFIG[statusKey]
            const Icon = cfg.icon
            return (
              <div key={key} className={`rounded-xl border p-3 text-center ${cfg.bg} ${cfg.border}`}>
                <Icon className={`h-5 w-5 mx-auto mb-1 ${cfg.colour}`} />
                <p className={`text-2xl font-bold ${cfg.colour}`}>{summary[key]}</p>
                <p className="text-xs text-gray-500 mt-0.5">{cfg.label}</p>
              </div>
            )
          })}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-3 mb-6">
        <button
          onClick={sendRequests}
          disabled={sending}
          className="flex items-center gap-2 bg-cricket-green text-white px-4 py-2.5 rounded-lg font-semibold text-sm hover:bg-cricket-dark disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
          {sending ? 'Sending…' : summary && summary.total > 0 ? 'Resend All' : 'Send Availability Request'}
        </button>
        {summary && summary.pending > 0 && (
          <button
            onClick={sendReminders}
            disabled={reminding}
            className="flex items-center gap-2 bg-amber-500 text-white px-4 py-2.5 rounded-lg font-semibold text-sm hover:bg-amber-600 disabled:opacity-50"
          >
            <Bell className="h-4 w-4" />
            {reminding ? 'Sending…' : `Remind ${summary.pending} non-responders`}
          </button>
        )}
      </div>

      {/* Player list grouped by status */}
      {loading ? (
        <p className="text-gray-500 text-sm">Loading…</p>
      ) : requests.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-lg font-medium">No requests sent yet</p>
          <p className="text-sm mt-1">Click "Send Availability Request" to notify all players.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {(Object.entries(grouped) as [keyof typeof grouped, AvailabilityRequest[]][])
            .filter(([, items]) => items.length > 0)
            .map(([status, items]) => {
              const cfg = STATUS_CONFIG[status]
              const Icon = cfg.icon
              return (
                <div key={status}>
                  <div className={`flex items-center gap-2 mb-2`}>
                    <Icon className={`h-4 w-4 ${cfg.colour}`} />
                    <span className={`text-sm font-semibold ${cfg.colour}`}>{cfg.label} ({items.length})</span>
                  </div>
                  <div className="space-y-2">
                    {items.map((r) => (
                      <div key={r.id} className={`flex items-center justify-between rounded-lg border px-4 py-3 ${cfg.bg} ${cfg.border}`}>
                        <span className="font-medium text-gray-900 text-sm">
                          {r.player.user.firstName} {r.player.user.lastName}
                        </span>
                        <div className="flex items-center gap-3 text-xs text-gray-400">
                          {r.emailSentAt && <span>Email ✓</span>}
                          {r.smsSentAt && <span>SMS ✓</span>}
                          {r.smsReminderSentAt && <span>Reminder ✓</span>}
                          {r.respondedAt && (
                            <span className="text-gray-500">
                              {new Date(r.respondedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
        </div>
      )}
    </div>
  )
}
