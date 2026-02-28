import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Plus } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AdminSponsorsPage() {
  const sponsors = await prisma.sponsor.findMany({
    orderBy: [{ tier: 'asc' }, { name: 'asc' }],
  })

  const tierLabel: Record<string, string> = {
    gold: 'Gold',
    silver: 'Silver',
    standard: 'Standard',
  }

  const tierColor: Record<string, string> = {
    gold: 'bg-yellow-100 text-yellow-800',
    silver: 'bg-gray-200 text-gray-700',
    standard: 'bg-blue-50 text-blue-700',
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900 font-serif">Sponsors</h1>
        <Link href="/admin/sponsors/new" className="btn-primary flex items-center gap-2 text-sm">
          <Plus className="h-4 w-4" /> Add Sponsor
        </Link>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase">Name</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase">Tier</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase">Website</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase">Logo URL</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase">Active</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {sponsors.map((sponsor) => (
                <tr key={sponsor.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3.5 font-medium text-gray-900">{sponsor.name}</td>
                  <td className="px-5 py-3.5">
                    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${tierColor[sponsor.tier] ?? 'bg-gray-100 text-gray-600'}`}>
                      {tierLabel[sponsor.tier] ?? sponsor.tier}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    {sponsor.website ? (
                      <a href={sponsor.website} target="_blank" rel="noopener noreferrer" className="text-cricket-green hover:underline text-xs truncate max-w-[200px] block">
                        {sponsor.website}
                      </a>
                    ) : (
                      <span className="text-gray-300 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-gray-400 text-xs truncate max-w-[180px]">
                    {sponsor.logoUrl ?? '—'}
                  </td>
                  <td className="px-5 py-3.5">
                    {sponsor.isActive ? (
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-green-100 text-green-800">Active</span>
                    ) : (
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-500">Inactive</span>
                    )}
                  </td>
                </tr>
              ))}
              {sponsors.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-gray-400">No sponsors yet. Add your first sponsor!</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
