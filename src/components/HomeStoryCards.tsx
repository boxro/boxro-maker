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
  url?: string;
  titleColor?: string;
  descriptionColor?: string;
  textPosition?: number;
  backgroundColor?: string;
  homeCardBackgroundColor?: string;
  homeOrder?: number;
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
      setHomeCards([]); // 최초 로딩 시에는 빈 배열로 시작
      setHasMore(true);
      
      // 홈카드 데이터 캐싱 확인
      const cachedHomeCards = sessionStorage.getItem('homeCards');
      const lastHomeCardsUpdate = sessionStorage.getItem('lastHomeCardsUpdate');
      const homeCardsCacheInvalidated = sessionStorage.getItem('homeCardsCacheInvalidated');
      const now = Date.now();
      
      // 캐시 무효화 플래그 확인
      if (homeCardsCacheInvalidated) {
        console.log('홈카드 캐시 무효화됨, 서버에서 새로 가져오기');
        sessionStorage.removeItem('homeCardsCacheInvalidated');
      }
      
      // 캐시 무효화 플래그가 있거나 캐시가 없으면 서버에서 새로 가져오기
      if (homeCardsCacheInvalidated || !cachedHomeCards || !lastHomeCardsUpdate) {
        console.log('홈카드 캐시 무효화됨 또는 캐시 없음, 서버에서 새로 가져오기');
        // 캐시 무효화 플래그 삭제
        if (homeCardsCacheInvalidated) {
          sessionStorage.removeItem('homeCardsCacheInvalidated');
        }
      } else if (cachedHomeCards && lastHomeCardsUpdate && (now - parseInt(lastHomeCardsUpdate)) < 600000) { // 10분 캐시
        const allHomeCards = JSON.parse(cachedHomeCards);
        // 캐시된 데이터 사용 (로깅 제거로 성능 향상)
        
        // 클라이언트에서 홈 표시 조건 필터링 및 중복 제거
        const filteredHomeCards = allHomeCards
          .filter(article => 
            article.showOnHome === true && 
            article.isPublished === true &&
            article.cardTitle && 
            article.cardTitle.trim() && 
            article.cardDescription && 
            article.cardDescription.trim()
          )
          .filter((article, index, self) => 
            // ID 기준으로 중복 제거
            index === self.findIndex(a => a.id === article.id)
          )
          .sort((a, b) => {
            const aOrder = a.homeOrder || 999999;
            const bOrder = b.homeOrder || 999999;
            return aOrder - bOrder;
          })
          .slice(0, 6);
        
        setHomeCards(filteredHomeCards);
        setLoading(false);
        return;
      }
      
      // 최초 로딩을 위한 단순화된 쿼리
      const homeCardsQuery = await getDocs(
        query(
          collection(db, 'homeCards'),
          where('showOnHome', '==', true),
          where('isPublished', '==', true),
          orderBy('homeOrder', 'asc'),
          limit(6)
        )
      );
      
      // 최소한의 데이터만 변환하여 성능 최적화
      const filteredHomeCards = homeCardsQuery.docs
        .map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            title: data.title,
            cardTitle: data.cardTitle,
            cardDescription: data.cardDescription,
            cardThumbnail: data.cardThumbnail,
            url: data.url,
            openInNewTab: data.openInNewTab,
            titleColor: data.titleColor,
            descriptionColor: data.descriptionColor,
            textPosition: data.textPosition,
            backgroundColor: data.backgroundColor,
            homeCardBackgroundColor: data.homeCardBackgroundColor,
            homeOrder: data.homeOrder,
            createdAt: data.createdAt?.toDate?.() || new Date(),
            source: 'homeCards'
          };
        })
        .filter(article => 
          // 필수 필드만 빠르게 체크
          article.cardTitle?.trim() && article.cardDescription?.trim()
        );
      
      // 홈카드 데이터를 세션 스토리지에 캐싱(필터/정렬된 결과 저장)
      sessionStorage.setItem('homeCards', JSON.stringify(filteredHomeCards));
      sessionStorage.setItem('lastHomeCardsUpdate', Date.now().toString());
      
      setHomeCards(filteredHomeCards);
      
      // 마지막 문서 저장
      if (homeCardsQuery.docs.length > 0) {
        setLastDoc(homeCardsQuery.docs[homeCardsQuery.docs.length - 1]);
      }
      
      // 더 이상 데이터가 없으면 hasMore를 false로 설정
      if (homeCardsQuery.docs.length < 6) {
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
        orderBy('homeOrder', 'asc'),
        orderBy('createdAt', 'desc'),
        startAfter(lastDoc),
        limit(6)
      );
      
      const articlesSnapshot = await getDocs(articlesQuery);
      const newArticles = articlesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as StoryArticle[];
      
      // 클라이언트에서 빈 제목/설명 필터링 및 중복 제거
      const newHomeCards = newArticles
        .filter(article =>
          article.cardTitle && article.cardTitle.trim() &&
          article.cardDescription && article.cardDescription.trim()
        )
        .filter((article, index, self) => 
          // ID 기준으로 중복 제거
          index === self.findIndex(a => a.id === article.id)
        );
      
      setHomeCards(prev => {
        // 기존 카드와 새 카드 간의 중복 제거
        const existingIds = new Set(prev.map(card => card.id));
        const uniqueNewCards = newHomeCards.filter(card => !existingIds.has(card.id));
        return [...prev, ...uniqueNewCards];
      });
      
      // 마지막 문서 업데이트
      if (articlesSnapshot.docs.length > 0) {
        setLastDoc(articlesSnapshot.docs[articlesSnapshot.docs.length - 1]);
      }
      
      // 더 이상 데이터가 없으면 hasMore를 false로 설정
      if (articlesSnapshot.docs.length < 6) {
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
    // 빠른 스켈레톤 로더 (3개만 표시)
    return (
      <>
        {Array.from({ length: 3 }).map((_, index) => (
          <Card key={`skeleton-${index}`} className="border-0 border-purple-300/50 shadow-2xl relative overflow-hidden bg-transparent min-h-[480px] flex flex-col justify-end">
            <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse" />
            <div className="text-center pt-1 pb-2 relative z-10 absolute bottom-4 left-1/2 transform -translate-x-1/2 w-full">
              <div className="h-6 bg-gray-300 rounded animate-pulse mb-2 mx-4" />
              <div className="h-4 bg-gray-300 rounded animate-pulse mx-4" />
            </div>
          </Card>
        ))}
      </>
    );
  }

  if (homeCards.length === 0) {
    return null; // 홈 카드가 없으면 아무것도 표시하지 않음
  }

  return (
    <>
      {homeCards.map((article, index) => {
        // 링크가 있는 경우에만 Link 컴포넌트 사용, 없으면 div로 렌더링
        const hasLink = article.url && article.url.trim();
        
        const cardContent = (
          <Card className={`group transition-all duration-300 border-0 border-purple-300/50 shadow-2xl relative overflow-hidden bg-transparent min-h-[480px] flex flex-col justify-end hover:shadow-xl ${hasLink ? 'cursor-pointer' : ''}`}>
            {/* 배경 이미지 */}
            {article.cardThumbnail ? (
              <div className="absolute inset-0 overflow-hidden">
                <Image
                  src={article.cardThumbnail}
                  alt={article.cardTitle || article.title}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                  loading="eager"
                  priority={index < 3}
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  quality={85}
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
        );

        if (hasLink) {
          return (
            <Link 
              key={article.id} 
              href={article.url} 
              className="block w-full"
              target={article.openInNewTab ? '_blank' : undefined}
              rel={article.openInNewTab ? 'noopener noreferrer' : undefined}
            >
              {cardContent}
            </Link>
          );
        } else {
          return (
            <div key={article.id} className="block w-full">
              {cardContent}
            </div>
          );
        }
      })}
      
      {/* 더 많은 데이터 로딩 중 - UI 표시 없음 */}
      {loadingMore && null}
      
    </>
  );
}