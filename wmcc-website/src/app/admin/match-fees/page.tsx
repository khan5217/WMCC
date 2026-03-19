'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import axios from 'axios'
import toast from 'react-hot-toast'
import { RefreshCw, ChevronRight, PoundSterling, Settings } from 'lucide-react'

const CURRENT_YEAR = new Date().getFullYear()

interface MatchFee {
  matchId: string
  opposition: string
  date: string
  venue: string
  teamName: string
  total: number
  paid: number
  outstanding: number
  pending: number
  waived: number
  collected: number   // pence
  expected: number    // pence
}

function fmt(pence: number) {
  return `£${(pence / 100).toFixed(2)}`
}

export default function MatchFeesPage() {
  const [season, setSeason] = useState(CURRENT_YEAR)
  const [matches, setMatches] = useState<MatchFee[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await axios.get(`/api/admin/match-fees?season=${season}`)
      setMatches(res.data.matches)
    } catch {
      toast.error('Failed to load match fees')
    } finally {
      setLoading(false)
    }
  }, [season])

  useEffect(() => { fetchData() }, [fetchData])

  const totalCollected = matches.reduce((s, m) => s + m.collected, 0)
  const totalExpected = matches.reduce((s, m) => s + m.expected, 0)
  const totalOutstanding = matches.reduce((s, m) => s + m.outstanding + m.pending, 0)
  const totalMatches = matches.length

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 font-serif">Match Fees</h1>
          <p className="text-sm text-gray-500 mt-0.5">Track and collect match fees per fixture</p>
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
          <Link
            href="/admin/match-fees/products"
            className="flex items-center gap-2 border border-gray-200 hover:bg-gray-50 text-gray-600 text-sm px-3 py-2 rounded-lg transition-colors"
          >
            <Settings className="h-4 w-4" /> Fee Products
          </Link>
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
          { label: 'Matches with Fees', value: totalMatches, color: 'text-gray-900' },
          { label: 'Outstanding Players', value: totalOutstanding, color: 'text-red-600' },
          { label: 'Revenue Collected', value: fmt(totalCollected), color: 'text-cricket-green' },
          { label: 'Total Expected', value: fmt(totalExpected), color: 'text-gray-700' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">{label}</div>
            <div className={`text-2xl font-bold ${color}`}>{value}</div>
          </div>
        ))}
      </div>

      {/* Match list */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-gray-400 text-sm">Loading...</div>
        ) : matches.length === 0 ? (
          <div className="py-16 text-center">
            <PoundSterling className="h-10 w-10 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">No match fees set up for {season}.</p>
            <p className="text-gray-400 text-xs mt-1">Open a match to start assigning fees.</p>
          </div>
        ) : (
          <>
            {/* Mobile */}
            <div className="md:hidden divide-y divide-gray-100">
              {matches.map((m) => (
                <Link key={m.matchId} href={`/admin/match-fees/${m.matchId}`} className="block p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="min-w-0">
                      <div className="font-semibold text-gray-900 text-sm truncate">vs {m.opposition}</div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        {new Date(m.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} · {m.teamName}
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-300 shrink-0 mt-0.5" />
                  </div>
                  <div className="flex gap-3 flex-wrap">
                    <span className="text-xs bg-green-100 text-green-800 font-semibold px-2 py-0.5 rounded-full">{m.paid} paid</span>
                    {(m.outstanding + m.pending) > 0 && (
                      <span className="text-xs bg-red-100 text-red-700 font-semibold px-2 py-0.5 rounded-full">{m.outstanding + m.pending} unpaid</span>
                    )}
                    {m.waived > 0 && (
                      <span className="text-xs bg-gray-100 text-gray-600 font-semibold px-2 py-0.5 rounded-full">{m.waived} waived</span>
                    )}
                    <span className="text-xs text-gray-500 ml-auto">{fmt(m.collected)} / {fmt(m.expected)}</span>
                  </div>
                </Link>
              ))}
            </div>

            {/* Desktop */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {['Match', 'Date', 'Team', 'Paid', 'Outstanding', 'Collected', 'Expected', ''].map((h) => (
                      <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {matches.map((m) => (
                    <tr key={m.matchId} className="hover:bg-gray-50">
                      <td className="px-5 py-3.5 font-medium text-gray-900 whitespace-nowrap">vs {m.opposition}</td>
                      <td className="px-5 py-3.5 text-gray-500 text-xs whitespace-nowrap">
                        {new Date(m.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-5 py-3.5 text-gray-500 text-xs">{m.teamName}</td>
                      <td className="px-5 py-3.5">
                        <span className="text-xs bg-green-100 text-green-800 font-semibold px-2 py-0.5 rounded-full">{m.paid}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        {(m.outstanding + m.pending) > 0 ? (
                          <span className="text-xs bg-red-100 text-red-700 font-semibold px-2 py-0.5 rounded-full">{m.outstanding + m.pending}</span>
                        ) : (
                          <span className="text-gray-300 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 font-semibold text-cricket-green">{fmt(m.collected)}</td>
                      <td className="px-5 py-3.5 text-gray-500">{fmt(m.expected)}</td>
                      <td className="px-5 py-3.5">
                        <Link href={`/admin/match-fees/${m.matchId}`} className="flex items-center gap-1 text-xs text-cricket-green hover:underline font-medium whitespace-nowrap">
                          Manage <ChevronRight className="h-3 w-3" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      <p className="text-xs text-gray-400 mt-4">
        To add match fees, open a match from the <Link href="/admin/matches" className="text-cricket-green hover:underline">Matches</Link> list and manage fees directly, or click any match above.
      </p>
    </div>
  )
}
