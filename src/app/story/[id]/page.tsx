"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ErrorModal from "@/components/ErrorModal";
import { 
  ArrowLeft,
  Calendar,
  User,
  Heart,
  Share2,
  Edit,
  Trash2,
  Eye,
  MessageCircle,
  ThumbsUp,
  X,
  Link as LinkIcon,
  Mail,
  MessageSquare
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import CommonHeader from "@/components/CommonHeader";
import CommonBackground from "@/components/CommonBackground";
import { doc, updateDoc, increment, arrayUnion, arrayRemove, collection, addDoc, query, where, getDocs, orderBy, deleteDoc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useScrollLock } from "@/hooks/useScrollLock";

// ProfileImage 컴포넌트
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
            if (userDoc.exists()) {
              const userData = userDoc.data();
              setProfileData({
                photoURL: userData.customPhotoURL || userData.photoURL,
                displayName: userData.displayName
              });
            }
          } catch (error) {
            console.error('사용자 정보 조회 실패:', error);
          }
        }
        
        setLoading(false);
      } catch (error) {
        console.error('프로필 로드 실패:', error);
        setLoading(false);
      }
    };

    loadProfile();
  }, [authorId, authorEmail, user]);

  if (loading) {
    return (
      <div className={`${size} rounded-full bg-gray-200 animate-pulse`}></div>
    );
  }

  if (profileData?.photoURL) {
    // Base64 이미지인지 확인
    const isBase64 = profileData.photoURL.startsWith('data:image/');
    
    return (
      <img
        src={isBase64 ? profileData.photoURL : `https://images.weserv.nl/?url=${encodeURIComponent(profileData.photoURL)}&w=40&h=40&fit=cover&output=webp`}
        alt={authorName}
        className={`${size} rounded-full object-cover`}
        onError={(e) => {
          // 이미지 로드 실패 시 fallback
          const target = e.target as HTMLImageElement;
          target.style.display = 'none';
          const parent = target.parentElement;
          if (parent) {
            parent.innerHTML = `<div class="${size} rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-medium text-sm">${authorName.charAt(0).toUpperCase()}</div>`;
          }
        }}
      />
    );
  }

  // 프로필 이미지가 없으면 이니셜 표시
  return (
    <div className={`${size} rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-medium text-sm`}>
      {authorName.charAt(0).toUpperCase()}
    </div>
  );
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
  boxroTalks: number;
  isPublished: boolean;
  createdAt: any;
  updatedAt: any;
  likedBy?: string[];
  sharedBy?: string[];
  boxroTalkedBy?: string[];
  isLiked?: boolean;
  isShared?: boolean;
  isBoxroTalked?: boolean;
  viewTopImage?: string;
}

