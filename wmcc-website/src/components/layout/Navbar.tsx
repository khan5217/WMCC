'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, ChevronDown, LogIn, UserCircle, LogOut, Shield } from 'lucide-react'
import { cn } from '@/lib/utils'
import axios from 'axios'

interface NavUser {
  id: string
  firstName: string
  lastName: string
  role: string
  avatarUrl?: string
}

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About' },
  {
    label: 'Teams',
    children: [
      { href: '/teams/1st-xi', label: '1st XI' },
      { href: '/teams/2nd-xi', label: '2nd XI' },
      { href: '/players', label: 'All Players' },
    ],
  },
  {
    label: 'Cricket',
    children: [
      { href: '/fixtures', label: 'Fixtures & Results' },
      { href: '/scorecards', label: 'Scorecards' },
    ],
  },
  { href: '/news', label: 'News' },
  { href: '/gallery', label: 'Gallery' },
  { href: '/contact', label: 'Contact' },
]

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [user, setUser] = useState<NavUser | null>(null)
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const pathname = usePathname()

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.get('/api/auth/me')
        setUser(res.data.user)
      } catch {
        setUser(null)
      }
    }
    fetchUser()
  }, [pathname])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const handleLogout = async () => {
    await axios.post('/api/auth/logout')
    setUser(null)
    window.location.href = '/'
  }

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        scrolled
          ? 'bg-white shadow-md border-b border-gray-100'
          : 'bg-white/95 backdrop-blur-sm'
      )}
    >
      {/* Top bar */}
      <div className="bg-gray-900 text-cricket-gold text-xs py-1.5 px-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <span className="tracking-wide">WMCC Milton Keynes Cricket Club — Est. 1985</span>
          <span className="hidden sm:block text-gray-400">info@wmcc.co.uk | +44 7000 000000</span>
        </div>
      </div>

      {/* Main nav */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <img
              src="/images/logo.png"
              alt="WMCC"
              className="h-12 w-12 object-contain rounded-full"
              onError={(e) => {
                const t = e.currentTarget
                t.style.display = 'none'
                const fallback = t.nextElementSibling as HTMLElement
                if (fallback) fallback.style.display = 'flex'
              }}
            />
            <div className="hidden w-10 h-10 bg-cricket-green rounded-full items-center justify-center text-white font-bold text-lg group-hover:bg-cricket-dark transition-colors">
              W
            </div>
            <div className="hidden sm:block">
              <div className="font-bold text-gray-900 leading-tight">WMCC</div>
              <div className="text-xs text-cricket-gold leading-tight font-medium">Milton Keynes CC</div>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {NAV_LINKS.map((link) =>
              link.children ? (
                <div
                  key={link.label}
                  className="relative"
                  onMouseEnter={() => setOpenDropdown(link.label)}
                  onMouseLeave={() => setOpenDropdown(null)}
                >
                  <button className={cn('nav-link flex items-center gap-1 py-2 px-3 rounded-md hover:bg-green-50')}>
                    {link.label}
                    <ChevronDown className="h-4 w-4" />
                  </button>
                  {openDropdown === link.label && (
                    <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-1 animate-slide-down">
                      {link.children.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          className={cn(
                            'block px-4 py-2.5 text-sm text-gray-700 hover:bg-green-50 hover:text-cricket-green transition-colors',
                            pathname === child.href && 'text-cricket-green font-medium bg-green-50'
                          )}
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  key={link.href}
                  href={link.href!}
                  className={cn(
                    'nav-link py-2 px-3 rounded-md hover:bg-green-50',
                    pathname === link.href && 'nav-link-active text-cricket-green'
                  )}
                >
                  {link.label}
                </Link>
              )
            )}
          </nav>

          {/* Auth buttons */}
          <div className="hidden lg:flex items-center gap-3">
            {user ? (
              <div className="relative group">
                <button className="flex items-center gap-2 text-gray-700 hover:text-cricket-green transition-colors py-2 px-3 rounded-md hover:bg-green-50">
                  <UserCircle className="h-5 w-5" />
                  <span className="font-medium text-sm">{user.firstName}</span>
                  <ChevronDown className="h-4 w-4" />
                </button>
                <div className="absolute right-0 top-full mt-1 w-52 bg-white rounded-lg shadow-lg border border-gray-100 py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                  <Link href="/members" className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-green-50 hover:text-cricket-green">
                    <UserCircle className="h-4 w-4" /> My Profile
                  </Link>
                  <Link href="/members/documents" className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-green-50 hover:text-cricket-green">
                    <Shield className="h-4 w-4" /> Private Documents
                  </Link>
                  {(user.role === 'ADMIN' || user.role === 'COMMITTEE') && (
                    <Link href="/admin" className="flex items-center gap-2 px-4 py-2.5 text-sm text-cricket-green hover:bg-green-50 font-medium">
                      <Shield className="h-4 w-4" /> Admin Panel
                    </Link>
                  )}
                  <hr className="my-1 border-gray-100" />
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="h-4 w-4" /> Sign Out
                  </button>
                </div>
              </div>
            ) : (
              <>
                <Link href="/members/login" className="nav-link py-2 px-3 text-sm font-medium flex items-center gap-1">
                  <LogIn className="h-4 w-4" /> Members Login
                </Link>
                <Link href="/membership" className="btn-primary text-sm py-2 px-4">
                  Join the Club
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="lg:hidden p-2 rounded-md text-gray-700 hover:bg-green-50 hover:text-cricket-green"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden bg-white border-t border-gray-100 shadow-lg">
          <nav className="max-w-7xl mx-auto px-4 py-4 space-y-1">
            {NAV_LINKS.map((link) =>
              link.children ? (
                <div key={link.label}>
                  <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 py-1 mt-3">
                    {link.label}
                  </div>
                  {link.children.map((child) => (
                    <Link
                      key={child.href}
                      href={child.href}
                      className="block px-3 py-2 rounded-md text-gray-700 hover:bg-green-50 hover:text-cricket-green"
                      onClick={() => setMobileOpen(false)}
                    >
                      {child.label}
                    </Link>
                  ))}
                </div>
              ) : (
                <Link
                  key={link.href}
                  href={link.href!}
                  className={cn(
                    'block px-3 py-2 rounded-md text-gray-700 hover:bg-green-50 hover:text-cricket-green',
                    pathname === link.href && 'text-cricket-green font-medium bg-green-50'
                  )}
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </Link>
              )
            )}
            <div className="pt-4 border-t border-gray-100 space-y-2">
              {user ? (
                <>
                  <Link href="/members" className="block px-3 py-2 text-gray-700 hover:bg-green-50 rounded-md" onClick={() => setMobileOpen(false)}>
                    My Profile
                  </Link>
                  <button onClick={() => { handleLogout(); setMobileOpen(false) }} className="block w-full text-left px-3 py-2 text-red-600 hover:bg-red-50 rounded-md">
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link href="/members/login" className="block px-3 py-2 text-center border border-cricket-green text-cricket-green rounded-lg font-medium" onClick={() => setMobileOpen(false)}>
                    Members Login
                  </Link>
                  <Link href="/membership" className="block px-3 py-2 text-center bg-cricket-green text-white rounded-lg font-medium" onClick={() => setMobileOpen(false)}>
                    Join the Club
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
