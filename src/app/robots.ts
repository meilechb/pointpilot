import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/trip/'],
    },
    sitemap: 'https://pointtripper.com/sitemap.xml',
  }
}
