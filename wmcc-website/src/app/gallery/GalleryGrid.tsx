'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'

interface GalleryItem {
  id: string
  title: string
  description: string | null
  url: string
  thumbnailUrl: string | null
  mediaType: string
  isFeatured: boolean
}

interface Props {
  albums: Record<string, GalleryItem[]>
}

export default function GalleryGrid({ albums }: Props) {
  const allItems = Object.values(albums).flat()
  const [lightbox, setLightbox] = useState<{ item: GalleryItem; idx: number } | null>(null)

  const open = (item: GalleryItem) => {
    const idx = allItems.findIndex((i) => i.id === item.id)
    setLightbox({ item, idx })
  }

  const close = () => setLightbox(null)

  const go = useCallback((dir: 1 | -1) => {
    if (!lightbox) return
    const next = (lightbox.idx + dir + allItems.length) % allItems.length
    setLightbox({ item: allItems[next], idx: next })
  }, [lightbox, allItems])

  useEffect(() => {
    if (!lightbox) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
      if (e.key === 'ArrowRight') go(1)
      if (e.key === 'ArrowLeft') go(-1)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [lightbox, go])

  return (
    <>
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
                  onClick={() => open(item)}
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
                  {/* Always visible on touch devices, hover-only on desktop */}
                  <div className="absolute inset-0 bg-black/30 sm:bg-black/0 sm:group-hover:bg-black/40 transition-all duration-300 flex items-end">
                    <div className="p-2 text-white text-xs font-medium sm:opacity-0 sm:group-hover:opacity-100 transition-opacity line-clamp-2">
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

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
          onClick={close}
        >
          {/* Close */}
          <button
            onClick={close}
            className="absolute top-3 right-3 text-white/70 hover:text-white active:text-white z-10 p-3 min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <X className="h-6 w-6" />
          </button>

          {/* Prev */}
          {allItems.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); go(-1) }}
              className="absolute left-1 sm:left-3 top-1/2 -translate-y-1/2 text-white/70 hover:text-white active:text-white z-10 p-3 min-w-[44px] min-h-[44px] flex items-center justify-center"
            >
              <ChevronLeft className="h-7 w-7 sm:h-9 sm:w-9" />
            </button>
          )}

          {/* Image / Video */}
          <div
            className="relative max-w-5xl max-h-[85vh] w-full mx-12 sm:mx-16"
            onClick={(e) => e.stopPropagation()}
          >
            {lightbox.item.mediaType === 'VIDEO' ? (
              <video
                src={lightbox.item.url}
                controls
                autoPlay
                className="max-h-[80vh] w-full rounded-lg"
              />
            ) : (
              <div className="relative w-full" style={{ maxHeight: '80vh' }}>
                <img
                  src={lightbox.item.url}
                  alt={lightbox.item.title}
                  className="max-h-[80vh] max-w-full mx-auto rounded-lg object-contain block"
                />
              </div>
            )}

            {/* Caption */}
            <div className="mt-3 text-center">
              <p className="text-white font-medium">{lightbox.item.title}</p>
              {lightbox.item.description && (
                <p className="text-white/60 text-sm mt-0.5">{lightbox.item.description}</p>
              )}
              <p className="text-white/40 text-xs mt-1">{lightbox.idx + 1} / {allItems.length}</p>
            </div>
          </div>

          {/* Next */}
          {allItems.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); go(1) }}
              className="absolute right-1 sm:right-3 top-1/2 -translate-y-1/2 text-white/70 hover:text-white active:text-white z-10 p-3 min-w-[44px] min-h-[44px] flex items-center justify-center"
            >
              <ChevronRight className="h-7 w-7 sm:h-9 sm:w-9" />
            </button>
          )}
        </div>
      )}
    </>
  )
}
