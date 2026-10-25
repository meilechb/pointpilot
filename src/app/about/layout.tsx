import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About',
  description: 'Point Tripper helps travelers get more value from credit card points and airline miles: create a trip, save flight options, add your balances, and compare itineraries.',
  alternates: { canonical: '/about' },
}

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children
}
