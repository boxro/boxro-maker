import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';

// Firebase 설정 - 실제 프로젝트 설정 사용
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// 환경변수가 없으면 에러 발생
if (!firebaseConfig.apiKey || !firebaseConfig.authDomain || !firebaseConfig.projectId) {
  console.error('❌ Firebase 환경변수가 설정되지 않았습니다. .env.local 파일을 확인해주세요.');
  console.error('필요한 환경변수:', {
    NEXT_PUBLIC_FIREBASE_API_KEY: !!firebaseConfig.apiKey,
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: !!firebaseConfig.authDomain,
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: !!firebaseConfig.projectId,
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: !!firebaseConfig.storageBucket,
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: !!firebaseConfig.messagingSenderId,
    NEXT_PUBLIC_FIREBASE_APP_ID: !!firebaseConfig.appId,
  });
  
  // 환경변수가 없으면 빈 객체 반환
  if (typeof window !== 'undefined') {
    alert('Firebase 설정이 누락되었습니다. 관리자에게 문의하세요.');
  }
}

// Firebase 앱 초기화
let app;
let auth;
let db;
let storage;

// Firebase 연결 상태 확인 함수
export const checkFirebaseConnection = () => {
  console.log('🔍 Firebase 연결 상태 확인:', {
    app: !!app,
    auth: !!auth,
    db: !!db,
    storage: !!storage,
    apiKey: !!firebaseConfig.apiKey,
    authDomain: !!firebaseConfig.authDomain,
    projectId: !!firebaseConfig.projectId,
    storageBucket: !!firebaseConfig.storageBucket,
    messagingSenderId: !!firebaseConfig.messagingSenderId,
    appId: !!firebaseConfig.appId
  });
  
  if (!app || !db) {
    console.error('❌ Firebase 연결 실패');
    return false;
  }
  
  console.log('✅ Firebase 연결 성공');
  return true;
};

// Firebase 초기화 함수
const initializeFirebase = () => {
  try {
    // 환경변수가 제대로 설정된 경우에만 초기화 시도
    if (firebaseConfig.apiKey && firebaseConfig.authDomain && firebaseConfig.projectId) {
      app = initializeApp(firebaseConfig);
      auth = getAuth(app);
      db = getFirestore(app);
      storage = getStorage(app);
      
      // Storage 재시도 설정
      if (typeof window !== 'undefined') {
        // Storage 재시도 설정을 위한 커스텀 설정
        console.log('📦 Firebase Storage 초기화 완료');
      }
      
      // 네트워크 연결 상태 확인
      if (typeof window !== 'undefined') {
        console.log('✅ Firebase 초기화 성공');
        console.log('🌐 네트워크 상태:', navigator.onLine ? '온라인' : '오프라인');
        
        // 오프라인 상태 감지
        window.addEventListener('online', () => {
          console.log('🌐 네트워크 연결됨');
        });
        
        window.addEventListener('offline', () => {
          console.log('🌐 네트워크 연결 끊김');
        });
      }
    } else {
      console.error('❌ Firebase 초기화 건너뜀: 필수 환경변수 누락');
      app = null;
      auth = null;
      db = null;
      storage = null;
    }
  } catch (error) {
    console.error('❌ Firebase 초기화 실패:', error);
    app = null;
    auth = null;
    db = null;
    storage = null;
  }
};

// 초기화 실행
initializeFirebase();

export { auth, db, storage };
export default app;
