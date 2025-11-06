import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://boxro.kr'
  
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/api/',
          '/auth/',
          '/profile/',
          '/my-designs/',
          '/gallery', // 리디렉션 경로 - 직접 크롤링 방지 (리디렉션만 따름)
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
