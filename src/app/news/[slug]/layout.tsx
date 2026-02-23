import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Article',
  description: 'Read the latest on credit card points, transfer bonuses, and travel rewards strategies.',
}

export default function ArticleLayout({ children }: { children: React.ReactNode }) {
  return children
}
