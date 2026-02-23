import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Create a Trip',
  description: 'Plan your next trip and find the best way to book flights using credit card points, airline miles, or cash. Supports round-trip, one-way, and multi-city routes.',
}

export default function NewTripLayout({ children }: { children: React.ReactNode }) {
  return children
}
