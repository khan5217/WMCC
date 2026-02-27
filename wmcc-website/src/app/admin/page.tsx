import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Users, Trophy, Newspaper, Camera, FileText, Mail, TrendingUp, AlertCircle } from 'lucide-react'

async function getAdminStats() {
  const [players, matches, news, members, contacts, pendingMembers] = await Promise.all([
    prisma.player.count({ where: { isActive: true } }),
    prisma.match.count(),
    prisma.newsArticle.count({ where: { status: 'PUBLISHED' } }),
    prisma.user.count({ where: { membershipStatus: 'ACTIVE' } }),
    prisma.contactMessage.count({ where: { isRead: false } }),
    prisma.user.count({ where: { membershipStatus: 'PENDING' } }),
  ])
  return { players, matches, news, members, contacts, pendingMembers }
}

export default async function AdminDashboard() {
  const stats = await getAdminStats()

  const cards = [
    { label: 'Active Players', value: stats.players, href: '/admin/players', icon: Users, color: 'bg-green-500' },
    { label: 'Total Matches', value: stats.matches, href: '/admin/matches', icon: Trophy, color: 'bg-blue-500' },
    { label: 'News Articles', value: stats.news, href: '/admin/news', icon: Newspaper, color: 'bg-purple-500' },
    { label: 'Active Members', value: stats.members, href: '/admin/members', icon: Users, color: 'bg-orange-500' },
    { label: 'Unread Messages', value: stats.contacts, href: '/admin/contacts', icon: Mail, color: 'bg-red-500' },
    { label: 'Pending Signups', value: stats.pendingMembers, href: '/admin/members', icon: AlertCircle, color: 'bg-yellow-500' },
  ]

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 font-serif">Admin Dashboard</h1>
        <p className="text-gray-500 mt-1">WMCC Cricket Club Management</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-10">
        {cards.map(({ label, value, href, icon: Icon, color }) => (
          <Link key={label} href={href} className="card p-6 hover:shadow-card-hover transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center`}>
                <Icon className="h-5 w-5 text-white" />
              </div>
              <TrendingUp className="h-4 w-4 text-gray-300" />
            </div>
            <div className="text-3xl font-bold text-gray-900">{value}</div>
            <div className="text-sm text-gray-500 mt-1">{label}</div>
          </Link>
        ))}
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { href: '/admin/matches/new', label: 'Add Match', icon: Trophy },
            { href: '/admin/news/new', label: 'Write Article', icon: Newspaper },
            { href: '/admin/players/new', label: 'Add Player', icon: Users },
            { href: '/admin/documents/upload', label: 'Upload Document', icon: FileText },
          ].map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="card p-5 text-center hover:border-cricket-green border-2 border-transparent transition-all"
            >
              <Icon className="h-8 w-8 text-cricket-green mx-auto mb-2" />
              <div className="font-medium text-gray-700 text-sm">{label}</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
