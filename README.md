# BOXRO 박스로

**AI가 아이의 그림을 박스카 도안으로!** 🚗✨

아이가 자동차를 그리면, AI가 박스카 도안을 만들어주는 창작 플랫폼입니다. 디자인부터 조립, 공유까지 즐겁게 경험하세요.

## 🚀 주요 기능

### 1. AI 기반 박스카 도안 생성
- 아이의 그림을 AI가 분석하여 박스카 도안으로 변환
- 3D 미리보기로 완성된 박스카 확인
- PDF/PNG 형식으로 도안 다운로드

### 2. 창작 콘텐츠 관리
- **이야기**: 박스카와 관련된 창작 이야기 작성 및 공유 (마크다운 지원)
- **스토어**: 박스카 관련 상품 판매 및 도안 판매
- **유튜브**: 박스카 만들기 영상 등록 및 공유
- **갤러리**: 완성된 박스카 작품 사진 공유

### 3. 실시간 상호작용
- 해시 URL 기반 카드 네비게이션
- 랜덤 정렬 및 중복 방지
- 인덱싱 기반 빠른 카드 검색
- 카드 클릭 시 조회수 증가 및 상단 이동

### 4. 인증 및 사용자 관리
- Firebase Authentication
- Google 소셜 로그인
- 이메일/비밀번호 로그인
- 사용자 프로필 관리

### 5. 관리자 기능
- 통계 대시보드 (회원, 콘텐츠, 활동 내역)
- 사용자 통계 및 활동 내역 조회
- 콘텐츠 관리 및 모니터링

### 6. SEO 최적화
- 동적 사이트맵 생성
- 구조화된 데이터 (JSON-LD)
- Open Graph 및 Twitter Cards 지원
- 네이버 서치어드바이저 연동

### 7. PWA 지원
- 모바일 앱처럼 사용 가능
- 오프라인 지원
- 설치 프롬프트

## 🛠 기술 스택

### Frontend
- **Framework**: Next.js 15.5.0 (App Router)
- **Language**: TypeScript 5
- **UI Library**: React 19.1.0
- **Styling**: Tailwind CSS 4, shadcn/ui
- **Canvas**: Fabric.js 6.7.1
- **3D Rendering**: Three.js 0.179.1
- **Rich Text**: TipTap 3.5.1
- **Markdown**: react-markdown 10.1.0

### Backend & Services
- **Authentication**: Firebase Authentication
- **Database**: Cloud Firestore
- **Storage**: Firebase Storage
- **Deployment**: Vercel

### 기타
- **PDF Export**: jsPDF 3.0.3
- **Icons**: Lucide React 0.541.0
- **Drag & Drop**: @dnd-kit

## 📦 설치 및 실행

### 1. 프로젝트 클론
```bash
git clone https://github.com/boxro/boxro-maker.git
cd boxro-maker
```

### 2. 의존성 설치
```bash
npm install
```

### 3. 환경변수 설정

프로젝트 루트에 `.env.local` 파일을 생성하고 다음 환경변수를 설정하세요:

```env
# Firebase 설정
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id_here
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id_here
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id_here

# 사이트 URL (SEO 및 공유 링크용)
NEXT_PUBLIC_SITE_URL=https://boxro.kr
```

### 4. Firebase 설정

