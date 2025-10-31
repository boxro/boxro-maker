# BOXRO 박스로 - 프론트엔드 기술 스택 및 구현 방법

## 📋 목차
1. [프레임워크 & 코어 기술](#프레임워크--코어-기술)
2. [UI/UX 라이브러리](#uiux-라이브러리)
3. [스타일링 시스템](#스타일링-시스템)
4. [상태 관리](#상태-관리)
5. [데이터 페칭 & 캐싱](#데이터-페칭--캐싱)
6. [라우팅 & 네비게이션](#라우팅--네비게이션)
7. [캔버스 & 3D 렌더링](#캔버스--3d-렌더링)
8. [PWA & 오프라인 지원](#pwa--오프라인-지원)
9. [SEO 최적화](#seo-최적화)
10. [성능 최적화](#성능-최적화)
11. [보안 & 인증](#보안--인증)

---

## 1. 프레임워크 & 코어 기술

### Next.js 15.5.0 (App Router)

**사용 이유:**
- 서버 사이드 렌더링(SSR) 및 정적 생성(SSG) 지원
- 자동 코드 스플리팅 및 최적화
- 파일 기반 라우팅 시스템
- API Routes 내장

**구현 방법:**
```typescript
// src/app/layout.tsx
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <AuthProvider>
          <LanguageProvider>
            <StoryProvider>
              {children}
            </StoryProvider>
          </LanguageProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
```

**주요 특징:**
- **App Router**: `src/app/` 디렉토리 기반 라우팅
- **Server Components**: 기본적으로 서버 컴포넌트, 필요시 `'use client'` 사용
- **Metadata API**: SEO 메타데이터를 타입 안전하게 관리
- **Dynamic Routes**: `[id]`, `[...slug]` 등의 동적 라우팅 지원

### React 19.1.0

**주요 기능 활용:**
- **Hooks**: `useState`, `useEffect`, `useCallback`, `useMemo`, `useRef`
- **Context API**: 전역 상태 관리 (AuthContext, LanguageContext, StoryContext)
- **Concurrent Features**: 자동 배칭, Suspense

**커스텀 훅:**
```typescript
// src/hooks/useScrollLock.ts
export function useScrollLock(isLocked: boolean) {
  useEffect(() => {
    if (isLocked) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [isLocked]);
}
```

### TypeScript 5

**타입 안정성:**
- 엄격한 타입 체크 (`strict: true`)
- 인터페이스 및 타입 별칭 활용
- 제네릭을 활용한 재사용 가능한 컴포넌트

**타입 정의 예시:**
```typescript
interface StoryArticle {
  id: string;
  title: string;
  summary: string;
  thumbnail?: string;
  cardBackgroundColor?: string;
  authorId: string;
  createdAt: any;
  // ...
}
```

---

## 2. UI/UX 라이브러리

### shadcn/ui (Radix UI 기반)

**구성:**
- `@radix-ui/react-dialog`: 모달 다이얼로그
- `@radix-ui/react-dropdown-menu`: 드롭다운 메뉴
- `@radix-ui/react-tabs`: 탭 컴포넌트
- `@radix-ui/react-label`: 접근성 향상 라벨

**설정:**
```json
// components.json
{
  "style": "new-york",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "css": "src/app/globals.css",
    "baseColor": "neutral",
    "cssVariables": true
  }
}
```

**컴포넌트 예시:**
```typescript
// src/components/ui/button.tsx
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        // ...
      }
    }
  }
);
```

### Lucide React (아이콘)

**사용법:**
```typescript
import { Heart, Share2, Download } from "lucide-react";

<Heart className="w-4 h-4" />
```

---

## 3. 스타일링 시스템

### Tailwind CSS 4

**설정:**
```css
/* src/app/globals.css */
@import "tailwindcss";
@import "tw-animate-css";

:root {
  --radius: 0.625rem;
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  /* ... */
}
```

**주요 특징:**
- **OKLCH 색상 시스템**: 더 넓은 색 공간 지원
- **CSS Variables**: 테마 시스템 기반
- **JIT 모드**: 필요한 스타일만 생성
- **유틸리티 퍼스트**: 빠른 개발 및 일관된 디자인

**응답형 디자인:**
```typescript
// 모바일 우선 접근
<div className="w-full md:w-auto md:max-w-md">
  <p className="text-sm md:text-base">
```

**애니메이션:**
- `tw-animate-css`: CSS 애니메이션 유틸리티
- Tailwind의 `transition-*` 클래스 활용

### tailwind-merge & clsx

**클래스 병합 유틸리티:**
```typescript
// src/lib/utils.ts
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

**사용 예시:**
```typescript
<button className={cn(
  "px-4 py-2 rounded-md",
  isActive && "bg-blue-500",
  className
)}>
```

---

## 4. 상태 관리

### React Context API

**AuthContext (인증 상태):**
```typescript
// src/contexts/AuthContext.tsx
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // 사용자 정보 Firestore에서 가져오기
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        // ...
      }
    });
    return unsubscribe;
  }, []);
  
  return (
    <AuthContext.Provider value={{ user, loading, signInWithEmail, ... }}>
      {children}
    </AuthContext.Provider>
  );
};
```

**LanguageContext (언어 전환):**
```typescript
// src/contexts/LanguageContext.tsx
export const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('ko');
  
  const toggleLanguage = () => {
    setLanguageState(prev => prev === 'ko' ? 'en' : 'ko');
  };
  
  return (
    <LanguageContext.Provider value={{ language, toggleLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};
```

**StoryContext (이야기 데이터):**
- 홈페이지 카드 데이터 전역 관리
- 캐싱 및 최적화

### Local State (useState)

**로컬 상태 관리:**
```typescript
const [isMenuOpen, setIsMenuOpen] = useState(false);
const [showTranslationToast, setShowTranslationToast] = useState(false);
const [articles, setArticles] = useState<StoryArticle[]>([]);
```

### 전역 캐시 (Window 객체 활용)

**인덱싱 캐시:**
```typescript
// 해시 기반 네비게이션을 위한 전역 인덱스
if (typeof window !== 'undefined') {
  (window as any).__storyIndexCache = new Map();
  (window as any).__storyIndexLoaded = false;
}
```

---

## 5. 데이터 페칭 & 캐싱

### Firebase Firestore

**실시간 데이터베이스:**
```typescript
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';

const fetchArticles = async () => {
  const articlesRef = collection(db, 'storyArticles');
  const q = query(
    articlesRef,
    where('isPublished', '==', true),
    orderBy('createdAt', 'desc'),
    limit(15)
  );
  const querySnapshot = await getDocs(q);
  // ...
};
```

**최적화 기법:**
- **인덱싱**: 카드 ID 기반 전역 인덱스 캐시
- **페이징**: `limit()` 및 커서 기반 페이지네이션
- **조건부 로딩**: 해시 URL 기반 선택적 데이터 로드

### 인덱싱 시스템

**전역 인덱스 생성:**
```typescript
// 인덱싱 생성 (한 번만, 전역)
const createIndex = async () => {
  if ((window as any).__storyIndexLoaded) {
    return; // 이미 로드됨
  }
  
  const querySnapshot = await getDocs(q);
  const indexInfo = new Map();
  
  querySnapshot.forEach((doc, index) => {
    indexInfo.set(doc.id, { id: doc.id, index });
  });
  
  (window as any).__storyIndexCache = indexInfo;
  (window as any).__storyIndexLoaded = true;
};
```

**해시 기반 빠른 접근:**
```typescript
// 해시 URL에서 카드 ID 추출
const cardId = hash.replace('#card-', '');

// 인덱스에서 해당 카드 정보 찾기
const cardInfo = (window as any).__storyIndexCache.get(cardId);

if (cardInfo) {
  // 해당 범위의 데이터만 로드 (성능 최적화)
  const endIndex = Math.min(cardInfo.index + 15, totalCount);
  // ...
}
```

---

## 6. 라우팅 & 네비게이션

### 해시 기반 카드 네비게이션

**구현 방식:**
```typescript
// URL 해시 처리
useEffect(() => {
  const handleHashChange = () => {
    const hash = window.location.hash;
    if (hash.startsWith('#card-')) {
      processHashCard();
    }
  };
  
  window.addEventListener('hashchange', handleHashChange);
  handleHashChange(); // 초기 로드
  
  return () => window.removeEventListener('hashchange', handleHashChange);
}, [articles]);

// 해시 카드를 첫 번째로 재배치
const processHashCard = useCallback(() => {
  const hash = window.location.hash;
  if (!hash.startsWith('#card-')) return;
  
  const cardId = hash.replace('#card-', '');
  const targetCard = articles.find(article => article.id === cardId);
  
  if (targetCard) {
    const filtered = articles.filter(a => a.id !== cardId);
    setArticles([targetCard, ...filtered]);
    
    // 스크롤 위치 조정
    setTimeout(() => {
      const element = document.getElementById(`card-${cardId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  }
}, [articles]);
```

**공유 링크 생성:**
```typescript
const shareUrl = `${window.location.origin}${window.location.pathname}#card-${article.id}`;
```

### Next.js Link 컴포넌트

**클라이언트 사이드 네비게이션:**
```typescript
import Link from 'next/link';

<Link href="/story" onClick={() => {
  window.history.replaceState(null, '', '/story');
  window.dispatchEvent(new HashChangeEvent('hashchange'));
}}>
  박스카 이야기
</Link>
```

---

## 7. 캔버스 & 3D 렌더링

### Fabric.js 6.7.1 (2D 캔버스)

**그림 그리기 기능:**
```typescript
import { fabric } from 'fabric';

const canvas = new fabric.Canvas('canvas', {
  width: 800,
  height: 600,
  isDrawingMode: true,
});

// 펜 도구 설정
canvas.freeDrawingBrush.width = lineWidth;
canvas.freeDrawingBrush.color = color;

// 지우개 도구
canvas.freeDrawingBrush = new fabric.EraserBrush(canvas);
```

**주요 기능:**
- 자유형 그리기 (Free Drawing)
- 지우개 (Eraser)
- 도형 추가 (사각형, 원)
- 줌 인/아웃
- 그리드 시스템

### Three.js 0.179.1 (3D 렌더링)

**3D 박스카 미리보기:**
```typescript
// src/components/ThreeDRenderer.tsx
import * as THREE from 'three';

useEffect(() => {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  
  // 박스카 모델 생성
  // ...
  
  const animate = () => {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
  };
  animate();
}, []);
```

---

## 8. PWA & 오프라인 지원

### Service Worker

**등록 및 업데이트:**
```typescript
// src/components/ConditionalPWA.tsx
useEffect(() => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        // 업데이트 확인
        registration.update();
      });
  }
}, []);
```

**업데이트 알림:**
```typescript
// src/components/ServiceWorkerUpdate.tsx
navigator.serviceWorker.addEventListener('controllerchange', () => {
  // 새 버전 알림 표시
});
```

### Manifest.json

**설정:**
```json
{
  "name": "BOXRO 박스로",
  "short_name": "BOXRO",
  "start_url": "/",
  "display": "standalone",
  "theme_color": "#2563eb",
  "background_color": "#ffffff",
  "icons": [...]
}
```

### 설치 프롬프트

**PWA 설치 유도:**
```typescript
// src/components/PWAInstallPrompt.tsx
const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  setDeferredPrompt(e);
});

const handleInstall = async () => {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
  }
};
```

---

## 9. SEO 최적화

### 메타데이터 관리

**Next.js Metadata API:**
```typescript
// src/app/layout.tsx
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://boxro.vercel.app'),
  title: "BOXRO 박스로 | AI가 아이의 그림을 박스카 도안으로!",
  description: "아이가 그린 자동차를 AI가 도안으로 만들어줘요...",
  openGraph: {
    title: "...",
    images: [`${process.env.NEXT_PUBLIC_SITE_URL}/og-image.png`],
  },
  twitter: {
    card: "summary_large_image",
    images: [...],
  },
};
```

**동적 메타데이터:**
```typescript
// src/app/story/[id]/layout.tsx
export async function generateMetadata({ params }: { params: { id: string } }) {
  const article = await getArticle(params.id);
  return {
    title: `${article.title} | BOXRO 박스로`,
    description: article.summary,
  };
}
```

### 구조화된 데이터 (JSON-LD)

```typescript
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": article.title,
      "publisher": {
        "@type": "Organization",
        "name": "BOXRO 박스로",
        "logo": `${process.env.NEXT_PUBLIC_SITE_URL}/og-image.png`
      },
      // ...
    })
  }}
/>
```

### 동적 사이트맵

```typescript
// src/app/sitemap.ts
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://boxro.vercel.app';
  
  // 정적 페이지
  const staticPages = [...];
  
  // 동적 페이지 (Firestore에서 가져오기)
  const storyPages = await getStoryPages();
  const storePages = await getStorePages();
  
  return [...staticPages, ...storyPages, ...storePages];
}
```

### Robots.txt

```typescript
// src/app/robots.ts
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/api/', '/auth/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
```

---

## 10. 성능 최적화

### 코드 스플리팅

**Dynamic Import:**
```typescript
// src/app/story/page.tsx
const StoryPageClient = dynamic(() => import('./StoryPageClient'), {
  ssr: false,
  loading: () => <LoadingComponent />,
});
```

### 메모이제이션

**useMemo & useCallback:**
```typescript
const cardIndex = useMemo(() => {
  const index = new Map();
  articles.forEach((article, index) => {
    index.set(article.id, { article, index });
  });
  return index;
}, [articles]);

