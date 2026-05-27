import type { MetadataRoute } from 'next'
import { createServerSupabase } from '@/lib/supabase-server'

const BASE_URL = 'https://pointtripper.com'

const staticRoutes: MetadataRoute.Sitemap = [
  { url: BASE_URL, changeFrequency: 'weekly', priority: 1 },
  { url: `${BASE_URL}/news`, changeFrequency: 'daily', priority: 0.9 },
  { url: `${BASE_URL}/trips`, changeFrequency: 'weekly', priority: 0.8 },
  { url: `${BASE_URL}/wallet`, changeFrequency: 'weekly', priority: 0.8 },
  { url: `${BASE_URL}/trip/new`, changeFrequency: 'monthly', priority: 0.7 },
  { url: `${BASE_URL}/pricing`, changeFrequency: 'monthly', priority: 0.7 },
  { url: `${BASE_URL}/about`, changeFrequency: 'monthly', priority: 0.5 },
  { url: `${BASE_URL}/contact`, changeFrequency: 'monthly', priority: 0.5 },
  { url: `${BASE_URL}/login`, changeFrequency: 'monthly', priority: 0.5 },
  { url: `${BASE_URL}/privacy`, changeFrequency: 'yearly', priority: 0.3 },
  { url: `${BASE_URL}/terms`, changeFrequency: 'yearly', priority: 0.3 },
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()
  const withDates = staticRoutes.map(r => ({ ...r, lastModified: now }))

  try {
    const supabase = await createServerSupabase()
    const { data } = await supabase
      .from('articles')
      .select('slug, updated_at, created_at, noindex')
      .eq('published', true)

    const articleRoutes: MetadataRoute.Sitemap = (data || [])
      .filter(a => !a.noindex)
      .map(a => ({
        url: `${BASE_URL}/news/${a.slug}`,
        lastModified: new Date(a.updated_at || a.created_at || Date.now()),
        changeFrequency: 'monthly' as const,
        priority: 0.6,
      }))

    return [...withDates, ...articleRoutes]
  } catch {
    return withDates
  }
}
