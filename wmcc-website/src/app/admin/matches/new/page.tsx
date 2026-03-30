'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import axios from 'axios'
import toast from 'react-hot-toast'

type Team = { id: string; name: string; type: string; season: number }
type MatchEvent = { id: string; name: string; matches: { id: string; opposition: string }[] }

export default function NewMatchPage() {
  const router = useRouter()
  const [teams, setTeams] = useState<Team[]>([])
  const [teamsLoading, setTeamsLoading] = useState(true)
  const [creatingTeams, setCreatingTeams] = useState(false)
  const [loading, setLoading] = useState(false)
  const [existingEvents, setExistingEvents] = useState<MatchEvent[]>([])
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
    topScorer: '',
    topScorerRuns: '',
    topBowler: '',
    topBowlerWickets: '',
    cricheroesUrl: '',
    eventId: '',   // '' means auto-create a new event
    eventName: '', // custom name for a newly-created event (festival/tournament)
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

  // When date or teamId changes, fetch existing events on that day
  useEffect(() => {
    if (!form.date || !form.teamId) { setExistingEvents([]); return }
    axios.get(`/api/events?date=${form.date}&teamId=${form.teamId}`)
      .then((res) => {
        setExistingEvents(res.data)
        // Reset eventId if the previously selected event is no longer valid
        setForm((f) => {
          const valid = res.data.some((e: MatchEvent) => e.id === f.eventId)
          return valid ? f : { ...f, eventId: '' }
        })
      })
      .catch(() => setExistingEvents([]))
  }, [form.date, form.teamId])

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
        topScorer: form.topScorer || null,
        topScorerRuns: form.topScorerRuns ? parseInt(form.topScorerRuns) : null,
        topBowler: form.topBowler || null,
        topBowlerWickets: form.topBowlerWickets ? parseInt(form.topBowlerWickets) : null,
        cricheroesUrl: form.cricheroesUrl || null,
        eventId: form.eventId || null,
        eventName: (!form.eventId && form.eventName.trim()) ? form.eventName.trim() : null,
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

        {/* Festival Day — shown when existing events exist on this date */}
        {existingEvents.length > 0 && (() => {
          const selectedEvent = existingEvents.find(e => e.id === form.eventId)
          const sameOppMatches = selectedEvent
            ? selectedEvent.matches.filter(m => m.opposition.toLowerCase() === form.opposition.trim().toLowerCase())
            : []
          const matchNumber = sameOppMatches.length + 1
          const ordinal = (n: number) => {
            const s = ['th', 'st', 'nd', 'rd']
            const v = n % 100
            return n + (s[(v - 20) % 10] || s[v] || s[0])
          }
          return (
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 space-y-3">
              <p className="text-sm font-semibold text-blue-800">Festival / Double-header day detected</p>
              <p className="text-xs text-blue-600">
                There {existingEvents.length === 1 ? 'is already a match' : 'are already matches'} on this date. You can group this match into the same event so availability and fees are shared.
              </p>

              <div>
                <label className="label text-blue-700">Add to existing event</label>
                <select
                  className="input"
                  value={form.eventId}
                  onChange={(e) => { set('eventId', e.target.value); set('eventName', '') }}
                >
                  <option value="">Create a new event (separate availability &amp; fees)</option>
                  {existingEvents.map((ev) => (
                    <option key={ev.id} value={ev.id}>
                      {ev.name} ({ev.matches.map((m) => m.opposition).join(', ')})
                    </option>
                  ))}
                </select>
              </div>

              {/* New event: allow naming the tournament */}
              {!form.eventId && (
                <div>
                  <label className="label text-blue-700">Event / Tournament Name <span className="font-normal text-blue-500">(optional)</span></label>
                  <input
                    type="text"
                    className="input"
                    placeholder="e.g. Club Festival Day, Annual Tournament"
                    value={form.eventName}
                    onChange={(e) => set('eventName', e.target.value)}
                  />
                  <p className="text-xs text-blue-500 mt-1">Leave blank to auto-name as &quot;vs {form.opposition || 'Opposition'}&quot;</p>
                </div>
              )}

              {/* Existing event: show match number when same opposition already exists */}
              {form.eventId && sameOppMatches.length > 0 && form.opposition.trim() && (
                <div className="flex items-center gap-2 rounded bg-blue-100 border border-blue-200 px-3 py-2">
                  <span className="text-blue-700 text-xs font-medium">
                    This will be the <strong>{ordinal(matchNumber)} Match</strong> vs {form.opposition.trim()} in this event.
                  </span>
                </div>
              )}
            </div>
          )
        })()}

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
            placeholder="e.g. Bucks League"
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
          <p className="text-xs text-gray-400 mt-1">Paste the match scorecard link from the CricHeroes app.</p>
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
