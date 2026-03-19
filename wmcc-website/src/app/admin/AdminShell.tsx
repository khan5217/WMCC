'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Users, Trophy, Newspaper, Camera, FileText, Settings,
  LayoutDashboard, Mail, Star, Upload, Menu, X, ChevronRight, PoundSterling,
} from 'lucide-react'

const NAV = [
  { href: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/admin/players', icon: Users, label: 'Players' },
  { href: '/admin/matches', icon: Trophy, label: 'Matches' },
  { href: '/admin/news', icon: Newspaper, label: 'News' },
  { href: '/admin/gallery', icon: Camera, label: 'Gallery' },
  { href: '/admin/documents', icon: FileText, label: 'Documents' },
  { href: '/admin/members', icon: Users, label: 'Members' },
  { href: '/admin/membership-fees', icon: PoundSterling, label: 'Membership Fees' },
  { href: '/admin/match-fees', icon: Trophy, label: 'Match Fees' },
  { href: '/admin/sponsors', icon: Star, label: 'Sponsors' },
  { href: '/admin/import', icon: Upload, label: 'CSV Import' },
  { href: '/admin/contacts', icon: Mail, label: 'Contact Messages' },
  { href: '/admin/settings', icon: Settings, label: 'Settings' },
]

interface Props {
  children: React.ReactNode
  userName: string
}

export default function AdminShell({ children, userName }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()

  const NavLinks = ({ onClick }: { onClick?: () => void }) => (
    <>
      {NAV.map(({ href, icon: Icon, label }) => {
        const active = pathname === href || (href !== '/admin' && pathname.startsWith(href))
        return (
          <Link
            key={href}
            href={href}
            onClick={onClick}
            className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-colors mb-0.5 text-sm min-h-[44px]
              ${active
                ? 'bg-cricket-green text-white font-medium'
                : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
            {active && <ChevronRight className="h-3 w-3 ml-auto opacity-70" />}
          </Link>
        )
      })}
      <div className="border-t border-gray-800 mt-3 pt-3">
        <Link
          href="/"
          onClick={onClick}
          className="flex items-center gap-3 px-3 py-3 rounded-lg text-gray-400 hover:text-white text-sm min-h-[44px]"
        >
          ← Back to Website
        </Link>
      </div>
    </>
  )

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* ── Desktop sidebar ── */}
      <aside className="hidden lg:flex w-64 bg-gray-900 min-h-screen fixed top-0 left-0 z-40 pt-[90px] flex-col overflow-y-auto">
        <div className="border-b border-cricket-gold/20 px-5 py-4">
          <div className="text-cricket-gold font-bold text-base tracking-wide">WMCC Admin</div>
          <div className="text-gray-500 text-xs mt-0.5">{userName}</div>
        </div>
        <nav className="py-4 px-3 flex-1">
          <NavLinks />
        </nav>
      </aside>

      {/* ── Mobile top bar ── */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-4 h-14">
        <span className="text-cricket-gold font-bold tracking-wide text-sm">WMCC Admin</span>
        <button
          onClick={() => setSidebarOpen(true)}
          className="text-gray-300 p-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
          aria-label="Open menu"
        >
          <Menu className="h-6 w-6" />
        </button>
      </div>

      {/* ── Mobile sidebar overlay ── */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setSidebarOpen(false)}
          />
          {/* Drawer */}
          <div className="relative w-72 max-w-[85vw] bg-gray-900 h-full overflow-y-auto flex flex-col pt-4 shadow-2xl">
            <div className="flex items-center justify-between px-5 pb-4 border-b border-cricket-gold/20">
              <div>
                <div className="text-cricket-gold font-bold tracking-wide">WMCC Admin</div>
                <div className="text-gray-500 text-xs mt-0.5">{userName}</div>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="text-gray-400 hover:text-white p-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="py-4 px-3 flex-1">
              <NavLinks onClick={() => setSidebarOpen(false)} />
            </nav>
          </div>
        </div>
      )}

      {/* ── Main content ── */}
      <main className="flex-1 min-h-screen lg:ml-64 pt-14 lg:pt-[90px]">
        {children}
      </main>
    </div>
  )
}
