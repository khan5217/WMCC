'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import axios from 'axios'
import toast from 'react-hot-toast'
import { Plus, Pencil, Trash2, X, Check, ChevronLeft } from 'lucide-react'

const CURRENT_YEAR = new Date().getFullYear()

interface Product {
  id: string
  name: string
  description: string | null
  starterAmount: number
  subAmount: number
  season: number
  isActive: boolean
}

function fmt(pence: number) {
  return `£${(pence / 100).toFixed(2)}`
}

const emptyForm = {
  name: '',
  description: '',
  starterAmount: '',
  subAmount: '',
  season: String(CURRENT_YEAR),
  isActive: true,
}

export default function FeeProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await axios.get('/api/admin/match-fees/products')
      setProducts(res.data)
    } catch {
      toast.error('Failed to load fee products')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const openNew = () => {
    setEditing(null)
    setForm(emptyForm)
    setShowForm(true)
  }

  const openEdit = (p: Product) => {
    setEditing(p)
    setForm({
      name: p.name,
      description: p.description ?? '',
      starterAmount: String(p.starterAmount / 100),
      subAmount: String(p.subAmount / 100),
      season: String(p.season),
      isActive: p.isActive,
    })
    setShowForm(true)
  }

  const handleSave = async () => {
    if (!form.name.trim()) return toast.error('Name is required')
    setSaving(true)
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        starterAmount: Math.round(parseFloat(form.starterAmount || '0') * 100),
        subAmount: Math.round(parseFloat(form.subAmount || '0') * 100),
        season: parseInt(form.season),
        isActive: form.isActive,
      }
      if (editing) {
        await axios.patch(`/api/admin/match-fees/products/${editing.id}`, payload)
        toast.success('Fee product updated')
      } else {
        await axios.post('/api/admin/match-fees/products', payload)
        toast.success('Fee product created')
      }
      setShowForm(false)
      fetchData()
    } catch {
      toast.error('Failed to save fee product')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return
    try {
      await axios.delete(`/api/admin/match-fees/products/${id}`)
      toast.success('Deleted')
      fetchData()
    } catch {
      toast.error('Failed to delete')
    }
  }

  return (
    <div className="p-4 md:p-8 max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/match-fees" className="flex items-center gap-1 text-gray-400 hover:text-gray-600 text-sm">
          <ChevronLeft className="h-4 w-4" /> Match Fees
        </Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-2xl font-bold text-gray-900 font-serif">Fee Products</h1>
        <button onClick={openNew} className="ml-auto btn-primary flex items-center gap-2 text-sm">
          <Plus className="h-4 w-4" /> New Product
        </button>
      </div>

      <p className="text-sm text-gray-500 mb-6">
        Fee products define how much players are charged per match. You can set different amounts for starters and substitutes.
        Each match then uses a product when assigning fees to players.
      </p>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-gray-400 text-sm">Loading...</div>
        ) : products.length === 0 ? (
          <div className="py-12 text-center text-gray-400 text-sm">
            No fee products yet. Create one to get started.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {products.map((p) => (
              <div key={p.id} className="flex items-center gap-4 px-5 py-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-gray-900 text-sm">{p.name}</span>
                    <span className="text-xs text-gray-400">{p.season}</span>
                    {!p.isActive && (
                      <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Inactive</span>
                    )}
                  </div>
                  {p.description && (
                    <div className="text-xs text-gray-400 mt-0.5 truncate">{p.description}</div>
                  )}
                  <div className="flex gap-4 mt-1 text-xs text-gray-600">
                    <span>Starter: <strong>{fmt(p.starterAmount)}</strong></span>
                    <span>Sub: <strong>{fmt(p.subAmount)}</strong></span>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => openEdit(p)} className="p-2 text-gray-400 hover:text-cricket-green hover:bg-green-50 rounded-lg transition-colors">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button onClick={() => handleDelete(p.id, p.name)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">{editing ? 'Edit Fee Product' : 'New Fee Product'}</h2>
              <button onClick={() => setShowForm(false)} className="p-1 text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">Product Name *</label>
                <input
                  type="text"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm"
                  placeholder="e.g. Senior Match Fee"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">Starter Fee (£)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.50"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm"
                    placeholder="e.g. 10.00"
                    value={form.starterAmount}
                    onChange={(e) => setForm((f) => ({ ...f, starterAmount: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">Sub Fee (£)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.50"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm"
                    placeholder="e.g. 5.00"
                    value={form.subAmount}
                    onChange={(e) => setForm((f) => ({ ...f, subAmount: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">Season</label>
                <select
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-white"
                  value={form.season}
                  onChange={(e) => setForm((f) => ({ ...f, season: e.target.value }))}
                >
                  {[CURRENT_YEAR + 1, CURRENT_YEAR, CURRENT_YEAR - 1].map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">Description (optional)</label>
                <input
                  type="text"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm"
                  placeholder="e.g. Standard fee for senior league matches"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                  className="accent-cricket-green"
                />
                <span className="text-sm text-gray-700">Active</span>
              </label>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowForm(false)}
                className="flex-1 border border-gray-200 text-gray-600 hover:bg-gray-50 py-2.5 rounded-lg text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 bg-cricket-green hover:bg-cricket-dark text-white py-2.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? 'Saving...' : <><Check className="h-4 w-4" /> Save</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
