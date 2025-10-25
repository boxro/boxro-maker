"use client";

import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';

interface Banner {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  url: string;
  openInNewTab: boolean;
  backgroundColor: string;
  titleColor: string;
  descriptionColor: string;
  textPosition: number;
  targetPages: string[];
  isActive: boolean;
  order: number;
}

interface BannerDisplayProps {
  currentPage: 'gallery' | 'story' | 'store' | 'youtube';
}

const BannerDisplay: React.FC<BannerDisplayProps> = ({ currentPage }) => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);

  // 페이지명 매핑
  const pageMapping: { [key: string]: string[] } = {
    'store': ['스토어', 'store'],
    'gallery': ['갤러리', 'gallery'],
    'story': ['이야기', 'story'],
    'youtube': ['박스로 유튜브', 'youtube']
  };

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        // 배너 데이터 캐싱 확인 (관리자 페이지에서 수정된 경우 캐시 무시)
        const cachedBanners = sessionStorage.getItem('banners');
        const lastBannerUpdate = sessionStorage.getItem('lastBannerUpdate');
        const bannerCacheInvalidated = sessionStorage.getItem('bannerCacheInvalidated');
        const localStorageCacheInvalidated = localStorage.getItem('bannerCacheInvalidated');
        const now = Date.now();
        
        // 캐시 무효화 플래그가 있거나 캐시가 없으면 서버에서 새로 가져오기
        if (bannerCacheInvalidated || localStorageCacheInvalidated || !cachedBanners || !lastBannerUpdate) {
          console.log('캐시 무효화됨 또는 캐시 없음, 서버에서 새로 가져오기');
          // localStorage 캐시 무효화 플래그 삭제
          if (localStorageCacheInvalidated) {
            localStorage.removeItem('bannerCacheInvalidated');
          }
        } else if (cachedBanners && lastBannerUpdate && (now - parseInt(lastBannerUpdate)) < 60000) { // 5분 -> 1분으로 단축
          const bannersData = JSON.parse(cachedBanners);
          console.log('캐시된 배너 데이터 사용');
          
          // 클라이언트 사이드에서 필터링 및 정렬
          const validPages = pageMapping[currentPage] || [currentPage];
          const filteredBanners = bannersData.filter((banner: Banner) => {
            const isActive = banner.isActive === true;
            const hasTargetPages = banner.targetPages && Array.isArray(banner.targetPages);
            const includesCurrentPage = hasTargetPages && banner.targetPages.some(page => validPages.includes(page));
            return isActive && hasTargetPages && includesCurrentPage;
          });
          
          const sortedBanners = filteredBanners.sort((a, b) => (a.order || 0) - (b.order || 0));
          setBanners(sortedBanners);
          setLoading(false);
          return;
        }
        
        console.log('배너 불러오기 시작:', currentPage);
        const bannersRef = collection(db, 'banners');
        const q = query(bannersRef);
        
        const querySnapshot = await getDocs(q);
        console.log('Firestore 쿼리 결과:', querySnapshot.docs.length, '개 문서');
        
        const bannersData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Banner[];
        
        console.log('모든 배너 데이터:', bannersData);
        
        // 클라이언트 사이드에서 필터링 및 정렬
        const validPages = pageMapping[currentPage] || [currentPage];
        const filteredBanners = bannersData.filter(banner => {
          const isActive = banner.isActive === true;
          const hasTargetPages = banner.targetPages && Array.isArray(banner.targetPages);
          const includesCurrentPage = hasTargetPages && banner.targetPages.some(page => validPages.includes(page));
          
          console.log('배너 필터링:', {
            id: banner.id,
            title: banner.title,
            isActive,
            targetPages: banner.targetPages,
            targetPagesString: JSON.stringify(banner.targetPages),
            hasTargetPages,
            includesCurrentPage,
            currentPage,
            validPages,
            'banner.targetPages.some(page => validPages.includes(page))': banner.targetPages?.some(page => validPages.includes(page))
          });
          
          return isActive && hasTargetPages && includesCurrentPage;
        });
        
        const sortedBanners = filteredBanners.sort((a, b) => (a.order || 0) - (b.order || 0));
        console.log('최종 배너 데이터:', { currentPage, bannersData, filteredBanners, sortedBanners });
        
        // 배너 데이터를 세션 스토리지에 캐싱
        sessionStorage.setItem('banners', JSON.stringify(bannersData));
        sessionStorage.setItem('lastBannerUpdate', now.toString());
        // 캐시 무효화 플래그 삭제
        sessionStorage.removeItem('bannerCacheInvalidated');
        
        setBanners(sortedBanners);
      } catch (error) {
        console.error('배너 불러오기 실패:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBanners();
  }, [currentPage]);

  if (loading) {
    return null;
  }

  if (banners.length === 0) {
    return null;
  }

  return (
    <>
      {banners.map((banner) => (
        <div
          key={banner.id}
          className="group shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden w-full rounded-2xl relative cursor-pointer flex flex-col break-inside-avoid mb-3"
          style={{ 
            backgroundColor: banner.backgroundColor || '#3b82f6',
            minHeight: '100%'
          }}
        >
          {/* 배경 이미지 또는 색상 */}
          {banner.thumbnail && (
            <div className="w-full overflow-hidden">
              <img
                src={banner.thumbnail}
                alt={banner.title}
                className="w-full h-auto object-contain transition-transform duration-300 group-hover:scale-[1.03]"
              />
            </div>
          )}
          
          {/* 배너 내용 */}
          <div
            className="px-7 py-4 flex-1 flex flex-col justify-center items-start text-left"
            style={{
              marginTop: `${banner.textPosition}%`
            }}
          >
            <h3 
              className="text-lg font-bold mb-2"
              style={{ 
                color: banner.titleColor || '#1f2937',
                display: '-webkit-box',
                WebkitLineClamp: 1,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                lineHeight: '1.4',
                maxHeight: '1.4em'
              }}
            >
              {banner.title}
            </h3>
            {banner.description && (
              <p 
                className="opacity-90"
                style={{ color: banner.descriptionColor || '#6b7280', whiteSpace: 'pre-line', fontSize: '15px', lineHeight: '1.8' }}
              >
                {banner.description}
              </p>
            )}
          </div>
          
          {/* 클릭 이벤트 */}
          {banner.url && (
            <Link
              href={banner.url}
              target={banner.openInNewTab ? '_blank' : '_self'}
              rel={banner.openInNewTab ? 'noopener noreferrer' : undefined}
              className="absolute inset-0 z-10"
            />
          )}
        </div>
      ))}
    </>
  );
};

export default BannerDisplay;
