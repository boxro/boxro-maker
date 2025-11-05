"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { collection, getDocs, doc, deleteDoc, query, orderBy, updateDoc, increment, arrayUnion, where, addDoc, getDoc, limit, startAfter } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useScrollLock } from "@/hooks/useScrollLock";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import ErrorModal from "@/components/ErrorModal";
import { Plus, Menu, X, Edit, Trash2, MoreVertical, Play, LinkIcon, Mail, MessageSquare, ExternalLink, Store } from "lucide-react";
import CommonHeader from "@/components/CommonHeader";
import PageHeader from "@/components/PageHeader";
import CommonBackground from "@/components/CommonBackground";
import BannerDisplay from "@/components/BannerDisplay";

// 관리자 이메일 목록
const ADMIN_EMAILS = [
  'admin@boxro.com',
  'dongwoo@boxro.com'
];

// 관리자 권한 확인 함수
const isAdmin = (userEmail?: string) => {
  return userEmail && ADMIN_EMAILS.includes(userEmail);
};

interface StoryArticle {
  id: string;
  title: string;
  content: string;
  author: string;
  authorEmail: string;
  authorId: string;
  thumbnail: string;
  summary: string;
  tags: string[];
  views: number;
  likes: number;
  shares: number;
  isLiked?: boolean;
  likedBy?: string[];
  isShared?: boolean;
  sharedBy?: string[];
  isViewed?: boolean;
  viewedBy?: string[];
  isPublished: boolean;
  createdAt: any;
  updatedAt: any;
  // 홈 카드 관련 필드들
  showOnHome?: boolean;
  cardTitle?: string;
  cardDescription?: string;
  cardThumbnail?: string;
  cardTitleColor?: string;
  cardDescriptionColor?: string;
  titleColor?: string;
  summaryColor?: string;
  cardBackgroundColor?: string;
  viewTopImage?: string;
  // 유튜브 관련 필드들
  storeUrl?: string; // 하위 호환성을 위해 유지
  externalLinks?: Array<{
    label: string;
    url: string;
    color: string;
  }>;
  popularityBoost?: {
    likes?: number;
    shares?: number;
  };
}

// 프로필 이미지 컴포넌트
const ProfileImage = ({ authorId, authorName, authorEmail, size = "w-8 h-8" }: { 
  authorId: string; 
  authorName: string; 
  authorEmail?: string;
  size?: string;
}) => {
  const { user } = useAuth();
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        let userDoc = null;
        
        // 현재 사용자와 작성자가 같은 경우 현재 사용자 정보 우선 사용 (로그인된 경우만)
        if (user && (authorId === user.uid || authorEmail === user.email)) {
          // 현재 사용자의 customPhotoURL을 확인
          try {
            const currentUserRef = doc(db, 'users', user.uid);
            const currentUserDoc = await getDoc(currentUserRef);
            if (currentUserDoc.exists()) {
              const currentUserData = currentUserDoc.data();
              setProfileData({
                photoURL: currentUserData.customPhotoURL || user.photoURL,
                displayName: user.displayName
              });
            } else {
              setProfileData({
                photoURL: user.photoURL,
                displayName: user.displayName
              });
            }
          } catch (error) {
            setProfileData({
              photoURL: user.photoURL,
              displayName: user.displayName
            });
          }
          setLoading(false);
          return;
        }
        
        // authorId가 있으면 직접 조회
        if (authorId) {
          try {
            userDoc = await getDoc(doc(db, 'users', authorId));
          } catch (error: any) {
            if (error.code === 'permission-denied') {
              console.log('🔧 Firebase 보안 규칙 설정 대기 중 - authorId 조회 건너뜀');
            } else {
              throw error;
            }
          }
        } else if (authorEmail) {
          try {
            // authorId가 없으면 authorEmail로 사용자 찾기
            const usersRef = collection(db, 'users');
            const userQuery = query(usersRef, where('email', '==', authorEmail));
            const userSnapshot = await getDocs(userQuery);
            
            if (!userSnapshot.empty) {
              userDoc = userSnapshot.docs[0];
            }
          } catch (error: any) {
            if (error.code === 'permission-denied') {
              console.log('🔧 Firebase 보안 규칙 설정 대기 중 - authorEmail 조회 건너뜀');
            } else {
              throw error;
            }
          }
        } else if (authorName && authorName !== 'Anonymous') {
          try {
            // authorId와 authorEmail이 모두 없으면 authorName으로 사용자 찾기
            const usersRef = collection(db, 'users');
            const userQuery = query(usersRef, where('displayName', '==', authorName));
            const userSnapshot = await getDocs(userQuery);
            
            if (!userSnapshot.empty) {
              userDoc = userSnapshot.docs[0];
            }
          } catch (error: any) {
            if (error.code === 'permission-denied') {
              console.log('🔧 Firebase 보안 규칙 설정 대기 중 - authorName 조회 건너뜀');
            } else {
              throw error;
            }
          }
        }
        
        if (userDoc && userDoc.exists()) {
          const data = userDoc.data();
          setProfileData({
            photoURL: data.customPhotoURL || data.photoURL,
            displayName: data.displayName
          });
        }
      } catch (error) {
        console.warn('프로필 정보 가져오기 실패:', error);
        setProfileData(null);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [authorId, authorEmail, authorName, user]);

  if (loading) {
    return (
      <div className={`${size} rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0`}>
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
      </div>
    );
  }

  if (profileData?.photoURL) {
    // Base64 이미지인지 확인
    const isBase64 = profileData.photoURL.startsWith('data:image/');
    
    return (
      <img 
        src={isBase64 ? profileData.photoURL : `https://images.weserv.nl/?url=${encodeURIComponent(profileData.photoURL)}&w=40&h=40&fit=cover&output=webp`}
        alt={authorName}
        className={`${size} rounded-full object-cover flex-shrink-0`}
      />
    );
  }

  // 이니셜 생성 함수
  const getInitials = (name: string, email?: string) => {
    // 이메일이 있으면 이메일의 첫 글자 사용
    if (email) return email.charAt(0).toUpperCase();
    if (name && name !== 'Anonymous') return name.split(' ').map(word => word.charAt(0)).join('').toUpperCase().slice(0, 2);
    return '?';
  };

  // 프로필 색상 생성 함수
  const getProfileColor = (name: string) => {
    const colors = [
      'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500',
      'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500'
    ];
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  return (
    <div className={`${size} ${getProfileColor(authorName)} rounded-full flex items-center justify-center flex-shrink-0`}>
      <span className="text-white text-xs font-medium">
        {getInitials(authorName, authorEmail)}
      </span>
    </div>
  );
};


