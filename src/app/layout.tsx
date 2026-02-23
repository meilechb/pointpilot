import type { Metadata } from 'next'
import "./globals.css"
import ClientLayout from '@/components/ClientLayout'

const SITE_URL = 'https://pointpilot-delta.vercel.app'

export const metadata: Metadata = {
  title: {
    default: 'Point Tripper — Maximize Your Points & Miles',
    template: '%s | Point Tripper',
  },
  description: 'Stop juggling spreadsheets. Organize flight options, compare cash vs. points, and get step-by-step booking instructions using your credit card rewards.',
  keywords: ['credit card points', 'airline miles', 'travel rewards', 'points transfer', 'flight booking', 'Chase Ultimate Rewards', 'Amex Membership Rewards', 'award travel'],
  metadataBase: new URL(SITE_URL),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: SITE_URL,
    siteName: 'Point Tripper',
    title: 'Point Tripper — Maximize Your Points & Miles',
    description: 'Organize all your flight options, compare cash vs. points, and get step-by-step booking instructions. Works with Chase, Amex, Citi, Capital One, and Bilt.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Point Tripper — Flight points optimization tool',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Point Tripper — Maximize Your Points & Miles',
    description: 'Organize all your flight options, compare cash vs. points, and get step-by-step booking instructions.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/favicon.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/manifest.json',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  )
}
