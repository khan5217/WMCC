import { prisma } from '@/lib/prisma'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

const statusColors: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-800',
  PENDING: 'bg-yellow-100 text-yellow-800',
  EXPIRED: 'bg-red-100 text-red-800',
  SUSPENDED: 'bg-gray-100 text-gray-600',
}

export default async function AdminMembersPage() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    include: { memberships: { orderBy: { createdAt: 'desc' }, take: 1 } },
  })

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-6 gap-3">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 font-serif">Members</h1>
        <div className="text-sm text-gray-500">{users.length} registered</div>
      </div>

      <div className="card overflow-hidden">
        {/* Mobile cards */}
        <div className="md:hidden divide-y divide-gray-100">
          {users.length === 0 && (
            <p className="px-4 py-10 text-center text-gray-400 text-sm">No members yet.</p>
          )}
          {users.map((user) => (
            <div key={user.id} className="p-4 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="font-semibold text-gray-900 text-sm">
                  {user.firstName} {user.lastName}
                </div>
                <div className="text-xs text-gray-500 mt-0.5 truncate">{user.email}</div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <span className="text-xs bg-blue-100 text-blue-800 font-medium px-2 py-0.5 rounded-full">
                    {user.role}
                  </span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusColors[user.membershipStatus]}`}>
                    {user.membershipStatus}
                  </span>
                </div>
                <div className="text-xs text-gray-400 mt-1">Joined {formatDate(user.createdAt)}</div>
              </div>
              <Link href={`/admin/members/${user.id}`} className="text-xs text-cricket-green font-medium hover:underline shrink-0 mt-1">
                Manage →
              </Link>
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
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase">Phone</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase">Role</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase">Joined</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3.5 font-medium text-gray-900">
                    {user.firstName} {user.lastName}
                  </td>
                  <td className="px-5 py-3.5 text-gray-500">{user.email}</td>
                  <td className="px-5 py-3.5 text-gray-500">{user.phone}</td>
                  <td className="px-5 py-3.5">
                    <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 rounded-full">
                      {user.role}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${statusColors[user.membershipStatus]}`}>
                      {user.membershipStatus}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-gray-400 text-xs">{formatDate(user.createdAt)}</td>
                  <td className="px-5 py-3.5">
                    <Link href={`/admin/members/${user.id}`} className="text-cricket-green hover:underline text-xs font-medium">
                      Manage
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
