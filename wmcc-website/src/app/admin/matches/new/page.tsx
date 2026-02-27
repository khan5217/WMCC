'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import axios from 'axios'
import toast from 'react-hot-toast'

type Team = { id: string; name: string; type: string; season: number }

export default function NewMatchPage() {
  const router = useRouter()
  const [teams, setTeams] = useState<Team[]>([])
  const [teamsLoading, setTeamsLoading] = useState(true)
  const [creatingTeams, setCreatingTeams] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    teamId: '',
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
  })

  const fetchTeams = () => {
    setTeamsLoading(true)
    axios.get('/api/teams')
      .then((res) => {
        setTeams(res.data)
        if (res.data.length > 0) {
          setForm((f) => ({ ...f, teamId: res.data[0].id }))
        }
      })
      .finally(() => setTeamsLoading(false))
  }

  useEffect(() => { fetchTeams() }, [])

  const handleCreateDefaultTeams = async () => {
    setCreatingTeams(true)
    const season = new Date().getFullYear()
    try {
      await Promise.all([
        axios.post('/api/teams', { name: 'WMCC 1st XI', type: 'FIRST_XI', season }),
        axios.post('/api/teams', { name: 'WMCC 2nd XI', type: 'SECOND_XI', season }),
      ])
      toast.success(`1st XI and 2nd XI created for ${season}`)
      fetchTeams()
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? 'Failed to create teams')
    } finally {
      setCreatingTeams(false)
    }
  }

  const set = (field: string, value: any) => setForm((f) => ({ ...f, [field]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await axios.post('/api/matches', {
        teamId: form.teamId,
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
      })
      toast.success('Match created!')
      router.push('/admin/matches')
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? 'Failed to create match')
    } finally {
      setLoading(false)
    }
  }

  if (teamsLoading) {
    return <div className="p-8 text-gray-400 text-sm">Loading...</div>
  }

  return (
    <div className="p-8 max-w-2xl">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/admin/matches" className="text-gray-400 hover:text-gray-600 text-sm">← Matches</Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-2xl font-bold text-gray-900 font-serif">Add Match</h1>
      </div>

      {/* No teams warning */}
      {teams.length === 0 && (
        <div className="card p-5 mb-6 bg-yellow-50 border border-yellow-200">
          <p className="text-sm font-medium text-yellow-800 mb-1">No teams set up yet</p>
          <p className="text-xs text-yellow-700 mb-3">You need at least one team before adding a match.</p>
          <button
            onClick={handleCreateDefaultTeams}
            disabled={creatingTeams}
            className="btn-primary text-sm"
          >
            {creatingTeams ? 'Creating...' : `Create 1st XI & 2nd XI for ${new Date().getFullYear()}`}
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="card p-6 space-y-5">
        {/* Team + Format */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Team *</label>
            <select className="input" required value={form.teamId} onChange={(e) => set('teamId', e.target.value)}>
              <option value="">Select team...</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.season})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Format *</label>
            <select className="input" value={form.format} onChange={(e) => set('format', e.target.value)}>
              <option value="ONE_DAY">One Day</option>
              <option value="T20">T20</option>
              <option value="TWO_DAY">Two Day</option>
              <option value="FRIENDLY">Friendly</option>
            </select>
          </div>
        </div>

        {/* Opposition */}
        <div>
          <label className="label">Opposition *</label>
          <input
            type="text"
            className="input"
            required
            placeholder="e.g. Northampton CC"
            value={form.opposition}
            onChange={(e) => set('opposition', e.target.value)}
          />
        </div>

        {/* Venue + Date */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Venue *</label>
            <input
              type="text"
              className="input"
              required
              placeholder="e.g. WMCC Ground"
              value={form.venue}
              onChange={(e) => set('venue', e.target.value)}
            />
          </div>
          <div>
            <label className="label">Date *</label>
            <input
              type="date"
              className="input"
              required
              value={form.date}
              onChange={(e) => set('date', e.target.value)}
            />
          </div>
        </div>

        {/* Home/Away + Result */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Home / Away</label>
            <select className="input" value={form.isHome} onChange={(e) => set('isHome', e.target.value)}>
              <option value="home">Home</option>
              <option value="away">Away</option>
            </select>
          </div>
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
        </div>

        {/* Scores */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">WMCC Score</label>
            <input
              type="text"
              className="input"
              placeholder="e.g. 187/6"
              value={form.wmccScore}
              onChange={(e) => set('wmccScore', e.target.value)}
            />
          </div>
          <div>
            <label className="label">WMCC Overs</label>
            <input
              type="number"
              className="input"
              placeholder="e.g. 40"
              step="0.1"
              min="0"
              value={form.wmccOvers}
              onChange={(e) => set('wmccOvers', e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Opposition Score</label>
            <input
              type="text"
              className="input"
              placeholder="e.g. 183/8"
              value={form.oppositionScore}
              onChange={(e) => set('oppositionScore', e.target.value)}
            />
          </div>
          <div>
            <label className="label">Opposition Overs</label>
            <input
              type="number"
              className="input"
              placeholder="e.g. 40"
              step="0.1"
              min="0"
              value={form.oppositionOvers}
              onChange={(e) => set('oppositionOvers', e.target.value)}
            />
          </div>
        </div>

        {/* League */}
        <div>
          <label className="label">League / Competition</label>
          <input
            type="text"
            className="input"
            placeholder="e.g. South Northants League"
            value={form.leagueName}
            onChange={(e) => set('leagueName', e.target.value)}
          />
        </div>

        {/* Match report */}
        <div>
          <label className="label">Match Report</label>
          <textarea
            className="input"
            rows={3}
            placeholder="Brief match summary..."
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
          />
        </div>

        {/* Featured */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="isFeatured"
            checked={form.isFeatured}
            onChange={(e) => set('isFeatured', e.target.checked)}
            className="rounded border-gray-300"
          />
          <label htmlFor="isFeatured" className="text-sm text-gray-700">Feature this match on the homepage</label>
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading || teams.length === 0} className="btn-primary">
            {loading ? 'Creating...' : 'Create Match'}
          </button>
          <Link href="/admin/matches" className="btn-secondary">Cancel</Link>
        </div>
      </form>
    </div>
  )
}
