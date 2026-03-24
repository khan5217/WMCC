import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { Camera } from 'lucide-react'
import GalleryGrid from './GalleryGrid'

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

  const albums = items.reduce<Record<string, typeof items>>((acc, item) => {
    const key = item.albumName ?? (item.match ? `vs ${item.match.opposition}` : 'General')
    if (!acc[key]) acc[key] = []
    acc[key].push(item)
    return acc
  }, {})

  const albumCount = Object.keys(albums).length
  const featuredCount = items.filter((i) => i.isFeatured).length

  return (
    <>
      {/* Hero */}
      <div className="hero-gradient pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-white font-serif mb-2">Gallery</h1>
              <p className="text-green-200 text-base">Match days, events &amp; club memories</p>
            </div>
            <div className="flex gap-6 text-center pb-1">
              <div>
                <div className="text-2xl font-bold text-white font-serif">{items.length}</div>
                <div className="text-xs text-green-300 uppercase tracking-wider">Photos</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-white font-serif">{albumCount}</div>
                <div className="text-xs text-green-300 uppercase tracking-wider">Albums</div>
              </div>
              {featuredCount > 0 && (
                <div>
                  <div className="text-2xl font-bold text-cricket-gold font-serif">{featuredCount}</div>
                  <div className="text-xs text-green-300 uppercase tracking-wider">Featured</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Gallery */}
      <div className="bg-white min-h-screen">
        <div className="max-w-3xl mx-auto px-0 sm:px-4 py-6 sm:py-10">
          {items.length === 0 ? (
            <div className="text-center py-24 text-gray-400 px-4">
              <Camera className="h-14 w-14 mx-auto mb-3 opacity-20" />
              <h3 className="text-lg font-medium text-gray-500 mb-1">No photos yet</h3>
              <p className="text-sm">Check back soon for match photos and club memories!</p>
            </div>
          ) : (
            <div className="px-4 sm:px-0">
              <GalleryGrid albums={albums} totalCount={items.length} />
            </div>
          )}
        </div>
      </div>
    </>
  )
}
