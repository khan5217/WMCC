import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { LiveScoreBanner } from '@/components/home/LiveScoreBanner'
import { Toaster } from 'react-hot-toast'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://wmccmk.com'
const LOGO_URL = 'https://zkbeifjlj6gi0c4b.public.blob.vercel-storage.com/WMCC_Logo.jpg'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#006400',
}

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'WMCC Milton Keynes Cricket Club | Community & League Cricket',
    template: '%s | WMCC Cricket Club',
  },
  description: 'Official website of WMCC Milton Keynes Cricket Club — est. 2020. Home of competitive and community cricket in Milton Keynes.',
  keywords: ['WMCC', 'cricket', 'Milton Keynes', 'cricket club', 'MK cricket'],
  alternates: {
    canonical: '/',
  },
  icons: {
    icon: LOGO_URL,
    shortcut: LOGO_URL,
    apple: LOGO_URL,
  },
  openGraph: {
    type: 'website',
    locale: 'en_GB',
    siteName: 'WMCC Milton Keynes Cricket Club',
    url: SITE_URL,
    images: [{ url: LOGO_URL, width: 400, height: 400, alt: 'WMCC Logo' }],
  },
  twitter: {
    card: 'summary',
    site: '@wmccmk',
  },
  robots: { index: true, follow: true },
}

const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'SportsOrganization',
  name: 'WMCC Milton Keynes Cricket Club',
  sport: 'Cricket',
  url: SITE_URL,
  logo: LOGO_URL,
  image: LOGO_URL,
  foundingDate: '2020',
  description: 'Community and competitive cricket club in Milton Keynes, playing in the Bucks League.',
  address: {
    '@type': 'PostalAddress',
    streetAddress: '6 Marley Grove, Crownhill Cricket Ground',
    addressLocality: 'Milton Keynes',
    postalCode: 'MK8 0AT',
    addressCountry: 'GB',
  },
  email: 'contact@wmccmk.com',
  sameAs: [
    'https://www.facebook.com/wmccmk',
    'https://x.com/wmccmk',
    'https://www.instagram.com/wmccmk',
    'https://www.youtube.com/@wmccmk',
    'https://www.linkedin.com/company/wmcc-mk',
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </head>
      <body className="antialiased min-h-screen flex flex-col">
        <Navbar />
        <LiveScoreBanner />
        <main className="flex-1">
          {children}
        </main>
        <Footer />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: { borderRadius: '8px', fontFamily: 'Inter, sans-serif' },
            success: { iconTheme: { primary: '#006400', secondary: '#fff' } },
          }}
        />
      </body>
    </html>
  )
}