export default function StoryArticlePage() {
  const { id } = useParams();
  const { user } = useAuth();
  const router = useRouter();
  const [article, setArticle] = useState<StoryArticle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // 박스로 톡 관련 상태
  const [showBoxroTalkModal, setShowBoxroTalkModal] = useState(false);
  const [showBoxroTalksModal, setShowBoxroTalksModal] = useState(false);
  const [boxroTalkText, setBoxroTalkText] = useState("");
  const [boxroTalks, setBoxroTalks] = useState<any[]>([]);
  const [boxroTalksForDesign, setBoxroTalksForDesign] = useState<any[]>([]);
  const [loadingBoxroTalks, setLoadingBoxroTalks] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isViewed, setIsViewed] = useState(false);
  
  // 모달이 열릴 때 배경 스크롤 방지
  useScrollLock(showBoxroTalksModal);
  
  // 이모지 배열
  const emojis = ['😊', '😍', '🤩', '😎', '🥳', '😄', '😆', '😂', '🤣', '😭', '😢', '😡', '🤔', '😴', '👍', '👎', '❤️', '🔥', '💯', '✨', '🎉', '🚀', '💪', '👏', '🙌', '🤝'];
  
  // 공유 모달 상태
  const [showShareModal, setShowShareModal] = useState(false);
  const [showShareSuccessModal, setShowShareSuccessModal] = useState(false);
  
  // 오류 모달 상태
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // 로그인 유도 모달 상태
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginModalType, setLoginModalType] = useState<'like' | 'share' | 'boxroTalk'>('like');

  // 이모지 클릭 핸들러
  const handleEmojiClick = (emoji: string) => {
    if (boxroTalkText.length + emoji.length <= 20) {
      setBoxroTalkText(boxroTalkText + emoji);
    }
    setShowEmojiPicker(false);
  };


  // 박스로 톡 삭제 함수
  const deleteBoxroTalk = async (boxroTalkId: string) => {
    if (!user || !article) return;
    
    try {
      // 박스로 톡 삭제
      await deleteDoc(doc(db, 'storyBoxroTalks', boxroTalkId));
      
      // 박스로 톡 수 감소
      await updateDoc(doc(db, 'storyArticles', article.id), {
        boxroTalks: increment(-1),
        boxroTalkedBy: arrayRemove(user.uid)
      });
      
      // 박스로 톡 목록 새로고침
      if (showBoxroTalksModal) {
        try {
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
          console.error('박스로 톡 새로고침 오류:', error);
        }
      }
      
      alert('박스로 톡이 삭제되었습니다.');
    } catch (error) {
      console.error('박스로 톡 삭제 실패:', error);
      setErrorMessage('박스로 톡 삭제에 실패했습니다.');
      setShowErrorModal(true);
    }
  };

  // 관리자 이메일 목록
  const adminEmails = [
    "admin@boxro.com",
    "dongwoo.kang@boxro.com",
    "beagle3651@gmail.com",
    "boxro.crafts@gmail.com"
  ];

  // 관리자 권한 확인
  useEffect(() => {
    if (user && adminEmails.includes(user.email || "")) {
      setIsAdmin(true);
    } else {
      setIsAdmin(false);
    }
  }, [user]);

  // 박스카 이야기 글 가져오기
  const fetchArticle = useCallback(async () => {
    try {
      setLoading(true);
      
      // Firebase 연결 상태 확인
      const { checkFirebaseConnection } = await import("@/lib/firebase");
      if (!checkFirebaseConnection()) {
        setError('Firebase 연결에 실패했습니다. 페이지를 새로고침해주세요.');
        return;
      }
      
      // Firebase에서 박스카 이야기 글 데이터 가져오기
      const { doc, getDoc, updateDoc } = await import("firebase/firestore");
      const { db } = await import("@/lib/firebase");
      
      const articleRef = doc(db, 'storyArticles', id as string);
      const articleSnap = await getDoc(articleRef);
      
      if (articleSnap.exists()) {
        const data = articleSnap.data();
        const currentUserId = user?.uid;
        
        const articleData = {
          id: articleSnap.id,
          ...data,
          
          // 좋아요 상태
          isLiked: currentUserId ? (data.likedBy?.includes(currentUserId) || false) : false,
          likedBy: data.likedBy || [],
          
          // 공유 상태  
          isShared: currentUserId ? (data.sharedBy?.includes(currentUserId) || false) : false,
          sharedBy: data.sharedBy || [],
          
          // 박스로 톡 상태
          isBoxroTalked: currentUserId ? (data.boxroTalkedBy?.includes(currentUserId) || false) : false,
          boxroTalkedBy: data.boxroTalkedBy || [],
        } as StoryArticle;
        
        setArticle(articleData);
        
        // 보기 상태 설정
        setIsViewed(currentUserId ? (data.viewedBy?.includes(currentUserId) || false) : false);
        
        // 조회수 증가 (로그인한 사용자만)
        if (currentUserId) {
          await updateDoc(articleRef, {
            views: (articleData.views || 0) + 1
          });
        }
        
        // 로그인한 사용자가 본 적이 없으면 자동으로 본 상태로 토글
        if (currentUserId && !data.viewedBy?.includes(currentUserId)) {
          try {
            await updateDoc(articleRef, {
              viewedBy: arrayUnion(currentUserId)
            });
            setIsViewed(true);
          } catch (error: any) {
            if (error.code === 'permission-denied') {
              console.log('🔧 Firebase 보안 규칙 설정 대기 중 - viewedBy 업데이트 건너뜀');
            } else {
              console.error('viewedBy 업데이트 실패:', error);
            }
          }
        }
      } else {
        setError('글이 존재하지 않습니다.');
      }
    } catch (error) {
      console.error('글 로드 실패:', error);
      console.error('Firebase 설정 확인:', {
        apiKey: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        authDomain: !!process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
      });
      
      // 구체적인 에러 메시지
      if (error instanceof Error) {
        if (error.message.includes('permission-denied')) {
          setError('데이터베이스 접근 권한이 없습니다. 관리자에게 문의하세요.');
        } else if (error.message.includes('not-found')) {
          setError('글이 존재하지 않습니다.');
        } else if (error.message.includes('unavailable')) {
          setError('서버가 일시적으로 사용할 수 없습니다. 잠시 후 다시 시도해주세요.');
        } else {
          setError(`데이터 로드 실패: ${error.message}`);
        }
      } else {
        setError('글을 불러오는데 실패했습니다. Firebase 설정을 확인해주세요.');
      }
    } finally {
      setLoading(false);
    }
  }, [user?.uid, id]);

  // 컴포넌트 마운트 시 및 사용자 상태 변경 시 데이터 로드 (갤러리와 동일)
  useEffect(() => {
    fetchArticle();
  }, [fetchArticle]);

  // 로그인 유도 모달 열기
  const openLoginModal = (type: 'like' | 'share' | 'boxroTalk') => {
    setLoginModalType(type);
    setShowLoginModal(true);
  };

  // 로그인 유도 모달 닫기
  const closeLoginModal = () => {
    setShowLoginModal(false);
  };

  // 로그인 후 원래 기능 실행
  const handleLoginAndAction = () => {
    closeLoginModal();
    // 로그인 페이지로 이동
    router.push('/auth');
  };

  // 좋아요 토글
  const toggleLike = async () => {
    if (!user) {
      openLoginModal('like');
      return;
    }

    if (!article) return;

    try {
      const articleRef = doc(db, 'storyArticles', article.id);
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
      setArticle(prev => prev ? {
        ...prev,
        likes: newLikes,
        isLiked: !isCurrentlyLiked,
        likedBy: isCurrentlyLiked 
          ? prev.likedBy?.filter(uid => uid !== user.uid) || []
          : [...(prev.likedBy || []), user.uid]
      } : null);
    } catch (error) {
      console.error('좋아요 토글 실패:', error);
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
      console.error('오류 상세:', {
        message: errorMessage,
        stack: error instanceof Error ? error.stack : undefined
      });
      setErrorMessage('좋아요 처리 중 오류가 발생했습니다.');
      setShowErrorModal(true);
    }
  };

  // 공유하기
  const shareArticle = async () => {
    if (!article) return;

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
      setArticle(prev => prev ? {
        ...prev,
        shares: (prev.shares || 0) + 1,
        sharedBy: user ? [...(prev.sharedBy || []), user.uid] : (prev.sharedBy || []),
        isShared: true
      } : null);
      
      const shareUrl = `${window.location.origin}/story/${article.id}`;
      
      // 모든 디바이스에서 공유 모달 표시
      setShowShareModal(true);
    } catch (error) {
      console.error('공유 실패:', error);
      setErrorMessage('공유 중 오류가 발생했습니다.');
      setShowErrorModal(true);
    }
  };



  // 박스로 톡 목록 모달 열기
  const openBoxroTalksModal = async () => {
    if (!article) return;
    
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

  // 박스로 톡 목록 모달 닫기
  const closeBoxroTalksModal = () => {
    setShowBoxroTalksModal(false);
    setBoxroTalksForDesign([]);
    
    // 배경 스크롤 복원은 useScrollLock 훅에서 처리
  };

  // 박스로 톡 추가
  const addBoxroTalk = async () => {
    if (!user || !article || !boxroTalkText.trim()) return;
    
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
        articleId: article.id,
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
        await updateDoc(doc(db, 'storyArticles', article.id), {
          boxroTalks: increment(1),
          boxroTalkedBy: arrayUnion(user.uid)
        });
      } catch (error: any) {
        if (error.code === 'permission-denied') {
          console.log('🔧 Firebase 보안 규칙 설정 대기 중 - 박스로 톡 수 증가 건너뜀');
        } else {
          console.error('박스로 톡 수 증가 및 사용자 ID 저장 실패:', error);
          alert('박스로 톡 수 업데이트에 실패했습니다.');
        }
      }

      // 로컬 상태 업데이트
      setArticle(prev => prev ? {
        ...prev,
        boxroTalks: (prev.boxroTalks || 0) + 1,
        boxroTalkedBy: [...(prev.boxroTalkedBy || []), user.uid],
        isBoxroTalked: true
      } : null);
      
      setBoxroTalkText('');
      
      // 박스로 톡 목록 새로고침
      if (showBoxroTalksModal) {
        try {
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
          console.error('박스로 톡 새로고침 오류:', error);
        }
      }
    } catch (error) {
      console.error('박스로 톡 추가 실패:', error);
      setErrorMessage('박스로 톡 추가 중 오류가 발생했습니다.');
      setShowErrorModal(true);
    }
  };

  // 글 삭제
  const deleteArticle = async () => {
    if (!user || !isAdmin) return;
    
    if (!confirm('정말로 이 글을 삭제하시겠습니까?')) {
      return;
    }

    try {
      // 1. 관련 박스로 톡 삭제
      const boxroTalksQuery = query(
        collection(db, 'storyBoxroTalks'),
        where('articleId', '==', id as string)
      );
      const boxroTalksSnapshot = await getDocs(boxroTalksQuery);
      
      const deletePromises = boxroTalksSnapshot.docs.map(doc => 
        deleteDoc(doc.ref)
      );
      await Promise.all(deletePromises);
      
      // 2. 게시물 삭제
      await deleteDoc(doc(db, 'storyArticles', id as string));
      alert('글이 삭제되었습니다.');
      router.push('/story');
    } catch (error) {
      console.error('삭제 실패:', error);
      setErrorMessage('삭제 중 오류가 발생했습니다.');
      setShowErrorModal(true);
    }
  };



  useEffect(() => {
    fetchArticle();
  }, [fetchArticle]);

  if (loading) {
    return (
      <CommonBackground>
        <CommonHeader />
        <div className="max-w-7xl mx-auto px-4 md:px-8 flex-1">
          <div className="mt-10">
            <Card className="bg-white border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden py-5 w-full rounded-2xl">
              <CardContent className="text-center py-12">
                <div className="w-16 h-16 mx-auto relative mb-4">
                  <div className="absolute inset-0 rounded-full border-3 border-purple-200"></div>
                  <div className="absolute inset-0 rounded-full border-3 border-transparent border-t-purple-500 border-r-pink-500 animate-spin"></div>
                  <div className="absolute inset-1.5 rounded-full border-2 border-transparent border-t-blue-400 border-r-purple-400 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">글을 불러오는 중...</h3>
                <p className="text-sm text-gray-800">잠시만 기다려주세요.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </CommonBackground>
    );
  }

  if (error || !article) {
    return (
      <CommonBackground>
        <CommonHeader />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <p className="text-white mb-4">{error || '글을 찾을 수 없습니다.'}</p>
            <Link href="/story">
              <Button className="bg-white border border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 rounded-full px-6 py-3 text-gray-800">
                <ArrowLeft className="w-4 h-4 mr-2" />
                목록으로
              </Button>
            </Link>
          </div>
        </div>
      </CommonBackground>
    );
  }

  return (
    <CommonBackground>
      <CommonHeader />
      <div className="max-w-7xl mx-auto px-4 md:px-8 flex-1">
        {/* 글 내용 */}
        <div className="mt-12">
          <Card className="bg-white/97 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden w-full rounded-2xl pt-0 pb-6 border-0">
          {/* 뷰 상단 이미지 */}
          {article.viewTopImage && article.viewTopImage.trim() && (
            <div className="bg-gray-200">
              <img 
                src={article.viewTopImage} 
                alt={article.title}
                className="w-full h-auto object-contain"
              />
            </div>
          )}
          
          <CardHeader className="pt-0">
            <div className="w-full md:w-4/5 mx-auto">
              <div className="flex flex-wrap gap-2 mb-4">
                {article.tags.map((tag, index) => (
                  <span 
                    key={index}
                    className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              
              <CardTitle className="text-[20px] md:text-[22px] font-bold mb-2" style={{ fontFamily: 'CookieRun' }}>{article.title}</CardTitle>
              
              <p className="text-[15px] md:text-[15px] text-gray-800 leading-relaxed whitespace-pre-wrap">{article.summary}</p>
            </div>
          </CardHeader>
          
          <CardContent>
            {/* 본문 내용 */}
            <div className="w-full md:w-4/5 mx-auto">
              <div className="rich-text-editor prose prose-lg max-w-none">
              <div 
                className="prose prose-lg max-w-none leading-relaxed prose-headings:text-gray-800 prose-p:text-gray-800 prose-a:text-blue-600 prose-strong:text-gray-800 prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-gray-100 prose-blockquote:border-l-4 prose-blockquote:border-gray-300 prose-blockquote:pl-4 whitespace-pre-line"
                dangerouslySetInnerHTML={{ 
                  __html: article.content.replace(/\n\n/g, '<br><br>').replace(/\n/g, '<br>')
                }}
              />
              </div>
            </div>
            
            {/* 액션 버튼 */}
            <div className="flex gap-2 mt-8 justify-center">
              <button 
                onClick={toggleLike}
                className={`w-[60px] h-[60px] rounded-full p-0 flex flex-col items-center justify-center gap-1 ${article.isLiked 
                  ? 'bg-rose-400 hover:bg-rose-500 text-white' 
                  : 'bg-white border-2 border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 text-gray-800 shadow-sm'
                }`}
              >
                <ThumbsUp className={`w-5 h-5 ${article.isLiked ? 'text-white' : 'text-gray-500'}`} />
                <span className={`text-xs font-medium ${article.isLiked ? 'text-white' : 'text-gray-500'}`}>{article.likes || 0}</span>
              </button>
              <button 
                onClick={shareArticle}
                className={`w-[60px] h-[60px] rounded-full p-0 flex flex-col items-center justify-center gap-1 ${article.isShared
                  ? 'bg-sky-500 hover:bg-sky-600 text-white'
                  : 'bg-white border-2 border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 text-gray-800 shadow-sm'
                }`}
              >
                <Share2 className={`w-5 h-5 ${article.isShared ? 'text-white' : 'text-gray-500'}`} />
                <span className={`text-xs font-medium ${article.isShared ? 'text-white' : 'text-gray-500'}`}>{article.shares || 0}</span>
              </button>
              <button 
                onClick={() => {
                  if (!user) {
                    openLoginModal('boxroTalk');
                    return;
                  }
                  openBoxroTalksModal();
                }}
                className={`w-[60px] h-[60px] rounded-full p-0 flex flex-col items-center justify-center gap-1 ${article.isBoxroTalked
                  ? 'bg-blue-400 hover:bg-blue-500 text-white'
                  : 'bg-white border-2 border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 text-gray-800 shadow-sm'
                }`}
              >
                <MessageCircle className={`w-5 h-5 ${article.isBoxroTalked ? 'text-white' : 'text-gray-500'}`} />
                <span className={`text-xs font-medium ${article.isBoxroTalked ? 'text-white' : 'text-gray-500'}`}>{article.boxroTalks || 0}</span>
              </button>
              <div 
                className={`w-[60px] h-[60px] rounded-full p-0 flex flex-col items-center justify-center gap-1 ${isViewed
                  ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                  : 'bg-white border-2 border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 text-gray-800 shadow-sm'
                }`}
              >
                <Eye className={`w-5 h-5 ${isViewed ? 'text-white' : 'text-gray-500'}`} />
                <span className={`text-xs font-medium ${isViewed ? 'text-white' : 'text-gray-500'}`}>{article.views || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>
        </div>

        {/* 버튼들 */}
        <div className="mt-5 md:mt-6 px-4 md:px-0">
          <div className="flex justify-between items-center">
            <Link href="/story">
              <Button 
                className="bg-pink-500 hover:bg-pink-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 rounded-full w-16 h-16 md:w-20 md:h-20 p-2 md:p-3 flex flex-col items-center justify-center gap-1"
              >
                <ArrowLeft className="w-4 h-4 md:w-5 md:h-5" />
                <span className="text-xs md:text-sm font-medium">목록으로</span>
              </Button>
            </Link>
            {isAdmin && (
              <div className="flex gap-3">
                <Link href={`/story/edit/${article.id}`}>
                  <Button 
                    className="bg-sky-500 hover:bg-sky-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 rounded-full w-16 h-16 md:w-20 md:h-20 p-2 md:p-3 flex flex-col items-center justify-center gap-1"
                  >
                    <Edit className="w-4 h-4 md:w-5 md:h-5" />
                    <span className="text-xs md:text-sm font-medium">수정</span>
                  </Button>
                </Link>
                <Button 
                  onClick={deleteArticle}
                  className="bg-orange-500 hover:bg-orange-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 rounded-full w-16 h-16 md:w-20 md:h-20 p-2 md:p-3 flex flex-col items-center justify-center gap-1"
                >
                  <Trash2 className="w-4 h-4 md:w-5 md:h-5" />
                  <span className="text-xs md:text-sm font-medium">삭제</span>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 공유 모달 */}
      {showShareModal && (
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
                    const shareUrl = `${window.location.origin}/story/${article?.id}`;
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

      {/* 박스로 톡 목록 모달 */}
      {showBoxroTalksModal && (
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

      {/* 오류 모달 */}
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

      <ErrorModal
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        message={errorMessage}
      />
    </CommonBackground>
  );
}
