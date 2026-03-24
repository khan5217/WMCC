'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { Mail, Phone, MapPin, Facebook, Twitter, Instagram, Youtube, Linkedin } from 'lucide-react'
import axios from 'axios'

export function Footer() {
  const pathname = usePathname()
  const [loggedIn, setLoggedIn] = useState(false)

  useEffect(() => {
    axios.get('/api/auth/me').then((res) => setLoggedIn(!!res.data.user)).catch(() => setLoggedIn(false))
  }, [pathname])

  if (pathname.startsWith('/admin')) return null

  return (
    <footer className="bg-gray-900 text-gray-300">
      {/* Main footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-10">
          {/* Club info */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <img
                src="https://zkbeifjlj6gi0c4b.public.blob.vercel-storage.com/WMCC_Logo.jpg"
                alt="WMCC"
                className="w-10 h-10 object-contain rounded-full"
              />
              <div>
                <div className="font-bold text-white text-lg">WMCC</div>
                <div className="text-xs text-gray-400">Milton Keynes</div>
              </div>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              WMCC Milton Keynes Cricket Club — a proud community cricket club established in 2020,
              nurturing talent and celebrating the sport in Milton Keynes.
            </p>
            <div className="flex gap-2 mt-5">
              <a href="https://www.facebook.com/wmccmk" target="_blank" rel="noopener noreferrer" className="w-11 h-11 bg-gray-800 hover:bg-cricket-green rounded-full flex items-center justify-center transition-colors" aria-label="Facebook">
                <Facebook className="h-4 w-4" />
              </a>
              <a href="https://x.com/wmccmk" target="_blank" rel="noopener noreferrer" className="w-11 h-11 bg-gray-800 hover:bg-cricket-green rounded-full flex items-center justify-center transition-colors" aria-label="X (Twitter)">
                <Twitter className="h-4 w-4" />
              </a>
              <a href="https://www.instagram.com/wmccmk" target="_blank" rel="noopener noreferrer" className="w-11 h-11 bg-gray-800 hover:bg-cricket-green rounded-full flex items-center justify-center transition-colors" aria-label="Instagram">
                <Instagram className="h-4 w-4" />
              </a>
              <a href="https://www.youtube.com/@wmccmk" target="_blank" rel="noopener noreferrer" className="w-11 h-11 bg-gray-800 hover:bg-cricket-green rounded-full flex items-center justify-center transition-colors" aria-label="YouTube">
                <Youtube className="h-4 w-4" />
              </a>
              <a href="https://www.linkedin.com/company/wmcc-mk" target="_blank" rel="noopener noreferrer" className="w-11 h-11 bg-gray-800 hover:bg-cricket-green rounded-full flex items-center justify-center transition-colors" aria-label="LinkedIn">
                <Linkedin className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Quick Links</h3>
            <ul className="space-y-2.5">
              {[
                { href: '/about', label: 'About the Club' },
                { href: '/teams/1st-xi', label: '1st XI Team' },
                { href: '/teams/2nd-xi', label: '2nd XI Team' },
                { href: '/fixtures', label: 'Fixtures & Results' },
                { href: '/news', label: 'News & Reports' },
                { href: '/gallery', label: 'Photo Gallery' },
                { href: '/contact', label: 'Contact Us' },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-400 hover:text-cricket-light transition-colors hover:translate-x-1 inline-block"
                  >
                    → {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Members */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Members Area</h3>
            <ul className="space-y-2.5">
              {[
                !loggedIn && { href: '/members/login', label: 'Members Login' },
                !loggedIn && { href: '/membership', label: 'Join the Club' },
                loggedIn && { href: '/members/documents', label: 'Private Documents' },
                loggedIn && { href: '/members/profile', label: 'My Profile' },
              ].filter(Boolean).map((link: any) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-400 hover:text-cricket-light transition-colors"
                  >
                    → {link.label}
                  </Link>
                </li>
              ))}
            </ul>
            {!loggedIn && (
              <div className="mt-6">
                <Link
                  href="/membership"
                  className="inline-block bg-cricket-green hover:bg-cricket-dark text-white text-sm font-semibold py-2.5 px-5 rounded-lg transition-colors"
                >
                  Join the Club →
                </Link>
              </div>
            )}
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Get In Touch</h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-cricket-green mt-0.5 shrink-0" />
                <span className="text-sm text-gray-400">
                  Crownhill Cricket Ground<br />
                  6 Marley Grove<br />
                  Milton Keynes, MK8 0AT
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-cricket-green shrink-0" />
                <a href="tel:+447700102848" className="text-sm text-gray-400 hover:text-cricket-light transition-colors">
                  +44 7700 102848
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-cricket-green shrink-0" />
                <a href="mailto:contact@wmccmk.com" className="text-sm text-gray-400 hover:text-cricket-light transition-colors">
                  contact@wmccmk.com
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row justify-between items-center gap-2">
          <p className="text-xs text-gray-500">
            © {new Date().getFullYear()} WMCC Milton Keynes Cricket Club. All rights reserved.
          </p>
          <div className="flex gap-4">
            <Link href="/privacy" className="text-sm text-gray-500 hover:text-gray-300 transition-colors py-1">Privacy Policy</Link>
            <Link href="/terms" className="text-sm text-gray-500 hover:text-gray-300 transition-colors py-1">Terms of Use</Link>
            <Link href="/safeguarding" className="text-sm text-gray-500 hover:text-gray-300 transition-colors py-1">Safeguarding</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
