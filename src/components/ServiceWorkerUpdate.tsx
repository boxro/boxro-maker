"use client";

import { useState, useEffect } from 'react';
import { X } from 'lucide-react'; // X icon for dismiss

export default function ServiceWorkerUpdate() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

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

  const handleDismiss = () => {
    setUpdateAvailable(false);
  };

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
    <div className="fixed top-4 left-4 right-4 z-50 md:left-1/2 md:right-auto md:transform md:-translate-x-1/2 md:max-w-md">
      <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200 p-6 relative">
        {/* X 버튼 - 오른쪽 위 */}
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 text-2xl font-bold flex-shrink-0"
        >
          ×
        </button>
        
        <div className="text-center pr-8">
          <h3 className="text-base font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-1">
            새로운 박스로가 도착했어요!
          </h3>
          <p className="text-gray-600 text-sm">
            잠시 후 자동으로 새로고침됩니다….
          </p>
        </div>
      </div>
    </div>
  );
}
