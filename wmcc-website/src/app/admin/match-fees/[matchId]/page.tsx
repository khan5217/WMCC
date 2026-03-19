'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import axios from 'axios'
import toast from 'react-hot-toast'
import {
  ChevronLeft, Plus, Send, Bell, Check, X, Trash2,
  PoundSterling, ChevronDown, User, RefreshCw,
} from 'lucide-react'

interface FeeProduct {
  id: string
  name: string
  starterAmount: number
  subAmount: number
}

interface Assignment {
  id: string
  playerId: string
  playerType: 'STARTER' | 'SUB'
  amount: number
  status: 'PENDING' | 'PAID' | 'OUTSTANDING' | 'WAIVED'
  paidAt: string | null
  paymentChannel: string | null
  paymentLinkSentAt: string | null
  reminderCount: number
  notes: string | null
  player: {
    user: { firstName: string; lastName: string; email: string }
    contactEmail: string | null
    jerseyNumber: number | null
  }
  feeProduct: { name: string; starterAmount: number; subAmount: number } | null
}

interface Player {
  id: string
  user: { firstName: string; lastName: string; email: string }
  contactEmail: string | null
  jerseyNumber: number | null
}

interface MatchInfo {
  opposition: string
  date: string
  venue: string
  team: { name: string }
}

const CHANNELS = [
  { value: 'cash', label: 'Cash' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'stripe', label: 'Stripe (Online)' },
  { value: 'other', label: 'Other' },
]

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  PAID: 'bg-green-100 text-green-800',
  OUTSTANDING: 'bg-red-100 text-red-700',
  WAIVED: 'bg-gray-100 text-gray-600',
}

function fmt(pence: number) {
  return `£${(pence / 100).toFixed(2)}`
}

