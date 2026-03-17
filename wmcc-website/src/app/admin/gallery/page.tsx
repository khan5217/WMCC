import { prisma } from '@/lib/prisma'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { DeleteGalleryButton } from './DeleteGalleryButton'

export const dynamic = 'force-dynamic'

export default async function AdminGalleryPage() {
  const items = await prisma.galleryItem.findMany({
    include: { uploadedBy: { select: { firstName: true, lastName: true } } },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-6 gap-3">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 font-serif">Gallery</h1>
        <Link href="/admin/gallery/new" className="btn-primary flex items-center gap-2 text-sm">
          <Plus className="h-4 w-4" /> Add Media
        </Link>
      </div>

      <div className="card overflow-hidden">
        {/* Mobile cards */}
        <div className="md:hidden divide-y divide-gray-100">
          {items.length === 0 && (
            <p className="px-4 py-10 text-center text-gray-400 text-sm">No gallery items yet.</p>
          )}
          {items.map((item) => (
            <div key={item.id} className="p-4 flex items-center gap-3">
              {item.mediaType === 'PHOTO' && (item.thumbnailUrl || item.url) ? (
                <img
                  src={item.thumbnailUrl ?? item.url}
                  alt={item.title}
                  className="w-14 h-14 object-cover rounded-lg shrink-0"
                />
              ) : (
                <div className="w-14 h-14 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-xs shrink-0">
                  {item.mediaType === 'VIDEO' ? 'VID' : '—'}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-gray-900 text-sm truncate">{item.title}</div>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${item.mediaType === 'PHOTO' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
                    {item.mediaType}
                  </span>
                  {item.isFeatured && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800">Featured</span>
                  )}
                  {item.albumName && (
                    <span className="text-xs text-gray-500">{item.albumName}</span>
                  )}
                </div>
                <div className="text-xs text-gray-400 mt-0.5">{formatDate(item.createdAt)}</div>
              </div>
              <DeleteGalleryButton id={item.id} title={item.title} />
            </div>
          ))}
        </div>

        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase">Preview</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase">Title</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase">Type</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase">Album</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase">Uploaded By</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase">Featured</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase">Date</th>
                <th className="px-5 py-3.5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3">
                    {item.mediaType === 'PHOTO' && (item.thumbnailUrl || item.url) ? (
                      <img src={item.thumbnailUrl ?? item.url} alt={item.title} className="w-12 h-12 object-cover rounded" />
                    ) : (
                      <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center text-gray-400 text-xs">
                        {item.mediaType === 'VIDEO' ? 'VID' : '—'}
                      </div>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="font-medium text-gray-900">{item.title}</div>
                    {item.description && <div className="text-xs text-gray-400 mt-0.5">{item.description}</div>}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${item.mediaType === 'PHOTO' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
                      {item.mediaType}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-gray-500">{item.albumName ?? '—'}</td>
                  <td className="px-5 py-3.5 text-gray-500">
                    {item.uploadedBy.firstName} {item.uploadedBy.lastName}
                  </td>
                  <td className="px-5 py-3.5">
                    {item.isFeatured ? (
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-yellow-100 text-yellow-800">Yes</span>
                    ) : (
                      <span className="text-gray-300 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-gray-400 text-xs">{formatDate(item.createdAt)}</td>
                  <td className="px-5 py-3.5">
                    <DeleteGalleryButton id={item.id} title={item.title} />
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-5 py-10 text-center text-gray-400">No gallery items yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
