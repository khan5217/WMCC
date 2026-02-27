import Link from 'next/link'
import { Mail, Phone, MapPin, Facebook, Twitter, Instagram, Youtube } from 'lucide-react'

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      {/* Main footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Club info */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-cricket-green rounded-full flex items-center justify-center text-white font-bold text-lg">
                W
              </div>
              <div>
                <div className="font-bold text-white text-lg">WMCC</div>
                <div className="text-xs text-gray-400">Milton Keynes CC</div>
              </div>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              WMCC Milton Keynes Cricket Club — a proud community cricket club established in 1985,
              nurturing talent and celebrating the sport in Milton Keynes.
            </p>
            <div className="flex gap-3 mt-5">
              <a href="#" className="w-8 h-8 bg-gray-800 hover:bg-cricket-green rounded-full flex items-center justify-center transition-colors" aria-label="Facebook">
                <Facebook className="h-4 w-4" />
              </a>
              <a href="#" className="w-8 h-8 bg-gray-800 hover:bg-cricket-green rounded-full flex items-center justify-center transition-colors" aria-label="Twitter">
                <Twitter className="h-4 w-4" />
              </a>
              <a href="#" className="w-8 h-8 bg-gray-800 hover:bg-cricket-green rounded-full flex items-center justify-center transition-colors" aria-label="Instagram">
                <Instagram className="h-4 w-4" />
              </a>
              <a href="#" className="w-8 h-8 bg-gray-800 hover:bg-cricket-green rounded-full flex items-center justify-center transition-colors" aria-label="YouTube">
                <Youtube className="h-4 w-4" />
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
                { href: '/members/login', label: 'Members Login' },
                { href: '/membership', label: 'Join the Club' },
                { href: '/members/documents', label: 'Private Documents' },
                { href: '/members/profile', label: 'My Profile' },
              ].map((link) => (
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
            <div className="mt-6">
              <Link
                href="/membership"
                className="inline-block bg-cricket-green hover:bg-cricket-dark text-white text-sm font-semibold py-2.5 px-5 rounded-lg transition-colors"
              >
                Join the Club →
              </Link>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Get In Touch</h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-cricket-green mt-0.5 shrink-0" />
                <span className="text-sm text-gray-400">
                  WMCC Cricket Ground<br />
                  Milton Keynes, MK1 1AA
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-cricket-green shrink-0" />
                <a href="tel:+4470000000000" className="text-sm text-gray-400 hover:text-cricket-light transition-colors">
                  +44 7000 000000
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-cricket-green shrink-0" />
                <a href="mailto:info@wmcc.co.uk" className="text-sm text-gray-400 hover:text-cricket-light transition-colors">
                  info@wmcc.co.uk
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
            <Link href="/privacy" className="text-xs text-gray-500 hover:text-gray-300 transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="text-xs text-gray-500 hover:text-gray-300 transition-colors">Terms of Use</Link>
            <Link href="/safeguarding" className="text-xs text-gray-500 hover:text-gray-300 transition-colors">Safeguarding</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
