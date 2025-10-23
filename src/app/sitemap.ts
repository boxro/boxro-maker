import { MetadataRoute } from 'next'
import { collection, getDocs, query, orderBy, where } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://boxro.vercel.app'
  
  // 정적 페이지들
  const staticPages = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1,
    },
    {
      url: `${baseUrl}/community`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/story`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/store`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/draw`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/paper`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/templates`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    },
  ]

  // 동적 페이지들 (이야기)
  let storyPages: MetadataRoute.Sitemap = []
  try {
    const storyQuery = query(
      collection(db, 'storyArticles'),
      where('isPublished', '==', true),
      orderBy('createdAt', 'desc')
    )
    const storySnapshot = await getDocs(storyQuery)
    
    storyPages = storySnapshot.docs.map((doc) => ({
      url: `${baseUrl}/story/${doc.id}`,
      lastModified: doc.data().updatedAt?.toDate?.() || new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }))
  } catch (error) {
    console.error('이야기 페이지 사이트맵 생성 실패:', error)
  }

  // 동적 페이지들 (스토어)
  let storePages: MetadataRoute.Sitemap = []
  try {
    const storeQuery = query(
      collection(db, 'storeItems'),
      where('isPublished', '==', true),
      orderBy('createdAt', 'desc')
    )
    const storeSnapshot = await getDocs(storeQuery)
    
    storePages = storeSnapshot.docs.map((doc) => ({
      url: `${baseUrl}/store/${doc.id}`,
      lastModified: doc.data().updatedAt?.toDate?.() || new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }))
  } catch (error) {
    console.error('스토어 페이지 사이트맵 생성 실패:', error)
  }

  return [...staticPages, ...storyPages, ...storePages]
}
