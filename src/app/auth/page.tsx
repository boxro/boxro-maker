'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import CommonBackground from "@/components/CommonBackground";

export default function AuthPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [agreeToPrivacy, setAgreeToPrivacy] = useState(false);
  
  const { user, loading, signInWithEmail, signUpWithEmail, signInWithGoogle } = useAuth();
  const router = useRouter();

  // URL 파라미터 확인하여 회원가입 모드로 설정
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const mode = urlParams.get('mode');
      if (mode === 'signup') {
        setIsLogin(false);
      }
    }
  }, []);

  // 로그인된 사용자가 있으면 이전 페이지로 리다이렉트
  useEffect(() => {
    if (user && user.email) {
      // URL 파라미터에서 returnUrl 확인, 없으면 홈으로
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        const returnUrl = urlParams.get('returnUrl') || '/';
        router.push(returnUrl);
      } else {
        router.push('/');
      }
    }
  }, [user, router]);

  // 로그인된 사용자가 있으면 로딩 화면 표시
  if (user && user.email) {
    return (
      <CommonBackground className="flex items-center justify-center">
        <div className="text-center">
          <Image 
            src="/fly-boxro.png" 
            alt="Boxro" 
            width={200} 
            height={200} 
            className="mx-auto mb-6"
          />
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-white">홈으로 이동 중...</p>
        </div>
      </CommonBackground>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // 회원가입 시 약관 동의 검증
    if (!isLogin && (!agreeToTerms || !agreeToPrivacy)) {
      setError('서비스이용약관과 개인정보처리방침에 동의해주세요.');
      return;
    }

    try {
      if (isLogin) {
        await signInWithEmail(email, password);
      } else {
        await signUpWithEmail(email, password);
      }
      // 로그인 성공 시 리다이렉트는 onAuthStateChanged에서 처리됨
    } catch (error: any) {
      console.error('인증 오류:', error);
      setError('로그인 중 오류가 발생했습니다. 다시 시도해주세요.');
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setError('');
      await signInWithGoogle();
      // Google 로그인 성공 시 리다이렉트는 onAuthStateChanged에서 처리됨
    } catch (error: any) {
      console.error('Google 로그인 오류:', error);
      setError('Google 로그인 중 오류가 발생했습니다.');
    }
  };

  console.log('AuthPage: 로그인 폼 렌더링', { 
    user: user ? user.email : null, 
    loading,
    isLogin 
  });

  return (
    <CommonBackground className="flex flex-col items-center justify-center py-12 px-4">
      <Image 
        src="/fly-boxro.png" 
        alt="Boxro" 
        width={240} 
        height={240} 
        className="mx-auto mb-6 w-[192px] h-[192px] md:w-[240px] md:h-[240px]"
      />
      <div className="w-full max-w-md bg-white rounded-lg p-6">
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold text-gray-900 md:text-2xl" style={{fontFamily: 'CookieRun, sans-serif'}}>
            {isLogin ? '로그인' : '회원가입'}
          </h1>
                <p className="text-gray-600 mt-2">
                  {isLogin 
                    ? '' 
                    : ''
                  }
                </p>
        </div>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm mb-4">
            {error}
          </div>
        )}

        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-full bg-white font-medium text-gray-900 hover:bg-gray-50 disabled:opacity-50"
          style={{fontSize: '15px'}}
        >
          <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Google로 {isLogin ? '로그인' : '회원가입'}
        </button>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-gray-900">또는</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              id="email"
              type="email"
              placeholder="이메일을 입력하세요"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-[15px]"
              required
            />
          </div>

          <div>
            <input
              id="password"
              type="password"
              placeholder="비밀번호를 입력하세요"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-[15px]"
              required
            />
          </div>

          {/* 회원가입 시 약관 동의 체크박스 */}
          {!isLogin && (
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="agreeToTerms"
                  checked={agreeToTerms}
                  onChange={(e) => setAgreeToTerms(e.target.checked)}
                  className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="agreeToTerms" className="text-sm text-gray-700">
                  <a 
                    href="/terms" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700 underline"
                  >
                    서비스이용약관
                  </a>
                  에 동의합니다 (필수)
                </label>
              </div>
              
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="agreeToPrivacy"
                  checked={agreeToPrivacy}
                  onChange={(e) => setAgreeToPrivacy(e.target.checked)}
                  className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="agreeToPrivacy" className="text-sm text-gray-700">
                  <a 
                    href="/privacy" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700 underline"
                  >
                    개인정보처리방침
                  </a>
                  에 동의합니다 (필수)
                </label>
              </div>
            </div>
          )}

          <button 
            type="submit" 
            className="w-full flex justify-center py-2 px-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white transition-all duration-200 rounded-full font-medium disabled:opacity-50"
            style={{fontSize: '15px'}}
            disabled={loading}
          >
            {loading ? '처리 중...' : (isLogin ? '로그인' : '회원가입')}
          </button>
        </form>

        <div className="text-center mt-4">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-blue-600 hover:text-blue-500"
            style={{fontSize: '15px'}}
          >
            {isLogin ? '계정이 없으신가요? 회원가입' : '이미 계정이 있으신가요? 로그인'}
          </button>
        </div>
      </div>
    </CommonBackground>
  );
}