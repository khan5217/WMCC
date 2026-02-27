import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { getSessionUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { formatDate, initials } from '@/lib/utils'
import { User, FileText, CreditCard, Settings, Trophy, Shield } from 'lucide-react'

export default async function MembersDashboardPage() {
  const sessionUser = await getSessionUser()
  if (!sessionUser) redirect('/members/login')

  const user = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    include: {
      player: {
        include: {
          teams: { select: { name: true } },
          performances: {
            select: { runs: true, wickets: true, isOut: true, isManOfMatch: true },
          },
        },
      },
      memberships: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  })

  if (!user) redirect('/members/login')

  const latestMembership = user.memberships[0]

  // Quick stats
  const perfs = user.player?.performances ?? []
  const totalRuns = perfs.reduce((s, p) => s + (p.runs ?? 0), 0)
  const totalWickets = perfs.reduce((s, p) => s + (p.wickets ?? 0), 0)
  const motm = perfs.filter((p) => p.isManOfMatch).length

  const membershipColors: Record<string, string> = {
    ACTIVE: 'bg-green-100 text-green-800',
    PENDING: 'bg-yellow-100 text-yellow-800',
    EXPIRED: 'bg-red-100 text-red-800',
    SUSPENDED: 'bg-gray-100 text-gray-600',
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="hero-gradient pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-full overflow-hidden bg-white/20 border-4 border-white/30 flex items-center justify-center flex-shrink-0">
              {user.avatarUrl ? (
                <Image src={user.avatarUrl} alt="" width={64} height={64} className="object-cover" />
              ) : (
                <span className="text-2xl font-bold text-white">{initials(user.firstName, user.lastName)}</span>
              )}
            </div>
            <div>
              <div className="text-green-200 text-sm">Members Area</div>
              <h1 className="text-3xl font-bold text-white font-serif">
                Welcome back, {user.firstName}!
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${membershipColors[user.membershipStatus]}`}>
                  {user.membershipStatus}
                </span>
                {user.player?.teams.map((t) => (
                  <span key={t.name} className="text-xs bg-white/20 text-white px-2.5 py-0.5 rounded-full">
                    {t.name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left column */}
          <div className="space-y-6">
            {/* Membership card */}
            <div className="card p-6">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-cricket-green" />
                Membership
              </h3>
              {latestMembership ? (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Tier</span>
                    <span className="font-medium">{latestMembership.tier.replace(/_/g, ' ')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Season</span>
                    <span className="font-medium">{latestMembership.season}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Status</span>
                    <span className={`font-semibold ${latestMembership.status === 'PAID' ? 'text-green-600' : 'text-yellow-600'}`}>
                      {latestMembership.status}
                    </span>
                  </div>
                  {user.membershipExpiry && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Expires</span>
                      <span className="font-medium">{formatDate(user.membershipExpiry)}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-500 text-sm mb-3">No active membership</p>
                  <Link href="/membership" className="btn-primary text-sm py-2">
                    Register Now
                  </Link>
                </div>
              )}
            </div>

            {/* Quick links */}
            <div className="card p-6">
              <h3 className="font-bold text-gray-900 mb-4">Quick Links</h3>
              <div className="space-y-2">
                {[
                  { href: '/members/profile', icon: User, label: 'Edit Profile' },
                  { href: '/members/documents', icon: FileText, label: 'Private Documents' },
                  { href: '/membership', icon: CreditCard, label: 'Renew Membership' },
                  ...(user.role === 'ADMIN' || user.role === 'COMMITTEE'
                    ? [{ href: '/admin', icon: Shield, label: 'Admin Panel' }]
                    : []),
                ].map(({ href, icon: Icon, label }) => (
                  <Link
                    key={href}
                    href={href}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-green-50 hover:text-cricket-green transition-colors text-gray-700"
                  >
                    <Icon className="h-4 w-4" />
                    <span className="text-sm font-medium">{label}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Right column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Player stats */}
            {user.player && (
              <div className="card p-6">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-cricket-green" />
                  My Season Stats
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="stat-card">
                    <div className="stat-value">{totalRuns}</div>
                    <div className="stat-label">Total Runs</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value">{totalWickets}</div>
                    <div className="stat-label">Wickets</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value">{motm}</div>
                    <div className="stat-label">MOTM Awards</div>
                  </div>
                </div>
                <div className="mt-4">
                  <Link href={`/players/${user.player.id}`} className="text-sm text-cricket-green hover:underline font-medium">
                    View full profile →
                  </Link>
                </div>
              </div>
            )}

            {/* Account info */}
            <div className="card p-6">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Settings className="h-5 w-5 text-cricket-green" />
                Account Details
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                {[
                  { label: 'Full Name', value: `${user.firstName} ${user.lastName}` },
                  { label: 'Email', value: user.email },
                  { label: 'Phone', value: user.phone.replace(/(\+\d{2})\d+(\d{3})$/, '$1****$2') },
                  { label: 'Role', value: user.role },
                  { label: '2FA', value: user.twoFactorEnabled ? '✅ Enabled (SMS)' : '❌ Disabled' },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-gray-50 rounded-lg p-3">
                    <div className="text-gray-400 text-xs uppercase tracking-wider">{label}</div>
                    <div className="font-medium text-gray-900 mt-0.5">{value}</div>
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <Link href="/members/profile" className="text-sm text-cricket-green hover:underline font-medium">
                  Edit profile →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
