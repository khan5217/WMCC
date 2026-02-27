'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import axios from 'axios'
import toast from 'react-hot-toast'
import { Upload } from 'lucide-react'

export default function NewDocumentPage() {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    access: 'ALL_MEMBERS',
  })

  const set = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) {
      toast.error('Please select a file')
      return
    }
    setLoading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('title', form.title)
      fd.append('description', form.description)
      fd.append('category', form.category)
      fd.append('access', form.access)

      await axios.post('/api/documents', fd)
      toast.success('Document uploaded!')
      router.push('/admin/documents')
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? 'Failed to upload document')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-2xl">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/admin/documents" className="text-gray-400 hover:text-gray-600 text-sm">← Documents</Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-2xl font-bold text-gray-900 font-serif">Upload Document</h1>
      </div>

      <form onSubmit={handleSubmit} className="card p-6 space-y-5">
        {/* File picker */}
        <div>
          <label className="label">File *</label>
          <div
            onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-cricket-green transition-colors"
          >
            <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            {file ? (
              <div>
                <p className="text-sm font-medium text-gray-900">{file.name}</p>
                <p className="text-xs text-gray-400">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
            ) : (
              <div>
                <p className="text-sm text-gray-500">Click to select a file</p>
                <p className="text-xs text-gray-400 mt-1">PDF, Word, Excel, images supported</p>
              </div>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) {
                setFile(f)
                if (!form.title) set('title', f.name.replace(/\.[^/.]+$/, ''))
              }
            }}
          />
        </div>

        {/* Title */}
        <div>
          <label className="label">Title *</label>
          <input
            type="text"
            className="input"
            required
            placeholder="e.g. AGM Minutes 2024"
            value={form.title}
            onChange={(e) => set('title', e.target.value)}
          />
        </div>

        {/* Category + Access */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Category *</label>
            <input
              type="text"
              className="input"
              required
              placeholder="e.g. Minutes, Policies, Financials"
              value={form.category}
              onChange={(e) => set('category', e.target.value)}
            />
          </div>
          <div>
            <label className="label">Access Level</label>
            <select className="input" value={form.access} onChange={(e) => set('access', e.target.value)}>
              <option value="ALL_MEMBERS">All Members</option>
              <option value="PLAYING_MEMBERS">Playing Members</option>
              <option value="COMMITTEE">Committee</option>
              <option value="ADMIN">Admin Only</option>
            </select>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="label">Description</label>
          <textarea
            className="input"
            rows={2}
            placeholder="Brief description of this document..."
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading || !file} className="btn-primary">
            {loading ? 'Uploading...' : 'Upload Document'}
          </button>
          <Link href="/admin/documents" className="btn-secondary">Cancel</Link>
        </div>
      </form>
    </div>
  )
}
