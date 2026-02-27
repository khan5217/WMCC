import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getSessionUser } from '@/lib/auth'
import { Users, Trophy, Newspaper, Camera, FileText, Settings, LayoutDashboard, Mail, CreditCard } from 'lucide-react'

const NAV = [
  { href: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/admin/players', icon: Users, label: 'Players' },
  { href: '/admin/matches', icon: Trophy, label: 'Matches' },
  { href: '/admin/news', icon: Newspaper, label: 'News' },
  { href: '/admin/gallery', icon: Camera, label: 'Gallery' },
  { href: '/admin/documents', icon: FileText, label: 'Documents' },
  { href: '/admin/members', icon: Users, label: 'Members' },
  { href: '/admin/contacts', icon: Mail, label: 'Contact Messages' },
  { href: '/admin/settings', icon: Settings, label: 'Settings' },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser()

  if (!user || (user.role !== 'ADMIN' && user.role !== 'COMMITTEE')) {
    redirect('/members/login')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 min-h-screen fixed top-0 left-0 z-40 pt-0">
        {/* Sidebar header */}
        <div className="bg-cricket-green p-5">
          <div className="text-white font-bold text-lg">WMCC Admin</div>
          <div className="text-green-200 text-xs">{user.firstName} {user.lastName}</div>
        </div>

        <nav className="py-4 px-3">
          {NAV.map(({ href, icon: Icon, label }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition-colors mb-1 text-sm"
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>

        <div className="px-3 pb-4 mt-4 border-t border-gray-800 pt-4">
          <Link href="/" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-400 hover:text-white text-sm">
            ← Back to Website
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main className="ml-64 flex-1 min-h-screen">
        {children}
      </main>
    </div>
  )
}
