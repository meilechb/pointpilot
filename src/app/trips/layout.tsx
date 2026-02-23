import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'My Trips',
  description: 'View and manage your saved trips. Compare flight options and find the best way to use your points and miles.',
}

export default function TripsLayout({ children }: { children: React.ReactNode }) {
  return children
}
