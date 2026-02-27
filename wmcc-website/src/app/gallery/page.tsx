import type { Metadata } from 'next'
import Image from 'next/image'
import { prisma } from '@/lib/prisma'
import { formatDate } from '@/lib/utils'
import { Camera } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Gallery',
  description: 'Photos and videos from WMCC Milton Keynes Cricket Club matches and events.',
}

export const dynamic = 'force-dynamic'

export default async function GalleryPage() {
  const items = await prisma.galleryItem.findMany({
    include: { match: { select: { opposition: true, date: true } } },
    orderBy: { createdAt: 'desc' },
  })

  // Group by album or match
  const albums = items.reduce<Record<string, typeof items>>((acc, item) => {
    const key = item.albumName ?? (item.match ? `vs ${item.match.opposition}` : 'General')
    if (!acc[key]) acc[key] = []
    acc[key].push(item)
    return acc
  }, {})

  return (
    <>
      <div className="hero-gradient pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold text-white font-serif mb-3">Gallery</h1>
          <p className="text-xl text-green-100">Match photos, events &amp; club memories</p>
        </div>
      </div>

      <div className="section-padding bg-white">
        <div className="container-max">
          {items.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <Camera className="h-14 w-14 mx-auto mb-3 opacity-30" />
              <h3 className="text-xl font-medium text-gray-500 mb-1">No photos yet</h3>
              <p>Check back soon for match photos and club gallery!</p>
            </div>
          ) : (
            <div className="space-y-14">
              {Object.entries(albums).map(([albumName, albumItems]) => (
                <div key={albumName}>
                  <div className="flex items-center gap-3 mb-6">
                    <span className="w-1 h-7 bg-cricket-green rounded-full" />
                    <h2 className="text-xl font-bold text-gray-900">{albumName}</h2>
                    <span className="text-sm text-gray-400">({albumItems.length} photos)</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {albumItems.map((item) => (
                      <div
                        key={item.id}
                        className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 group cursor-pointer"
                      >
                        {item.mediaType === 'VIDEO' ? (
                          <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                            <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center">
                              <span className="text-white text-2xl">▶</span>
                            </div>
                          </div>
                        ) : (
                          <Image
                            src={item.thumbnailUrl ?? item.url}
                            alt={item.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        )}
                        {/* Overlay on hover */}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-end">
                          <div className="p-3 text-white text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                            {item.title}
                          </div>
                        </div>
                        {item.isFeatured && (
                          <div className="absolute top-2 right-2 bg-yellow-400 text-yellow-900 text-xs font-bold px-1.5 py-0.5 rounded">
                            ★
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
