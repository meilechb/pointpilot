import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Travel Rewards Tools | Point Tripper',
  description: 'Free tools to maximize your credit card points and airline miles. Sweet spot explorer, transfer calculator, and earning optimizer.',
}

export default function ToolsLayout({ children }: { children: React.ReactNode }) {
  return children
}
