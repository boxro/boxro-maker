"use client";

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import CommonHeader from '@/components/CommonHeader';
import PageHeader from '@/components/PageHeader';

// Dynamically import the component to ensure it's only rendered on the client
const StoryPageClient = dynamic(() => import('./StoryPageClient'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen py-16" style={{background: 'linear-gradient(130deg, #2563eb, #7c3aed, #ec4899)'}}>
      <CommonHeader />
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="mb-6 mt-10">
          <PageHeader 
            title="박스카 이야기"
            description="박스로와 함께하는 박스카 놀이와 창작 이야기!"
          />
        </div>
        <div className="bg-white border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden py-5 w-full rounded-2xl">
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto relative mb-4">
              <div className="absolute inset-0 rounded-full border-3 border-purple-200"></div>
              <div className="absolute inset-0 rounded-full border-3 border-transparent border-t-purple-500 border-r-pink-500 animate-spin"></div>
              <div className="absolute inset-1.5 rounded-full border-2 border-transparent border-t-blue-400 border-r-purple-400 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
            </div>
            <h3 className="text-lg font-semibold text-black mb-2">박스카 이야기를 불러오는 중...</h3>
            <p className="text-sm text-black">잠시만 기다려주세요.</p>
          </div>
        </div>
      </div>
    </div>
  ),
});

export default function StoryPage() {
  return <StoryPageClient />;
}