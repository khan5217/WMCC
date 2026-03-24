'use client'

import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { Plus, X, Save, Upload, Pencil, GripVertical } from 'lucide-react'
import Image from 'next/image'
import { initials } from '@/lib/utils'

const DEFAULT_ROLES = [
  'Chairman', 'Club Secretary', '1st XI Captain', '2nd XI Captain',
  'Treasurer', 'Organiser', 'Selector',
]

interface Member {
  id: string
  name: string
  role: string
  avatarUrl: string | null
  email: string | null
  displayOrder: number
}

export default function AdminCommitteePage() {
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ name: '', role: '', email: '' })
  const [saving, setSaving] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [newForm, setNewForm] = useState({ name: '', role: DEFAULT_ROLES[0], email: '' })
  const [adding, setAdding] = useState(false)
  const [uploadingId, setUploadingId] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const activeUploadId = useRef<string | null>(null)

  const fetchMembers = async () => {
    setLoading(true)
    try {
      const res = await axios.get('/api/admin/committee')
      setMembers(res.data)
    } catch {
      toast.error('Failed to load committee')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchMembers() }, [])

  const startEdit = (m: Member) => {
    setEditingId(m.id)
    setEditForm({ name: m.name, role: m.role, email: m.email ?? '' })
  }

  const saveEdit = async (id: string) => {
    setSaving(true)
    try {
      await axios.patch(`/api/admin/committee/${id}`, {
        name: editForm.name,
        role: editForm.role,
        email: editForm.email || null,
      })
      toast.success('Updated')
      setEditingId(null)
      fetchMembers()
    } catch {
      toast.error('Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const deleteMember = async (id: string, name: string) => {
    if (!confirm(`Remove ${name} from the committee?`)) return
    try {
      await axios.delete(`/api/admin/committee/${id}`)
      toast.success('Removed')
      fetchMembers()
    } catch {
      toast.error('Failed to remove')
    }
  }

  const addMember = async () => {
    if (!newForm.name.trim()) return toast.error('Enter a name')
    setAdding(true)
    try {
      await axios.post('/api/admin/committee', {
        name: newForm.name.trim(),
        role: newForm.role,
        email: newForm.email || null,
        displayOrder: members.length,
      })
      toast.success('Member added')
      setShowAdd(false)
      setNewForm({ name: '', role: DEFAULT_ROLES[0], email: '' })
      fetchMembers()
    } catch {
      toast.error('Failed to add')
    } finally {
      setAdding(false)
    }
  }

  const handlePhotoUpload = async (file: File, memberId: string) => {
    setUploadingId(memberId)
    try {
      const { data } = await axios.post(`/api/admin/committee/${memberId}/upload`, {
        filename: file.name,
        contentType: file.type,
      })
      await fetch(data.uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } })
      await axios.patch(`/api/admin/committee/${memberId}`, { avatarUrl: data.publicUrl })
      toast.success('Photo uploaded')
      fetchMembers()
    } catch {
      toast.error('Failed to upload photo')
    } finally {
      setUploadingId(null)
    }
  }

  const triggerUpload = (id: string) => {
    activeUploadId.current = id
    fileRef.current?.click()
  }

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    const id = activeUploadId.current
    if (file && id) handlePhotoUpload(file, id)
    e.target.value = ''
  }

  return (
    <div className="p-4 md:p-8">
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 font-serif">Committee</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage club committee members and photos</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 btn-primary text-sm"
        >
          <Plus className="h-4 w-4" /> Add Member
        </button>
      </div>

      {loading ? (
        <div className="py-16 text-center text-gray-400 text-sm">Loading...</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {members.map((m) => (
            <div key={m.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              {/* Avatar */}
              <div className="relative w-20 h-20 mx-auto mb-3">
                {m.avatarUrl ? (
                  <Image src={m.avatarUrl} alt={m.name} width={80} height={80} className="rounded-full object-cover w-20 h-20" />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
                    <span className="text-2xl font-bold text-cricket-green">
                      {initials(m.name.split(' ')[0], m.name.split(' ').slice(1).join(' '))}
                    </span>
                  </div>
                )}
                <button
                  onClick={() => triggerUpload(m.id)}
                  disabled={uploadingId === m.id}
                  className="absolute -bottom-1 -right-1 w-7 h-7 bg-cricket-green hover:bg-cricket-dark text-white rounded-full flex items-center justify-center shadow transition-colors"
                  title="Upload photo"
                >
                  {uploadingId === m.id
                    ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    : <Upload className="h-3 w-3" />}
                </button>
              </div>

              {editingId === m.id ? (
                <div className="space-y-2">
                  <input
                    className="input text-sm py-1.5"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    placeholder="Full name"
                  />
                  <select
                    className="input text-sm py-1.5"
                    value={editForm.role}
                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                  >
                    {DEFAULT_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                    {!DEFAULT_ROLES.includes(editForm.role) && (
                      <option value={editForm.role}>{editForm.role}</option>
                    )}
                  </select>
                  <input
                    className="input text-sm py-1.5"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    placeholder="Email (optional)"
                    type="email"
                  />
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => saveEdit(m.id)}
                      disabled={saving}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-cricket-green hover:bg-cricket-dark text-white text-xs font-medium py-1.5 rounded-lg transition-colors"
                    >
                      <Save className="h-3 w-3" /> Save
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="px-3 border border-gray-200 text-gray-500 hover:bg-gray-50 text-xs rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <div className="font-bold text-gray-900 text-sm">{m.name || 'TBA'}</div>
                  <div className="text-xs text-cricket-green font-medium mt-0.5">{m.role}</div>
                  {m.email && (
                    <a href={`mailto:${m.email}`} className="text-xs text-gray-400 hover:text-cricket-green mt-1 block truncate">
                      {m.email}
                    </a>
                  )}
                  <div className="flex gap-2 mt-3 justify-center">
                    <button
                      onClick={() => startEdit(m)}
                      className="flex items-center gap-1 text-xs text-gray-500 hover:text-cricket-green border border-gray-200 hover:border-cricket-green px-2.5 py-1 rounded-lg transition-colors"
                    >
                      <Pencil className="h-3 w-3" /> Edit
                    </button>
                    <button
                      onClick={() => deleteMember(m.id, m.name)}
                      className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-500 border border-gray-200 hover:border-red-200 px-2.5 py-1 rounded-lg transition-colors"
                    >
                      <X className="h-3 w-3" /> Remove
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}

          {members.length === 0 && (
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
                <label className="label">Role *</label>
                <select
                  className="input"
                  value={newForm.role}
                  onChange={(e) => setNewForm({ ...newForm, role: e.target.value })}
                >
                  {DEFAULT_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Full Name *</label>
                <input
                  className="input"
                  value={newForm.name}
                  onChange={(e) => setNewForm({ ...newForm, name: e.target.value })}
                  placeholder="e.g. John Smith"
                />
              </div>
              <div>
                <label className="label">Email (optional)</label>
                <input
                  className="input"
                  type="email"
                  value={newForm.email}
                  onChange={(e) => setNewForm({ ...newForm, email: e.target.value })}
                  placeholder="john@example.com"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowAdd(false)} className="flex-1 border border-gray-200 text-gray-600 hover:bg-gray-50 py-2.5 rounded-lg text-sm font-medium transition-colors">
                Cancel
              </button>
              <button onClick={addMember} disabled={adding} className="flex-1 bg-cricket-green hover:bg-cricket-dark text-white py-2.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50">
                {adding ? 'Adding...' : 'Add Member'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
