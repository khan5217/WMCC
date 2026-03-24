import type { Metadata } from 'next'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { formatDate, cn } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'Scorecards',
  description: 'Full match scorecards for WMCC Milton Keynes Cricket Club.',
}

export const dynamic = 'force-dynamic'

const resultColors: Record<string, string> = {
  WIN:       'bg-green-100 text-green-800',
  LOSS:      'bg-red-100 text-red-700',
  DRAW:      'bg-yellow-100 text-yellow-800',
  TIE:       'bg-orange-100 text-orange-800',
  NO_RESULT: 'bg-gray-100 text-gray-600',
  ABANDONED: 'bg-gray-100 text-gray-600',
}

const resultLabels: Record<string, string> = {
  WIN: 'Win', LOSS: 'Loss', DRAW: 'Draw', TIE: 'Tie', NO_RESULT: 'No Result', ABANDONED: 'Abandoned',
}

export default async function ScorecardsPage() {
  const matches = await prisma.match.findMany({
    where: { result: { not: null } },
    include: { team: { select: { name: true } } },
    orderBy: { date: 'desc' },
  })

  return (
    <>
      <div className="hero-gradient pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold text-white font-serif mb-3">Scorecards</h1>
          <p className="text-xl text-green-100">{matches.length} completed match{matches.length !== 1 ? 'es' : ''}</p>
        </div>
      </div>

      <div className="section-padding bg-white">
        <div className="container-max">
          {matches.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <p>No completed matches yet. Check back after the first game!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {matches.map((match) => (
                <Link
                  key={match.id}
                  href={`/scorecards/${match.id}`}
                  className="flex items-center justify-between gap-4 card p-4 sm:p-5 hover:border-cricket-green transition-colors group"
                >
                  <div className="min-w-0">
                    <div className="font-semibold text-gray-900 group-hover:text-cricket-green transition-colors truncate">
                      {match.team.name} vs {match.opposition}
                    </div>
                    <div className="text-sm text-gray-400 mt-0.5">
                      {formatDate(match.date, 'dd MMM yyyy')}
                      {match.venue ? ` · ${match.venue}` : ''}
                      {match.leagueName ? ` · ${match.leagueName}` : ''}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {match.wmccScore && (
                      <div className="text-right">
                        <div className="font-bold text-gray-900">{match.wmccScore}</div>
                        {match.oppositionScore && (
                          <div className="text-xs text-gray-400">{match.oppositionScore}</div>
                        )}
                      </div>
                    )}
                    {match.result && (
                      <span className={cn('text-xs font-semibold px-2.5 py-1 rounded-full', resultColors[match.result])}>
                        {resultLabels[match.result]}
                      </span>
                    )}
                    <span className="text-gray-300 group-hover:text-cricket-green text-lg">→</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
