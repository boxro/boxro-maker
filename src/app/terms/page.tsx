"use client";

import React, { useState, useEffect } from 'react';
import CommonBackground from '@/components/CommonBackground';
import CommonHeader from '@/components/CommonHeader';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { FileText, Calendar, ArrowLeft } from 'lucide-react';
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

export default function TermsPage() {
  const [terms, setTerms] = useState<TermsVersion | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActiveTerms();
  }, []);

  const fetchActiveTerms = async () => {
    try {
      setLoading(true);
      console.log('서비스이용약관 데이터 불러오기 시작...');
      console.log('현재 사용자 인증 상태 확인 필요');
      
      // Firestore 연결 테스트
      try {
        const testQuery = query(collection(db, 'termsVersions'));
        const testSnapshot = await getDocs(testQuery);
        console.log('Firestore 연결 테스트 - 전체 termsVersions:', testSnapshot.docs.length, '개');
        testSnapshot.docs.forEach(doc => {
          console.log('문서 ID:', doc.id, '데이터:', doc.data());
        });
      } catch (testError) {
        console.error('Firestore 연결 테스트 실패:', testError);
      }

      // 활성화된 서비스이용약관 가져오기 (인덱스 문제 해결을 위해 클라이언트 필터링)
      const allTermsQuery = query(collection(db, 'termsVersions'));
      const allTermsSnapshot = await getDocs(allTermsQuery);
      
      // 클라이언트에서 필터링
      const allServiceTerms = allTermsSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter((term: any) => term.type === 'service');
      
      console.log('모든 서비스이용약관:', allServiceTerms);
      allServiceTerms.forEach((term, index) => {
        console.log(`서비스이용약관 ${index + 1}:`, {
          id: term.id,
          version: term.version,
          isActive: term.isActive,
          type: term.type,
          content: term.content ? term.content.substring(0, 100) + '...' : '내용 없음'
        });
      });
      
      // 활성화된 서비스이용약관 찾기
      const activeServiceTerms = allServiceTerms.filter((term: any) => term.isActive === true);
      console.log('필터링된 활성 서비스이용약관:', activeServiceTerms);
      
      if (activeServiceTerms.length > 0) {
        const terms = activeServiceTerms[0];
        console.log('서비스이용약관 데이터:', terms);
        console.log('서비스이용약관 내용:', terms.content);
        setTerms(terms);
        console.log('서비스이용약관 로드 완료:', terms.version);
      } else {
        console.log('활성화된 서비스이용약관이 없습니다.');
        // 활성화된 것이 없으면 null로 설정 (표시하지 않음)
        setTerms(null);
      }
    } catch (error) {
      console.error('서비스이용약관 불러오기 실패:', error);
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
            <p className="text-white">서비스이용약관을 불러오는 중...</p>
          </div>
        </div>
      </CommonBackground>
    );
  }

  if (!terms) {
    return (
      <CommonBackground>
        <CommonHeader />
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="bg-white/95 backdrop-blur-sm border border-white/20 rounded-lg p-8">
            {/* 헤더 */}
          <div className="flex items-center justify-end mb-8">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="w-4 h-4" />
              <span>최종 수정일: -</span>
            </div>
          </div>

            {/* 제목 */}
            <div className="mb-8">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3" style={{fontFamily: 'CookieRun, sans-serif'}}>
                <FileText className="w-8 h-8 text-blue-600" />
                서비스이용약관
              </h1>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span>버전 -</span>
                <span>•</span>
                <span>시행일: -</span>
              </div>
            </div>

            {/* 서비스이용약관 내용 */}
            <div className="prose max-w-none">
              <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
                서비스이용약관 내용이 등록되지 않았습니다.
              </div>
            </div>
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
              <FileText className="w-8 h-8 text-blue-600" />
              {terms.title || '서비스이용약관'}
            </h1>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span>버전 {terms.version}</span>
            </div>
          </div>


          {/* 서비스이용약관 내용 */}
          <div className="max-w-none">
            <style dangerouslySetInnerHTML={{
              __html: `
                .terms-content * {
                  line-height: 1.1 !important;
                  font-size: 14px !important;
                  font-family: Inter, sans-serif !important;
                }
                .terms-content p {
                  margin: 0 0 1em 0 !important;
                  line-height: 1.1 !important;
                }
                .terms-content h1, .terms-content h2, .terms-content h3 {
                  line-height: 1.1 !important;
                  font-family: Inter, sans-serif !important;
                }
                .terms-content ul {
                  list-style-type: disc !important;
                  margin: 0 0 1em 0 !important;
                  padding-left: 20px !important;
                  line-height: 1.1 !important;
                }
                .terms-content ol {
                  list-style-type: decimal !important;
                  margin: 0 0 1em 0 !important;
                  padding-left: 20px !important;
                  line-height: 1.1 !important;
                }
                .terms-content li {
                  line-height: 1.1 !important;
                  margin: 0.25em 0 !important;
                }
              `
            }} />
            <div 
              className="text-gray-800 terms-content"
              dangerouslySetInnerHTML={{ 
                __html: terms.content || '서비스이용약관 내용이 등록되지 않았습니다.' 
              }}
            />
          </div>

          {/* 푸터 */}
          <div className="mt-12 pt-8 border-t border-gray-200">
            <div className="text-center text-gray-600" style={{fontSize: '13px'}}>
              <p>본 서비스이용약관은 {terms.effectiveDate ? new Date(terms.effectiveDate).toLocaleDateString('ko-KR') : (terms.createdAt ? new Date(terms.createdAt.seconds ? terms.createdAt.seconds * 1000 : terms.createdAt).toLocaleDateString('ko-KR') : '정보 없음')}부터 시행됩니다.</p>
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