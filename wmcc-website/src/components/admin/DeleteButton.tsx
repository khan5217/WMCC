'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import toast from 'react-hot-toast'
import { Trash2 } from 'lucide-react'

interface Props {
  endpoint: string
  label: string
}

export default function DeleteButton({ endpoint, label }: Props) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    setLoading(true)
    try {
      await axios.delete(endpoint)
      toast.success(`${label} deleted`)
      router.refresh()
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? 'Delete failed')
      setConfirming(false)
    } finally {
      setLoading(false)
    }
  }

  if (confirming) {
    return (
      <span className="flex items-center gap-1.5">
        <button
          onClick={handleDelete}
          disabled={loading}
          className="text-xs text-red-600 font-semibold hover:text-red-800 disabled:opacity-50"
        >
          {loading ? '...' : 'Confirm'}
        </button>
        <span className="text-gray-300">|</span>
        <button onClick={() => setConfirming(false)} className="text-xs text-gray-400 hover:text-gray-600">
          Cancel
        </button>
      </span>
    )
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="text-red-300 hover:text-red-600 transition-colors"
      title={`Delete ${label}`}
    >
      <Trash2 className="h-3.5 w-3.5" />
    </button>
  )
}
