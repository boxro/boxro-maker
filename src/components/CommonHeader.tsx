'use client';

import { useState, useEffect } from "react";
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

interface CommonHeaderProps {
  className?: string;
}

export default function CommonHeader({ className = "" }: CommonHeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { user, logout, setShowOnboarding } = useAuth();

  // 관리자 권한 체크
  const isAdmin = user?.email === "admin@boxro.com" || 
                  user?.email === "dongwoo.kang@boxro.com" || 
                  user?.email === "beagle3651@gmail.com" || 
                  user?.email === "boxro.crafts@gmail.com";

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

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

          {/* Right: Hamburger Menu */}
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
                    <Link href="/gallery" onClick={() => setIsMenuOpen(false)} className="block px-6 py-2 rounded-full transition-colors text-gray-900 hover:bg-purple-100">
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
                    <Link href="/store" onClick={() => setIsMenuOpen(false)} className="block px-6 py-2 rounded-full transition-colors text-gray-900 hover:bg-purple-100">
                      <div className="flex items-center gap-3">
                        <ShoppingBag className="w-4 h-4" />
                        <span>박스로 스토어</span>
                      </div>
                    </Link>
                    <button 
                      onClick={() => {
                        setIsMenuOpen(false);
                        setShowOnboarding(true);
                      }} 
                      className="block w-full text-left px-6 py-2 rounded-full transition-colors text-gray-900 hover:bg-blue-100"
                    >
                      <div className="flex items-center gap-3">
                        <HelpCircle className="w-4 h-4" />
                        <span>도움말</span>
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
    </header>
  );
}