import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'
import { Mail, Phone, MapPin } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function ContactDetailPage({ params }: { params: { id: string } }) {
  const msg = await prisma.contactMessage.findUnique({ where: { id: params.id } })
  if (!msg) notFound()

  // Mark as read
  if (!msg.isRead) {
    await prisma.contactMessage.update({ where: { id: params.id }, data: { isRead: true } })
  }

  return (
    <div className="p-8 max-w-2xl">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/admin/contacts" className="text-gray-400 hover:text-gray-600 text-sm">← Contact Messages</Link>
      </div>

      <div className="card p-6 space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{msg.subject}</h1>
            <p className="text-xs text-gray-400 mt-1">{formatDate(msg.createdAt)}</p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-green-100 text-green-800">Read</span>
        </div>

        <div className="space-y-2 border-t pt-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Mail className="h-4 w-4 text-gray-400" />
            <a href={`mailto:${msg.email}`} className="hover:text-cricket-green">{msg.email}</a>
          </div>
          {msg.phone && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Phone className="h-4 w-4 text-gray-400" />
              <a href={`tel:${msg.phone}`} className="hover:text-cricket-green">{msg.phone}</a>
            </div>
          )}
        </div>

        <div className="border-t pt-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Message</p>
          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{msg.message}</p>
        </div>

        <div className="border-t pt-4 flex gap-3">
          <a href={`mailto:${msg.email}?subject=Re: ${encodeURIComponent(msg.subject)}`} className="btn-primary text-sm">
            Reply by Email
          </a>
          <Link href="/admin/contacts" className="btn-secondary text-sm">Back to Messages</Link>
        </div>
      </div>
    </div>
  )
}
