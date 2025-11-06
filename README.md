# 박스로 Boxro

**AI가 아이의 그림을 박스카 도안으로!** 🚗✨

아이가 자동차를 그리면, AI가 박스카 도안을 만들어주는 창작 플랫폼입니다. 디자인부터 조립, 공유까지 즐겁게 경험하세요.

## 🚀 주요 기능

### 1. AI 기반 박스카 도안 생성
- 아이의 그림을 AI가 분석하여 박스카 도안으로 변환
- 3D 미리보기로 완성된 박스카 확인
- PDF/PNG 형식으로 도안 다운로드

### 2. 창작 콘텐츠 관리
- **커뮤니티 (갤러리)**: 완성된 박스카 작품 사진 공유 및 소통
- **박스카 이야기**: 박스카와 관련된 창작 이야기 작성 및 공유 (마크다운 지원)
- **Boxro 스토어**: 박스카 관련 상품 판매 및 도안 판매
- **Boxro 유튜브**: 박스카 만들기 영상 등록 및 공유
- **Boxro 프렌즈**: Boxro의 부캐릭터들과 함께하는 프로젝트 소개

### 3. 실시간 상호작용
- **해시 URL 기반 카드 네비게이션**: `#card-{id}` 형식으로 특정 카드 바로가기
- **클라이언트 사이드 인덱싱**: 빠른 카드 검색 및 중복 방지
- **카드 상호작용**: 클릭 시 조회수 증가 및 상단 이동
- **소셜 기능**: 좋아요, 공유, 박스로 톡 (커뮤니티, 이야기, 스토어, 유튜브)
- **동적 외부 링크**: Friends 페이지에서 다중 외부 링크 버튼 (커스텀 라벨 및 색상)

### 4. 인증 및 사용자 관리
- Firebase Authentication
- Google 소셜 로그인
- 이메일/비밀번호 로그인
- 사용자 프로필 관리

### 5. 관리자 기능
- **통계 대시보드**: 회원 통계, 콘텐츠 통계, 활동 내역 (사용자 활동 합산 기준)
  - 회원 통계: 활성/비활성 회원, PWA 설치 수
  - 콘텐츠 통계: 좋아요, 공유, 조회수, 박스로 톡, 다운로드 수
  - 활동 내역: 개별 사용자의 상세 활동 내역 조회
- **콘텐츠 관리**: 배너, 홈카드, 인기 콘텐츠 관리
- **이용약관 관리**: 버전별 이용약관 관리

### 6. SEO 최적화
- **동적 사이트맵 생성**: 정적 페이지 + 카드 해시 URL 자동 생성 (`/sitemap.xml`)
- **구조화된 데이터 (JSON-LD)**: 검색 엔진 최적화
- **메타데이터**: Open Graph 및 Twitter Cards 지원
- **파비콘 최적화**: 다양한 크기의 파비콘 및 절대 URL 설정
- **리디렉션 규칙**: 영구 리디렉션 (308)으로 검색 엔진 색인 최적화
- **robots.txt**: 검색 엔진 크롤러 규칙 설정
- **네이버 서치어드바이저**: 네이버 검색 등록

### 7. PWA 지원
- 모바일 앱처럼 사용 가능
- 오프라인 지원
- 설치 프롬프트 및 설치 통계 추적
- 서비스 워커 자동 업데이트

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
`firestore.rules` 파일을 참고하여 설정하세요. 주요 컬렉션:

- `communityDesigns`: 커뮤니티 작품
- `storyArticles`: 박스카 이야기
- `storeItems`: 스토어 아이템
- `youtubeItems`: 유튜브 영상
- `friendsItems`: Boxro 프렌즈
- `storyBoxroTalks`, `galleryBoxroTalks`, `storeBoxroTalks`, `youtubeBoxroTalks`: 박스로 톡
- `banners`: 배너 관리
- `homeCards`: 홈카드 관리
- `pwaInstalls`: PWA 설치 추적

