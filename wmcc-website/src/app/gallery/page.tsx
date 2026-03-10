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
            <GalleryGrid albums={albums} />
          )}
        </div>
      </div>
    </>
  )
}