const processHashCard = useCallback((forceReload = false) => {
  // 해시 처리 로직
}, [articles]);
```

### 중복 요청 방지

```typescript
const isFetchingRef = useRef(false);

const fetchArticles = async () => {
  if (isFetchingRef.current) return;
  isFetchingRef.current = true;
  
  try {
    // 데이터 페칭
  } finally {
    isFetchingRef.current = false;
  }
};
```

### 랜덤 정렬 (일반 목록)

```typescript
// 일반 목록은 랜덤 정렬
const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

if (!window.location.hash.startsWith('#card-')) {
  setArticles(shuffleArray(articles));
}
```

---

## 11. 보안 & 인증

### Firebase Authentication

**인증 방법:**
1. **이메일/비밀번호**
2. **Google 소셜 로그인**
3. **익명 인증** (공유용)

**구현:**
```typescript
// 이메일 로그인
const signInWithEmail = async (email: string, password: string) => {
  await signInWithEmailAndPassword(auth, email, password);
};

// Google 로그인
const signInWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  await signInWithPopup(auth, provider);
};
```

### Firestore 보안 규칙

**접근 제어:**
- 공개 콘텐츠: `isPublished == true`면 모든 사용자 읽기
- 작성자만 수정/삭제: `request.auth.uid == resource.data.authorId`
- 관리자 권한: 특정 이메일 주소 체크

---

## 12. 특수 기능

### 마크다운 렌더링

**react-markdown 대신 커스텀 구현:**
```typescript
// 정규식 기반 마크다운 파싱
const processMarkdown = (text: string) => {
  // **텍스트** -> <strong>텍스트</strong>
  let html = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  
  // 줄바꿈 처리
  html = html.replace(/\n/g, '<br />');
  
  return html;
};

