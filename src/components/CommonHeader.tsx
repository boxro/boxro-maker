'use client';

import { useState, useEffect } from "react";

// Google Translate 타입 선언
declare global {
  interface Window {
    google: any;
    googleTranslateElementInit: () => void;
  }
}
import Link from "next/link";
import Image from "next/image";
import { 
  Palette, 
  Download, 
  Play,
  Users,
  Heart,
  ShoppingBag,
  Menu,
  X,
  BookOpen,
  Settings,
  User,
  Home,
  LogOut,
  HelpCircle
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import OnboardingTutorial from "@/components/OnboardingTutorial";

interface CommonHeaderProps {
  className?: string;
}

export default function CommonHeader({ className = "" }: CommonHeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showHelpOnboarding, setShowHelpOnboarding] = useState(false);
  const [isTranslated, setIsTranslated] = useState(false);
  const [showTranslationToast, setShowTranslationToast] = useState(false);
  const { user, logout, setShowOnboarding } = useAuth();

  // 관리자 권한 체크
  const isAdmin = user?.email === "beagle3651@gmail.com" || 
                  user?.email === "boxro.crafts@gmail.com";

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // Google Translate 쿠키 설정 유틸
  const setTranslateCookie = (value: string) => {
    // 현재 도메인 및 루트 경로에 모두 설정 (크로스 경로 적용성 향상)
    document.cookie = `googtrans=${value}; path=/`;
    document.cookie = `googtrans=${value}; domain=${window.location.hostname}; path=/`;
  };

  const clearTranslateCookie = () => {
    document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
    document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 GMT; domain=${window.location.hostname}; path=/`;
  };

  // 언어 토글 함수 - 쿠키 기반 전환 (안정적)
  const toggleLanguage = () => {
    if (!isTranslated) {
      // 쿠키에 대상 언어 설정 (ko -> en)
      setTranslateCookie('/ko/en');
      localStorage.setItem('boxro-translation', 'en');
      localStorage.setItem('boxro-show-translation-toast', 'true'); // 토스트 표시 플래그 설정
      setIsTranslated(true);
      // 스크립트 없으면 로드만 해두고, 적용은 새로고침으로 보장
      if (!window.google || !window.google.translate) {
        const script = document.createElement('script');
        script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
        script.async = true;
        document.head.appendChild(script);
        window.googleTranslateElementInit = () => {
          new window.google.translate.TranslateElement({
            pageLanguage: 'ko',
            includedLanguages: 'ko,en',
            layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
            autoDisplay: false
          }, 'google_translate_element');
        };
      }
      // 적용 보장을 위해 한 번 새로고침
      window.location.reload();
    } else {
      clearTranslateCookie();
      localStorage.setItem('boxro-translation', 'ko');
      localStorage.removeItem('boxro-show-translation-toast'); // 토스트 플래그 제거
      setIsTranslated(false);
      window.location.reload();
    }
  };

  // 컴포넌트 마운트 시 저장된 번역 상태 복원 (쿠키 기반)
  useEffect(() => {
    const savedTranslation = localStorage.getItem('boxro-translation');
    if (savedTranslation === 'en') {
      setIsTranslated(true);
      // 쿠키만 보장해 두고, 위젯 스크립트는 비동기로 로드
      setTranslateCookie('/ko/en');
      
      // 스크립트가 이미 로드되었는지 확인
      const existingScript = document.querySelector('script[src*="translate_a/element.js"]');
      const hasGoogleTranslate = window.google && window.google.translate;
      
      if (!existingScript && !hasGoogleTranslate) {
        // googleTranslateElementInit이 이미 설정되어 있으면 재설정하지 않음
        if (!window.googleTranslateElementInit) {
          window.googleTranslateElementInit = () => {
            try {
              // 이미 초기화되었는지 확인
              const translateElement = document.getElementById('google_translate_element');
              if (translateElement && translateElement.firstChild) {
                return; // 이미 초기화됨
              }
              
              if (window.google && window.google.translate) {
                new window.google.translate.TranslateElement({
                  pageLanguage: 'ko',
                  includedLanguages: 'ko,en',
                  layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
                  autoDisplay: false
                }, 'google_translate_element');
              }
            } catch (error) {
              console.error('Google Translate 초기화 실패:', error);
            }
          };
        }
        
        const script = document.createElement('script');
        script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
        script.async = true;
        script.onerror = () => {
          console.error('Google Translate 스크립트 로드 실패');
        };
        document.head.appendChild(script);
      }
      
      // 영어로 번역된 상태이고 토스트 표시 플래그가 있으면 토스트 표시
      const shouldShowToast = localStorage.getItem('boxro-show-translation-toast') === 'true';
      if (shouldShowToast) {
        setShowTranslationToast(true);
        localStorage.removeItem('boxro-show-translation-toast');
        
        // 5초 후 자동으로 토스트 닫기
        const timer = setTimeout(() => {
          setShowTranslationToast(false);
        }, 5000);
        
        return () => clearTimeout(timer);
      }
    } else {
      clearTranslateCookie();
      setIsTranslated(false);
    }
  }, []);

  // 스크롤 이벤트 핸들러
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      setIsScrolled(scrollTop > 25);
    };

    // 초기 스크롤 상태 확인
    handleScroll();
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 메뉴 외부 클릭 시 메뉴 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isMenuOpen) {
        const target = event.target as Element;
        const menuContainer = target.closest('.menu-container');
        
        // 메뉴 컨테이너 외부를 클릭한 경우 메뉴 닫기
        if (!menuContainer) {
          setIsMenuOpen(false);
        }
      }
    };

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  const handleLogout = async () => {
    try {
      await logout();
      setIsMenuOpen(false);
      console.log('로그아웃 성공');
      // 로그아웃 후 홈으로 리다이렉트
      window.location.href = '/';
    } catch (error) {
      console.error('로그아웃 실패:', error);
    }
  };

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${className}`}
    >
      {/* 헤더 배경 - 별도 div로 분리 */}
      <div 
        className={`absolute inset-0 transition-all duration-300 ${
          isScrolled 
            ? 'backdrop-blur-md' 
            : ''
        }`}
        style={isScrolled ? { 
          background: 'linear-gradient(130deg, #2563eb, #7140ed)',
          opacity: 0.95
        } : {
          background: 'linear-gradient(130deg, #2563eb, #7140ed)',
          opacity: 0.1
        }}
      />
      <div className="relative max-w-7xl mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          {/* Left: Logo/Brand */}
          <Link href="/" className="flex items-center" style={{gap: '10px'}}>
            <Image 
              src="/logo.png" 
              alt="Boxro Maker Logo" 
              width={50} 
              height={50} 
              className="w-[50px] h-[50px]"
            />
            <span className="text-[28px]" style={{fontFamily: 'CookieRun, sans-serif', color: '#ffac00', letterSpacing: '-0.03em'}}>
              <span style={{fontWeight: 700}}>BOXRO</span>
            </span>
          </Link>

          {/* Right: Language Toggle + Hamburger Menu */}
          <div className="flex items-center gap-2">
            {/* Language Toggle Button */}
            <button
              onClick={toggleLanguage}
              className="w-[42px] h-[42px] rounded-lg transition-all duration-200 bg-white/20 backdrop-blur-sm border border-white/30 text-white hover:bg-white/30 text-sm font-medium flex items-center justify-center"
            >
              <span className="notranslate" translate="no">{isTranslated ? '한글' : 'EN'}</span>
            </button>
            
            {/* Hamburger Menu */}
            <div className="menu-container relative">
              <button
                onClick={toggleMenu}
                className="p-2 rounded-lg transition-all duration-200 bg-white/20 backdrop-blur-sm border border-white/30 text-white hover:bg-white/30"
              >
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            
              {/* Dropdown Menu */}
            {isMenuOpen && (
              <div className="menu-dropdown absolute top-full right-0 mt-2 w-64 rounded-lg shadow-xl transition-all duration-200 bg-white border border-gray-200">
                <div className="p-4">
                  <nav className="space-y-1">
                    <Link href="/" onClick={() => setIsMenuOpen(false)} className="block px-6 py-2 rounded-full transition-colors text-gray-900 hover:bg-purple-100">
                      <div className="flex items-center gap-3">
                        <Home className="w-4 h-4" />
                        <span>홈</span>
                      </div>
                    </Link>
                    <Link href="/draw" onClick={() => setIsMenuOpen(false)} className="block px-6 py-2 rounded-full transition-colors text-gray-900 hover:bg-purple-100">
                      <div className="flex items-center gap-3">
                        <Palette className="w-4 h-4" />
                        <span>박스카 그리기</span>
                      </div>
                    </Link>
                    <Link 
                      href="/community" 
                      onClick={() => {
                        setIsMenuOpen(false);
                        // 해시 제거하여 일반 목록으로 이동
                        window.history.replaceState(null, '', '/community');
                        // hashchange 이벤트 수동 발생
                        window.dispatchEvent(new HashChangeEvent('hashchange'));
                      }}
                      className="block px-6 py-2 rounded-full transition-colors text-gray-900 hover:bg-purple-100"
                    >
                      <div className="flex items-center gap-3">
                        <Users className="w-4 h-4" />
                        <span>박스카 갤러리</span>
                      </div>
                    </Link>
                    <Link href="/story" onClick={() => setIsMenuOpen(false)} className="block px-6 py-2 rounded-full transition-colors text-gray-900 hover:bg-purple-100">
                      <div className="flex items-center gap-3">
                        <BookOpen className="w-4 h-4" />
                        <span>박스카 이야기</span>
                      </div>
                    </Link>
                    <Link 
                      href="/youtube" 
                      onClick={() => {
                        setIsMenuOpen(false);
                        // 해시 제거하여 일반 목록으로 이동
                        window.history.replaceState(null, '', '/youtube');
                        // hashchange 이벤트 수동 발생
                        window.dispatchEvent(new HashChangeEvent('hashchange'));
                      }} 
                      className="block px-6 py-2 rounded-full transition-colors text-gray-900 hover:bg-purple-100"
                    >
                      <div className="flex items-center gap-3">
                        <Play className="w-4 h-4" />
                        <span>Boxro 유튜브</span>
                      </div>
                    </Link>
                    <Link 
                      href="/store" 
                      onClick={() => {
                        setIsMenuOpen(false);
                        // 해시 제거하여 일반 목록으로 이동
                        window.history.replaceState(null, '', '/store');
                        // hashchange 이벤트 수동 발생
                        window.dispatchEvent(new HashChangeEvent('hashchange'));
                      }} 
                      className="block px-6 py-2 rounded-full transition-colors text-gray-900 hover:bg-purple-100"
                    >
                      <div className="flex items-center gap-3">
                        <ShoppingBag className="w-4 h-4" />
                        <span>Boxro 스토어</span>
                      </div>
                    </Link>
                    <button 
                      onClick={() => {
                        setIsMenuOpen(false);
                        setShowHelpOnboarding(true);
                      }} 
                      className="block w-full text-left px-6 py-2 rounded-full transition-colors text-gray-900 hover:bg-blue-100"
                    >
                      <div className="flex items-center gap-3">
                        <HelpCircle className="w-4 h-4" />
                        <span>이용 가이드</span>
                      </div>
                    </button>
                    {isAdmin && (
                      <Link href="/admin" onClick={() => setIsMenuOpen(false)} className="block px-6 py-2 rounded-full transition-colors text-gray-900 hover:bg-red-100">
                        <div className="flex items-center gap-3">
                          <Settings className="w-4 h-4" />
                          <span className="font-semibold text-red-600">관리자</span>
                        </div>
                      </Link>
                    )}
                    {user ? (
                      <div className="border-t border-gray-300 pt-2 mt-2 space-y-1">
                        <Link href="/profile/edit" onClick={() => setIsMenuOpen(false)} className="block px-6 py-2 rounded-full transition-colors text-gray-900 hover:bg-purple-100">
                          <div className="flex items-center gap-3">
                            <User className="w-4 h-4" />
                            <span>프로필 수정</span>
                          </div>
                        </Link>
                        <button
                          onClick={handleLogout}
                          className="block w-full text-left px-6 py-2 rounded-full transition-colors text-gray-900 hover:bg-red-100"
                        >
                          <div className="flex items-center gap-3">
                            <LogOut className="w-4 h-4" />
                            <span>로그아웃</span>
                          </div>
                        </button>
                      </div>
                    ) : (
                      <div className="border-t border-gray-300 pt-2 mt-2 space-y-1">
                        <Link href="/auth" onClick={() => setIsMenuOpen(false)} className="block px-6 py-2 rounded-full transition-colors text-gray-900 hover:bg-purple-100">
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-gray-900">←</span>
                            <span>로그인</span>
                          </div>
                        </Link>
                        <Link href="/auth?mode=signup" onClick={() => setIsMenuOpen(false)} className="block px-6 py-2 rounded-full transition-colors text-gray-900 bg-blue-100 hover:bg-blue-200">
                          <div className="flex items-center gap-3">
                            <User className="w-4 h-4" />
                            <span>회원가입</span>
                          </div>
                        </Link>
                      </div>
                    )}
                  </nav>
                </div>
              </div>
            )}
            </div>
          </div>
        </div>
      </div>
      
      {/* 이용 가이드용 온보딩 (다시보지 않기 체크박스 없음) */}
      <OnboardingTutorial
        isOpen={showHelpOnboarding}
        onClose={() => setShowHelpOnboarding(false)}
        onComplete={() => setShowHelpOnboarding(false)}
        showDontShowAgain={false}
        redirectTo="/draw"
      />
      
      {/* 번역 토스트 메시지 */}
      {showTranslationToast && (
        <div 
          className="fixed top-20 left-1/2 transform -translate-x-1/2 z-[60] animate-in fade-in slide-in-from-top-2 duration-300 w-[80%] md:w-auto md:max-w-md mx-auto"
        >
          <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg shadow-xl px-4 md:px-6 py-4 text-center">
            <p className="text-gray-800 text-sm md:text-base">
              Translated by AI - it might sound a little funny, but we hope the message still reaches you 💛
            </p>
          </div>
        </div>
      )}
      
      {/* Google Translate Widget (Hidden) */}
      <div id="google_translate_element" style={{ display: 'none' }}></div>
      {/* Google Translate 위젯/배너 완전 숨김 처리 */}
      <style jsx global>{`
        .goog-te-banner-frame { display: none !important; }
        .goog-te-gadget-icon { display: none !important; }
        .goog-te-gadget-simple { display: none !important; }
        .goog-te-gadget { display: none !important; }
        .goog-te-combo { display: none !important; }
        .skiptranslate { display: none !important; }
        body { top: 0 !important; }
      `}</style>
    </header>
  );
}