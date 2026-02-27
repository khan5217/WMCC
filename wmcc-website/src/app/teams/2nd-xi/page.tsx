import { prisma } from '@/lib/prisma'
import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { initials } from '@/lib/utils'
import { Users } from 'lucide-react'

export const metadata: Metadata = {
  title: '2nd XI',
  description: 'WMCC Milton Keynes Cricket Club 2nd XI squad and player profiles.',
}

const roleLabels: Record<string, string> = {
  BATSMAN: 'Batsman', BOWLER: 'Bowler', ALL_ROUNDER: 'All-Rounder',
  WICKET_KEEPER: 'WK', WICKET_KEEPER_BATSMAN: 'WK-Bat',
}

export default async function SecondXIPage() {
  const team = await prisma.team.findFirst({
    where: { type: 'SECOND_XI' },
    include: {
      captain: { include: { user: { select: { firstName: true, lastName: true } } } },
      players: {
        where: { isActive: true },
        include: {
          user: { select: { firstName: true, lastName: true, avatarUrl: true } },
          performances: { select: { runs: true, wickets: true } },
        },
      },
    },
    orderBy: { season: 'desc' },
  })

  return (
    <>
      <div className="hero-gradient pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-green-300 text-sm mb-2">Our Teams</div>
          <h1 className="text-4xl md:text-5xl font-bold text-white font-serif mb-2">2nd XI</h1>
          {team && (
            <p className="text-green-100">
              {team.description} • {team.season} Season
              {team.captain && (
                <> • Captain: <strong>{team.captain.user.firstName} {team.captain.user.lastName}</strong></>
              )}
            </p>
          )}
        </div>
      </div>

      <div className="section-padding bg-white">
        <div className="container-max">
          {!team || team.players.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>No players listed in the 2nd XI yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
              {team.players.map((player) => {
                const totalRuns = player.performances.reduce((s, p) => s + (p.runs ?? 0), 0)
                const totalWkts = player.performances.reduce((s, p) => s + (p.wickets ?? 0), 0)
                return (
                  <Link
                    key={player.id}
                    href={`/players/${player.id}`}
                    className="card p-5 text-center hover:border-t-4 hover:border-cricket-green transition-all group"
                  >
                    <div className="w-20 h-20 rounded-full mx-auto mb-3 overflow-hidden bg-green-100 flex items-center justify-center">
                      {player.user.avatarUrl ? (
                        <Image src={player.user.avatarUrl} alt="" width={80} height={80} className="object-cover" />
                      ) : (
                        <span className="text-2xl font-bold text-cricket-green">
                          {initials(player.user.firstName, player.user.lastName)}
                        </span>
                      )}
                    </div>
                    {player.jerseyNumber && (
                      <div className="text-xs text-gray-400">#{player.jerseyNumber}</div>
                    )}
                    <div className="font-bold text-sm text-gray-900 group-hover:text-cricket-green">
                      {player.user.firstName} {player.user.lastName}
                    </div>
                    <div className="badge-role mt-2 text-xs">{roleLabels[player.role]}</div>
                    <div className="mt-3 grid grid-cols-2 gap-1 text-xs text-gray-500">
                      <div><div className="font-semibold text-gray-800">{totalRuns}</div>Runs</div>
                      <div><div className="font-semibold text-gray-800">{totalWkts}</div>Wkts</div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
