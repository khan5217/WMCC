import { prisma } from '@/lib/prisma'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'
import { Plus, Radio } from 'lucide-react'
import DeleteButton from '@/components/admin/DeleteButton'

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
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-6 gap-3">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 font-serif">Matches</h1>
        <Link href="/admin/matches/new" className="btn-primary flex items-center gap-2 text-sm">
          <Plus className="h-4 w-4" /> Add Match
        </Link>
      </div>

      <div className="card overflow-hidden">
        {/* Mobile cards */}
        <div className="md:hidden divide-y divide-gray-100">
          {matches.length === 0 && (
            <p className="px-4 py-10 text-center text-gray-400 text-sm">No matches found.</p>
          )}
          {matches.map((match) => {
            const score = match.isLive && match.liveScore
              ? match.liveScore
              : [match.wmccScore, match.oppositionScore].filter(Boolean).join(' / ') || null
            return (
              <div key={match.id} className={`p-4 ${match.isLive ? 'bg-red-50' : ''}`}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {match.isLive && (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-red-600">
                          <Radio className="h-3 w-3" /> LIVE
                        </span>
                      )}
                      <span className="font-semibold text-gray-900 text-sm">
                        {match.team.type.replace('_', ' ')} {match.isHome ? 'vs' : '@'} {match.opposition}
                      </span>
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      {formatDate(match.date)} · {match.format.replace('_', ' ')} · {match.venue}
                    </div>
                    {score && <div className="text-xs font-mono text-gray-600 mt-1">{score}</div>}
                  </div>
                  {match.result && (
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${resultColors[match.result]}`}>
                      {match.result.replace('_', ' ')}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4 mt-2">
                  <Link href={`/admin/matches/${match.id}/live`} className="inline-flex items-center gap-1 text-xs text-red-600 font-medium">
                    <Radio className="h-3 w-3" /> Live
                  </Link>
                  <Link href={`/admin/matches/${match.id}/edit`} className="text-xs text-cricket-green font-medium hover:underline">
                    Edit →
                  </Link>
                  <DeleteButton endpoint={`/api/matches/${match.id}`} label={match.opposition} />
                </div>
              </div>
            )
          })}
        </div>

        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
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
                <th className="px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {matches.map((match) => (
                <tr key={match.id} className={`hover:bg-gray-50 ${match.isLive ? 'bg-red-50' : ''}`}>
                  <td className="px-5 py-3.5 text-gray-400 text-xs">{formatDate(match.date)}</td>
                  <td className="px-5 py-3.5 text-gray-500 text-xs">{match.team.type.replace('_', ' ')}</td>
                  <td className="px-5 py-3.5 font-medium text-gray-900">
                    {match.isLive && <span className="inline-flex items-center gap-1 text-xs font-bold text-red-600 mr-1"><Radio className="h-3 w-3" /> LIVE</span>}
                    {match.opposition}
                  </td>
                  <td className="px-5 py-3.5 text-gray-500">{match.venue} {match.isHome ? '(H)' : '(A)'}</td>
                  <td className="px-5 py-3.5 text-gray-500 text-xs">{match.format.replace('_', ' ')}</td>
                  <td className="px-5 py-3.5 text-gray-500 text-xs">
                    {match.isLive && match.liveScore ? (
                      <span className="text-red-600 font-mono font-medium">{match.liveScore}</span>
                    ) : (
                      <>{match.wmccScore ?? '—'} {match.oppositionScore ? `/ ${match.oppositionScore}` : ''}</>
                    )}
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
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <Link href={`/admin/matches/${match.id}/live`} className="inline-flex items-center gap-1 text-xs text-red-600 hover:text-red-800 font-medium">
                        <Radio className="h-3 w-3" /> Live
                      </Link>
                      <Link href={`/admin/matches/${match.id}/edit`} className="text-xs text-cricket-green hover:underline font-medium">
                        Edit →
                      </Link>
                      <DeleteButton endpoint={`/api/matches/${match.id}`} label={match.opposition} />
                    </div>
                  </td>
                </tr>
              ))}
              {matches.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-5 py-10 text-center text-gray-400">No matches found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
