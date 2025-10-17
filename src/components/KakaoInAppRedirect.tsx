"use client";

import { useEffect } from 'react';

export default function KakaoInAppRedirect() {
  useEffect(() => {
    // 카카오톡 인앱 브라우저 감지
    if (/kakaotalk/gi.test(navigator.userAgent)) {
      const targetUrl = location.href;
      // 카카오톡 외부 브라우저로 리다이렉트
      location.href = "kakaotalk://web/openExternal?url=" + encodeURIComponent(targetUrl);
    }
  }, []);

  return null; // UI 렌더링 없음
}
