import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'News & Deals',
  description: 'Stay updated on credit card transfer bonuses, points sweet spots, and travel rewards tips. Find the best deals for maximizing your airline miles and bank points.',
}

export default function NewsLayout({ children }: { children: React.ReactNode }) {
  return children
}
