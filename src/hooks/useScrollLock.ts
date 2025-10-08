import { useEffect } from 'react';

/**
 * 모달이나 오버레이가 열릴 때 배경 스크롤을 방지하는 훅
 * @param isLocked - 스크롤을 잠글지 여부
 */
export const useScrollLock = (isLocked: boolean) => {
  useEffect(() => {
    if (isLocked) {
      // 현재 스크롤 위치 저장
      const scrollY = window.scrollY;
      
      // body에 스크롤 방지 스타일 적용
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
    } else {
      // 스크롤 복원
      const scrollY = document.body.style.top;
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      
      // 스크롤 위치 복원
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || '0') * -1);
      }
    }

    // 컴포넌트 언마운트 시 스크롤 복원
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
    };
  }, [isLocked]);
};



