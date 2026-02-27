import Link from 'next/link'
import { formatDate, cn } from '@/lib/utils'
import { Trophy } from 'lucide-react'

interface Match {
  id: string
  opposition: string
  result: string | null
  wmccScore: string | null
  oppositionScore: string | null
  date: Date
  isHome: boolean
  team: { name: string }
}

function ResultBadge({ result }: { result: string | null }) {
  const map: Record<string, { label: string; cls: string }> = {
    WIN: { label: 'W', cls: 'bg-green-600 text-white' },
    LOSS: { label: 'L', cls: 'bg-red-600 text-white' },
    DRAW: { label: 'D', cls: 'bg-yellow-500 text-white' },
    TIE: { label: 'T', cls: 'bg-orange-500 text-white' },
    NO_RESULT: { label: 'NR', cls: 'bg-gray-400 text-white' },
    ABANDONED: { label: 'A', cls: 'bg-gray-400 text-white' },
  }
  const r = result ? map[result] : { label: '-', cls: 'bg-gray-200 text-gray-600' }
  return (
    <span className={cn('w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0', r.cls)}>
      {r.label}
    </span>
  )
}

export function LatestResults({ matches }: { matches: Match[] }) {
  return (
    <section className="section-padding bg-gray-50">
      <div className="container-max">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="section-title">Latest Results</h2>
            <p className="section-subtitle">Recent match outcomes</p>
          </div>
          <Link href="/fixtures?tab=results" className="text-sm text-cricket-green hover:text-cricket-dark font-medium flex items-center gap-1">
            All results →
          </Link>
        </div>

        {matches.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Trophy className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>No match results yet for this season</p>
          </div>
        ) : (
          <div className="space-y-3">
            {matches.map((match) => (
              <Link
                key={match.id}
                href={`/scorecards/${match.id}`}
                className="card flex items-center gap-4 p-4 hover:border-l-4 hover:border-cricket-green transition-all"
              >
                <ResultBadge result={match.result} />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900 text-sm truncate">
                    {match.isHome ? 'vs' : '@'} {match.opposition}
                  </div>
                  <div className="text-xs text-gray-500">{match.team.name} • {formatDate(match.date)}</div>
                </div>
                <div className="text-right text-sm flex-shrink-0">
                  <div className="font-semibold text-gray-900">{match.wmccScore ?? '—'}</div>
                  <div className="text-gray-400 text-xs">{match.oppositionScore ?? '—'}</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
