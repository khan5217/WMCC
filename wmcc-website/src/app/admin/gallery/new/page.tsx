'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import axios from 'axios'
import toast from 'react-hot-toast'
import { Upload, X } from 'lucide-react'

interface FileEntry {
  file: File
  preview: string | null
  status: 'pending' | 'uploading' | 'done' | 'error'
}

// Resize an image using canvas. If `square` is true, center-crops to a square first.
async function resizeImage(file: File, maxDim: number, quality: number, square = false): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new window.Image()
    const objectUrl = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(objectUrl)
      const { naturalWidth: w, naturalHeight: h } = img

      // Source rect — center-crop to square if requested
      let sx = 0, sy = 0, sw = w, sh = h
      if (square) {
        const size = Math.min(w, h)
        sx = (w - size) / 2
        sy = (h - size) / 2
        sw = size
        sh = size
      }

      const scale = Math.min(1, maxDim / Math.max(sw, sh))
      const dw = Math.round(sw * scale)
      const dh = Math.round(sh * scale)

      const canvas = document.createElement('canvas')
      canvas.width = dw
      canvas.height = dh
      canvas.getContext('2d')!.drawImage(img, sx, sy, sw, sh, 0, 0, dw, dh)
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error('Canvas toBlob failed'))),
        'image/jpeg',
        quality,
      )
    }
    img.onerror = reject
    img.src = objectUrl
  })
}

async function presign(filename: string, contentType: string, mediaType: string, thumbnail = false) {
  const { data } = await axios.post('/api/gallery/presign', { filename, contentType, mediaType, thumbnail })
  return data as { uploadUrl: string; publicUrl: string }
}

async function putToS3(uploadUrl: string, body: Blob, contentType: string) {
  await fetch(uploadUrl, {
    method: 'PUT',
    body,
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'max-age=31536000, immutable',
    },
  })
}