#### 4.1 Firebase 프로젝트 생성
1. [Firebase Console](https://console.firebase.google.com/)에서 새 프로젝트 생성
2. Authentication 활성화 (Google, Email/Password 제공업체 설정)
3. Firestore Database 생성
4. Storage 활성화
5. 웹 앱 추가하여 설정 정보 획득

#### 4.2 Firestore 보안 규칙 설정
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 사용자 디자인
    match /designs/{document} {
      allow read: if resource.data.isPublic == true || request.auth != null;
      allow write: if request.auth != null && request.auth.uid == resource.data.userId;
    }
    
    // 이야기 글
    match /storyArticles/{document} {
      allow read: if resource.data.isPublished == true;
      allow write: if request.auth != null;
    }
    
    // 스토어 아이템
    match /storeItems/{document} {
      allow read: if resource.data.isPublished == true;
      allow write: if request.auth != null;
    }
    
    // 유튜브 영상
    match /youtubeItems/{document} {
      allow read: if resource.data.isPublished == true;
      allow write: if request.auth != null;
    }
    
    // 갤러리 작품
    match /designs/{document} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

### 5. 개발 서버 실행
```bash
npm run dev
```

브라우저에서 `http://localhost:3000`으로 접속하세요.

## 📁 프로젝트 구조

```
src/
├── app/                    # Next.js App Router
│   ├── page.tsx           # 홈페이지
│   ├── draw/              # AI 박스카 도안 생성 페이지
│   ├── paper/             # 도안 출력 페이지
│   ├── community/         # 갤러리 페이지
│   ├── story/             # 이야기 페이지
│   │   ├── page.tsx       # 목록
│   │   ├── [id]/          # 상세 페이지
│   │   ├── write/         # 작성 페이지
│   │   └── edit/[id]/     # 수정 페이지
│   ├── store/             # 스토어 페이지
│   │   ├── page.tsx       # 목록
│   │   ├── [id]/          # 상세 페이지
│   │   ├── write/         # 작성 페이지
│   │   └── edit/[id]/     # 수정 페이지
│   ├── youtube/           # 유튜브 페이지
│   │   ├── page.tsx       # 목록
│   │   ├── write/         # 작성 페이지
│   │   └── edit/[id]/     # 수정 페이지
│   ├── admin/             # 관리자 페이지
│   ├── auth/              # 인증 페이지
│   ├── layout.tsx         # 루트 레이아웃 (SEO 메타데이터)
│   ├── sitemap.ts         # 동적 사이트맵 생성
│   └── robots.ts          # 검색엔진 크롤러 규칙
├── components/            # 재사용 가능한 컴포넌트
│   ├── ui/               # shadcn/ui 컴포넌트
│   ├── CommonHeader.tsx  # 공통 헤더
│   ├── CommonFooter.tsx # 공통 푸터
│   ├── ThreeDRenderer.tsx # 3D 미리보기
│   └── ...
├── contexts/             # React 컨텍스트
│   ├── AuthContext.tsx  # 인증 컨텍스트
│   ├── LanguageContext.tsx # 다국어 컨텍스트
│   └── StoryContext.tsx # 이야기 컨텍스트
├── hooks/                # 커스텀 훅
│   └── useScrollLock.ts  # 스크롤 잠금 훅
└── lib/                  # 유틸리티 및 설정
    ├── firebase.ts       # Firebase 설정
    ├── carShapeAnalyzer.ts # 차량 형태 분석
    ├── carTemplateMapper.ts # 템플릿 매핑
    └── ...
```

## 🚀 배포 (Vercel)

### 1. Vercel 프로젝트 생성
```bash
npx vercel
```

### 2. 환경변수 설정
Vercel 대시보드에서 프로젝트 설정으로 이동하여 다음 환경변수를 추가하세요:

**필수 환경변수:**
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `NEXT_PUBLIC_SITE_URL` (프로덕션 도메인, 예: `https://boxro.kr`)

### 3. 배포
```bash
npm run build
npx vercel --prod
```

## 🎯 주요 기능 상세

### AI 박스카 도안 생성
1. 그림 그리기: 캔버스에 자동차 그리기
2. AI 분석: 그린 그림을 AI가 분석하여 차종 추천
3. 3D 미리보기: 완성될 박스카를 3D로 미리보기
4. 도안 다운로드: PDF 또는 PNG 형식으로 다운로드

### 콘텐츠 관리
- **마크다운 지원**: 이야기 설명에 마크다운 문법 사용 가능
- **카드 배경색 커스터마이징**: 각 카드의 배경색 선택 가능
- **해시 URL 네비게이션**: `#card-{id}` 형식으로 특정 카드 바로가기
- **랜덤 정렬**: 일반 목록은 랜덤 정렬로 다양성 제공

### SEO 최적화
- 동적 사이트맵 (`/sitemap.xml`)
- 구조화된 데이터 (JSON-LD)
- Open Graph 메타 태그
- Twitter Cards
- 네이버 서치어드바이저 연동

## 📝 사용법

1. **계정 생성/로그인**: Google 계정 또는 이메일로 로그인
2. **그림 그리기**: "그리기" 메뉴에서 자동차 그림 그리기
3. **AI 변환**: AI가 그림을 분석하여 박스카 도안 생성
4. **공유**: 갤러리에 작품 업로드하여 친구들과 공유
5. **콘텐츠 작성**: 이야기, 스토어, 유튜브 영상 등록 및 관리

## 🛡 보안 및 개인정보

- Firebase Authentication으로 안전한 인증
- Firestore 보안 규칙으로 데이터 접근 제어
- 개인정보 처리방침 페이지 (`/privacy`)
- 이용약관 페이지 (`/terms`)

## 📄 라이선스

MIT License

## 🌐 관련 링크

- **사이트**: https://boxro.kr
- **GitHub**: https://github.com/boxro/boxro-maker

## 📞 문의

프로젝트 관련 문의사항은 GitHub Issues를 통해 남겨주세요.

---

**BOXRO 박스로** - 아이의 상상을 현실로 만들어가는 창작 플랫폼 🚗✨
