'use client'

import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { Plus, X, ChevronDown, Users } from 'lucide-react'

const CURRENT_YEAR = new Date().getFullYear()

interface Player {
  id: string
  jerseyNumber: number | null
  user: { firstName: string; lastName: string; email: string }
}

interface Team {
  id: string
  name: string
  type: 'FIRST_XI' | 'SECOND_XI'
  season: number
  players: Player[]
}

export default function AdminTeamsPage() {
  const [teams, setTeams] = useState<Team[]>([])
  const [allPlayers, setAllPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)
  const [season, setSeason] = useState(CURRENT_YEAR)

  // Create team
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [newType, setNewType] = useState<'FIRST_XI' | 'SECOND_XI'>('FIRST_XI')
  const [creating, setCreating] = useState(false)

  // Add player to team
  const [addingTo, setAddingTo] = useState<string | null>(null)
  const [addPlayerId, setAddPlayerId] = useState('')
  const [addingSaving, setAddingSaving] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [teamsRes, playersRes] = await Promise.all([
        axios.get('/api/teams'),
        axios.get('/api/admin/players-list'),
      ])
      const filtered = teamsRes.data.filter((t: Team) => t.season === season)
      setTeams(filtered)
      setAllPlayers(playersRes.data)
    } catch {
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }, [season])

  useEffect(() => { fetchData() }, [fetchData])

  const handleCreateTeam = async () => {
    if (!newName.trim()) return toast.error('Enter a team name')
    setCreating(true)
    try {
      await axios.post('/api/teams', { name: newName.trim(), type: newType, season })
      toast.success('Team created')
      setShowCreate(false)
      setNewName('')
      fetchData()
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? 'Failed to create team')
    } finally {
      setCreating(false)
    }
  }

  const handleAddPlayer = async (teamId: string) => {
    if (!addPlayerId) return toast.error('Select a player')
    setAddingSaving(true)
    try {
      await axios.post(`/api/teams/${teamId}/players`, { playerId: addPlayerId })
      toast.success('Player added')
      setAddingTo(null)
      setAddPlayerId('')
      fetchData()
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? 'Failed to add player')
    } finally {
      setAddingSaving(false)
    }
  }

  const handleRemovePlayer = async (teamId: string, playerId: string, name: string) => {
    if (!confirm(`Remove ${name} from this team?`)) return
    try {
      await axios.delete(`/api/teams/${teamId}/players`, { data: { playerId } })
      toast.success('Player removed')
      fetchData()
    } catch {
      toast.error('Failed to remove player')
    }
  }

  return (
    <div className="p-4 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 font-serif">Teams</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage 1st XI and 2nd XI squads</p>
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
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 btn-primary text-sm"
          >
            <Plus className="h-4 w-4" /> New Team
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-16 text-center text-gray-400 text-sm">Loading...</div>
      ) : teams.length === 0 ? (
        <div className="py-16 text-center">
          <Users className="h-10 w-10 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">No teams for {season}.</p>
          <button onClick={() => setShowCreate(true)} className="mt-3 text-sm text-cricket-green hover:underline font-medium">
            Create a team
          </button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {teams.map((team) => {
            const memberIds = new Set(team.players.map((p) => p.id))
            const available = allPlayers.filter((p) => !memberIds.has(p.id))
            const isAddingHere = addingTo === team.id

            return (
              <div key={team.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="bg-gray-50 border-b border-gray-100 px-5 py-4 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-gray-900">{team.name}</div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      {team.type === 'FIRST_XI' ? '1st XI' : '2nd XI'} · {team.season} Season · {team.players.length} players
                    </div>
                  </div>
                  <button
                    onClick={() => { setAddingTo(isAddingHere ? null : team.id); setAddPlayerId('') }}
                    className="flex items-center gap-1.5 text-xs bg-cricket-green hover:bg-cricket-dark text-white px-3 py-1.5 rounded-lg font-medium transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add Player
                  </button>
                </div>

                {isAddingHere && (
                  <div className="px-5 py-3 bg-green-50 border-b border-green-100 flex items-center gap-2">
                    <div className="relative flex-1">
                      <select
                        value={addPlayerId}
                        onChange={(e) => setAddPlayerId(e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm appearance-none bg-white pr-8"
                      >
                        <option value="">Select player to add...</option>
                        {available.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.user.firstName} {p.user.lastName}
                            {p.jerseyNumber ? ` (#${p.jerseyNumber})` : ''}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-2.5 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
                    </div>
                    <button
                      onClick={() => handleAddPlayer(team.id)}
                      disabled={addingSaving || !addPlayerId}
                      className="bg-cricket-green hover:bg-cricket-dark disabled:opacity-40 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors whitespace-nowrap"
                    >
                      {addingSaving ? 'Adding...' : 'Add'}
                    </button>
                    <button
                      onClick={() => setAddingTo(null)}
                      className="p-2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}

                {team.players.length === 0 ? (
                  <div className="px-5 py-8 text-center text-gray-400 text-sm">No players yet.</div>
                ) : (
                  <ul className="divide-y divide-gray-50">
                    {team.players.map((p) => (
                      <li key={p.id} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50">
                        <div>
                          <span className="font-medium text-gray-900 text-sm">
                            {p.user.firstName} {p.user.lastName}
                          </span>
                          {p.jerseyNumber && (
                            <span className="ml-2 text-xs text-gray-400">#{p.jerseyNumber}</span>
                          )}
                        </div>
                        <button
                          onClick={() => handleRemovePlayer(team.id, p.id, `${p.user.firstName} ${p.user.lastName}`)}
                          className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Remove from team"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Create Team Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">Create Team</h2>
              <button onClick={() => setShowCreate(false)} className="p-1 text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">Team Type</label>
                <div className="relative">
                  <select
                    value={newType}
                    onChange={(e) => {
                      const t = e.target.value as 'FIRST_XI' | 'SECOND_XI'
                      setNewType(t)
                      setNewName(t === 'FIRST_XI' ? 'WMCC 1st XI' : 'WMCC 2nd XI')
                    }}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm appearance-none bg-white pr-8"
                  >
                    <option value="FIRST_XI">1st XI</option>
                    <option value="SECOND_XI">2nd XI</option>
                  </select>
                  <ChevronDown className="absolute right-2.5 top-3 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">Team Name *</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm"
                  placeholder="e.g. WMCC 1st XI"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">Season</label>
                <input
                  type="number"
                  value={season}
                  disabled
                  className="w-full border border-gray-100 bg-gray-50 rounded-lg px-3 py-2.5 text-sm text-gray-500"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreate(false)}
                className="flex-1 border border-gray-200 text-gray-600 hover:bg-gray-50 py-2.5 rounded-lg text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTeam}
                disabled={creating}
                className="flex-1 bg-cricket-green hover:bg-cricket-dark text-white py-2.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
              >
                {creating ? 'Creating...' : 'Create Team'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
