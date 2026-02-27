import { prisma } from '@/lib/prisma'
import { formatDate } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export default async function AdminContactsPage() {
  const messages = await prisma.contactMessage.findMany({
    orderBy: { createdAt: 'desc' },
  })

  const unread = messages.filter((m) => !m.isRead).length

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 font-serif">Contact Messages</h1>
          {unread > 0 && (
            <p className="text-sm text-red-500 mt-1">{unread} unread message{unread !== 1 ? 's' : ''}</p>
          )}
        </div>
        <div className="text-sm text-gray-500">{messages.length} total messages</div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase">Name</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase">Email</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase">Subject</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase">Message</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {messages.map((msg) => (
                <tr key={msg.id} className={`hover:bg-gray-50 ${!msg.isRead ? 'bg-blue-50/40' : ''}`}>
                  <td className="px-5 py-3.5">
                    <div className={`font-medium ${!msg.isRead ? 'text-gray-900' : 'text-gray-600'}`}>{msg.name}</div>
                    {msg.phone && <div className="text-xs text-gray-400">{msg.phone}</div>}
                  </td>
                  <td className="px-5 py-3.5 text-gray-500">{msg.email}</td>
                  <td className="px-5 py-3.5 text-gray-700 font-medium">{msg.subject}</td>
                  <td className="px-5 py-3.5 text-gray-500 max-w-xs">
                    <p className="truncate">{msg.message}</p>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${msg.isRead ? 'bg-gray-100 text-gray-500' : 'bg-red-100 text-red-700'}`}>
                      {msg.isRead ? 'Read' : 'Unread'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-gray-400 text-xs">{formatDate(msg.createdAt)}</td>
                </tr>
              ))}
              {messages.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-gray-400">No contact messages yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
