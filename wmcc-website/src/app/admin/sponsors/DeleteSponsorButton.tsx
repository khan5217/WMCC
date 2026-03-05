'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import toast from 'react-hot-toast'
import { Trash2 } from 'lucide-react'

export function DeleteSponsorButton({ id, name }: { id: string; name: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    if (!confirm(`Remove "${name}" as a sponsor? This cannot be undone.`)) return
    setLoading(true)
    try {
      await axios.delete(`/api/sponsors?id=${id}`)
      toast.success('Sponsor removed')
      router.refresh()
    } catch {
      toast.error('Failed to remove sponsor')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="text-red-400 hover:text-red-600 disabled:opacity-40 transition-colors"
      title="Remove sponsor"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  )
}
