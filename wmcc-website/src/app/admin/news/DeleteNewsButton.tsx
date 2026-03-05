'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import toast from 'react-hot-toast'
import { Trash2 } from 'lucide-react'

export function DeleteNewsButton({ id, title }: { id: string; title: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return
    setLoading(true)
    try {
      await axios.delete(`/api/news?id=${id}`)
      toast.success('Article deleted')
      router.refresh()
    } catch {
      toast.error('Failed to delete article')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="text-red-400 hover:text-red-600 disabled:opacity-40 transition-colors flex items-center gap-1 text-xs"
      title="Delete article"
    >
      <Trash2 className="h-3 w-3" /> Delete
    </button>
  )
}
