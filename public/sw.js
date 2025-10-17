// PWA Service Worker - 일반 브라우저용
const CACHE_NAME = 'boxro-maker-v1';
const urlsToCache = [
  '/',
  '/draw',
  '/manifest.json'
];

// 설치 이벤트
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('✅ PWA 캐시 열림');
        // 기본 페이지만 캐시 (홈페이지, Draw 페이지, Manifest)
        return cache.addAll(['/', '/draw', '/manifest.json']).catch((error) => {
          console.warn('기본 캐시 실패:', error);
        });
      })
      .catch((error) => {
        console.warn('캐시 초기화 실패:', error);
      })
  );
});

// 활성화 이벤트
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ 이전 캐시 삭제:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// fetch 이벤트 - 캐시 우선, 네트워크 폴백
self.addEventListener('fetch', (event) => {
  // GET 요청만 처리
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // 캐시에 있으면 캐시에서 반환
        if (response) {
          return response;
        }
        // 캐시에 없으면 네트워크에서 가져오기
        return fetch(event.request).catch(() => {
          // 네트워크 실패 시 오프라인 페이지 반환
          if (event.request.destination === 'document') {
            return caches.match('/');
          }
        });
      })
  );
});