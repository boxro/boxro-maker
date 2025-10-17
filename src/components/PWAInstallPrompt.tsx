"use client";

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import Image from 'next/image';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  // PWA 설치 프롬프트 표시 제어
  const shouldShowPrompt = () => {
    if (typeof window === 'undefined') return false;
    
    // 거부한 경우 1시간간 다시 보지 않음
    const dismissedAt = localStorage.getItem('pwa-prompt-dismissed');
    if (dismissedAt) {
      const dismissedTime = parseInt(dismissedAt);
      const now = Date.now();
      const hoursSinceDismissed = (now - dismissedTime) / (1000 * 60 * 60);
      
      if (hoursSinceDismissed < 1) {
        console.log('🚫 PWA 프롬프트 숨김: 사용자가 최근에 거부함');
        return false;
      }
    }
    
    return true;
  };

  useEffect(() => {
    // Check if we're on the client side
    if (typeof window === 'undefined') return;

    // 카카오톡 인앱 브라우저 감지 - PWA 비활성화
    const isKakaoInApp = /KAKAOTALK/i.test(navigator.userAgent);
    if (isKakaoInApp) {
      console.log('🚫 PWA Install Prompt 비활성화: 카카오톡 인앱 브라우저');
      return;
    }

    // Check if app is already installed
    if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // 이미 거부한 경우 프롬프트 표시하지 않음
    if (!shouldShowPrompt()) {
      return;
    }

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowInstallPrompt(true);
    };

    // Listen for the appinstalled event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
      }
      
      setDeferredPrompt(null);
      setShowInstallPrompt(false);
    } catch (error) {
      console.error('Error during installation:', error);
    }
  };

  const handleDismiss = () => {
    // 거부 시간을 로컬 스토리지에 저장 (1시간간 다시 보지 않음)
    localStorage.setItem('pwa-prompt-dismissed', Date.now().toString());
    
    setShowInstallPrompt(false);
    setDeferredPrompt(null);
  };

  // 카카오톡 인앱 브라우저에서는 PWA Install Prompt 표시하지 않음
  const isKakaoInApp = typeof window !== 'undefined' && /KAKAOTALK/i.test(navigator.userAgent);
  
  // Don't show if already installed or no prompt available or in KakaoTalk in-app browser
  if (isInstalled || !showInstallPrompt || !deferredPrompt || isKakaoInApp) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-xs md:w-64">
      <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200 px-4 py-4 relative">
        {/* X 버튼 - 오른쪽 위 */}
        <div className="absolute top-2 right-4 z-10">
          <button
            onClick={handleDismiss}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold flex-shrink-0"
          >
            ×
          </button>
        </div>
        
        <div className="text-center">
          <div className="flex justify-center mb-2">
            <div className="w-12 h-12 rounded-xl overflow-hidden">
              <Image
                src="/icons/icon-192x192.png"
                alt="박스로 앱 아이콘"
                width={48}
                height={48}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
          
          <h3 className="text-base font-semibold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-0">
            앱으로 설치하기
          </h3>
          <p className="text-gray-600 text-sm mb-2">
            홈 화면에 추가하고 바로 실행하세요!
          </p>
          
          {/* 설치 버튼 - 전체 너비 */}
          <button
            onClick={handleInstallClick}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white py-2 px-4 rounded-full font-medium transition-all duration-200 text-sm"
          >
            설치하기
          </button>
        </div>
      </div>
    </div>
  );
}