import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Plus } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AdminPlayersPage() {
  const players = await prisma.player.findMany({
    include: { user: { select: { firstName: true, lastName: true, email: true } } },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900 font-serif">Players</h1>
        <div className="text-sm text-gray-500">{players.length} total players</div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
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
                </tr>
              ))}
              {players.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-gray-400">No players found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
