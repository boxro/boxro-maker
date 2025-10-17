"use client";

import { useState, useEffect } from 'react';

export default function ServiceWorkerUpdate() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  // 테스트용: 3초 후 모달 강제 표시
  useEffect(() => {
    const testTimer = setTimeout(() => {
      setUpdateAvailable(true);
    }, 3000);
    
    return () => clearTimeout(testTimer);
  }, []);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((reg) => {
        setRegistration(reg);
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setUpdateAvailable(true);
              }
            });
          }
        });
      });
    }
  }, []);


  // 자동 새로고침 로직
  useEffect(() => {
    if (updateAvailable) {
      const timer = setTimeout(() => {
        if (registration && registration.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
          window.location.reload();
        }
      }, 2000); // 2초 후 자동 새로고침

      return () => clearTimeout(timer);
    }
  }, [updateAvailable, registration]);

  if (!updateAvailable) return null;

  return (
    <div className="fixed top-4 left-1/2 right-auto z-50 transform -translate-x-1/2 w-64 max-w-64">
      <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200 px-6 py-3">
        <div className="text-center">
          <h3 className="text-base font-semibold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-0">
            새로운 업데이트가 있어요!
          </h3>
          <p className="text-gray-600 text-sm">
            잠시 후 자동으로 새로고침됩니다.
          </p>
        </div>
      </div>
    </div>
  );
}
