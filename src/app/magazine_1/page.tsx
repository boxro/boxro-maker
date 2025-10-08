"use client";

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Home, Plus, Menu } from 'lucide-react';
import CommonHeader from '@/components/CommonHeader';
import CommonBackground from '@/components/CommonBackground';
import PageHeader from '@/components/PageHeader';

// Dynamically import the component to ensure it's only rendered on the client
const MagazinePageClient = dynamic(() => import('./MagazinePageClient').then(mod => ({ default: mod.default })), {
  ssr: false,
      loading: () => (
        <CommonBackground className="py-16">
          <CommonHeader />
          <div className="max-w-7xl mx-auto px-4 md:px-8">
            <div className="mb-8">
              <PageHeader 
                title="박스카 이야기"
                description="자동차 디자인과 창작의 모든 것을 만나보세요"
              />
            </div>
            <div className="text-center">
              <p className="text-white">박스카 이야기를 불러오는 중...</p>
            </div>
          </div>
        </CommonBackground>
      ),
});

export default function MagazinePage() {
  return <MagazinePageClient />;
}