export default function FriendsPageClient() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [articles, setArticles] = useState<StoryArticle[]>([]);
  const router = useRouter();
  const [selectedArticle, setSelectedArticle] = useState<StoryArticle | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastDoc, setLastDoc] = useState<any>(null);
  
  // 오류 모달 상태
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  const [isClient, setIsClient] = useState(false);
  
  // 삭제 확인 모달 상태
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteArticleId, setDeleteArticleId] = useState<string | null>(null);

  // 관리자 이메일 목록
  const adminEmails = [
    "beagle3651@gmail.com",
    "boxro.crafts@gmail.com"
  ];

  // 관리자 권한 확인
  useEffect(() => {
    if (user && adminEmails.includes(user.email || "")) {
      setIsAdminUser(true);
    } else {
      setIsAdminUser(false);
    }
  }, [user]);


  // 전역 중복 실행 방지 ref
  const isFetchingRef = useRef(false);
  const isHashLoadingRef = useRef(false);
  const hasInitializedRef = useRef(false);
  const isStrictModeRef = useRef(false);
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // 전역 인덱싱 캐시 (사용자와 무관)
  if (typeof window !== 'undefined') {
    (window as any).__friendsIndexCache = (window as any).__friendsIndexCache || new Map();
    (window as any).__friendsIndexLoaded = (window as any).__friendsIndexLoaded || false;
  }

  // 인덱싱 생성 (한 번만, 전역)
  const createIndex = async () => {
    if (typeof window !== 'undefined' && (window as any).__friendsIndexLoaded) {
      console.log('📚 인덱싱 이미 로드됨, 전역 캐시 사용');
      return;
    }
    
    try {
      console.log('📚 인덱싱 생성 시작');
      const articlesRef = collection(db, 'friendsItems');
      const q = query(articlesRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      // 인덱싱 정보만 저장 (전역)
      const indexInfo = new Map();
      let index = 0;
      querySnapshot.forEach((doc) => {
        console.log(`📝 인덱싱 저장: ${doc.id} -> ${index}`);
        indexInfo.set(doc.id, { id: doc.id, index });
        index++;
      });
      
      // 전역 변수에 저장
      if (typeof window !== 'undefined') {
        (window as any).__friendsIndexCache = indexInfo;
        (window as any).__friendsIndexLoaded = true;
      }
      
      console.log('📚 인덱싱 생성 완료, 총 카드 수:', indexInfo.size);
    } catch (error) {
      console.error('인덱싱 생성 실패:', error);
    }
  };

  // Boxro 프렌즈 글 목록 가져오기
  const fetchArticles = async () => {
    if (isFetchingRef.current) {
      console.log('🔄 fetchArticles 중복 실행 방지');
      return;
    }
    
    // URL 해시가 있으면 로딩 상태 유지
    const hash = typeof window !== 'undefined' ? window.location.hash : '';
    const hasHash = hash && hash.startsWith('#card-');
    
    try {
      isFetchingRef.current = true;
      
      // 로딩 상태 설정
      setLoading(true);
      setArticles([]);
      setHasMore(true);
      
      // 인덱싱이 없으면 먼저 생성
      if (typeof window !== 'undefined' && !(window as any).__friendsIndexLoaded) {
        await createIndex();
      }
      
      const articlesRef = collection(db, 'friendsItems');
      const q = query(articlesRef, orderBy('createdAt', 'desc'), limit(15));
      const querySnapshot = await getDocs(q);
      
      // URL 해시 확인하여 초기 정렬
      const currentHash = typeof window !== 'undefined' ? window.location.hash : '';
      console.log('🔍 URL 해시 확인:', { 
        currentHash, 
        hasHash: currentHash && currentHash.startsWith('#card-'),
        fullUrl: typeof window !== 'undefined' ? window.location.href : ''
      });
      
      if (currentHash && currentHash.startsWith('#card-')) {
        const cardId = currentHash.replace('#card-', '');
        
        // 전역 인덱싱 정보에서 해당 카드 찾기
        const cardInfo = typeof window !== 'undefined' ? (window as any).__friendsIndexCache.get(cardId) : null;
        console.log('🔍 전역 인덱싱에서 카드 찾기:', { 
          cardId, 
          cardInfo, 
          indexCacheSize: typeof window !== 'undefined' ? (window as any).__friendsIndexCache.size : 0,
          allKeys: typeof window !== 'undefined' ? Array.from((window as any).__friendsIndexCache.keys()) : []
        });
        
        if (cardInfo) {
          console.log('🎯 인덱싱에서 해시 카드 발견, 해당 카드 포함하여 로드');
          
          // 해당 카드가 포함된 범위를 로드
          const endIndex = Math.min(cardInfo.index + 15, (window as any).__friendsIndexCache.size);
          
          // 해당 범위의 카드들만 로드
          const articlesRef = collection(db, 'friendsItems');
          const q = query(articlesRef, orderBy('createdAt', 'desc'), limit(endIndex));
          const querySnapshot = await getDocs(q);
          
          // 해당 카드를 찾아서 첫 번째로 배치
          const targetDoc = querySnapshot.docs.find(doc => doc.id === cardId);
          if (targetDoc) {
            const targetData = targetDoc.data();
            const targetCard = {
              id: targetDoc.id,
              ...targetData,
              isLiked: user ? (targetData.likedBy?.includes(user.uid) || false) : false,
              isShared: user ? (targetData.sharedBy?.includes(user.uid) || false) : false,
              isViewed: user ? (targetData.viewedBy?.includes(user.uid) || false) : false
            } as StoryArticle;
            
            // 나머지 카드들도 로드 (최대 14개)
            const otherCards: StoryArticle[] = [];
            querySnapshot.docs.forEach((doc) => {
              if (doc.id !== cardId && otherCards.length < 14) {
                const data = doc.data();
                otherCards.push({
                  id: doc.id,
                  ...data,
                  isLiked: user ? (data.likedBy?.includes(user.uid) || false) : false,
                  isShared: user ? (data.sharedBy?.includes(user.uid) || false) : false,
                  isViewed: user ? (data.viewedBy?.includes(user.uid) || false) : false
                } as StoryArticle);
              }
            });
            
            // 특정 카드를 첫 번째로 배치하고 나머지는 생성일 기준 내림차순으로 배치
            const sortedOtherCards = otherCards.sort((a, b) => {
              const aTime = a.createdAt?.toDate?.() || a.createdAt || new Date(0);
              const bTime = b.createdAt?.toDate?.() || b.createdAt || new Date(0);
              return bTime.getTime() - aTime.getTime();
            });
            const reorderedArticles = [targetCard, ...sortedOtherCards];
            setArticles(reorderedArticles);
            
            console.log('✅ 해시 카드 첫 번째 배치 완료, 총 카드 수:', reorderedArticles.length);
          } else {
            // 일반 로딩으로 fallback
            const articlesData: StoryArticle[] = [];
            querySnapshot.docs.slice(0, 15).forEach((doc) => {
              const data = doc.data();
              articlesData.push({
                id: doc.id,
                ...data,
                isLiked: user ? (data.likedBy?.includes(user.uid) || false) : false,
                isShared: user ? (data.sharedBy?.includes(user.uid) || false) : false,
                isViewed: user ? (data.viewedBy?.includes(user.uid) || false) : false
              } as StoryArticle);
            });
            setArticles(articlesData);
          }
        } else {
          console.log('❌ 인덱싱에서 해시 카드를 찾을 수 없음, 직접 검색 시도');
          // 인덱싱에서 찾지 못한 경우 직접 검색
          const targetDoc = querySnapshot.docs.find(doc => doc.id === cardId);
          if (targetDoc) {
            console.log('🎯 직접 검색으로 해시 카드 발견');
            const targetData = targetDoc.data();
            const targetCard = {
              id: targetDoc.id,
              ...targetData,
              isLiked: user ? (targetData.likedBy?.includes(user.uid) || false) : false,
              isShared: user ? (targetData.sharedBy?.includes(user.uid) || false) : false,
              isViewed: user ? (targetData.viewedBy?.includes(user.uid) || false) : false
            } as StoryArticle;
            
            // 나머지 카드들도 로드
            const otherCards: StoryArticle[] = [];
            querySnapshot.docs.forEach((doc) => {
              if (doc.id !== cardId) {
                const data = doc.data();
                otherCards.push({
                  id: doc.id,
                  ...data,
                  isLiked: user ? (data.likedBy?.includes(user.uid) || false) : false,
                  isShared: user ? (data.sharedBy?.includes(user.uid) || false) : false,
                  isViewed: user ? (data.viewedBy?.includes(user.uid) || false) : false
                } as StoryArticle);
              }
            });
            
            // 특정 카드를 첫 번째로 배치하고 나머지는 생성일 기준 내림차순으로 배치
            const sortedOtherCards = otherCards.sort((a, b) => {
              const aTime = a.createdAt?.toDate?.() || a.createdAt || new Date(0);
              const bTime = b.createdAt?.toDate?.() || b.createdAt || new Date(0);
              return bTime.getTime() - aTime.getTime();
            });
            const reorderedArticles = [targetCard, ...sortedOtherCards];
            setArticles(reorderedArticles);
          } else {
            console.log('❌ 직접 검색에서도 해시 카드를 찾을 수 없음, 일반 로딩');
            // 일반 로딩
            const articlesData: StoryArticle[] = [];
            querySnapshot.docs.slice(0, 15).forEach((doc) => {
              const data = doc.data();
              articlesData.push({
                id: doc.id,
                ...data,
                isLiked: user ? (data.likedBy?.includes(user.uid) || false) : false,
                isShared: user ? (data.sharedBy?.includes(user.uid) || false) : false,
                isViewed: user ? (data.viewedBy?.includes(user.uid) || false) : false
              } as StoryArticle);
            });
            setArticles(articlesData);
          }
        }
      } else {
        // 일반 로딩 (생성일 기준 내림차순)
        const articlesRef = collection(db, 'friendsItems');
        const q = query(articlesRef, orderBy('createdAt', 'desc'), limit(15));
        const querySnapshot = await getDocs(q);
        
        const articlesData: StoryArticle[] = [];
        querySnapshot.docs.forEach((doc) => {
          const data = doc.data();
          articlesData.push({
            id: doc.id,
            ...data,
            isLiked: user ? (data.likedBy?.includes(user.uid) || false) : false,
            isShared: user ? (data.sharedBy?.includes(user.uid) || false) : false,
            isViewed: user ? (data.viewedBy?.includes(user.uid) || false) : false
          } as StoryArticle);
        });
        
        // 생성일 기준 내림차순으로 정렬 (Firebase에서 이미 정렬되었지만 확실히 하기 위해)
        setArticles(articlesData);
      }
      
      // 마지막 문서 저장
      if (querySnapshot.docs.length > 0) {
        setLastDoc(querySnapshot.docs[querySnapshot.docs.length - 1]);
      }
      
      // 더 이상 데이터가 없으면 hasMore를 false로 설정
      if (querySnapshot.docs.length < 15) {
        setHasMore(false);
      } else {
        // 15개 이상이면 더 로드할 수 있음
        setHasMore(true);
      }
    } catch (error) {
      console.error('Boxro 프렌즈 글 목록 로드 실패:', error);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  };

  // 해시를 위한 더 많은 글 로드
  const loadMoreArticlesForHash = async (targetCardId: string) => {
    if (isHashLoadingRef.current) {
      console.log('🔄 loadMoreArticlesForHash 중복 실행 방지');
      return;
    }
    
    try {
      isHashLoadingRef.current = true;
      const articlesRef = collection(db, 'friendsItems');
      const q = query(articlesRef, orderBy('createdAt', 'desc'), limit(50)); // 더 많이 로드
      const querySnapshot = await getDocs(q);
      
      const articlesData: StoryArticle[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        articlesData.push({
          id: doc.id,
          ...data,
          isLiked: user ? (data.likedBy?.includes(user.uid) || false) : false,
          isShared: user ? (data.sharedBy?.includes(user.uid) || false) : false,
          isViewed: user ? (data.viewedBy?.includes(user.uid) || false) : false
        } as StoryArticle);
      });
      
      // 인덱스 생성하여 빠른 검색
      const index = new Map();
      articlesData.forEach((article, articleIndex) => {
        index.set(article.id, { article, index: articleIndex });
      });
      
      const cardData = index.get(targetCardId);
      
      if (cardData) {
        const { article: targetCard } = cardData;
        console.log('🎯 해시 카드 발견, 재정렬하여 표시');
        const otherCards = articlesData.filter(article => article.id !== targetCardId);
        // 나머지 카드들은 생성일 기준 내림차순으로 정렬
        const sortedOtherCards = otherCards.sort((a, b) => {
          const aTime = a.createdAt?.toDate?.() || a.createdAt || new Date(0);
          const bTime = b.createdAt?.toDate?.() || b.createdAt || new Date(0);
          return bTime.getTime() - aTime.getTime();
        });
        const reorderedArticles = [targetCard, ...sortedOtherCards];
        setArticles(reorderedArticles);
        
        // 마지막 문서 저장
        if (querySnapshot.docs.length > 0) {
          setLastDoc(querySnapshot.docs[querySnapshot.docs.length - 1]);
        }
        
        // 하이라이트 효과는 useEffect에서 처리하므로 여기서는 제거
      } else {
        console.log('❌ 해시 카드를 찾을 수 없음, 일반 정렬');
        setArticles(articlesData);
      }
    } catch (error) {
      console.error('해시 카드 로드 실패:', error);
      setArticles([]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setHasMore(true); // 해시 카드를 찾지 못했을 때 무한 스크롤 가능하도록
      isHashLoadingRef.current = false;
    }
  };

  // 더 많은 글 로드
  const loadMoreArticles = async () => {
    if (!hasMore || loadingMore) return;
    
    try {
      setLoadingMore(true);
      
      const articlesRef = collection(db, 'friendsItems');
      const q = query(
        articlesRef, 
        orderBy('createdAt', 'desc'), 
        startAfter(lastDoc),
        limit(15)
      );
      const querySnapshot = await getDocs(q);
      
      const newArticles: StoryArticle[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        newArticles.push({
          id: doc.id,
          ...data,
          isLiked: user ? (data.likedBy?.includes(user.uid) || false) : false,
          isShared: user ? (data.sharedBy?.includes(user.uid) || false) : false,
          isViewed: user ? (data.viewedBy?.includes(user.uid) || false) : false
        } as StoryArticle);
      });
      
      // 새로 로드된 카드들을 생성일 기준 내림차순으로 추가 (Firebase에서 이미 정렬되었지만 확실히 하기 위해)
      setArticles(prev => [...prev, ...newArticles]);
      
      // 마지막 문서 업데이트
      if (querySnapshot.docs.length > 0) {
        setLastDoc(querySnapshot.docs[querySnapshot.docs.length - 1]);
      }
      
      // 더 이상 데이터가 없으면 hasMore를 false로 설정
      if (querySnapshot.docs.length < 15) {
        setHasMore(false);
      }
    } catch (error) {
      console.error('더 많은 글 로드 실패:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  // 삭제 확인 모달 열기
  const openDeleteModal = (id: string) => {
    setDeleteArticleId(id);
    setShowDeleteModal(true);
  };

  // 삭제 확인 모달 닫기
  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setDeleteArticleId(null);
  };

  // 글 삭제
  const deleteArticle = async () => {
    if (!user || !deleteArticleId) {
      return;
    }

    try {
      // 게시물 삭제
      await deleteDoc(doc(db, 'friendsItems', deleteArticleId));
      setArticles(articles.filter(article => article.id !== deleteArticleId));
      
      // 해시 URL이 있는 경우 제거하고 일반 목록으로 리다이렉트
      if (typeof window !== 'undefined' && window.location.hash) {
        console.log('🗑️ 해시 URL이 있는 상태에서 카드 삭제, 해시 제거 후 리다이렉트');
        window.history.replaceState(null, '', window.location.pathname);
        // 해시 변경 이벤트 발생시켜서 일반 목록으로 전환
        window.dispatchEvent(new HashChangeEvent('hashchange'));
      }
      
      closeDeleteModal();
    } catch (error) {
      console.error('삭제 실패:', error);
      setErrorMessage('삭제 중 오류가 발생했습니다.');
      setShowErrorModal(true);
    }
  };



  useEffect(() => {
    // 클라이언트 사이드 체크
    setIsClient(true);
  }, []);

  useEffect(() => {
    // 컴포넌트 마운트 시에만 실행
    if (hasInitializedRef.current) {
      return;
    }
    
    hasInitializedRef.current = true;
    fetchArticles();
  }, [user]);

  // 스크롤 이벤트 리스너
  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + document.documentElement.scrollTop >= document.documentElement.offsetHeight - 1000) {
        loadMoreArticles();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [hasMore, loadingMore, lastDoc, loadMoreArticles]);

  // 드롭다운 메뉴 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('[data-dropdown]')) {
        const menus = document.querySelectorAll('[id^="menu-"]');
        menus.forEach(menu => {
          menu.classList.add('hidden');
        });
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  // 카드 ID 인덱스 생성 (성능 최적화)
  const cardIndex = useMemo(() => {
    console.log('🔄 cardIndex 생성 시작, articles 수:', articles.length);
    const index = new Map();
    articles.forEach((article, articleIndex) => {
      console.log(`📝 인덱스 추가: ${article.id} -> ${articleIndex}`);
      index.set(article.id, { article, index: articleIndex });
    });
    console.log('✅ cardIndex 생성 완료, 총 인덱스 수:', index.size);
    return index;
  }, [articles]);

  // 해시 카드 처리 함수
  const processHashCard = useCallback((forceReload = false) => {
    const hash = typeof window !== 'undefined' ? window.location.hash : '';
    console.log('🔍 processHashCard 실행:', { hash, articlesLength: articles.length });
    
    // 해시가 없으면 아무것도 하지 않음
    if (!hash || !hash.startsWith('#card-')) {
      console.log('ℹ️ 해시가 없음, 현재 순서 유지');
      return;
    }
    
    const cardId = hash.replace('#card-', '');
    console.log('🎯 카드 ID 추출:', { cardId });
    
    // 해시 카드를 첫 번째로 재배치
    const targetCard = articles.find(article => article.id === cardId);
    if (targetCard) {
      console.log('🔄 해시 카드 재배치 시작');
      const otherCards = articles.filter(article => article.id !== cardId);
      const reorderedArticles = [targetCard, ...otherCards];
      setArticles(reorderedArticles);
      console.log('✅ 해시 카드 첫 번째로 재배치 완료');
      
      // 즉시 스크롤 위치 복원
      requestAnimationFrame(() => {
        window.scrollTo(0, 0);
      });
    } else {
      if (forceReload) {
        console.log('❌ 해시 카드가 현재 목록에 없음, 데이터 재로드 필요');
        // 해시 카드가 현재 목록에 없으면 fetchArticles() 호출하여 해당 카드 포함하여 로드
        fetchArticles();
        return;
      } else {
        console.log('❌ 해시 카드가 현재 목록에 없음, 현재 순서 유지');
        // 같은 페이지에서 카드 클릭 시에는 아무것도 하지 않음 (순서 유지)
        return;
      }
    }
    
    // 하이라이트 효과 (지연 시간 증가) - 한 번만 실행
    setTimeout(() => {
      console.log('🎨 하이라이트 효과 시작');
      
      const cardElement = document.getElementById(`card-${cardId}`);
      if (cardElement) {
        console.log('✅ 카드 엘리먼트 찾음, 스타일 적용');
        // 초기 스타일 설정
        cardElement.style.border = '6px solid #ffaa00';
        cardElement.style.transform = 'scale(1.04)';
        cardElement.style.transition = 'all 0.3s ease';
        cardElement.style.zIndex = '1000';
        
        // 깜박이는 효과
        let blinkCount = 0;
        const blinkInterval = setInterval(() => {
          if (blinkCount % 2 === 0) {
            cardElement.style.border = '6px solid #ffaa00';
          } else {
            cardElement.style.border = '6px solid rgba(255, 170, 0, 0.3)';
          }
          blinkCount++;
          
          if (blinkCount >= 8) { // 4번 깜박임 (8번 토글)
            clearInterval(blinkInterval);
            
            // 바로 원위치로 돌아가기
            setTimeout(() => {
              cardElement.style.border = '';
              cardElement.style.transform = '';
              cardElement.style.zIndex = '';
              cardElement.style.transition = '';
            }, 500);
          }
        }, 300);
      } else {
        console.log('❌ 카드 엘리먼트를 찾을 수 없음:', `card-${cardId}`);
        // DOM이 준비될 때까지 재시도
        setTimeout(() => {
          const retryElement = document.getElementById(`card-${cardId}`);
          if (retryElement) {
            console.log('✅ 재시도로 카드 엘리먼트 찾음');
            // 하이라이트 효과 적용
            retryElement.style.border = '6px solid #ffaa00';
            retryElement.style.transform = 'scale(1.04)';
            retryElement.style.transition = 'all 0.3s ease';
            retryElement.style.zIndex = '1000';
            
            // 깜박임 효과
            let blinkCount = 0;
            const blinkInterval = setInterval(() => {
              if (blinkCount % 2 === 0) {
                retryElement.style.border = '6px solid #ffaa00';
              } else {
                retryElement.style.border = '6px solid rgba(255, 170, 0, 0.3)';
              }
              blinkCount++;
              
              if (blinkCount >= 8) {
                clearInterval(blinkInterval);
                setTimeout(() => {
                  retryElement.style.border = '';
                  retryElement.style.transform = '';
                  retryElement.style.zIndex = '';
                  retryElement.style.transition = '';
                  console.log('🎨 재시도 하이라이트 효과 완료');
                }, 500);
              }
            }, 300);
          }
        }, 1000);
      }
    }, 500); // 지연 시간을 500ms로 복원
  }, [articles]);

  // articles가 로드된 후에만 해시 확인
  useEffect(() => {
    // articles가 없으면 실행하지 않음
    if (articles.length === 0) {
      return;
    }

    console.log('🔍 URL 해시 처리 useEffect 실행:', { 
      articlesLength: articles.length, 
      hash: typeof window !== 'undefined' ? window.location.hash : '',
      firstArticleId: articles[0]?.id 
    });

    // articles가 로드된 후에만 해시 확인 (강제 재로드 허용)
    processHashCard(true);
  }, [articles.length]); // articles 길이가 변경될 때만 실행

  // 해시 변경 이벤트 리스너
  useEffect(() => {
    const handleHashChange = () => {
      console.log('🔄 해시 변경 이벤트 발생');
      const currentHash = typeof window !== 'undefined' ? window.location.hash : '';
      console.log('🔍 현재 해시:', { currentHash, articlesLength: articles.length });
      
      // 해시가 제거된 경우 (일반 목록으로 이동)
      if (!currentHash || !currentHash.startsWith('#card-')) {
        console.log('🔄 해시 제거됨, 일반 목록으로 재로드');
        fetchArticles();
        return;
      }
      
      // 해시가 있는 경우 - 기존 데이터에서 재배치만 수행 (강제 재로드 허용)
      console.log('🔄 해시 있음, 기존 데이터에서 재배치');
      processHashCard(true);
    };
    
    window.addEventListener('hashchange', handleHashChange);
    
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []); // 한 번만 실행

  console.log('FriendsPageClient render:', { loading, articlesCount: articles.length });

  // 로딩 상태 완전 제거 (화면 반짝임 방지)
  // if (loading) {
  //   return (
  //     <CommonBackground>
  //       <CommonHeader />
  //       <div className="max-w-7xl mx-auto px-4 md:px-8">
  //         <div className="mt-10 px-0 md:px-0">
  //           <PageHeader 
  //             title="Boxro 프렌즈"
  //             description="박스카와 함께하는 즐거운 영상들을 만나보세요!"
  //           />
  //         </div>
  //         <Card className="bg-transparent border-0 shadow-none transition-all duration-300 overflow-hidden py-5 w-full rounded-2xl">
  //           <CardContent className="text-center py-12">
  //             {/* 점프 애니메이션 (더 역동적인 뛰는 효과) */}
  //             <div className="w-24 h-24 mx-auto mb-6 flex items-center justify-center">
  //               <img 
  //                 src="/logo_remoteonly.png" 
  //                 alt="박스로 로고" 
  //                 className="w-20 h-20 animate-bounce"
  //                 style={{ 
  //                   animationDuration: '0.6s',
  //                   animationIterationCount: 'infinite',
  //                   animationTimingFunction: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)'
  //                 }}
  //               />
  //             </div>
  //             <h3 className="text-lg font-semibold text-white mb-2">
  //               Boxro 프렌즈를 불러오는 중...
  //             </h3>
  //             <p className="text-sm text-white/80">멋진 박스카 영상들을 준비하고 있어요!</p>
  //           </CardContent>
  //         </Card>
  //       </div>
  //     </CommonBackground>
  //   );
  // }

  if (loading) {
    return (
      <CommonBackground>
        <CommonHeader />
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="mt-10 px-0 md:px-0">
            <PageHeader 
              title="Boxro 프렌즈"
              description="Boxro의 부캐릭터들을 만나보세요."
            />
          </div>
          <Card className="bg-transparent border-0 shadow-none transition-all duration-300 overflow-hidden py-5 w-full rounded-2xl">
            <CardContent className="text-center py-12">
              {/* 점프 애니메이션 (더 역동적인 뛰는 효과) */}
              <div className="w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                <img 
                  src="/logo_remoteonly.png" 
                  alt="박스로 로고" 
                  className="w-20 h-20 animate-bounce"
                  style={{ 
                    animationDuration: '0.6s',
                    animationIterationCount: 'infinite',
                    animationTimingFunction: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)'
                  }}
                />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Boxro 프렌즈를 불러오는 중...
              </h3>
              <p className="text-sm text-white/80">Boxro의 부캐릭터들을 준비하고 있어요! ✨</p>
            </CardContent>
          </Card>
        </div>
      </CommonBackground>
    );
  }

  return (
    <CommonBackground>
      <CommonHeader />
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="mt-10 px-0 md:px-0">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <PageHeader 
                title="Boxro 프렌즈"
                description="Boxro의 부캐릭터들을 만나보세요."
              />
            </div>
            {user && isAdminUser && (
              <div className="hidden sm:flex gap-3">
                <Button
                  onClick={() => router.push('/friends/write')}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white transition-all duration-200 rounded-full px-8 py-3"
                  style={{fontSize: '14px'}}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  새 프렌즈 등록하기
                </Button>
              </div>
            )}
          </div>
        </div>
        
        {isClient && articles.length === 0 && !window.location.hash.startsWith('#card-') ? (
          <Card className="bg-white border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden py-5 w-full rounded-2xl">
            <CardContent className="text-center py-12">
              <Plus className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-800 mb-2">앗, 아직 프렌즈가 없네요!</h3>
              <p className="text-sm text-gray-800 mb-6">
                곧 멋진 프렌즈들이 찾아올 거예요 ✨
              </p>
            </CardContent>
          </Card>
        ) : isClient && articles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {/* 링크된 카드가 없을 때만 배너 표시 */}
            {isClient && !window.location.hash.startsWith('#card-') && <BannerDisplay currentPage="friends" />}
            
            {articles.filter((article, index, self) => 
              index === self.findIndex(a => a.id === article.id)
            ).map((article, index) => (
              <div 
                key={`${article.id}-${index}`} 
                id={`card-${article.id}`}
                className="group shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden w-full rounded-2xl relative cursor-pointer flex flex-col"
                style={{ backgroundColor: article.cardBackgroundColor || 'rgba(255, 255, 255, 0.97)' }}
              >
                {/* 썸네일 */}
                {article.thumbnail && (
                  <div className="w-full overflow-hidden">
                    <img 
                      src={article.thumbnail} 
                      alt={article.title}
                      className="w-full h-auto object-contain transition-transform duration-300 group-hover:scale-[1.03]"
                    />
                  </div>
                )}
                
                {/* 수정/삭제 버튼 */}
                {user && (user.uid === article.authorId || user.email === article.authorEmail || isAdminUser) && (
                  <div className="absolute top-2 right-2 flex gap-1 z-10">
                    <Button
                      variant="outline"
                      className="w-8 h-8 rounded-full p-0 bg-white/90 hover:bg-white text-gray-500 hover:text-gray-800 border border-gray-200 hover:border-gray-300 shadow-lg"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        router.push(`/friends/edit/${article.id}`);
                      }}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      className="w-8 h-8 rounded-full p-0 bg-white/90 hover:bg-white text-gray-500 hover:text-red-600 border border-gray-200 hover:border-red-300 shadow-lg"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        openDeleteModal(article.id);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}

                {/* 제목, 요약 */}
                <div className="px-7 py-4 flex-1 flex flex-col">
                  <h3 
                    className="text-lg font-bold mb-2 mt-1 text-gray-900"
                    style={{
                      display: '-webkit-box',
                      WebkitLineClamp: 1,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      lineHeight: '1.4',
                      maxHeight: '1.4em'
                    }}
                  >
                    {article.title}
                  </h3>
                  
                  {article.summary && (
                    <div
                      className="text-[15px] mb-3 whitespace-pre-wrap flex-1"
                      style={{ color: '#000000', lineHeight: '1.6' }}
                      dangerouslySetInnerHTML={{
                        __html: article.summary
                          .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold">$1</strong>')
                          .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
                          .replace(/~~(.*?)~~/g, '<del class="line-through">$1</del>')
                          .replace(/\n/g, '<br>')
                      }}
                    />
                  )}
                  
                  {/* 외부 링크 버튼들 */}
                  {((article.externalLinks && article.externalLinks.length > 0) || article.storeUrl) && (
                    <div className="mb-3 flex flex-col gap-2">
                      {/* 새로운 externalLinks 배열 사용 */}
                      {article.externalLinks && article.externalLinks.length > 0 ? (
                        article.externalLinks.map((link, linkIndex) => {
                          const isMailto = link.url.toLowerCase().startsWith('mailto:');
                          return (
                            <a
                              key={linkIndex}
                              href={link.url}
                              {...(!isMailto && { target: "_blank", rel: "noopener noreferrer" })}
                              onClick={(e) => {
                                e.stopPropagation();
                              }}
                              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-white rounded-full transition-colors text-sm font-medium"
                              style={{ backgroundColor: link.color }}
                              onMouseEnter={(e) => {
                                const rgb = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(link.color);
                                if (rgb) {
                                  const r = parseInt(rgb[1], 16);
                                  const g = parseInt(rgb[2], 16);
                                  const b = parseInt(rgb[3], 16);
                                  const darker = `rgb(${Math.max(0, r - 20)}, ${Math.max(0, g - 20)}, ${Math.max(0, b - 20)})`;
                                  e.currentTarget.style.backgroundColor = darker;
                                }
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = link.color;
                              }}
                            >
                              {link.label}
                            </a>
                          );
                        })
                      ) : (
                        // 하위 호환성: 기존 storeUrl이 있는 경우
                        article.storeUrl && (
                          <a
                            href={article.storeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                      onClick={(e) => {
                        e.stopPropagation();
                            }}
                            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-white rounded-full transition-colors text-sm font-medium"
                            style={{ backgroundColor: '#6366f1' }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#4f46e5'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#6366f1'}
                          >
                            외부 링크 보기
                          </a>
                        )
                      )}
                  </div>
                  )}
                  
                  
                  
                </div>
              </div>
            ))}
          </div>
        ) : !isClient ? (
          <div className="flex justify-center items-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-600">로딩 중...</p>
            </div>
          </div>
        ) : null}

        {/* 모바일 플로팅 메뉴 - 항상 펼쳐진 상태 */}
        {user && isAdminUser && (
          <div className="fixed bottom-6 right-6 z-40 md:hidden">
            <div className="flex flex-col gap-3 mb-1">
              <Button
                onClick={() => router.push('/friends/write')}
                className="bg-indigo-600 hover:bg-indigo-700 text-white transition-all duration-200 rounded-full px-8 py-3"
                style={{fontSize: '14px'}}
              >
                <Plus className="w-4 h-4 mr-2" />
                새 프렌즈 등록하기
              </Button>
            </div>
          </div>
        )}

      </div>

      {/* 오류 모달 */}
      <ErrorModal
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        message={errorMessage}
      />

      {/* 삭제 확인 모달 */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-gradient-to-br from-green-900/20 via-blue-900/20 to-purple-900/20 backdrop-blur-md z-50 flex items-center justify-center">
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-6 max-w-sm w-full mx-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                삭제 확인
              </h3>
              <p className="text-gray-900 mb-4" style={{fontSize: '14px'}}>
                정말로 이 글을 삭제하시겠습니까?
              </p>
              <div className="flex gap-3">
                <Button
                  onClick={closeDeleteModal}
                  className="flex-1 bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 rounded-full"
                  style={{fontSize: '14px'}}
                >
                  취소
                </Button>
                <Button
                  onClick={deleteArticle}
                  className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-full"
                  style={{fontSize: '14px'}}
                >
                  삭제
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 더 많은 데이터 로딩 중 */}
      {loadingMore && (
        <div className="flex justify-center py-8">
          <div className="flex items-center gap-3">
            <img 
              src="/logo_remoteonly.png" 
              alt="박스로 로고" 
              className="w-8 h-8 animate-bounce"
              style={{ 
                animationDuration: '0.8s',
                animationIterationCount: 'infinite',
                animationTimingFunction: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)'
              }}
            />
            <span className="text-white text-sm">더 많은 프렌즈를 불러오는 중이에요…</span>
          </div>
        </div>
      )}
      
      {/* 더 이상 데이터가 없을 때 */}
      {!hasMore && articles.length > 0 && (
        <div className="col-span-full flex justify-center py-8">
          <span className="text-white text-sm">준비된 프렌즈를 모두 보여드렸어요!</span>
        </div>
      )}
    </CommonBackground>
  );
}
