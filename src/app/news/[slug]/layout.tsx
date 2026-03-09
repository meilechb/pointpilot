import type { Metadata } from 'next'
import { createServerSupabase } from '@/lib/supabase-server'

type Props = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createServerSupabase()

  const { data: article } = await supabase
    .from('articles')
    .select('title, summary, meta_title, meta_description, og_image, canonical_url, keywords, noindex')
    .eq('slug', slug)
    .eq('published', true)
    .single()

  if (!article) {
    return { title: 'Article Not Found' }
  }

  const title = article.meta_title || article.title
  const description = article.meta_description || article.summary

  const metadata: Metadata = {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      url: `https://pointpilot-delta.vercel.app/news/${slug}`,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  }

  if (article.og_image) {
    metadata.openGraph!.images = [{ url: article.og_image }]
    metadata.twitter!.images = [article.og_image]
  }

  if (article.canonical_url) {
    metadata.alternates = { canonical: article.canonical_url }
  }

  if (article.keywords) {
    metadata.keywords = article.keywords.split(',').map((k: string) => k.trim())
  }

  if (article.noindex) {
    metadata.robots = { index: false, follow: false }
  }

  return metadata
}

export default function ArticleLayout({ children }: { children: React.ReactNode }) {
  return children
}
