"use client";

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import CommonHeader from '@/components/CommonHeader';
import PageHeader from '@/components/PageHeader';

// Dynamically import the component to ensure it's only rendered on the client
const MagazinePageClient = dynamic(() => import('./MagazinePageClient'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen py-16" style={{background: 'linear-gradient(100deg, #2563eb, #7c3aed, #ec4899)'}}>
      <CommonHeader />
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="mb-6 mt-10">
          <PageHeader 
            title="매거진"
            description="자동차 디자인과 창작의 모든 것을 만나보세요"
          />
        </div>
        <div className="text-center">
          <p className="text-white">매거진을 불러오는 중...</p>
        </div>
      </div>
    </div>
  ),
});

export default function MagazinePage() {
  return <MagazinePageClient />;
}