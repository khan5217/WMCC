'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import axios from 'axios'
import toast from 'react-hot-toast'
import { Radio, Save } from 'lucide-react'

type Match = {
  id: string
  opposition: string
  date: string
  team: { name: string }
  isLive: boolean
  liveScore: string | null
  wmccScore: string | null
  oppositionScore: string | null
  cricheroesUrl: string | null
}

export default function LiveScorePage() {
  const { id } = useParams<{ id: string }>()
  const [match, setMatch] = useState<Match | null>(null)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ isLive: false, liveScore: '' })

  useEffect(() => {
    axios.get(`/api/matches/${id}`).then((res) => {
      setMatch(res.data)
      setForm({ isLive: res.data.isLive, liveScore: res.data.liveScore ?? '' })
    })
  }, [id])

  const handleSave = async () => {
    setLoading(true)
    try {
      await axios.patch(`/api/matches/${id}`, {
        isLive: form.isLive,
        liveScore: form.liveScore || null,
      })
      toast.success(form.isLive ? 'Live score updated!' : 'Match marked as not live')
    } catch {
      toast.error('Failed to update')
    } finally {
      setLoading(false)
    }
  }

  if (!match) return <div className="p-8 text-gray-400">Loading...</div>

  return (
    <div className="p-6 max-w-lg">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/matches" className="text-gray-400 hover:text-gray-600 text-sm">← Matches</Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-xl font-bold text-gray-900 font-serif flex items-center gap-2">
          <Radio className="h-5 w-5 text-red-500" /> Live Score
        </h1>
      </div>

      <div className="card p-4 mb-5 bg-gray-50">
        <div className="font-semibold text-gray-900">{match.team.name} vs {match.opposition}</div>
        <div className="text-sm text-gray-500 mt-0.5">{new Date(match.date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })}</div>
      </div>

      <div className="card p-5 space-y-5">
        {/* Live toggle */}
        <label className="flex items-center gap-3 cursor-pointer">
          <div className={`relative w-12 h-6 rounded-full transition-colors ${form.isLive ? 'bg-red-500' : 'bg-gray-300'}`}>
            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.isLive ? 'translate-x-7' : 'translate-x-1'}`} />
          </div>
          <input
            type="checkbox"
            className="sr-only"
            checked={form.isLive}
            onChange={(e) => setForm((f) => ({ ...f, isLive: e.target.checked }))}
          />
          <div>
            <div className="font-semibold text-gray-900 text-sm">
              {form.isLive ? '🔴 Match is LIVE' : 'Match not live'}
            </div>
            <div className="text-xs text-gray-400">Toggle when the match starts / ends</div>
          </div>
        </label>

        {/* Live score text */}
        <div>
          <label className="label">Current Score</label>
          <input
            type="text"
            className="input text-lg font-mono"
            placeholder="e.g.  WMCC 87/3 (18.2 ov)"
            value={form.liveScore}
            onChange={(e) => setForm((f) => ({ ...f, liveScore: e.target.value }))}
          />
          <p className="text-xs text-gray-400 mt-1">Free text — update this every few overs. Fans see this auto-refresh every 30 seconds.</p>
        </div>

        <button
          onClick={handleSave}
          disabled={loading}
          className="btn-primary w-full flex items-center justify-center gap-2 text-base py-3"
        >
          <Save className="h-4 w-4" />
          {loading ? 'Saving...' : 'Update Live Score'}
        </button>

        {match.cricheroesUrl && (
          <a
            href={match.cricheroesUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block text-center text-sm text-cricket-green hover:underline"
          >
            Open full scorecard on CricHeroes →
          </a>
        )}
      </div>

      <p className="text-xs text-gray-400 text-center mt-4">
        Bookmark this page on your phone for quick updates during the match.
      </p>
    </div>
  )
}
