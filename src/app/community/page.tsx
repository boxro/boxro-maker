"use client";

// 갤러리 페이지 - 박스카 갤러리

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Head from "next/head";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ErrorModal from "@/components/ErrorModal";
import DownloadConfirmModal from "@/components/DownloadConfirmModal";
import { 
  Car,
  Heart, 
  ThumbsUp,
  Share2, 
  Download, 
  Plus,
  MessageCircle,
  Eye,
  Trash2,
  X,
  Upload,
  LinkIcon,
  Mail,
  MessageSquare
} from "lucide-react";
import { useAuth } from '@/contexts/AuthContext';
import { useScrollLock } from '@/hooks/useScrollLock';
import BannerDisplay from '@/components/BannerDisplay';

// 프로필 이미지와 이니셜 생성 유틸리티 함수
const getInitials = (name: string, email?: string): string => {
  // 이메일이 있으면 이메일의 첫 글자, 없으면 이름의 첫 글자 사용
  if (email) return email.charAt(0).toUpperCase();
  if (name && name !== 'Anonymous') return name.charAt(0).toUpperCase();
  return 'U';
};


const getProfileColor = (name: string): string => {
  const colors = [
    'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500',
    'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500'
  ];
  const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
};

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
          console.log('📋 authorId로 조회:', authorId);
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
          console.log('📧 authorEmail로 조회:', authorEmail);
          try {
            // authorId가 없으면 authorEmail로 사용자 찾기
            const usersRef = collection(db, 'users');
            const userQuery = query(usersRef, where('email', '==', authorEmail));
            const userSnapshot = await getDocs(userQuery);
            
            if (!userSnapshot.empty) {
              userDoc = userSnapshot.docs[0];
              console.log('✅ 이메일로 사용자 찾음');
            } else {
              console.log('❌ 이메일로 사용자 못찾음');
            }
          } catch (error: any) {
            if (error.code === 'permission-denied') {
              console.log('🔧 Firebase 보안 규칙 설정 대기 중 - authorEmail 조회 건너뜀');
            } else {
              throw error;
            }
          }
        } else if (authorName && authorName !== 'Anonymous') {
          console.log('👤 authorName으로 조회:', authorName);
          try {
            // authorId와 authorEmail이 모두 없으면 authorName으로 사용자 찾기
            const usersRef = collection(db, 'users');
            const userQuery = query(usersRef, where('displayName', '==', authorName));
            const userSnapshot = await getDocs(userQuery);
            
            if (!userSnapshot.empty) {
              userDoc = userSnapshot.docs[0];
              console.log('✅ 이름으로 사용자 찾음');
            } else {
              console.log('❌ 이름으로 사용자 못찾음');
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
          
        } else {
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

  return (
    <div className={`${size} ${getProfileColor(authorName)} rounded-full flex items-center justify-center flex-shrink-0`}>
      <span className="text-white text-xs font-medium">
        {getInitials(authorName, authorEmail)}
      </span>
    </div>
  );
};
// @ts-ignore - Firebase db 타입 이슈
import { db } from '@/lib/firebase';
import type { Firestore } from 'firebase/firestore';
import CommonHeader from '@/components/CommonHeader';
import CommonBackground from '@/components/CommonBackground';
import PageHeader from '@/components/PageHeader';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, orderBy, where, limit, increment, writeBatch, startAfter, DocumentSnapshot, arrayUnion, getDoc, serverTimestamp } from 'firebase/firestore';
// Firebase Storage 사용하지 않음 (무료 대안 사용)

interface GalleryDesign {
  id: string;
  name: string;
  type: string;
  author: string;
  authorNickname?: string;
  authorEmail: string;
  authorId: string;
  thumbnail: string;
  likes: number;
  downloads: number;
  views: number;
  boxroTalks: number;
  shares: number;
  popularityBoost?: {likes: number, shares: number, views: number} | null;
  createdAt: Date;
  updatedAt: Date;
  isLiked: boolean;
  likedBy: string[];
  isShared?: boolean;
  sharedBy?: string[];
  isDownloaded?: boolean;
  downloadedBy?: string[];
  isBoxroTalked?: boolean;
  boxroTalkedBy?: string[];
  description?: string;
  tags?: string[];
  blueprintImages?: string[];
  isUploaded?: boolean; // 파일 업로드로 생성된 카드인지 구분
}

interface BoxroTalk {
  id: string;
  designId: string;
  author: string;
  authorEmail: string;
  authorId: string;
  text: string;
  createdAt: any; // Firestore Timestamp
  updatedAt?: any; // Firestore Timestamp
}

// 이모지를 고려한 안전한 문자열 자르기 함수
const truncateText = (text: string, maxLength: number) => {
  if (text.length <= maxLength) return text;
  
  // 이모지와 멀티바이트 문자를 고려하여 자르기
  const truncated = text.slice(0, maxLength);
  // 마지막 문자가 잘린 이모지인지 확인하고 조정
  const lastChar = truncated[truncated.length - 1];
  if (lastChar && /[\uD800-\uDFFF]/.test(lastChar)) {
    return truncated.slice(0, -1) + '...';
  }
  return truncated + '...';
};

export default function GalleryPage() {
  const { user } = useAuth();
  
  // 디버깅: 사용자 인증 상태 확인
  useEffect(() => {
    console.log('🔐 사용자 인증 상태:', {
      user: user,
      isAuthenticated: !!user,
      uid: user?.uid,
      email: user?.email
    });
  }, [user]);
  const [designs, setDesigns] = useState<GalleryDesign[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [lastDoc, setLastDoc] = useState<DocumentSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showBoxroTalkModal, setShowBoxroTalkModal] = useState(false);
  const [selectedDesign, setSelectedDesign] = useState<GalleryDesign | null>(null);
  const [boxroTalkText, setBoxroTalkText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  // 파일 업로드 관련 상태
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  
  // 수정 모달 관련 상태
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingDesign, setEditingDesign] = useState<GalleryDesign | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editFile, setEditFile] = useState<File | null>(null);
  const [editPreview, setEditPreview] = useState<string | null>(null);
  const [showEditSuccessModal, setShowEditSuccessModal] = useState(false);
  
  const [showUploadSuccessModal, setShowUploadSuccessModal] = useState(false);
  const [showBoxroTalksModal, setShowBoxroTalksModal] = useState(false);

  // 모달이 열릴 때 배경 스크롤 방지
  useScrollLock(showUploadModal || showUploadSuccessModal || showBoxroTalksModal);
  
  // 이모지 목록
  const emojis = ['😊', '😍', '👍', '❤️', '🎉', '✨', '🔥', '💯', '😄', '🥰', '😎', '🤔', '😢', '😮', '👏', '🙌'];
  
  // 이모지 선택 핸들러
  const handleEmojiClick = (emoji: string) => {
    setBoxroTalkText(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  // 이모지 피커 외부 클릭 시 닫기
  useEffect(() => {
    if (!showEmojiPicker) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.emoji-picker-container')) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showEmojiPicker]);
  const [boxroTalks, setBoxroTalks] = useState<BoxroTalk[]>([]);
  const [editingBoxroTalk, setEditingBoxroTalk] = useState<string | null>(null);
  const [editBoxroTalkText, setEditBoxroTalkText] = useState('');
  const [showMyDesigns, setShowMyDesigns] = useState(false);
  const [boxroTalksForDesign, setBoxroTalksForDesign] = useState<BoxroTalk[]>([]);
  const [loadingBoxroTalks, setLoadingBoxroTalks] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareDesignId, setShareDesignId] = useState<string | null>(null);
  const [showShareSuccessModal, setShowShareSuccessModal] = useState(false);
  const [showDownloadConfirmModal, setShowDownloadConfirmModal] = useState(false);
  const [pendingDownloadId, setPendingDownloadId] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteDesignId, setDeleteDesignId] = useState<string | null>(null);
  
  // 로그인 유도 모달 상태
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginModalType, setLoginModalType] = useState<'like' | 'share' | 'boxroTalk' | 'download'>('like');
  const [loginModalDesignId, setLoginModalDesignId] = useState<string | null>(null);
  
  // 오류 모달 상태
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // 안내 모달 상태
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [infoMessage, setInfoMessage] = useState('');
  


  // 관리자 권한 체크
  const isAdmin = () => {
    if (!user) return false;
    const adminEmails = [
      "beagle3651@gmail.com", 
      "boxro.crafts@gmail.com"
    ];
    return adminEmails.includes(user.email || '');
  };




  // Firebase에서 작품 데이터 가져오기 (첫 로딩)
  const fetchDesigns = useCallback(async () => {
    try {
      setLoading(true);
      setDesigns([]);
      setLastDoc(null);
      setHasMore(true);
      
      const designsRef = collection(db, 'communityDesigns');
      const q = query(designsRef, orderBy('createdAt', 'desc'), limit(15)); // 원래대로 복구
      const querySnapshot = await getDocs(q);
      
      const designsData: GalleryDesign[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        
        const currentUserId = user?.uid || null;
        designsData.push({
          id: doc.id,
          name: data.name || 'Untitled',
          type: data.type || 'sedan',
          author: data.author || (data.authorEmail ? data.authorEmail.split('@')[0] : 'Anonymous'),
          authorNickname: data.authorNickname || '',
          authorEmail: data.authorEmail || '',
          authorId: data.authorId || '',
          thumbnail: data.thumbnail || '/api/placeholder/300/200',
          likes: data.likes || 0,
          downloads: data.downloads || 0,
          views: data.views || 0,
          boxroTalks: data.boxroTalks || 0,
          shares: data.shares || 0,
          popularityBoost: data.popularityBoost || null,
          createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt),
          updatedAt: data.updatedAt?.toDate?.() || new Date(data.updatedAt),
          
          // ===== 버튼 활성화 상태 관리 =====
          // 중요: 모든 버튼(좋아요, 공유, 다운로드, 박스로 톡)은 동일한 방식으로 처리됩니다
          // 1. Firestore에 배열로 사용자 ID 저장 (likedBy, sharedBy, downloadedBy, commentedBy)
          // 2. 클라이언트에서 현재 사용자가 해당 배열에 포함되어 있는지 확인하여 boolean 계산
          // 3. UI에서 boolean 속성으로 버튼 활성화 상태 표시
          // 4. 페이지 이동 후에도 Firestore에서 다시 로드되므로 상태 지속성 보장
          
          // 좋아요 상태
          isLiked: currentUserId ? (data.likedBy?.includes(currentUserId) || false) : false,
          likedBy: data.likedBy || [],
          
          // 공유 상태  
          isShared: currentUserId ? (data.sharedBy?.includes(currentUserId) || false) : false,
          sharedBy: data.sharedBy || [],
          
          // 다운로드 상태
          isDownloaded: currentUserId ? (data.downloadedBy?.includes(currentUserId) || false) : false,
          downloadedBy: data.downloadedBy || [],
          
          // 박스로 톡 상태
          isBoxroTalked: currentUserId ? (data.boxroTalkedBy?.includes(currentUserId) || false) : false,
          boxroTalkedBy: data.boxroTalkedBy || [],
          
          description: data.description || '',
          tags: data.tags || [],
          blueprintImages: data.blueprintImages || []
        });
      });
      
      setDesigns(designsData);
      setLastDoc(querySnapshot.docs[querySnapshot.docs.length - 1] || null);
      setHasMore(querySnapshot.docs.length === 10);
      setError(null);
    } catch (err) {
      console.error('작품 데이터 로드 실패:', err);
      setError('작품을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  // 추가 작품 데이터 로딩 (무한 스크롤)
  const loadMoreDesigns = useCallback(async () => {
    if (loadingMore || !hasMore || !lastDoc) return;
    
    try {
      setLoadingMore(true);
      
      const designsRef = collection(db, 'communityDesigns');
      const q = query(
        designsRef, 
        orderBy('createdAt', 'desc'), 
        startAfter(lastDoc),
        limit(15)
      );
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        setHasMore(false);
        return;
      }
      
      const newDesigns: GalleryDesign[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        
        const currentUserId = user?.uid || null;
        newDesigns.push({
          id: doc.id,
          name: data.name || 'Untitled',
          type: data.type || 'sedan',
          author: data.author || (data.authorEmail ? data.authorEmail.split('@')[0] : 'Anonymous'),
          authorNickname: data.authorNickname || '',
          authorEmail: data.authorEmail || '',
          authorId: data.authorId || '',
          thumbnail: data.thumbnail || '/api/placeholder/300/200',
          likes: data.likes || 0,
          downloads: data.downloads || 0,
          views: data.views || 0,
          boxroTalks: data.boxroTalks || 0,
          shares: data.shares || 0,
          popularityBoost: data.popularityBoost || null,
          createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt),
          updatedAt: data.updatedAt?.toDate?.() || new Date(data.updatedAt),
          isLiked: currentUserId ? (data.likedBy?.includes(currentUserId) || false) : false,
          likedBy: data.likedBy || [],
          isShared: currentUserId ? (data.sharedBy?.includes(currentUserId) || false) : false,
          sharedBy: data.sharedBy || [],
          isDownloaded: currentUserId ? (data.downloadedBy?.includes(currentUserId) || false) : false,
          downloadedBy: data.downloadedBy || [],
          isBoxroTalked: currentUserId ? (data.boxroTalkedBy?.includes(currentUserId) || false) : false,
          boxroTalkedBy: data.boxroTalkedBy || [],
          description: data.description || '',
          tags: data.tags || [],
          blueprintImages: data.blueprintImages || []
        });
      });
      
      setDesigns(prev => [...prev, ...newDesigns]);
      setLastDoc(querySnapshot.docs[querySnapshot.docs.length - 1] || null);
      setHasMore(querySnapshot.docs.length === 10);
    } catch (err) {
      console.error('추가 작품 로드 실패:', err);
    } finally {
      setLoadingMore(false);
    }
  }, [lastDoc, hasMore, loadingMore, user?.uid]);

  // 컴포넌트 마운트 시 및 사용자 상태 변경 시 데이터 로드
  useEffect(() => {
    fetchDesigns();
  }, [fetchDesigns]);


  // 무한 스크롤 이벤트 리스너
  useEffect(() => {
    const handleScroll = () => {
      if (loadingMore || !hasMore || !lastDoc) return;
      
      if (window.innerHeight + document.documentElement.scrollTop >= document.documentElement.offsetHeight - 1000) {
        loadMoreDesigns();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loadMoreDesigns, lastDoc, hasMore, loadingMore]);

  // 컴포넌트 언마운트 시 배경 스크롤 복원
  useEffect(() => {
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  // ===== 좋아요 토글 함수 =====
  // 중요: 이 함수는 다른 버튼들(공유, 다운로드, 박스로 톡)의 표준 패턴입니다
  // 1. Firestore 업데이트 (숫자 + 배열)
  // 2. 로컬 상태 업데이트 (숫자 + 배열 + boolean)
  const toggleLike = async (designId: string) => {
    if (!user) {
      openLoginModal('like', designId);
      return;
    }

    try {
      const designRef = doc(db, 'communityDesigns', designId);
      const design = designs.find(d => d.id === designId);
      
      if (!design) return;

      const isCurrentlyLiked = design.isLiked;
      const newLikes = isCurrentlyLiked ? design.likes - 1 : design.likes + 1;
      
      // Firebase 업데이트
      await updateDoc(designRef, {
        likes: newLikes,
        likedBy: isCurrentlyLiked 
          ? design.likedBy?.filter((uid: string) => uid !== user.uid) || []
          : [...(design.likedBy || []), user.uid]
      });

      // 로컬 상태 업데이트
      setDesigns(prevDesigns => 
        prevDesigns.map(d => 
          d.id === designId 
            ? { 
                ...d, 
                likes: newLikes, 
                isLiked: !isCurrentlyLiked,
                likedBy: isCurrentlyLiked 
                  ? d.likedBy?.filter((uid: string) => uid !== user.uid) || []
                  : [...(d.likedBy || []), user.uid]
              }
            : d
        )
      );
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

  // ===== 다운로드 함수 =====
  // 중요: 좋아요와 동일한 패턴으로 처리됩니다
  // 1. Firestore 업데이트 (increment + arrayUnion)
  // 2. 로컬 상태 업데이트 (숫자 + 배열 + boolean)
  // 3. 실제 파일 다운로드 실행
  const handleDownload = async (designId: string) => {
    if (!user) {
      openLoginModal('download', designId);
      return;
    }

    // 다운로드 확인 모달 표시
    setPendingDownloadId(designId);
    setShowDownloadConfirmModal(true);
  };

  const executeDownload = async (designId: string) => {
    try {
      const designRef = doc(db, 'communityDesigns', designId);
      const design = designs.find(d => d.id === designId);
      
      if (!design) return;

      // 다운로드 수 증가 및 사용자 ID 저장
      await updateDoc(designRef, {
        downloads: increment(1),
        downloadedBy: arrayUnion(user.uid)
      });

      // 로컬 상태 업데이트
      setDesigns(prevDesigns => 
        prevDesigns.map(d => 
          d.id === designId 
            ? { 
                ...d, 
                downloads: d.downloads + 1, 
                downloadedBy: [...(d.downloadedBy || []), user.uid],
                isDownloaded: true
              }
            : d
        )
      );


      // 실제 다운로드 로직
      try {
        if (design.blueprintImages && design.blueprintImages.length > 0) {
          // PDF 다운로드 (my-designs와 동일한 방식)
          const { default: jsPDF } = await import('jspdf');
          
          const pdf = new jsPDF({
            orientation: 'landscape',
            unit: 'mm',
            format: 'a4'
          });
          
          // 각 blueprint 이미지를 PDF에 추가
          for (let i = 0; i < (design.blueprintImages?.length || 0); i++) {
            if (i > 0) {
              pdf.addPage();
            }
            
            const img = new Image();
            img.crossOrigin = 'anonymous';
            
            await new Promise((resolve, reject) => {
              img.onload = () => {
                pdf.addImage(img, 'PNG', 0, 0, 297, 210);
                resolve(true);
              };
              img.onerror = reject;
              img.src = design.blueprintImages![i];
            });
          }
          
          // PDF 다운로드 - 파일명 규칙: boxro_pattern_release_yyyymmddhhmm
          const now = new Date();
          const year = now.getFullYear();
          const month = String(now.getMonth() + 1).padStart(2, '0');
          const day = String(now.getDate()).padStart(2, '0');
          const hours = String(now.getHours()).padStart(2, '0');
          const minutes = String(now.getMinutes()).padStart(2, '0');
          const timestamp = `${year}${month}${day}${hours}${minutes}`;
          
          pdf.save(`boxro_pattern_release_${timestamp}.pdf`);
        } else {
          // blueprintImages가 없는 경우 JSON으로 다운로드
          const designData = {
            name: design.name,
            type: design.type,
            author: design.author,
            tags: design.tags,
            createdAt: design.createdAt
          };
          
          const dataStr = JSON.stringify(designData, null, 2);
          const dataBlob = new Blob([dataStr], { type: 'application/json' });
          const url = URL.createObjectURL(dataBlob);
          
          const link = document.createElement('a');
          link.href = url;
          link.download = `${design.name}_${design.type}.json`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          
          alert('JSON 파일 다운로드가 완료되었습니다!');
        }
      } catch (downloadError) {
        console.error('파일 다운로드 실패:', downloadError);
        setErrorMessage('파일 다운로드 중 오류가 발생했습니다.');
        setShowErrorModal(true);
      }
    } catch (error) {
      console.error('다운로드 실패:', error);
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
      console.error('오류 상세:', {
        message: errorMessage,
        stack: error instanceof Error ? error.stack : undefined
      });
      setErrorMessage('다운로드 중 오류가 발생했습니다.');
      setShowErrorModal(true);
    }
  };

  const filteredAndSortedDesigns = designs
    .filter((design, index, self) => {
      // 중복 제거: 같은 id를 가진 첫 번째 항목만 유지
      return self.findIndex(d => d.id === design.id) === index;
    })
    .filter(design => {
      if (!showMyDesigns) {
        // 전체 작품 표시
        return true;
      } else {
        // 내 작품만 표시
        const isMyDesign = user && (
          design.authorId === user.uid || 
          design.authorEmail === user.email
        );
        return isMyDesign;
      }
    })
    .sort((a, b) => {
      // 최신순으로 정렬
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'sedan': return 'bg-blue-100 text-blue-800'; // 꼬마세단(sedan)
      case 'suv': return 'bg-green-100 text-green-800'; // SUV(suv)
      case 'truck': return 'bg-orange-100 text-orange-800'; // 빵빵트럭(truck)
      case 'bus': return 'bg-purple-100 text-purple-800'; // 네모버스(bus)
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // ===== 공유 함수 =====
  // 중요: 비로그인 사용자도 공유 가능하도록 수정
  // 1. Firestore 업데이트 (increment + arrayUnion)
  // 2. 로컬 상태 업데이트 (숫자 + 배열 + boolean)
  // 3. Web Share API 또는 클립보드 복사 실행
  const shareDesign = async (designId: string) => {
    try {
      // 공유 횟수 증가 (로그인 여부와 관계없이)
      try {
        if (user) {
          // 로그인 사용자: sharedBy 배열에 추가
          await updateDoc(doc(db, 'communityDesigns', designId), {
            shares: increment(1),
            sharedBy: arrayUnion(user.uid)
          });
        } else {
          // 비로그인 사용자: shares만 증가
          await updateDoc(doc(db, 'communityDesigns', designId), {
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
      setDesigns(prevDesigns => 
        prevDesigns.map(d => 
          d.id === designId 
            ? { 
                ...d, 
                shares: (d.shares || 0) + 1, 
                sharedBy: user ? [...(d.sharedBy || []), user.uid] : (d.sharedBy || []),
                isShared: true
              }
            : d
        )
      );

      
      const shareUrl = `${window.location.origin}/gallery#${designId}`;
      
      // 모든 디바이스에서 공유 모달 표시
      setShareDesignId(designId);
      setShowShareModal(true);
    } catch (error) {
      console.error('공유 횟수 업데이트 실패:', error);
      // 에러가 발생해도 공유 기능은 계속 진행
      const shareUrl = `${window.location.origin}/gallery#${designId}`;
      
      // 모든 디바이스에서 공유 모달 표시
      setShareDesignId(designId);
      setShowShareModal(true);
    }
  };

  // 로그인 유도 모달 열기
  const openLoginModal = (type: 'like' | 'share' | 'comment' | 'download', designId: string) => {
    setLoginModalType(type);
    setLoginModalDesignId(designId);
    setShowLoginModal(true);
  };

  // 로그인 유도 모달 닫기
  const closeLoginModal = () => {
    setShowLoginModal(false);
    setLoginModalType('like');
    setLoginModalDesignId(null);
  };

  // 로그인 후 원래 기능 실행
  const handleLoginAndAction = () => {
    closeLoginModal();
    // 로그인 페이지로 이동
    window.location.href = '/auth';
  };

  // 뷰 카운트 증가
  const incrementViewCount = async (designId: string) => {
    // 로그아웃 상태에서는 뷰 카운트 증가를 시도하지 않음
    if (!user) {
      console.log('🔧 로그아웃 상태 - 뷰 카운트 증가 건너뜀');
      return;
    }

    try {
      console.log('🔍 뷰 카운트 증가 시도:', { designId, user: user?.uid, isAuthenticated: !!user });
      
      await updateDoc(doc(db, 'communityDesigns', designId), {
        views: increment(1)
      });
      
      console.log('✅ 뷰 카운트 증가 성공');
      
      // 로컬 상태도 업데이트
      setDesigns(prevDesigns => 
        prevDesigns.map(design => 
          design.id === designId 
            ? { ...design, views: design.views + 1 }
            : design
        )
      );
    } catch (error: any) {
      console.error('❌ 뷰 카운트 증가 실패:', {
        code: error.code,
        message: error.message,
        designId,
        user: user?.uid,
        isAuthenticated: !!user
      });
      
      if (error.code === 'permission-denied') {
        console.log('🔧 Firebase 보안 규칙 설정 대기 중 - 뷰 카운트 증가 건너뜀');
        // 로컬 상태만 업데이트 (Firebase 저장 실패해도 UI는 업데이트)
        setDesigns(prevDesigns => 
          prevDesigns.map(design => 
            design.id === designId 
              ? { ...design, views: design.views + 1 }
              : design
          )
        );
      } else {
        console.error('뷰 카운트 증가 실패:', error);
      }
    }
  };

  // 박스로 톡 모달 열기
  const openBoxroTalkModal = (design: GalleryDesign) => {
    setSelectedDesign(design);
    setShowBoxroTalkModal(true);
  };

  // 박스로 톡 모달 닫기
  const closeBoxroTalkModal = () => {
    setShowBoxroTalkModal(false);
    setSelectedDesign(null);
    setBoxroTalkText('');
  };


  // 박스로 톡 목록 가져오기
  const fetchBoxroTalks = async (designId: string) => {
    try {
      // 인덱스 없이 작동하도록 수정: orderBy 제거하고 클라이언트에서 정렬
      const boxroTalksQuery = query(
        collection(db, 'boxroTalks'),
        where('designId', '==', designId)
      );
      const boxroTalksSnapshot = await getDocs(boxroTalksQuery);
      const boxroTalksData: BoxroTalk[] = boxroTalksSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as BoxroTalk));
      
      // 클라이언트에서 날짜순 정렬
      boxroTalksData.sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
        return dateB.getTime() - dateA.getTime(); // 최신순
      });
      
      setBoxroTalks(boxroTalksData);
    } catch (error) {
      console.error('박스로 톡 가져오기 실패:', error);
    }
  };

  // 박스로 톡 목록 모달 열기
  const openBoxroTalksModal = async (design: GalleryDesign) => {
    setSelectedDesign(design);
    setShowBoxroTalksModal(true);
    setLoadingBoxroTalks(true);
    setBoxroTalksForDesign([]); // 이전 박스로 톡 목록 초기화
    
    // 배경 스크롤 방지는 useScrollLock 훅에서 처리
    
    try {
      const boxroTalksQuery = query(
        collection(db, 'boxroTalks'),
        where('designId', '==', design.id)
      );
      const boxroTalksSnapshot = await getDocs(boxroTalksQuery);
      const boxroTalksData: BoxroTalk[] = boxroTalksSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as BoxroTalk)).sort((a, b) => {
        const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
        const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
        return dateB.getTime() - dateA.getTime(); // 최신순
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
    setSelectedDesign(null);
    setBoxroTalksForDesign([]);
    
    // 배경 스크롤 복원은 useScrollLock 훅에서 처리
  };

  // 디자인 삭제 모달 열기
  const openDeleteModal = (designId: string) => {
    setDeleteDesignId(designId);
    setShowDeleteModal(true);
  };

  // 수정 모달 열기
  const openEditModal = (design: GalleryDesign) => {
    setEditingDesign(design);
    setEditTitle(design.name);
    setEditFile(null);
    setEditPreview(null);
    setShowEditModal(true);
  };

  // 수정 모달 닫기
  const closeEditModal = () => {
    setShowEditModal(false);
    setEditingDesign(null);
    setEditTitle('');
    setEditFile(null);
    setEditPreview(null);
  };

  // 수정 성공 모달 닫기
  const closeEditSuccessModal = () => {
    setShowEditSuccessModal(false);
  };

  // 디자인 삭제 모달 닫기
  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setDeleteDesignId(null);
  };

  // 박스카 갤러리 작품 삭제
  const deleteDesign = async () => {
    if (!user || !deleteDesignId) return;

    try {
      // 삭제할 작품 정보 가져오기
      const design = designs.find(d => d.id === deleteDesignId);
      if (!design) {
        setErrorMessage('작품을 찾을 수 없습니다.');
        setShowErrorModal(true);
        return;
      }

      // 권한 확인 (작성자 또는 관리자)
      const isAuthor = (design.authorId && user.uid === design.authorId) || 
                      (!design.authorId && user.email === design.authorEmail);
      const isAdminUser = isAdmin();
      
      if (!isAuthor && !isAdminUser) {
        setErrorMessage('본인이 작성한 작품만 삭제할 수 있습니다.');
        setShowErrorModal(true);
        return;
      }

      // 1. 관련 박스로 톡들 모두 삭제
      const boxroTalksQuery = query(
        collection(db, 'boxroTalks'),
        where('designId', '==', deleteDesignId)
      );
      const boxroTalksSnapshot = await getDocs(boxroTalksQuery);
      
      // 박스로 톡들을 배치로 삭제
      const batch = writeBatch(db);
      boxroTalksSnapshot.forEach((boxroTalkDoc) => {
        batch.delete(boxroTalkDoc.ref);
      });
      
      // 2. 작품 정보 삭제
      batch.delete(doc(db, 'communityDesigns', deleteDesignId));
      
      // 3. 모든 삭제 작업 실행
      await batch.commit();

      // 로컬 상태에서 제거
      setDesigns(prevDesigns => 
        prevDesigns.filter(design => design.id !== deleteDesignId)
      );

      // 모달 닫기
      closeDeleteModal();
      
    } catch (error) {
      console.error('작품 삭제 실패:', error);
      setErrorMessage('작품 삭제 중 오류가 발생했습니다.');
      setShowErrorModal(true);
    }
  };

  // 박스로 톡 수정
  const editComment = async (commentId: string) => {
    if (!user || !editCommentText.trim()) return;

    try {
      // 사용자의 최신 닉네임 가져오기
      let userNickname = user.displayName || (user.email ? user.email.split('@')[0] : 'Anonymous');
      try {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const userData = userSnap.data();
          userNickname = userData.authorNickname || userData.displayName || user.displayName || (user.email ? user.email.split('@')[0] : 'Anonymous');
        }
      } catch (error) {
        console.warn('사용자 닉네임 조회 실패, 기본값 사용:', error);
      }

      // Firestore에서 박스로 톡 수정
      await updateDoc(doc(db, 'boxroTalks', commentId), {
        text: editCommentText.trim(),
        authorNickname: userNickname, // 최신 닉네임으로 업데이트
        updatedAt: new Date()
      });

      // 박스로 톡 목록 새로고침
      if (selectedDesign) {
        await fetchBoxroTalks(selectedDesign.id);
      }

      setEditingComment(null);
      setEditCommentText('');
      alert('박스로 톡이 수정되었습니다.');
    } catch (error) {
      console.error('박스로 톡 수정 실패:', error);
      setErrorMessage('박스로 톡 수정 중 오류가 발생했습니다.');
      setShowErrorModal(true);
    }
  };

  // 박스로 톡 삭제
  const deleteComment = async (commentId: string) => {
    if (!user) return;
    
    // 박스로 톡 정보 가져오기
    const comment = boxroTalksForDesign.find(c => c.id === commentId);
    if (!comment) return;
    
    // 권한 확인 (작성자 또는 관리자)
    const isAuthor = user.uid === comment.authorId;
    const isAdminUser = isAdmin();
    
    if (!isAuthor && !isAdminUser) {
      setErrorMessage('본인이 작성한 박스로 톡만 삭제할 수 있습니다.');
      setShowErrorModal(true);
      return;
    }

    try {
      // 박스로 톡 삭제
      await deleteDoc(doc(db, 'boxroTalks', commentId));

      // 박스로 톡 수 감소
      if (selectedDesign) {
        try {
          await updateDoc(doc(db, 'communityDesigns', selectedDesign.id), {
            boxroTalks: increment(-1)
          });
        } catch (error: any) {
          if (error.code === 'permission-denied') {
            console.log('🔧 Firebase 보안 규칙 설정 대기 중 - 박스로 톡 수 감소 건너뜀');
          } else {
            console.error('박스로 톡 수 감소 실패:', error);
          }
        }

        // 로컬 상태 업데이트
        setDesigns(prevDesigns => 
          prevDesigns.map(design => 
            design.id === selectedDesign.id 
              ? { ...design, boxroTalks: Math.max(0, design.boxroTalks - 1) }
              : design
          )
        );
      }

      // 박스로 톡 목록 새로고침
      if (selectedDesign) {
        await fetchBoxroTalks(selectedDesign.id);
        // 추가로 박스로 톡 목록 상태도 직접 업데이트
        setBoxroTalksForDesign(prev => prev.filter(comment => comment.id !== commentId));
      }

    } catch (error) {
      console.error('박스로 톡 삭제 실패:', error);
      setErrorMessage('박스로 톡 삭제 중 오류가 발생했습니다.');
      setShowErrorModal(true);
    }
  };

  // ===== 박스로 톡 추가 함수 =====
  // 중요: 좋아요와 동일한 패턴으로 처리됩니다
  // 1. 박스로 톡 컬렉션에 박스로 톡 추가
  // 2. Firestore 업데이트 (increment + arrayUnion)
  // 3. 로컬 상태 업데이트 (숫자 + 배열 + boolean)
  const addComment = async () => {
    if (!user || !selectedDesign || !boxroTalkText.trim()) return;

    try {
      // 사용자의 최신 닉네임 가져오기
      let userNickname = user.displayName || (user.email ? user.email.split('@')[0] : 'Anonymous');
      try {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const userData = userSnap.data();
          userNickname = userData.authorNickname || userData.displayName || user.displayName || (user.email ? user.email.split('@')[0] : 'Anonymous');
        }
      } catch (error) {
        console.warn('사용자 닉네임 조회 실패, 기본값 사용:', error);
      }

      // 박스로 톡 컬렉션에 박스로 톡 추가
      const commentData = {
        designId: selectedDesign.id,
        author: user.displayName || (user.email ? user.email.split('@')[0] : 'Anonymous'),
        authorNickname: userNickname, // Firestore에서 가져온 최신 닉네임 사용
        authorEmail: user.email || '',
        authorId: user.uid,
        text: boxroTalkText.trim(),
        createdAt: new Date()
      };
      const commentRef = await addDoc(collection(db, 'boxroTalks'), commentData);
      // 박스로 톡 수 증가 및 사용자 ID 저장
      try {
        await updateDoc(doc(db, 'communityDesigns', selectedDesign.id), {
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
      setDesigns(prevDesigns => 
        prevDesigns.map(design => 
          design.id === selectedDesign.id 
            ? { 
                ...design, 
                boxroTalks: design.boxroTalks + 1,
                boxroTalkedBy: [...(design.boxroTalkedBy || []), user.uid],
                isBoxroTalked: true
              }
            : design
        )
      );


      setBoxroTalkText('');
      
      // 박스로 톡 목록이 열려있다면 새로고침
      if (showBoxroTalksModal && selectedDesign) {
        // 박스로 톡 목록 새로고침
        try {
          const commentsQuery = query(
            collection(db, 'boxroTalks'),
            where('designId', '==', selectedDesign.id)
          );
          const commentsSnapshot = await getDocs(commentsQuery);
          const commentsData: BoxroTalk[] = commentsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          } as BoxroTalk)).sort((a, b) => {
            const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
            const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
            return dateB.getTime() - dateA.getTime(); // 최신순
          });
          setBoxroTalksForDesign(commentsData);
        } catch (error) {
          console.error('박스로 톡 새로고침 오류:', error);
        }
      } else {
        // 박스로 톡 모달이 닫혀있다면 닫기
        closeCommentModal();
      }
      
    } catch (error) {
      console.error('박스로 톡 추가 실패:', error);
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
      console.error('오류 상세:', {
        message: errorMessage,
        stack: error instanceof Error ? error.stack : undefined
      });
      
      if (error instanceof Error && error.message.includes('permission-denied')) {
        setErrorMessage('권한이 없습니다. 로그인 상태를 확인해주세요.');
        setShowErrorModal(true);
      } else if (error instanceof Error && error.message.includes('unavailable')) {
        setErrorMessage('서비스가 일시적으로 사용할 수 없습니다. 잠시 후 다시 시도해주세요.');
        setShowErrorModal(true);
      } else {
        setErrorMessage(`박스로 톡 추가 중 오류가 발생했습니다.\n오류 메시지: ${errorMessage}`);
        setShowErrorModal(true);
      }
    }
  };

  // ===== 파일 업로드 관련 함수들 =====
  
  // 이미지 압축 함수 (450px 리사이즈, 800KB 제한)
  const compressImage = (file: File, maxWidth: number = 450, quality: number = 0.8): Promise<string> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onerror = (error) => {
        console.error('❌ 이미지 로드 실패:', error);
        reject(new Error('이미지 파일을 읽을 수 없습니다. 지원되지 않는 형식이거나 손상된 파일일 수 있습니다.'));
      };
      
      img.onload = () => {
        try {
          // 450px로 강제 리사이즈 (가로 기준)
          const maxWidth = 450;
          const ratio = maxWidth / img.width;
          canvas.width = maxWidth;
          canvas.height = img.height * ratio;
          
          // 이미지 그리기
          ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
          
          // 투명도가 있는 이미지인지 확인
          const imageData = ctx?.getImageData(0, 0, canvas.width, canvas.height);
          const hasTransparency = imageData?.data.some((_, index) => index % 4 === 3 && imageData.data[index] < 255);
          
          // 투명도가 있으면 PNG, 없으면 JPG 사용
          const format = hasTransparency ? 'image/png' : 'image/jpeg';
          let startQuality = hasTransparency ? 0.7 : 0.6;
          
          // 파일 크기가 800KB 이하가 될 때까지 품질을 낮춤
          const compressImageRecursive = (currentQuality: number): string => {
            const dataUrl = canvas.toDataURL(format, currentQuality);
            const sizeKB = dataUrl.length / 1024;
            
            console.log(`갤러리 압축 시도: 품질 ${currentQuality.toFixed(1)}, 크기 ${sizeKB.toFixed(1)}KB`);
            
            // 크기가 여전히 800KB보다 크고 품질을 더 낮출 수 있다면 재귀 호출
            if (sizeKB > 800 && currentQuality > 0.05) {
              return compressImageRecursive(currentQuality - 0.05);
            }
            
            console.log(`갤러리 최종 압축: 품질 ${currentQuality.toFixed(1)}, 크기 ${sizeKB.toFixed(1)}KB`);
            return dataUrl;
          };
          
          resolve(compressImageRecursive(startQuality));
        } catch (error) {
          console.error('❌ 압축 처리 중 오류:', error);
          reject(new Error(`이미지 압축 중 오류가 발생했습니다: ${error.message}`));
        }
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  // 파일 선택 핸들러
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // 이미지 파일만 허용
      if (!file.type.startsWith('image/')) {
        setErrorMessage('이미지 파일만 업로드 가능합니다.');
        setShowErrorModal(true);
        return;
      }
      
      // 파일 크기 제한 (10MB)
      if (file.size > 10 * 1024 * 1024) {
        setErrorMessage('파일 크기는 10MB 이하로 제한됩니다.');
        setShowErrorModal(true);
        return;
      }
      
      try {
        // 이미지 압축 적용
        const compressedImage = await compressImage(file, 450, 0.8);
        setUploadFile(file); // 원본 파일은 유지 (업로드 시 사용)
        setUploadPreview(compressedImage); // 압축된 이미지로 미리보기
      } catch (error) {
        console.error('이미지 압축 실패:', error);
        setErrorMessage('이미지 압축 중 오류가 발생했습니다.');
        setShowErrorModal(true);
        return;
      }
    }
  };


  // 파일 업로드 실행
  const handleFileUpload = async () => {
    if (!user) {
      alert('로그인이 필요합니다.');
      return;
    }

    console.log('Upload state:', { uploadFile: !!uploadFile, uploadTitle });
    
    if (!uploadFile) {
      setInfoMessage('내 박스카 작품 사진을 선택해주세요.');
      setShowInfoModal(true);
      return;
    }
    
    if (!uploadTitle.trim()) {
      setInfoMessage('박스카 작품에 담긴 이야기를 함께 적어주세요.');
      setShowInfoModal(true);
      return;
    }

    if (uploadTitle.length > 20) {
      alert('제목은 20자 이내로 입력해주세요.');
      return;
    }


    try {
      // 이미지 압축 (450px, 800KB 제한)
      const compressedImage = await compressImage(uploadFile, 450, 0.8);
      
      // 사용자의 최신 닉네임 가져오기
      let userNickname = user.displayName || '익명';
      try {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const userData = userSnap.data();
          userNickname = userData.authorNickname || userData.displayName || user.displayName || '익명';
        }
      } catch (error) {
        console.warn('사용자 닉네임 조회 실패, 기본값 사용:', error);
      }

      // Firestore에 문서 추가 (Base64 이미지를 직접 저장)
      const designData = {
        name: uploadTitle.trim(),
        type: 'uploaded', // 업로드된 파일 타입
        author: user.displayName || '익명',
        authorNickname: userNickname,
        authorEmail: user.email || '',
        authorId: user.uid,
        thumbnail: compressedImage, // Base64 이미지를 직접 저장
        thumbnailUrl: compressedImage,
        blueprintImages: [compressedImage], // Base64 이미지를 blueprintImages에 저장
        likes: 0,
        downloads: 0,
        views: 0,
        comments: 0,
        shares: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        likedBy: [],
        sharedBy: [],
        downloadedBy: [],
        commentedBy: [],
        isLiked: false,
        isShared: false,
        isDownloaded: false,
        isBoxroTalked: false,
        isUploaded: true // 업로드된 파일임을 표시
      };

      const docRef = await addDoc(collection(db, 'communityDesigns'), designData);
      
      // 로컬 상태에 새 디자인 추가
      const newDesign: GalleryDesign = {
        id: docRef.id,
        ...designData
      };
      
      setDesigns(prev => [newDesign, ...prev]);
      
      // 모달 닫기 및 상태 초기화
      setShowUploadModal(false);
      setUploadFile(null);
      setUploadTitle('');
      setUploadPreview(null);
      
      setShowUploadSuccessModal(true);
      
    } catch (error) {
      console.error('파일 업로드 실패:', error);
      setErrorMessage('파일 업로드 중 오류가 발생했습니다.');
      setShowErrorModal(true);
    }
  };

  // 업로드 모달 닫기
  const closeUploadModal = () => {
    setShowUploadModal(false);
    setUploadFile(null);
    setUploadTitle('');
    setUploadPreview(null);
  };

  // 수정 처리 함수
  const handleEdit = async () => {
    if (!user || !editingDesign) {
      alert('로그인이 필요합니다.');
      return;
    }

    if (!editTitle.trim()) {
      alert('작품 이야기를 함께 적어주세요.');
      return;
    }

    if (editTitle.length > 20) {
      alert('제목은 20자 이내로 입력해주세요.');
      return;
    }

    // 디버깅 정보 출력
    console.log('🔧 수정 시도 정보:', {
      currentUser: {
        uid: user.uid,
        email: user.email
      },
      editingDesign: {
        id: editingDesign.id,
        authorId: editingDesign.authorId,
        authorEmail: editingDesign.authorEmail,
        author: editingDesign.author
      },
      isAuthor: user.uid === editingDesign.authorId || user.email === editingDesign.authorEmail,
      isAdmin: isAdmin()
    });

    try {
      let thumbnailUrl = editingDesign.thumbnail;
      
      // 새 이미지가 업로드된 경우에만 처리
      if (editFile) {
        const compressedImage = await compressImage(editFile, 450, 0.8);
        thumbnailUrl = compressedImage;
      }

      // Firestore 문서 업데이트
      const designRef = doc(db, 'communityDesigns', editingDesign.id);
      await updateDoc(designRef, {
        name: editTitle.trim(),
        thumbnail: thumbnailUrl,
        updatedAt: serverTimestamp()
      });

      // 로컬 상태 업데이트
      setDesigns(prev => prev.map(design => 
        design.id === editingDesign.id 
          ? { ...design, name: editTitle.trim(), thumbnail: thumbnailUrl }
          : design
      ));

      // 모달 닫기 및 상태 초기화
      closeEditModal();
      setShowEditSuccessModal(true);
      
    } catch (error) {
      console.error('작품 수정 실패:', error);
      setErrorMessage('작품 수정 중 오류가 발생했습니다.');
      setShowErrorModal(true);
    }
  };

  return (
    <CommonBackground>
      <Head>
        <title>박스카 갤러리 | BOXRO 박스로</title>
        <meta name="description" content="친구들의 박스카를 구경하고, 내 작품도 뽐내보세요! 버려진 박스로 만든 창의적인 자동차 작품들을 만나보세요." />
        <meta name="keywords" content="박스카, 갤러리, 친환경, 자동차, 만들기, 창의적, 아이들, 놀이" />
        <meta property="og:title" content="박스카 갤러리 | BOXRO 박스로" />
        <meta property="og:description" content="친구들의 박스카를 구경하고, 내 작품도 뽐내보세요! 버려진 박스로 만든 창의적인 자동차 작품들을 만나보세요." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${process.env.NEXT_PUBLIC_SITE_URL || 'https://boxro.vercel.app'}/community`} />
        <meta property="og:image" content="/og-image.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="박스카 갤러리 | BOXRO 박스로" />
        <meta name="twitter:description" content="친구들의 박스카를 구경하고, 내 작품도 뽐내보세요! 버려진 박스로 만든 창의적인 자동차 작품들을 만나보세요." />
        <meta name="twitter:image" content="/og-image.png" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "CollectionPage",
              "name": "박스카 갤러리",
              "description": "친구들의 박스카를 구경하고, 내 작품도 뽐내보세요! 버려진 박스로 만든 창의적인 자동차 작품들을 만나보세요.",
              "url": `${process.env.NEXT_PUBLIC_SITE_URL || 'https://boxro.vercel.app'}/community`,
              "mainEntity": {
                "@type": "ItemList",
                "name": "박스카 작품들",
                "description": "친환경 박스카 작품 컬렉션"
              }
            })
          }}
        />
      </Head>
      <CommonHeader />
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="mb-6 mt-10 px-0 md:px-0">
          <PageHeader 
            title="박스카 갤러리"
            description="친구들의 박스카를 구경하고, 내 작품도 뽐내보세요!"
          />
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 px-0 md:px-0">
          <div className="flex gap-3">
            <div className="flex items-center gap-6">
              <button
                onClick={() => setShowMyDesigns(false)}
                className={`relative font-medium transition-all duration-200 ${
                  !showMyDesigns 
                    ? 'text-white' 
                    : 'text-white/50 hover:text-white/80'
                }`}
                style={{fontSize: '14px'}}
              >
                전체 갤러리
                {!showMyDesigns && (
                  <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-white rounded-full"></div>
                )}
              </button>
              {user && (
                <button
                  onClick={() => setShowMyDesigns(true)}
                  className={`relative font-medium transition-all duration-200 ${
                    showMyDesigns 
                      ? 'text-white' 
                      : 'text-white/50 hover:text-white/80'
                  }`}
                  style={{fontSize: '14px'}}
                >
                  내가 만든 박스카
                  {showMyDesigns && (
                    <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-white rounded-full"></div>
                  )}
                </button>
              )}
            </div>
          </div>
          {user && (
            <div className="hidden sm:flex gap-3">
              <Link href="/draw" prefetch={false}>
                <Button className="bg-pink-500 hover:bg-pink-600 text-white transition-all duration-200 rounded-full px-6 py-3" style={{fontSize: '14px'}}>
                  <Plus className="w-4 h-4 mr-2" />
                  박스카 그리기
                </Button>
              </Link>
              <Button 
                onClick={() => setShowUploadModal(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white transition-all duration-200 rounded-full px-6 py-3"
                style={{fontSize: '14px'}}
              >
                <Upload className="w-4 h-4 mr-2" />
                내 작품 올리기
              </Button>
            </div>
          )}
        </div>


        {/* Loading State */}
        {loading && (
          <Card className="bg-transparent border-0 shadow-none transition-all duration-300 overflow-hidden py-5 w-full rounded-2xl">
            <CardContent className="text-center py-12">
              {/* 로고 점프 애니메이션 */}
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
                박스카 갤러리를 불러오는 중...
              </h3>
              <p className="text-sm text-white/80">멋진 박스카 작품들을 준비하고 있어요!</p>
            </CardContent>
          </Card>
        )}

        {/* Error State */}
        {error && (
          <Card className="bg-white border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden py-5 w-full rounded-2xl">
            <CardContent className="text-center py-12">
              <div className="text-red-500 text-4xl mb-4">⚠️</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">오류가 발생했습니다</h3>
              <p className="text-gray-800 mb-6">{error}</p>
              <Button 
                onClick={fetchDesigns}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 rounded-full px-6 py-3"
              >
                다시 시도
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Designs Grid */}
        {!loading && !error && filteredAndSortedDesigns.length === 0 ? (
          <Card className="bg-white border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden py-5 w-full rounded-2xl">
            <CardContent className="text-center py-12">
              <Car className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                {showMyDesigns ? '아직 내 작품이 없어요' : '아직 작품이 없어요'}
              </h3>
              <p className="text-sm text-gray-800 mb-6">
                멋진 첫 번째 작품을 올려주세요 🚗✨
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {/* 배너 표시 - 로딩 완료 후에만 표시, 내가 만든 박스카 탭에서는 제외 */}
            {!loading && !showMyDesigns && <BannerDisplay currentPage="gallery" />}
            
            {filteredAndSortedDesigns.filter((design, index, self) => 
              index === self.findIndex(d => d.id === design.id)
            ).map((design, index) => (
              <Card 
                key={`${design.id}-${index}`} 
                className="group bg-white/97 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden w-full rounded-2xl gap-2 flex flex-col [&>*:not(:first-child)]:mt-2 p-0"
              >
                {/* 썸네일 */}
                {design.thumbnail && design.thumbnail !== '/api/placeholder/300/200' && design.thumbnail !== '' ? (
                  <div className="w-full overflow-hidden relative">
                    {/* 수정/삭제 버튼 */}
                    {user && (user.uid === design.authorId || user.email === design.authorEmail || isAdmin()) && (
                      <div className="absolute top-2 right-2 flex gap-1 z-10">
                        <Button
                          variant="outline"
                          className="w-8 h-8 rounded-full p-0 bg-white/90 hover:bg-white text-gray-500 hover:text-gray-800 border border-gray-200 hover:border-gray-300 shadow-lg"
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditModal(design);
                          }}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </Button>
                        <Button
                          variant="outline"
                          className="w-8 h-8 rounded-full p-0 bg-white/90 hover:bg-white text-gray-500 hover:text-gray-800 border border-gray-200 hover:border-gray-300 shadow-lg"
                          onClick={(e) => {
                            e.stopPropagation();
                            openDeleteModal(design.id);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                    
                    <img 
                      src={design.thumbnail} 
                      alt={design.name}
                      className="w-full aspect-[4/3] object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                  </div>
                ) : (
                  <div className="w-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center overflow-hidden relative min-h-32">
                    {/* 수정/삭제 버튼 */}
                    {user && (user.uid === design.authorId || user.email === design.authorEmail || isAdmin()) && (
                      <div className="absolute top-2 right-2 flex gap-1 z-10">
                        <Button
                          variant="outline"
                          className="w-8 h-8 rounded-full p-0 bg-white/90 hover:bg-white text-gray-500 hover:text-gray-800 border border-gray-200 hover:border-gray-300 shadow-lg"
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditModal(design);
                          }}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </Button>
                        <Button
                          variant="outline"
                          className="w-8 h-8 rounded-full p-0 bg-white/90 hover:bg-white text-gray-500 hover:text-gray-800 border border-gray-200 hover:border-gray-300 shadow-lg"
                          onClick={(e) => {
                            e.stopPropagation();
                            openDeleteModal(design.id);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                    <Car className="w-16 h-16 text-gray-400" />
                  </div>
                )}
                
                {/* 상단: 작성자, 제목, 설명 */}
                <CardHeader className="flex-shrink-0 pr-5 relative px-7 pt-1 pb-0">
                  
                  <div className="flex items-center gap-2 mb-2">
                    {/* 작성자 프로필 이미지 */}
                    <ProfileImage 
                      authorId={design.authorId || ''} 
                      authorName={design.authorNickname || design.author} 
                      authorEmail={design.authorEmail}
                      size="w-10 h-10"
                    />
                    
                    {/* 작성자 정보 */}
                    <div className="flex-1">
                      <div className="font-medium text-gray-800 text-sm">
                        {design.authorNickname || design.author}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(design.createdAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-start">
                    <CardTitle 
                      className="text-lg font-semibold flex-1 text-gray-900" 
                      title={design.name}
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
                      {design.name}
                    </CardTitle>
                  </div>
                </CardHeader>
                
                {/* 하단: 통계, 버튼들 */}
                <CardContent className="flex flex-col flex-grow px-6 pt-0 pb-3">
                  
                  
                  {/* 버튼들을 하단에 고정 */}
                  <div className="mt-auto px-0 pb-1">
                    {/* 아이콘과 숫자가 함께 있는 버튼들 */}
                    <div className="flex gap-2 justify-center">
                      <button 
                        onClick={() => toggleLike(design.id)}
                        className={`w-[60px] h-[60px] rounded-full p-0 flex flex-col items-center justify-center gap-1 ${design.isLiked 
                          ? 'bg-rose-400 hover:bg-rose-500 text-white' 
                          : 'bg-white border-2 border-gray-100 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 text-gray-800 shadow-sm'
                        }`}
                      >
                        <ThumbsUp className={`w-5 h-5 ${design.isLiked ? 'text-white' : 'text-gray-500'}`} />
                        <span className={`text-xs font-medium ${design.isLiked ? 'text-white' : 'text-gray-500'}`}>
                          {(design.likes || 0) + (design.popularityBoost?.likes || 0)}
                        </span>
                      </button>
                      <button 
                        className={`w-[60px] h-[60px] rounded-full p-0 flex flex-col items-center justify-center gap-1 ${design.isShared
                          ? 'bg-sky-500 hover:bg-sky-600 text-white' 
                          : 'bg-white border-2 border-gray-100 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 text-gray-800 shadow-sm'
                        }`}
                        onClick={() => shareDesign(design.id)}
                      >
                        <Share2 className={`w-5 h-5 ${design.isShared ? 'text-white' : 'text-gray-500'}`} />
                        <span className={`text-xs font-medium ${design.isShared ? 'text-white' : 'text-gray-500'}`}>
                          {(design.shares || 0) + (design.popularityBoost?.shares || 0)}
                        </span>
                      </button>
                      <button 
                        className={`w-[60px] h-[60px] rounded-full p-0 flex flex-col items-center justify-center gap-1 ${design.isBoxroTalked
                          ? 'bg-blue-400 hover:bg-blue-500 text-white' 
                          : 'bg-white border-2 border-gray-100 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 text-gray-800 shadow-sm'
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (user) {
                            openBoxroTalksModal(design);
                          } else {
                            openLoginModal('comment', design.id);
                          }
                        }}
                      >
                        <MessageCircle className={`w-5 h-5 ${design.isBoxroTalked ? 'text-white' : 'text-gray-500'}`} />
                        <span className={`text-xs font-medium ${design.isBoxroTalked ? 'text-white' : 'text-gray-500'}`}>{design.boxroTalks}</span>
                      </button>
                      {/* 업로드된 파일이 아닌 경우에만 다운로드 버튼 표시 */}
                      {design.type !== 'uploaded' && !design.isUploaded && (
                        <button 
                          className={`w-[60px] h-[60px] rounded-full p-0 flex flex-col items-center justify-center gap-1 ${design.isDownloaded
                            ? 'bg-emerald-500 hover:bg-emerald-600 text-white' 
                            : 'bg-white border-2 border-gray-100 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 text-gray-800 shadow-sm'
                          }`}
                          onClick={() => handleDownload(design.id)}
                        >
                          <Download className={`w-5 h-5 ${design.isDownloaded ? 'text-white' : 'text-gray-500'}`} />
                          <span className={`text-xs font-medium ${design.isDownloaded ? 'text-white' : 'text-gray-500'}`}>
                            {(design.downloads || 0) + (design.popularityBoost?.downloads || 0)}
                          </span>
                        </button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {/* 무한 스크롤 로딩 상태 */}
            {loadingMore && (
              <div className="col-span-full flex justify-center py-8">
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
                  <span className="text-white text-sm">더 많은 박스카 작품을 불러오는 중이에요…</span>
                </div>
              </div>
            )}
            
            {/* 더 이상 데이터가 없을 때 */}
            {!hasMore && designs.length > 0 && (
              <div className="col-span-full flex justify-center py-8">
                <span className="text-white text-sm">모든 박스카 작품을 다 보여드렸어요!</span>
              </div>
            )}
          </div>
        )}



        {/* 박스로 톡 목록 모달 */}
        {showBoxroTalksModal && selectedDesign && (
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
                    <div className="text-gray-900" style={{fontSize: '14px'}}>아직 톡이 없어요. ✨ 첫 톡을 남겨보세요!</div>
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
                              <div className="text-gray-900 whitespace-pre-wrap break-words flex-1" style={{fontSize: '14px'}}>
                                {comment.text}
                              </div>
                            {/* 박스로 톡 삭제 버튼 (작성자 또는 관리자) */}
                            {user && (user.uid === comment.authorId || isAdmin()) && (
                                <button
                                  onClick={() => deleteComment(comment.id)}
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
                          authorName={user.displayName || (user.email ? user.email.split('@')[0] : 'Anonymous')} 
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
                          className="w-full border-4 border-solid border-yellow-400/70 rounded-2xl overflow-hidden p-3 pr-12 focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none text-[14px]"
                        />
                        <button
                          type="button"
                          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                          className="absolute right-3 top-3 p-2 text-gray-500 hover:text-gray-800 transition-colors text-2xl"
                        >
                          😊
                        </button>
                      </div>
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
                  <div className="flex justify-center">
                    <Button
                      onClick={() => addComment()}
                      className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-full px-12"
                      style={{fontSize: '14px'}}
                    >
                      톡 남기기
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {/* 공유 모달 */}
      {showShareModal && shareDesignId && (
        <div className="fixed inset-0 bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-pink-900/20 backdrop-blur-md z-50 flex items-center justify-center overflow-hidden">
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-6 max-w-sm w-full mx-6">
            <div className="text-center">
              <div className="flex justify-center mb-2">
                <div className="text-[30px]">✨</div>
              </div>
              <h3 className="text-lg font-semibold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                작품 공유하기
              </h3>
              <p className="text-gray-900 mb-6 whitespace-pre-line" style={{fontSize: '14px'}}>
                내 박스카를 친구들과 함께 자랑해보세요!{'\n'}카카오톡, 페이스북으로 공유할 수도 있어요.
              </p>
              
              <div className="flex gap-3">
                <Button
                  onClick={() => setShowShareModal(false)}
                  className="flex-1 bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 rounded-full"
                  style={{fontSize: '14px'}}
                >
                  취소
                </Button>
                <Button
                  onClick={async () => {
                    const shareUrl = `${window.location.origin}/gallery#${shareDesignId}`;
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
                  style={{fontSize: '14px'}}
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
              <p className="text-gray-900 mb-6" style={{fontSize: '14px'}}>
                친구들에게 지금 바로 공유해보세요!
              </p>
              
              <Button
                onClick={() => setShowShareSuccessModal(false)}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-full"
                style={{fontSize: '14px'}}
              >
                확인
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 다운로드 확인 모달 */}
      <DownloadConfirmModal
        isOpen={showDownloadConfirmModal}
        onClose={() => {
          setShowDownloadConfirmModal(false);
          setPendingDownloadId(null);
        }}
        onConfirm={() => {
          setShowDownloadConfirmModal(false);
          if (pendingDownloadId) {
            executeDownload(pendingDownloadId);
            setPendingDownloadId(null);
          }
        }}
      />

      {/* 삭제 컨펌 모달 */}
      {showDeleteModal && deleteDesignId && (
        <div className="fixed inset-0 bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-pink-900/20 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 max-w-sm w-full mx-6">
            <div className="p-6">
              <div className="text-center">
                <div className="flex justify-center mb-2">
                  <div className="text-[30px]">🗑️</div>
                </div>
                <h3 className="text-lg font-semibold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                  작품 삭제
                </h3>
                <p className="text-gray-900 mb-6" style={{fontSize: '14px'}}>
                  정말 삭제할까요?<br/>
                  이 작품과 관련된 박스로 톡도 함께 없어집니다.
                </p>
                
                <div className="flex gap-3 mt-6">
                  <Button
                    variant="outline"
                    onClick={closeDeleteModal}
                    className="flex-1 border-2 border-gray-200 hover:bg-gray-50 hover:border-gray-300 rounded-full text-gray-900"
                    style={{fontSize: '14px'}}
                  >
                    취소
                  </Button>
                  <Button
                    onClick={deleteDesign}
                    className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-full"
                    style={{fontSize: '14px'}}
                  >
                    삭제하기
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

        {/* 업로드 성공 모달 */}
        {showUploadSuccessModal && (
          <div className="fixed inset-0 bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-pink-900/20 backdrop-blur-md z-50 flex items-center justify-center">
            <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-6 max-w-sm w-full mx-6">
              <div className="text-center">
                <div className="text-[30px] mb-2">✨</div>
                <h3 className="text-lg font-semibold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                  사진이 멋지게 공유되었어요!
                </h3>
                <p className="text-gray-800 text-sm mb-6">
                  다른 사람들과 함께 멋진 작품을 나눠보세요
                </p>
                <div className="flex gap-3 mt-6">
                  <Button
                    onClick={() => setShowUploadSuccessModal(false)}
                    className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-full"
                  >
                    확인
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 파일 업로드 모달 */}
        {showUploadModal && (
        <div className="fixed inset-0 bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-pink-900/20 backdrop-blur-md z-50 flex items-center justify-center overflow-hidden">
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-6 max-w-sm w-full mx-6">
            <div className="text-center">
              <div className="flex justify-center mb-2">
                <div className="text-[30px]">✨</div>
              </div>
              <h3 className="text-lg font-semibold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                내 작품 올리기
              </h3>
              <p className="text-gray-800 text-sm mb-6">
                세상에 단 하나뿐인 내 박스카를 자랑해보세요!
              </p>

              {/* 파일 선택 */}
              <div className="mb-6">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  id="file-upload"
                  className="hidden"
                />
                <label
                  htmlFor="file-upload"
                  className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors flex flex-col items-center justify-center"
                >
                  <Upload className="w-8 h-8 text-gray-400 mb-2" />
                  <span className="text-gray-800 font-medium text-[14px]">
                    {uploadFile ? '내 작품 사진이 선택되었어요' : '내 작품 사진을 선택해주세요'}
                  </span>
                </label>
                {uploadPreview && (
                  <div className="mt-3">
                    <img
                      src={uploadPreview}
                      alt="미리보기"
                      className="w-full aspect-[4/3] object-cover rounded-lg"
                    />
                  </div>
                )}
              </div>

              {/* 제목 입력 */}
              <div className="mb-6">
                <input
                  type="text"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder="작품 이야기를 함께 적어주세요"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-[14px]"
                  maxLength={30}
                />
                <div className="text-xs text-gray-500 mt-1">
                  {uploadTitle.length}/30
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button
                  variant="outline"
                  onClick={closeUploadModal}
                  className="flex-1 border-2 border-gray-200 hover:bg-gray-50 hover:border-gray-300 rounded-full"
                >
                  취소
                </Button>
                <Button
                  onClick={handleFileUpload}
                  className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-full"
                >
                  공유하기
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 수정 모달 */}
      {showEditModal && editingDesign && (
        <div className="fixed inset-0 bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-pink-900/20 backdrop-blur-md z-50 flex items-center justify-center overflow-hidden">
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-6 max-w-sm w-full mx-6">
            <div className="text-center">
              <div className="flex justify-center mb-2">
                <div className="text-[30px]">✏️</div>
              </div>
              <h3 className="text-lg font-semibold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                작품 수정하기
              </h3>
              <p className="text-gray-900 mb-6" style={{fontSize: '14px'}}>
                {editingDesign.type === 'uploaded' ? '이름이나 사진을 살짝 바꿔볼까요?' : '이 작품의 이름만 살짝 바꿔볼까요?'}
              </p>
              
              {/* 이미지 업로드 (업로드된 파일인 경우에만) */}
              {editingDesign.type === 'uploaded' && (
                <div className="mb-4">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        try {
                          // 이미지 압축 적용
                          const compressedImage = await compressImage(file, 450, 0.8);
                          setEditFile(file); // 원본 파일은 유지
                          setEditPreview(compressedImage); // 압축된 이미지로 미리보기
                        } catch (error) {
                          console.error('이미지 압축 실패:', error);
                          setErrorMessage('이미지 압축 중 오류가 발생했습니다.');
                          setShowErrorModal(true);
                        }
                      }
                    }}
                    className="hidden"
                    id="edit-image-upload"
                  />
                  <label
                    htmlFor="edit-image-upload"
                    className="block w-full p-4 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors flex flex-col items-center justify-center"
                  >
                    <Upload className="w-8 h-8 text-gray-400 mb-2" />
                    <span className="text-gray-800 font-medium text-[14px]">
                      {editFile ? '새로운 사진이 선택되었어요' : '새로운 사진을 선택해주세요'}
                    </span>
                  </label>
                  {editPreview && (
                    <div className="mt-3">
                      <img
                        src={editPreview}
                        alt="미리보기"
                        className="w-full aspect-[4/3] object-cover rounded-lg"
                      />
                    </div>
                  )}
                </div>
              )}
              
              {/* 제목 입력 */}
              <div className="mb-6">
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="작품 이야기를 함께 적어주세요"
                  maxLength={20}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-center"
                />
                <div className="text-xs text-gray-500 mt-1">
                  {editTitle.length}/20
                </div>
              </div>
              
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={closeEditModal}
                  className="flex-1 border-2 border-gray-200 hover:bg-gray-50 hover:border-gray-300 rounded-full text-gray-900"
                  style={{fontSize: '14px'}}
                >
                  취소
                </Button>
                <Button
                  onClick={handleEdit}
                  className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-full"
                  style={{fontSize: '14px'}}
                >
                  수정하기
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 수정 성공 모달 */}
      {showEditSuccessModal && (
        <div className="fixed inset-0 bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-pink-900/20 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 max-w-sm w-full mx-6">
            <div className="p-6">
              <div className="text-center">
                <div className="flex justify-center mb-2">
                  <div className="text-[30px]">✨</div>
                </div>
                <h3 className="text-lg font-semibold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                  수정 완료!
                </h3>
                <p className="text-gray-800 text-sm mb-6">
                  작품이 성공적으로 수정되었습니다!
                </p>
                
                <Button
                  onClick={closeEditSuccessModal}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-full"
                >
                  확인
                </Button>
              </div>
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
                    {loginModalType === 'comment' && '✨'}
                    {loginModalType === 'download' && '📥'}
                  </div>
                </div>
                <h3 className="text-lg font-semibold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                  {loginModalType === 'like' && '이 박스카, 정말 멋지죠?'}
                  {loginModalType === 'share' && '공유하기'}
                  {loginModalType === 'comment' && '이 작품에 대해 이야기해보세요!'}
                  {loginModalType === 'download' && '다운로드'}
                </h3>
                <p className="text-gray-900 mb-6" style={{fontSize: '14px'}}>
                  {loginModalType === 'like' && '로그인하고 👍 좋아요로 표현해보세요!'}
                  {loginModalType === 'share' && '멋진 작품, 로그인하면 바로 공유할 수 있어요'}
                  {loginModalType === 'comment' && '로그인하면 이야기할 수 있어요!'}
                  {loginModalType === 'download' && '로그인하면 도안을 내려받을 수 있어요'}
                </p>
                
                <div className="flex gap-3 mt-6">
                  <Button
                    variant="outline"
                    onClick={closeLoginModal}
                    className="flex-1 border-2 border-gray-200 hover:bg-gray-50 hover:border-gray-300 rounded-full text-gray-900"
                    style={{fontSize: '14px'}}
                  >
                    나중에 할래
                  </Button>
                  <Button
                    onClick={handleLoginAndAction}
                    className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-full"
                    style={{fontSize: '14px'}}
                  >
                    지금 로그인하기
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 모바일 플로팅 메뉴 - 항상 펼쳐진 상태 */}
      <div className="fixed bottom-6 right-6 z-40 md:hidden">
        <div className="flex flex-col gap-3 mb-1">
          <Link href="/draw">
            <Button
              className="bg-pink-500 hover:bg-pink-600 text-white transition-all duration-200 rounded-full px-6 py-3"
              style={{fontSize: '14px'}}
            >
              <Plus className="w-4 h-4 mr-2" />
              박스카 그리기
            </Button>
          </Link>
          <Button
            onClick={() => setShowUploadModal(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white transition-all duration-200 rounded-full px-6 py-3"
            style={{fontSize: '14px'}}
          >
            <Upload className="w-4 h-4 mr-2" />
            내 작품 올리기
          </Button>
        </div>
      </div>

      {/* 안내 모달 */}
      {showInfoModal && (
        <div className="fixed inset-0 bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-pink-900/20 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 max-w-sm w-full mx-6">
            <div className="p-6">
              <div className="text-center">
                <div className="flex justify-center mb-2">
                  <div className="text-[30px]">✨</div>
                </div>
                <h3 className="text-lg font-semibold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                  {infoMessage.includes('사진') ? '사진을 선택해주세요' : '작품 이야기를 적어주세요'}
                </h3>
                <p className="text-gray-800 text-sm mb-6">
                  {infoMessage}
                </p>
                
                <Button
                  onClick={() => setShowInfoModal(false)}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-full"
                >
                  확인
                </Button>
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

