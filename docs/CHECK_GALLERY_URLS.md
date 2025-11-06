# Firebase 데이터베이스에서 /gallery URL 확인 방법

## 방법 1: 관리자 페이지에서 확인 (가장 간단) ⭐

1. **관리자 페이지 접속**
   - `https://boxro.kr/admin` 접속
   - 관리자 계정으로 로그인

2. **배너 관리 확인**
   - 관리자 페이지에서 "배너 관리" 탭 선택
   - 각 배너의 URL 필드를 확인
   - `/gallery`로 시작하거나 포함하는 URL을 찾아서 수정

3. **홈카드 관리 확인**
   - 관리자 페이지에서 "홈카드 관리" 탭 선택
   - 각 홈카드의 URL 필드를 확인
   - `/gallery`로 시작하거나 포함하는 URL을 찾아서 수정

4. **수정 방법**
   - 발견된 항목의 "수정" 버튼 클릭
   - URL 필드에서 `/gallery`를 `/community`로 변경
   - 저장

---

## 방법 2: Firebase 콘솔에서 확인

1. **Firebase 콘솔 접속**
   - https://console.firebase.google.com 접속
   - 프로젝트 선택

2. **Firestore Database 확인**
   - 왼쪽 메뉴에서 "Firestore Database" 선택

3. **컬렉션 확인**
   - `banners` 컬렉션 확인
   - `homeCards` 컬렉션 확인
   - 각 문서의 `url` 필드에서 `/gallery` 검색

4. **수정**
   - 해당 문서 선택
   - `url` 필드 수정: `/gallery` → `/community`
   - 저장

---

## 방법 3: 브라우저 콘솔에서 확인 (개발자용)

1. **관리자 페이지 접속**
   - `https://boxro.kr/admin` 접속
   - 브라우저 개발자 도구 열기 (F12)

2. **콘솔에서 실행**
   - Console 탭에서 아래 코드 실행:

```javascript
// Firebase에서 /gallery URL 확인
(async function() {
  const { collection, getDocs, query, orderBy } = await import('firebase/firestore');
  const { db } = await import('/src/lib/firebase');
  
  console.log('🔍 Firebase에서 /gallery URL 검색 중...\n');
  
  const collections = ['banners', 'homeCards'];
  let totalFound = 0;
  const foundItems = [];
  
  for (const collectionName of collections) {
    console.log(`\n📦 ${collectionName} 컬렉션 확인 중...`);
    
    try {
      const q = query(collection(db, collectionName), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      let found = 0;
      
      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        const url = data.url;
        
        if (url && url.includes('/gallery')) {
          found++;
          totalFound++;
          
          const item = {
            collection: collectionName,
            id: doc.id,
            title: data.title || data.cardTitle || '제목 없음',
            currentUrl: url,
            newUrl: url.replace(/\/gallery/g, '/community')
          };
          
          foundItems.push(item);
          
          console.log(`  ✨ 발견: ${collectionName}/${doc.id}`);
          console.log(`     제목: ${item.title}`);
          console.log(`     현재 URL: ${url}`);
          console.log(`     변경될 URL: ${item.newUrl}`);
        }
      });
      
      console.log(`  📊 ${collectionName}: ${found}개 발견`);
    } catch (error) {
      console.error(`  ❌ ${collectionName} 확인 실패:`, error);
    }
  }
  
  console.log(`\n📈 총계: ${totalFound}개 발견`);
  
  if (totalFound > 0) {
    console.table(foundItems);
  }
})();
```

---

## 추천 방법

**방법 1 (관리자 페이지)**을 추천합니다. 가장 간단하고 안전하며, 바로 수정할 수 있습니다.

