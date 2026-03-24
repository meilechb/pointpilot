import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sweet Spot Explorer | Point Tripper',
  description: 'Find the best-value award travel redemptions. See sweet spots matched to your points wallet with step-by-step transfer instructions.',
}

export default function SweetSpotsLayout({ children }: { children: React.ReactNode }) {
  return children
}
