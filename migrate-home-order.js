const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, updateDoc, doc, query, where, orderBy } = require('firebase/firestore');

// Firebase 설정
const firebaseConfig = {
  // 여기에 실제 Firebase 설정을 입력하세요
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};

// Firebase 초기화
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function migrateHomeOrder() {
  try {
    console.log('홈카드 순서 마이그레이션 시작...');
    
    // showOnHome이 true인 모든 문서 가져오기
    const articlesQuery = query(
      collection(db, 'storyArticles'),
      where('showOnHome', '==', true),
      orderBy('createdAt', 'desc')
    );
    
    const articlesSnapshot = await getDocs(articlesQuery);
    const articles = articlesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    console.log(`총 ${articles.length}개의 홈카드를 찾았습니다.`);
    
    // 각 문서에 homeOrder 필드 추가
    const updates = articles.map((article, index) => {
      const homeOrder = index + 1;
      console.log(`문서 ${article.id}에 homeOrder ${homeOrder} 할당...`);
      
      return updateDoc(doc(db, 'storyArticles', article.id), {
        homeOrder: homeOrder
      });
    });
    
    await Promise.all(updates);
    console.log('홈카드 순서 마이그레이션 완료!');
    
  } catch (error) {
    console.error('마이그레이션 실패:', error);
  }
}

// 스크립트 실행
migrateHomeOrder();






