// Service Worker 완전 비활성화
// 이 파일은 Service Worker를 완전히 비활성화하기 위해 생성됩니다.

// 모든 이벤트 리스너 제거
self.addEventListener('install', (event) => {
  // 즉시 활성화
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // 모든 클라이언트에 즉시 적용
  event.waitUntil(
    self.clients.claim().then(() => {
      // Service Worker 등록 해제
      return self.registration.unregister();
    })
  );
});

// 모든 fetch 이벤트를 원래대로 전달 (가로채지 않음)
self.addEventListener('fetch', (event) => {
  // 아무것도 하지 않음 - 원래 네트워크 요청 그대로 전달
});