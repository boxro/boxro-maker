'use client';

import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-red-900/20 via-orange-900/20 to-yellow-900/20 backdrop-blur-md z-50 flex items-center justify-center">
      <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-6 max-w-sm w-full mx-6">
        <div className="text-center">
          <div className="text-2xl mb-4">⚠️</div>
          <h3 className="text-[18px] font-semibold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent mb-2">
            페이지를 찾을 수 없습니다
          </h3>
          <p className="text-gray-900 mb-4" style={{fontSize: '14px'}}>
            요청하신 페이지가 존재하지 않거나 이동되었을 수 있습니다.
          </p>
          <div className="flex gap-3">
            <Button
              onClick={() => window.history.back()}
              className="flex-1 bg-white/80 backdrop-blur-sm border-2 border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 rounded-full text-gray-900"
              style={{fontSize: '14px'}}
            >
              이전 페이지
            </Button>
            <Button
              onClick={() => window.location.href = '/'}
              className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white transition-all duration-200 rounded-full"
              style={{fontSize: '14px'}}
            >
              홈으로 이동
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
