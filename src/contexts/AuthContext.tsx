'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, signInWithRedirect, getRedirectResult, GoogleAuthProvider, signOut } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  forceStopLoading: () => void;
  showOnboarding: boolean;
  setShowOnboarding: (show: boolean) => void;
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
  const [showOnboarding, setShowOnboarding] = useState(false);

  // 구글 프로필 이미지를 base64로 변환하는 함수
  const copyGoogleProfileImage = async (user: User): Promise<string | null> => {
    if (!user.photoURL) {
      console.log('Google 프로필 이미지 없음, 기본 아바타 생성');
      return await createDefaultAvatar(user);
    }
    
    // CORS 문제를 피하기 위해 Google 원본 URL을 직접 사용하지 않고 기본 아바타 생성
    console.log('CORS 문제 방지를 위해 기본 아바타 생성');
    return await createDefaultAvatar(user);
  };

  // 기본 아바타 생성 함수
  const createDefaultAvatar = async (user: User): Promise<string | null> => {
    try {
      // 기본 이미지 생성 (Canvas로 간단한 아바타 생성)
      const canvas = document.createElement('canvas');
      canvas.width = 96;
      canvas.height = 96;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        // 배경색 설정
        const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'];
        const bgColor = colors[user.uid.charCodeAt(0) % colors.length];
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, 96, 96);
        
        // 이니셜 그리기
        ctx.fillStyle = 'white';
        ctx.font = 'bold 36px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const initial = user.displayName?.charAt(0)?.toUpperCase() || 'U';
        ctx.fillText(initial, 48, 48);
      }
      
      // Canvas를 base64로 변환
      const base64 = canvas.toDataURL('image/png', 1.0);
      console.log('✅ 기본 아바타 base64 생성 완료');
      return base64;
    } catch (error) {
      console.error('기본 아바타 생성 실패:', error);
      return null;
    }
  };

  // 사용자 정보를 Firestore에 저장하는 함수
  const saveUserToFirestore = async (user: User) => {
    try {
      // 먼저 기존 사용자 데이터 확인
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      
      let customPhotoURL = null;
      
      // 기존에 저장된 customPhotoURL이 있으면 사용, 없으면 새로 생성
      if (userSnap.exists() && userSnap.data().customPhotoURL) {
        console.log('✅ 기존 저장된 프로필 이미지 사용');
        customPhotoURL = userSnap.data().customPhotoURL;
      } else {
        console.log('🔄 새로운 프로필 이미지 생성');
        customPhotoURL = await copyGoogleProfileImage(user);
      }
      
      const userData = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL, // 원본 구글 URL
        customPhotoURL: customPhotoURL, // 우리 Storage URL
        createdAt: user.metadata.creationTime,
        lastSignIn: user.metadata.lastSignInTime,
        updatedAt: new Date().toISOString()
      };
      
      // Firebase 보안 규칙이 설정될 때까지 오류를 조용히 처리
      try {
        await setDoc(doc(db, 'users', user.uid), userData, { merge: true });
        console.log('✅ 사용자 정보 Firestore에 저장됨:', {
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          customPhotoURL: customPhotoURL,
          hasPhotoURL: !!user.photoURL,
          hasCustomPhotoURL: !!customPhotoURL
        });
      } catch (firestoreError: any) {
        if (firestoreError.code === 'permission-denied') {
          console.log('🔧 Firebase 보안 규칙 설정 대기 중 - 사용자 정보 저장 건너뜀');
        } else {
          throw firestoreError;
        }
      }
    } catch (error) {
      console.error('❌ 사용자 정보 저장 실패:', error);
    }
  };

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
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('🔧 Firebase 인증 상태 변경됨', user ? `사용자: ${user.email}` : '사용자 없음');
      
      // 사용자가 로그인한 경우 Firestore에서 customPhotoURL 확인
      if (user) {
        try {
          const userRef = doc(db, 'users', user.uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            const userData = userSnap.data();
            // customPhotoURL이 있으면 user 객체에 추가 (base64 데이터)
            if (userData.customPhotoURL) {
              user.photoURL = userData.customPhotoURL;
            }
          }
        } catch (error) {
          console.warn('사용자 정보 조회 실패:', error);
        }
        
        await saveUserToFirestore(user);
        
        // 사용자별 온보딩 튜토리얼 표시 여부 확인 (최초 로그인 시에만)
        const userId = user.uid;
        localStorage.setItem('current_user_id', userId);
        const onboardingCompleted = localStorage.getItem(`onboarding_completed_${userId}`);
        
        // 온보딩이 완료되지 않았고, 현재 showOnboarding이 false인 경우에만 true로 설정
        if (!onboardingCompleted && !showOnboarding) {
          setShowOnboarding(true);
        }
      }
      
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
      
      // 네트워크 오류 처리
      if (error.code === 'auth/network-request-failed') {
        throw new Error('네트워크 연결을 확인해주세요');
      }
      
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
        
        // 네트워크 오류 처리
        if (error.code === 'auth/network-request-failed') {
          throw new Error('네트워크 연결을 확인해주세요');
        }
        
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
      
      // 네트워크 오류 처리
      if (error.code === 'auth/network-request-failed') {
        throw new Error('네트워크 연결을 확인해주세요');
      }
      
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
    showOnboarding,
    setShowOnboarding,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
