"use client";

import { useEffect } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

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

    // PWA 설치 감지 및 추적
    const trackPWAInstall = async (eventType: string, details?: any) => {
      try {
        await addDoc(collection(db, 'pwaInstalls'), {
          eventType, // 'install_prompt', 'install_complete', 'install_deferred'
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          language: navigator.language,
          timestamp: serverTimestamp(),
          details: details || {}
        });
        console.log('📊 PWA 설치 이벤트 추적:', eventType);
      } catch (error) {
        // 권한 오류인 경우 조용히 무시 (개발 중에는 로그 출력)
        if (error instanceof Error && error.message.includes('permissions')) {
          console.log('PWA 설치 추적 권한 없음 (개발 중):', eventType);
        } else {
          console.warn('PWA 설치 추적 실패:', error);
        }
      }
    };

    // PWA 설치 프롬프트 감지
    let deferredPrompt: any = null;
    
    window.addEventListener('beforeinstallprompt', (e) => {
      console.log('📱 PWA 설치 프롬프트 표시됨');
      e.preventDefault();
      deferredPrompt = e;
      
      // 설치 프롬프트 표시 이벤트 추적
      trackPWAInstall('install_prompt', {
        canInstall: true,
        userAgent: navigator.userAgent
      });
    });

    // PWA 설치 완료 감지
    window.addEventListener('appinstalled', (e) => {
      console.log('✅ PWA 설치 완료');
      deferredPrompt = null;
      
      // 설치 완료 이벤트 추적
      trackPWAInstall('install_complete', {
        installed: true,
        userAgent: navigator.userAgent
      });
    });

    // PWA가 이미 설치되어 있는지 확인
    if (window.matchMedia('(display-mode: standalone)').matches) {
      console.log('📱 PWA가 이미 설치되어 있음');
      trackPWAInstall('already_installed', {
        displayMode: 'standalone',
        userAgent: navigator.userAgent
      });
    }

    // PWA 설치 상태 변경 감지
    window.matchMedia('(display-mode: standalone)').addEventListener('change', (e) => {
      if (e.matches) {
        console.log('📱 PWA 설치됨 (display-mode 변경)');
        trackPWAInstall('install_detected', {
          displayMode: 'standalone',
          userAgent: navigator.userAgent
        });
      }
    });

  }, []);

  return null;
}
