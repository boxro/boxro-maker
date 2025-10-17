// PWA Service Worker - 자동 버전 관리 + 업데이트 알림 + 강제 새로고침
const CACHE_NAME = 'boxro-maker-v' + Date.now(); // 자동 버전 관리
const OLD_CACHE_NAMES = ['boxro-maker-v', 'boxro-maker', 'boxro-cache']; // 이전 캐시 이름들
const urlsToCache = [
  '/',
  '/draw',
  '/manifest.json',
  // CookieRun 폰트 캐시
  'https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_2001@1.1/CookieRun-Regular.woff',
  'https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_twelve@1.0/CookieRunOTF-Bold00.woff',
  'https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_twelve@1.0/CookieRunOTF-Black00.woff'
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
          // 이전 캐시 이름들과 현재 캐시가 아닌 모든 캐시 삭제
          if (OLD_CACHE_NAMES.includes(cacheName) || cacheName !== CACHE_NAME) {
            console.log('🗑️ 이전 캐시 삭제:', cacheName);
            return caches.delete(cacheName);
          }
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
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // 네트워크 응답이 유효하면 캐시에 저장하고 반환
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // 네트워크 실패 시 캐시에서 찾아서 반환
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // 캐시에도 없으면 오프라인 페이지 반환 (필요시)
          if (event.request.destination === 'document') {
            return caches.match('/');
          }
          return new Response(null, { status: 404 });
        });
      })
  );
});