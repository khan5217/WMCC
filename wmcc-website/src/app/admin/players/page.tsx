import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import DeleteButton from '@/components/admin/DeleteButton'

export const dynamic = 'force-dynamic'

export default async function AdminPlayersPage() {
  const players = await prisma.player.findMany({
    include: { user: { select: { firstName: true, lastName: true, email: true } } },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-6 gap-3">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 font-serif">Players</h1>
        <Link href="/admin/players/new" className="btn-primary flex items-center gap-2 text-sm">
          <Plus className="h-4 w-4" /> Add Player
        </Link>
      </div>

      <div className="card overflow-hidden">
        {/* Mobile cards */}
        <div className="md:hidden divide-y divide-gray-100">
          {players.length === 0 && (
            <p className="px-4 py-10 text-center text-gray-400 text-sm">No players found.</p>
          )}
          {players.map((player) => (
            <div key={player.id} className="p-4 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="font-semibold text-gray-900">
                  {player.user.firstName} {player.user.lastName}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">{player.user.email}</div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                    {player.role.replace(/_/g, ' ')}
                  </span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${player.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}`}>
                    {player.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {player.battingStyle.replace(/_/g, ' ')} · {player.bowlingStyle.replace(/_/g, ' ')}
                  {player.jerseyNumber ? ` · #${player.jerseyNumber}` : ''}
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <Link href={`/admin/players/${player.id}/edit`} className="text-xs text-cricket-green font-medium hover:underline whitespace-nowrap">
                  Edit →
                </Link>
                <DeleteButton endpoint={`/api/players/${player.id}`} label={`${player.user.firstName} ${player.user.lastName}`} />
              </div>
            </div>
          ))}
        </div>

        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase">Name</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase">Email</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase">Role</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase">Batting</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase">Bowling</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase">Jersey</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="px-5 py-3.5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {players.map((player) => (
                <tr key={player.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3.5 font-medium text-gray-900">
                    {player.user.firstName} {player.user.lastName}
                  </td>
                  <td className="px-5 py-3.5 text-gray-500">{player.user.email}</td>
                  <td className="px-5 py-3.5 text-gray-500 text-xs">{player.role.replace(/_/g, ' ')}</td>
                  <td className="px-5 py-3.5 text-gray-500 text-xs">{player.battingStyle.replace(/_/g, ' ')}</td>
                  <td className="px-5 py-3.5 text-gray-500 text-xs">{player.bowlingStyle.replace(/_/g, ' ')}</td>
                  <td className="px-5 py-3.5 text-gray-400 text-xs">{player.jerseyNumber ?? '—'}</td>
                  <td className="px-5 py-3.5">
                    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${player.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}`}>
                      {player.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <Link href={`/admin/players/${player.id}/edit`} className="text-xs text-cricket-green hover:underline font-medium whitespace-nowrap">
                        Edit →
                      </Link>
                      <DeleteButton endpoint={`/api/players/${player.id}`} label={`${player.user.firstName} ${player.user.lastName}`} />
                    </div>
                  </td>
                </tr>
              ))}
              {players.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-5 py-10 text-center text-gray-400">No players found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
