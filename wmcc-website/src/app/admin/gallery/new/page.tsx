'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import axios from 'axios'
import toast from 'react-hot-toast'
import { Upload } from 'lucide-react'

export default function NewGalleryItemPage() {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [form, setForm] = useState({
    title: '',
    description: '',
    mediaType: 'PHOTO',
    albumName: '',
    isFeatured: false,
  })

  const set = (field: string, value: any) => setForm((f) => ({ ...f, [field]: value }))

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    if (f.type.startsWith('image/')) {
      setPreview(URL.createObjectURL(f))
    } else {
      setPreview(null)
    }
  }

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
      fd.append('mediaType', form.mediaType)
      fd.append('albumName', form.albumName)
      fd.append('isFeatured', String(form.isFeatured))

      await axios.post('/api/gallery', fd)
      toast.success('Media uploaded!')
      router.push('/admin/gallery')
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? 'Failed to upload media')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-2xl">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/admin/gallery" className="text-gray-400 hover:text-gray-600 text-sm">← Gallery</Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-2xl font-bold text-gray-900 font-serif">Add Media</h1>
      </div>

      <form onSubmit={handleSubmit} className="card p-6 space-y-5">
        {/* Media Type */}
        <div>
          <label className="label">Media Type</label>
          <div className="flex gap-3">
            {['PHOTO', 'VIDEO'].map((type) => (
              <label key={type} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="mediaType"
                  value={type}
                  checked={form.mediaType === type}
                  onChange={() => {
                    set('mediaType', type)
                    setFile(null)
                    setPreview(null)
                  }}
                />
                <span className="text-sm text-gray-700">{type === 'PHOTO' ? 'Photo' : 'Video'}</span>
              </label>
            ))}
          </div>
        </div>

        {/* File picker */}
        <div>
          <label className="label">File *</label>
          <div
            onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-cricket-green transition-colors"
          >
            {preview ? (
              <img src={preview} alt="preview" className="max-h-40 mx-auto rounded object-contain" />
            ) : (
              <div>
                <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                {file ? (
                  <p className="text-sm font-medium text-gray-900">{file.name}</p>
                ) : (
                  <p className="text-sm text-gray-500">
                    Click to select {form.mediaType === 'PHOTO' ? 'an image' : 'a video'}
                  </p>
                )}
              </div>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            className="hidden"
            accept={form.mediaType === 'PHOTO' ? 'image/*' : 'video/*'}
            onChange={handleFileChange}
          />
        </div>

        {/* Title */}
        <div>
          <label className="label">Title *</label>
          <input
            type="text"
            className="input"
            required
            placeholder="e.g. WMCC vs Northampton CC - Match Day"
            value={form.title}
            onChange={(e) => set('title', e.target.value)}
          />
        </div>

        {/* Album */}
        <div>
          <label className="label">Album</label>
          <input
            type="text"
            className="input"
            placeholder="e.g. Season 2025, Awards Night"
            value={form.albumName}
            onChange={(e) => set('albumName', e.target.value)}
          />
        </div>

        {/* Description */}
        <div>
          <label className="label">Description</label>
          <textarea
            className="input"
            rows={2}
            placeholder="Brief caption or description..."
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
          <label htmlFor="isFeatured" className="text-sm text-gray-700">Feature on homepage</label>
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading || !file} className="btn-primary">
            {loading ? 'Uploading...' : 'Upload Media'}
          </button>
          <Link href="/admin/gallery" className="btn-secondary">Cancel</Link>
        </div>
      </form>
    </div>
  )
}
