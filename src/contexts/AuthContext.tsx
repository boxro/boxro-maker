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
  const [loading, setLoading] = useState(true);

  console.log('🔧 AuthProvider 렌더링됨', { user, loading, auth: !!auth });

  useEffect(() => {
    console.log('🔧 AuthProvider useEffect 실행됨');
    console.log('🔧 Firebase auth 상태:', { auth: !!auth, authType: typeof auth });
    
    // auth가 null이면 로딩 해제
    if (!auth) {
      console.error('❌ Firebase auth가 초기화되지 않았습니다');
      setLoading(false);
      return;
    }
    
    console.log('🔧 onAuthStateChanged 등록 시작');
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('🔧 Firebase 인증 상태 변경됨', user ? `사용자: ${user.email}` : '사용자 없음');
      setUser(user);
      setLoading(false);
    });

    return () => {
      console.log('🔧 onAuthStateChanged 정리');
      unsubscribe();
    };
  }, []);

  const signInWithEmail = async (email: string, password: string) => {
    if (!auth) {
      throw new Error('Firebase auth가 초기화되지 않았습니다');
    }
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      console.error('이메일 로그인 오류:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signUpWithEmail = async (email: string, password: string) => {
    if (!auth) {
      throw new Error('Firebase auth가 초기화되지 않았습니다');
    }
    setLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      console.error('이메일 회원가입 오류:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    if (!auth) {
      throw new Error('Firebase auth가 초기화되지 않았습니다');
    }
    setLoading(true);
    try {
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
          await signInWithRedirect(auth, provider);
          return;
        }
        
        throw error;
      }
    } catch (error: any) {
      console.error('Google 로그인 전체 오류:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    if (!auth) {
      throw new Error('Firebase auth가 초기화되지 않았습니다');
    }
    setLoading(true);
    try {
      await signOut(auth);
    } catch (error: any) {
      console.error('로그아웃 오류:', error);
      throw error;
    } finally {
      setLoading(false);
    }
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
