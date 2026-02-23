import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/trip/', '/admin/'],
    },
    sitemap: 'https://pointtripper.com/sitemap.xml',
  }
}
