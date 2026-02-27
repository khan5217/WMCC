import { prisma } from '@/lib/prisma'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'
import { Plus } from 'lucide-react'

export const dynamic = 'force-dynamic'

const resultColors: Record<string, string> = {
  WIN: 'bg-green-100 text-green-800',
  LOSS: 'bg-red-100 text-red-800',
  DRAW: 'bg-yellow-100 text-yellow-800',
  TIE: 'bg-blue-100 text-blue-800',
  NO_RESULT: 'bg-gray-100 text-gray-600',
  ABANDONED: 'bg-gray-100 text-gray-600',
}

export default async function AdminMatchesPage() {
  const matches = await prisma.match.findMany({
    include: { team: { select: { name: true, type: true } } },
    orderBy: { date: 'desc' },
  })

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900 font-serif">Matches</h1>
        <Link href="/admin/matches/new" className="btn-primary flex items-center gap-2 text-sm">
          <Plus className="h-4 w-4" /> Add Match
        </Link>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase">Date</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase">Team</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase">Opposition</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase">Venue</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase">Format</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase">Score</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase">Result</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {matches.map((match) => (
                <tr key={match.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3.5 text-gray-400 text-xs">{formatDate(match.date)}</td>
                  <td className="px-5 py-3.5 text-gray-500 text-xs">{match.team.type.replace('_', ' ')}</td>
                  <td className="px-5 py-3.5 font-medium text-gray-900">{match.opposition}</td>
                  <td className="px-5 py-3.5 text-gray-500">{match.venue} {match.isHome ? '(H)' : '(A)'}</td>
                  <td className="px-5 py-3.5 text-gray-500 text-xs">{match.format.replace('_', ' ')}</td>
                  <td className="px-5 py-3.5 text-gray-500 text-xs">
                    {match.wmccScore ?? '—'} {match.oppositionScore ? `/ ${match.oppositionScore}` : ''}
                  </td>
                  <td className="px-5 py-3.5">
                    {match.result ? (
                      <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${resultColors[match.result]}`}>
                        {match.result.replace('_', ' ')}
                      </span>
                    ) : (
                      <span className="text-gray-300 text-xs">—</span>
                    )}
                  </td>
                </tr>
              ))}
              {matches.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-gray-400">No matches found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
