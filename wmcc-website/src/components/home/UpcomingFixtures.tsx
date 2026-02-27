import Link from 'next/link'
import { formatDate } from '@/lib/utils'
import { Calendar, MapPin } from 'lucide-react'

interface Match {
  id: string
  opposition: string
  venue: string
  date: Date
  isHome: boolean
  format: string
  leagueName: string | null
  team: { name: string }
}

const formatMap: Record<string, string> = {
  T20: 'T20',
  ONE_DAY: 'One Day',
  TWO_DAY: '2 Day',
  FRIENDLY: 'Friendly',
}

export function UpcomingFixtures({ matches }: { matches: Match[] }) {
  return (
    <section className="section-padding bg-white">
      <div className="container-max">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="section-title">Upcoming Fixtures</h2>
            <p className="section-subtitle">Don&apos;t miss a match</p>
          </div>
          <Link href="/fixtures" className="text-sm text-cricket-green hover:text-cricket-dark font-medium">
            Full schedule →
          </Link>
        </div>

        {matches.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Calendar className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>No upcoming fixtures scheduled</p>
          </div>
        ) : (
          <div className="space-y-3">
            {matches.map((match) => (
              <div key={match.id} className="card p-4 border-l-4 border-cricket-green">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900 mb-1">
                      {match.team.name} {match.isHome ? 'vs' : '@'} {match.opposition}
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(match.date, 'EEE dd MMM, h:mm a')}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {match.venue}
                      </span>
                    </div>
                    {match.leagueName && (
                      <div className="text-xs text-gray-400 mt-1">{match.leagueName}</div>
                    )}
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <span className="inline-block bg-green-50 text-cricket-green text-xs font-semibold px-2.5 py-1 rounded-full">
                      {formatMap[match.format] ?? match.format}
                    </span>
                    <div className="text-xs text-gray-400 mt-1">
                      {match.isHome ? '🏠 Home' : '✈️ Away'}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
