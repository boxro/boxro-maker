// Firebase Console → Functions에서 실행하거나
// 로컬에서 실행할 수 있는 스크립트

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc } from 'firebase/firestore';

const firebaseConfig = {
  // 여기에 실제 Firebase 설정 입력
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function fixAuthorIds() {
  try {
    // 1. communityDesigns 컬렉션의 모든 문서 가져오기
    const communityDesigns = await getDocs(collection(db, 'communityDesigns'));
    
    console.log(`총 ${communityDesigns.size}개의 갤러리 디자인을 확인합니다.`);
    
    // 2. 각 문서에 authorId 추가
    for (const designDoc of communityDesigns.docs) {
      const data = designDoc.data();
      
      // authorId가 없는 경우에만 추가
      if (!data.authorId && data.authorEmail) {
        // authorEmail을 기반으로 UID 찾기 (실제로는 다른 방법 필요)
        // 임시로 authorEmail을 authorId로 설정
        await updateDoc(doc(db, 'communityDesigns', designDoc.id), {
          authorId: data.authorEmail // 임시 해결책
        });
        
        console.log(`디자인 ${designDoc.id}에 authorId 추가: ${data.authorEmail}`);
      }
    }
    
    console.log('모든 authorId 추가 완료!');
  } catch (error) {
    console.error('오류 발생:', error);
  }
}

// 실행
fixAuthorIds();









