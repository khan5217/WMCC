import Image from 'next/image'

interface Sponsor {
  id: string
  name: string
  logoUrl: string | null
  website: string | null
  tier: string
}

export function SponsorsSection({ sponsors }: { sponsors: Sponsor[] }) {
  if (sponsors.length === 0) return null

  return (
    <section className="py-12 bg-white border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h2 className="text-xl font-semibold text-gray-500 uppercase tracking-wider">Our Sponsors</h2>
          <p className="text-sm text-gray-400 mt-1">Proudly supported by our club partners</p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-8">
          {sponsors.map((sponsor) => (
            <a
              key={sponsor.id}
              href={sponsor.website ?? '#'}
              target={sponsor.website ? '_blank' : undefined}
              rel="noopener noreferrer"
              className="flex items-center justify-center h-16 px-6 grayscale hover:grayscale-0 transition-all duration-300 opacity-60 hover:opacity-100"
              title={sponsor.name}
            >
              {sponsor.logoUrl ? (
                <Image
                  src={sponsor.logoUrl}
                  alt={sponsor.name}
                  width={160}
                  height={64}
                  className="object-contain h-12 w-auto"
                />
              ) : (
                <span className="text-gray-500 font-semibold text-lg">{sponsor.name}</span>
              )}
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}
