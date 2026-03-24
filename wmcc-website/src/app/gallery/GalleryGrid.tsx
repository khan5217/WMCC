'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Image from 'next/image'
import { X, ChevronLeft, ChevronRight, Star, Play } from 'lucide-react'

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
  totalCount: number
}

export default function GalleryGrid({ albums, totalCount }: Props) {
  const allItems = Object.values(albums).flat()
  const albumEntries = Object.entries(albums)

  const [activeAlbum, setActiveAlbum] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'featured'>('all')
  const [lightbox, setLightbox] = useState<{ items: GalleryItem[]; idx: number } | null>(null)
  const touchStartX = useRef<number | null>(null)

  const displayItems = activeAlbum
    ? albums[activeAlbum] ?? []
    : filter === 'featured'
      ? allItems.filter((i) => i.isFeatured)
      : allItems

  const openLightbox = (item: GalleryItem) => {
    const idx = displayItems.findIndex((i) => i.id === item.id)
    setLightbox({ items: displayItems, idx })
  }

  const close = () => setLightbox(null)

  const go = useCallback((dir: 1 | -1) => {
    setLightbox((lb) => {
      if (!lb) return null
      const next = (lb.idx + dir + lb.items.length) % lb.items.length
      return { ...lb, idx: next }
    })
  }, [])

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

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1)
    touchStartX.current = null
  }

  const currentLbItem = lightbox ? lightbox.items[lightbox.idx] : null
  const featuredCount = allItems.filter((i) => i.isFeatured).length

  return (
    <>
      {/* ── Album highlights strip ── */}
      {albumEntries.length > 1 && (
        <div className="mb-8">
          <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-hide -mx-1 px-1">
            {/* "All" pill */}
            <button
              onClick={() => { setActiveAlbum(null); setFilter('all') }}
              className="flex flex-col items-center gap-1.5 flex-shrink-0 group"
            >
              <div className={`w-16 h-16 rounded-full overflow-hidden ring-2 ring-offset-2 transition-all
                ${!activeAlbum && filter === 'all' ? 'ring-cricket-green' : 'ring-gray-200 group-hover:ring-gray-300'}`}>
                {allItems[0]?.thumbnailUrl || allItems[0]?.url ? (
                  <Image
                    src={allItems[0].thumbnailUrl ?? allItems[0].url}
                    alt="All"
                    width={64}
                    height={64}
                    className="w-full h-full object-cover object-top"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200" />
                )}
              </div>
              <span className={`text-xs font-medium truncate max-w-[72px] text-center leading-tight
                ${!activeAlbum && filter === 'all' ? 'text-cricket-green' : 'text-gray-600'}`}>
                All
              </span>
            </button>

            {/* Featured pill */}
            {featuredCount > 0 && (
              <button
                onClick={() => { setActiveAlbum(null); setFilter('featured') }}
                className="flex flex-col items-center gap-1.5 flex-shrink-0 group"
              >
                <div className={`w-16 h-16 rounded-full overflow-hidden ring-2 ring-offset-2 transition-all
                  ${!activeAlbum && filter === 'featured' ? 'ring-cricket-gold' : 'ring-gray-200 group-hover:ring-gray-300'}`}>
                  {allItems.find(i => i.isFeatured) && (
                    <Image
                      src={(allItems.find(i => i.isFeatured)!.thumbnailUrl ?? allItems.find(i => i.isFeatured)!.url)}
                      alt="Featured"
                      width={64}
                      height={64}
                      className="w-full h-full object-cover object-top"
                    />
                  )}
                </div>
                <span className={`text-xs font-medium truncate max-w-[72px] text-center leading-tight
                  ${!activeAlbum && filter === 'featured' ? 'text-cricket-gold' : 'text-gray-600'}`}>
                  ★ Best
                </span>
              </button>
            )}

            {/* Album pills */}
            {albumEntries.map(([name, items]) => (
              <button
                key={name}
                onClick={() => { setActiveAlbum(name); setFilter('all') }}
                className="flex flex-col items-center gap-1.5 flex-shrink-0 group"
              >
                <div className={`w-16 h-16 rounded-full overflow-hidden ring-2 ring-offset-2 transition-all
                  ${activeAlbum === name ? 'ring-cricket-green' : 'ring-gray-200 group-hover:ring-gray-300'}`}>
                  {items[0] && (
                    <Image
                      src={items[0].thumbnailUrl ?? items[0].url}
                      alt={name}
                      width={64}
                      height={64}
                      className="w-full h-full object-cover object-top"
                    />
                  )}
                </div>
                <span className={`text-xs font-medium truncate max-w-[72px] text-center leading-tight
                  ${activeAlbum === name ? 'text-cricket-green' : 'text-gray-600'}`}>
                  {name}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Active album header ── */}
      {activeAlbum && (
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveAlbum(null)}
              className="text-sm text-gray-400 hover:text-cricket-green transition-colors flex items-center gap-1"
            >
              <ChevronLeft className="h-4 w-4" /> All Albums
            </button>
            <span className="text-gray-300">/</span>
            <span className="font-semibold text-gray-900">{activeAlbum}</span>
            <span className="text-sm text-gray-400">({displayItems.length})</span>
          </div>
        </div>
      )}

      {/* ── Stats row ── */}
      {!activeAlbum && (
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm text-gray-500">
            {filter === 'featured'
              ? `${featuredCount} featured photo${featuredCount !== 1 ? 's' : ''}`
              : `${totalCount} photo${totalCount !== 1 ? 's' : ''} · ${albumEntries.length} album${albumEntries.length !== 1 ? 's' : ''}`}
          </p>
        </div>
      )}

      {/* ── Instagram-style grid ── */}
      {displayItems.length === 0 ? (
        <div className="py-20 text-center text-gray-400 text-sm">No photos in this view.</div>
      ) : (
        <div
          className="grid gap-[3px]"
          style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}
        >
          {displayItems.map((item, idx) => {
            // Every 9th item (0, 9, 18…) gets featured 2×2 treatment
            const isBig = idx % 9 === 0
            const isPriority = idx < 9

            return (
              <div
                key={item.id}
                onClick={() => openLightbox(item)}
                className={`relative overflow-hidden bg-gray-100 cursor-pointer group
                  ${isBig ? 'col-span-2 row-span-2' : ''}`}
                style={{ aspectRatio: '1' }}
              >
                {item.mediaType === 'VIDEO' ? (
                  <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
                    {item.thumbnailUrl ? (
                      <Image src={item.thumbnailUrl} alt={item.title} fill className="object-cover object-top opacity-60" sizes="33vw" />
                    ) : null}
                    <div className="relative z-10 w-12 h-12 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center">
                      <Play className="h-5 w-5 text-white fill-white ml-0.5" />
                    </div>
                  </div>
                ) : (
                  <Image
                    src={item.thumbnailUrl ?? item.url}
                    alt={item.title}
                    fill
                    sizes={isBig ? '(min-width: 768px) 66vw, 66vw' : '(min-width: 768px) 33vw, 33vw'}
                    priority={isPriority}
                    className="object-cover object-top transition-transform duration-500 group-hover:scale-105"
                  />
                )}

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex flex-col items-center justify-center gap-1 opacity-0 group-hover:opacity-100">
                  <p className="text-white text-xs font-semibold text-center px-3 line-clamp-2 drop-shadow">
                    {item.title}
                  </p>
                </div>

                {/* Featured badge */}
                {item.isFeatured && (
                  <div className="absolute top-1.5 right-1.5 bg-cricket-gold text-yellow-900 rounded-full p-1 shadow-sm">
                    <Star className="h-2.5 w-2.5 fill-yellow-900" />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ── Lightbox ── */}
      {lightbox && currentLbItem && (
        <div
          className="fixed inset-0 z-50 bg-black flex items-center justify-center"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Close */}
          <button
            onClick={close}
            className="absolute top-4 right-4 z-20 bg-white/10 hover:bg-white/20 text-white rounded-full p-2.5 transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Counter */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 text-white/60 text-xs font-medium tabular-nums">
            {lightbox.idx + 1} / {lightbox.items.length}
          </div>

          {/* Prev */}
          {lightbox.items.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); go(-1) }}
              className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-20 bg-white/10 hover:bg-white/25 text-white rounded-full p-2.5 transition-colors"
              aria-label="Previous"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
          )}

          {/* Media */}
          <div className="flex flex-col items-center justify-center w-full h-full px-16 sm:px-20">
            {currentLbItem.mediaType === 'VIDEO' ? (
              <video
                key={currentLbItem.id}
                src={currentLbItem.url}
                controls
                autoPlay
                className="max-h-[80vh] max-w-full rounded-lg"
              />
            ) : (
              <img
                key={currentLbItem.id}
                src={currentLbItem.url}
                alt={currentLbItem.title}
                className="max-h-[82vh] max-w-full object-contain rounded-sm select-none"
                draggable={false}
              />
            )}

            {/* Caption */}
            <div className="mt-4 text-center max-w-lg px-4">
              <p className="text-white font-semibold text-sm">{currentLbItem.title}</p>
              {currentLbItem.description && (
                <p className="text-white/50 text-xs mt-1">{currentLbItem.description}</p>
              )}
            </div>
          </div>

          {/* Next */}
          {lightbox.items.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); go(1) }}
              className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-20 bg-white/10 hover:bg-white/25 text-white rounded-full p-2.5 transition-colors"
              aria-label="Next"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          )}

          {/* Dot strip */}
          {lightbox.items.length > 1 && lightbox.items.length <= 20 && (
            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-1.5">
              {lightbox.items.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setLightbox((lb) => lb ? { ...lb, idx: i } : null)}
                  className={`rounded-full transition-all ${i === lightbox.idx ? 'w-4 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/30 hover:bg-white/60'}`}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </>
  )
}
