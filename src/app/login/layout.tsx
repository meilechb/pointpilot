import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sign In',
  description: 'Sign in to Point Tripper to save your trips, points balances, and booking plans.',
}

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children
}
