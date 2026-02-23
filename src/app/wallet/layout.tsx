import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'My Points & Miles',
  description: 'Track your credit card points and airline miles balances. Supports Chase, Amex, Citi, Capital One, Bilt, and all major airline programs.',
}

export default function WalletLayout({ children }: { children: React.ReactNode }) {
  return children
}
