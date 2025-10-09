"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { collection, getDocs, doc, deleteDoc, query, orderBy, updateDoc, increment, arrayUnion, where, addDoc, getDoc, limit, startAfter } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useScrollLock } from "@/hooks/useScrollLock";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import ErrorModal from "@/components/ErrorModal";
import { Plus, Menu, X, Edit, Trash2, MoreVertical, BookOpen, Share2, MessageCircle, Eye, ThumbsUp, LinkIcon, Mail, MessageSquare, Car } from "lucide-react";
import CommonHeader from "@/components/CommonHeader";
import PageHeader from "@/components/PageHeader";
import CommonBackground from "@/components/CommonBackground";

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
  boxroTalks: number;
  isLiked?: boolean;
  likedBy?: string[];
  isShared?: boolean;
  sharedBy?: string[];
  isBoxroTalked?: boolean;
  boxroTalkedBy?: string[];
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
  const getInitials = (name: string) => {
    if (!name) return '?';
    return name.split(' ').map(word => word.charAt(0)).join('').toUpperCase().slice(0, 2);
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
        {getInitials(authorName)}
      </span>
    </div>
  );
};


export default function StoryPageClient() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showFloatingMenu, setShowFloatingMenu] = useState(false);
  const [articles, setArticles] = useState<StoryArticle[]>([]);
  const router = useRouter();
  const [showShareModal, setShowShareModal] = useState(false);
  const [showShareSuccessModal, setShowShareSuccessModal] = useState(false);
  const [showBoxroTalksModal, setShowBoxroTalksModal] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<StoryArticle | null>(null);
  const [loadingBoxroTalks, setLoadingBoxroTalks] = useState(false);
  const [boxroTalksForDesign, setBoxroTalksForDesign] = useState<any[]>([]);
  const [boxroTalkText, setBoxroTalkText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastDoc, setLastDoc] = useState<any>(null);
  
  // 오류 모달 상태
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // 로그인 유도 모달 상태
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginModalType, setLoginModalType] = useState<'like' | 'share' | 'boxroTalk'>('like');
  const [loginModalArticleId, setLoginModalArticleId] = useState<string | null>(null);

  // 관리자 이메일 목록
  const adminEmails = [
    "admin@boxro.com",
    "dongwoo.kang@boxro.com",
    "beagle3651@gmail.com"
  ];

  // 관리자 권한 확인
  useEffect(() => {
    if (user && adminEmails.includes(user.email || "")) {
      setIsAdmin(true);
    } else {
      setIsAdmin(false);
    }
  }, [user]);

  // 모달이 열릴 때 배경 스크롤 방지
  useScrollLock(showBoxroTalksModal);

  // 박스카 이야기 글 목록 가져오기
  const fetchArticles = async () => {
    try {
      setLoading(true);
      setArticles([]);
      setHasMore(true);
      
      const articlesRef = collection(db, 'storyArticles');
      const q = query(articlesRef, orderBy('createdAt', 'desc'), limit(15));
      const querySnapshot = await getDocs(q);
      
      const articlesData: StoryArticle[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        articlesData.push({
          id: doc.id,
          ...data,
          isLiked: user ? (data.likedBy?.includes(user.uid) || false) : false,
          isShared: user ? (data.sharedBy?.includes(user.uid) || false) : false,
          isBoxroTalked: user ? (data.boxroTalkedBy?.includes(user.uid) || false) : false,
          isViewed: user ? (data.viewedBy?.includes(user.uid) || false) : false
        } as StoryArticle);
      });
      
      setArticles(articlesData);
      
      // 마지막 문서 저장
      if (querySnapshot.docs.length > 0) {
        setLastDoc(querySnapshot.docs[querySnapshot.docs.length - 1]);
      }
      
      // 더 이상 데이터가 없으면 hasMore를 false로 설정
      if (querySnapshot.docs.length < 15) {
        setHasMore(false);
      }
    } catch (error) {
      console.error('박스카 이야기 글 목록 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  // 더 많은 글 로드
  const loadMoreArticles = async () => {
    if (!hasMore || loadingMore) return;
    
    try {
      setLoadingMore(true);
      
      const articlesRef = collection(db, 'storyArticles');
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
          isBoxroTalked: user ? (data.boxroTalkedBy?.includes(user.uid) || false) : false,
          isViewed: user ? (data.viewedBy?.includes(user.uid) || false) : false
        } as StoryArticle);
      });
      
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

  // 글 삭제
  const deleteArticle = async (id: string) => {
    if (!user) {
      alert('로그인이 필요합니다.');
      return;
    }
    
    if (!confirm('정말로 이 글을 삭제하시겠습니까?')) {
      return;
    }

    try {
      // 1. 관련 박스로 톡 삭제
      const boxroTalksQuery = query(
        collection(db, 'storyBoxroTalks'),
        where('articleId', '==', id)
      );
      const boxroTalksSnapshot = await getDocs(boxroTalksQuery);
      
      const deletePromises = boxroTalksSnapshot.docs.map(doc => 
        deleteDoc(doc.ref)
      );
      await Promise.all(deletePromises);
      
      // 2. 게시물 삭제
      await deleteDoc(doc(db, 'storyArticles', id));
      setArticles(articles.filter(article => article.id !== id));
      alert('글이 삭제되었습니다.');
    } catch (error) {
      console.error('삭제 실패:', error);
      setErrorMessage('삭제 중 오류가 발생했습니다.');
      setShowErrorModal(true);
    }
  };

  // 로그인 유도 모달 열기
  const openLoginModal = (type: 'like' | 'share' | 'boxroTalk', articleId: string) => {
    setLoginModalType(type);
    setLoginModalArticleId(articleId);
    setShowLoginModal(true);
  };

  // 로그인 유도 모달 닫기
  const closeLoginModal = () => {
    setShowLoginModal(false);
    setLoginModalType('like');
    setLoginModalArticleId(null);
  };

  // 로그인 후 원래 기능 실행
  const handleLoginAndAction = () => {
    closeLoginModal();
    // 로그인 페이지로 이동
    router.push('/auth');
  };

  // 좋아요 토글
  const toggleLike = async (articleId: string) => {
    if (!user) {
      openLoginModal('like', articleId);
      return;
    }

    const article = articles.find(a => a.id === articleId);
    if (!article) return;

    try {
      const articleRef = doc(db, 'storyArticles', articleId);
      const isCurrentlyLiked = article.isLiked;
      const newLikes = isCurrentlyLiked ? article.likes - 1 : article.likes + 1;
      
      // Firebase 업데이트
      try {
        await updateDoc(articleRef, {
          likes: newLikes,
          likedBy: isCurrentlyLiked 
            ? article.likedBy?.filter(uid => uid !== user.uid) || []
            : [...(article.likedBy || []), user.uid]
        });
      } catch (firestoreError: any) {
        if (firestoreError.code === 'permission-denied') {
          console.log('🔧 Firebase 보안 규칙 설정 대기 중 - 좋아요 업데이트 건너뜀');
        } else {
          throw firestoreError;
        }
      }

      // 로컬 상태 업데이트
      setArticles(articles.map(a => 
        a.id === articleId ? {
          ...a,
          likes: newLikes,
          isLiked: !isCurrentlyLiked,
          likedBy: isCurrentlyLiked 
            ? a.likedBy?.filter(uid => uid !== user.uid) || []
            : [...(a.likedBy || []), user.uid]
        } : a
      ));
    } catch (error) {
      console.error('좋아요 토글 실패:', error);
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
      console.error('오류 상세:', {
        error,
        message: errorMessage,
        articleId,
        userId: user?.uid
      });
      setErrorMessage('좋아요 처리 중 오류가 발생했습니다.');
      setShowErrorModal(true);
    }
  };

  // 공유하기
  const shareArticle = async (article: StoryArticle) => {
    try {
      // 공유 횟수 증가 (로그인 여부와 관계없이)
      try {
        if (user) {
          // 로그인 사용자: sharedBy 배열에 추가
          await updateDoc(doc(db, 'storyArticles', article.id), {
            shares: increment(1),
            sharedBy: arrayUnion(user.uid)
          });
        } else {
          // 비로그인 사용자: shares만 증가
          await updateDoc(doc(db, 'storyArticles', article.id), {
            shares: increment(1)
          });
        }
      } catch (firestoreError: any) {
        if (firestoreError.code === 'permission-denied') {
          console.log('🔧 Firebase 보안 규칙 설정 대기 중 - 공유 횟수 증가 건너뜀');
        } else {
          throw firestoreError;
        }
      }

      // 로컬 상태 업데이트
      setArticles(articles.map(a => 
        a.id === article.id ? {
          ...a,
          shares: (a.shares || 0) + 1,
          isShared: true
        } : a
      ));
      
      const shareUrl = `${window.location.origin}/story/${article.id}`;
      
      // 모든 디바이스에서 공유 모달 표시
      setSelectedArticle(article);
      setShowShareModal(true);
    } catch (error) {
      console.error('공유 실패:', error);
      setErrorMessage('공유 중 오류가 발생했습니다.');
      setShowErrorModal(true);
    }
  };

  // 박스로 톡 모달 열기
  const openBoxroTalksModal = async (article: StoryArticle) => {
    if (!user) {
      openLoginModal('boxroTalk', article.id);
      return;
    }
    
    setSelectedArticle(article);
    setShowBoxroTalksModal(true);
    setLoadingBoxroTalks(true);
    setBoxroTalksForDesign([]); // 이전 박스로 톡 목록 초기화
    
    // 배경 스크롤 방지는 useScrollLock 훅에서 처리
    
    try {
      // 인덱스 없이 작동하도록 쿼리 단순화
      const boxroTalksQuery = query(
        collection(db, 'storyBoxroTalks'),
        where('articleId', '==', article.id)
      );
      const boxroTalksSnapshot = await getDocs(boxroTalksQuery);
      const boxroTalksData = boxroTalksSnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .sort((a, b) => {
          // 클라이언트에서 정렬 (createdAt 기준 내림차순)
          const aTime = a.createdAt?.toDate?.() || a.createdAt || new Date(0);
          const bTime = b.createdAt?.toDate?.() || b.createdAt || new Date(0);
          return bTime.getTime() - aTime.getTime();
        });
      setBoxroTalksForDesign(boxroTalksData);
    } catch (error) {
      console.error('박스로 톡 불러오기 오류:', error);
      setErrorMessage('박스로 톡을 불러오는 중 오류가 발생했습니다.');
      setShowErrorModal(true);
    } finally {
      setLoadingBoxroTalks(false);
    }
  };

  // 박스로 톡 모달 닫기
  const closeBoxroTalksModal = () => {
    setShowBoxroTalksModal(false);
    setBoxroTalksForDesign([]);
    setBoxroTalkText('');
    setShowEmojiPicker(false);
    
    // 배경 스크롤 복원은 useScrollLock 훅에서 처리
  };

  // 이모지 배열
  const emojis = ['😊', '😍', '🤩', '😎', '🥳', '😄', '😆', '😂', '🤣', '😭', '😢', '😡', '🤔', '😴', '👍', '👎', '❤️', '🔥', '💯', '✨', '🎉', '🚀', '💪', '👏', '🙌', '🤝'];

  // 이모지 클릭 핸들러
  const handleEmojiClick = (emoji: string) => {
    if (boxroTalkText.length + emoji.length <= 30) {
      setBoxroTalkText(boxroTalkText + emoji);
    }
  };

  // 박스로 톡 추가
  const addBoxroTalk = async () => {
    if (!user || !selectedArticle || !boxroTalkText.trim()) return;
    
    try {
      // 사용자의 최신 닉네임 가져오기
      let userNickname = user.displayName || 'Anonymous';
      try {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const userData = userSnap.data();
          userNickname = userData.authorNickname || userData.displayName || user.displayName || 'Anonymous';
        }
      } catch (error) {
        console.warn('사용자 닉네임 조회 실패, 기본값 사용:', error);
      }

      // 박스로 톡 컬렉션에 박스로 톡 추가
      const boxroTalkData = {
        articleId: selectedArticle.id,
        author: user.displayName || (user.email ? user.email.split('@')[0] : 'Anonymous'),
        authorNickname: userNickname, // Firestore에서 가져온 최신 닉네임 사용
        authorEmail: user.email || '',
        authorId: user.uid,
        text: boxroTalkText.trim(),
        createdAt: new Date()
      };
      await addDoc(collection(db, 'storyBoxroTalks'), boxroTalkData);
      
      // 박스로 톡 수 증가 및 사용자 ID 저장
      try {
        await updateDoc(doc(db, 'storyArticles', selectedArticle.id), {
          boxroTalks: increment(1),
          boxroTalkedBy: arrayUnion(user.uid)
        });
      } catch (error: any) {
        if (error.code === 'permission-denied') {
          console.log('🔧 Firebase 보안 규칙 설정 대기 중 - 박스로 톡 수 증가 건너뜀');
        } else {
          console.error('박스로 톡 수 증가 및 사용자 ID 저장 실패:', error);
          setErrorMessage('박스로 톡 수 업데이트에 실패했습니다.');
          setShowErrorModal(true);
        }
      }

      // 로컬 상태 업데이트
      setArticles(articles.map(a => 
        a.id === selectedArticle.id ? {
          ...a,
          boxroTalks: (a.boxroTalks || 0) + 1,
          boxroTalkedBy: [...(a.boxroTalkedBy || []), user.uid],
          isBoxroTalked: true
        } : a
      ));
      
      setBoxroTalkText('');
      setShowEmojiPicker(false);
      
      // 박스로 톡 목록 새로고침
      const boxroTalksQuery = query(
        collection(db, 'storyBoxroTalks'),
        where('articleId', '==', selectedArticle.id)
      );
      const boxroTalksSnapshot = await getDocs(boxroTalksQuery);
      const boxroTalksData = boxroTalksSnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .sort((a, b) => {
          // 클라이언트에서 정렬 (createdAt 기준 내림차순)
          const aTime = a.createdAt?.toDate?.() || a.createdAt || new Date(0);
          const bTime = b.createdAt?.toDate?.() || b.createdAt || new Date(0);
          return bTime.getTime() - aTime.getTime();
        });
      setBoxroTalksForDesign(boxroTalksData);
      
    } catch (error) {
      console.error('박스로 톡 추가 실패:', error);
      setErrorMessage('박스로 톡 추가 중 오류가 발생했습니다.');
      setShowErrorModal(true);
    }
  };

  // 박스로 톡 삭제
  const deleteBoxroTalk = async (boxroTalkId: string) => {
    if (!user || !selectedArticle) return;
    
    try {
      await deleteDoc(doc(db, 'storyBoxroTalks', boxroTalkId));
      
      // 박스로 톡 수 감소
      try {
        await updateDoc(doc(db, 'storyArticles', selectedArticle.id), {
          boxroTalks: increment(-1),
          boxroTalkedBy: arrayUnion(user.uid) // 실제로는 arrayRemove를 사용해야 하지만, increment(-1)로 충분
        });
      } catch (error: any) {
        if (error.code === 'permission-denied') {
          console.log('🔧 Firebase 보안 규칙 설정 대기 중 - 박스로 톡 수 감소 건너뜀');
        } else {
          console.error('박스로 톡 수 감소 실패:', error);
        }
      }

      // 로컬 상태 업데이트
      setBoxroTalksForDesign(boxroTalksForDesign.filter(comment => comment.id !== boxroTalkId));
      setArticles(articles.map(a => 
        a.id === selectedArticle.id ? {
          ...a,
          boxroTalks: Math.max((a.boxroTalks || 0) - 1, 0)
        } : a
      ));
      
    } catch (error) {
      console.error('박스로 톡 삭제 실패:', error);
      setErrorMessage('박스로 톡 삭제 중 오류가 발생했습니다.');
      setShowErrorModal(true);
    }
  };

  // 조회수 증가
  const incrementView = async (articleId: string) => {
    try {
      const articleRef = doc(db, 'storyArticles', articleId);
      await updateDoc(articleRef, {
        views: increment(1)
      });
      
      setArticles(articles.map(a => 
        a.id === articleId ? { ...a, views: (a.views || 0) + 1 } : a
      ));
    } catch (error) {
      console.error('조회수 증가 실패:', error);
    }
  };

  useEffect(() => {
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
  }, [hasMore, loadingMore, lastDoc]);

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

  console.log('StoryPageClient render:', { loading, articlesCount: articles.length });

  if (loading) {
    return (
      <CommonBackground>
        <CommonHeader />
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="mt-10 px-0 md:px-0">
            <PageHeader 
              title="박스카 이야기"
              description="박스로와 함께하는 박스카 놀이와 창작 이야기!"
            />
          </div>
          <Card className="bg-white border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden py-5 w-full rounded-2xl">
            <CardContent className="text-center py-12">
              <div className="w-16 h-16 mx-auto relative mb-4">
                <div className="absolute inset-0 rounded-full border-3 border-purple-200"></div>
                <div className="absolute inset-0 rounded-full border-3 border-transparent border-t-purple-500 border-r-pink-500 animate-spin"></div>
                <div className="absolute inset-1.5 rounded-full border-2 border-transparent border-t-blue-400 border-r-purple-400 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">박스카 이야기를 불러오는 중...</h3>
              <p className="text-sm text-gray-800">잠시만 기다려주세요.</p>
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
                title="박스카 이야기"
                description="박스로와 함께하는 박스카 놀이와 창작 이야기!"
              />
            </div>
            {user && isAdmin && (
              <div className="hidden sm:flex gap-3">
                <Button
                  onClick={() => router.push('/story/write')}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white transition-all duration-200 rounded-full px-6 py-3"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  새 글 작성하기
                </Button>
              </div>
            )}
          </div>
        </div>
        
        {articles.length === 0 ? (
          <Card className="bg-white border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden py-5 w-full rounded-2xl">
            <CardContent className="text-center py-12">
              <Car className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-800 mb-2">앗, 아직 박스카 이야기가 없네요!</h3>
              <p className="text-sm text-gray-800 mb-6">
                곧 재미있는 이야기들이 찾아올 거예요 🚗✨
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {articles.map((article) => (
              <div 
                key={article.id} 
                className="group shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden w-full rounded-2xl relative cursor-pointer"
                style={{ backgroundColor: article.cardBackgroundColor || 'rgba(255, 255, 255, 0.97)' }}
                onClick={() => router.push(`/story/${article.id}`)}
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
                {user && (user.uid === article.authorId || user.email === article.authorEmail || isAdmin()) && (
                  <div className="absolute top-2 right-2 flex gap-1 z-10">
                    <Button
                      variant="outline"
                      className="w-8 h-8 rounded-full p-0 bg-white/90 hover:bg-white text-gray-500 hover:text-gray-800 border border-gray-200 hover:border-gray-300 shadow-lg"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        router.push(`/story/edit/${article.id}`);
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
                        deleteArticle(article.id);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}

                {/* 제목, 요약 */}
                <div className="px-7 py-4">
                  <h3 
                        className="text-lg font-semibold mb-2 mt-1"
                    style={{ color: article.titleColor || '#1f2937' }}
                  >
                    {article.title.length > 20 ? `${article.title.substring(0, 20)}...` : article.title}
                  </h3>
                  
                  {article.summary && (
                    <p 
                      className="text-sm mb-0 whitespace-pre-wrap"
                      style={{ color: article.summaryColor || '#6b7280' }}
                    >
                      {article.summary}
                    </p>
                  )}
                  
                  {/* 좋아요, 공유, 박스로 톡, 보기 버튼 */}
                  <div className="flex items-center justify-center gap-2 mt-1 pt-3 pb-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleLike(article.id);
                      }}
                      className={`w-[60px] h-[60px] rounded-full p-0 flex flex-col items-center justify-center gap-1 ${
                        article.isLiked 
                          ? 'bg-rose-400 hover:bg-rose-500 text-white' 
                          : 'bg-white border-2 border-gray-100 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 text-gray-800 shadow-sm'
                      }`}
                    >
                      <ThumbsUp className={`w-5 h-5 ${article.isLiked ? 'text-white' : 'text-gray-500'}`} />
                      <span className={`text-xs font-medium ${article.isLiked ? 'text-white' : 'text-gray-500'}`}>
                        {(article.likes || 0) + (article.popularityBoost?.likes || 0)}
                      </span>
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        shareArticle(article);
                      }}
                      className={`w-[60px] h-[60px] rounded-full p-0 flex flex-col items-center justify-center gap-1 ${
                        article.isShared 
                          ? 'bg-sky-500 hover:bg-sky-600 text-white'
                          : 'bg-white border-2 border-gray-100 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 text-gray-800 shadow-sm'
                      }`}
                    >
                      <Share2 className={`w-5 h-5 ${article.isShared ? 'text-white' : 'text-gray-500'}`} />
                      <span className={`text-xs font-medium ${article.isShared ? 'text-white' : 'text-gray-500'}`}>
                        {(article.shares || 0) + (article.popularityBoost?.shares || 0)}
                      </span>
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        openBoxroTalksModal(article);
                      }}
                      className={`w-[60px] h-[60px] rounded-full p-0 flex flex-col items-center justify-center gap-1 ${
                        article.isBoxroTalked 
                          ? 'bg-blue-400 hover:bg-blue-500 text-white'
                          : 'bg-white border-2 border-gray-100 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 text-gray-800 shadow-sm'
                      }`}
                    >
                      <MessageCircle className={`w-5 h-5 ${article.isBoxroTalked ? 'text-white' : 'text-gray-500'}`} />
                      <span className={`text-xs font-medium ${article.isBoxroTalked ? 'text-white' : 'text-gray-500'}`}>{article.boxroTalks || 0}</span>
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/story/${article.id}`);
                      }}
                      className={`w-[60px] h-[60px] rounded-full p-0 flex flex-col items-center justify-center gap-1 ${
                        article.isViewed 
                          ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                          : 'bg-white border-2 border-gray-100 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 text-gray-800 shadow-sm'
                      }`}
                    >
                      <Eye className={`w-5 h-5 ${article.isViewed ? 'text-white' : 'text-gray-500'}`} />
                      <span className={`text-xs font-medium ${article.isViewed ? 'text-white' : 'text-gray-500'}`}>
                        {(article.views || 0) + (article.popularityBoost?.views || 0)}
                      </span>
                    </button>
                  </div>
                  
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 모바일 플로팅 메뉴 */}
        {user && isAdmin && (
          <div className="fixed bottom-6 right-6 z-40 md:hidden">
            {showFloatingMenu && (
              <div className="absolute bottom-16 right-0 flex flex-col gap-3 mb-2">
                <Button
                  onClick={() => {
                    router.push('/story/write');
                    setShowFloatingMenu(false);
                  }}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white transition-all duration-200 rounded-full px-6 py-3"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  새 글 작성하기
                </Button>
              </div>
            )}
            <Button
              onClick={() => setShowFloatingMenu(!showFloatingMenu)}
              className="bg-indigo-800 hover:bg-indigo-900 text-white shadow-lg hover:shadow-xl transition-all duration-200 rounded-full w-14 h-14 p-0"
            >
              {showFloatingMenu ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </Button>
          </div>
        )}

      </div>

      {/* 공유 모달 */}
      {showShareModal && selectedArticle && (
        <div className="fixed inset-0 bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-pink-900/20 backdrop-blur-md z-50 flex items-center justify-center overflow-hidden">
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-6 max-w-sm w-full mx-6">
            <div className="text-center">
              <div className="flex justify-center mb-2">
                <div className="text-[30px]">✨</div>
              </div>
              <h3 className="text-lg font-semibold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                박스카 이야기 공유하기
              </h3>
              <p className="text-gray-800 text-sm mb-6">
                박스카 이야기를 다른 사람들과 나눠보세요!
              </p>
              
              <div className="flex gap-3">
                <Button
                  onClick={() => setShowShareModal(false)}
                  className="flex-1 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded-full"
                >
                  취소
                </Button>
                <Button
                  onClick={async () => {
                    const shareUrl = `${window.location.origin}/story/${selectedArticle.id}`;
                    try {
                      if (navigator.clipboard && navigator.clipboard.writeText) {
                        await navigator.clipboard.writeText(shareUrl);
                        setShowShareModal(false);
                        setShowShareSuccessModal(true);
                      } else {
                        prompt('공유 링크를 복사하세요:', shareUrl);
                        setShowShareModal(false);
                      }
                    } catch (error) {
                      console.error('클립보드 복사 실패:', error);
                      prompt('공유 링크를 복사하세요:', shareUrl);
                      setShowShareModal(false);
                    }
                  }}
                  className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-full"
                >
                  링크 복사
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 박스로 톡 목록 모달 */}
      {showBoxroTalksModal && selectedArticle && (
        <div 
          className="fixed inset-0 bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-pink-900/20 backdrop-blur-md z-50 flex items-center justify-center"
          onClick={closeBoxroTalksModal}
        >
          <div 
            className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-6 max-w-2xl lg:max-w-lg w-full mx-6 max-h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex-1 pr-4">
                <h3 className="text-lg font-semibold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  박스로 톡 ({boxroTalksForDesign.length})
                </h3>
              </div>
              <button
                onClick={closeBoxroTalksModal}
                className="text-gray-500 hover:text-gray-800 text-2xl font-bold flex-shrink-0 -mt-2"
              >
                ×
              </button>
            </div>

            {/* 구분선 */}
            <div className="border-t border-gray-200 mb-3"></div>

            {/* 박스로 톡 목록 */}
            <div className="flex-1 overflow-y-auto mb-3">
              {loadingBoxroTalks ? (
                <div className="text-center py-8">
                  <div className="text-gray-500">박스로 톡을 불러오는 중...</div>
                </div>
              ) : boxroTalksForDesign.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-500 text-sm">아직 톡이 없어요. ✨ 첫 톡을 남겨보세요!</div>
                </div>
              ) : (
                <div className="space-y-4">
                  {boxroTalksForDesign.map((comment) => (
                    <div key={comment.id} className="flex items-start gap-2">
                      {/* 박스로 톡 작성자 프로필 이미지 - 박스로 톡 박스 왼쪽 바깥쪽 */}
                      <ProfileImage 
                        authorId={comment.authorId || ''} 
                        authorName={comment.authorNickname || comment.author} 
                        authorEmail={comment.authorEmail}
                        size="w-8 h-8 sm:w-10 sm:h-10"
                      />
                      
                      {/* 박스로 톡 내용 영역 */}
                      <div className="flex-1">
                        {/* 작성자와 작성일자 - 박스로 톡 박스 위쪽 */}
                        <div className="mb-2">
                          <div className="font-medium text-gray-800 text-sm">
                            {comment.authorNickname || comment.author}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(comment.createdAt?.toDate?.() || comment.createdAt).toLocaleString()}
                          </div>
                        </div>
                        
                        {/* 박스로 톡 박스 */}
                        <div className="bg-gray-100 rounded-lg p-4">
                          <div className="flex justify-between items-start">
                            <div className="text-gray-800 whitespace-pre-wrap break-words text-sm flex-1">
                              {comment.text}
                            </div>
                            {/* 박스로 톡 삭제 버튼 (작성자 또는 관리자) */}
                            {user && (user.uid === comment.authorId || isAdmin) && (
                              <button
                                onClick={() => deleteBoxroTalk(comment.id)}
                                className="ml-2 text-red-500 hover:text-red-700 text-xs"
                                title="박스로 톡 삭제"
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 박스로 톡 작성 */}
            {user && (
              <div className="pt-4">
                <div className="border-t border-gray-200 mb-4"></div>
                <div className="mb-4">
                  <div className="flex items-start gap-2">
                    {/* 작성자 프로필 이미지 */}
                    <div className="hidden sm:block">
                      <ProfileImage 
                        authorId={user.uid || ''} 
                        authorName={user.displayName || user.email || 'Anonymous'} 
                        authorEmail={user.email || undefined}
                        size="w-10 h-10"
                      />
                    </div>
                    
                    <div className="flex-1 relative">
                      <textarea
                        value={boxroTalkText}
                        onChange={(e) => {
                          if (e.target.value.length <= 30) {
                            setBoxroTalkText(e.target.value);
                          }
                        }}
                        placeholder="무슨 생각이 드셨나요?"
                        maxLength={30}
                        rows={2}
                        className="w-full border-4 border-solid border-yellow-400/70 rounded-2xl overflow-hidden p-3 pr-12 focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none text-[15px]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        className="absolute right-3 top-3 p-2 text-gray-500 hover:text-gray-800 transition-colors text-2xl"
                      >
                        😊
                      </button>
                    </div>
                    
                    {/* 이모지 피커 */}
                    {showEmojiPicker && (
                      <div className="emoji-picker-container absolute bottom-20 right-0 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-10">
                        <div className="grid grid-cols-6 gap-3">
                          {emojis.map((emoji, index) => (
                            <button
                              key={index}
                              onClick={() => handleEmojiClick(emoji)}
                              className="p-3 hover:bg-gray-100 rounded-lg text-2xl transition-colors"
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex justify-center">
                  <Button
                    onClick={addBoxroTalk}
                    disabled={!boxroTalkText.trim()}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white disabled:opacity-50 disabled:cursor-not-allowed rounded-full px-12"
                  >
                    톡 남기기
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 더 많은 데이터 로딩 중 */}
      {loadingMore && (
        <div className="flex justify-center py-8">
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                <span className="text-white text-sm">더 많은 이야기를 불러오는 중이에요…</span>
          </div>
        </div>
      )}
      
      {/* 더 이상 데이터가 없을 때 */}
      {!hasMore && articles.length > 0 && (
        <div className="flex justify-center py-8">
          <span className="text-white text-sm">준비된 박스카 이야기를 모두 보여드렸어요!</span>
        </div>
      )}

      {/* 박스로 톡 목록 모달 */}
      {showBoxroTalksModal && selectedArticle && (
        <div 
          className="fixed inset-0 bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-pink-900/20 backdrop-blur-md z-50 flex items-center justify-center"
          onClick={closeBoxroTalksModal}
        >
          <div 
            className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-6 max-w-2xl lg:max-w-lg w-full mx-6 max-h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex-1 pr-4">
                <h3 className="text-lg font-semibold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  박스로 톡 ({boxroTalksForDesign.length})
                </h3>
              </div>
              <button
                onClick={closeBoxroTalksModal}
                className="text-gray-500 hover:text-gray-800 text-2xl font-bold flex-shrink-0 -mt-2"
              >
                ×
              </button>
            </div>

            {/* 구분선 */}
            <div className="border-t border-gray-200 mb-3"></div>

            {/* 박스로 톡 목록 */}
            <div className="flex-1 overflow-y-auto mb-3">
              {loadingBoxroTalks ? (
                <div className="text-center py-8">
                  <div className="text-gray-500">박스로 톡을 불러오는 중...</div>
                </div>
              ) : boxroTalksForDesign.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-500 text-sm">아직 톡이 없어요. ✨ 첫 톡을 남겨보세요!</div>
                </div>
              ) : (
                <div className="space-y-4">
                  {boxroTalksForDesign.map((comment) => (
                    <div key={comment.id} className="flex items-start gap-2">
                      {/* 박스로 톡 작성자 프로필 이미지 - 박스로 톡 박스 왼쪽 바깥쪽 */}
                      <ProfileImage 
                        authorId={comment.authorId || ''} 
                        authorName={comment.authorNickname || comment.author} 
                        authorEmail={comment.authorEmail}
                        size="w-8 h-8 sm:w-10 sm:h-10"
                      />
                      
                      {/* 박스로 톡 내용 영역 */}
                      <div className="flex-1">
                        {/* 작성자와 작성일자 - 박스로 톡 박스 위쪽 */}
                        <div className="mb-2">
                          <div className="font-medium text-gray-800 text-sm">
                            {comment.authorNickname || comment.author}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(comment.createdAt?.toDate?.() || comment.createdAt).toLocaleString()}
                          </div>
                        </div>
                        
                        {/* 박스로 톡 박스 */}
                        <div className="bg-gray-100 rounded-lg p-4">
                          <div className="flex justify-between items-start">
                            <div className="text-gray-800 whitespace-pre-wrap break-words text-sm flex-1">
                              {comment.text}
                            </div>
                            {/* 박스로 톡 삭제 버튼 (작성자 또는 관리자) */}
                            {user && (user.uid === comment.authorId || isAdmin) && (
                              <button
                                onClick={() => deleteBoxroTalk(comment.id)}
                                className="ml-2 text-red-500 hover:text-red-700 text-xs"
                                title="박스로 톡 삭제"
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 박스로 톡 작성 */}
            {user && (
              <div className="pt-4">
                <div className="border-t border-gray-200 mb-4"></div>
                <div className="mb-4">
                  <div className="flex items-start gap-2">
                    {/* 작성자 프로필 이미지 */}
                    <div className="hidden sm:block">
                      <ProfileImage 
                        authorId={user.uid || ''} 
                        authorName={user.displayName || user.email || 'Anonymous'} 
                        authorEmail={user.email || undefined}
                        size="w-10 h-10"
                      />
                    </div>
                    
                    <div className="flex-1 relative">
                      <textarea
                        value={boxroTalkText}
                        onChange={(e) => {
                          if (e.target.value.length <= 30) {
                            setBoxroTalkText(e.target.value);
                          }
                        }}
                        placeholder="무슨 생각이 드셨나요?"
                        maxLength={30}
                        rows={2}
                        className="w-full border-4 border-solid border-yellow-400/70 rounded-2xl overflow-hidden p-3 pr-12 focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none text-[15px]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        className="absolute right-3 top-3 p-2 text-gray-500 hover:text-gray-800 transition-colors text-2xl"
                      >
                        😊
                      </button>
                    </div>
                    
                    {/* 이모지 피커 */}
                    {showEmojiPicker && (
                      <div className="emoji-picker-container absolute bottom-20 right-0 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-10">
                        <div className="grid grid-cols-6 gap-3">
                          {emojis.map((emoji, index) => (
                            <button
                              key={index}
                              onClick={() => handleEmojiClick(emoji)}
                              className="p-3 hover:bg-gray-100 rounded-lg text-2xl transition-colors"
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex justify-center">
                  <Button
                    onClick={addBoxroTalk}
                    disabled={!boxroTalkText.trim()}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white disabled:opacity-50 disabled:cursor-not-allowed rounded-full px-12"
                  >
                    톡 남기기
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 공유 성공 모달 */}
      {showShareSuccessModal && (
        <div className="fixed inset-0 bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-pink-900/20 backdrop-blur-md z-50 flex items-center justify-center overflow-hidden">
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-6 max-w-sm w-full mx-6">
            <div className="text-center">
              <div className="flex justify-center mb-2">
                <div className="text-[30px]">✨</div>
              </div>
              <h3 className="text-lg font-semibold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                링크 복사 완료!
              </h3>
              <p className="text-gray-800 text-sm mb-6">
                박스카 이야기를 친구들과 나눠보세요.
              </p>
              
              <Button
                onClick={() => setShowShareSuccessModal(false)}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-full"
              >
                확인
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 로그인 유도 모달 */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-pink-900/20 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 max-w-md w-full mx-6">
            <div className="p-6">
              <div className="text-center">
                <div className="flex justify-center mb-2">
                  <div className="text-[30px]">
                    {loginModalType === 'like' && '👍'}
                    {loginModalType === 'share' && '✨'}
                    {loginModalType === 'boxroTalk' && '✨'}
                  </div>
                </div>
                <h3 className="text-lg font-semibold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                  {loginModalType === 'like' && '박스카 이야기에 공감하셨나요?'}
                  {loginModalType === 'share' && '공유하기'}
                  {loginModalType === 'boxroTalk' && '이 이야기에 참여해보세요!'}
                </h3>
                <p className="text-gray-800 text-sm mb-6">
                  {loginModalType === 'like' && '로그인하면 👍 공감을 남길 수 있어요!'}
                  {loginModalType === 'share' && '멋진 작품, 로그인하면 바로 공유할 수 있어요'}
                  {loginModalType === 'boxroTalk' && '로그인하면 톡을 남길 수 있어요!'}
                </p>
                
                <div className="flex gap-3 mt-6">
                  <Button
                    variant="outline"
                    onClick={closeLoginModal}
                    className="flex-1 border-2 border-gray-200 hover:bg-gray-50 hover:border-gray-300 rounded-full"
                  >
                    나중에 할래
                  </Button>
                  <Button
                    onClick={handleLoginAndAction}
                    className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-full"
                  >
                    지금 로그인하기
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 오류 모달 */}
      <ErrorModal
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        message={errorMessage}
      />
    </CommonBackground>
  );
}
