import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: 'https://study-ai-nine-xi.vercel.app/sitemap.xml',
  }
}
