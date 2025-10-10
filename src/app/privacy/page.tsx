"use client";

import React, { useState, useEffect } from 'react';
import CommonBackground from '@/components/CommonBackground';
import CommonHeader from '@/components/CommonHeader';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Shield, Calendar, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface TermsVersion {
  id: string;
  type: 'service' | 'privacy';
  version: string;
  content: string;
  isActive: boolean;
  createdAt: any;
  updatedAt: any;
  title?: string;
  summary?: string;
  effectiveDate?: string;
}

export default function PrivacyPage() {
  const [privacy, setPrivacy] = useState<TermsVersion | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivePrivacy();
  }, []);

  const fetchActivePrivacy = async () => {
    try {
      setLoading(true);
      console.log('개인정보처리방침 데이터 불러오기 시작...');

      // 활성화된 개인정보처리방침 가져오기 (클라이언트 필터링)
      const allTermsQuery = query(collection(db, 'termsVersions'));
      const allTermsSnapshot = await getDocs(allTermsQuery);
      
      // 클라이언트에서 필터링
      const allPrivacyTerms = allTermsSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter((term: any) => term.type === 'privacy');
      
      console.log('모든 개인정보처리방침:', allPrivacyTerms);
      
      // 활성화된 개인정보처리방침 찾기
      const activePrivacyTerms = allPrivacyTerms.filter((term: any) => term.isActive === true);
      console.log('필터링된 활성 개인정보처리방침:', activePrivacyTerms);
      
      if (activePrivacyTerms.length > 0) {
        const privacy = activePrivacyTerms[0];
        console.log('개인정보처리방침 데이터:', privacy);
        console.log('개인정보처리방침 내용:', privacy.content);
        setPrivacy(privacy);
        console.log('개인정보처리방침 로드 완료:', privacy.version);
      } else {
        console.log('활성화된 개인정보처리방침이 없습니다.');
        // 활성화된 것이 없으면 null로 설정 (표시하지 않음)
        setPrivacy(null);
      }
    } catch (error) {
      console.error('개인정보처리방침 불러오기 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <CommonBackground>
        <CommonHeader />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-white">개인정보처리방침을 불러오는 중...</p>
          </div>
        </div>
      </CommonBackground>
    );
  }

  if (!privacy) {
    return (
      <CommonBackground>
        <CommonHeader />
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="bg-white/95 backdrop-blur-sm border border-white/20 rounded-lg p-8 text-center">
            <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-4">개인정보처리방침</h1>
            <p className="text-gray-600 mb-6">현재 개인정보처리방침이 등록되지 않았습니다.</p>
          </div>
        </div>
      </CommonBackground>
    );
  }

  return (
    <CommonBackground>
      <CommonHeader />
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white/95 backdrop-blur-sm border border-white/20 rounded-lg px-6 md:px-12 py-4 md:py-8">
          {/* 헤더 */}
          <div className="flex items-center justify-end mb-8">
          </div>

          {/* 제목 */}
          <div className="mb-10">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3" style={{fontFamily: 'CookieRun, sans-serif'}}>
              <Shield className="w-8 h-8 text-blue-600" />
              {privacy.title || '개인정보처리방침'}
            </h1>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span>버전 {privacy.version}</span>
            </div>
          </div>

          {/* 개인정보처리방침 내용 */}
          <div className="max-w-none">
            <style dangerouslySetInnerHTML={{
              __html: `
                .privacy-content * {
                  line-height: 1.1 !important;
                  font-size: 14px !important;
                  font-family: Inter, sans-serif !important;
                }
                .privacy-content p {
                  margin: 0 0 1em 0 !important;
                  line-height: 1.1 !important;
                }
                .privacy-content h1, .privacy-content h2, .privacy-content h3 {
                  line-height: 1.1 !important;
                  font-family: Inter, sans-serif !important;
                }
                .privacy-content ul {
                  list-style-type: disc !important;
                  margin: 0 0 1em 0 !important;
                  padding-left: 20px !important;
                  line-height: 1.1 !important;
                }
                .privacy-content ol {
                  list-style-type: decimal !important;
                  margin: 0 0 1em 0 !important;
                  padding-left: 20px !important;
                  line-height: 1.1 !important;
                }
                .privacy-content li {
                  line-height: 1.1 !important;
                  margin: 0.25em 0 !important;
                }
              `
            }} />
            <div 
              className="text-gray-800 privacy-content"
              dangerouslySetInnerHTML={{ 
                __html: privacy.content || '개인정보처리방침 내용이 등록되지 않았습니다.' 
              }}
            />
          </div>

          {/* 푸터 */}
          <div className="mt-12 pt-8 border-t border-gray-200">
            <div className="text-center text-gray-600" style={{fontSize: '13px'}}>
              <p>본 개인정보처리방침은 {privacy.effectiveDate ? new Date(privacy.effectiveDate).toLocaleDateString('ko-KR') : (privacy.createdAt ? new Date(privacy.createdAt.seconds ? privacy.createdAt.seconds * 1000 : privacy.createdAt).toLocaleDateString('ko-KR') : '정보 없음')}부터 시행됩니다.</p>
              <p className="mt-2">
                문의사항이 있으시면{' '}
                <a href="mailto:boxro.crafts@gmail.com" className="text-blue-600 hover:text-blue-700">
                  boxro.crafts@gmail.com
                </a>
                으로 연락해주세요.
              </p>
            </div>
          </div>
        </div>
      </div>
    </CommonBackground>
  );
}
