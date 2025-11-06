/**
 * 브라우저 콘솔에서 실행할 수 있는 /gallery URL 확인 스크립트
 * 
 * 사용법:
 * 1. 관리자 페이지(/admin)에서 로그인
 * 2. 브라우저 개발자 도구(F12) 열기
 * 3. Console 탭에서 아래 코드 복사 후 붙여넣기
 */

// Firebase에서 배너와 홈카드의 /gallery URL 확인
(async function() {
  console.log('🔍 Firebase에서 /gallery URL 검색 중...\n');
  
  const { collection, getDocs, query, orderBy } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
  
  // Firebase 초기화 확인 (이미 페이지에서 초기화되어 있어야 함)
  if (typeof window === 'undefined' || !window.firebase || !window.firebase.db) {
    console.error('❌ Firebase가 초기화되지 않았습니다. 관리자 페이지에서 실행해주세요.');
    return;
  }
  
  const db = window.firebase.db;
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
        
        // /gallery로 시작하거나 포함하는 URL 찾기
        if (url && (url.includes('/gallery') || url.startsWith('/gallery'))) {
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
  
  console.log(`\n📈 총계:`);
  console.log(`  발견된 /gallery URL: ${totalFound}개`);
  
  if (totalFound === 0) {
    console.log(`\n✨ Firebase 데이터베이스에 /gallery URL이 없습니다!`);
  } else {
    console.log(`\n📋 발견된 항목 목록:`);
    console.table(foundItems);
    
    console.log(`\n💡 업데이트 방법:`);
    console.log(`   관리자 페이지의 배너 관리 또는 홈카드 관리에서`);
    console.log(`   각 항목을 수정하여 URL을 /community로 변경하세요.`);
  }
})();

