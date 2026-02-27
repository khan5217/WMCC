import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { formatDate, cn } from '@/lib/utils'
import { ArrowLeft, Award } from 'lucide-react'
import type { Metadata } from 'next'

interface Props {
  params: { id: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const match = await prisma.match.findUnique({ where: { id: params.id } })
  if (!match) return { title: 'Scorecard' }
  return { title: `Scorecard: WMCC vs ${match.opposition}` }
}

const resultColors: Record<string, string> = {
  WIN: 'bg-green-600', LOSS: 'bg-red-600', DRAW: 'bg-yellow-500',
  TIE: 'bg-orange-500', NO_RESULT: 'bg-gray-400', ABANDONED: 'bg-gray-400',
}

export default async function ScorecardPage({ params }: Props) {
  const match = await prisma.match.findUnique({
    where: { id: params.id },
    include: {
      team: true,
      performances: {
        include: {
          player: {
            include: { user: { select: { firstName: true, lastName: true } } },
          },
        },
        orderBy: [{ battingOrder: 'asc' }, { runs: 'desc' }],
      },
    },
  })

  if (!match) notFound()

  const batting = match.performances
    .filter((p) => p.runs !== null)
    .sort((a, b) => (a.battingOrder ?? 99) - (b.battingOrder ?? 99))

  const bowling = match.performances
    .filter((p) => p.oversBowled !== null && p.oversBowled > 0)
    .sort((a, b) => (b.wickets ?? 0) - (a.wickets ?? 0))

  const motm = match.performances.find((p) => p.isManOfMatch)

  return (
    <>
      {/* Header */}
      <div className={cn('pt-24 pb-12', match.result ? resultColors[match.result] : 'hero-gradient')}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link href="/fixtures" className="inline-flex items-center gap-2 text-white/70 hover:text-white mb-6 text-sm">
            <ArrowLeft className="h-4 w-4" /> Back to Fixtures
          </Link>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="text-white/70 text-sm mb-2">
                {match.team.name} • {formatDate(match.date, 'EEEE dd MMMM yyyy')} •{' '}
                {match.isHome ? 'Home' : 'Away'} • {match.leagueName ?? 'Friendly'}
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-white font-serif">
                {match.team.name}
                <span className="text-white/70 mx-3">vs</span>
                {match.opposition}
              </h1>
              <div className="text-white/80 text-sm mt-1">{match.venue}</div>
            </div>

            <div className="text-right">
              {match.wmccScore && (
                <div>
                  <div className="text-white text-3xl font-bold">{match.wmccScore}</div>
                  <div className="text-white/70 text-sm">{match.team.name}</div>
                </div>
              )}
              {match.oppositionScore && (
                <div className="mt-2">
                  <div className="text-white/80 text-2xl font-semibold">{match.oppositionScore}</div>
                  <div className="text-white/60 text-sm">{match.opposition}</div>
                </div>
              )}
              {match.result && (
                <div className="mt-3 bg-white/20 text-white font-bold px-4 py-1.5 rounded-full text-sm inline-block">
                  {match.result === 'WIN' ? '🏆 Won' : match.result === 'LOSS' ? '❌ Lost' : match.result}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="section-padding bg-white">
        <div className="container-max space-y-10">
          {/* Match summary / description */}
          {match.description && (
            <div className="bg-gray-50 rounded-xl p-6">
              <h2 className="font-bold text-gray-900 mb-2">Match Report</h2>
              <p className="text-gray-600 leading-relaxed">{match.description}</p>
            </div>
          )}

          {/* MOTM */}
          {motm && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-5 flex items-center gap-4">
              <Award className="h-10 w-10 text-yellow-600 flex-shrink-0" />
              <div>
                <div className="text-xs font-semibold text-yellow-700 uppercase tracking-wider">Man of the Match</div>
                <div className="font-bold text-gray-900 text-lg">
                  {motm.player.user.firstName} {motm.player.user.lastName}
                </div>
                <div className="text-sm text-gray-600">
                  {motm.runs !== null ? `${motm.runs} runs` : ''}
                  {motm.runs !== null && motm.wickets ? ' & ' : ''}
                  {motm.wickets ? `${motm.wickets}/${motm.runsConceded} wkts` : ''}
                </div>
              </div>
            </div>
          )}

          {/* Batting scorecard */}
          {batting.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                {match.team.name} Batting
              </h2>
              <div className="overflow-x-auto rounded-xl border border-gray-100">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Batsman</th>
                      <th className="text-center px-3 py-3 text-xs font-semibold text-gray-500 uppercase">How Out</th>
                      <th className="text-center px-3 py-3 text-xs font-semibold text-gray-500 uppercase">R</th>
                      <th className="text-center px-3 py-3 text-xs font-semibold text-gray-500 uppercase">B</th>
                      <th className="text-center px-3 py-3 text-xs font-semibold text-gray-500 uppercase">4s</th>
                      <th className="text-center px-3 py-3 text-xs font-semibold text-gray-500 uppercase">6s</th>
                      <th className="text-center px-3 py-3 text-xs font-semibold text-gray-500 uppercase">SR</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {batting.map((perf) => (
                      <tr key={perf.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <Link href={`/players/${perf.player.id}`} className="font-medium text-gray-900 hover:text-cricket-green">
                            {perf.player.user.firstName} {perf.player.user.lastName}
                          </Link>
                          {perf.isManOfMatch && <span className="ml-2 text-xs text-yellow-600">★ MOTM</span>}
                        </td>
                        <td className="px-3 py-3 text-center text-gray-500 text-xs">
                          {perf.isOut
                            ? `${perf.dismissalType ?? 'out'}${perf.dismissedBy ? ` b ${perf.dismissedBy}` : ''}`
                            : 'not out'}
                        </td>
                        <td className="px-3 py-3 text-center font-bold text-gray-900">
                          {perf.runs ?? '—'}{!perf.isOut && perf.runs !== null ? '*' : ''}
                        </td>
                        <td className="px-3 py-3 text-center text-gray-600">{perf.ballsFaced ?? '—'}</td>
                        <td className="px-3 py-3 text-center text-gray-600">{perf.fours ?? '—'}</td>
                        <td className="px-3 py-3 text-center text-gray-600">{perf.sixes ?? '—'}</td>
                        <td className="px-3 py-3 text-center text-gray-500">
                          {perf.runs !== null && perf.ballsFaced
                            ? ((perf.runs / perf.ballsFaced) * 100).toFixed(0)
                            : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Bowling scorecard */}
          {bowling.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                {match.team.name} Bowling
              </h2>
              <div className="overflow-x-auto rounded-xl border border-gray-100">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Bowler</th>
                      <th className="text-center px-3 py-3 text-xs font-semibold text-gray-500 uppercase">O</th>
                      <th className="text-center px-3 py-3 text-xs font-semibold text-gray-500 uppercase">M</th>
                      <th className="text-center px-3 py-3 text-xs font-semibold text-gray-500 uppercase">R</th>
                      <th className="text-center px-3 py-3 text-xs font-semibold text-gray-500 uppercase">W</th>
                      <th className="text-center px-3 py-3 text-xs font-semibold text-gray-500 uppercase">Econ</th>
                      <th className="text-center px-3 py-3 text-xs font-semibold text-gray-500 uppercase">Wd</th>
                      <th className="text-center px-3 py-3 text-xs font-semibold text-gray-500 uppercase">NB</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {bowling.map((perf) => (
                      <tr key={perf.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <Link href={`/players/${perf.player.id}`} className="font-medium text-gray-900 hover:text-cricket-green">
                            {perf.player.user.firstName} {perf.player.user.lastName}
                          </Link>
                        </td>
                        <td className="px-3 py-3 text-center text-gray-600">{perf.oversBowled}</td>
                        <td className="px-3 py-3 text-center text-gray-600">{perf.maidens ?? 0}</td>
                        <td className="px-3 py-3 text-center text-gray-600">{perf.runsConceded ?? '—'}</td>
                        <td className="px-3 py-3 text-center font-bold text-gray-900">{perf.wickets ?? 0}</td>
                        <td className="px-3 py-3 text-center text-gray-500">
                          {perf.runsConceded !== null && perf.oversBowled
                            ? (perf.runsConceded / perf.oversBowled).toFixed(2)
                            : '—'}
                        </td>
                        <td className="px-3 py-3 text-center text-gray-500">{perf.wides ?? 0}</td>
                        <td className="px-3 py-3 text-center text-gray-500">{perf.noBalls ?? 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {batting.length === 0 && bowling.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              <p>Detailed scorecard not yet available for this match</p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
