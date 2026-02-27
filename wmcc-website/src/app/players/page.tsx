import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { prisma } from '@/lib/prisma'
import { initials } from '@/lib/utils'
import { Users } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Players',
  description: 'Meet the WMCC Milton Keynes Cricket Club squad — 1st XI and 2nd XI player profiles.',
}

const roleLabels: Record<string, string> = {
  BATSMAN: 'Batsman',
  BOWLER: 'Bowler',
  ALL_ROUNDER: 'All-Rounder',
  WICKET_KEEPER: 'Wicket-Keeper',
  WICKET_KEEPER_BATSMAN: 'WK-Batsman',
}

async function getPlayers() {
  return prisma.player.findMany({
    where: { isActive: true },
    include: {
      user: { select: { firstName: true, lastName: true, avatarUrl: true } },
      teams: { select: { id: true, name: true, type: true } },
      performances: {
        select: { runs: true, wickets: true, isOut: true },
      },
    },
    orderBy: { user: { lastName: 'asc' } },
  })
}

export default async function PlayersPage() {
  const players = await getPlayers()

  // Aggregate simple stats
  const enriched = players.map((p) => {
    const innings = p.performances.filter((pf) => pf.runs !== null)
    const totalRuns = innings.reduce((s, pf) => s + (pf.runs ?? 0), 0)
    const dismissals = innings.filter((pf) => pf.isOut).length
    const avgRuns = dismissals > 0 ? (totalRuns / dismissals).toFixed(1) : '—'

    const bowlingInnings = p.performances.filter((pf) => pf.wickets !== null)
    const totalWkts = bowlingInnings.reduce((s, pf) => s + (pf.wickets ?? 0), 0)

    return { ...p, totalRuns, avgRuns, totalWkts, matchCount: innings.length }
  })

  const firstXI = enriched.filter((p) => p.teams.some((t) => t.type === 'FIRST_XI'))
  const secondXI = enriched.filter((p) => p.teams.some((t) => t.type === 'SECOND_XI') && !firstXI.some((f) => f.id === p.id))
  const unassigned = enriched.filter((p) => p.teams.length === 0)

  return (
    <>
      <div className="hero-gradient pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold text-white font-serif mb-3">Our Players</h1>
          <p className="text-xl text-green-100">The WMCC squad — {players.length} active players</p>
        </div>
      </div>

      <div className="section-padding bg-white">
        <div className="container-max">
          {[
            { label: '1st XI Squad', players: firstXI },
            { label: '2nd XI Squad', players: secondXI },
            ...(unassigned.length > 0 ? [{ label: 'Registered Players', players: unassigned }] : []),
          ].map(({ label, players: group }) => (
            <div key={label} className="mb-14">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <span className="w-1 h-8 bg-cricket-green rounded-full inline-block" />
                {label}
              </h2>
              {group.length === 0 ? (
                <div className="text-center py-10 text-gray-400">
                  <Users className="h-10 w-10 mx-auto mb-2 opacity-30" />
                  <p>No players in this squad yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
                  {group.map((player) => (
                    <Link
                      key={player.id}
                      href={`/players/${player.id}`}
                      className="card p-5 text-center hover:border-t-4 hover:border-cricket-green transition-all group"
                    >
                      {/* Avatar */}
                      <div className="w-20 h-20 rounded-full mx-auto mb-3 overflow-hidden bg-green-100 flex items-center justify-center">
                        {player.user.avatarUrl ? (
                          <Image
                            src={player.user.avatarUrl}
                            alt={`${player.user.firstName} ${player.user.lastName}`}
                            width={80}
                            height={80}
                            className="object-cover w-full h-full"
                          />
                        ) : (
                          <span className="text-2xl font-bold text-cricket-green">
                            {initials(player.user.firstName, player.user.lastName)}
                          </span>
                        )}
                      </div>
                      {/* Jersey number */}
                      {player.jerseyNumber && (
                        <div className="text-xs text-gray-400 mb-0.5">#{player.jerseyNumber}</div>
                      )}
                      {/* Name */}
                      <div className="font-bold text-gray-900 text-sm group-hover:text-cricket-green transition-colors">
                        {player.user.firstName} {player.user.lastName}
                      </div>
                      {/* Role badge */}
                      <div className="badge-role mt-2 text-xs">
                        {roleLabels[player.role] ?? player.role}
                      </div>
                      {/* Stats */}
                      <div className="mt-3 grid grid-cols-2 gap-1 text-xs text-gray-500">
                        <div>
                          <div className="font-semibold text-gray-800">{player.totalRuns}</div>
                          <div>Runs</div>
                        </div>
                        <div>
                          <div className="font-semibold text-gray-800">{player.totalWkts}</div>
                          <div>Wickets</div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
