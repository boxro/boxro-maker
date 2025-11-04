import { MetadataRoute } from 'next'
import { collection, getDocs, query, orderBy } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://boxro.kr'
  
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
      url: `${baseUrl}/youtube`,
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
      url: `${baseUrl}/friends`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.8,
    },
  ]

  // 동적 카드 페이지들 (해시 URL)
  let cardPages: MetadataRoute.Sitemap = []

  try {
    // Story 카드들
    const storyQuery = query(
      collection(db, 'storyArticles'),
      orderBy('createdAt', 'desc')
    )
    const storySnapshot = await getDocs(storyQuery)
    
    storySnapshot.docs.forEach((doc) => {
      cardPages.push({
        url: `${baseUrl}/story#card-${doc.id}`,
        lastModified: doc.data().updatedAt?.toDate?.() || doc.data().createdAt?.toDate?.() || new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.6,
      })
    })
  } catch (error) {
    console.error('이야기 카드 사이트맵 생성 실패:', error)
  }

  try {
    // Store 카드들
    const storeQuery = query(
      collection(db, 'storeItems'),
      orderBy('createdAt', 'desc')
    )
    const storeSnapshot = await getDocs(storeQuery)
    
    storeSnapshot.docs.forEach((doc) => {
      cardPages.push({
        url: `${baseUrl}/store#card-${doc.id}`,
        lastModified: doc.data().updatedAt?.toDate?.() || doc.data().createdAt?.toDate?.() || new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.6,
      })
    })
  } catch (error) {
    console.error('스토어 카드 사이트맵 생성 실패:', error)
  }

  try {
    // Youtube 카드들
    const youtubeQuery = query(
      collection(db, 'youtubeItems'),
      orderBy('createdAt', 'desc')
    )
    const youtubeSnapshot = await getDocs(youtubeQuery)
    
    youtubeSnapshot.docs.forEach((doc) => {
      cardPages.push({
        url: `${baseUrl}/youtube#card-${doc.id}`,
        lastModified: doc.data().updatedAt?.toDate?.() || doc.data().createdAt?.toDate?.() || new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.6,
      })
    })
  } catch (error) {
    console.error('유튜브 카드 사이트맵 생성 실패:', error)
  }

  try {
    // Community (갤러리) 카드들
    const communityQuery = query(
      collection(db, 'communityDesigns'),
      orderBy('createdAt', 'desc')
    )
    const communitySnapshot = await getDocs(communityQuery)
    
    communitySnapshot.docs.forEach((doc) => {
      cardPages.push({
        url: `${baseUrl}/community#card-${doc.id}`,
        lastModified: doc.data().updatedAt?.toDate?.() || doc.data().createdAt?.toDate?.() || new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.6,
      })
    })
  } catch (error) {
    console.error('커뮤니티 카드 사이트맵 생성 실패:', error)
  }

  try {
    // Friends 카드들
    const friendsQuery = query(
      collection(db, 'friendsItems'),
      orderBy('createdAt', 'desc')
    )
    const friendsSnapshot = await getDocs(friendsQuery)
    
    friendsSnapshot.docs.forEach((doc) => {
      cardPages.push({
        url: `${baseUrl}/friends#card-${doc.id}`,
        lastModified: doc.data().updatedAt?.toDate?.() || doc.data().createdAt?.toDate?.() || new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.6,
      })
    })
  } catch (error) {
    console.error('프렌즈 카드 사이트맵 생성 실패:', error)
  }

  return [...staticPages, ...cardPages]
}
