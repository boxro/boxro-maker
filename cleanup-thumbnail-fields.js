const admin = require('firebase-admin');

// Firebase Admin SDK 초기화 (서비스 계정 키 필요)
// const serviceAccount = require('./path/to/your/serviceAccountKey.json');
// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount)
// });

// 또는 환경변수 사용
admin.initializeApp();

const db = admin.firestore();

async function cleanupThumbnailFields() {
  console.log('🧹 사용하지 않는 thumbnail 필드 정리 시작...');

  try {
    // 1. storyArticles 컬렉션에서 thumbnail 필드 제거
    console.log('📝 storyArticles 컬렉션 정리 중...');
    const storyArticlesRef = db.collection('storyArticles');
    const storySnapshot = await storyArticlesRef.get();
    
    let storyCleanedCount = 0;
    const storyBatch = db.batch();
    
    storySnapshot.forEach(doc => {
      const data = doc.data();
      if (data.thumbnail && data.cardThumbnail) {
        console.log(`📋 이야기 ID: ${doc.id} - thumbnail 필드 제거`);
        storyBatch.update(doc.ref, {
          thumbnail: admin.firestore.FieldValue.delete()
        });
        storyCleanedCount++;
      }
    });
    
    if (storyCleanedCount > 0) {
      await storyBatch.commit();
      console.log(`✅ storyArticles 정리 완료: ${storyCleanedCount}개 문서에서 thumbnail 필드 제거`);
    }

    // 2. homeCards 컬렉션에서 thumbnail 필드 제거
    console.log('🏠 homeCards 컬렉션 정리 중...');
    const homeCardsRef = db.collection('homeCards');
    const homeCardsSnapshot = await homeCardsRef.get();
    
    let homeCardsCleanedCount = 0;
    const homeCardsBatch = db.batch();
    
    homeCardsSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.thumbnail && data.cardThumbnail) {
        console.log(`📋 홈카드 ID: ${doc.id} - thumbnail 필드 제거`);
        homeCardsBatch.update(doc.ref, {
          thumbnail: admin.firestore.FieldValue.delete()
        });
        homeCardsCleanedCount++;
      }
    });
    
    if (homeCardsCleanedCount > 0) {
      await homeCardsBatch.commit();
      console.log(`✅ homeCards 정리 완료: ${homeCardsCleanedCount}개 문서에서 thumbnail 필드 제거`);
    }

    // 3. banners 컬렉션에서 thumbnail 필드 제거
    console.log('🎯 banners 컬렉션 정리 중...');
    const bannersRef = db.collection('banners');
    const bannersSnapshot = await bannersRef.get();
    
    let bannersCleanedCount = 0;
    const bannersBatch = db.batch();
    
    bannersSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.thumbnail && data.cardThumbnail) {
        console.log(`📋 배너 ID: ${doc.id} - thumbnail 필드 제거`);
        bannersBatch.update(doc.ref, {
          thumbnail: admin.firestore.FieldValue.delete()
        });
        bannersCleanedCount++;
      }
    });
    
    if (bannersCleanedCount > 0) {
      await bannersBatch.commit();
      console.log(`✅ banners 정리 완료: ${bannersCleanedCount}개 문서에서 thumbnail 필드 제거`);
    }

    const totalCleaned = storyCleanedCount + homeCardsCleanedCount + bannersCleanedCount;
    console.log(`\n🎉 전체 정리 완료!`);
    console.log(`- 정리된 문서: ${totalCleaned}개`);
    console.log(`- 예상 절약 용량: ${totalCleaned * 400}KB`);
    
  } catch (error) {
    console.error('❌ 정리 중 오류 발생:', error);
  }
}

cleanupThumbnailFields().catch(console.error);
