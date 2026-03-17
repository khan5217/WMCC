'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import axios from 'axios'
import toast from 'react-hot-toast'

type Team = { id: string; name: string; type: string; season: number }

export default function EditMatchPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [teams, setTeams] = useState<Team[]>([])
  const [form, setForm] = useState({
    opposition: '',
    venue: '',
    isHome: 'home',
    date: '',
    format: 'ONE_DAY',
    result: '',
    wmccScore: '',
    wmccOvers: '',
    oppositionScore: '',
    oppositionOvers: '',
    leagueName: '',
    description: '',
    isFeatured: false,
    topScorer: '',
    topScorerRuns: '',
    topBowler: '',
    topBowlerWickets: '',
    cricheroesUrl: '',
  })

  useEffect(() => {
    Promise.all([
      axios.get(`/api/matches/${id}`),
      axios.get('/api/teams'),
    ]).then(([matchRes, teamsRes]) => {
      const m = matchRes.data
      setTeams(teamsRes.data)
      setForm({
        opposition: m.opposition ?? '',
        venue: m.venue ?? '',
        isHome: m.isHome ? 'home' : 'away',
        date: m.date ? m.date.slice(0, 10) : '',
        format: m.format ?? 'ONE_DAY',
        result: m.result ?? '',
        wmccScore: m.wmccScore ?? '',
        wmccOvers: m.wmccOvers?.toString() ?? '',
        oppositionScore: m.oppositionScore ?? '',
        oppositionOvers: m.oppositionOvers?.toString() ?? '',
        leagueName: m.leagueName ?? '',
        description: m.description ?? '',
        isFeatured: m.isFeatured ?? false,
        topScorer: m.topScorer ?? '',
        topScorerRuns: m.topScorerRuns?.toString() ?? '',
        topBowler: m.topBowler ?? '',
        topBowlerWickets: m.topBowlerWickets?.toString() ?? '',
        cricheroesUrl: m.cricheroesUrl ?? '',
      })
    }).catch(() => {
      toast.error('Failed to load match')
    }).finally(() => setFetching(false))
  }, [id])

  const set = (field: string, value: any) => setForm((f) => ({ ...f, [field]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await axios.patch(`/api/matches/${id}`, {
        opposition: form.opposition,
        venue: form.venue,
        isHome: form.isHome === 'home',
        date: form.date,
        format: form.format,
        result: form.result || null,
        wmccScore: form.wmccScore || null,
        wmccOvers: form.wmccOvers ? parseFloat(form.wmccOvers) : null,
        oppositionScore: form.oppositionScore || null,
        oppositionOvers: form.oppositionOvers ? parseFloat(form.oppositionOvers) : null,
        leagueName: form.leagueName || null,
        description: form.description || null,
        isFeatured: form.isFeatured,
        topScorer: form.topScorer || null,
        topScorerRuns: form.topScorerRuns ? parseInt(form.topScorerRuns) : null,
        topBowler: form.topBowler || null,
        topBowlerWickets: form.topBowlerWickets ? parseInt(form.topBowlerWickets) : null,
        cricheroesUrl: form.cricheroesUrl || null,
      })
      toast.success('Match updated!')
      router.push('/admin/matches')
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? 'Failed to update match')
    } finally {
      setLoading(false)
    }
  }

  if (fetching) return <div className="p-8 text-gray-400 text-sm">Loading...</div>

  return (
    <div className="p-8 max-w-2xl">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/admin/matches" className="text-gray-400 hover:text-gray-600 text-sm">← Matches</Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-2xl font-bold text-gray-900 font-serif">Edit Match</h1>
      </div>

      <form onSubmit={handleSubmit} className="card p-6 space-y-5">
        {/* Format */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Format *</label>
            <select className="input" value={form.format} onChange={(e) => set('format', e.target.value)}>
              <option value="ONE_DAY">One Day</option>
              <option value="T20">T20</option>
              <option value="TWO_DAY">Two Day</option>
              <option value="FRIENDLY">Friendly</option>
            </select>
          </div>
          <div>
            <label className="label">Home / Away</label>
            <select className="input" value={form.isHome} onChange={(e) => set('isHome', e.target.value)}>
              <option value="home">Home</option>
              <option value="away">Away</option>
            </select>
          </div>
        </div>

        {/* Opposition */}
        <div>
          <label className="label">Opposition *</label>
          <input type="text" className="input" required placeholder="e.g. Northampton CC" value={form.opposition} onChange={(e) => set('opposition', e.target.value)} />
        </div>

        {/* Venue + Date */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Venue *</label>
            <input type="text" className="input" required placeholder="e.g. WMCC Ground" value={form.venue} onChange={(e) => set('venue', e.target.value)} />
          </div>
          <div>
            <label className="label">Date *</label>
            <input type="date" className="input" required value={form.date} onChange={(e) => set('date', e.target.value)} />
          </div>
        </div>

        {/* Result */}
        <div>
          <label className="label">Result</label>
          <select className="input" value={form.result} onChange={(e) => set('result', e.target.value)}>
            <option value="">— Not played yet —</option>
            <option value="WIN">Win</option>
            <option value="LOSS">Loss</option>
            <option value="DRAW">Draw</option>
            <option value="TIE">Tie</option>
            <option value="NO_RESULT">No Result</option>
            <option value="ABANDONED">Abandoned</option>
          </select>
        </div>

        {/* Scores */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">WMCC Score</label>
            <input type="text" className="input" placeholder="e.g. 187/6" value={form.wmccScore} onChange={(e) => set('wmccScore', e.target.value)} />
          </div>
          <div>
            <label className="label">WMCC Overs</label>
            <input type="number" className="input" placeholder="e.g. 40" step="0.1" min="0" value={form.wmccOvers} onChange={(e) => set('wmccOvers', e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Opposition Score</label>
            <input type="text" className="input" placeholder="e.g. 183/8" value={form.oppositionScore} onChange={(e) => set('oppositionScore', e.target.value)} />
          </div>
          <div>
            <label className="label">Opposition Overs</label>
            <input type="number" className="input" placeholder="e.g. 40" step="0.1" min="0" value={form.oppositionOvers} onChange={(e) => set('oppositionOvers', e.target.value)} />
          </div>
        </div>

        {/* League */}
        <div>
          <label className="label">League / Competition</label>
          <input type="text" className="input" placeholder="e.g. Bucks League" value={form.leagueName} onChange={(e) => set('leagueName', e.target.value)} />
        </div>

        {/* Match report */}
        <div>
          <label className="label">Match Report</label>
          <textarea className="input" rows={3} placeholder="Brief match summary..." value={form.description} onChange={(e) => set('description', e.target.value)} />
        </div>

        {/* Key Performers */}
        <div className="border-t pt-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Key Performers (optional)</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Top Scorer</label>
              <input type="text" className="input" placeholder="e.g. J. Smith" value={form.topScorer} onChange={(e) => set('topScorer', e.target.value)} />
            </div>
            <div>
              <label className="label">Runs Scored</label>
              <input type="number" className="input" placeholder="78" min="0" value={form.topScorerRuns} onChange={(e) => set('topScorerRuns', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-3">
            <div>
              <label className="label">Top Bowler</label>
              <input type="text" className="input" placeholder="e.g. A. Khan" value={form.topBowler} onChange={(e) => set('topBowler', e.target.value)} />
            </div>
            <div>
              <label className="label">Wickets Taken</label>
              <input type="number" className="input" placeholder="4" min="0" value={form.topBowlerWickets} onChange={(e) => set('topBowlerWickets', e.target.value)} />
            </div>
          </div>
        </div>

        {/* CricHeroes URL */}
        <div>
          <label className="label">CricHeroes Scorecard URL</label>
          <input type="url" className="input" placeholder="https://cricheroes.com/..." value={form.cricheroesUrl} onChange={(e) => set('cricheroesUrl', e.target.value)} />
        </div>

        {/* Featured */}
        <div className="flex items-center gap-2">
          <input type="checkbox" id="isFeatured" checked={form.isFeatured} onChange={(e) => set('isFeatured', e.target.checked)} className="rounded border-gray-300" />
          <label htmlFor="isFeatured" className="text-sm text-gray-700">Feature this match on the homepage</label>
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
          <Link href="/admin/matches" className="btn-secondary">Cancel</Link>
        </div>
      </form>
    </div>
  )
}