<div dangerouslySetInnerHTML={{ __html: processMarkdown(summary) }} />
```

### Google Translate 통합

**쿠키 기반 언어 전환:**
```typescript
const toggleLanguage = () => {
  if (!isTranslated) {
    document.cookie = `googtrans=/ko/en; path=/`;
    localStorage.setItem('boxro-translation', 'en');
    window.location.reload();
  }
};
```

### PDF 생성

**jsPDF:**
```typescript
import jsPDF from 'jspdf';

const generatePDF = () => {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });
  
  // 캔버스를 이미지로 변환
  const imgData = canvas.toDataURL('image/png');
  pdf.addImage(imgData, 'PNG', 0, 0, 210, 297); // A4 크기
  pdf.save('boxcar-design.pdf');
};
```

---

## 13. 디자인 패턴

### 컴포넌트 구조

```
src/
├── app/                    # Next.js 페이지
│   ├── layout.tsx         # 루트 레이아웃
│   ├── page.tsx           # 홈페이지
│   └── [feature]/        # 기능별 페이지
├── components/            # 재사용 컴포넌트
│   ├── ui/               # shadcn/ui 컴포넌트
│   ├── CommonHeader.tsx  # 공통 헤더
│   └── ...
├── contexts/             # Context API
├── hooks/                # 커스텀 훅
└── lib/                  # 유틸리티
```

### 컴포넌트 네이밍

- **Common**: 공통 컴포넌트 (CommonHeader, CommonFooter)
- **Page**: 페이지별 컴포넌트 (StoryPageClient)
- **UI**: shadcn/ui 기반 (Button, Card, Dialog)

### 상태 관리 전략

1. **전역 상태**: Context API (Auth, Language)
2. **서버 상태**: Firebase Firestore 직접 호출
3. **로컬 상태**: useState, useReducer
4. **캐시**: Window 객체 + localStorage

---

## 14. 최적화 기법

### 이미지 최적화

```typescript
import Image from 'next/image';

