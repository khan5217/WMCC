'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import axios from 'axios'
import toast from 'react-hot-toast'

function toSlug(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
}

export default function NewNewsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    coverImage: '',
    status: 'DRAFT',
    isFeatured: false,
    tags: '',
  })

  const set = (field: string, value: any) => setForm((f) => ({ ...f, [field]: value }))

  const handleTitleChange = (title: string) => {
    setForm((f) => ({
      ...f,
      title,
      slug: f.slug === toSlug(f.title) || f.slug === '' ? toSlug(title) : f.slug,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await axios.post('/api/news', {
        title: form.title,
        slug: form.slug,
        excerpt: form.excerpt || null,
        content: form.content,
        coverImage: form.coverImage || null,
        status: form.status,
        isFeatured: form.isFeatured,
        tags: form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
      })
      toast.success('Article created!')
      router.push('/admin/news')
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? 'Failed to create article')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-3xl">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/admin/news" className="text-gray-400 hover:text-gray-600 text-sm">← News</Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-2xl font-bold text-gray-900 font-serif">New Article</h1>
      </div>

      <form onSubmit={handleSubmit} className="card p-6 space-y-5">
        {/* Title */}
        <div>
          <label className="label">Title *</label>
          <input
            type="text"
            className="input"
            required
            placeholder="Match Report: WMCC vs Northampton CC"
            value={form.title}
            onChange={(e) => handleTitleChange(e.target.value)}
          />
        </div>

        {/* Slug */}
        <div>
          <label className="label">Slug *</label>
          <div className="flex items-center">
            <span className="text-gray-400 text-sm mr-2">/news/</span>
            <input
              type="text"
              className="input"
              required
              placeholder="match-report-wmcc-vs-northampton"
              value={form.slug}
              onChange={(e) => set('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
            />
          </div>
        </div>

        {/* Excerpt */}
        <div>
          <label className="label">Excerpt</label>
          <textarea
            className="input"
            rows={2}
            placeholder="Short summary shown on the news listing page..."
            value={form.excerpt}
            onChange={(e) => set('excerpt', e.target.value)}
          />
        </div>

        {/* Content */}
        <div>
          <label className="label">Content *</label>
          <textarea
            className="input"
            rows={12}
            required
            placeholder="Full article content (HTML supported)..."
            value={form.content}
            onChange={(e) => set('content', e.target.value)}
          />
        </div>

        {/* Cover Image */}
        <div>
          <label className="label">Cover Image URL</label>
          <input
            type="url"
            className="input"
            placeholder="https://..."
            value={form.coverImage}
            onChange={(e) => set('coverImage', e.target.value)}
          />
        </div>

        {/* Tags */}
        <div>
          <label className="label">Tags</label>
          <input
            type="text"
            className="input"
            placeholder="match report, 1st XI, league (comma separated)"
            value={form.tags}
            onChange={(e) => set('tags', e.target.value)}
          />
        </div>

        {/* Status + Featured */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Status</label>
            <select className="input" value={form.status} onChange={(e) => set('status', e.target.value)}>
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>
          <div className="flex items-end pb-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isFeatured}
                onChange={(e) => set('isFeatured', e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="text-sm text-gray-700">Feature on homepage</span>
            </label>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Publishing...' : form.status === 'PUBLISHED' ? 'Publish Article' : 'Save Draft'}
          </button>
          <Link href="/admin/news" className="btn-secondary">Cancel</Link>
        </div>
      </form>
    </div>
  )
}
