'use client'

import { useState, useEffect, useCallback } from 'react'
import { Check, X, Send, RefreshCw, ChevronDown, PoundSterling } from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'

const CURRENT_YEAR = new Date().getFullYear()

const CHANNELS = [
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'cash', label: 'Cash' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'stripe', label: 'Stripe (Online)' },
  { value: 'other', label: 'Other' },
]

const TIER_LABELS: Record<string, string> = {
  PLAYING_SENIOR: 'Senior Playing',
  PLAYING_JUNIOR: 'Junior Playing',
  SOCIAL: 'Monthly Supporter',
  FAMILY: 'Family',
  LIFE: 'Life Member',
}

interface Membership {
  id: string
  status: string
  paidAt: string | null
  amount: number
  paymentChannel: string | null
  notes: string | null
}

interface Member {
  id: string
  firstName: string
  lastName: string
  email: string
  membershipTier: string
  createdAt: string
  amountDue: number
  membership: Membership | null
}

interface Stats {
  total: number
  paid: number
  unpaid: number
  revenue: number
}

type Filter = 'all' | 'paid' | 'unpaid'

function fmt(pence: number) {
  return `£${(pence / 100).toFixed(2)}`
}

export default function MembershipFeesPage() {
  const [season, setSeason] = useState(CURRENT_YEAR)
  const [members, setMembers] = useState<Member[]>([])
  const [stats, setStats] = useState<Stats>({ total: 0, paid: 0, unpaid: 0, revenue: 0 })
  const [filter, setFilter] = useState<Filter>('all')
  const [loading, setLoading] = useState(true)

  // Mark paid modal state
  const [markingMember, setMarkingMember] = useState<Member | null>(null)
  const [payChannel, setPayChannel] = useState('cash')
  const [payNotes, setPayNotes] = useState('')
  const [payAmount, setPayAmount] = useState(0)
  const [saving, setSaving] = useState(false)

  // Remind modal state
  const [showRemind, setShowRemind] = useState(false)
  const [remindDays, setRemindDays] = useState(7)
  const [sending, setSending] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await axios.get(`/api/admin/membership-fees?season=${season}`)
      setMembers(res.data.members)
      setStats(res.data.stats)
    } catch {
      toast.error('Failed to load membership data')
    } finally {
      setLoading(false)
    }
  }, [season])

  useEffect(() => { fetchData() }, [fetchData])

  const openMarkPaid = (member: Member) => {
    setMarkingMember(member)
    setPayChannel('cash')
    setPayNotes('')
    setPayAmount(Math.round(member.amountDue / 100))
  }

  const handleMarkPaid = async () => {
    if (!markingMember) return
    setSaving(true)
    try {
      await axios.patch(`/api/admin/membership-fees/${markingMember.id}`, {
        season,
        status: 'PAID',
        paymentChannel: payChannel,
        amount: payAmount * 100,
        notes: payNotes || null,
      })
      toast.success(`${markingMember.firstName} marked as paid`)
      setMarkingMember(null)
      fetchData()
    } catch {
      toast.error('Failed to update payment status')
    } finally {
      setSaving(false)
    }
  }

  const handleMarkUnpaid = async (member: Member) => {
    try {
      await axios.patch(`/api/admin/membership-fees/${member.id}`, {
        season,
        status: 'PENDING',
      })
      toast.success(`${member.firstName} marked as unpaid`)
      fetchData()
    } catch {
      toast.error('Failed to update payment status')
    }
  }

  const handleSendReminders = async () => {
    setSending(true)
    try {
      const res = await axios.post('/api/admin/membership-fees/remind', {
        season,
        daysRegistered: remindDays,
      })
      toast.success(`Reminders sent: ${res.data.sent} sent, ${res.data.failed} failed`)
      setShowRemind(false)
    } catch {
      toast.error('Failed to send reminders')
    } finally {
      setSending(false)
    }
  }

  const visible = members.filter((m) => {
    if (filter === 'paid') return m.membership?.status === 'PAID'
    if (filter === 'unpaid') return m.membership?.status !== 'PAID'
    return true
  })

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 font-serif">Membership Fees</h1>
          <p className="text-sm text-gray-500 mt-0.5">Track and manage season membership payments</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <select
            value={season}
            onChange={(e) => setSeason(Number(e.target.value))}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
          >
            {[CURRENT_YEAR + 1, CURRENT_YEAR, CURRENT_YEAR - 1].map((y) => (
              <option key={y} value={y}>{y} Season</option>
            ))}
          </select>
          <button
            onClick={() => setShowRemind(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            <Send className="h-4 w-4" /> Send Reminders
          </button>
          <button
            onClick={fetchData}
            className="flex items-center gap-2 border border-gray-200 hover:bg-gray-50 text-gray-600 text-sm px-3 py-2 rounded-lg transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Members', value: stats.total, color: 'text-gray-900' },
          { label: 'Paid', value: stats.paid, color: 'text-green-700' },
          { label: 'Unpaid', value: stats.unpaid, color: 'text-red-600' },
          { label: 'Revenue Collected', value: fmt(stats.revenue), color: 'text-cricket-green' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">{label}</div>
            <div className={`text-2xl font-bold ${color}`}>{value}</div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-4">
        {(['all', 'paid', 'unpaid'] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium capitalize transition-colors
              ${filter === f ? 'bg-cricket-green text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            {f} {f === 'all' ? `(${stats.total})` : f === 'paid' ? `(${stats.paid})` : `(${stats.unpaid})`}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-gray-400 text-sm">Loading...</div>
        ) : visible.length === 0 ? (
          <div className="py-16 text-center text-gray-400 text-sm">No members found</div>
        ) : (
          <>
            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-gray-100">
              {visible.map((m) => {
                const paid = m.membership?.status === 'PAID'
                return (
                  <div key={m.id} className="p-4">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <div className="font-semibold text-gray-900 text-sm">{m.firstName} {m.lastName}</div>
                        <div className="text-xs text-gray-500">{m.email}</div>
                        <div className="text-xs text-gray-400 mt-0.5">{TIER_LABELS[m.membershipTier] ?? m.membershipTier}</div>
                      </div>
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${paid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-700'}`}>
                        {paid ? 'Paid' : 'Unpaid'}
                      </span>
                    </div>
                    {paid && m.membership?.paidAt && (
                      <div className="text-xs text-gray-400 mb-2">
                        Paid {new Date(m.membership.paidAt).toLocaleDateString('en-GB')}
                        {m.membership.paymentChannel && ` · ${CHANNELS.find(c => c.value === m.membership!.paymentChannel)?.label ?? m.membership.paymentChannel}`}
                        {m.membership.amount && ` · ${fmt(m.membership.amount)}`}
                      </div>
                    )}
                    <div className="flex gap-2">
                      {!paid ? (
                        <button onClick={() => openMarkPaid(m)} className="flex items-center gap-1.5 text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg font-medium transition-colors">
                          <Check className="h-3 w-3" /> Mark Paid
                        </button>
                      ) : (
                        <button onClick={() => handleMarkUnpaid(m)} className="flex items-center gap-1.5 text-xs border border-red-200 text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg font-medium transition-colors">
                          <X className="h-3 w-3" /> Mark Unpaid
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {['Member', 'Email', 'Tier', 'Amount Due', 'Status', 'Paid At', 'Channel', 'Actions'].map((h) => (
                      <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {visible.map((m) => {
                    const paid = m.membership?.status === 'PAID'
                    return (
                      <tr key={m.id} className="hover:bg-gray-50">
                        <td className="px-5 py-3.5 font-medium text-gray-900 whitespace-nowrap">
                          {m.firstName} {m.lastName}
                        </td>
                        <td className="px-5 py-3.5 text-gray-500 text-xs">{m.email}</td>
                        <td className="px-5 py-3.5 text-gray-500 text-xs">{TIER_LABELS[m.membershipTier] ?? m.membershipTier}</td>
                        <td className="px-5 py-3.5 font-semibold text-gray-900">{fmt(m.amountDue)}</td>
                        <td className="px-5 py-3.5">
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${paid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-700'}`}>
                            {paid ? 'Paid' : 'Unpaid'}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-gray-400 text-xs whitespace-nowrap">
                          {m.membership?.paidAt ? new Date(m.membership.paidAt).toLocaleDateString('en-GB') : '—'}
                          {m.membership?.amount && paid ? ` · ${fmt(m.membership.amount)}` : ''}
                        </td>
                        <td className="px-5 py-3.5 text-gray-400 text-xs">
                          {m.membership?.paymentChannel
                            ? CHANNELS.find(c => c.value === m.membership!.paymentChannel)?.label ?? m.membership.paymentChannel
                            : '—'}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex gap-2">
                            {!paid ? (
                              <button onClick={() => openMarkPaid(m)} className="flex items-center gap-1 text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap">
                                <Check className="h-3 w-3" /> Mark Paid
                              </button>
                            ) : (
                              <button onClick={() => handleMarkUnpaid(m)} className="flex items-center gap-1 text-xs border border-red-200 text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap">
                                <X className="h-3 w-3" /> Mark Unpaid
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Mark Paid Modal */}
      {markingMember && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-1">Mark as Paid</h2>
            <p className="text-sm text-gray-500 mb-5">
              {markingMember.firstName} {markingMember.lastName} · {TIER_LABELS[markingMember.membershipTier]}
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">Payment Channel</label>
                <div className="relative">
                  <select
                    value={payChannel}
                    onChange={(e) => setPayChannel(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm appearance-none bg-white pr-8"
                  >
                    {CHANNELS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-3 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">Amount Paid (£)</label>
                <div className="relative">
                  <PoundSterling className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={payAmount}
                    onChange={(e) => setPayAmount(Number(e.target.value))}
                    className="w-full border border-gray-200 rounded-lg pl-8 pr-3 py-2.5 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">Notes (optional)</label>
                <input
                  type="text"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  placeholder="e.g. Paid at training on 12 Apr"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setMarkingMember(null)}
                className="flex-1 border border-gray-200 text-gray-600 hover:bg-gray-50 py-2.5 rounded-lg text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleMarkPaid}
                disabled={saving}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Confirm Paid'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Send Reminders Modal */}
      {showRemind && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-1">Send Payment Reminders</h2>
            <p className="text-sm text-gray-500 mb-5">
              Send reminder emails to all unpaid members for the {season} season.
            </p>

            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
                Only send to members registered at least...
              </label>
              <div className="relative">
                <select
                  value={remindDays}
                  onChange={(e) => setRemindDays(Number(e.target.value))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm appearance-none bg-white pr-8"
                >
                  <option value={0}>All unpaid members</option>
                  <option value={3}>3+ days ago</option>
                  <option value={7}>7+ days ago</option>
                  <option value={14}>14+ days ago</option>
                  <option value={30}>30+ days ago</option>
                </select>
                <ChevronDown className="absolute right-2.5 top-3 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mt-4 text-xs text-amber-800">
              This will email all unpaid members matching the above criteria for the {season} season.
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowRemind(false)}
                className="flex-1 border border-gray-200 text-gray-600 hover:bg-gray-50 py-2.5 rounded-lg text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSendReminders}
                disabled={sending}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
              >
                {sending ? 'Sending...' : 'Send Reminders'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