<Image
  src={thumbnail}
  alt={title}
  width={400}
  height={300}
  priority={index < 3}  // 첫 3개 이미지 우선 로드
  loading="lazy"        // 나머지는 지연 로드
  sizes="(max-width: 768px) 100vw, 50vw"
/>
```

### 번들 크기 최적화

- Dynamic Import로 큰 컴포넌트 분리
- Tree Shaking을 통한 불필요한 코드 제거
- Firebase의 모듈별 import (`firebase/firestore`, `firebase/auth`)

---

## 15. 테스트 및 품질 관리

### TypeScript

- 엄격한 타입 체크
- 인터페이스로 데이터 구조 명확화
- 제네릭 활용한 재사용성 향상

### ESLint

```json
// eslint.config.mjs
import { FlatCompat } from "@eslint/eslintrc";
import next from "eslint-config-next";
```

---

## 16. 배포

### Vercel 배포

**자동 배포:**
- GitHub 연동
- 환경변수 설정
- 빌드 최적화 자동 처리

**환경변수:**
- `NEXT_PUBLIC_SITE_URL`: 사이트 URL
- `NEXT_PUBLIC_FIREBASE_*`: Firebase 설정

---

이 문서는 BOXRO 박스로 프로젝트에서 사용된 모든 프론트엔드 기술과 구현 방법을 정리한 것입니다.

