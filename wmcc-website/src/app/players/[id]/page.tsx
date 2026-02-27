import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { formatDate, initials, getBattingAverage, getBowlingAverage, getEconomyRate } from '@/lib/utils'
import { ArrowLeft, Award } from 'lucide-react'

interface Props {
  params: { id: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const player = await prisma.player.findUnique({
    where: { id: params.id },
    include: { user: { select: { firstName: true, lastName: true } } },
  })
  if (!player) return { title: 'Player Not Found' }
  return { title: `${player.user.firstName} ${player.user.lastName}` }
}

const roleLabels: Record<string, string> = {
  BATSMAN: 'Batsman',
  BOWLER: 'Bowler',
  ALL_ROUNDER: 'All-Rounder',
  WICKET_KEEPER: 'Wicket-Keeper',
  WICKET_KEEPER_BATSMAN: 'WK-Batsman',
}
const battingLabels: Record<string, string> = {
  RIGHT_HAND: 'Right-Hand Bat',
  LEFT_HAND: 'Left-Hand Bat',
}
const bowlingLabels: Record<string, string> = {
  RIGHT_ARM_FAST: 'Right-Arm Fast',
  RIGHT_ARM_MEDIUM: 'Right-Arm Medium',
  RIGHT_ARM_SPIN_OFF: 'Off-Spin',
  RIGHT_ARM_SPIN_LEG: 'Leg-Spin',
  LEFT_ARM_FAST: 'Left-Arm Fast',
  LEFT_ARM_MEDIUM: 'Left-Arm Medium',
  LEFT_ARM_SPIN: 'Left-Arm Spin',
  DOES_NOT_BOWL: 'Does Not Bowl',
}

export default async function PlayerProfilePage({ params }: Props) {
  const player = await prisma.player.findUnique({
    where: { id: params.id },
    include: {
      user: { select: { firstName: true, lastName: true, avatarUrl: true, email: true } },
      teams: { select: { id: true, name: true, type: true } },
      performances: {
        include: {
          match: {
            select: {
              id: true, opposition: true, date: true, result: true, isHome: true,
              team: { select: { name: true } },
            },
          },
        },
        orderBy: { match: { date: 'desc' } },
        take: 20,
      },
    },
  })

  if (!player) notFound()

  const { user, performances } = player
  const fullName = `${user.firstName} ${user.lastName}`

  // Aggregate batting stats
  const battingInnings = performances.filter((p) => p.runs !== null)
  const totalRuns = battingInnings.reduce((s, p) => s + (p.runs ?? 0), 0)
  const dismissals = battingInnings.filter((p) => p.isOut).length
  const highScore = battingInnings.length > 0 ? Math.max(...battingInnings.map((p) => p.runs ?? 0)) : 0
  const fifties = battingInnings.filter((p) => (p.runs ?? 0) >= 50 && (p.runs ?? 0) < 100).length
  const hundreds = battingInnings.filter((p) => (p.runs ?? 0) >= 100).length

  // Aggregate bowling stats
  const bowlingInnings = performances.filter((p) => p.oversBowled !== null && p.oversBowled > 0)
  const totalWickets = bowlingInnings.reduce((s, p) => s + (p.wickets ?? 0), 0)
  const totalRunsConceded = bowlingInnings.reduce((s, p) => s + (p.runsConceded ?? 0), 0)
  const totalOvers = bowlingInnings.reduce((s, p) => s + (p.oversBowled ?? 0), 0)
  const bestBowling = bowlingInnings.sort((a, b) => (b.wickets ?? 0) - (a.wickets ?? 0))[0]

  const motm = performances.filter((p) => p.isManOfMatch).length

  return (
    <>
      {/* Back nav */}
      <div className="hero-gradient pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link href="/players" className="inline-flex items-center gap-2 text-green-200 hover:text-white mb-6 text-sm transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to Players
          </Link>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            {/* Avatar */}
            <div className="w-24 h-24 rounded-full overflow-hidden bg-white/20 border-4 border-white/30 flex items-center justify-center flex-shrink-0">
              {user.avatarUrl ? (
                <Image src={user.avatarUrl} alt={fullName} width={96} height={96} className="object-cover w-full h-full" />
              ) : (
                <span className="text-3xl font-bold text-white">{initials(user.firstName, user.lastName)}</span>
              )}
            </div>

            <div>
              <div className="text-green-300 text-sm font-medium mb-1">
                {player.jerseyNumber ? `#${player.jerseyNumber} • ` : ''}{player.teams.map((t) => t.name).join(', ') || 'WMCC'}
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-white font-serif">{fullName}</h1>
              <div className="flex flex-wrap gap-3 mt-3">
                <span className="bg-white/20 text-white text-sm px-3 py-1 rounded-full">{roleLabels[player.role]}</span>
                <span className="bg-white/10 text-green-200 text-sm px-3 py-1 rounded-full">{battingLabels[player.battingStyle]}</span>
                {player.bowlingStyle !== 'DOES_NOT_BOWL' && (
                  <span className="bg-white/10 text-green-200 text-sm px-3 py-1 rounded-full">{bowlingLabels[player.bowlingStyle]}</span>
                )}
                {motm > 0 && (
                  <span className="bg-yellow-500/30 text-yellow-200 text-sm px-3 py-1 rounded-full flex items-center gap-1">
                    <Award className="h-3.5 w-3.5" /> {motm}× MOTM
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="section-padding bg-white">
        <div className="container-max space-y-10">
          {/* Bio */}
          {player.bio && (
            <div className="max-w-3xl">
              <h2 className="text-xl font-bold text-gray-900 mb-3">About</h2>
              <p className="text-gray-600 leading-relaxed">{player.bio}</p>
            </div>
          )}

          {/* Stats grid */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Career Statistics</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Batting */}
              <div className="card-green p-5 col-span-2">
                <div className="text-green-200 text-xs uppercase tracking-wider font-semibold mb-3">Batting</div>
                <div className="grid grid-cols-4 gap-3 text-center">
                  {[
                    { label: 'Inns', value: battingInnings.length },
                    { label: 'Runs', value: totalRuns },
                    { label: 'Avg', value: getBattingAverage(totalRuns, dismissals) },
                    { label: 'H/S', value: highScore },
                    { label: '50s', value: fifties },
                    { label: '100s', value: hundreds },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <div className="text-xl font-bold text-white">{value}</div>
                      <div className="text-green-300 text-xs">{label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bowling */}
              <div className="card p-5 col-span-2 border-l-4 border-cricket-green">
                <div className="text-cricket-green text-xs uppercase tracking-wider font-semibold mb-3">Bowling</div>
                <div className="grid grid-cols-4 gap-3 text-center">
                  {[
                    { label: 'Ovrs', value: totalOvers.toFixed(1) },
                    { label: 'Wkts', value: totalWickets },
                    { label: 'Avg', value: getBowlingAverage(totalRunsConceded, totalWickets) },
                    { label: 'Econ', value: getEconomyRate(totalRunsConceded, totalOvers) },
                    { label: 'Best', value: bestBowling ? `${bestBowling.wickets}/${bestBowling.runsConceded}` : '—' },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <div className="text-xl font-bold text-gray-900">{value}</div>
                      <div className="text-gray-400 text-xs">{label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Recent performances */}
          {performances.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Performances</h2>
              <div className="overflow-x-auto rounded-xl border border-gray-100">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Match</th>
                      <th className="text-center px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Bat</th>
                      <th className="text-center px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Bowl</th>
                      <th className="text-center px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Fld</th>
                      <th className="text-center px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Result</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {performances.map((perf) => (
                      <tr key={perf.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <Link href={`/scorecards/${perf.match.id}`} className="hover:text-cricket-green">
                            <div className="font-medium text-gray-900">
                              {perf.match.isHome ? 'vs' : '@'} {perf.match.opposition}
                            </div>
                            <div className="text-xs text-gray-400">{formatDate(perf.match.date)}</div>
                          </Link>
                          {perf.isManOfMatch && (
                            <span className="text-xs text-yellow-600 font-medium flex items-center gap-1">
                              <Award className="h-3 w-3" /> MOTM
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-3 text-center">
                          {perf.runs !== null ? (
                            <span className={perf.runs >= 50 ? 'font-bold text-cricket-green' : ''}>
                              {perf.runs}{perf.isOut ? '' : '*'}
                            </span>
                          ) : '—'}
                        </td>
                        <td className="px-3 py-3 text-center">
                          {perf.wickets !== null && perf.oversBowled ? (
                            <span>{perf.wickets}/{perf.runsConceded} ({perf.oversBowled}ov)</span>
                          ) : '—'}
                        </td>
                        <td className="px-3 py-3 text-center text-gray-600">
                          {perf.catches > 0 || perf.runOuts > 0 || perf.stumpings > 0
                            ? [
                                perf.catches > 0 ? `${perf.catches}ct` : '',
                                perf.runOuts > 0 ? `${perf.runOuts}ro` : '',
                                perf.stumpings > 0 ? `${perf.stumpings}st` : '',
                              ].filter(Boolean).join(' ')
                            : '—'}
                        </td>
                        <td className="px-3 py-3 text-center">
                          {perf.match.result && (
                            <span className={`inline-block w-6 h-6 rounded-full text-white text-xs font-bold flex items-center justify-center
                              ${perf.match.result === 'WIN' ? 'bg-green-600' : perf.match.result === 'LOSS' ? 'bg-red-500' : 'bg-yellow-500'}`}>
                              {perf.match.result[0]}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
