import type { Metadata } from 'next'
import './globals.css'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { Toaster } from 'react-hot-toast'

export const metadata: Metadata = {
  title: {
    default: 'WMCC Milton Keynes Cricket Club',
    template: '%s | WMCC Cricket Club',
  },
  description: 'Official website of WMCC Milton Keynes Cricket Club — est. 1985. Home of competitive and community cricket in Milton Keynes.',
  keywords: ['WMCC', 'cricket', 'Milton Keynes', 'cricket club', 'MK cricket'],
  openGraph: {
    type: 'website',
    locale: 'en_GB',
    siteName: 'WMCC Milton Keynes Cricket Club',
  },
  robots: { index: true, follow: true },
  themeColor: '#006400',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen flex flex-col">
        <Navbar />
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
