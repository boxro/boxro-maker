"use client";

import { useEffect } from 'react';

export default function ConditionalPWA() {
  useEffect(() => {
    // 모든 주요 인앱 브라우저 감지
    const isInAppBrowser = /KAKAOTALK|NAVER|LINE|FBAN|FBAV|Instagram|WeChat|QQ|SamsungBrowser|wv/i.test(navigator.userAgent);
    
    if (isInAppBrowser) {
      // 인앱 브라우저에서는 모든 Service Worker 제거
      console.log('🚫 인앱 브라우저 감지 - PWA 완전 비활성화');
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          registrations.forEach((registration) => {
            registration.unregister();
          });
        });
      }
      if ('caches' in window) {
        caches.keys().then((cacheNames) => {
          cacheNames.forEach((cacheName) => {
            caches.delete(cacheName);
          });
        });
      }
    } else if ('serviceWorker' in navigator) {
      // 일반 브라우저에서만 PWA 활성화
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('✅ PWA Service Worker 등록 성공:', registration);
          
          // 업데이트 확인
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  console.log('🔄 새로운 버전 사용 가능');
                }
              });
            }
          });
        })
        .catch((error) => {
          console.log('❌ PWA Service Worker 등록 실패:', error);
        });
    }
  }, []);

  return null;
}
