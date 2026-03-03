'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import axios from 'axios'
import toast from 'react-hot-toast'

export default function EditPlayerPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [playerName, setPlayerName] = useState('')
  const [form, setForm] = useState({
    jerseyNumber: '',
    role: 'ALL_ROUNDER',
    battingStyle: 'RIGHT_HAND',
    bowlingStyle: 'DOES_NOT_BOWL',
    bio: '',
    nationality: '',
    isActive: true,
    totalMatches: '',
    totalRuns: '',
    highestScore: '',
    battingAvg: '',
    strikeRate: '',
    totalWickets: '',
    bestBowling: '',
    bowlingAvg: '',
    economy: '',
    cricheroesUrl: '',
  })

  useEffect(() => {
    axios.get(`/api/players/${id}`)
      .then((res) => {
        const p = res.data
        setPlayerName(`${p.user.firstName} ${p.user.lastName}`)
        setForm({
          jerseyNumber: p.jerseyNumber?.toString() ?? '',
          role: p.role,
          battingStyle: p.battingStyle,
          bowlingStyle: p.bowlingStyle,
          bio: p.bio ?? '',
          nationality: p.nationality ?? '',
          isActive: p.isActive,
          totalMatches: p.totalMatches?.toString() ?? '0',
          totalRuns: p.totalRuns?.toString() ?? '0',
          highestScore: p.highestScore?.toString() ?? '0',
          battingAvg: p.battingAvg?.toString() ?? '0',
          strikeRate: p.strikeRate?.toString() ?? '0',
          totalWickets: p.totalWickets?.toString() ?? '0',
          bestBowling: p.bestBowling ?? '',
          bowlingAvg: p.bowlingAvg?.toString() ?? '0',
          economy: p.economy?.toString() ?? '0',
          cricheroesUrl: p.cricheroesUrl ?? '',
        })
      })
      .catch(() => toast.error('Failed to load player'))
      .finally(() => setFetching(false))
  }, [id])

  const set = (field: string, value: any) => setForm((f) => ({ ...f, [field]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await axios.patch(`/api/players/${id}`, {
        jerseyNumber: form.jerseyNumber ? parseInt(form.jerseyNumber) : null,
        role: form.role,
        battingStyle: form.battingStyle,
        bowlingStyle: form.bowlingStyle,
        bio: form.bio || null,
        nationality: form.nationality || null,
        isActive: form.isActive,
        totalMatches: form.totalMatches ? parseInt(form.totalMatches) : 0,
        totalRuns: form.totalRuns ? parseInt(form.totalRuns) : 0,
        highestScore: form.highestScore ? parseInt(form.highestScore) : 0,
        battingAvg: form.battingAvg ? parseFloat(form.battingAvg) : 0,
        strikeRate: form.strikeRate ? parseFloat(form.strikeRate) : 0,
        totalWickets: form.totalWickets ? parseInt(form.totalWickets) : 0,
        bestBowling: form.bestBowling || null,
        bowlingAvg: form.bowlingAvg ? parseFloat(form.bowlingAvg) : 0,
        economy: form.economy ? parseFloat(form.economy) : 0,
        cricheroesUrl: form.cricheroesUrl || null,
      })
      toast.success('Player updated!')
      router.push('/admin/players')
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? 'Failed to update player')
    } finally {
      setLoading(false)
    }
  }

  if (fetching) return <div className="p-8 text-gray-400 text-sm">Loading...</div>

  return (
    <div className="p-8 max-w-2xl">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/admin/players" className="text-gray-400 hover:text-gray-600 text-sm">← Players</Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-2xl font-bold text-gray-900 font-serif">Edit: {playerName}</h1>
      </div>

      <form onSubmit={handleSubmit} className="card p-6 space-y-5">
        {/* Jersey + Nationality */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Jersey Number</label>
            <input type="number" className="input" placeholder="e.g. 7" min="1" max="99" value={form.jerseyNumber} onChange={(e) => set('jerseyNumber', e.target.value)} />
          </div>
          <div>
            <label className="label">Nationality</label>
            <input type="text" className="input" placeholder="e.g. English" value={form.nationality} onChange={(e) => set('nationality', e.target.value)} />
          </div>
        </div>

        {/* Player Role */}
        <div>
          <label className="label">Player Role *</label>
          <select className="input" value={form.role} onChange={(e) => set('role', e.target.value)}>
            <option value="BATSMAN">Batsman</option>
            <option value="BOWLER">Bowler</option>
            <option value="ALL_ROUNDER">All Rounder</option>
            <option value="WICKET_KEEPER">Wicket Keeper</option>
            <option value="WICKET_KEEPER_BATSMAN">Wicket Keeper Batsman</option>
          </select>
        </div>

        {/* Batting + Bowling style */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Batting Style *</label>
            <select className="input" value={form.battingStyle} onChange={(e) => set('battingStyle', e.target.value)}>
              <option value="RIGHT_HAND">Right Hand</option>
              <option value="LEFT_HAND">Left Hand</option>
            </select>
          </div>
          <div>
            <label className="label">Bowling Style *</label>
            <select className="input" value={form.bowlingStyle} onChange={(e) => set('bowlingStyle', e.target.value)}>
              <option value="DOES_NOT_BOWL">Does Not Bowl</option>
              <option value="RIGHT_ARM_FAST">Right Arm Fast</option>
              <option value="RIGHT_ARM_MEDIUM">Right Arm Medium</option>
              <option value="RIGHT_ARM_SPIN_OFF">Right Arm Off Spin</option>
              <option value="RIGHT_ARM_SPIN_LEG">Right Arm Leg Spin</option>
              <option value="LEFT_ARM_FAST">Left Arm Fast</option>
              <option value="LEFT_ARM_MEDIUM">Left Arm Medium</option>
              <option value="LEFT_ARM_SPIN">Left Arm Spin</option>
            </select>
          </div>
        </div>

        {/* Bio */}
        <div>
          <label className="label">Bio</label>
          <textarea className="input" rows={3} placeholder="Brief description of the player..." value={form.bio} onChange={(e) => set('bio', e.target.value)} />
        </div>

        {/* Status */}
        <div className="flex items-center gap-2">
          <input type="checkbox" id="isActive" checked={form.isActive} onChange={(e) => set('isActive', e.target.checked)} className="rounded border-gray-300" />
          <label htmlFor="isActive" className="text-sm text-gray-700">Active player</label>
        </div>

        {/* Career Stats */}
        <div className="border-t pt-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Career Stats (from CricHeroes)</p>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label">Matches</label>
              <input type="number" className="input" placeholder="0" min="0" value={form.totalMatches} onChange={(e) => set('totalMatches', e.target.value)} />
            </div>
            <div>
              <label className="label">Total Runs</label>
              <input type="number" className="input" placeholder="0" min="0" value={form.totalRuns} onChange={(e) => set('totalRuns', e.target.value)} />
            </div>
            <div>
              <label className="label">Highest Score</label>
              <input type="number" className="input" placeholder="0" min="0" value={form.highestScore} onChange={(e) => set('highestScore', e.target.value)} />
            </div>
            <div>
              <label className="label">Batting Avg</label>
              <input type="number" className="input" placeholder="0.00" step="0.01" min="0" value={form.battingAvg} onChange={(e) => set('battingAvg', e.target.value)} />
            </div>
            <div>
              <label className="label">Strike Rate</label>
              <input type="number" className="input" placeholder="0.00" step="0.01" min="0" value={form.strikeRate} onChange={(e) => set('strikeRate', e.target.value)} />
            </div>
            <div>
              <label className="label">Wickets</label>
              <input type="number" className="input" placeholder="0" min="0" value={form.totalWickets} onChange={(e) => set('totalWickets', e.target.value)} />
            </div>
            <div>
              <label className="label">Best Bowling</label>
              <input type="text" className="input" placeholder="e.g. 5/32" value={form.bestBowling} onChange={(e) => set('bestBowling', e.target.value)} />
            </div>
            <div>
              <label className="label">Bowling Avg</label>
              <input type="number" className="input" placeholder="0.00" step="0.01" min="0" value={form.bowlingAvg} onChange={(e) => set('bowlingAvg', e.target.value)} />
            </div>
            <div>
              <label className="label">Economy</label>
              <input type="number" className="input" placeholder="0.00" step="0.01" min="0" value={form.economy} onChange={(e) => set('economy', e.target.value)} />
            </div>
          </div>
        </div>

        {/* CricHeroes URL */}
        <div>
          <label className="label">CricHeroes Profile URL</label>
          <input type="url" className="input" placeholder="https://cricheroes.com/player-profile/..." value={form.cricheroesUrl} onChange={(e) => set('cricheroesUrl', e.target.value)} />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
          <Link href="/admin/players" className="btn-secondary">Cancel</Link>
        </div>
      </form>
    </div>
  )
}
