'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import axios from 'axios'
import toast from 'react-hot-toast'

type User = { id: string; firstName: string; lastName: string; email: string }

export default function NewPlayerPage() {
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    userId: '',
    jerseyNumber: '',
    role: 'ALL_ROUNDER',
    battingStyle: 'RIGHT_HAND',
    bowlingStyle: 'DOES_NOT_BOWL',
    bio: '',
    dateOfBirth: '',
    nationality: '',
  })

  useEffect(() => {
    axios.get('/api/players').then((res) => setUsers(res.data))
  }, [])

  const set = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await axios.post('/api/players', {
        ...form,
        jerseyNumber: form.jerseyNumber ? parseInt(form.jerseyNumber) : null,
        dateOfBirth: form.dateOfBirth || null,
        bio: form.bio || null,
        nationality: form.nationality || null,
      })
      toast.success('Player created!')
      router.push('/admin/players')
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? 'Failed to create player')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-2xl">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/admin/players" className="text-gray-400 hover:text-gray-600 text-sm">← Players</Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-2xl font-bold text-gray-900 font-serif">Add Player</h1>
      </div>

      <form onSubmit={handleSubmit} className="card p-6 space-y-5">
        {/* Member select */}
        <div>
          <label className="label">Member *</label>
          <select className="input" required value={form.userId} onChange={(e) => set('userId', e.target.value)}>
            <option value="">Select a member...</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.firstName} {u.lastName} — {u.email}
              </option>
            ))}
          </select>
          {users.length === 0 && (
            <p className="text-xs text-gray-400 mt-1">No members available — all existing members already have player profiles.</p>
          )}
        </div>

        {/* Jersey + Nationality */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Jersey Number</label>
            <input
              type="number"
              className="input"
              placeholder="e.g. 7"
              min="1"
              max="99"
              value={form.jerseyNumber}
              onChange={(e) => set('jerseyNumber', e.target.value)}
            />
          </div>
          <div>
            <label className="label">Nationality</label>
            <input
              type="text"
              className="input"
              placeholder="e.g. English"
              value={form.nationality}
              onChange={(e) => set('nationality', e.target.value)}
            />
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

        {/* DOB */}
        <div>
          <label className="label">Date of Birth</label>
          <input
            type="date"
            className="input"
            value={form.dateOfBirth}
            onChange={(e) => set('dateOfBirth', e.target.value)}
          />
        </div>

        {/* Bio */}
        <div>
          <label className="label">Bio</label>
          <textarea
            className="input"
            rows={3}
            placeholder="Brief description of the player..."
            value={form.bio}
            onChange={(e) => set('bio', e.target.value)}
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Creating...' : 'Create Player'}
          </button>
          <Link href="/admin/players" className="btn-secondary">Cancel</Link>
        </div>
      </form>
    </div>
  )
}
