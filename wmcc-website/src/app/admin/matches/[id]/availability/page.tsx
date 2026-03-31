'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import axios from 'axios'
import toast from 'react-hot-toast'
import { ArrowLeft, Send, Bell, CheckCircle, XCircle, HelpCircle, Clock, PoundSterling, ExternalLink, UserCheck, UserX } from 'lucide-react'

type FeeAssignment = {
  id: string
  status: 'PENDING' | 'OUTSTANDING' | 'PAID' | 'WAIVED'
  amount: number
  playerType: 'STARTER' | 'SUB'
  eventId: string
}

type Player = {
  user: { firstName: string; lastName: string; membershipStatus: string }
  matchFeeAssignments: FeeAssignment[]
}

type AvailabilityRequest = {
  id: string
  status: 'PENDING' | 'AVAILABLE' | 'UNAVAILABLE' | 'MAYBE'
  respondedAt: string | null
  emailSentAt: string | null
  smsSentAt: string | null
  emailReminderSentAt: string | null
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

const FEE_STATUS_BADGE: Record<string, string> = {
  PENDING:     'bg-yellow-100 text-yellow-700',
  OUTSTANDING: 'bg-orange-100 text-orange-700',
  PAID:        'bg-green-100 text-green-700',
  WAIVED:      'bg-gray-100 text-gray-500',
}

const SQUAD_SIZE = 11

function fmt(pence: number) {
  return `£${(pence / 100).toFixed(2)}`
}

function PlayerCard({ r, matchId }: { r: AvailabilityRequest; matchId: string }) {
  const cfg = STATUS_CONFIG[r.status]
  const fee = r.player.matchFeeAssignments[0] ?? null
  return (
    <div className={`rounded-lg border px-4 py-3 ${cfg.bg} ${cfg.border}`}>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <span className="font-medium text-gray-900 text-sm">
          {r.player.user.firstName} {r.player.user.lastName}
        </span>
        <div className="flex items-center gap-3 flex-wrap">
          {fee ? (
            <Link
              href={`/admin/match-fees/${matchId}`}
              className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${FEE_STATUS_BADGE[fee.status]}`}
            >
              <PoundSterling className="h-3 w-3" />
              {fmt(fee.amount)} · {fee.status}
              <ExternalLink className="h-3 w-3 ml-0.5" />
            </Link>
          ) : r.status === 'AVAILABLE' ? (
            <Link
              href={`/admin/match-fees/${matchId}`}
              className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500"
            >
              <PoundSterling className="h-3 w-3" /> No fee — assign manually
            </Link>
          ) : null}
          <div className="flex items-center gap-2 text-xs text-gray-400">
            {r.emailSentAt && <span>Email ✓</span>}
            {r.smsSentAt && <span>SMS ✓</span>}
            {(r.emailReminderSentAt || r.smsReminderSentAt) && <span>Reminder ✓</span>}
            {r.respondedAt && (
              <span className="text-gray-500">
                {new Date(r.respondedAt).toLocaleDateString('en-GB', {
                  day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                })}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function PlayerGroup({
  status,
  items,
  matchId,
}: {
  status: keyof typeof STATUS_CONFIG
  items: AvailabilityRequest[]
  matchId: string
}) {
  if (items.length === 0) return null
  const cfg = STATUS_CONFIG[status]
  const Icon = cfg.icon
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`h-4 w-4 ${cfg.colour}`} />
        <span className={`text-sm font-semibold ${cfg.colour}`}>{cfg.label} ({items.length})</span>
      </div>
      <div className="space-y-2">
        {items.map(r => <PlayerCard key={r.id} r={r} matchId={matchId} />)}
      </div>
    </div>
  )
}

function PlayerSection({
  title,
  icon: Icon,
  iconClass,
  requests,
  matchId,
  emptyMessage,
}: {
  title: string
  icon: React.ElementType
  iconClass: string
  requests: AvailabilityRequest[]
  matchId: string
  emptyMessage: string
}) {
  const grouped = {
    AVAILABLE:   requests.filter(r => r.status === 'AVAILABLE'),
    MAYBE:       requests.filter(r => r.status === 'MAYBE'),
    PENDING:     requests.filter(r => r.status === 'PENDING'),
    UNAVAILABLE: requests.filter(r => r.status === 'UNAVAILABLE'),
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex items-center gap-2 mb-4">
        <Icon className={`h-5 w-5 ${iconClass}`} />
        <h2 className="font-semibold text-gray-800">{title}</h2>
        <span className="ml-auto text-xs text-gray-400">{requests.length} player{requests.length !== 1 ? 's' : ''}</span>
      </div>
      {requests.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-4">{emptyMessage}</p>
      ) : (
        <div className="space-y-5">
          {(Object.entries(grouped) as [keyof typeof grouped, AvailabilityRequest[]][])
            .map(([status, items]) => (
              <PlayerGroup key={status} status={status} items={items} matchId={matchId} />
            ))}
        </div>
      )}
    </div>
  )
}

export default function AvailabilityPage() {
  const { id } = useParams<{ id: string }>()
  const [requests, setRequests]     = useState<AvailabilityRequest[]>([])
  const [summary, setSummary]       = useState<Summary | null>(null)
  const [loading, setLoading]       = useState(true)
  const [sending, setSending]       = useState(false)
  const [reminding, setReminding]   = useState(false)
  const [inviting, setInviting]     = useState(false)

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
      toast.success(`Sent to members — ${data.emailsSent} emails, ${data.smsSent} SMS`)
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
      toast.success(`Reminders sent — ${data.emailsSent} emails, ${data.smsSent} SMS`)
      load()
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? 'Failed to send reminders')
    } finally {
      setReminding(false)
    }
  }

  const inviteNonMembers = async () => {
    setInviting(true)
    try {
      const { data } = await axios.put(`/api/matches/${id}/availability-request`)
      toast.success(`Non-members invited — ${data.emailsSent} emails, ${data.smsSent} SMS`)
      load()
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? 'Failed to invite non-members')
    } finally {
      setInviting(false)
    }
  }

  const members    = requests.filter(r => r.player.user.membershipStatus === 'ACTIVE')
  const nonMembers = requests.filter(r => r.player.user.membershipStatus !== 'ACTIVE')
  const availableMembers = members.filter(r => r.status === 'AVAILABLE').length
  const nonMembersInvited = nonMembers.length > 0
  const needsNonMembers = availableMembers < SQUAD_SIZE

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/matches" className="text-gray-500 hover:text-gray-700">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Player Availability</h1>
          <p className="text-xs text-gray-400 mt-0.5">Players marked Available are auto-assigned a match fee for the day.</p>
        </div>
        <Link
          href={`/admin/match-fees/${id}`}
          className="inline-flex items-center gap-1.5 text-sm text-blue-600 font-medium hover:underline"
        >
          <PoundSterling className="h-4 w-4" /> Manage Fees
        </Link>
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
      <div className="flex flex-wrap gap-3 mb-6">
        <button
          onClick={sendRequests}
          disabled={sending}
          className="flex items-center gap-2 bg-cricket-green text-white px-4 py-2.5 rounded-lg font-semibold text-sm hover:bg-cricket-dark disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
          {sending ? 'Sending…' : members.length > 0 ? 'Resend to Members' : 'Send to Members'}
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

        {needsNonMembers && (
          <button
            onClick={inviteNonMembers}
            disabled={inviting}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg font-semibold text-sm hover:bg-blue-700 disabled:opacity-50"
          >
            <UserX className="h-4 w-4" />
            {inviting
              ? 'Inviting…'
              : nonMembersInvited
              ? 'Resend to Non-members'
              : `Invite Non-members (${availableMembers}/${SQUAD_SIZE} members confirmed)`}
          </button>
        )}
      </div>

      {/* Player lists */}
      {loading ? (
        <p className="text-gray-500 text-sm">Loading…</p>
      ) : (
        <div className="space-y-6">
          <PlayerSection
            title="Club Members (paid)"
            icon={UserCheck}
            iconClass="text-green-600"
            requests={members}
            matchId={id}
            emptyMessage="No availability requests sent to members yet."
          />
          {nonMembersInvited && (
            <PlayerSection
              title="Non-members / Guests"
              icon={UserX}
              iconClass="text-blue-500"
              requests={nonMembers}
              matchId={id}
              emptyMessage="No non-members invited yet."
            />
          )}
        </div>
      )}
    </div>
  )
}
