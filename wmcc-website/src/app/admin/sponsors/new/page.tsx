'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import axios from 'axios'
import toast from 'react-hot-toast'

export default function NewSponsorPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: '',
    website: '',
    logoUrl: '',
    tier: 'gold',
    isActive: true,
  })

  const set = (field: string, value: any) => setForm((f) => ({ ...f, [field]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await axios.post('/api/sponsors', {
        name: form.name,
        website: form.website || null,
        logoUrl: form.logoUrl || null,
        tier: form.tier,
        isActive: form.isActive,
      })
      toast.success('Sponsor added!')
      router.push('/admin/sponsors')
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? 'Failed to add sponsor')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-2xl">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/admin/sponsors" className="text-gray-400 hover:text-gray-600 text-sm">← Sponsors</Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-2xl font-bold text-gray-900 font-serif">Add Sponsor</h1>
      </div>

      <form onSubmit={handleSubmit} className="card p-6 space-y-5">
        <div>
          <label className="label">Sponsor Name *</label>
          <input
            type="text"
            className="input"
            required
            placeholder="Room Escape MK"
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
          />
        </div>

        <div>
          <label className="label">Website URL</label>
          <input
            type="url"
            className="input"
            placeholder="https://roomescapemk.com"
            value={form.website}
            onChange={(e) => set('website', e.target.value)}
          />
        </div>

        <div>
          <label className="label">Logo Image URL</label>
          <input
            type="url"
            className="input"
            placeholder="https://... (leave blank to show name text)"
            value={form.logoUrl}
            onChange={(e) => set('logoUrl', e.target.value)}
          />
          <p className="text-xs text-gray-400 mt-1">If left blank, the sponsor name will be displayed as text.</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Sponsorship Tier *</label>
            <select className="input" value={form.tier} onChange={(e) => set('tier', e.target.value)}>
              <option value="gold">Gold – Main Sponsor</option>
              <option value="silver">Silver</option>
              <option value="standard">Standard</option>
            </select>
          </div>
          <div className="flex items-end pb-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => set('isActive', e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="text-sm text-gray-700">Show on website</span>
            </label>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Adding...' : 'Add Sponsor'}
          </button>
          <Link href="/admin/sponsors" className="btn-secondary">Cancel</Link>
        </div>
      </form>
    </div>
  )
}
