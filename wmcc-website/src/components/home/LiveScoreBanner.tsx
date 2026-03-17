'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Radio } from 'lucide-react'

type LiveMatch = {
  id: string
  opposition: string
  liveScore: string | null
  team: { name: string }
  cricheroesUrl: string | null
}

export function LiveScoreBanner() {
  const pathname = usePathname()
  const [matches, setMatches] = useState<LiveMatch[]>([])

  const poll = () => {
    fetch('/api/matches/live')
      .then((r) => r.json())
      .then((data) => setMatches(Array.isArray(data) ? data : []))
      .catch(() => {})
  }

  useEffect(() => {
    poll()
    const interval = setInterval(poll, 30_000)
    return () => clearInterval(interval)
  }, [])

  if (pathname.startsWith('/admin') || matches.length === 0) return null

  return (
    <div className="bg-red-600 text-white">
      {matches.map((match) => (
        <div key={match.id} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest bg-white/20 rounded px-2 py-0.5 animate-pulse">
              <Radio className="h-3 w-3" /> LIVE
            </span>
            <span className="font-semibold text-sm">
              {match.team.name} vs {match.opposition}
            </span>
            {match.liveScore && (
              <span className="font-mono text-sm bg-white/10 rounded px-2 py-0.5">
                {match.liveScore}
              </span>
            )}
            <span className="text-red-200 text-xs">· Updates every 30s</span>
          </div>
          {match.cricheroesUrl && (
            <a
              href={match.cricheroesUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-semibold underline underline-offset-2 hover:text-red-100 flex-shrink-0"
            >
              Full scorecard on CricHeroes →
            </a>
          )}
        </div>
      ))}
    </div>
  )
}
