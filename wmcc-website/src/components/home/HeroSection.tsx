'use client'

import Link from 'next/link'
import { formatDate } from '@/lib/utils'
import { MapPin, Calendar, ChevronRight, Trophy } from 'lucide-react'
import { motion } from 'framer-motion'

interface Match {
  id: string
  opposition: string
  venue: string
  date: Date
  isHome: boolean
  team: { name: string }
}

export function HeroSection({ upcomingMatch }: { upcomingMatch?: Match }) {
  return (
    <section
      className="h-[100svh] md:min-h-[85vh] md:h-auto flex flex-col md:flex-row md:items-center relative overflow-hidden pt-24"
      style={{
        backgroundImage: 'url(https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=2560&q=80)',
        backgroundSize: 'cover',
        backgroundPosition: 'center top',
      }}
    >
      {/* Dark overlay — keeps text readable over the stadium image */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/65 to-black/30" />
      {/* Subtle gold vignette at bottom */}
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/60 to-transparent" />

      <div className="flex-1 flex flex-col md:block w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 relative z-10">
        <div className="flex-1 flex flex-col justify-between md:block max-w-3xl">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white text-xs sm:text-sm font-medium px-3 py-1.5 sm:px-4 sm:py-2 rounded-full mb-4 md:mb-6"
          >
            <Trophy className="h-4 w-4 text-yellow-400" />
            Est. 2020 — Proud Members of South Northants League
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-7xl font-bold text-white font-serif leading-tight mb-3 md:mb-6"
          >
            Welcome to
            <br />
            <span className="text-cricket-gold">WMCC</span>
            <br />
            Cricket Club
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-base md:text-xl text-green-100 mb-6 md:mb-10 max-w-xl leading-relaxed"
          >
            Milton Keynes&apos; premier cricket club. From grassroots to competitive league cricket —
            everyone is welcome at WMCC.
          </motion.p>

          {/* CTA buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-wrap gap-4"
          >
            <Link href="/membership" className="btn-outline-white flex items-center gap-2 text-base">
              Join the Club <ChevronRight className="h-4 w-4" />
            </Link>
            <Link href="/fixtures" className="bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 border border-white/20">
              View Fixtures
            </Link>
          </motion.div>

          {/* Next match card */}
          {upcomingMatch && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mt-6 md:mt-12 inline-block bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4 md:p-5"
            >
              <div className="text-xs text-green-300 font-semibold uppercase tracking-wider mb-2">
                🏏 Next Match
              </div>
              <div className="text-white font-bold text-lg mb-2">
                {upcomingMatch.team.name} vs {upcomingMatch.opposition}
              </div>
              <div className="flex flex-wrap gap-3 text-sm text-green-100">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {formatDate(upcomingMatch.date, 'EEE dd MMM yyyy')}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {upcomingMatch.isHome ? '🏠' : '✈️'} {upcomingMatch.venue}
                </span>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Bottom wave */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 60" className="w-full text-white" fill="currentColor" preserveAspectRatio="none">
          <path d="M0,30 C360,60 1080,0 1440,30 L1440,60 L0,60 Z" />
        </svg>
      </div>
    </section>
  )
}
