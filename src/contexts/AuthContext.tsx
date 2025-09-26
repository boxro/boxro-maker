'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, signInWithRedirect, getRedirectResult, GoogleAuthProvider, signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  forceStopLoading: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth는 AuthProvider 내에서 사용되어야 합니다');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false); // 초기값을 false로 설정

  // 모바일 기기 감지
  const isMobile = () => {
    if (typeof window === 'undefined') return false;
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  };

  // 개발 환경에서 IP 주소 감지
  const isDevelopment = () => {
    if (typeof window === 'undefined') return false;
    return window.location.hostname === 'localhost' || 
           window.location.hostname.startsWith('192.168.') ||
           window.location.hostname.startsWith('10.') ||
           window.location.hostname.startsWith('172.');
  };

  useEffect(() => {
    console.log('AuthProvider: Firebase 인증 상태 확인 시작');
    
    // redirect 결과 처리 (Google 로그인 후)
    const handleRedirectResult = async () => {
      try {
        console.log('AuthProvider: Redirect 결과 확인 중...');
        const result = await getRedirectResult(auth);
        if (result) {
          console.log('AuthProvider: Redirect 로그인 성공', result.user.email);
          // 사용자 상태를 즉시 업데이트
          setUser(result.user);
        } else {
          console.log('AuthProvider: Redirect 결과 없음');
        }
      } catch (error) {
        console.error('AuthProvider: Redirect 결과 처리 오류:', error);
      }
    };

    // redirect 결과 확인
    handleRedirectResult();
    
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('AuthProvider: Firebase 인증 상태 변경됨', user ? `사용자: ${user.email}` : '사용자 없음');
      
      // 사용자 상태 업데이트
      setUser(user);
      
      console.log('AuthProvider: 인증 상태 업데이트 완료:', { user: user ? user.email : null });
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const signInWithEmail = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signUpWithEmail = async (email: string, password: string) => {
    await createUserWithEmailAndPassword(auth, email, password);
  };

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    // Google 로그인 설정 개선
    provider.addScope('email');
    provider.addScope('profile');
    provider.setCustomParameters({
      prompt: 'select_account'
    });

    try {
      console.log('Google 로그인 시작 - popup 방식');
      const result = await signInWithPopup(auth, provider);
      console.log('Google 로그인 성공:', result.user.email);
    } catch (error: any) {
      console.error('Google 로그인 오류:', error);
      
      // popup이 실패하면 redirect 방식으로 재시도
      if (error.code === 'auth/popup-blocked' || error.code === 'auth/popup-closed-by-user' || error.code === 'auth/unauthorized-domain') {
        console.log('popup 실패, redirect 방식으로 재시도');
        try {
          await signInWithRedirect(auth, provider);
          return;
        } catch (redirectError) {
          console.error('redirect 로그인도 실패:', redirectError);
          throw redirectError;
        }
      }
      
      throw error;
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  const forceStopLoading = () => {
    console.log('AuthProvider: 강제 로딩 해제');
    setLoading(false);
  };

  const value: AuthContextType = {
    user,
    loading,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    logout,
    forceStopLoading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
