"use client";

import { useEffect } from 'react';

export default function ConditionalPWA() {
  useEffect(() => {
    // 카카오톡 인앱 브라우저 감지
    const isKakaoInApp = /KAKAOTALK/i.test(navigator.userAgent);
    
    // 일반 브라우저에서만 PWA 활성화
    if (!isKakaoInApp && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('✅ PWA Service Worker 등록 성공:', registration);
        })
        .catch((error) => {
          console.log('❌ PWA Service Worker 등록 실패:', error);
        });
    } else {
      console.log('🚫 PWA 비활성화:', isKakaoInApp ? '카카오톡 인앱 브라우저' : 'Service Worker 미지원');
    }
  }, []);

  return null;
}