export default function NewGalleryItemPage() {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [entries, setEntries] = useState<FileEntry[]>([])
  const [form, setForm] = useState({
    title: '',
    description: '',
    mediaType: 'PHOTO',
    albumName: '',
    isFeatured: false,
  })

  const set = (field: string, value: any) => setForm((f) => ({ ...f, [field]: value }))

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    const newEntries: FileEntry[] = files.map((f) => ({
      file: f,
      preview: f.type.startsWith('image/') ? URL.createObjectURL(f) : null,
      status: 'pending',
    }))
    setEntries((prev) => [...prev, ...newEntries])
    e.target.value = ''
  }

  const removeEntry = (idx: number) => {
    setEntries((prev) => {
      const copy = [...prev]
      if (copy[idx].preview) URL.revokeObjectURL(copy[idx].preview!)
      copy.splice(idx, 1)
      return copy
    })
  }

  const updateStatus = (idx: number, status: FileEntry['status']) =>
    setEntries((prev) => prev.map((e, i) => (i === idx ? { ...e, status } : e)))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!entries.length) {
      toast.error('Please select at least one file')
      return
    }
    setLoading(true)
    let successCount = 0
    let errorCount = 0

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i]
      if (entry.status === 'done') { successCount++; continue }
      updateStatus(i, 'uploading')
      try {
        const isPhoto = form.mediaType === 'PHOTO' && entry.file.type.startsWith('image/')
        let displayUrl: string
        let thumbnailUrl: string | null = null

        if (isPhoto) {
          // Resize display version (max 2048px, 85% quality) and thumbnail (600px square, 75%)
          const [displayBlob, thumbBlob] = await Promise.all([
            resizeImage(entry.file, 2048, 0.85),
            resizeImage(entry.file, 600, 0.75, true),
          ])

          const [displayPresign, thumbPresign] = await Promise.all([
            presign(`${entry.file.name.replace(/\.[^/.]+$/, '')}.jpg`, 'image/jpeg', form.mediaType),
            presign(`${entry.file.name.replace(/\.[^/.]+$/, '')}-thumb.jpg`, 'image/jpeg', form.mediaType, true),
          ])

          await Promise.all([
            putToS3(displayPresign.uploadUrl, displayBlob, 'image/jpeg'),
            putToS3(thumbPresign.uploadUrl, thumbBlob, 'image/jpeg'),
          ])

          displayUrl = displayPresign.publicUrl
          thumbnailUrl = thumbPresign.publicUrl
        } else {
          // Videos — upload as-is
          const { uploadUrl, publicUrl } = await presign(entry.file.name, entry.file.type, form.mediaType)
          await putToS3(uploadUrl, entry.file, entry.file.type)
          displayUrl = publicUrl
        }

        const title = entries.length === 1 && form.title
          ? form.title
          : (form.title
            ? `${form.title} – ${entry.file.name.replace(/\.[^/.]+$/, '')}`
            : entry.file.name.replace(/\.[^/.]+$/, ''))

        await axios.post('/api/gallery', {
          title,
          description: form.description,
          mediaType: form.mediaType,
          albumName: form.albumName,
          isFeatured: form.isFeatured,
          url: displayUrl,
          thumbnailUrl,
        })

        updateStatus(i, 'done')
        successCount++
      } catch {
        updateStatus(i, 'error')
        errorCount++
      }
    }

    setLoading(false)

    if (errorCount === 0) {
      toast.success(`${successCount} file${successCount !== 1 ? 's' : ''} uploaded!`)
      router.push('/admin/gallery')
    } else {
      toast.error(`${errorCount} file${errorCount !== 1 ? 's' : ''} failed. You can retry.`)
    }
  }

  const pendingCount = entries.filter((e) => e.status !== 'done').length

  return (
    <div className="p-8 max-w-2xl">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/admin/gallery" className="text-gray-400 hover:text-gray-600 text-sm">← Gallery</Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-2xl font-bold text-gray-900 font-serif">Add Media</h1>
      </div>

      <div className="mb-4 bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 text-xs text-blue-700">
        Photos are automatically resized and compressed before upload — display version max 2048px, thumbnail 600×600 crop. This keeps the gallery fast.
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
                  onChange={() => { set('mediaType', type); setEntries([]) }}
                />
                <span className="text-sm text-gray-700">{type === 'PHOTO' ? 'Photo' : 'Video'}</span>
              </label>
            ))}
          </div>
        </div>

        {/* File picker */}
        <div>
          <label className="label">
            Files * <span className="text-gray-400 font-normal">(select multiple)</span>
          </label>
          <div
            onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-cricket-green transition-colors"
          >
            <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500">
              Click to select {form.mediaType === 'PHOTO' ? 'images' : 'videos'}
            </p>
            <p className="text-xs text-gray-400 mt-1">You can select multiple files at once</p>
          </div>
          <input
            ref={fileRef}
            type="file"
            multiple
            className="hidden"
            accept={form.mediaType === 'PHOTO' ? 'image/*' : 'video/*'}
            onChange={handleFileChange}
          />

          {entries.length > 0 && (
            <ul className="mt-3 space-y-2">
              {entries.map((entry, idx) => (
                <li key={idx} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                  {entry.preview ? (
                    <img src={entry.preview} alt="" className="h-10 w-10 rounded object-cover flex-shrink-0" />
                  ) : (
                    <div className="h-10 w-10 rounded bg-gray-200 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs text-gray-500">vid</span>
                    </div>
                  )}
                  <span className="text-sm text-gray-700 flex-1 truncate">{entry.file.name}</span>
                  <span className={`text-xs font-medium ${
                    entry.status === 'done' ? 'text-green-600' :
                    entry.status === 'error' ? 'text-red-500' :
                    entry.status === 'uploading' ? 'text-blue-500' : 'text-gray-400'
                  }`}>
                    {entry.status === 'done' ? '✓ Done' :
                     entry.status === 'error' ? '✗ Error' :
                     entry.status === 'uploading' ? 'Resizing & uploading…' : 'Pending'}
                  </span>
                  {entry.status !== 'uploading' && entry.status !== 'done' && (
                    <button type="button" onClick={() => removeEntry(idx)} className="text-gray-400 hover:text-red-500">
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Title */}
        <div>
          <label className="label">
            Title {entries.length <= 1 ? '*' : ''}
            {entries.length > 1 && <span className="text-gray-400 font-normal ml-1">(used as prefix for each file)</span>}
          </label>
          <input
            type="text"
            className="input"
            required={entries.length <= 1}
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
          <button type="submit" disabled={loading || !pendingCount} className="btn-primary">
            {loading
              ? `Processing ${entries.filter((e) => e.status === 'uploading').map((_, i) => i + 1)[0] ?? '…'}/${entries.length}`
              : `Upload ${pendingCount || entries.length} File${entries.length !== 1 ? 's' : ''}`}
          </button>
          <Link href="/admin/gallery" className="btn-secondary">Cancel</Link>
        </div>
      </form>
    </div>
  )
}
