const admin = require('firebase-admin');

// Firebase Admin SDK 초기화
admin.initializeApp();

const db = admin.firestore();

async function cleanupAllThumbnailFields() {
  console.log('🧹 모든 컬렉션의 중복 thumbnail 필드 정리 시작...');

  try {
    let totalCleanedCount = 0;

    // 1. storyArticles 컬렉션 정리
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
    totalCleanedCount += storyCleanedCount;

    // 2. homeCards 컬렉션 정리
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
    totalCleanedCount += homeCardsCleanedCount;

    // 3. banners 컬렉션 정리
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
    totalCleanedCount += bannersCleanedCount;

    // 4. youtubeItems 컬렉션 정리
    console.log('📺 youtubeItems 컬렉션 정리 중...');
    const youtubeItemsRef = db.collection('youtubeItems');
    const youtubeItemsSnapshot = await youtubeItemsRef.get();
    
    let youtubeItemsCleanedCount = 0;
    const youtubeItemsBatch = db.batch();
    
    youtubeItemsSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.thumbnail && data.cardThumbnail) {
        console.log(`📋 유튜브 ID: ${doc.id} - thumbnail 필드 제거`);
        youtubeItemsBatch.update(doc.ref, {
          thumbnail: admin.firestore.FieldValue.delete()
        });
        youtubeItemsCleanedCount++;
      }
    });
    
    if (youtubeItemsCleanedCount > 0) {
      await youtubeItemsBatch.commit();
      console.log(`✅ youtubeItems 정리 완료: ${youtubeItemsCleanedCount}개 문서에서 thumbnail 필드 제거`);
    }
    totalCleanedCount += youtubeItemsCleanedCount;

    // 5. storeItems 컬렉션 정리
    console.log('🛒 storeItems 컬렉션 정리 중...');
    const storeItemsRef = db.collection('storeItems');
    const storeItemsSnapshot = await storeItemsRef.get();
    
    let storeItemsCleanedCount = 0;
    const storeItemsBatch = db.batch();
    
    storeItemsSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.thumbnail && data.cardThumbnail) {
        console.log(`📋 스토어 ID: ${doc.id} - thumbnail 필드 제거`);
        storeItemsBatch.update(doc.ref, {
          thumbnail: admin.firestore.FieldValue.delete()
        });
        storeItemsCleanedCount++;
      }
    });
    
    if (storeItemsCleanedCount > 0) {
      await storeItemsBatch.commit();
      console.log(`✅ storeItems 정리 완료: ${storeItemsCleanedCount}개 문서에서 thumbnail 필드 제거`);
    }
    totalCleanedCount += storeItemsCleanedCount;

    console.log(`\n🎉 전체 정리 완료!`);
    console.log(`- 정리된 문서: ${totalCleanedCount}개`);
    console.log(`- 예상 절약 용량: ${totalCleanedCount * 400}KB`);
    
  } catch (error) {
    console.error('❌ 정리 중 오류 발생:', error);
  }
}

cleanupAllThumbnailFields().catch(console.error);