자세한 보안 규칙은 `firestore.rules` 파일을 참고하세요.

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
│   ├── community/         # 커뮤니티 (갤러리) 페이지
│   │   └── page.tsx       # 해시 URL 기반 카드 네비게이션
│   ├── story/             # 박스카 이야기 페이지
│   │   ├── page.tsx       # 목록 (StoryPageClient)
│   │   ├── write/         # 작성 페이지
│   │   └── edit/[id]/     # 수정 페이지
│   ├── store/             # Boxro 스토어 페이지
│   │   ├── page.tsx       # 목록 (StorePageClient)
│   │   ├── write/         # 작성 페이지
│   │   └── edit/[id]/     # 수정 페이지
│   ├── youtube/           # Boxro 유튜브 페이지
│   │   ├── page.tsx       # 목록 (YoutubePageClient)
│   │   ├── write/         # 작성 페이지
│   │   └── edit/[id]/     # 수정 페이지
│   ├── friends/           # Boxro 프렌즈 페이지
│   │   ├── page.tsx       # 목록 (FriendsPageClient)
│   │   ├── write/         # 작성 페이지
│   │   └── edit/[id]/     # 수정 페이지
│   ├── admin/             # 관리자 페이지
│   ├── auth/              # 인증 페이지
│   ├── layout.tsx         # 루트 레이아웃 (SEO 메타데이터, 파비콘)
│   ├── sitemap.ts         # 동적 사이트맵 생성
│   └── robots.ts          # 검색엔진 크롤러 규칙
├── components/            # 재사용 가능한 컴포넌트
│   ├── ui/               # shadcn/ui 컴포넌트
│   ├── admin/            # 관리자 전용 컴포넌트
│   │   ├── AdminDashboard.tsx
│   │   ├── BannerManagement.tsx
│   │   ├── HomeCardManagement.tsx
│   │   └── ...
│   ├── CommonHeader.tsx  # 공통 헤더
│   ├── CommonFooter.tsx # 공통 푸터
│   ├── CommonBackground.tsx # 공통 배경
│   ├── ThreeDRenderer.tsx # 3D 미리보기
│   ├── BannerDisplay.tsx # 배너 표시
│   ├── OnboardingTutorial.tsx # 온보딩 가이드
│   └── ...
├── contexts/             # React 컨텍스트
│   ├── AuthContext.tsx  # 인증 컨텍스트
│   ├── LanguageContext.tsx # 다국어 컨텍스트
│   └── StoryContext.tsx # 이야기 컨텍스트
├── hooks/                # 커스텀 훅
│   └── useScrollLock.ts  # 스크롤 잠금 훅 (모달용)
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
- **해시 URL 네비게이션**: `#card-{id}` 형식으로 특정 카드 바로가기
  - 모든 카드 페이지는 해시 URL 기반으로 동작
  - 사이트맵에 카드 해시 URL 자동 포함
- **마크다운 지원**: 이야기 설명에 마크다운 문법 사용 가능
- **카드 커스터마이징**: 배경색, 텍스트 색상, 텍스트 위치 등
- **동적 외부 링크**: Friends 페이지에서 다중 외부 링크 버튼 지원
- **정렬 방식**: 
  - 커뮤니티, 스토어, 유튜브: 랜덤 정렬
  - Friends: 생성일 기준 내림차순 정렬

### SEO 최적화
- **동적 사이트맵**: 정적 페이지 + 모든 카드 해시 URL 자동 생성
- **메타데이터**: 
  - 사이트 이름: "박스로 Boxro"
  - Open Graph 메타 태그
  - Twitter Cards
  - Canonical URL
- **파비콘 최적화**: 다양한 크기 지원 및 절대 URL 설정
- **리디렉션 규칙**: `/gallery` → `/community` (영구 리디렉션 308)
- **robots.txt**: 리디렉션 경로 크롤링 방지
- **네이버 서치어드바이저**: 네이버 검색 등록

## 📝 사용법

1. **계정 생성/로그인**: Google 계정 또는 이메일로 로그인
2. **그림 그리기**: "그리기" 메뉴에서 자동차 그림 그리기
3. **AI 변환**: AI가 그림을 분석하여 박스카 도안 생성
4. **공유**: 커뮤니티(갤러리)에 작품 업로드하여 친구들과 공유
5. **콘텐츠 작성**: 이야기, 스토어, 유튜브 영상, 프렌즈 등록 및 관리
6. **소통**: 박스로 톡으로 작품에 대한 의견 공유

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

**박스로 Boxro** - 아이의 상상을 현실로 만들어가는 창작 플랫폼 🚗✨

---

## 📚 추가 문서

- [Firebase /gallery URL 확인 방법](./docs/CHECK_GALLERY_URLS.md)

## 🔄 최근 업데이트

- ✅ `/gallery` → `/community` 경로 변경 (영구 리디렉션)
- ✅ Friends 페이지 추가 (Boxro의 부캐릭터 소개)
- ✅ 관리자 통계 계산 방식 통일 (사용자 활동 합산 기준)
- ✅ 파비콘 최적화 (구글 검색 결과 표시)
- ✅ SEO 최적화 (리디렉션, robots.txt, 사이트맵)
