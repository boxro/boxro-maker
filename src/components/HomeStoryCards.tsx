"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { collection, query, where, getDocs, orderBy, limit, startAfter } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface StoryArticle {
  id: string;
  title: string;
  content: string;
  author: string;
  authorNickname?: string;
  authorEmail: string;
  authorId: string;
  thumbnail: string;
  summary: string;
  tags: string[];
  views: number;
  likes: number;
  isPublished: boolean;
  showOnHome?: boolean;
  cardTitle?: string;
  cardDescription?: string;
  cardThumbnail?: string;
  openInNewTab?: boolean;
  createdAt: any;
  updatedAt: any;
}

export default function HomeStoryCards() {
  const [homeCards, setHomeCards] = useState<StoryArticle[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastDoc, setLastDoc] = useState<any>(null);

  useEffect(() => {
    setIsClient(true);
    fetchHomeCards();
  }, []);

  // 스크롤 이벤트 리스너
  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + document.documentElement.scrollTop >= document.documentElement.offsetHeight - 1000) {
        loadMoreCards();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [hasMore, loadingMore, lastDoc]);

  const fetchHomeCards = async () => {
    try {
      setLoading(true);
      setHomeCards([]);
      setHasMore(true);
      
      // 홈카드 데이터 캐싱 확인
      const cachedHomeCards = sessionStorage.getItem('homeCards');
      const lastHomeCardsUpdate = sessionStorage.getItem('lastHomeCardsUpdate');
      const now = Date.now();
      
      if (cachedHomeCards && lastHomeCardsUpdate && (now - parseInt(lastHomeCardsUpdate)) < 30000) { // 30초 캐시
        const allHomeCards = JSON.parse(cachedHomeCards);
        console.log('캐시된 홈카드 데이터 사용');
        
        // 클라이언트에서 홈 표시 조건 필터링
        const filteredHomeCards = allHomeCards
          .filter(article => 
            article.showOnHome === true && 
            article.isPublished === true &&
            article.cardTitle && 
            article.cardTitle.trim() && 
            article.cardDescription && 
            article.cardDescription.trim()
          )
          .sort((a, b) => {
            const aOrder = a.homeOrder || 999999;
            const bOrder = b.homeOrder || 999999;
            return aOrder - bOrder;
          })
          .slice(0, 15);
        
        setHomeCards(filteredHomeCards);
        setLoading(false);
        return;
      }
      
      // homeCards 컬렉션 서버사이드 필터링 및 최소 데이터만 로드
      const homeCardsQuery = await getDocs(
        query(
          collection(db, 'homeCards'),
          where('showOnHome', '==', true),
          where('isPublished', '==', true),
          orderBy('createdAt', 'desc'),
          limit(15)
        )
      );
      
      // homeCards 데이터 변환 및 클라이언트 필터링/정렬
      const allHomeCards = homeCardsQuery.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        source: doc.data().source || 'homeCards'
      })) as (StoryArticle & { source: string })[];
      
      // 안전 필터 + 클라이언트 정렬(서버 필터에 더해 보강)
      const filteredHomeCards = allHomeCards
        .filter(article =>
          article.cardTitle && article.cardTitle.trim() &&
          article.cardDescription && article.cardDescription.trim()
        )
        .sort((a, b) => {
          const aOrder = a.homeOrder || 999999;
          const bOrder = b.homeOrder || 999999;
          return aOrder - bOrder;
        });
      
      // 홈카드 데이터를 세션 스토리지에 캐싱(필터/정렬된 결과 저장)
      sessionStorage.setItem('homeCards', JSON.stringify(filteredHomeCards));
      sessionStorage.setItem('lastHomeCardsUpdate', Date.now().toString());
      
      setHomeCards(filteredHomeCards);
      
      // 마지막 문서 저장
      if (homeCardsQuery.docs.length > 0) {
        setLastDoc(homeCardsQuery.docs[homeCardsQuery.docs.length - 1]);
      }
      
      // 더 이상 데이터가 없으면 hasMore를 false로 설정
      if (homeCardsQuery.docs.length < 15) {
        setHasMore(false);
      }
    } catch (error) {
      console.error('홈 카드 데이터 불러오기 실패:', error);
      setHomeCards([]);
    } finally {
      setLoading(false);
    }
  };

  // 더 많은 카드 로드
  const loadMoreCards = async () => {
    if (!hasMore || loadingMore) return;
    
    try {
      setLoadingMore(true);
      
      const articlesQuery = query(
        collection(db, 'homeCards'),
        where('showOnHome', '==', true),
        where('isPublished', '==', true),
        orderBy('createdAt', 'desc'),
        startAfter(lastDoc),
        limit(20)
      );
      
      const articlesSnapshot = await getDocs(articlesQuery);
      const newArticles = articlesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as StoryArticle[];
      
      // 안전 필터 + 정렬
      const newHomeCards = newArticles
        .filter(article =>
          article.cardTitle && article.cardTitle.trim() &&
          article.cardDescription && article.cardDescription.trim()
        )
        .sort((a, b) => {
          const aOrder = a.homeOrder || 999999;
          const bOrder = b.homeOrder || 999999;
          return aOrder - bOrder;
        });
      
      setHomeCards(prev => [...prev, ...newHomeCards]);
      
      // 마지막 문서 업데이트
      if (articlesSnapshot.docs.length > 0) {
        setLastDoc(articlesSnapshot.docs[articlesSnapshot.docs.length - 1]);
      }
      
      // 더 이상 데이터가 없으면 hasMore를 false로 설정
      if (articlesSnapshot.docs.length < 15) {
        setHasMore(false);
      }
    } catch (error) {
      console.error('더 많은 홈 카드 로드 실패:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  // 클라이언트에서만 렌더링
  if (!isClient) {
    return null;
  }

  if (loading) {
    return null; // 로딩 중에는 아무것도 표시하지 않음
  }

  if (homeCards.length === 0) {
    return null; // 홈 카드가 없으면 아무것도 표시하지 않음
  }

  return (
    <>
      {homeCards.map((article) => (
        <Link 
          key={article.id} 
          href={article.url || (article.source === 'storeItems' ? `/store/${article.id}` : `/story/${article.id}`)} 
          className="block w-full"
          target={article.openInNewTab ? '_blank' : undefined}
          rel={article.openInNewTab ? 'noopener noreferrer' : undefined}
        >
          <Card className="group hover:shadow-xl transition-all duration-300 border-0 border-purple-300/50 shadow-2xl relative overflow-hidden bg-transparent min-h-[480px] flex flex-col justify-end cursor-pointer">
            {/* 배경 이미지 */}
            {article.cardThumbnail ? (
              <div className="absolute inset-0 overflow-hidden">
                <Image
                  src={article.cardThumbnail}
                  alt={article.cardTitle || article.title}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                />
              </div>
            ) : (
              <div 
                className="absolute inset-0 w-full h-full"
                style={{ 
                  backgroundColor: (article.homeCardBackgroundColor || article.backgroundColor) === 'transparent' ? 'transparent' : ((article.homeCardBackgroundColor || article.backgroundColor) || 'transparent'),
                  background: (article.homeCardBackgroundColor || article.backgroundColor) === 'transparent' ? 'transparent' : ((article.homeCardBackgroundColor || article.backgroundColor) ? `linear-gradient(135deg, ${article.homeCardBackgroundColor || article.backgroundColor} 0%, ${article.homeCardBackgroundColor || article.backgroundColor} 100%)` : 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)')
                }}
              >
              </div>
            )}
            <CardHeader 
              className="text-center pt-1 pb-2 relative z-10" 
              style={{ 
                position: 'absolute',
                bottom: `${article.textPosition || 4}%`,
                left: '50%',
                transform: 'translateX(-50%)',
                width: '100%'
              }}
            >
              <CardTitle className="text-[24px] font-bold mb-0 font-cookie-run" style={{ color: article.cardTitleColor || article.titleColor || '#ffffff' }}>
                {article.cardTitle || article.title}
              </CardTitle>
              <div 
                className="leading-relaxed whitespace-pre-line break-words" 
                style={{ fontSize: '14px', color: article.cardDescriptionColor || article.summaryColor || '#ffffff' }}
                dangerouslySetInnerHTML={{ 
                  __html: (article.cardDescription || article.summary).replace(/\n/g, '<br>') 
                }}
              />
            </CardHeader>
          </Card>
        </Link>
      ))}
      
      {/* 더 많은 데이터 로딩 중 - UI 표시 없음 */}
      {loadingMore && null}
      
    </>
  );
}