export default function MatchFeePage() {
  const { matchId } = useParams<{ matchId: string }>()

  const [matchInfo, setMatchInfo] = useState<MatchInfo | null>(null)
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [players, setPlayers] = useState<Player[]>([])
  const [products, setProducts] = useState<FeeProduct[]>([])
  const [loading, setLoading] = useState(true)

  // Add player modal
  const [showAdd, setShowAdd] = useState(false)
  const [addPlayerId, setAddPlayerId] = useState('')
  const [addProductId, setAddProductId] = useState('')
  const [addPlayerType, setAddPlayerType] = useState<'STARTER' | 'SUB'>('STARTER')
  const [addAmount, setAddAmount] = useState('')
  const [addNotes, setAddNotes] = useState('')
  const [addSaving, setAddSaving] = useState(false)

  // Mark paid modal
  const [markingId, setMarkingId] = useState<string | null>(null)
  const [payChannel, setPayChannel] = useState('cash')
  const [markSaving, setMarkSaving] = useState(false)

  // Sending state
  const [sendingLinks, setSendingLinks] = useState(false)
  const [sendingReminders, setSendingReminders] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [matchRes, assignRes, playersRes, productsRes] = await Promise.all([
        axios.get(`/api/matches/${matchId}`),
        axios.get(`/api/admin/match-fees/${matchId}/assignments`),
        axios.get('/api/admin/players-list'),
        axios.get('/api/admin/match-fees/products'),
      ])
      setMatchInfo(matchRes.data)
      setAssignments(assignRes.data)
      setPlayers(playersRes.data)
      setProducts(productsRes.data)
    } catch {
      toast.error('Failed to load match data')
    } finally {
      setLoading(false)
    }
  }, [matchId])

  useEffect(() => { fetchData() }, [fetchData])

  // Auto-fill amount when product or playerType changes in add modal
  useEffect(() => {
    if (!addProductId) return
    const product = products.find((p) => p.id === addProductId)
    if (!product) return
    const amount = addPlayerType === 'STARTER' ? product.starterAmount : product.subAmount
    setAddAmount(String(amount / 100))
  }, [addProductId, addPlayerType, products])

  const assignedPlayerIds = new Set(assignments.map((a) => a.playerId))
  const availablePlayers = players.filter((p) => !assignedPlayerIds.has(p.id))

  const handleAddPlayer = async () => {
    if (!addPlayerId) return toast.error('Select a player')
    if (!addAmount) return toast.error('Enter a fee amount')
    setAddSaving(true)
    try {
      await axios.post(`/api/admin/match-fees/${matchId}/assignments`, {
        playerId: addPlayerId,
        feeProductId: addProductId || null,
        playerType: addPlayerType,
        amount: Math.round(parseFloat(addAmount) * 100),
        notes: addNotes || null,
      })
      toast.success('Player added')
      setShowAdd(false)
      setAddPlayerId('')
      setAddProductId('')
      setAddPlayerType('STARTER')
      setAddAmount('')
      setAddNotes('')
      fetchData()
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? 'Failed to add player')
    } finally {
      setAddSaving(false)
    }
  }

  const handleMarkPaid = async () => {
    if (!markingId) return
    setMarkSaving(true)
    try {
      await axios.patch(`/api/admin/match-fees/${matchId}/assignments/${markingId}`, {
        status: 'PAID',
        paymentChannel: payChannel,
      })
      toast.success('Marked as paid')
      setMarkingId(null)
      fetchData()
    } catch {
      toast.error('Failed to update')
    } finally {
      setMarkSaving(false)
    }
  }

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await axios.patch(`/api/admin/match-fees/${matchId}/assignments/${id}`, { status })
      fetchData()
    } catch {
      toast.error('Failed to update status')
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Remove ${name} from match fees?`)) return
    try {
      await axios.delete(`/api/admin/match-fees/${matchId}/assignments/${id}`)
      toast.success('Removed')
      fetchData()
    } catch {
      toast.error('Failed to remove')
    }
  }

  const handleSendLinks = async () => {
    setSendingLinks(true)
    try {
      const res = await axios.post(`/api/admin/match-fees/${matchId}/send-links`)
      toast.success(`Payment links sent: ${res.data.sent} sent${res.data.skipped > 0 ? `, ${res.data.skipped} skipped (no email)` : ''}`)
      fetchData()
    } catch {
      toast.error('Failed to send links')
    } finally {
      setSendingLinks(false)
    }
  }

  const handleSendReminders = async () => {
    setSendingReminders(true)
    try {
      const res = await axios.post(`/api/admin/match-fees/${matchId}/remind`)
      toast.success(`Reminders sent: ${res.data.sent} sent${res.data.skipped > 0 ? `, ${res.data.skipped} skipped` : ''}`)
      fetchData()
    } catch {
      toast.error('Failed to send reminders')
    } finally {
      setSendingReminders(false)
    }
  }

  const paid = assignments.filter((a) => a.status === 'PAID').length
  const outstanding = assignments.filter((a) => a.status === 'OUTSTANDING').length
  const pending = assignments.filter((a) => a.status === 'PENDING').length
  const collected = assignments.filter((a) => a.status === 'PAID').reduce((s, a) => s + a.amount, 0)
  const expected = assignments.filter((a) => a.status !== 'WAIVED').reduce((s, a) => s + a.amount, 0)

  const markingAssignment = assignments.find((a) => a.id === markingId)

  return (
    <div className="p-4 md:p-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/match-fees" className="flex items-center gap-1 text-gray-400 hover:text-gray-600 text-sm">
          <ChevronLeft className="h-4 w-4" /> Match Fees
        </Link>
        {matchInfo && (
          <>
            <span className="text-gray-300">/</span>
            <span className="text-sm text-gray-700 font-medium">vs {matchInfo.opposition}</span>
          </>
        )}
      </div>

      {loading ? (
        <div className="py-16 text-center text-gray-400 text-sm">Loading...</div>
      ) : (
        <>
          {/* Match header */}
          {matchInfo && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h1 className="text-xl font-bold text-gray-900">vs {matchInfo.opposition}</h1>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {new Date(matchInfo.date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    {' · '}{matchInfo.venue}{' · '}{matchInfo.team.name}
                  </p>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => setShowAdd(true)}
                    className="flex items-center gap-2 btn-primary text-sm"
                  >
                    <Plus className="h-4 w-4" /> Add Player
                  </button>
                  <button
                    onClick={handleSendLinks}
                    disabled={sendingLinks || assignments.filter((a) => a.status === 'PENDING').length === 0}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                    title="Send payment links to all pending players"
                  >
                    <Send className="h-4 w-4" /> {sendingLinks ? 'Sending...' : 'Send Links'}
                  </button>
                  <button
                    onClick={handleSendReminders}
                    disabled={sendingReminders || outstanding === 0}
                    className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                    title="Send reminders to all outstanding players"
                  >
                    <Bell className="h-4 w-4" /> {sendingReminders ? 'Sending...' : 'Remind'}
                  </button>
                  <button onClick={fetchData} className="p-2 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50">
                    <RefreshCw className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {[
              { label: 'Total Players', value: assignments.length, color: 'text-gray-900' },
              { label: 'Paid', value: paid, color: 'text-green-700' },
              { label: 'Outstanding', value: outstanding + pending, color: 'text-red-600' },
              { label: `Collected / Expected`, value: `${fmt(collected)} / ${fmt(expected)}`, color: 'text-cricket-green' },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">{label}</div>
                <div className={`text-xl font-bold ${color}`}>{value}</div>
              </div>
            ))}
          </div>

          {/* Assignments table */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            {assignments.length === 0 ? (
              <div className="py-14 text-center">
                <User className="h-10 w-10 text-gray-200 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">No players assigned fees yet.</p>
                <button onClick={() => setShowAdd(true)} className="mt-3 text-sm text-cricket-green hover:underline font-medium">
                  Add first player
                </button>
              </div>
            ) : (
              <>
                {/* Mobile */}
                <div className="md:hidden divide-y divide-gray-100">
                  {assignments.map((a) => {
                    const isGuest = a.player.user.email?.includes('@wmcc.internal')
                    const email = isGuest ? a.player.contactEmail : a.player.user.email
                    return (
                      <div key={a.id} className="p-4">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div>
                            <div className="font-semibold text-gray-900 text-sm">{a.player.user.firstName} {a.player.user.lastName}</div>
                            <div className="text-xs text-gray-400">{email ?? 'No email'}</div>
                            <div className="flex gap-2 mt-1 flex-wrap">
                              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                                {a.playerType === 'STARTER' ? 'Starter' : 'Sub'}
                              </span>
                              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[a.status]}`}>
                                {a.status}
                              </span>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="font-bold text-gray-900">{fmt(a.amount)}</div>
                            {a.paymentLinkSentAt && (
                              <div className="text-xs text-gray-400">Link sent</div>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          {a.status !== 'PAID' && a.status !== 'WAIVED' && (
                            <button
                              onClick={() => { setMarkingId(a.id); setPayChannel('cash') }}
                              className="flex items-center gap-1 text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg font-medium"
                            >
                              <Check className="h-3 w-3" /> Mark Paid
                            </button>
                          )}
                          {a.status === 'PAID' && (
                            <button
                              onClick={() => handleStatusChange(a.id, 'OUTSTANDING')}
                              className="flex items-center gap-1 text-xs border border-red-200 text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg font-medium"
                            >
                              <X className="h-3 w-3" /> Undo Paid
                            </button>
                          )}
                          {a.status !== 'WAIVED' && a.status !== 'PAID' && (
                            <button
                              onClick={() => handleStatusChange(a.id, 'WAIVED')}
                              className="text-xs border border-gray-200 text-gray-500 hover:bg-gray-50 px-3 py-1.5 rounded-lg font-medium"
                            >
                              Waive
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(a.id, `${a.player.user.firstName} ${a.player.user.lastName}`)}
                            className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg ml-auto"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Desktop */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        {['Player', 'Email', 'Type', 'Amount', 'Status', 'Paid At', 'Channel', 'Link Sent', 'Reminders', 'Actions'].map((h) => (
                          <th key={h} className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {assignments.map((a) => {
                        const isGuest = a.player.user.email?.includes('@wmcc.internal')
                        const email = isGuest ? a.player.contactEmail : a.player.user.email
                        return (
                          <tr key={a.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">
                              {a.player.user.firstName} {a.player.user.lastName}
                              {isGuest && <span className="ml-1 text-xs text-gray-400">(guest)</span>}
                            </td>
                            <td className="px-4 py-3 text-gray-500 text-xs">{email ?? <span className="text-red-400">No email</span>}</td>
                            <td className="px-4 py-3">
                              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                                {a.playerType === 'STARTER' ? 'Starter' : 'Sub'}
                              </span>
                            </td>
                            <td className="px-4 py-3 font-semibold text-gray-900">{fmt(a.amount)}</td>
                            <td className="px-4 py-3">
                              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[a.status]}`}>
                                {a.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                              {a.paidAt ? new Date(a.paidAt).toLocaleDateString('en-GB') : '—'}
                            </td>
                            <td className="px-4 py-3 text-gray-400 text-xs">
                              {a.paymentChannel ? CHANNELS.find((c) => c.value === a.paymentChannel)?.label ?? a.paymentChannel : '—'}
                            </td>
                            <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                              {a.paymentLinkSentAt ? new Date(a.paymentLinkSentAt).toLocaleDateString('en-GB') : '—'}
                            </td>
                            <td className="px-4 py-3 text-gray-400 text-xs text-center">
                              {a.reminderCount > 0 ? a.reminderCount : '—'}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex gap-1">
                                {a.status !== 'PAID' && a.status !== 'WAIVED' && (
                                  <button
                                    onClick={() => { setMarkingId(a.id); setPayChannel('cash') }}
                                    className="flex items-center gap-1 text-xs bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded font-medium whitespace-nowrap"
                                  >
                                    <Check className="h-3 w-3" /> Paid
                                  </button>
                                )}
                                {a.status === 'PAID' && (
                                  <button
                                    onClick={() => handleStatusChange(a.id, 'OUTSTANDING')}
                                    className="text-xs border border-gray-200 text-gray-500 hover:bg-gray-50 px-2 py-1 rounded whitespace-nowrap"
                                  >
                                    Undo
                                  </button>
                                )}
                                {a.status !== 'WAIVED' && a.status !== 'PAID' && (
                                  <button
                                    onClick={() => handleStatusChange(a.id, 'WAIVED')}
                                    className="text-xs border border-gray-200 text-gray-500 hover:bg-gray-50 px-2 py-1 rounded"
                                  >
                                    Waive
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDelete(a.id, `${a.player.user.firstName} ${a.player.user.lastName}`)}
                                  className="p-1 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded ml-1"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
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
        </>
      )}

      {/* Add Player Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">Add Player to Match Fees</h2>
              <button onClick={() => setShowAdd(false)} className="p-1 text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">Player *</label>
                <div className="relative">
                  <select
                    value={addPlayerId}
                    onChange={(e) => setAddPlayerId(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm appearance-none bg-white pr-8"
                  >
                    <option value="">Select a player...</option>
                    {availablePlayers.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.user.firstName} {p.user.lastName}
                        {p.user.email?.includes('@wmcc.internal') ? ' (guest)' : ''}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-3 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
                {availablePlayers.length === 0 && (
                  <p className="text-xs text-gray-400 mt-1">All players are already assigned. <Link href="/admin/players/new" className="text-cricket-green hover:underline">Add a new player</Link>.</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">Player Type</label>
                  <div className="relative">
                    <select
                      value={addPlayerType}
                      onChange={(e) => setAddPlayerType(e.target.value as 'STARTER' | 'SUB')}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm appearance-none bg-white pr-8"
                    >
                      <option value="STARTER">Starter</option>
                      <option value="SUB">Substitute</option>
                    </select>
                    <ChevronDown className="absolute right-2.5 top-3 h-4 w-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">Fee Product</label>
                  <div className="relative">
                    <select
                      value={addProductId}
                      onChange={(e) => setAddProductId(e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm appearance-none bg-white pr-8"
                    >
                      <option value="">None (manual)</option>
                      {products.filter((p) => p.isActive !== false).map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2.5 top-3 h-4 w-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">Amount (£) *</label>
                <div className="relative">
                  <PoundSterling className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <input
                    type="number"
                    min="0"
                    step="0.50"
                    value={addAmount}
                    onChange={(e) => setAddAmount(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg pl-8 pr-3 py-2.5 text-sm"
                    placeholder="e.g. 10.00"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">Notes (optional)</label>
                <input
                  type="text"
                  value={addNotes}
                  onChange={(e) => setAddNotes(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm"
                  placeholder="Optional note"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAdd(false)}
                className="flex-1 border border-gray-200 text-gray-600 hover:bg-gray-50 py-2.5 rounded-lg text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddPlayer}
                disabled={addSaving}
                className="flex-1 bg-cricket-green hover:bg-cricket-dark text-white py-2.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
              >
                {addSaving ? 'Adding...' : 'Add Player'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mark Paid Modal */}
      {markingId && markingAssignment && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-1">Mark as Paid</h2>
            <p className="text-sm text-gray-500 mb-5">
              {markingAssignment.player.user.firstName} {markingAssignment.player.user.lastName} · {fmt(markingAssignment.amount)}
            </p>

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

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setMarkingId(null)}
                className="flex-1 border border-gray-200 text-gray-600 hover:bg-gray-50 py-2.5 rounded-lg text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleMarkPaid}
                disabled={markSaving}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
              >
                {markSaving ? 'Saving...' : 'Confirm Paid'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
