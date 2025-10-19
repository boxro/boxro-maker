"use client";

import { useEffect } from 'react';

export default function KakaoInAppRedirect() {
  useEffect(() => {
    const targetUrl = location.href;
    const userAgent = navigator.userAgent;
    
    // 카카오톡 인앱 브라우저 감지
    if (/kakaotalk/gi.test(userAgent)) {
      console.log('카카오톡 인앱 브라우저 감지 - 외부 브라우저로 리다이렉트');
      location.href = "kakaotalk://web/openExternal?url=" + encodeURIComponent(targetUrl);
      return;
    }
    
    // 네이버 인앱 브라우저 감지
    if (/naver/gi.test(userAgent)) {
      console.log('네이버 인앱 브라우저 감지 - 외부 브라우저로 리다이렉트');
      // 네이버는 직접적인 외부 브라우저 스킴이 없으므로 새 창으로 열기
      window.open(targetUrl, '_blank', 'noopener,noreferrer');
      return;
    }
    
    // 라인 인앱 브라우저 감지
    if (/line/gi.test(userAgent)) {
      console.log('라인 인앱 브라우저 감지 - 외부 브라우저로 리다이렉트');
      // 라인도 직접적인 외부 브라우저 스킴이 없으므로 새 창으로 열기
      window.open(targetUrl, '_blank', 'noopener,noreferrer');
      return;
    }
    
    // 페이스북 인앱 브라우저 감지
    if (/fban|fbav/gi.test(userAgent)) {
      console.log('페이스북 인앱 브라우저 감지 - 외부 브라우저로 리다이렉트');
      // 페이스북도 직접적인 외부 브라우저 스킴이 없으므로 새 창으로 열기
      window.open(targetUrl, '_blank', 'noopener,noreferrer');
      return;
    }
    
    // 인스타그램 인앱 브라우저 감지
    if (/instagram/gi.test(userAgent)) {
      console.log('인스타그램 인앱 브라우저 감지 - 외부 브라우저로 리다이렉트');
      // 인스타그램도 직접적인 외부 브라우저 스킴이 없으므로 새 창으로 열기
      window.open(targetUrl, '_blank', 'noopener,noreferrer');
      return;
    }
    
    // 위챗 인앱 브라우저 감지
    if (/micromessenger/gi.test(userAgent)) {
      console.log('위챗 인앱 브라우저 감지 - 외부 브라우저로 리다이렉트');
      // 위챗도 직접적인 외부 브라우저 스킴이 없으므로 새 창으로 열기
      window.open(targetUrl, '_blank', 'noopener,noreferrer');
      return;
    }
  }, []);

  return null; // UI 렌더링 없음
}
