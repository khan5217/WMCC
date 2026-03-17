'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import axios from 'axios'
import toast from 'react-hot-toast'
import { User, Lock, ArrowLeft } from 'lucide-react'

export default function EditProfilePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)

  const [profile, setProfile] = useState({ firstName: '', lastName: '', phone: '' })
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })

  useEffect(() => {
    axios.get('/api/auth/me')
      .then((res) => {
        const u = res.data.user
        setProfile({ firstName: u.firstName, lastName: u.lastName, phone: u.phone ?? '' })
      })
      .catch(() => router.push('/members/login'))
      .finally(() => setFetching(false))
  }, [router])

  const handleProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await axios.patch('/api/members/profile', profile)
      toast.success('Profile updated!')
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? 'Update failed')
    } finally {
      setLoading(false)
    }
  }

  const handlePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (passwords.newPassword !== passwords.confirmPassword) {
      toast.error('New passwords do not match')
      return
    }
    setLoading(true)
    try {
      await axios.patch('/api/members/profile', {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      })
      toast.success('Password changed!')
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? 'Failed to change password')
    } finally {
      setLoading(false)
    }
  }

  if (fetching) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-cricket-green border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="hero-gradient pt-24 pb-10">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <Link href="/members" className="inline-flex items-center gap-1.5 text-green-200 hover:text-white text-sm mb-4">
            <ArrowLeft className="h-4 w-4" /> Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-white font-serif">Edit Profile</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Personal info */}
        <div className="card p-5 sm:p-7">
          <h2 className="font-bold text-gray-900 text-lg mb-5 flex items-center gap-2">
            <User className="h-5 w-5 text-cricket-green" /> Personal Information
          </h2>
          <form onSubmit={handleProfile} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">First Name</label>
                <input
                  className="input"
                  type="text"
                  required
                  value={profile.firstName}
                  onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Last Name</label>
                <input
                  className="input"
                  type="text"
                  required
                  value={profile.lastName}
                  onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="label">Mobile Number</label>
              <input
                className="input"
                type="tel"
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                placeholder="+447911123456"
              />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full sm:w-auto">
              {loading ? 'Saving…' : 'Save Changes'}
            </button>
          </form>
        </div>

        {/* Change password */}
        <div className="card p-5 sm:p-7">
          <h2 className="font-bold text-gray-900 text-lg mb-5 flex items-center gap-2">
            <Lock className="h-5 w-5 text-cricket-green" /> Change Password
          </h2>
          <form onSubmit={handlePassword} className="space-y-4">
            <div>
              <label className="label">Current Password</label>
              <input
                className="input"
                type="password"
                required
                value={passwords.currentPassword}
                onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
              />
            </div>
            <div>
              <label className="label">New Password</label>
              <input
                className="input"
                type="password"
                required
                minLength={8}
                value={passwords.newPassword}
                onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                placeholder="Min 8 characters"
              />
            </div>
            <div>
              <label className="label">Confirm New Password</label>
              <input
                className="input"
                type="password"
                required
                value={passwords.confirmPassword}
                onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
              />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full sm:w-auto">
              {loading ? 'Changing…' : 'Change Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
