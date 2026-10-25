import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Chrome Extension',
  description: 'The Point Tripper Chrome extension reads flight booking and airline sites, extracts every flight on the page, and saves the one you pick to your trip in one click.',
  alternates: { canonical: '/pricing' },
}

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return children
}
