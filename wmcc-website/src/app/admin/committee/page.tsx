'use client'

import { useState, useEffect } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { Plus, X, Save, Pencil } from 'lucide-react'
import Image from 'next/image'
import { initials } from '@/lib/utils'

const TITLES = [
  'Chairman', 'Club Secretary', '1st XI Captain', '2nd XI Captain',
  'Treasurer', 'Organiser', 'Selector',
]

interface CommitteeMember {
  id: string
  title: string
  displayOrder: number
  user: { id: string; firstName: string; lastName: string; email: string; avatarUrl: string | null }
}

interface MemberUser {
  id: string
  firstName: string
  lastName: string
  email: string
  avatarUrl: string | null
  role: string
}

export default function AdminCommitteePage() {
  const [members, setMembers] = useState<CommitteeMember[]>([])
  const [allUsers, setAllUsers] = useState<MemberUser[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [saving, setSaving] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [newUserId, setNewUserId] = useState('')
  const [newTitle, setNewTitle] = useState(TITLES[0])
  const [adding, setAdding] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    try {
      const [committeeRes, usersRes] = await Promise.all([
        axios.get('/api/admin/committee'),
        axios.get('/api/admin/members-list'),
      ])
      setMembers(committeeRes.data)
      setAllUsers(usersRes.data)
    } catch {
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  // Users not already on the committee
  const committeeUserIds = new Set(members.map(m => m.user.id))
  const available = allUsers.filter(u => !committeeUserIds.has(u.id))

  const saveEdit = async (id: string) => {
    setSaving(true)
    try {
      await axios.patch(`/api/admin/committee/${id}`, { title: editTitle })
      toast.success('Updated')
      setEditingId(null)
      fetchData()
    } catch {
      toast.error('Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const removeMember = async (id: string, name: string) => {
    if (!confirm(`Remove ${name} from the committee?`)) return
    try {
      await axios.delete(`/api/admin/committee/${id}`)
      toast.success('Removed')
      fetchData()
    } catch {
      toast.error('Failed to remove')
    }
  }

  const addMember = async () => {
    if (!newUserId) return toast.error('Select a member')
    setAdding(true)
    try {
      await axios.post('/api/admin/committee', {
        userId: newUserId,
        title: newTitle,
        displayOrder: members.length,
      })
      toast.success('Added to committee')
      setShowAdd(false)
      setNewUserId('')
      setNewTitle(TITLES[0])
      fetchData()
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? 'Failed to add')
    } finally {
      setAdding(false)
    }
  }

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 font-serif">Committee</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Manage committee roles. Members update their own photo via their profile page.
          </p>
        </div>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 btn-primary text-sm">
          <Plus className="h-4 w-4" /> Add Member
        </button>
      </div>

      {loading ? (
        <div className="py-16 text-center text-gray-400 text-sm">Loading...</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {members.map((m) => (
            <div key={m.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 text-center">
              <div className="w-20 h-20 rounded-full mx-auto mb-3 overflow-hidden bg-green-100 flex items-center justify-center">
                {m.user.avatarUrl ? (
                  <Image src={m.user.avatarUrl} alt={m.user.firstName} width={80} height={80} className="object-cover w-20 h-20" />
                ) : (
                  <span className="text-xl font-bold text-cricket-green">
                    {initials(m.user.firstName, m.user.lastName)}
                  </span>
                )}
              </div>

              <div className="font-bold text-gray-900 text-sm">{m.user.firstName} {m.user.lastName}</div>
              <div className="text-xs text-gray-400 truncate">{m.user.email}</div>

              {editingId === m.id ? (
                <div className="mt-3 space-y-2">
                  <select
                    className="input text-sm py-1.5"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                  >
                    {TITLES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <div className="flex gap-2">
                    <button onClick={() => saveEdit(m.id)} disabled={saving}
                      className="flex-1 flex items-center justify-center gap-1 bg-cricket-green hover:bg-cricket-dark text-white text-xs font-medium py-1.5 rounded-lg transition-colors">
                      <Save className="h-3 w-3" /> Save
                    </button>
                    <button onClick={() => setEditingId(null)}
                      className="px-3 border border-gray-200 text-gray-500 hover:bg-gray-50 text-xs rounded-lg">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="text-xs text-cricket-green font-semibold mt-1">{m.title}</div>
                  <div className="flex gap-2 mt-3 justify-center">
                    <button onClick={() => { setEditingId(m.id); setEditTitle(m.title) }}
                      className="flex items-center gap-1 text-xs text-gray-500 hover:text-cricket-green border border-gray-200 hover:border-cricket-green px-2.5 py-1 rounded-lg transition-colors">
                      <Pencil className="h-3 w-3" /> Edit Role
                    </button>
                    <button onClick={() => removeMember(m.id, `${m.user.firstName} ${m.user.lastName}`)}
                      className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-500 border border-gray-200 hover:border-red-200 px-2.5 py-1 rounded-lg transition-colors">
                      <X className="h-3 w-3" /> Remove
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}

          {members.length === 0 && !loading && (
            <div className="col-span-full py-16 text-center text-gray-400 text-sm">
              No committee members yet. Add the first one.
            </div>
          )}
        </div>
      )}

      {/* Add member modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">Add Committee Member</h2>
              <button onClick={() => setShowAdd(false)} className="p-1 text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="label">Select Member *</label>
                <select className="input" value={newUserId} onChange={(e) => setNewUserId(e.target.value)}>
                  <option value="">Choose a member...</option>
                  {available.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.firstName} {u.lastName} ({u.email})
                    </option>
                  ))}
                </select>
                {available.length === 0 && (
                  <p className="text-xs text-gray-400 mt-1">All members are already on the committee.</p>
                )}
              </div>
              <div>
                <label className="label">Committee Role *</label>
                <select className="input" value={newTitle} onChange={(e) => setNewTitle(e.target.value)}>
                  {TITLES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowAdd(false)}
                className="flex-1 border border-gray-200 text-gray-600 hover:bg-gray-50 py-2.5 rounded-lg text-sm font-medium transition-colors">
                Cancel
              </button>
              <button onClick={addMember} disabled={adding || !newUserId}
                className="flex-1 bg-cricket-green hover:bg-cricket-dark text-white py-2.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50">
                {adding ? 'Adding...' : 'Add to Committee'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
