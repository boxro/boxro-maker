"use client";

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import CommonHeader from '@/components/CommonHeader';
import CommonBackground from '@/components/CommonBackground';
import PageHeader from '@/components/PageHeader';

// Dynamically import the component to ensure it's only rendered on the client
const StoryPageClient = dynamic(() => import('./StoryPageClient'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen py-[52px] md:py-[68px]" style={{background: 'linear-gradient(130deg, #2563eb, #7c3aed, #ec4899)', backgroundAttachment: 'fixed'}}>
      <CommonHeader />
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="mt-10 px-0 md:px-0">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <PageHeader 
                title="박스카 이야기"
                description="박스로와 함께하는 박스카 놀이와 창작 이야기!"
              />
            </div>
            <div className="hidden sm:flex gap-3">
              {/* 관리자 버튼 공간 예약 */}
            </div>
          </div>
        </div>
        <div className="bg-white border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden py-5 w-full rounded-2xl">
          <div className="text-center py-12">
            {/* 로고 점프 애니메이션 */}
            <div className="w-24 h-24 mx-auto mb-6 flex items-center justify-center">
              <img 
                src="/logo_remoteonly.png" 
                alt="박스로 로고" 
                className="w-20 h-20 animate-bounce"
                style={{ 
                  animationDuration: '0.6s',
                  animationIterationCount: 'infinite',
                  animationTimingFunction: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)'
                }}
              />
            </div>
            <h3 className="text-lg font-semibold bg-gradient-to-r from-blue-600 to-pink-600 bg-clip-text text-transparent mb-2">
              박스카 이야기를 불러오는 중...
            </h3>
            <p className="text-sm text-gray-800">재미있는 박스카 이야기들을 준비하고 있어요!</p>
          </div>
        </div>
      </div>
    </div>
  ),
});

export default function StoryPage() {
  return <StoryPageClient />;
}