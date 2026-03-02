interface Sponsor {
  id: string
  name: string
  logoUrl: string | null
  website: string | null
  tier: string
}

const MAIN_SPONSOR = {
  id: 'room-escape-mk',
  name: 'Room Escape MK',
  logoUrl: 'https://zkbeifjlj6gi0c4b.public.blob.vercel-storage.com/Room%20Escape.jpg',
  website: 'https://roomescapemk.com',
  tier: 'gold',
}

export function SponsorsSection({ sponsors }: { sponsors: Sponsor[] }) {
  // Always show Room Escape MK; merge with DB sponsors, avoiding duplicates by website
  const dbGoldSponsors = sponsors.filter(
    (s) => s.tier === 'gold' && s.website !== MAIN_SPONSOR.website
  )
  const goldSponsors = [MAIN_SPONSOR, ...dbGoldSponsors]
  const otherSponsors = sponsors.filter((s) => s.tier !== 'gold')

  return (
    <section className="py-16 bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Heading */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 mb-3">
            <span className="h-px w-10 bg-cricket-gold/60 inline-block" />
            <span className="text-cricket-gold text-xs font-semibold uppercase tracking-widest">Club Partnerships</span>
            <span className="h-px w-10 bg-cricket-gold/60 inline-block" />
          </div>
          <h2 className="text-3xl font-bold text-white font-serif">Our Sponsors &amp; Partners</h2>
          <p className="text-gray-400 mt-2 text-sm">Proudly supported by businesses that back local cricket in Milton Keynes</p>
        </div>

        {/* Gold / Main Sponsors */}
        {goldSponsors.length > 0 && (
          <div className="mb-10">
            <p className="text-center text-xs font-semibold text-cricket-gold/70 uppercase tracking-widest mb-6">
              ★ &nbsp;Main Sponsor&nbsp; ★
            </p>
            <div className="flex flex-wrap items-center justify-center gap-6">
              {goldSponsors.map((sponsor) => (
                <a
                  key={sponsor.id}
                  href={sponsor.website ?? '#'}
                  target={sponsor.website ? '_blank' : undefined}
                  rel="noopener noreferrer"
                  className="group bg-white/5 hover:bg-white/10 border border-cricket-gold/40 hover:border-cricket-gold rounded-xl px-10 py-7 flex flex-col items-center gap-4 transition-all duration-300 min-w-[220px] max-w-xs"
                >
                  {sponsor.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={sponsor.logoUrl}
                      alt={sponsor.name}
                      className="h-16 w-auto object-contain"
                    />
                  ) : (
                    <span className="text-white font-bold text-2xl group-hover:text-cricket-gold transition-colors text-center">
                      {sponsor.name}
                    </span>
                  )}
                  <span className="text-xs text-cricket-gold/70 font-semibold uppercase tracking-wider border border-cricket-gold/30 rounded-full px-3 py-0.5">
                    Gold Partner
                  </span>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Silver / Standard Sponsors */}
        {otherSponsors.length > 0 && (
          <div>
            {goldSponsors.length > 0 && (
              <p className="text-center text-xs font-semibold text-gray-500 uppercase tracking-widest mb-5">
                Club Sponsors
              </p>
            )}
            <div className="flex flex-wrap items-center justify-center gap-4">
              {otherSponsors.map((sponsor) => (
                <a
                  key={sponsor.id}
                  href={sponsor.website ?? '#'}
                  target={sponsor.website ? '_blank' : undefined}
                  rel="noopener noreferrer"
                  className="bg-white/5 hover:bg-white/10 border border-gray-700 hover:border-gray-500 rounded-lg px-6 py-3 flex items-center justify-center gap-3 transition-all duration-300"
                >
                  {sponsor.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={sponsor.logoUrl}
                      alt={sponsor.name}
                      className="h-8 w-auto object-contain opacity-70 hover:opacity-100 transition-opacity"
                    />
                  ) : (
                    <span className="text-gray-300 font-medium text-sm">{sponsor.name}</span>
                  )}
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Become a sponsor CTA */}
        <div className="text-center mt-10 border-t border-gray-800 pt-8">
          <p className="text-gray-500 text-sm mb-3">Interested in sponsoring WMCC?</p>
          <a
            href="/contact"
            className="inline-flex items-center gap-2 text-sm font-semibold text-cricket-gold border border-cricket-gold/40 hover:border-cricket-gold hover:bg-cricket-gold/10 rounded-lg px-5 py-2 transition-all duration-200"
          >
            Become a Sponsor
          </a>
        </div>
      </div>
    </section>
  )
}
