import type { Metadata } from 'next'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { formatDate, cn } from '@/lib/utils'
import { Calendar, MapPin } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Fixtures & Results',
  description: 'WMCC Milton Keynes Cricket Club — full fixture list and match results for the 2024 season.',
}

export const dynamic = 'force-dynamic'

const resultMap: Record<string, { label: string; cls: string }> = {
  WIN:       { label: 'Win',       cls: 'badge-win' },
  LOSS:      { label: 'Loss',      cls: 'badge-loss' },
  DRAW:      { label: 'Draw',      cls: 'badge-draw' },
  TIE:       { label: 'Tie',       cls: 'bg-orange-100 text-orange-800' },
  NO_RESULT: { label: 'No Result', cls: 'bg-gray-100 text-gray-600' },
  ABANDONED: { label: 'Abandoned', cls: 'bg-gray-100 text-gray-600' },
}

const formatLabels: Record<string, string> = {
  T20: 'T20', ONE_DAY: 'One Day', TWO_DAY: '2 Day', FRIENDLY: 'Friendly',
}

async function getFixtures() {
  return prisma.match.findMany({
    include: { team: { select: { name: true, type: true } } },
    orderBy: { date: 'desc' },
  })
}

export default async function FixturesPage() {
  const matches = await getFixtures()

  const past = matches.filter((m) => m.result !== null || m.date < new Date())
  const upcoming = matches.filter((m) => m.result === null && m.date >= new Date())

  return (
    <>
      <div className="hero-gradient pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold text-white font-serif mb-3">Fixtures &amp; Results</h1>
          <p className="text-xl text-green-100">2024 Season — {matches.length} matches</p>
        </div>
      </div>

      <div className="section-padding bg-white">
        <div className="container-max space-y-12">
          {/* Upcoming */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <span className="w-1 h-7 bg-cricket-green rounded-full" />
              Upcoming Fixtures
              <span className="text-sm bg-green-100 text-cricket-green font-medium px-2.5 py-0.5 rounded-full ml-2">
                {upcoming.length}
              </span>
            </h2>
            {upcoming.length === 0 ? (
              <div className="text-center py-10 text-gray-400">
                <Calendar className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p>No upcoming fixtures scheduled</p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcoming.map((match) => (
                  <div key={match.id} className="card p-5 border-l-4 border-cricket-green flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="font-bold text-gray-900">
                          {match.team.name} {match.isHome ? 'vs' : '@'} {match.opposition}
                        </span>
                        <span className="badge-role">{formatLabels[match.format] ?? match.format}</span>
                        {match.isHome && <span className="text-xs text-gray-400">Home</span>}
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {formatDate(match.date, 'EEE dd MMM yyyy')}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {match.venue}
                        </span>
                      </div>
                      {match.leagueName && <div className="text-xs text-gray-400 mt-1">{match.leagueName}</div>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Results */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <span className="w-1 h-7 bg-gray-300 rounded-full" />
              Results
              <span className="text-sm bg-gray-100 text-gray-600 font-medium px-2.5 py-0.5 rounded-full ml-2">
                {past.length}
              </span>
            </h2>
            {past.length === 0 ? (
              <div className="text-center py-10 text-gray-400">
                <p>No results yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-gray-100">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Match</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Venue</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">WMCC</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Opp.</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Result</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Card</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {past.map((match) => {
                      const res = match.result ? resultMap[match.result] : null
                      return (
                        <tr key={match.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                            {formatDate(match.date, 'dd MMM')}
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-medium text-gray-900">{match.team.name} {match.isHome ? 'vs' : '@'} {match.opposition}</div>
                            <div className="text-xs text-gray-400">{formatLabels[match.format]}</div>
                          </td>
                          <td className="px-4 py-3 text-gray-500 hidden md:table-cell text-xs">{match.venue}</td>
                          <td className="px-4 py-3 text-center font-semibold text-gray-900">{match.wmccScore ?? '—'}</td>
                          <td className="px-4 py-3 text-center text-gray-600">{match.oppositionScore ?? '—'}</td>
                          <td className="px-4 py-3 text-center">
                            {res ? <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold', res.cls)}>{res.label}</span> : '—'}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Link href={`/scorecards/${match.id}`} className="text-xs text-cricket-green hover:underline font-medium">
                              View →
                            </Link>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
