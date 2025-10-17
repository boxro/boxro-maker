// PWA Service Worker - 자동 버전 관리 + 업데이트 알림 + 강제 새로고침
const CACHE_NAME = 'boxro-maker-v' + Date.now(); // 자동 버전 관리
const urlsToCache = [
  '/',
  '/draw',
  '/manifest.json'
];

// 설치 이벤트 - 강제 업데이트
self.addEventListener('install', (event) => {
  console.log('🔄 Service Worker 설치 중...');
  self.skipWaiting(); // 즉시 활성화
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('✅ PWA 캐시 열림:', CACHE_NAME);
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.warn('캐시 초기화 실패:', error);
      })
  );
});

// 활성화 이벤트 - 모든 캐시 삭제 후 새로고침
self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker 활성화됨');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          console.log('🗑️ 이전 캐시 삭제:', cacheName);
          return caches.delete(cacheName);
        })
      );
    }).then(() => {
      // 모든 클라이언트에게 새로고침 요청
      return self.clients.claim();
    })
  );
});

// 메시지 이벤트 - 업데이트 알림
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// fetch 이벤트 - 네트워크 우선, 캐시 폴백
self.addEventListener('fetch', (event) => {
  // GET 요청만 처리
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // 네트워크 응답이 있으면 캐시에 저장
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // 네트워크 실패시 캐시에서 반환
        return caches.match(event.request).then((response) => {
          if (response) {
            return response;
          }
          // 캐시에도 없으면 오프라인 페이지
          if (event.request.destination === 'document') {
            return caches.match('/');
          }
        });
      })
  );
});