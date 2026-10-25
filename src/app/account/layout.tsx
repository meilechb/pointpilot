import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'My Account',
  description: 'Manage your Point Tripper account settings, saved trips, and points and miles balances.',
  alternates: { canonical: '/account' },
  robots: { index: false, follow: true },
}

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return children
}
