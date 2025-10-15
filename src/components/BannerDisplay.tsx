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
  currentPage: 'gallery' | 'story' | 'store';
}

const BannerDisplay: React.FC<BannerDisplayProps> = ({ currentPage }) => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);

  // 페이지명 매핑
  const pageMapping: { [key: string]: string[] } = {
    'store': ['스토어', 'store'],
    'gallery': ['갤러리', 'gallery'],
    'story': ['이야기', 'story']
  };

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        console.log('배너 불러오기 시작:', currentPage);
        const bannersRef = collection(db, 'banners');
        // 인덱스 문제를 피하기 위해 단순한 쿼리 사용
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
            minHeight: '200px',
            height: 'auto'
          }}
        >
          {/* 배경 이미지 또는 색상 */}
          {banner.thumbnail && (
            <img
              src={banner.thumbnail}
              alt={banner.title}
              className="w-full h-auto object-contain"
            />
          )}
          
          {/* 배너 내용 */}
          <div
            className="p-6 flex flex-col justify-center items-start text-left"
            style={{
              marginTop: `${banner.textPosition}%`
            }}
          >
            <h3 
              className="text-lg font-bold mb-2"
              style={{ color: banner.titleColor || '#1f2937' }}
            >
              {banner.title}
            </h3>
            {banner.description && (
              <p 
                className="opacity-90"
                style={{ color: banner.descriptionColor || '#6b7280', whiteSpace: 'pre-line', fontSize: '15px' }}
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
