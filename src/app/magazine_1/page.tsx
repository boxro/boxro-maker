"use client";

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Home, Plus, Menu } from 'lucide-react';
import CommonHeader from '@/components/CommonHeader';
import PageHeader from '@/components/PageHeader';

// Dynamically import the component to ensure it's only rendered on the client
const MagazinePageClient = dynamic(() => import('./MagazinePageClient').then(mod => ({ default: mod.default })), {
  ssr: false,
      loading: () => (
        <div className="min-h-screen" style={{background: 'linear-gradient(92deg, #2563eb, #7c3aed, #ec4899)'}}>
          {/* Common Header */}
          <CommonHeader />

          {/* Main Content */}
          <div>
            <div className="max-w-7xl mx-auto px-4 md:px-8">
              <div className="mb-8">
                <h1 className="text-[24px] font-bold text-white mb-2 font-cookie-run">매거진</h1>
                <p className="text-[14px] text-white/80">자동차 디자인과 창작의 모든 것을 만나보세요</p>
              </div>
              <div className="text-center">
                <p className="text-white">매거진을 불러오는 중...</p>
              </div>
            </div>
          </div>
        </div>
      ),
});

export default function MagazinePage() {
  return <MagazinePageClient />;
}