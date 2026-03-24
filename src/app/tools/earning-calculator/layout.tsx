import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Earning Calculator | Point Tripper',
  description: 'Find which credit card earns the most points for every spending category. Optimize your wallet for maximum rewards.',
}

export default function EarningCalculatorLayout({ children }: { children: React.ReactNode }) {
  return children
}
