# Boxro Maker

아이들을 위한 박스카 블루프린트 디자인 플랫폼입니다. 드래그 앤 드롭으로 쉽게 디자인하고, 친구들과 공유해보세요!

## 기술 스택

- **Frontend**: Next.js 14, TypeScript, TailwindCSS, shadcn/ui
- **Backend**: Firebase (Authentication, Firestore, Storage)
- **Canvas**: Fabric.js
- **PDF Export**: jsPDF
- **Deployment**: Vercel

## 주요 기능

### 1. 캔버스 에디터
- 드래그 앤 드롭으로 도형 추가 (사각형, 원)
- 도형 크기 조절, 복사, 삭제
- 줌 인/아웃 기능
- 그리드 시스템으로 정확한 배치

### 2. 저장 및 공유
- Firebase Firestore에 디자인 저장
- 공개/비공개 설정
- 공유 링크 생성
- 내 디자인 목록 관리

### 3. 인증 시스템
- Firebase Authentication
- Google 로그인
- 이메일/비밀번호 로그인

### 4. 내보내기
- PDF 다운로드 (A4 사이즈, 고품질)
- PNG 이미지 다운로드

### 5. 사용법 가이드
- 슬라이드 다운 패널
- 단계별 사용법 안내

## 설치 및 실행

### 1. 프로젝트 클론
```bash
git clone <repository-url>
cd boxro-maker
```

### 2. 의존성 설치
```bash
npm install
```

### 3. Firebase 설정

#### 3.1 Firebase 프로젝트 생성
1. [Firebase Console](https://console.firebase.google.com/)에서 새 프로젝트 생성
2. Authentication 활성화 (Google, Email/Password 제공업체 설정)
3. Firestore Database 생성 (테스트 모드로 시작)
4. 웹 앱 추가하여 설정 정보 획득

#### 3.2 환경변수 설정
프로젝트 루트에 `.env.local` 파일을 생성하고 Firebase 설정 정보를 입력하세요:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id_here
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id_here
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id_here
```

#### 3.3 Firestore 보안 규칙 설정
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // designs 컬렉션 규칙
    match /designs/{document} {
      // 로그인한 사용자만 읽기/쓰기 가능
      allow read, write: if request.auth != null;
      
      // 공개 디자인은 누구나 읽기 가능
      allow read: if resource.data.isPublic == true;
      
      // 사용자는 자신의 디자인만 수정/삭제 가능
      allow update, delete: if request.auth != null && 
        request.auth.uid == resource.data.userId;
    }
  }
}
```

### 4. 개발 서버 실행
```bash
npm run dev
```

브라우저에서 `http://localhost:3000`으로 접속하세요.

## 프로젝트 구조

```
src/
├── app/                    # Next.js 앱 라우터
│   ├── auth/              # 인증 페이지
│   ├── editor/            # 에디터 페이지
│   ├── my-designs/        # 내 디자인 목록
│   ├── design/[id]/       # 공유 디자인 보기
│   └── globals.css        # 전역 스타일
├── components/            # 재사용 가능한 컴포넌트
│   ├── ui/               # shadcn/ui 컴포넌트
│   ├── Header.tsx        # 네비게이션 헤더
│   └── CanvasEditor.tsx  # 캔버스 에디터
├── contexts/             # React 컨텍스트
│   └── AuthContext.tsx   # 인증 컨텍스트
└── lib/                  # 유틸리티 및 설정
    ├── firebase.ts       # Firebase 설정
    ├── pdfExport.ts      # PDF 내보내기 유틸리티
    └── utils.ts          # 일반 유틸리티
```

## 배포 (Vercel)

### 1. Vercel 프로젝트 생성
```bash
npx vercel
```

### 2. 환경변수 설정
Vercel 대시보드에서 프로젝트 설정으로 이동하여 환경변수를 추가하세요:
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

### 3. 배포
```bash
npx vercel --prod
```

## 사용법

1. **계정 생성/로그인**: Google 계정 또는 이메일로 로그인
2. **디자인 시작**: "디자인 시작하기" 버튼 클릭
3. **도형 추가**: 좌측 도구 패널에서 도형을 선택하여 캔버스에 드래그
4. **편집**: 도형을 클릭하여 선택하고 크기 조절, 복사, 삭제
5. **저장**: "저장" 버튼으로 디자인을 Firestore에 저장
6. **공유**: 공개 설정 후 공유 링크 생성
7. **내보내기**: PDF 또는 PNG 형식으로 다운로드

## 개발 노트

- Fabric.js를 사용하여 캔버스 조작 구현
- Firebase Firestore로 실시간 데이터 저장
- jsPDF로 고품질 PDF 내보내기
- shadcn/ui로 일관된 UI 컴포넌트
- TypeScript로 타입 안정성 보장

## 라이선스

MIT License