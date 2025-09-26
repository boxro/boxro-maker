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
  Smartphone,
  ShoppingBag,
  Menu,
  X,
  BookOpen
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface CommonHeaderProps {
  className?: string;
}

export default function CommonHeader({ className = "" }: CommonHeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { user, logout } = useAuth();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // 스크롤 이벤트 핸들러
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      setIsScrolled(scrollTop > 25);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      setIsMenuOpen(false);
      console.log('로그아웃 성공');
    } catch (error) {
      console.error('로그아웃 실패:', error);
    }
  };

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${className} ${
        isScrolled 
          ? 'backdrop-blur-md' 
          : 'bg-transparent'
      }`}
      style={isScrolled ? { 
        background: 'linear-gradient(100deg, #2563eb, #7c3aed, #b842c1)',
        opacity: 0.9
      } : {}}
    >
      <div className="max-w-7xl mx-auto px-4 py-4">
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
            <span className="text-[24px]" style={{fontFamily: 'CookieRun, sans-serif', color: '#ffac00'}}>
              <span style={{fontWeight: 700}}>박스로</span>&nbsp;<span style={{fontWeight: 400}}>메이커</span>
            </span>
          </Link>

          {/* Right: Hamburger Menu */}
          <div className="relative">
            <button
              onClick={toggleMenu}
              className={`p-2 rounded-lg transition-all duration-200 ${
                isScrolled 
                  ? 'bg-white/20 backdrop-blur-sm border border-white/30 text-white hover:bg-white/30' 
                  : 'bg-white/20 backdrop-blur-sm border border-white/30 text-white hover:bg-white/30'
              }`}
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            
            {/* Dropdown Menu */}
            {isMenuOpen && (
              <div className={`absolute top-full right-0 mt-2 w-64 rounded-lg shadow-xl transition-all duration-200 ${
                isScrolled 
                  ? 'bg-white/90 backdrop-blur-sm border border-white/30' 
                  : 'bg-white/90 backdrop-blur-sm border border-white/30'
              }`}>
                <div className="p-4">
                  <h3 className="text-lg font-semibold mb-3 px-3 font-cookie-run text-gray-800">
                    메뉴
                  </h3>
                  <nav className="space-y-2">
                    <Link href="/draw" className={`block px-3 py-2 rounded-md transition-colors ${
                      isScrolled 
                        ? 'text-gray-300 hover:bg-gray-700/50' 
                        : 'text-gray-700 hover:bg-purple-100'
                    }`}>
                      <div className="flex items-center gap-3">
                        <Palette className="w-4 h-4" />
                        <span>박스카 그리기</span>
                      </div>
                    </Link>
                    <Link href="/my-designs" className={`block px-3 py-2 rounded-md transition-colors ${
                      isScrolled 
                        ? 'text-gray-300 hover:bg-gray-700/50' 
                        : 'text-gray-700 hover:bg-purple-100'
                    }`}>
                      <div className="flex items-center gap-3">
                        <Heart className="w-4 h-4" />
                        <span>내 작품</span>
                      </div>
                    </Link>
                    <Link href="/community" className={`block px-3 py-2 rounded-md transition-colors ${
                      isScrolled 
                        ? 'text-gray-300 hover:bg-gray-700/50' 
                        : 'text-gray-700 hover:bg-purple-100'
                    }`}>
                      <div className="flex items-center gap-3">
                        <Users className="w-4 h-4" />
                        <span>커뮤니티</span>
                      </div>
                    </Link>
                    <Link href="/magazine" className={`block px-3 py-2 rounded-md transition-colors ${
                      isScrolled 
                        ? 'text-gray-300 hover:bg-gray-700/50' 
                        : 'text-gray-700 hover:bg-purple-100'
                    }`}>
                      <div className="flex items-center gap-3">
                        <BookOpen className="w-4 h-4" />
                        <span>매거진</span>
                      </div>
                    </Link>
                    <Link href="/remote-control" className={`block px-3 py-2 rounded-md transition-colors ${
                      isScrolled 
                        ? 'text-gray-300 hover:bg-gray-700/50' 
                        : 'text-gray-700 hover:bg-purple-100'
                    }`}>
                      <div className="flex items-center gap-3">
                        <Smartphone className="w-4 h-4" />
                        <span>무선조종 앱</span>
                      </div>
                    </Link>
                    <Link href="/store" className={`block px-3 py-2 rounded-md transition-colors ${
                      isScrolled 
                        ? 'text-gray-300 hover:bg-gray-700/50' 
                        : 'text-gray-700 hover:bg-purple-100'
                    }`}>
                      <div className="flex items-center gap-3">
                        <ShoppingBag className="w-4 h-4" />
                        <span>박스로 스토어</span>
                      </div>
                    </Link>
                    {user ? (
                      <div className={`border-t pt-2 mt-2 ${
                        isScrolled ? 'border-gray-600' : 'border-gray-300'
                      }`}>
                        <button
                          onClick={handleLogout}
                          className={`block w-full text-left px-3 py-2 rounded-md transition-colors ${
                            isScrolled 
                              ? 'text-gray-300 hover:bg-red-900/50' 
                              : 'text-gray-700 hover:bg-red-100'
                          }`}
                        >
                          로그아웃
                        </button>
                      </div>
                    ) : (
                      <Link href="/auth" className={`block px-3 py-2 rounded-md transition-colors ${
                        isScrolled 
                          ? 'text-gray-300 hover:bg-gray-700/50' 
                          : 'text-gray-700 hover:bg-purple-100'
                      }`}>
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-gray-700">←</span>
                          <span>로그인</span>
                        </div>
                      </Link>
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