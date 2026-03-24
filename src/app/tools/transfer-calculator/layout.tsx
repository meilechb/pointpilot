import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Transfer Calculator | Point Tripper',
  description: 'Find the best way to transfer bank points to airline miles. Compare all transfer paths, ratios, and active bonuses.',
}

export default function TransferCalculatorLayout({ children }: { children: React.ReactNode }) {
  return children
}
