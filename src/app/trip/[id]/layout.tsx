import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Trip Details',
  description: 'View and manage your trip flights, compare booking options, and get an optimized step-by-step booking strategy using your points and miles.',
  alternates: { canonical: null },
  robots: { index: false, follow: true },
}

export default function TripDetailLayout({ children }: { children: React.ReactNode }) {
  return children
}
