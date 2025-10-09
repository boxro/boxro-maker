const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, doc, getDoc, deleteDoc, query, where } = require('firebase/firestore');

// Firebase 설정
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Firebase 초기화
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function cleanupOrphanedBoxroTalks() {
  console.log('🧹 고아 박스로톡 정리 시작...');
  
  let totalDeleted = 0;
  
  try {
    // 1. 갤러리 박스로톡 정리
    console.log('📸 갤러리 박스로톡 정리 중...');
    const galleryBoxroTalksQuery = query(collection(db, 'boxroTalks'));
    const galleryBoxroTalksSnapshot = await getDocs(galleryBoxroTalksQuery);
    
    for (const boxroTalkDoc of galleryBoxroTalksSnapshot.docs) {
      const boxroTalkData = boxroTalkDoc.data();
      if (boxroTalkData.designId) {
        const designDoc = await getDoc(doc(db, 'communityDesigns', boxroTalkData.designId));
        if (!designDoc.exists()) {
          console.log(`🗑️ 갤러리 고아 박스로톡 삭제: ${boxroTalkDoc.id} (designId: ${boxroTalkData.designId})`);
          await deleteDoc(boxroTalkDoc.ref);
          totalDeleted++;
        }
      }
    }
    
    // 2. 스토리 박스로톡 정리
    console.log('📖 스토리 박스로톡 정리 중...');
    const storyBoxroTalksQuery = query(collection(db, 'storyBoxroTalks'));
    const storyBoxroTalksSnapshot = await getDocs(storyBoxroTalksQuery);
    
    for (const boxroTalkDoc of storyBoxroTalksSnapshot.docs) {
      const boxroTalkData = boxroTalkDoc.data();
      if (boxroTalkData.articleId) {
        const articleDoc = await getDoc(doc(db, 'storyArticles', boxroTalkData.articleId));
        if (!articleDoc.exists()) {
          console.log(`🗑️ 스토리 고아 박스로톡 삭제: ${boxroTalkDoc.id} (articleId: ${boxroTalkData.articleId})`);
          await deleteDoc(boxroTalkDoc.ref);
          totalDeleted++;
        }
      }
    }
    
    // 3. 스토어 박스로톡 정리
    console.log('🛒 스토어 박스로톡 정리 중...');
    const storeBoxroTalksQuery = query(collection(db, 'storeBoxroTalks'));
    const storeBoxroTalksSnapshot = await getDocs(storeBoxroTalksQuery);
    
    for (const boxroTalkDoc of storeBoxroTalksSnapshot.docs) {
      const boxroTalkData = boxroTalkDoc.data();
      if (boxroTalkData.articleId) {
        const articleDoc = await getDoc(doc(db, 'storeItems', boxroTalkData.articleId));
        if (!articleDoc.exists()) {
          console.log(`🗑️ 스토어 고아 박스로톡 삭제: ${boxroTalkDoc.id} (articleId: ${boxroTalkData.articleId})`);
          await deleteDoc(boxroTalkDoc.ref);
          totalDeleted++;
        }
      }
    }
    
    console.log(`✅ 정리 완료! 총 ${totalDeleted}개의 고아 박스로톡이 삭제되었습니다.`);
    
  } catch (error) {
    console.error('❌ 정리 중 오류 발생:', error);
  }
}

// 스크립트 실행
cleanupOrphanedBoxroTalks();

