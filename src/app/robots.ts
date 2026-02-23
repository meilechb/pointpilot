import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/trip/'],
    },
    sitemap: 'https://pointpilot-delta.vercel.app/sitemap.xml',
  }
}
