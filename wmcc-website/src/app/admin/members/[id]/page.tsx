'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, User, Mail, Phone, Shield, Calendar } from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'

type Member = {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  role: string
  membershipStatus: string
  membershipTier: string | null
  membershipExpiry: string | null
  isVerified: boolean
  createdAt: string
  memberships: { tier: string; season: number; status: string; paidAt: string | null }[]
}

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-800',
  PENDING: 'bg-yellow-100 text-yellow-800',
  EXPIRED: 'bg-red-100 text-red-800',
  SUSPENDED: 'bg-gray-100 text-gray-600',
}

export default function ManageMemberPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [member, setMember] = useState<Member | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [role, setRole] = useState('')
  const [membershipStatus, setMembershipStatus] = useState('')
  const [membershipTier, setMembershipTier] = useState('')

  useEffect(() => {
    axios.get(`/api/admin/members/${id}`)
      .then(res => {
        const m = res.data
        setMember(m)
        setRole(m.role)
        setMembershipStatus(m.membershipStatus)
        setMembershipTier(m.membershipTier ?? '')
      })
      .catch(() => toast.error('Failed to load member'))
      .finally(() => setLoading(false))
  }, [id])

  const handleSave = async () => {
    setSaving(true)
    try {
      await axios.patch(`/api/admin/members/${id}`, {
        role,
        membershipStatus,
        ...(membershipTier ? { membershipTier } : {}),
      })
      toast.success('Member updated')
      router.refresh()
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? 'Failed to update member')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="p-8 text-gray-400">Loading...</div>
  }

  if (!member) {
    return <div className="p-8 text-red-500">Member not found.</div>
  }

  return (
    <div className="p-8 max-w-3xl">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin/members" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 font-serif">
            {member.firstName} {member.lastName}
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">Member ID: {member.id}</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Info card */}
        <div className="card p-6">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Member Info</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 text-sm">
              <Mail className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <span className="text-gray-700">{member.email}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Phone className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <span className="text-gray-700">{member.phone}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <User className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <span className="text-gray-700">
                Phone {member.isVerified ? <span className="text-green-600 font-medium">verified</span> : <span className="text-yellow-600 font-medium">not verified</span>}
              </span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Calendar className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <span className="text-gray-700">Joined {new Date(member.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
            </div>
          </div>
        </div>

        {/* Edit card */}
        <div className="card p-6">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Membership Settings</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="label">Status</label>
              <select className="input" value={membershipStatus} onChange={e => setMembershipStatus(e.target.value)}>
                <option value="PENDING">Pending</option>
                <option value="ACTIVE">Active</option>
                <option value="EXPIRED">Expired</option>
                <option value="SUSPENDED">Suspended</option>
              </select>
            </div>
            <div>
              <label className="label">Role</label>
              <select className="input" value={role} onChange={e => setRole(e.target.value)}>
                <option value="MEMBER">Member</option>
                <option value="PLAYER">Player</option>
                <option value="COMMITTEE">Committee</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
            <div>
              <label className="label">Tier</label>
              <select className="input" value={membershipTier} onChange={e => setMembershipTier(e.target.value)}>
                <option value="">— None —</option>
                <option value="PLAYING_SENIOR">Playing Senior</option>
                <option value="PLAYING_JUNIOR">Playing Junior</option>
                <option value="SOCIAL">Social</option>
                <option value="FAMILY">Family</option>
                <option value="LIFE">Life</option>
              </select>
            </div>
          </div>

          <div className="mt-5 flex justify-end">
            <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-2">
              <Save className="h-4 w-4" />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>

        {/* Payment history */}
        {member.memberships.length > 0 && (
          <div className="card p-6">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Payment History</h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-400 uppercase border-b">
                  <th className="pb-2">Season</th>
                  <th className="pb-2">Tier</th>
                  <th className="pb-2">Status</th>
                  <th className="pb-2">Paid</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {member.memberships.map((m, i) => (
                  <tr key={i}>
                    <td className="py-2.5 text-gray-700">{m.season}</td>
                    <td className="py-2.5 text-gray-700">{m.tier.replace(/_/g, ' ')}</td>
                    <td className="py-2.5">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[m.status] ?? 'bg-gray-100 text-gray-600'}`}>
                        {m.status}
                      </span>
                    </td>
                    <td className="py-2.5 text-gray-400 text-xs">
                      {m.paidAt ? new Date(m.paidAt).toLocaleDateString('en-GB') : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
