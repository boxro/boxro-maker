/**
 * Firebase에 저장된 /gallery URL을 확인하고 /community로 업데이트하는 스크립트
 * 
 * 사용법:
 * 1. Firebase 프로젝트 설정 확인
 * 2. node scripts/check-gallery-urls.js 실행
 * 
 * 주의: 실제 업데이트를 원하면 UPDATE_MODE = true로 변경
 */

const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json'); // Firebase Admin SDK 키 파일 필요

// 실제 업데이트 모드 (false면 확인만, true면 업데이트)
const UPDATE_MODE = false;

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function checkAndUpdateGalleryUrls() {
  console.log('🔍 Firebase에서 /gallery URL 검색 중...\n');
  
  const collections = ['banners', 'homeCards'];
  let totalFound = 0;
  let totalUpdated = 0;

  for (const collectionName of collections) {
    console.log(`\n📦 ${collectionName} 컬렉션 확인 중...`);
    
    try {
      const snapshot = await db.collection(collectionName).get();
      let found = 0;
      let updated = 0;

      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        const url = data.url;

        // /gallery로 시작하는 URL 찾기
        if (url && (url.includes('/gallery') || url.startsWith('/gallery'))) {
          found++;
          totalFound++;
          
          console.log(`  ✨ 발견: ${collectionName}/${doc.id}`);
          console.log(`     현재 URL: ${url}`);
          
          // /gallery를 /community로 교체
          const newUrl = url.replace(/\/gallery/g, '/community');
          console.log(`     변경될 URL: ${newUrl}`);

          if (UPDATE_MODE) {
            db.collection(collectionName).doc(doc.id).update({
              url: newUrl
            }).then(() => {
              updated++;
              totalUpdated++;
              console.log(`     ✅ 업데이트 완료`);
            }).catch((error) => {
              console.error(`     ❌ 업데이트 실패:`, error);
            });
          } else {
            console.log(`     ⚠️  확인 모드 - 업데이트하지 않음`);
          }
        }
      });

      console.log(`  📊 ${collectionName}: ${found}개 발견`);
      if (UPDATE_MODE) {
        console.log(`  ✅ ${collectionName}: ${updated}개 업데이트`);
      }
    } catch (error) {
      console.error(`  ❌ ${collectionName} 확인 실패:`, error);
    }
  }

  console.log(`\n📈 총계:`);
  console.log(`  발견된 /gallery URL: ${totalFound}개`);
  if (UPDATE_MODE) {
    console.log(`  업데이트된 URL: ${totalUpdated}개`);
  } else {
    console.log(`  ⚠️  확인 모드 - 실제 업데이트하려면 UPDATE_MODE = true로 변경`);
  }

  if (totalFound === 0) {
    console.log(`\n✨ Firebase 데이터베이스에 /gallery URL이 없습니다!`);
  }

  process.exit(0);
}

checkAndUpdateGalleryUrls().catch((error) => {
  console.error('❌ 스크립트 실행 실패:', error);
  process.exit(1);
});

