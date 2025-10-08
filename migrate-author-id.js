// 기존 갤러리 디자인에 authorId 필드 추가하는 마이그레이션 스크립트
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, updateDoc, doc, query, where } = require('firebase/firestore');

// Firebase 설정
const firebaseConfig = {
  // 여기에 실제 Firebase 설정을 넣어야 합니다
  // 또는 환경변수에서 가져오세요
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function migrateAuthorIds() {
  try {
    console.log('🔄 authorId 마이그레이션 시작...');
    
    // communityDesigns 컬렉션의 모든 문서 가져오기 (갤러리 디자인)
    const designsRef = collection(db, 'communityDesigns');
    const snapshot = await getDocs(designsRef);
    
    let updatedCount = 0;
    let skippedCount = 0;
    
    for (const designDoc of snapshot.docs) {
      const designData = designDoc.data();
      
      // authorId가 이미 있으면 스킵
      if (designData.authorId) {
        skippedCount++;
        continue;
      }
      
      // authorEmail이 있으면 해당 사용자의 UID 찾기
      if (designData.authorEmail) {
        try {
          // users 컬렉션에서 해당 이메일의 사용자 찾기
          const usersRef = collection(db, 'users');
          const userQuery = query(usersRef, where('email', '==', designData.authorEmail));
          const userSnapshot = await getDocs(userQuery);
          
          if (!userSnapshot.empty) {
            const userDoc = userSnapshot.docs[0];
            const userId = userDoc.id;
            
            // authorId 필드 추가
            await updateDoc(doc(db, 'communityDesigns', designDoc.id), {
              authorId: userId
            });
            
            console.log(`✅ ${designData.name} - authorId 추가됨: ${userId}`);
            updatedCount++;
          } else {
            console.log(`⚠️ ${designData.name} - 사용자를 찾을 수 없음: ${designData.authorEmail}`);
            skippedCount++;
          }
        } catch (error) {
          console.error(`❌ ${designData.name} 업데이트 실패:`, error);
          skippedCount++;
        }
      } else {
        console.log(`⚠️ ${designData.name} - authorEmail이 없음`);
        skippedCount++;
      }
    }
    
    console.log(`\n🎉 마이그레이션 완료!`);
    console.log(`✅ 업데이트된 디자인: ${updatedCount}개`);
    console.log(`⏭️ 스킵된 디자인: ${skippedCount}개`);
    
  } catch (error) {
    console.error('❌ 마이그레이션 실패:', error);
  }
}

// 스크립트 실행
migrateAuthorIds();




