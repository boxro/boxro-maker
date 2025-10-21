"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { collection, getDocs, query, orderBy, where, updateDoc, doc, addDoc, serverTimestamp, deleteDoc, getDoc, limit, startAfter } from 'firebase/firestore';
import { db, storage, auth } from '@/lib/firebase';
import { getAuth } from 'firebase/auth';
import CommonHeader from '@/components/CommonHeader';
import CommonBackground from '@/components/CommonBackground';
import PageHeader from '@/components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import ErrorModal from '@/components/ErrorModal';
import AdminDashboard from '@/components/admin/AdminDashboard';
import PopularityManagement from '@/components/admin/PopularityManagement';
import HomeCardManagement from '@/components/admin/HomeCardManagement';
import HomeCardOrder from '@/components/admin/HomeCardOrder';
import BannerManagement from '@/components/admin/BannerManagement';
import TermsManagement from '@/components/admin/TermsManagement';
import { Users, Calendar, MessageCircle, Heart, Download, Share2, Eye, Trash2, ChevronUp, ChevronDown, ArrowUp, ArrowDown, EyeOff, Save, RotateCcw, GripVertical, ArrowLeft, ArrowRight, ShoppingBag } from 'lucide-react';
import { DragEndEvent } from '@dnd-kit/core';
import Image from 'next/image';

interface UserStats {
  email: string;
  displayName: string;
  authorNickname: string;
  photoURL: string;
  createdAt: string;
  lastSignIn: string;
  designsCount: number;
  boxroTalksCount: number;
  likesCount: number;
  downloadsCount: number;
  sharesCount: number;
  viewsCount: number;
  storeRedirectsCount: number;
  uid: string;
  pwaInstalled: boolean;
  pwaInstallDate: string;
}

interface AdminStats {
  totalUsers: number;
  totalDesigns: number;
  totalBoxroTalks: number;
  totalLikes: number;
  totalDownloads: number;
  totalShares: number;
  totalViews: number;
  activeUsers: number;
  inactiveUsers: number;
  totalStories: number;
  totalStoreItems: number;
  galleryViews: number;
  galleryBoxroTalks: number;
  galleryLikes: number;
  galleryShares: number;
  galleryDownloads: number;
  storyViews: number;
  storyBoxroTalks: number;
  storyLikes: number;
  storyShares: number;
  storeViews: number;
  storeRedirects: number;
  storeBoxroTalks: number;
  storeLikes: number;
  storeShares: number;
  blueprintDownloads: number;
  firebaseConnected: boolean;
  dbConnected: boolean;
  storageConnected: boolean;
  totalCommits: number;
  lastDeploy: string;
  lastBuild: string;
  todayActiveUsers: number;
  recent24hActivity: number;
  peakTime: string;
}

interface HomeCard {
  id: string;
  title: string;
  cardTitle?: string;
  cardDescription?: string;
  cardThumbnail?: string;
  thumbnail: string;
  url?: string;
  openInNewTab?: boolean;
  showOnHome: boolean;
  homeOrder?: number;
  isPublished: boolean;
  createdAt: any;
  source?: string;
  description?: string;
  titleColor?: string;
  descriptionColor?: string;
  textPosition?: number;
  backgroundColor?: string;
  authorId?: string;
  authorNickname?: string;
  updatedAt?: any;
  likes?: number;
  shares?: number;
  boxroTalks?: number;
  views?: number;
}

export default function AdminPage() {
  const { user } = useAuth();
  
  // 관리자 이메일 목록
  const ADMIN_EMAILS = [
    'admin@boxro.com',
    'dongwoo@boxro.com',
    'beagle3651@gmail.com',
    'boxro.crafts@gmail.com'
  ];

  // 관리자 권한 확인 함수
  const isAdmin = (userEmail?: string) => {
    return userEmail && ADMIN_EMAILS.includes(userEmail);
  };
  const [loading, setLoading] = useState(true);
  const [userStats, setUserStats] = useState<UserStats[]>([]);
  const [filteredUserStats, setFilteredUserStats] = useState<UserStats[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('recent');
  const [tableSortField, setTableSortField] = useState('');
  const [tableSortDirection, setTableSortDirection] = useState<'asc' | 'desc'>('asc');
  const [activeTab, setActiveTab] = useState('overall-stats');
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [userActivities, setUserActivities] = useState<any>({});
  const [showUserModal, setShowUserModal] = useState(false);
  const [activeActivityTab, setActiveActivityTab] = useState('작품');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  
  // 활동내역 소팅 상태
  const [activitySortField, setActivitySortField] = useState('');
  const [activitySortDirection, setActivitySortDirection] = useState<'asc' | 'desc'>('desc');

  // 활동내역 소팅 함수
  const handleActivitySort = (field: string) => {
    if (activitySortField === field) {
      setActivitySortDirection(activitySortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setActivitySortField(field);
      setActivitySortDirection('desc');
    }
  };

  // 활동내역 데이터 소팅
  const getSortedActivityData = (data: any[]) => {
    if (!activitySortField) return data;
    
    return [...data].sort((a, b) => {
      let aValue, bValue;
      
      switch (activitySortField) {
        case 'createdAt':
          aValue = new Date(a.createdAt?.toDate?.() || a.createdAt).getTime();
          bValue = new Date(b.createdAt?.toDate?.() || b.createdAt).getTime();
          break;
        case 'views':
          aValue = a.views || 0;
          bValue = b.views || 0;
          break;
        case 'likes':
          aValue = a.likes || 0;
          bValue = b.likes || 0;
          break;
        case 'downloads':
          aValue = a.downloads || 0;
          bValue = b.downloads || 0;
          break;
        case 'shares':
          aValue = a.shares || 0;
          bValue = b.shares || 0;
          break;
        case 'source':
          aValue = a.source || '';
          bValue = b.source || '';
          break;
        default:
          return 0;
      }
      
      if (activitySortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  };
  
  // 회원통계 페이지네이션 상태
  const [userStatsCurrentPage, setUserStatsCurrentPage] = useState(1);
  const [userStatsPageSize, setUserStatsPageSize] = useState(20);
  const [userStatsTotalPages, setUserStatsTotalPages] = useState(0);
  const [adminStats, setAdminStats] = useState<AdminStats>({
    totalUsers: 0,
    totalDesigns: 0,
    totalBoxroTalks: 0,
    totalLikes: 0,
    totalDownloads: 0,
    totalShares: 0,
    totalViews: 0,
    activeUsers: 0,
    inactiveUsers: 0,
    totalStories: 0,
    totalStoreItems: 0,
    galleryViews: 0,
    galleryBoxroTalks: 0,
    galleryLikes: 0,
    galleryShares: 0,
    galleryDownloads: 0,
    storyViews: 0,
    storyBoxroTalks: 0,
    storyLikes: 0,
    storyShares: 0,
    storeViews: 0,
    storeRedirects: 0,
    storeBoxroTalks: 0,
    storeLikes: 0,
    storeShares: 0,
    blueprintDownloads: 0,
    firebaseConnected: false,
    dbConnected: false,
    storageConnected: false,
    totalCommits: 0,
    lastDeploy: 'N/A',
    lastBuild: 'N/A',
    todayActiveUsers: 0,
    recent24hActivity: 0,
    peakTime: 'N/A'
  });

  // 홈카드 관리 관련 state
  const [homeCards, setHomeCards] = useState<HomeCard[]>([]);
  const [hiddenCards, setHiddenCards] = useState<HomeCard[]>([]);
  const [homeCardsLoading, setHomeCardsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [sortAscending, setSortAscending] = useState(true);
  
  // 홈카드 관리 상태
  const [homeCardTitle, setHomeCardTitle] = useState("");
  const [homeCardDescription, setHomeCardDescription] = useState("");
  const [homeCardThumbnail, setHomeCardThumbnail] = useState("");
  const [homeCardUrl, setHomeCardUrl] = useState("");
  const [homeCardOpenInNewTab, setHomeCardOpenInNewTab] = useState(false);
  const [homeCardTitleColor, setHomeCardTitleColor] = useState("#ffffff");
  const [homeCardDescriptionColor, setHomeCardDescriptionColor] = useState("#ffffff");
  const [homeCardTextPosition, setHomeCardTextPosition] = useState(4); // 0-100, 기본값 4 (하단)
  const [homeCardBackgroundColor, setHomeCardBackgroundColor] = useState("#3b82f6"); // 카드 배경 색상
  const [homeCardList, setHomeCardList] = useState<any[]>([]);
  const [addingCard, setAddingCard] = useState(false);
  const [deletingCard, setDeletingCard] = useState<string | null>(null);
  const [editingCard, setEditingCard] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  // 홈카드 관리 섹션 필터링 관련 state
  const [homeCardFilterDateFrom, setHomeCardFilterDateFrom] = useState('');
  const [homeCardFilterDateTo, setHomeCardFilterDateTo] = useState('');
  const [homeCardFilterSearch, setHomeCardFilterSearch] = useState('');

  // 인기도 관리 관련 state
  const [popularityFilter, setPopularityFilter] = useState('all'); // all, community, story, store
  const [popularityItems, setPopularityItems] = useState<any[]>([]);
  const [popularityLoading, setPopularityLoading] = useState(false);
  const [popularityBoosts, setPopularityBoosts] = useState<{[key: string]: {likes: number, shares: number, views: number, downloads: number}}>({});

  // 배너 관리 관련 state
  const [bannerList, setBannerList] = useState<any[]>([]);
  const [bannerTitle, setBannerTitle] = useState("");
  const [bannerDescription, setBannerDescription] = useState("");
  const [bannerThumbnail, setBannerThumbnail] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [bannerOpenInNewTab, setBannerOpenInNewTab] = useState(false);
  const [bannerTitleColor, setBannerTitleColor] = useState("#ffffff");
  const [bannerDescriptionColor, setBannerDescriptionColor] = useState("#ffffff");
  const [bannerTextPosition, setBannerTextPosition] = useState(0);
  const [bannerBackgroundColor, setBannerBackgroundColor] = useState("#3b82f6");
  const [bannerTargetPages, setBannerTargetPages] = useState<string[]>([]);
  const [addingBanner, setAddingBanner] = useState(false);
  const [deletingBanner, setDeletingBanner] = useState<string | null>(null);
  const [editingBanner, setEditingBanner] = useState<string | null>(null);
  const [isBannerEditMode, setIsBannerEditMode] = useState(false);
  
  // 배너 관리 섹션 필터링 관련 state
  const [bannerFilterDateFrom, setBannerFilterDateFrom] = useState('');
  const [bannerFilterDateTo, setBannerFilterDateTo] = useState('');
  const [bannerFilterSearch, setBannerFilterSearch] = useState('');
  const [bannerSortBy, setBannerSortBy] = useState('createdAt'); // createdAt, title, targetPages
  const [bannerSortOrder, setBannerSortOrder] = useState('desc'); // asc, desc
  
  // 오류 모달 상태
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [popularitySortBy, setPopularitySortBy] = useState('createdAt'); // createdAt, likes, shares, views
  const [popularitySortOrder, setPopularitySortOrder] = useState('desc'); // asc, desc
  
  // 페이징 관련 state
  const [popularityPageSize, setPopularityPageSize] = useState(20); // 20, 30, 50
  const [popularityCurrentPage, setPopularityCurrentPage] = useState(1);
  const [popularityTotalItems, setPopularityTotalItems] = useState(0);
  const [popularityTotalPages, setPopularityTotalPages] = useState(0);
  const [popularityAllItems, setPopularityAllItems] = useState<any[]>([]);

  // 홈카드 필터링 관련 state
  const [filterSource, setFilterSource] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [filterSearch, setFilterSearch] = useState('');
  
  // 별도 숨겨진 카드 섹션용 필터링 상태
  const [separateHiddenFilterSource, setSeparateHiddenFilterSource] = useState('');
  const [separateHiddenFilterDateFrom, setSeparateHiddenFilterDateFrom] = useState('');
  const [separateHiddenFilterDateTo, setSeparateHiddenFilterDateTo] = useState('');
  const [separateHiddenFilterSearch, setSeparateHiddenFilterSearch] = useState('');

  // 홈카드 필터링 함수 (보이는 카드)
  const getFilteredHomeCards = () => {
    let filtered = homeCards.filter(card => card.showOnHome === true);

    // 출처 필터
    if (filterSource) {
      filtered = filtered.filter(card => card.source === filterSource);
    }

    // 날짜 필터
    if (filterDateFrom) {
      const fromDate = new Date(filterDateFrom);
      filtered = filtered.filter(card => {
        const cardDate = new Date(card.createdAt?.toDate?.() || card.createdAt);
        return cardDate >= fromDate;
      });
    }

    if (filterDateTo) {
      const toDate = new Date(filterDateTo);
      toDate.setHours(23, 59, 59, 999); // 하루 끝까지
      filtered = filtered.filter(card => {
        const cardDate = new Date(card.createdAt?.toDate?.() || card.createdAt);
        return cardDate <= toDate;
      });
    }

    // 검색 필터
    if (filterSearch.trim()) {
      const searchTerm = filterSearch.toLowerCase();
      filtered = filtered.filter(card => 
        (card.title && card.title.toLowerCase().includes(searchTerm)) ||
        (card.cardTitle && card.cardTitle.toLowerCase().includes(searchTerm)) ||
        (card.description && card.description.toLowerCase().includes(searchTerm)) ||
        (card.cardDescription && card.cardDescription.toLowerCase().includes(searchTerm))
      );
    }

    return filtered;
  };


  // 별도 숨겨진 카드 섹션용 필터링 함수
  const getFilteredSeparateHiddenCards = () => {
    let filtered = hiddenCards;

    // 출처 필터
    if (separateHiddenFilterSource) {
      filtered = filtered.filter(card => card.source === separateHiddenFilterSource);
    }

    // 날짜 필터
    if (separateHiddenFilterDateFrom) {
      const fromDate = new Date(separateHiddenFilterDateFrom);
      filtered = filtered.filter(card => {
        const cardDate = new Date(card.createdAt?.toDate?.() || card.createdAt);
        return cardDate >= fromDate;
      });
    }

    if (separateHiddenFilterDateTo) {
      const toDate = new Date(separateHiddenFilterDateTo);
      toDate.setHours(23, 59, 59, 999); // 하루 끝까지
      filtered = filtered.filter(card => {
        const cardDate = new Date(card.createdAt?.toDate?.() || card.createdAt);
        return cardDate <= toDate;
      });
    }

    // 검색 필터
    if (separateHiddenFilterSearch.trim()) {
      const searchTerm = separateHiddenFilterSearch.toLowerCase();
      filtered = filtered.filter(card => 
        (card.title && card.title.toLowerCase().includes(searchTerm)) ||
        (card.cardTitle && card.cardTitle.toLowerCase().includes(searchTerm)) ||
        (card.description && card.description.toLowerCase().includes(searchTerm)) ||
        (card.cardDescription && card.cardDescription.toLowerCase().includes(searchTerm))
      );
    }

    return filtered;
  };

  // 홈카드 추가 함수
  const addHomeCard = async () => {
    if (!homeCardTitle.trim() || !homeCardDescription.trim()) {
      alert('제목과 설명을 모두 입력해주세요.');
      return;
    }

    setAddingCard(true);
    try {
      // Firebase에 홈카드 저장
      const homeCardData = {
        title: homeCardTitle,
        cardTitle: homeCardTitle,
        cardDescription: homeCardDescription,
        cardThumbnail: homeCardThumbnail,
        thumbnail: homeCardThumbnail,
        url: homeCardUrl,
        openInNewTab: homeCardOpenInNewTab,
        titleColor: homeCardTitleColor,
        descriptionColor: homeCardDescriptionColor,
        textPosition: homeCardTextPosition,
        backgroundColor: homeCardBackgroundColor,
        showOnHome: true,
        isPublished: true,
        homeOrder: homeCards.length + 1,
        createdAt: serverTimestamp(),
        authorId: user?.uid || 'admin',
        authorNickname: user?.displayName || '관리자'
      };

      const docRef = await addDoc(collection(db, 'homeCards'), homeCardData);
      
      // 로컬 상태 업데이트
      const newCard = {
        id: docRef.id,
        ...homeCardData,
        createdAt: new Date()
      };
      
      setHomeCardList(prev => [...prev, newCard]);
      setHomeCards(prev => [...prev, newCard]);
      
      // 홈카드 컬렉션만 다시 조회 (빠른 반영)
      const homeCardsQuery = await getDocs(query(collection(db, 'homeCards'), orderBy('createdAt', 'desc')));
      const updatedHomeCards = homeCardsQuery.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date()
      }));
      setHomeCards(updatedHomeCards);
      
      // 홈페이지 캐시 무효화
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('homeCards');
        sessionStorage.removeItem('lastHomeCardsUpdate');
        sessionStorage.setItem('homeCardsCacheInvalidated', 'true');
      }
      
      resetForm();
      alert('홈카드가 성공적으로 추가되었습니다!');
    } catch (error: unknown) {
      console.error('홈카드 추가 실패:', error);
      setErrorMessage('홈카드 추가에 실패했습니다.');
      setShowErrorModal(true);
    } finally {
      setAddingCard(false);
    }
  };

  // 폼 초기화 함수
  const resetForm = () => {
    console.log('resetForm 호출됨 - 썸네일 초기화');
    setHomeCardTitle("");
    setHomeCardDescription("");
    setHomeCardThumbnail("");
    setHomeCardUrl("");
    setHomeCardOpenInNewTab(false);
    setHomeCardTitleColor("#ffffff");
    setHomeCardDescriptionColor("#ffffff");
    setHomeCardTextPosition(4);
    setHomeCardBackgroundColor('#3b82f6');
    
    // 추가 상태 초기화 (혹시 누락된 필드들)
    setEditingCard(null);
    setIsEditMode(false);
    setAddingCard(false);
    setDeletingCard(null);
  };

  // 홈카드 목록 불러오기 함수 (homeCards 컬렉션만)
  const fetchHomeCardList = async () => {
    try {
      console.log('홈카드 목록 불러오기 시작...');
      
      // homeCards 컬렉션에서만 홈카드 목록 가져오기
      const homeCardsQuery = query(collection(db, 'homeCards'), orderBy('createdAt', 'desc'));
      const homeCardsSnapshot = await getDocs(homeCardsQuery);
      
      console.log('Firebase에서 가져온 홈카드 개수:', homeCardsSnapshot.docs.length);
      
      // homeCards 데이터 변환 (homeCards 컬렉션에서만)
      const homeCardsList = homeCardsSnapshot.docs
        .filter(doc => {
          const data = doc.data();
          // homeCards 컬렉션에서만 가져온 데이터이므로 모두 유효
          return doc.exists() && data;
        })
        .filter(doc => {
          const data = doc.data();
          // 원본 source 필드를 확인하여 storeItems나 storyArticles는 제외
          const originalSource = data.source;
          const isValid = !originalSource || originalSource === 'homeCards';
          if (!isValid) {
            console.log('잘못된 소스의 홈카드 제외:', { id: doc.id, title: data.title, source: originalSource });
          }
          return isValid;
        })
        .map(doc => {
          const data = doc.data();
          console.log('홈카드 데이터:', { id: doc.id, title: data.title, source: data.source || 'homeCards' });
          return {
            id: doc.id,
            ...data,
            source: 'homeCards', // 강제로 homeCards로 설정
            createdAt: data.createdAt?.toDate?.() || new Date()
          };
        });
      
      console.log('최종 홈카드 목록 (homeCards 컬렉션만):', homeCardsList);
      console.log('홈카드 목록에 저장되는 데이터 소스 확인:', homeCardsList.map(card => ({ id: card.id, title: card.title, source: card.source })));
      setHomeCardList(homeCardsList);
    } catch (error: unknown) {
      console.error('홈카드 목록 불러오기 실패:', error);
    }
  };

  // 홈카드 관리 섹션 필터링 함수
  const getFilteredHomeCardList = () => {
    return homeCardList.filter(card => {
      // 날짜 필터
      if (homeCardFilterDateFrom || homeCardFilterDateTo) {
        const cardDate = card.createdAt;
        if (homeCardFilterDateFrom && cardDate < new Date(homeCardFilterDateFrom)) {
          return false;
        }
        if (homeCardFilterDateTo && cardDate > new Date(homeCardFilterDateTo + 'T23:59:59')) {
          return false;
        }
      }

      // 검색 필터
      if (homeCardFilterSearch.trim()) {
        const searchTerm = homeCardFilterSearch.toLowerCase();
        const title = (card.title || '').toLowerCase();
        const description = (card.cardDescription || '').toLowerCase();
        return title.includes(searchTerm) || description.includes(searchTerm);
      }

      return true;
    });
  };

  // 홈카드 관리 섹션 필터 초기화
  const resetHomeCardFilters = () => {
    setHomeCardFilterDateFrom('');
    setHomeCardFilterDateTo('');
    setHomeCardFilterSearch('');
  };

  // 배너 관리 함수들
  const addBanner = async () => {
    if (!bannerTitle.trim()) {
      alert('배너 제목을 입력해주세요.');
      return;
    }

    setAddingBanner(true);
    try {
      // Firebase에 배너 저장
      const bannerData = {
        title: bannerTitle,
        description: bannerDescription,
        thumbnail: bannerThumbnail,
        url: bannerUrl,
        openInNewTab: bannerOpenInNewTab,
        height: 200,
        targetPages: bannerTargetPages,
        backgroundColor: bannerBackgroundColor,
        titleColor: bannerTitleColor,
        descriptionColor: bannerDescriptionColor,
        textPosition: bannerTextPosition,
        isActive: true,
        order: 0,
        isPublished: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await addDoc(collection(db, 'banners'), bannerData);
      
      // 배너 캐시 무효화 (모든 배너 관련 캐시 삭제)
      sessionStorage.removeItem('banners');
      sessionStorage.removeItem('lastBannerUpdate');
      // 강제로 캐시 무효화를 위한 타임스탬프 추가
      sessionStorage.setItem('bannerCacheInvalidated', Date.now().toString());
      
      // 모든 탭에서 배너 캐시 무효화 알림
      if (typeof window !== 'undefined' && 'localStorage' in window) {
        localStorage.setItem('bannerCacheInvalidated', Date.now().toString());
      }
      
      // 폼 초기화
      resetBannerForm();
      
      // 배너 목록 새로고침
      fetchBanners();
      
      alert('배너가 성공적으로 추가되었습니다.');
    } catch (error) {
      console.error('배너 추가 실패:', error);
      alert('배너 추가에 실패했습니다.');
    } finally {
      setAddingBanner(false);
    }
  };

  const saveEditBanner = async () => {
    if (!bannerTitle.trim()) {
      alert('배너 제목을 입력해주세요.');
      return;
    }

    setAddingBanner(true);
    try {
      const bannerRef = doc(db, 'banners', editingBanner!);
      await updateDoc(bannerRef, {
        title: bannerTitle,
        description: bannerDescription,
        thumbnail: bannerThumbnail,
        url: bannerUrl,
        openInNewTab: bannerOpenInNewTab,
        height: 200,
        targetPages: bannerTargetPages,
        backgroundColor: bannerBackgroundColor,
        titleColor: bannerTitleColor,
        descriptionColor: bannerDescriptionColor,
        textPosition: bannerTextPosition,
        updatedAt: serverTimestamp()
      });
      
      // 배너 캐시 무효화 (모든 배너 관련 캐시 삭제)
      sessionStorage.removeItem('banners');
      sessionStorage.removeItem('lastBannerUpdate');
      // 강제로 캐시 무효화를 위한 타임스탬프 추가
      sessionStorage.setItem('bannerCacheInvalidated', Date.now().toString());
      
      // 모든 탭에서 배너 캐시 무효화 알림
      if (typeof window !== 'undefined' && 'localStorage' in window) {
        localStorage.setItem('bannerCacheInvalidated', Date.now().toString());
      }
      
      // 폼 초기화
      resetBannerForm();
      
      // 배너 목록 새로고침
      fetchBanners();
      
      alert('배너가 성공적으로 수정되었습니다.');
    } catch (error) {
      console.error('배너 수정 실패:', error);
      alert('배너 수정에 실패했습니다.');
    } finally {
      setAddingBanner(false);
    }
  };

  const startEditBanner = (banner: any) => {
    setBannerTitle(banner.title);
    setBannerDescription(banner.description);
    setBannerThumbnail(banner.thumbnail);
    setBannerUrl(banner.url || '');
    setBannerOpenInNewTab(banner.openInNewTab || false);
    setBannerTargetPages(banner.targetPages || []);
    setBannerBackgroundColor(banner.backgroundColor || '#3b82f6');
    setBannerTitleColor(banner.titleColor || '#ffffff');
    setBannerDescriptionColor(banner.descriptionColor || '#ffffff');
    setBannerTextPosition(banner.textPosition || 0);
    setIsBannerEditMode(true);
    setEditingBanner(banner.id);
  };

  const deleteBanner = async (id: string) => {
    if (!confirm('정말로 이 배너를 삭제하시겠습니까?')) {
      return;
    }

    setDeletingBanner(id);
    try {
      await deleteDoc(doc(db, 'banners', id));
      
      // 배너 캐시 무효화 (모든 배너 관련 캐시 삭제)
      sessionStorage.removeItem('banners');
      sessionStorage.removeItem('lastBannerUpdate');
      // 강제로 캐시 무효화를 위한 타임스탬프 추가
      sessionStorage.setItem('bannerCacheInvalidated', Date.now().toString());
      
      setBannerList(bannerList.filter(banner => banner.id !== id));
      alert('배너가 성공적으로 삭제되었습니다.');
    } catch (error) {
      console.error('배너 삭제 실패:', error);
      alert('배너 삭제에 실패했습니다.');
    } finally {
      setDeletingBanner(null);
    }
  };

  const toggleBannerActive = async (id: string, isActive: boolean) => {
    try {
      await updateDoc(doc(db, 'banners', id), {
        isActive: isActive
      });
      
      setBannerList(bannerList.map(banner => 
        banner.id === id ? { ...banner, isActive } : banner
      ));
      
      alert(`배너가 ${isActive ? '활성화' : '비활성화'}되었습니다.`);
    } catch (error) {
      console.error('배너 상태 변경 실패:', error);
      alert('배너 상태 변경에 실패했습니다.');
    }
  };

  const moveBannerOrder = async (id: string, direction: 'up' | 'down') => {
    try {
      const currentBanner = bannerList.find(banner => banner.id === id);
      if (!currentBanner) return;

      const currentOrder = currentBanner.order || 0;
      const newOrder = direction === 'up' ? currentOrder - 1 : currentOrder + 1;

      // 같은 순서를 가진 배너가 있는지 확인
      const conflictingBanner = bannerList.find(banner => 
        banner.id !== id && (banner.order || 0) === newOrder
      );

      if (conflictingBanner) {
        // 충돌하는 배너의 순서를 조정
        await updateDoc(doc(db, 'banners', conflictingBanner.id), {
          order: direction === 'up' ? newOrder + 1 : newOrder - 1
        });
      }

      // 현재 배너의 순서 업데이트
      await updateDoc(doc(db, 'banners', id), {
        order: newOrder
      });

      // 로컬 상태 업데이트
      setBannerList(bannerList.map(banner => {
        if (banner.id === id) {
          return { ...banner, order: newOrder };
        }
        if (conflictingBanner && banner.id === conflictingBanner.id) {
          return { ...banner, order: direction === 'up' ? newOrder + 1 : newOrder - 1 };
        }
        return banner;
      }));

      alert(`배너 순서가 ${direction === 'up' ? '위로' : '아래로'} 이동되었습니다.`);
    } catch (error) {
      console.error('배너 순서 변경 실패:', error);
      alert('배너 순서 변경에 실패했습니다.');
    }
  };

  const cancelBannerEdit = () => {
    console.log('배너 수정 취소');
    setBannerTitle('');
    setBannerDescription('');
    setBannerThumbnail('');
    setBannerUrl('');
    setBannerOpenInNewTab(false);
    setBannerTargetPages([]);
    setBannerBackgroundColor('#3b82f6');
    setBannerTitleColor('#ffffff');
    setBannerDescriptionColor('#ffffff');
    setBannerTextPosition(0);
    setIsBannerEditMode(false);
    setEditingBanner(null);
    console.log('배너 수정 취소 완료');
  };

  const resetBannerForm = () => {
    console.log('배너 폼 초기화');
    setBannerTitle('');
    setBannerDescription('');
    setBannerThumbnail('');
    setBannerUrl('');
    setBannerOpenInNewTab(false);
    setBannerTargetPages([]);
    setBannerBackgroundColor('#3b82f6');
    setBannerTitleColor('#ffffff');
    setBannerDescriptionColor('#ffffff');
    setBannerTextPosition(0);
    setIsBannerEditMode(false);
    setEditingBanner(null);
    console.log('배너 폼 초기화 완료');
  };

  const fetchBanners = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'banners'));
      const banners = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setBannerList(banners);
    } catch (error) {
      console.error('배너 목록 불러오기 실패:', error);
    }
  };

  const getFilteredBannerList = () => {
    const filtered = bannerList.filter(banner => {
      // 날짜 필터
      if (bannerFilterDateFrom || bannerFilterDateTo) {
        const bannerDate = banner.createdAt;
        if (bannerDate) {
          const date = bannerDate.toDate ? bannerDate.toDate() : new Date(bannerDate);
          const fromDate = bannerFilterDateFrom ? new Date(bannerFilterDateFrom) : null;
          const toDate = bannerFilterDateTo ? new Date(bannerFilterDateTo) : null;
          
          if (fromDate && date < fromDate) return false;
          if (toDate && date > toDate) return false;
        }
      }
      
      // 검색 필터
      if (bannerFilterSearch) {
        const searchTerm = bannerFilterSearch.toLowerCase();
        return banner.title.toLowerCase().includes(searchTerm) ||
               banner.description.toLowerCase().includes(searchTerm);
      }
      
      return true;
    });

    // 정렬 적용
    return filtered.sort((a, b) => {
      // 먼저 노출 순서로 정렬 (order가 낮을수록 먼저)
      const aOrder = a.order || 0;
      const bOrder = b.order || 0;
      
      if (aOrder !== bOrder) {
        return aOrder - bOrder;
      }
      
      // 순서가 같으면 선택된 정렬 기준으로 정렬
      let aValue, bValue;
      
      switch (bannerSortBy) {
        case 'title':
          aValue = a.title || '';
          bValue = b.title || '';
          break;
        case 'targetPages':
          aValue = (a.targetPages || []).join(', ');
          bValue = (b.targetPages || []).join(', ');
          break;
        case 'createdAt':
        default:
          aValue = a.createdAt;
          bValue = b.createdAt;
          break;
      }
      
      if (bannerSortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  };

  const resetBannerFilters = () => {
    setBannerFilterDateFrom('');
    setBannerFilterDateTo('');
    setBannerFilterSearch('');
    setBannerSortBy('createdAt');
    setBannerSortOrder('desc');
  };

  // 인기도 관리 데이터 가져오기 (페이징)
  const fetchPopularityData = async () => {
    try {
      setPopularityLoading(true);
      console.log('인기도 관리 데이터 불러오기 시작...');
      
      const [communityQuery, storyQuery, storeQuery] = await Promise.all([
        getDocs(query(collection(db, 'communityDesigns'), orderBy('createdAt', 'desc'))),
        getDocs(query(collection(db, 'storyArticles'), orderBy('createdAt', 'desc'))),
        getDocs(query(collection(db, 'storeItems'), orderBy('createdAt', 'desc')))
      ]);

      const communityItems = communityQuery.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          type: 'community',
          createdAt: data.createdAt?.toDate?.() || new Date()
        };
      });

      const storyItems = storyQuery.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          type: 'story',
          createdAt: data.createdAt?.toDate?.() || new Date()
        };
      });

      const storeItems = storeQuery.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          type: 'store',
          createdAt: data.createdAt?.toDate?.() || new Date()
        };
      });

      const allItems = [...communityItems, ...storyItems, ...storeItems];
      
      // 전체 데이터 저장
      setPopularityAllItems(allItems);
      setPopularityTotalItems(allItems.length);
      
      // 기존 popularityBoost 데이터 로드
      const existingBoosts: {[key: string]: {likes: number, shares: number, views: number, downloads: number}} = {};
      allItems.forEach(item => {
        if (item.popularityBoost) {
          existingBoosts[item.id] = item.popularityBoost;
        }
      });
      setPopularityBoosts(existingBoosts);
      
      console.log('인기도 관리 데이터 로드 완료:', allItems.length);
      console.log('기존 가산점 데이터:', existingBoosts);
    } catch (error: unknown) {
      console.error('인기도 관리 데이터 불러오기 실패:', error);
    } finally {
      setPopularityLoading(false);
    }
  };

  // 페이지 크기 변경 핸들러
  const handlePageSizeChange = (newPageSize: number) => {
    setPopularityPageSize(newPageSize);
    setPopularityCurrentPage(1);
  };

  // 페이지 변경 핸들러
  const handlePageChange = (page: number) => {
    setPopularityCurrentPage(page);
  };

  // 현재 페이지 아이템 업데이트
  const updateCurrentPageItems = () => {
    if (popularityAllItems.length === 0) return;
    
    const startIndex = (popularityCurrentPage - 1) * popularityPageSize;
    const endIndex = startIndex + popularityPageSize;
    const currentPageItems = popularityAllItems.slice(startIndex, endIndex);
    
    console.log('페이지 업데이트:', {
      currentPage: popularityCurrentPage,
      pageSize: popularityPageSize,
      totalItems: popularityAllItems.length,
      startIndex,
      endIndex,
      itemsCount: currentPageItems.length
    });
    
    setPopularityItems(currentPageItems);
    setPopularityTotalPages(Math.ceil(popularityAllItems.length / popularityPageSize));
  };

  // 페이지 변경 시 아이템 업데이트
  useEffect(() => {
    updateCurrentPageItems();
  }, [popularityCurrentPage, popularityPageSize, popularityAllItems]);

  // 인기도 데이터 정렬 함수
  const getSortedPopularityItems = () => {
    const filtered = popularityItems.filter(item => popularityFilter === 'all' || item.type === popularityFilter);
    
    return filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (popularitySortBy) {
        case 'likes':
          aValue = (a.likes || 0) + (popularityBoosts[a.id]?.likes || 0);
          bValue = (b.likes || 0) + (popularityBoosts[b.id]?.likes || 0);
          break;
        case 'shares':
          aValue = (a.shares || 0) + (popularityBoosts[a.id]?.shares || 0);
          bValue = (b.shares || 0) + (popularityBoosts[b.id]?.shares || 0);
          break;
        case 'views':
          aValue = (a.views || 0) + (popularityBoosts[a.id]?.views || 0);
          bValue = (b.views || 0) + (popularityBoosts[b.id]?.views || 0);
          break;
        case 'downloads':
          aValue = (a.downloads || 0) + (popularityBoosts[a.id]?.downloads || 0);
          bValue = (b.downloads || 0) + (popularityBoosts[b.id]?.downloads || 0);
          break;
        case 'createdAt':
        default:
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
      }
      
      return popularitySortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    });
  };

  // 인기도 가산점 업데이트
  const updatePopularityBoost = async (itemId: string, type: string, boosts: {likes: number, shares: number, views: number, downloads: number}) => {
    try {
      console.log('인기도 가산점 업데이트 시작:', { itemId, type, boosts });
      
      const collectionName = type === 'community' ? 'communityDesigns' : 
                           type === 'story' ? 'storyArticles' : 'storeItems';
      
      console.log('업데이트할 컬렉션:', collectionName);
      console.log('업데이트할 데이터:', { popularityBoost: boosts });
      
      await updateDoc(doc(db, collectionName, itemId), {
        popularityBoost: boosts,
        updatedAt: serverTimestamp()
      });

      setPopularityBoosts(prev => ({
        ...prev,
        [itemId]: boosts
      }));

      // popularityItems도 업데이트하여 화면에 반영
      setPopularityItems(prev => 
        prev.map(item => 
          item.id === itemId 
            ? { ...item, popularityBoost: boosts }
            : item
        )
      );

      // 성공 메시지
      alert('인기도 가산점이 성공적으로 저장되었습니다!');
      
      console.log('인기도 가산점 업데이트 완료:', { itemId, type, boosts });
    } catch (error: unknown) {
      console.error('인기도 가산점 업데이트 실패:', error);
      console.error('오류 상세:', error);
      setErrorMessage(`저장에 실패했습니다: ${error.message || error}`);
      setShowErrorModal(true);
    }
  };

  // 하드코딩된 홈카드 추가 함수
  const addHardcodedCards = async () => {
    const hardcodedCards = [
      {
        title: "박스로 유튜브 영상",
        cardTitle: "박스로 유튜브 영상",
        cardDescription: "박스로만의 특별한 콘텐츠를 만나보세요!\n영상으로 쉽게 확인할 수 있어요.",
        cardThumbnail: "/boxro_youtube.png",
        thumbnail: "/boxro_youtube.png",
        url: "https://www.youtube.com/@boxro",
        titleColor: "#ffffff",
        descriptionColor: "#ffffff",
        showOnHome: true,
        isPublished: true,
        homeOrder: 1,
        authorId: user?.uid || 'admin',
        authorNickname: user?.displayName || '관리자',
        likes: 0,
        shares: 0,
        boxroTalks: 0,
        views: 0
      },
      {
        title: "박스로 무선조종 앱",
        cardTitle: "박스로 무선조종 앱",
        cardDescription: "스마트폰으로 내 박스카를 조종해보세요!\n새롭고 신나는 경험이 기다리고 있어요.",
        cardThumbnail: "/boxro_remote.png",
        thumbnail: "/boxro_remote.png",
        url: "/remote-control",
        titleColor: "#ffffff",
        descriptionColor: "#ffffff",
        showOnHome: true,
        isPublished: true,
        homeOrder: 2,
        authorId: user?.uid || 'admin',
        authorNickname: user?.displayName || '관리자',
        likes: 0,
        shares: 0,
        boxroTalks: 0,
        views: 0
      },
      {
        title: "박스로 스토어",
        cardTitle: "박스로 스토어",
        cardDescription: "다양한 박스카 도안을 살펴보세요!\n내 손으로 멋진 작품을 완성할 수 있어요",
        cardThumbnail: "/boxro_store.png",
        thumbnail: "/boxro_store.png",
        url: "/store",
        titleColor: "#ffffff",
        descriptionColor: "#ffffff",
        showOnHome: true,
        isPublished: true,
        homeOrder: 3,
        authorId: user?.uid || 'admin',
        authorNickname: user?.displayName || '관리자',
        likes: 0,
        shares: 0,
        boxroTalks: 0,
        views: 0
      },
      {
        title: "지구를 지키는 놀이",
        cardTitle: "지구를 지키는 놀이",
        cardDescription: "버려지는 박스로 멋진 자동차를 만들며,\n자원도 아끼고 환경도 지켜요.",
        cardThumbnail: "/boxro_green.png",
        thumbnail: "/boxro_green.png",
        url: "/earth-play",
        titleColor: "#ffffff",
        descriptionColor: "#ffffff",
        showOnHome: true,
        isPublished: true,
        homeOrder: 4,
        authorId: user?.uid || 'admin',
        authorNickname: user?.displayName || '관리자',
        likes: 0,
        shares: 0,
        boxroTalks: 0,
        views: 0
      },
      {
        title: "박스카 그리기",
        cardTitle: "박스카 그리기",
        cardDescription: "상상하는 자동차를 그려보세요.\n창의적인 디자인으로 나만의 자동차를 만들어요.",
        cardThumbnail: "/boxro_draw.png",
        thumbnail: "/boxro_draw.png",
        url: "/draw",
        titleColor: "#ffffff",
        descriptionColor: "#ffffff",
        showOnHome: true,
        isPublished: true,
        homeOrder: 5,
        authorId: user?.uid || 'admin',
        authorNickname: user?.displayName || '관리자',
        likes: 0,
        shares: 0,
        boxroTalks: 0,
        views: 0
      },
      {
        title: "박스카 프린트",
        cardTitle: "박스카 프린트",
        cardDescription: "프린트해서 바로 사용할 수 있는\n박스카 도안을 다운로드하세요.",
        cardThumbnail: "/boxro_print.png",
        thumbnail: "/boxro_print.png",
        url: "/templates",
        titleColor: "#ffffff",
        descriptionColor: "#ffffff",
        showOnHome: true,
        isPublished: true,
        homeOrder: 6,
        authorId: user?.uid || 'admin',
        authorNickname: user?.displayName || '관리자',
        likes: 0,
        shares: 0,
        boxroTalks: 0,
        views: 0
      }
    ];

    try {
      setAddingCard(true);
      
      // 기존 카드들과 중복 체크
      const existingCards = homeCardList.map(card => card.title);
      let addedCount = 0;
      
      for (const cardData of hardcodedCards) {
        // 이미 존재하는 카드는 건너뛰기
        if (existingCards.includes(cardData.title)) {
          console.log(`카드 "${cardData.title}"는 이미 존재합니다. 건너뜁니다.`);
          continue;
        }
        
        await addDoc(collection(db, 'homeCards'), {
          ...cardData,
          createdAt: serverTimestamp()
        });
        addedCount++;
        console.log(`카드 "${cardData.title}" 추가 완료`);
      }
      
      if (addedCount > 0) {
        alert(`${addedCount}개의 하드코딩된 홈카드가 성공적으로 추가되었습니다!`);
        fetchHomeCardList(); // 목록 새로고침
      } else {
        alert('모든 하드코딩된 홈카드가 이미 존재합니다.');
      }
    } catch (error: unknown) {
      console.error('하드코딩된 홈카드 추가 실패:', error);
      setErrorMessage('하드코딩된 홈카드 추가에 실패했습니다.');
      setShowErrorModal(true);
    } finally {
      setAddingCard(false);
    }
  };

  // 홈카드 삭제 함수
  const deleteHomeCard = async (cardId: string) => {
    if (!confirm('정말로 이 홈카드를 삭제하시겠습니까?')) {
      return;
    }

    console.log('홈카드 삭제 시작:', cardId);
    setDeletingCard(cardId);
    try {
      // homeCards 컬렉션에서 삭제
      await deleteDoc(doc(db, 'homeCards', cardId));
      console.log('homeCards 컬렉션에서 삭제 완료:', cardId);
      
      // storyArticles 컬렉션에서도 삭제 (혹시 있을 경우)
      try {
        await deleteDoc(doc(db, 'storyArticles', cardId));
        console.log('storyArticles 컬렉션에서도 삭제 완료:', cardId);
      } catch (storyError) {
        console.log('storyArticles 컬렉션에 해당 카드 없음:', cardId);
      }
      
      setHomeCardList(prev => prev.filter(card => card.id !== cardId));
      
      // 홈페이지 캐시 무효화
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('homeCards');
        sessionStorage.removeItem('lastHomeCardsUpdate');
        sessionStorage.setItem('homeCardsCacheInvalidated', 'true');
        console.log('홈페이지 캐시 무효화 완료');
      }
      
      alert('홈카드가 삭제되었습니다.');
    } catch (error: unknown) {
      console.error('홈카드 삭제 실패:', error);
      setErrorMessage('홈카드 삭제에 실패했습니다.');
      setShowErrorModal(true);
    } finally {
      setDeletingCard(null);
    }
  };

  // 홈카드 수정 시작 함수
  const startEditCard = (card: any) => {
    setEditingCard(card.id);
    setIsEditMode(true);
    setHomeCardTitle(card.title);
    setHomeCardDescription(card.cardDescription || card.description);
    setHomeCardThumbnail(card.cardThumbnail || card.thumbnail);
    setHomeCardUrl(card.url || '');
    setHomeCardOpenInNewTab(card.openInNewTab || false);
    setHomeCardTitleColor(card.titleColor || '#ffffff');
    setHomeCardDescriptionColor(card.descriptionColor || '#ffffff');
    setHomeCardTextPosition(card.textPosition || 4);
    setHomeCardBackgroundColor(card.backgroundColor || '#3b82f6');
  };

  // 홈카드 수정 취소 함수
  const cancelEdit = () => {
    // 폼 초기화 (모든 상태 포함)
    resetForm();
    
    // 강제 리렌더링을 위해 setTimeout 사용
    setTimeout(() => {
      fetchHomeCardList();
    }, 0);
  };

  // 홈카드 수정 저장 함수
  const saveEditCard = async () => {
    if (!homeCardTitle.trim() || !homeCardDescription.trim()) {
      setErrorMessage('제목과 설명을 모두 입력해주세요.');
      setShowErrorModal(true);
      return;
    }

    if (!editingCard) return;

    setAddingCard(true);
    try {
      await updateDoc(doc(db, 'homeCards', editingCard), {
        title: homeCardTitle,
        cardTitle: homeCardTitle,
        cardDescription: homeCardDescription,
        cardThumbnail: homeCardThumbnail,
        thumbnail: homeCardThumbnail,
        url: homeCardUrl,
        openInNewTab: homeCardOpenInNewTab,
        titleColor: homeCardTitleColor,
        descriptionColor: homeCardDescriptionColor,
        textPosition: homeCardTextPosition,
        backgroundColor: homeCardBackgroundColor,
        updatedAt: serverTimestamp()
      });

      // 로컬 상태 업데이트
      setHomeCardList(prev => prev.map(card => 
        card.id === editingCard 
          ? { ...card, title: homeCardTitle, cardDescription: homeCardDescription, cardThumbnail: homeCardThumbnail, thumbnail: homeCardThumbnail, url: homeCardUrl, openInNewTab: homeCardOpenInNewTab, titleColor: homeCardTitleColor, descriptionColor: homeCardDescriptionColor, textPosition: homeCardTextPosition, backgroundColor: homeCardBackgroundColor }
          : card
      ));

      // 홈카드 컬렉션만 다시 조회 (빠른 반영)
      const homeCardsQuery = await getDocs(query(collection(db, 'homeCards'), orderBy('createdAt', 'desc')));
      const updatedHomeCards = homeCardsQuery.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date()
      }));
      setHomeCards(updatedHomeCards);

      // 홈페이지 캐시 무효화
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('homeCards');
        sessionStorage.removeItem('lastHomeCardsUpdate');
        sessionStorage.setItem('homeCardsCacheInvalidated', 'true');
      }

      cancelEdit();
      alert('홈카드가 수정되었습니다.');
    } catch (error: unknown) {
      console.error('홈카드 수정 실패:', error);
      setErrorMessage('홈카드 수정에 실패했습니다.');
      setShowErrorModal(true);
    } finally {
      setAddingCard(false);
    }
  };

  // 관리자 권한 체크
  const isAdminUser = isAdmin(user?.email);

  // 디버깅용: 현재 사용자 정보 로그
  console.log('현재 사용자:', user?.email, '관리자 여부:', isAdminUser);

  // 홈카드 관리 함수들
  const fetchHomeCards = async () => {
    try {
      setHomeCardsLoading(true);
      console.log('홈카드 노출 순서 탭 - 데이터 불러오기 시작...');
      
      // storyArticles, storeItems, homeCards 세 컬렉션에서 모두 가져오기
      const [storyQuery, storeQuery, homeCardsQuery] = await Promise.all([
        getDocs(query(collection(db, 'storyArticles'), orderBy('createdAt', 'desc'))),
        getDocs(query(collection(db, 'storeItems'), orderBy('createdAt', 'desc'))),
        getDocs(query(collection(db, 'homeCards'), orderBy('createdAt', 'desc')))
      ]);
      
      console.log('storyArticles 개수:', storyQuery.docs.length);
      console.log('storeItems 개수:', storeQuery.docs.length);
      console.log('homeCards 개수:', homeCardsQuery.docs.length);
      
      // storyArticles 데이터 변환 (유효한 데이터만)
      const storyCards = storyQuery.docs
        .filter(doc => doc.exists())
        .map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            source: 'storyArticles', // 출처 구분용
            createdAt: data.createdAt?.toDate?.() || new Date()
          };
        }) as (HomeCard & { source: string })[];
      
      // storeItems 데이터 변환 (유효한 데이터만)
      const storeCards = storeQuery.docs
        .filter(doc => doc.exists())
        .map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            source: 'storeItems', // 출처 구분용
            createdAt: data.createdAt?.toDate?.() || new Date()
          };
        }) as (HomeCard & { source: string })[];
      
      // homeCards 데이터 변환 (유효한 데이터만)
      const homeCards = homeCardsQuery.docs
        .filter(doc => doc.exists())
        .map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            source: 'homeCards', // 출처 구분용
            createdAt: data.createdAt?.toDate?.() || new Date()
          };
        }) as (HomeCard & { source: string })[];
      
      console.log('storyCards:', storyCards);
      console.log('storeCards:', storeCards);
      console.log('homeCards:', homeCards);
      
      // 세 컬렉션 데이터 합치기
      const allCards = [...storyCards, ...storeCards, ...homeCards];
      console.log('전체 카드 개수:', allCards.length);
      
      // 클라이언트에서 showOnHome이 true인 것만 필터링하고 homeOrder로 정렬
      const visibleCards = allCards
        .filter(card => {
          // 유효한 카드인지 확인
          if (!card || !card.id || !card.title) {
            console.log('유효하지 않은 카드 제외:', card);
            return false;
          }
          
          // showOnHome이 true인지 확인
          if (card.showOnHome !== true) {
            return false;
          }
          
          // 홈 카드 정보가 있는지 확인
          // cardTitle과 cardDescription이 모두 있어야 홈에 표시
          const hasCardInfo = card.cardTitle && card.cardTitle.trim() && 
                             card.cardDescription && card.cardDescription.trim();
          
          // 또는 일반 썸네일이 있어도 표시 (기존 호환성)
          const hasThumbnail = card.thumbnail && card.thumbnail.trim();
          
          console.log(`카드 "${card.title}" - showOnHome: ${card.showOnHome}, hasCardInfo: ${hasCardInfo}, hasThumbnail: ${hasThumbnail}`);
          return hasCardInfo || hasThumbnail;
        })
        .sort((a, b) => {
          // homeOrder가 있는 카드들을 먼저 정렬
          const aOrder = a.homeOrder || 999999; // homeOrder가 없으면 맨 뒤로
          const bOrder = b.homeOrder || 999999;
          
          if (aOrder !== bOrder) {
            return aOrder - bOrder;
          }
          
          // homeOrder가 같거나 둘 다 없는 경우 createdAt으로 정렬
          return new Date(b.createdAt?.toDate?.() || b.createdAt).getTime() - 
                 new Date(a.createdAt?.toDate?.() || a.createdAt).getTime();
        });

      // 숨겨진 카드들 (홈카드 노출순서에서 숨긴 카드들 - 보관함)
      const hiddenCards = allCards
        .filter(card => {
          // 유효한 카드인지 확인
          if (!card || !card.id || !card.title) {
            return false;
          }
          
          // showOnHome이 false인 카드들만 확인
          if (card.showOnHome === false) {
            // 토글 OFF인 게시물(storyArticles, storeItems)은 숨겨진 카드에 포함하지 않음
            if (card.source === 'storyArticles' || card.source === 'storeItems') {
              console.log('🔍 토글 OFF 게시물 제외:', card.title, card.source, card.showOnHome);
              return false;
            }
            
            // 수동으로 생성한 홈카드만 숨겨진 카드에 포함
            console.log('🔍 숨겨진 카드 포함:', card.title, card.source, card.showOnHome);
            return true;
          }
          
          return false;
        })
        .sort((a, b) => {
          return new Date(b.createdAt?.toDate?.() || b.createdAt).getTime() - 
                 new Date(a.createdAt?.toDate?.() || a.createdAt).getTime();
        });
      
      setHomeCards(visibleCards);
      setHiddenCards(hiddenCards);
    } catch (error: unknown) {
      console.error('홈카드 데이터 불러오기 실패:', error);
    } finally {
      setHomeCardsLoading(false);
    }
  };

  const moveCard = (index: number, direction: 'up' | 'down') => {
    const newCards = [...homeCards];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (newIndex >= 0 && newIndex < newCards.length) {
      [newCards[index], newCards[newIndex]] = [newCards[newIndex], newCards[index]];
      setHomeCards(newCards);
    }
  };

  // 드래그 앤 드롭 핸들러
  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (active.id !== over?.id) {
      const oldIndex = homeCards.findIndex(card => card.id === active.id);
      const newIndex = over ? homeCards.findIndex(card => card.id === over.id) : -1;
      
      const newCards = [...homeCards];
      const [removed] = newCards.splice(oldIndex, 1);
      newCards.splice(newIndex, 0, removed);
      
      setHomeCards(newCards);
    }
  };

  const toggleCardVisibility = async (cardId: string) => {
    try {
      // 현재 카드가 홈카드에 있는지 숨겨진 카드에 있는지 확인
      const isInHomeCards = homeCards.find(c => c.id === cardId);
      const isInHiddenCards = hiddenCards.find(c => c.id === cardId);
      
      let card;
      let newShowOnHome;
      
      if (isInHomeCards) {
        // 홈카드에서 숨기기
        card = isInHomeCards;
        newShowOnHome = false;
      } else if (isInHiddenCards) {
        // 숨겨진 카드에서 다시 보이게 하기
        card = isInHiddenCards;
        newShowOnHome = true;
      } else {
        console.log('카드를 찾을 수 없습니다:', cardId);
        return;
      }

      // 카드의 출처에 따라 적절한 컬렉션에서 업데이트
      let collectionName;
      if (card.source === 'storyArticles') {
        collectionName = 'storyArticles';
      } else if (card.source === 'storeItems') {
        collectionName = 'storeItems';
      } else {
        collectionName = 'homeCards';
      }
      const docRef = doc(db, collectionName, cardId);
      
      try {
        const docSnap = await getDoc(docRef);
        
        if (!docSnap.exists()) {
          console.error(`문서가 존재하지 않습니다: ${collectionName}/${cardId}`);
          setErrorMessage('해당 카드가 더 이상 존재하지 않습니다. 페이지를 새로고침해주세요.');
          setShowErrorModal(true);
          // 페이지 새로고침
          window.location.reload();
          return;
        }
      } catch (docError) {
        console.error('문서 확인 중 오류:', docError);
        setErrorMessage('카드 정보를 확인할 수 없습니다. 페이지를 새로고침해주세요.');
        setShowErrorModal(true);
        window.location.reload();
        return;
      }
      
      await updateDoc(docRef, {
        showOnHome: newShowOnHome
      });

      // 상태 업데이트 후 데이터 다시 불러오기
      await fetchHomeCards();
    } catch (error: unknown) {
      console.error('카드 가시성 변경 실패:', error);
      if (error.code === 'not-found') {
        setErrorMessage('해당 카드가 더 이상 존재하지 않습니다. 페이지를 새로고침해주세요.');
        setShowErrorModal(true);
        // 페이지 새로고침
        window.location.reload();
      } else {
        setErrorMessage('카드 가시성 변경에 실패했습니다.');
        setShowErrorModal(true);
      }
    }
  };

  const saveOrder = async () => {
    try {
      setSaving(true);
      
      const updates = homeCards.map((card, index) => {
        let collectionName;
        if (card.source === 'storyArticles') {
          collectionName = 'storyArticles';
        } else if (card.source === 'storeItems') {
          collectionName = 'storeItems';
        } else {
          collectionName = 'homeCards';
        }
        return updateDoc(doc(db, collectionName, card.id), {
          homeOrder: index + 1
        });
      });
      
      await Promise.all(updates);
      alert('홈카드 순서가 저장되었습니다!');
    } catch (error: unknown) {
      console.error('순서 저장 실패:', error);
      setErrorMessage('순서 저장에 실패했습니다.');
      setShowErrorModal(true);
    } finally {
      setSaving(false);
    }
  };

  const resetOrder = () => {
    // 생성일 순서로 정렬 (오름차순/내림차순 번갈아)
    const sortedCards = [...homeCards].sort((a, b) => {
      const dateA = a.createdAt?.toDate?.() || a.createdAt;
      const dateB = b.createdAt?.toDate?.() || b.createdAt;
      const timeA = new Date(dateA).getTime();
      const timeB = new Date(dateB).getTime();
      
      if (sortAscending) {
        return timeA - timeB; // 오름차순 (오래된 것부터)
      } else {
        return timeB - timeA; // 내림차순 (최신 것부터)
      }
    });
    
    // homeOrder를 정렬된 순서로 재할당
    const resetCards = sortedCards.map((card, index) => ({
      ...card,
      homeOrder: index + 1
    }));
    setHomeCards(resetCards);
    
    // 다음 클릭을 위해 정렬 방향 반전
    setSortAscending(!sortAscending);
  };

  // 검색 및 필터링 함수
  const filterAndSortUsers = () => {
    let filtered = [...userStats];

    // 검색 필터
    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.displayName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // 상태 필터
    if (statusFilter === 'active') {
      filtered = filtered.filter(user => {
        const lastSignIn = new Date(user.lastSignIn);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return lastSignIn > thirtyDaysAgo;
      });
    } else if (statusFilter === 'inactive') {
      filtered = filtered.filter(user => {
        const lastSignIn = new Date(user.lastSignIn);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return lastSignIn <= thirtyDaysAgo;
      });
    }

    // 테이블 정렬이 있으면 테이블 정렬 우선
    if (tableSortField) {
      filtered.sort((a, b) => {
        let aValue: any;
        let bValue: any;

        switch (tableSortField) {
          case 'email':
            aValue = a.email;
            bValue = b.email;
            break;
          case 'displayName':
            aValue = a.displayName;
            bValue = b.displayName;
            break;
          case 'createdAt':
            aValue = new Date(a.createdAt).getTime();
            bValue = new Date(b.createdAt).getTime();
            break;
          case 'lastSignIn':
            aValue = new Date(a.lastSignIn).getTime();
            bValue = new Date(b.lastSignIn).getTime();
            break;
          case 'designsCount':
            aValue = a.designsCount;
            bValue = b.designsCount;
            break;
          case 'boxroTalksCount':
            aValue = a.boxroTalksCount;
            bValue = b.boxroTalksCount;
            break;
          case 'likesCount':
            aValue = a.likesCount;
            bValue = b.likesCount;
            break;
          case 'downloadsCount':
            aValue = a.downloadsCount;
            bValue = b.downloadsCount;
            break;
          case 'sharesCount':
            aValue = a.sharesCount;
            bValue = b.sharesCount;
            break;
          case 'viewsCount':
            aValue = a.viewsCount;
            bValue = b.viewsCount;
            break;
          default:
            return 0;
        }

        if (aValue < bValue) return tableSortDirection === 'asc' ? -1 : 1;
        if (aValue > bValue) return tableSortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    } else {
      // 기본 정렬
      switch (sortBy) {
        case 'recent':
          filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          break;
        case 'oldest':
          filtered.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
          break;
        case 'name':
          filtered.sort((a, b) => a.displayName.localeCompare(b.displayName));
          break;
        case 'email':
          filtered.sort((a, b) => a.email.localeCompare(b.email));
          break;
      }
    }

    setFilteredUserStats(filtered);
  };

  // 테이블 정렬 함수
  const handleTableSort = (field: string) => {
    if (tableSortField === field) {
      setTableSortDirection(tableSortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setTableSortField(field);
      setTableSortDirection('asc');
    }
  };

  const handleUserClick = async (userEmail: string) => {
    setSelectedUser(userEmail);
    setShowUserModal(true);
    // 모달이 열릴 때 body 스크롤 막기
    document.body.style.overflow = 'hidden';
    if (!userActivities[userEmail]) {
      const activities = await loadUserActivities(userEmail);
      setUserActivities(prev => ({
        ...prev,
        [userEmail]: activities
      }));
    }
  };

  const closeUserModal = () => {
    setShowUserModal(false);
    setSelectedUser(null);
    // 모달이 닫힐 때 body 스크롤 복원
    document.body.style.overflow = 'unset';
  };

  // 회원통계 페이지네이션 함수들
  const updateUserStatsPagination = () => {
    const totalPages = Math.ceil(filteredUserStats.length / userStatsPageSize);
    setUserStatsTotalPages(totalPages);
    
    // 현재 페이지가 총 페이지 수를 초과하면 1페이지로 리셋
    if (userStatsCurrentPage > totalPages && totalPages > 0) {
      setUserStatsCurrentPage(1);
    }
  };

  const getUserStatsPageData = () => {
    const startIndex = (userStatsCurrentPage - 1) * userStatsPageSize;
    const endIndex = startIndex + userStatsPageSize;
    return filteredUserStats.slice(startIndex, endIndex);
  };

  const handleUserStatsPageSizeChange = (newSize: number) => {
    setUserStatsPageSize(newSize);
    setUserStatsCurrentPage(1);
  };

  const handleUserStatsPageChange = (page: number) => {
    setUserStatsCurrentPage(page);
  };


  // 검색/필터/테이블 정렬 변경 시 실행
  useEffect(() => {
    filterAndSortUsers();
  }, [searchTerm, statusFilter, sortBy, userStats, tableSortField, tableSortDirection]);

  // 페이지네이션 업데이트
  useEffect(() => {
    updateUserStatsPagination();
  }, [filteredUserStats, userStatsPageSize, userStatsCurrentPage]);

  // ESC 키로 모달 닫기
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showUserModal) {
        closeUserModal();
      }
    };

    if (showUserModal) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [showUserModal]);

  useEffect(() => {
    if (user && isAdminUser) {
      loadAdminData();
    }
  }, [user, isAdminUser]);

  useEffect(() => {
    if (activeTab === 'home-cards' && isAdminUser) {
      fetchHomeCards();
    }
  }, [activeTab, isAdminUser]);

  useEffect(() => {
    if (activeTab === 'home-card-management' && isAdminUser) {
      fetchHomeCardList();
    }
  }, [activeTab, isAdminUser]);

  useEffect(() => {
    if (activeTab === 'banner-management' && isAdminUser) {
      fetchBanners();
    }
  }, [activeTab, isAdminUser]);

  useEffect(() => {
    if (activeTab === 'popularity-management' && isAdminUser) {
      fetchPopularityData();
    }
  }, [activeTab, isAdminUser]);

  // Firebase 연결 상태 확인 함수
  const checkFirebaseConnection = async () => {
    try {
      // Firebase 앱 연결 확인
      const firebaseConnected = !!db && !!auth;
      
      // Firestore 연결 확인 (실제 존재하는 컬렉션 사용)
      let dbConnected = false;
      try {
        // communityDesigns 컬렉션에 접근하여 연결 확인
        const testQuery = query(collection(db, 'communityDesigns'), limit(1));
        await getDocs(testQuery);
        dbConnected = true;
      } catch (error: unknown) {
        console.warn('Firestore 연결 확인 실패:', error);
        dbConnected = false;
      }
      
      // Storage 연결 확인
      let storageConnected = false;
      try {
        if (storage) {
          storageConnected = true;
        }
      } catch (error: unknown) {
        console.warn('Storage 연결 확인 실패:', error);
        storageConnected = false;
      }
      
      return {
        firebaseConnected,
        dbConnected,
        storageConnected
      };
    } catch (error: unknown) {
      console.error('Firebase 연결 상태 확인 실패:', error);
      return {
        firebaseConnected: false,
        dbConnected: false,
        storageConnected: false
      };
    }
  };

  // Git 커밋 수 가져오기
  const getTotalCommits = async (): Promise<number> => {
    try {
      // Git 명령어로 커밋 수 가져오기
      const response = await fetch('/api/git-commits');
      if (response.ok) {
        const data = await response.json();
        return data.totalCommits || 0;
      }
      return 0;
    } catch (error: unknown) {
      console.warn('Git 커밋 수 가져오기 실패:', error);
      return 0;
    }
  };

  // 마지막 배포 시간 가져오기
  const getLastDeployTime = async (): Promise<string> => {
    try {
      // package.json의 버전 정보나 빌드 시간 사용
      const response = await fetch('/api/last-deploy');
      if (response.ok) {
        const data = await response.json();
        return data.lastDeploy || 'N/A';
      }
      return new Date().toLocaleDateString('ko-KR');
    } catch (error: unknown) {
      console.warn('마지막 배포 시간 가져오기 실패:', error);
      return 'N/A';
    }
  };

  // 마지막 빌드 시간 가져오기
  const getLastBuildTime = async (): Promise<string> => {
    try {
      // 빌드 시간 정보 가져오기
      const response = await fetch('/api/last-build');
      if (response.ok) {
        const data = await response.json();
        return data.lastBuild || 'N/A';
      }
      return new Date().toLocaleDateString('ko-KR');
    } catch (error: unknown) {
      console.warn('마지막 빌드 시간 가져오기 실패:', error);
      return 'N/A';
    }
  };

  // 오늘 활성 사용자 수 가져오기
  const getTodayActiveUsers = async (): Promise<number> => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // 오늘 생성된 작품이나 박스로톡이 있는 사용자 수 계산
      const todayDesignsQuery = query(
        collection(db, 'communityDesigns'),
        where('createdAt', '>=', today)
      );
      const todayDesignsSnapshot = await getDocs(todayDesignsQuery);
      
      const todayBoxroTalksQuery = query(
        collection(db, 'boxroTalks'),
        where('createdAt', '>=', today)
      );
      const todayBoxroTalksSnapshot = await getDocs(todayBoxroTalksQuery);
      
      // 오늘 활동한 사용자 ID 수집
      const activeUserIds = new Set<string>();
      
      // 오늘 작품을 만든 사용자들
      todayDesignsSnapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.authorId) {
          activeUserIds.add(data.authorId);
        }
      });
      
      // 오늘 박스로톡을 작성한 사용자들
      todayBoxroTalksSnapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.authorId) {
          activeUserIds.add(data.authorId);
        }
      });
      
      const todayActiveCount = activeUserIds.size;
      console.log('오늘 활성 사용자 수:', todayActiveCount);
      return todayActiveCount;
    } catch (error: unknown) {
      console.warn('오늘 활성 사용자 수 가져오기 실패:', error);
      return 0;
    }
  };

  // 최근 24시간 활동량 가져오기
  const getRecent24hActivity = async (): Promise<number> => {
    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      // 갤러리 활동 (작품 생성, 좋아요, 공유, 다운로드)
      const designsQuery = query(
        collection(db, 'communityDesigns'),
        where('createdAt', '>=', yesterday)
      );
      const designsSnapshot = await getDocs(designsQuery);
      const recentDesigns = designsSnapshot.docs.length;
      
      // 박스로 톡 활동
      const boxroTalksQuery = query(
        collection(db, 'boxroTalks'),
        where('createdAt', '>=', yesterday)
      );
      const boxroTalksSnapshot = await getDocs(boxroTalksQuery);
      const recentBoxroTalks = boxroTalksSnapshot.docs.length;
      
      return recentDesigns + recentBoxroTalks;
    } catch (error: unknown) {
      console.warn('최근 24시간 활동량 가져오기 실패:', error);
      return 0;
    }
  };

  // 피크 시간 가져오기
  const getPeakTime = async (): Promise<string> => {
    try {
      // 최근 30일간의 활동 데이터를 시간대별로 분석
      const monthAgo = new Date();
      monthAgo.setDate(monthAgo.getDate() - 30);
      
      // 갤러리 작품 생성 시간 분석
      const designsQuery = query(
        collection(db, 'communityDesigns'),
        where('createdAt', '>=', monthAgo)
      );
      const designsSnapshot = await getDocs(designsQuery);
      
      // 박스로 톡 생성 시간 분석
      const boxroTalksQuery = query(
        collection(db, 'boxroTalks'),
        where('createdAt', '>=', monthAgo)
      );
      const boxroTalksSnapshot = await getDocs(boxroTalksQuery);
      
      const hourCounts: { [key: number]: number } = {};
      
      // 갤러리 작품 시간 분석
      designsSnapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.createdAt && data.createdAt.toDate) {
          const date = data.createdAt.toDate();
          const hour = date.getHours();
          hourCounts[hour] = (hourCounts[hour] || 0) + 1;
        }
      });
      
      // 박스로 톡 시간 분석
      boxroTalksSnapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.createdAt && data.createdAt.toDate) {
          const date = data.createdAt.toDate();
          const hour = date.getHours();
          hourCounts[hour] = (hourCounts[hour] || 0) + 1;
        }
      });
      
      console.log('시간대별 활동 수:', hourCounts);
      
      // 가장 활발한 시간대 찾기
      let peakHour = 14; // 기본값: 오후 2시
      let maxCount = 0;
      
      for (const [hour, count] of Object.entries(hourCounts)) {
        if (count > maxCount) {
          maxCount = count;
          peakHour = parseInt(hour);
        }
      }
      
      // 데이터가 없으면 일반적인 피크 시간 사용
      if (Object.keys(hourCounts).length === 0) {
        peakHour = 14; // 오후 2시
        console.log('활동 데이터 없음, 기본 피크 시간 사용:', peakHour);
      }
      
      const result = `${peakHour}:00`;
      console.log('피크 시간 결과:', result);
      return result;
    } catch (error: unknown) {
      console.warn('피크 시간 가져오기 실패:', error);
      return '14:00'; // 기본값 반환
    }
  };

  // 사용자 활동 데이터 가져오기
  const loadUserActivities = async (userEmail: string) => {
    try {
      // 사용자 정보 가져오기
      const usersQuery = query(collection(db, 'users'));
      const usersSnapshot = await getDocs(usersQuery);
      const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // 사용자의 작품 가져오기
      const designsQuery = query(collection(db, 'communityDesigns'), orderBy('createdAt', 'desc'));
      const designsSnapshot = await getDocs(designsQuery);
      const userDesigns = designsSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter((design: any) => design.authorEmail === userEmail)
        .map((design: any) => ({
          ...design,
          title: design.title || design.name || '제목 없음',
          createdAt: design.createdAt
        }));

      // 사용자의 박스카 이야기 가져오기
      const storiesQuery = query(collection(db, 'storyArticles'), orderBy('createdAt', 'desc'));
      const storiesSnapshot = await getDocs(storiesQuery);
      const userStories = storiesSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter((story: any) => story.authorEmail === userEmail)
        .map((story: any) => {
          return {
            ...story,
            title: story.title || '제목 없음',
            createdAt: story.createdAt
          };
        });

      // 갤러리 작품에서 사용하는 실제 닉네임 가져오기
      let actualUserNickname = null;
      if (userDesigns.length > 0) {
        actualUserNickname = userDesigns[0].authorNickname;
      }

      // 박스카 이야기에 실제 닉네임 적용
      const resolvedUserStories = userStories.map((story: any) => ({
        ...story,
        actualNickname: actualUserNickname || '작가 정보 없음'
      }));

      // 사용자의 스토어 작품 가져오기
      const storeItemsQuery = query(collection(db, 'storeItems'), orderBy('createdAt', 'desc'));
      const storeItemsSnapshot = await getDocs(storeItemsQuery);
      const userStoreItems = storeItemsSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter((storeItem: any) => storeItem.authorEmail === userEmail)
        .map((storeItem: any) => ({
          ...storeItem,
          title: storeItem.title || '제목 없음',
          createdAt: storeItem.createdAt
        }));

      // 사용자의 박스로 톡 가져오기 (갤러리 박스로 톡)
      const boxroTalksQuery = query(collection(db, 'boxroTalks'), orderBy('createdAt', 'desc'));
      const boxroTalksSnapshot = await getDocs(boxroTalksQuery);
      const userGalleryBoxroTalks = boxroTalksSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data(), source: 'gallery' }))
        .filter((boxroTalk: any) => 
          boxroTalk.authorEmail === userEmail &&
          boxroTalk.isDeleted !== true && 
          boxroTalk.deletedAt === undefined
        );

      // 사용자의 박스로 톡 가져오기 (스토리 박스로 톡 - 스토어 관련 제외)
      const storyBoxroTalksQuery = query(collection(db, 'storyBoxroTalks'), orderBy('createdAt', 'desc'));
      const storyBoxroTalksSnapshot = await getDocs(storyBoxroTalksQuery);
      const userStoryBoxroTalks = storyBoxroTalksSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data(), source: 'story' }))
        .filter((boxroTalk: any) => 
          boxroTalk.authorEmail === userEmail &&
          !boxroTalk.storeId && 
          !boxroTalk.storeItemId && 
          boxroTalk.type !== 'store' && 
          !(boxroTalk.text && boxroTalk.text.includes('스토어')) &&
          !(boxroTalk.articleId && boxroTalk.articleId.includes('store')) &&
          boxroTalk.isDeleted !== true && 
          boxroTalk.deletedAt === undefined
        );

      // 사용자의 박스로 톡 가져오기 (스토어 박스로 톡)
      const storeBoxroTalksQuery = query(collection(db, 'storeBoxroTalks'), orderBy('createdAt', 'desc'));
      const storeBoxroTalksSnapshot = await getDocs(storeBoxroTalksQuery);
      const userStoreBoxroTalks = storeBoxroTalksSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data(), source: 'store' }))
        .filter((boxroTalk: any) => 
          boxroTalk.authorEmail === userEmail &&
          boxroTalk.isDeleted !== true && 
          boxroTalk.deletedAt === undefined
        );

      // 모든 박스로 톡 합치기 (최신순 정렬, 삭제된 톡 제외)
      const userBoxroTalks = [...userGalleryBoxroTalks, ...userStoryBoxroTalks, ...userStoreBoxroTalks]
        .filter((boxroTalk: any) => 
          boxroTalk.isDeleted !== true && 
          boxroTalk.deletedAt === undefined
        )
        .sort((a, b) => {
          // Firestore Timestamp 객체 처리
          const getTimestamp = (date: any) => {
            if (!date) return 0;
            if (date.toDate && typeof date.toDate === 'function') {
              return date.toDate().getTime();
            }
            if (date.seconds) {
              return date.seconds * 1000 + (date.nanoseconds || 0) / 1000000;
            }
            return new Date(date).getTime();
          };
          
          const dateA = getTimestamp(a.createdAt);
          const dateB = getTimestamp(b.createdAt);
          return dateB - dateA; // 최신순 (내림차순)
        });

      // 박스로 톡의 작품 정보 가져오기 (고아 박스로톡 제외)
      const boxroTalksWithDesignInfo = await Promise.all(
        userBoxroTalks.map(async (boxroTalk: any) => {
          let designTitle = '작품 정보 없음';
          let designAuthor = '작가 정보 없음';
          let designThumbnail = null;
          let isOrphaned = false; // 고아 박스로톡 여부
          
          try {
            // 갤러리 박스로 톡인 경우
            if (boxroTalk.source === 'gallery' && boxroTalk.designId) {
              console.log('갤러리 박스로 톡의 designId:', boxroTalk.designId);
              const designDoc = await getDoc(doc(db, 'communityDesigns', boxroTalk.designId));
              if (designDoc.exists()) {
                const designData = designDoc.data();
                console.log('갤러리 작품 데이터:', designData);
                designTitle = designData.title || designData.name || '제목 없음';
                designAuthor = designData.authorNickname || designData.author || '작가 정보 없음';
                designThumbnail = designData.thumbnail || designData.thumbnailUrl || null;
                console.log('추출된 갤러리 작품 제목:', designTitle, '작가:', designAuthor, '썸네일:', designThumbnail);
              } else {
                console.log('갤러리 작품 문서가 존재하지 않음 (고아 박스로톡):', boxroTalk.designId);
                isOrphaned = true;
              }
            }
            // 스토리 박스로 톡인 경우
            else if (boxroTalk.source === 'story' && boxroTalk.articleId) {
              console.log('스토리 박스로 톡의 articleId:', boxroTalk.articleId);
              const articleDoc = await getDoc(doc(db, 'storyArticles', boxroTalk.articleId));
              if (articleDoc.exists()) {
                const articleData = articleDoc.data();
                console.log('스토리 작품 데이터:', articleData);
                designTitle = articleData.title || '제목 없음';
                designAuthor = articleData.authorNickname || articleData.author || '작가 정보 없음';
                designThumbnail = articleData.thumbnail || articleData.cardThumbnail || null;
                console.log('추출된 스토리 작품 제목:', designTitle, '작가:', designAuthor, '썸네일:', designThumbnail);
              } else {
                console.log('스토리 작품 문서가 존재하지 않음 (고아 박스로톡):', boxroTalk.articleId);
                isOrphaned = true;
              }
            }
            // 스토어 박스로 톡인 경우
            else if (boxroTalk.source === 'store' && boxroTalk.articleId) {
              console.log('스토어 박스로 톡의 articleId:', boxroTalk.articleId);
              const storeDoc = await getDoc(doc(db, 'storeItems', boxroTalk.articleId));
              if (storeDoc.exists()) {
                const storeData = storeDoc.data();
                console.log('스토어 작품 데이터:', storeData);
                designTitle = storeData.title || '제목 없음';
                designAuthor = storeData.authorNickname || storeData.author || '작가 정보 없음';
                designThumbnail = storeData.thumbnail || storeData.cardThumbnail || null;
                console.log('추출된 스토어 작품 제목:', designTitle, '작가:', designAuthor, '썸네일:', designThumbnail);
              } else {
                console.log('스토어 작품 문서가 존재하지 않음 (고아 박스로톡):', boxroTalk.articleId);
                isOrphaned = true;
              }
            } else {
              console.log('박스로 톡에 source나 ID가 없음:', boxroTalk);
              isOrphaned = true;
            }
          } catch (error: unknown) {
            console.warn('작품 정보 가져오기 실패:', error);
          }
          
          return {
            ...boxroTalk,
            content: boxroTalk.content || boxroTalk.text || '내용 없음',
            designTitle: designTitle,
            designAuthor: designAuthor,
            designThumbnail: designThumbnail,
            createdAt: boxroTalk.createdAt,
            source: boxroTalk.source, // source 필드 유지
            isOrphaned: isOrphaned // 고아 박스로톡 여부
          };
        })
      );

      // 고아 박스로톡 필터링 (삭제된 게시글의 박스로톡 제외)
      const validBoxroTalks = boxroTalksWithDesignInfo.filter((boxroTalk: any) => !boxroTalk.isOrphaned);

      // 사용자의 좋아요 가져오기 (갤러리 작품 + 박스카 이야기)
      const userLikes = [
        // 갤러리 작품 좋아요
        ...userDesigns.reduce((likes: any[], design: any) => {
          if (design.likes > 0) {
            console.log('좋아요 작품 데이터:', design);
            console.log('작가 정보:', {
              author: design.author,
              authorNickname: design.authorNickname,
              authorName: design.authorName,
              creator: design.creator,
              userId: design.userId
            });
            
            likes.push({
              type: 'design',
              id: design.id,
              title: design.title || design.name || '제목 없음',
              thumbnail: design.thumbnail || design.thumbnailUrl,
              author: design.authorNickname || design.author || design.authorName || design.creator || design.userId || '작가 정보 없음',
              likes: design.likes,
              createdAt: design.createdAt
            });
          }
          return likes;
        }, []),
        // 박스카 이야기 좋아요
        ...resolvedUserStories.reduce((likes: any[], story: any) => {
          if (story.likes > 0) {
            console.log('박스카 이야기 전체 데이터:', story);
            console.log('박스카 이야기 전체 필드 확인:', Object.keys(story));
            console.log('박스카 이야기 작가 정보 상세:', {
              // 현재 사용 중인 필드들
              authorNickname: story.authorNickname,
              author: story.author,
              authorName: story.authorName,
              creator: story.creator,
              userId: story.userId,
              displayName: story.displayName,
              nickname: story.nickname,
              userNickname: story.userNickname,
              userDisplayName: story.userDisplayName,
              userNick: story.userNick
            });
            
            likes.push({
              type: 'story',
              id: story.id,
              title: story.title || '제목 없음',
              thumbnail: story.thumbnail || story.cardThumbnail,
              author: story.actualNickname || story.authorNickname || story.authorName || story.author || story.creator || story.userId || '작가 정보 없음',
              likes: story.likes,
              createdAt: story.createdAt
            });
          }
          return likes;
        }, []),
        // 스토어 작품 좋아요
        ...userStoreItems.reduce((likes: any[], storeItem: any) => {
          if (storeItem.likes > 0) {
            likes.push({
              type: 'store',
              id: storeItem.id,
              title: storeItem.title || '제목 없음',
              thumbnail: storeItem.thumbnail || storeItem.cardThumbnail,
              author: storeItem.authorNickname || storeItem.author || storeItem.authorName || storeItem.creator || storeItem.userId || '작가 정보 없음',
              likes: storeItem.likes,
              createdAt: storeItem.createdAt
            });
          }
          return likes;
        }, [])
      ].sort((a, b) => {
        // Firestore Timestamp 객체 처리
        const getTimestamp = (date: any) => {
          if (!date) return 0;
          if (date.toDate && typeof date.toDate === 'function') {
            return date.toDate().getTime();
          }
          if (date.seconds) {
            return date.seconds * 1000 + (date.nanoseconds || 0) / 1000000;
          }
          return new Date(date).getTime();
        };
        
        const dateA = getTimestamp(a.createdAt);
        const dateB = getTimestamp(b.createdAt);
        return dateB - dateA; // 최신순 (내림차순)
      });

      // 사용자의 다운로드 가져오기 (갤러리 작품 + 도안 다운로드)
      const userDownloads = [
        // 갤러리 작품 다운로드 (downloadedBy 배열 사용)
        ...userDesigns.reduce((downloads: any[], design: any) => {
          const downloadedBy = design.downloadedBy || [];
          console.log('🔍 갤러리 작품 다운로드 디버깅:', {
            designId: design.id,
            designTitle: design.title || design.name,
            downloadedBy: downloadedBy,
            downloadedByLength: downloadedBy.length,
            downloads: design.downloads
          });
          if (downloadedBy.length > 0) {
            downloads.push({
              type: 'design',
              id: design.id,
              title: design.title || design.name || '제목 없음',
              thumbnail: design.thumbnail || design.thumbnailUrl,
              author: design.authorNickname || design.author || design.authorName || design.creator || design.userId || '작가 정보 없음',
              downloads: downloadedBy.length,
              createdAt: design.createdAt
            });
          }
          return downloads;
        }, [])
      ];

      // 도안 다운로드 가져오기 (테이블과 동일한 방식으로 계산)
      const blueprintDownloadsQuery = query(collection(db, 'blueprintDownloads'));
      const blueprintDownloadsSnapshot = await getDocs(blueprintDownloadsQuery);
      
      // 현재 사용자의 도안 다운로드만 필터링
      const userBlueprintDownloads = [];
      console.log('🔍 도안 다운로드 디버깅 - 전체 문서 수:', blueprintDownloadsSnapshot.docs.length);
      blueprintDownloadsSnapshot.docs.forEach((doc) => {
        const downloadData = doc.data();
        const userId = downloadData.userId;
        const user = users.find(u => u.uid === userId);
        console.log('🔍 도안 다운로드 디버깅:', {
          docId: doc.id,
          userId: userId,
          userEmail: user?.email,
          targetUserEmail: userEmail,
          isMatch: user && user.email === userEmail
        });
        if (user && user.email === userEmail) {
          userBlueprintDownloads.push({
            type: 'blueprint',
            id: doc.id,
            title: `도안 다운로드 (${downloadData.downloadType})`,
            thumbnail: null,
            author: user.authorNickname || user.displayName || '사용자',
            downloads: 1,
            fileName: downloadData.fileName,
            carType: downloadData.carType,
            carColor: downloadData.carColor,
            createdAt: downloadData.createdAt
          });
        }
      });
      console.log('🔍 사용자 도안 다운로드 수:', userBlueprintDownloads.length);

      // 모든 다운로드 합치기 (최신순 정렬)
      const allUserDownloads = [...userDownloads, ...userBlueprintDownloads].sort((a, b) => {
        // Firestore Timestamp 객체 처리
        const getTimestamp = (date: any) => {
          if (!date) return 0;
          if (date.toDate && typeof date.toDate === 'function') {
            return date.toDate().getTime();
          }
          if (date.seconds) {
            return date.seconds * 1000 + (date.nanoseconds || 0) / 1000000;
          }
          return new Date(date).getTime();
        };
        
        const dateA = getTimestamp(a.createdAt);
        const dateB = getTimestamp(b.createdAt);
        return dateB - dateA; // 최신순 (내림차순)
      });

      console.log('🔍 최종 다운로드 디버깅:', {
        userDownloads: userDownloads.length,
        userBlueprintDownloads: userBlueprintDownloads.length,
        totalDownloads: allUserDownloads.length,
        userDownloadsDetails: userDownloads.map(d => ({ type: d.type, downloads: d.downloads })),
        userBlueprintDownloadsDetails: userBlueprintDownloads.map(d => ({ type: d.type, downloads: d.downloads }))
      });

      // 사용자의 공유 가져오기 (갤러리 작품 + 박스카 이야기)
      const userShares = [
        // 갤러리 작품 공유 (sharedBy 배열 사용)
        ...userDesigns.reduce((shares: any[], design: any) => {
          const sharedBy = design.sharedBy || [];
          console.log('🔍 갤러리 작품 공유 디버깅:', {
            designId: design.id,
            designTitle: design.title || design.name,
            sharedBy: sharedBy,
            sharedByLength: sharedBy.length,
            shares: design.shares
          });
          if (sharedBy.length > 0) {
            shares.push({
              type: 'design',
              id: design.id,
              title: design.title || design.name || '제목 없음',
              thumbnail: design.thumbnail || design.thumbnailUrl,
              author: design.authorNickname || design.author || design.authorName || design.creator || design.userId || '작가 정보 없음',
              shares: design.shares || 0, // 전체 공유 수 사용
              createdAt: design.createdAt
            });
          }
          return shares;
        }, []),
        // 박스카 이야기 공유 (sharedBy 배열 사용)
        ...resolvedUserStories.reduce((shares: any[], story: any) => {
          const sharedBy = story.sharedBy || [];
          console.log('🔍 스토리 작품 공유 디버깅:', {
            storyId: story.id,
            storyTitle: story.title,
            sharedBy: sharedBy,
            sharedByLength: sharedBy.length,
            shares: story.shares
          });
          if (sharedBy.length > 0) {
            shares.push({
              type: 'story',
              id: story.id,
              title: story.title || '제목 없음',
              thumbnail: story.thumbnail || story.cardThumbnail,
              author: story.actualNickname || story.authorNickname || story.authorName || story.author || story.creator || story.userId || '작가 정보 없음',
              shares: story.shares || 0, // 전체 공유 수 사용
              createdAt: story.createdAt
            });
          }
          return shares;
        }, []),
        // 스토어 작품 공유 (sharedBy 배열 사용)
        ...userStoreItems.reduce((shares: any[], storeItem: any) => {
          const sharedBy = storeItem.sharedBy || [];
          console.log('🔍 스토어 작품 공유 디버깅:', {
            storeItemId: storeItem.id,
            storeItemTitle: storeItem.title,
            sharedBy: sharedBy,
            sharedByLength: sharedBy.length,
            shares: storeItem.shares
          });
          if (sharedBy.length > 0) {
            shares.push({
              type: 'store',
              id: storeItem.id,
              title: storeItem.title || '제목 없음',
              thumbnail: storeItem.thumbnail || storeItem.cardThumbnail,
              author: storeItem.authorNickname || storeItem.author || storeItem.authorName || storeItem.creator || storeItem.userId || '작가 정보 없음',
              shares: storeItem.shares || 0, // 전체 공유 수 사용
              createdAt: storeItem.createdAt
            });
          }
          return shares;
        }, [])
      ].sort((a, b) => {
        // Firestore Timestamp 객체 처리
        const getTimestamp = (date: any) => {
          if (!date) return 0;
          if (date.toDate && typeof date.toDate === 'function') {
            return date.toDate().getTime();
          }
          if (date.seconds) {
            return date.seconds * 1000 + (date.nanoseconds || 0) / 1000000;
          }
          return new Date(date).getTime();
        };
        
        const dateA = getTimestamp(a.createdAt);
        const dateB = getTimestamp(b.createdAt);
        return dateB - dateA; // 최신순 (내림차순)
      });

      // 사용자의 조회 가져오기 (갤러리 작품 + 박스카 이야기 + 스토어 아이템)
      const userViews = [
        // 갤러리 작품 조회 (viewedBy 배열 사용)
        ...userDesigns.reduce((views: any[], design: any) => {
          const viewedBy = design.viewedBy || [];
          console.log('🔍 갤러리 작품 조회 디버깅:', {
            designId: design.id,
            designTitle: design.title || design.name,
            viewedByLength: viewedBy.length,
            viewedBy: viewedBy
          });
          
          if (viewedBy.length > 0) {
            views.push({
              type: 'gallery',
              id: design.id,
              title: design.title || design.name || '제목 없음',
              thumbnail: design.thumbnail || design.imageUrl,
              author: design.authorNickname || design.author || design.authorName || design.creator || design.userId || '작가 정보 없음',
              views: design.views || 0, // 전체 조회 수 사용
              createdAt: design.createdAt
            });
          }
          return views;
        }, []),
        
        // 박스카 이야기 조회 (viewedBy 배열 사용)
        ...userStories.reduce((views: any[], story: any) => {
          const viewedBy = story.viewedBy || [];
          console.log('🔍 박스카 이야기 조회 디버깅:', {
            storyId: story.id,
            storyTitle: story.title,
            viewedByLength: viewedBy.length,
            viewedBy: viewedBy
          });
          
          if (viewedBy.length > 0) {
            views.push({
              type: 'story',
              id: story.id,
              title: story.title || '제목 없음',
              thumbnail: story.thumbnail || story.imageUrl,
              author: story.authorNickname || story.author || story.authorName || story.creator || story.userId || '작가 정보 없음',
              views: story.views || 0, // 전체 조회 수 사용
              createdAt: story.createdAt
            });
          }
          return views;
        }, []),
        
        // 스토어 아이템 조회 (viewedBy 배열 사용)
        ...userStoreItems.reduce((views: any[], storeItem: any) => {
          const viewedBy = storeItem.viewedBy || [];
          console.log('🔍 스토어 아이템 조회 디버깅:', {
            storeItemId: storeItem.id,
            storeItemTitle: storeItem.title,
            viewedByLength: viewedBy.length,
            viewedBy: viewedBy
          });
          
          if (viewedBy.length > 0) {
            views.push({
              type: 'store',
              id: storeItem.id,
              title: storeItem.title || '제목 없음',
              thumbnail: storeItem.thumbnail || storeItem.cardThumbnail,
              author: storeItem.authorNickname || storeItem.author || storeItem.authorName || storeItem.creator || storeItem.userId || '작가 정보 없음',
              views: storeItem.views || 0, // 전체 조회 수 사용
              createdAt: storeItem.createdAt
            });
          }
          return views;
        }, [])
      ].sort((a, b) => {
        // Firestore Timestamp 객체 처리
        const getTimestamp = (date: any) => {
          if (!date) return 0;
          if (date.toDate && typeof date.toDate === 'function') {
            return date.toDate().getTime();
          }
          if (date.seconds) {
            return date.seconds * 1000 + (date.nanoseconds || 0) / 1000000;
          }
          return new Date(date).getTime();
        };
        
        const dateA = getTimestamp(a.createdAt);
        const dateB = getTimestamp(b.createdAt);
        return dateB - dateA; // 최신순 (내림차순)
      });

      // 사용자의 스토어 바로가기 가져오기
      const userStoreRedirects = userStoreItems.reduce((redirects: any[], storeItem: any) => {
        const redirectedBy = storeItem.storeRedirectedBy || [];
        const userRedirectCount = redirectedBy.filter((uid: string) => uid === user.uid).length;
        
        if (userRedirectCount > 0) {
          redirects.push({
            type: 'store',
            id: storeItem.id,
            title: storeItem.title || '제목 없음',
            thumbnail: storeItem.thumbnail || storeItem.cardThumbnail,
            author: storeItem.authorNickname || storeItem.author || storeItem.authorName || storeItem.creator || storeItem.userId || '작가 정보 없음',
            storeRedirects: storeItem.storeRedirects || 0,
            createdAt: storeItem.createdAt,
            redirectedAt: storeItem.createdAt // 실제 리다이렉트 날짜를 추적하려면 별도 컬렉션이 필요하므로 임시로 생성일 사용
          });
        }
        return redirects;
      }, []).sort((a: any, b: any) => {
        // Firestore Timestamp 객체 처리
        const getTimestamp = (date: any) => {
          if (!date) return 0;
          if (date.toDate && typeof date.toDate === 'function') {
            return date.toDate().getTime();
          }
          if (date.seconds) {
            return date.seconds * 1000 + (date.nanoseconds || 0) / 1000000;
          }
          return new Date(date).getTime();
        };
        
        const dateA = getTimestamp(a.createdAt);
        const dateB = getTimestamp(b.createdAt);
        return dateB - dateA; // 최신순 (내림차순)
      });

      return {
        designs: userDesigns,
        boxroTalks: validBoxroTalks, // 고아 박스로톡 제외한 유효한 박스로톡만 반환
        likes: userLikes,
        downloads: allUserDownloads,
        shares: userShares,
        views: userViews,
        storeRedirects: userStoreRedirects
      };
    } catch (error: unknown) {
      console.error('사용자 활동 데이터 로드 실패:', error);
      return {
        designs: [],
        boxroTalks: [],
        likes: [],
        downloads: [],
        shares: [],
        views: [],
        storeRedirects: []
      };
    }
  };

  // 고아 박스로톡 필터링 함수 (삭제된 게시글의 박스로톡 제외)
  const filterOrphanedBoxroTalks = async (boxroTalks: any[], source: 'gallery' | 'story' | 'store') => {
    const validBoxroTalks = [];
    
    for (const boxroTalk of boxroTalks) {
      let isOrphaned = false;
      
      try {
        if (source === 'gallery' && boxroTalk.designId) {
          const designDoc = await getDoc(doc(db, 'communityDesigns', boxroTalk.designId));
          if (!designDoc.exists()) {
            isOrphaned = true;
          }
        } else if (source === 'story' && boxroTalk.articleId) {
          const articleDoc = await getDoc(doc(db, 'storyArticles', boxroTalk.articleId));
          if (!articleDoc.exists()) {
            isOrphaned = true;
          }
        } else if (source === 'store' && boxroTalk.articleId) {
          const storeDoc = await getDoc(doc(db, 'storeItems', boxroTalk.articleId));
          if (!storeDoc.exists()) {
            isOrphaned = true;
          }
        }
      } catch (error: unknown) {
        console.warn('고아 박스로톡 확인 실패:', error);
        isOrphaned = true;
      }
      
      if (!isOrphaned) {
        validBoxroTalks.push(boxroTalk);
      }
    }
    
    return validBoxroTalks;
  };

  const loadAdminData = async () => {
    try {
      setLoading(true);
      console.log('📊 관리자 데이터 로드 시작...');
      
      // Firebase 연결 상태 확인
      const connectionStatus = await checkFirebaseConnection();
      console.log('🔗 Firebase 연결 상태:', connectionStatus);
      
      // 갤러리 디자인 데이터 가져오기 (communityDesigns 컬렉션)
      const designsQuery = query(collection(db, 'communityDesigns'), orderBy('createdAt', 'desc'));
      const designsSnapshot = await getDocs(designsQuery);
      const designs = designsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // 박스로 톡 데이터 가져오기
      const boxroTalksQuery = query(collection(db, 'boxroTalks'), orderBy('createdAt', 'desc'));
      const boxroTalksSnapshot = await getDocs(boxroTalksQuery);
      const boxroTalks = boxroTalksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      

      // 스토리 데이터 가져오기
      let stories: any[] = [];
      let storyBoxroTalks: any[] = [];
      try {
        const storiesQuery = query(collection(db, 'storyArticles'), orderBy('createdAt', 'desc'));
        const storiesSnapshot = await getDocs(storiesQuery);
        stories = storiesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // 스토리 박스로 톡 데이터 가져오기
        const storyBoxroTalksQuery = query(collection(db, 'storyBoxroTalks'), orderBy('createdAt', 'desc'));
        const storyBoxroTalksSnapshot = await getDocs(storyBoxroTalksQuery);
        storyBoxroTalks = storyBoxroTalksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // 스토어 관련 박스로 톡이 스토리에 포함되어 있는지 확인
        const storeRelatedTalks = storyBoxroTalks.filter(talk => 
          talk.storeId || talk.storeItemId || talk.type === 'store' || 
          (talk.text && talk.text.includes('스토어')) ||
          (talk.articleId && talk.articleId.includes('store'))
        );
        
        if (storeRelatedTalks.length > 0) {
          console.log('📊 데이터 무결성 체크: 스토리 컬렉션에 스토어 관련 박스로 톡', storeRelatedTalks.length, '개 발견');
          // 실제로는 이런 데이터 분류 문제가 있을 수 있으므로 경고가 아닌 정보로 처리
        }
        
        
      } catch (error: unknown) {
        console.warn('⚠️ 스토리 데이터 접근 권한 없음, 빈 배열로 처리:', error);
        stories = [];
        storyBoxroTalks = [];
      }

      // 사용자 정보 가져오기 (권한 오류 시 빈 배열로 처리)
      let users: any[] = [];
      try {
        const usersQuery = query(collection(db, 'users'));
        const usersSnapshot = await getDocs(usersQuery);
        users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      } catch (error: unknown) {
        console.warn('⚠️ users 컬렉션 접근 권한 없음, 빈 배열로 처리:', error);
        users = [];
      }

      // PWA 설치 데이터 가져오기
      let pwaInstalls: any[] = [];
      try {
        const pwaInstallsQuery = query(collection(db, 'pwaInstalls'), orderBy('timestamp', 'desc'));
        const pwaInstallsSnapshot = await getDocs(pwaInstallsQuery);
        pwaInstalls = pwaInstallsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        console.log('📱 PWA 설치 데이터 로드:', pwaInstalls.length);
      } catch (error: unknown) {
        // 권한 오류인 경우 조용히 무시
        if (error instanceof Error && error.message.includes('permissions')) {
          console.log('📝 PWA 설치 데이터 접근 권한 없음 (정상)');
        } else {
          console.warn('⚠️ PWA 설치 데이터 로드 오류:', error);
        }
        pwaInstalls = [];
      }

      // PWA 설치 데이터를 사용자별로 정리
      const pwaInstallMap = new Map<string, { installed: boolean; installDate: string }>();
      pwaInstalls.forEach((pwaInstall: any) => {
        if (pwaInstall.eventType === 'install_complete' || pwaInstall.eventType === 'already_installed' || pwaInstall.eventType === 'install_detected') {
          // User Agent에서 이메일을 추출하거나, 다른 방법으로 사용자 식별
          // 여기서는 User Agent를 기반으로 추정하거나, 별도의 사용자 식별 방법이 필요할 수 있습니다
          const userAgent = pwaInstall.userAgent || '';
          const installDate = pwaInstall.timestamp?.toDate?.()?.toISOString() || pwaInstall.timestamp || '';
          
          // User Agent 기반으로 임시 키 생성 (실제로는 더 정확한 사용자 식별이 필요)
          const tempKey = userAgent.substring(0, 50); // User Agent의 일부를 키로 사용
          pwaInstallMap.set(tempKey, {
            installed: true,
            installDate: installDate
          });
        }
      });

      // 이메일 주소에서 계정 부분만 추출하는 헬퍼 함수
      const getDisplayName = (author: string, authorNickname: string, email: string) => {
        // authorNickname이 있고 이메일이 아닌 경우
        if (authorNickname && !authorNickname.includes('@')) {
          return authorNickname;
        }
        // author가 있고 이메일이 아닌 경우
        if (author && !author.includes('@')) {
          return author;
        }
        // 이메일 계정 부분 사용
        if (email !== 'unknown') {
          return email.split('@')[0];
        }
        return '익명';
      };

      // 사용자별 통계 계산
      const userStatsMap = new Map<string, UserStats>();
      
      // 갤러리 작품별 통계
      designs.forEach((design: any) => {
        const email = design.authorEmail || 'unknown';
        if (!userStatsMap.has(email)) {
          userStatsMap.set(email, {
            email,
            displayName: getDisplayName(design.author || '', design.authorNickname || '', email),
            authorNickname: getDisplayName(design.author || '', design.authorNickname || '', email),
            photoURL: '',
            createdAt: design.createdAt || '',
            lastSignIn: '',
            designsCount: 0,
            boxroTalksCount: 0,
            likesCount: 0,
            downloadsCount: 0,
            sharesCount: 0,
            viewsCount: 0,
            storeRedirectsCount: 0,
            uid: design.authorId || '',
            pwaInstalled: false,
            pwaInstallDate: ''
          });
        }
        
        const userStat = userStatsMap.get(email)!;
        userStat.designsCount++;
        // 갤러리 작품의 조회수는 별도로 계산하지 않음 (사용자 활동이 아님)
      });

      // 스토리별 통계
      stories.forEach((story: any) => {
        const email = story.authorEmail || 'unknown';
        if (!userStatsMap.has(email)) {
          userStatsMap.set(email, {
            email,
            displayName: getDisplayName(story.author || '', story.authorNickname || '', email),
            authorNickname: getDisplayName(story.author || '', story.authorNickname || '', email),
            photoURL: '',
            createdAt: story.createdAt || '',
            lastSignIn: '',
            designsCount: 0,
            boxroTalksCount: 0,
            likesCount: 0,
            downloadsCount: 0,
            sharesCount: 0,
            viewsCount: 0,
            storeRedirectsCount: 0,
            uid: story.authorId || ''
          });
        }
        
        const userStat = userStatsMap.get(email)!;
        // 스토리의 조회수는 별도로 계산하지 않음 (사용자 활동이 아님)
      });

      // 갤러리 박스로 톡별 통계 (삭제되지 않은 것만 + 고아 박스로톡 제외)
      const deletedFilteredBoxroTalks = boxroTalks.filter((boxroTalk: any) => 
        boxroTalk.isDeleted !== true && boxroTalk.deletedAt === undefined
      );
      const activeGalleryBoxroTalks = await filterOrphanedBoxroTalks(deletedFilteredBoxroTalks, 'gallery');
      
      activeGalleryBoxroTalks.forEach((boxroTalk: any) => {
        const email = boxroTalk.authorEmail || 'unknown';
        if (!userStatsMap.has(email)) {
          userStatsMap.set(email, {
            email,
            displayName: getDisplayName(boxroTalk.author || '', boxroTalk.authorNickname || '', email),
            authorNickname: getDisplayName(boxroTalk.author || '', boxroTalk.authorNickname || '', email),
            photoURL: '',
            createdAt: boxroTalk.createdAt || '',
            lastSignIn: '',
            designsCount: 0,
            boxroTalksCount: 0,
            likesCount: 0,
            downloadsCount: 0,
            sharesCount: 0,
            viewsCount: 0,
            storeRedirectsCount: 0,
            uid: boxroTalk.authorId || ''
          });
        }
        
        const userStat = userStatsMap.get(email)!;
        userStat.boxroTalksCount++;
      });

      // 스토리 박스로 톡별 통계 (스토어 관련 제외, 삭제되지 않은 것만 + 고아 박스로톡 제외)
      const deletedFilteredStoryBoxroTalks = storyBoxroTalks.filter(talk => 
        !talk.storeId && !talk.storeItemId && talk.type !== 'store' && 
        !(talk.text && talk.text.includes('스토어')) &&
        !(talk.articleId && talk.articleId.includes('store')) &&
        talk.isDeleted !== true && talk.deletedAt === undefined
      );
      const pureStoryBoxroTalks = await filterOrphanedBoxroTalks(deletedFilteredStoryBoxroTalks, 'story');
      
      pureStoryBoxroTalks.forEach((boxroTalk: any) => {
        const email = boxroTalk.authorEmail || 'unknown';
        if (!userStatsMap.has(email)) {
          userStatsMap.set(email, {
            email,
            displayName: getDisplayName(boxroTalk.author || '', boxroTalk.authorNickname || '', email),
            authorNickname: getDisplayName(boxroTalk.author || '', boxroTalk.authorNickname || '', email),
            photoURL: '',
            createdAt: boxroTalk.createdAt || '',
            lastSignIn: '',
            designsCount: 0,
            boxroTalksCount: 0,
            likesCount: 0,
            downloadsCount: 0,
            sharesCount: 0,
            viewsCount: 0,
            storeRedirectsCount: 0,
            uid: boxroTalk.authorId || ''
          });
        }
        
        const userStat = userStatsMap.get(email)!;
        userStat.boxroTalksCount++;
      });

      // 스토어 아이템 통계 추가
      const storeItemsQuery = query(collection(db, 'storeItems'));
      const storeItemsSnapshot = await getDocs(storeItemsQuery);
      const storeItems = storeItemsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // 스토어 아이템별 통계
      storeItems.forEach((storeItem: any) => {
        const email = storeItem.authorEmail || 'unknown';
        if (!userStatsMap.has(email)) {
          userStatsMap.set(email, {
            email,
            displayName: (storeItem.author && !storeItem.author.includes('@')) ? storeItem.author : (email !== 'unknown' ? email.split('@')[0] : '익명'),
            authorNickname: (storeItem.authorNickname && !storeItem.authorNickname.includes('@')) ? storeItem.authorNickname : (storeItem.author && !storeItem.author.includes('@')) ? storeItem.author : (email !== 'unknown' ? email.split('@')[0] : '익명'),
            photoURL: '',
            createdAt: storeItem.createdAt || '',
            lastSignIn: '',
            designsCount: 0,
            boxroTalksCount: 0,
            likesCount: 0,
            downloadsCount: 0,
            sharesCount: 0,
            viewsCount: 0,
            storeRedirectsCount: 0,
            uid: storeItem.authorId || ''
          });
        }
        
        const userStat = userStatsMap.get(email)!;
        // 스토어 아이템의 조회수는 별도로 계산하지 않음 (사용자 활동이 아님)
        
        // 디버깅: 스토어 아이템 내부 박스로 톡 확인
        if (storeItem.boxroTalks && storeItem.boxroTalks.length > 0) {
          console.log('🔍 스토어 아이템 내부 박스로 톡 발견:', {
            storeItemId: storeItem.id,
            boxroTalks: storeItem.boxroTalks,
            boxroTalksCount: storeItem.boxroTalks.length
          });
        }
      });

      // 스토어 아이템 박스로 톡별 통계 (여러 컬렉션 확인)
      let storeBoxroTalks: any[] = [];
      
      // 1. storeBoxroTalks 컬렉션 확인
      try {
        const storeBoxroTalksQuery = query(collection(db, 'storeBoxroTalks'));
        const storeBoxroTalksSnapshot = await getDocs(storeBoxroTalksQuery);
        storeBoxroTalks = storeBoxroTalksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        console.log('🔍 storeBoxroTalks 컬렉션:', storeBoxroTalks.length);
      } catch (error: unknown) {
        console.warn('⚠️ storeBoxroTalks 컬렉션 접근 권한 없음:', error);
      }
      
      // 2. store 컬렉션 확인 (박스로 톡이 여기에 저장될 수 있음)
      let storeBoxroTalksFromStore: any[] = [];
      try {
        const storeQuery = query(collection(db, 'store'));
        const storeSnapshot = await getDocs(storeQuery);
        const storeItems = storeSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // store 컬렉션에서 박스로 톡 데이터 추출
        storeItems.forEach((item: any) => {
          if (item.boxroTalks && Array.isArray(item.boxroTalks)) {
            item.boxroTalks.forEach((talk: any) => {
              storeBoxroTalksFromStore.push({
                ...talk,
                storeId: item.id,
                storeTitle: item.title || item.name
              });
            });
          }
        });
        console.log('🔍 store 컬렉션에서 박스로 톡:', storeBoxroTalksFromStore.length);
      } catch (error: unknown) {
        console.warn('⚠️ store 컬렉션 접근 권한 없음:', error);
      }
      
      // 3. 다른 가능한 컬렉션들 확인
      let otherBoxroTalks: any[] = [];
      const possibleCollections = ['boxroTalks', 'storeBoxroTalks', 'storyBoxroTalks', 'store', 'storeItems'];
      
      for (const collectionName of possibleCollections) {
        try {
          const q = query(collection(db, collectionName));
          const snapshot = await getDocs(q);
          const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          
          // 각 컬렉션에서 박스로 톡 관련 데이터 찾기
          items.forEach((item: any) => {
            if (item.boxroTalks && Array.isArray(item.boxroTalks)) {
              item.boxroTalks.forEach((talk: any) => {
                otherBoxroTalks.push({
                  ...talk,
                  sourceCollection: collectionName,
                  sourceId: item.id,
                  sourceTitle: item.title || item.name
                });
              });
            }
          });
          
          console.log(`🔍 ${collectionName} 컬렉션에서 박스로 톡:`, 
            items.filter(item => item.boxroTalks && item.boxroTalks.length > 0).length);
        } catch (error: unknown) {
          // 권한 오류인 경우 조용히 무시
          if (error instanceof Error && error.message.includes('permissions')) {
            console.log(`📝 ${collectionName} 컬렉션 접근 권한 없음 (정상)`);
          } else {
            console.warn(`⚠️ ${collectionName} 컬렉션 접근 오류:`, error);
          }
        }
      }
      
      console.log('🔍 모든 컬렉션에서 찾은 박스로 톡:', otherBoxroTalks.length);
      console.log('🔍 박스로 톡 소스별 분류:', otherBoxroTalks.reduce((acc, talk) => {
        const source = talk.sourceCollection || 'unknown';
        acc[source] = (acc[source] || 0) + 1;
        return acc;
      }, {}));
      
      // 3. 두 컬렉션의 박스로 톡 합치기
      const allStoreBoxroTalks = [...storeBoxroTalks, ...storeBoxroTalksFromStore];
      console.log('🔍 총 스토어 박스로 톡:', allStoreBoxroTalks.length);
      console.log('🔍 전체 데이터:', allStoreBoxroTalks);

      // 삭제되지 않은 스토어 박스로 톡만 필터링 + 고아 박스로톡 제외
      const deletedFilteredStoreBoxroTalks = allStoreBoxroTalks.filter((boxroTalk: any) => 
        boxroTalk.isDeleted !== true && boxroTalk.deletedAt === undefined
      );
      const activeStoreBoxroTalks = await filterOrphanedBoxroTalks(deletedFilteredStoreBoxroTalks, 'store');
      
      activeStoreBoxroTalks.forEach((boxroTalk: any) => {
        const email = boxroTalk.authorEmail || 'unknown';
        if (!userStatsMap.has(email)) {
          userStatsMap.set(email, {
            email,
            displayName: getDisplayName(boxroTalk.author || '', boxroTalk.authorNickname || '', email),
            authorNickname: getDisplayName(boxroTalk.author || '', boxroTalk.authorNickname || '', email),
            photoURL: '',
            createdAt: boxroTalk.createdAt || '',
            lastSignIn: '',
            designsCount: 0,
            boxroTalksCount: 0,
            likesCount: 0,
            downloadsCount: 0,
            sharesCount: 0,
            viewsCount: 0,
            storeRedirectsCount: 0,
            uid: boxroTalk.authorId || ''
          });
        }
        
        const userStat = userStatsMap.get(email)!;
        userStat.boxroTalksCount++;
      });

      // 스토어 통계 계산
      const storeViews = storeItems.reduce((sum, storeItem: any) => sum + (storeItem.views || 0), 0);
      const storeRedirects = storeItems.reduce((sum, storeItem: any) => sum + (storeItem.storeRedirects || 0), 0);
      
      // 스토어 바로가기 사용자별 카운트 (여러 번 바로가기해도 매번 카운트)
      storeItems.forEach((storeItem: any) => {
        const redirectedBy = storeItem.storeRedirectedBy || [];
        redirectedBy.forEach((uid: string) => {
          if (uid === 'anonymous') return;
          
          // uid로 사용자 찾기
          for (const [email, userStat] of userStatsMap.entries()) {
            if (userStat.uid === uid) {
              userStat.storeRedirectsCount += storeItem.storeRedirects || 0; // 전체 바로가기 수 사용
              break;
            }
          }
        });
      });
      
      // 스토어 박스로 톡 계산 (모든 소스에서)
      // 스토어 통계 계산 (모든 소스에서 + 스토리 컬렉션의 스토어 관련 박스로 톡 포함)
      const storeRelatedTalksFromStory = storyBoxroTalks.filter(talk => 
        talk.storeId || talk.storeItemId || talk.type === 'store' || 
        (talk.text && talk.text.includes('스토어')) ||
        (talk.articleId && talk.articleId.includes('store'))
      );
      
      // 스토리에서 스토어 관련 박스로톡도 고아 필터링 적용
      const deletedFilteredStoreRelatedTalks = storeRelatedTalksFromStory.filter(talk => 
        talk.isDeleted !== true && talk.deletedAt === undefined
      );
      const validStoreRelatedTalks = await filterOrphanedBoxroTalks(deletedFilteredStoreRelatedTalks, 'story');
      
      const storeBoxroTalksCount = activeStoreBoxroTalks.length + validStoreRelatedTalks.length;
      
      // 디버깅: 스토어 박스로 톡 통계 확인
      console.log('🔍 스토어 박스로 톡 통계:');
      console.log('  - storeBoxroTalks 컬렉션:', storeBoxroTalks.length);
      console.log('  - store 컬렉션:', storeBoxroTalksFromStore.length);
      console.log('  - 스토리 컬렉션의 스토어 관련:', storeRelatedTalksFromStory.length);
      console.log('  - 총합:', storeBoxroTalksCount);
      
      const storeLikes = storeItems.reduce((sum, storeItem: any) => sum + (storeItem.likes || 0), 0);
      const storeShares = storeItems.reduce((sum, storeItem: any) => sum + (storeItem.shares || 0), 0);
      

      // 사용자가 한 좋아요/다운로드/공유/조회 활동 계산
      // 갤러리 작품에서 사용자 활동 추적
      designs.forEach((design: any) => {
        const likedBy = design.likedBy || [];
        const downloadedBy = design.downloadedBy || [];
        const sharedBy = design.sharedBy || [];
        const viewedBy = design.viewedBy || [];
        
        // 각 사용자별로 활동 카운트
        likedBy.forEach((userId: string) => {
          const user = users.find(u => u.uid === userId);
          if (user) {
            const email = user.email || 'unknown';
            if (!userStatsMap.has(email)) {
              userStatsMap.set(email, {
                email,
                displayName: (user.displayName && !user.displayName.includes('@')) ? user.displayName : (user.email ? user.email.split('@')[0] : '익명'),
                authorNickname: (user.authorNickname && !user.authorNickname.includes('@')) ? user.authorNickname : (user.displayName && !user.displayName.includes('@')) ? user.displayName : (user.email ? user.email.split('@')[0] : '익명'),
                photoURL: user.photoURL || '',
                createdAt: user.createdAt || '',
                lastSignIn: user.lastSignIn || '',
                designsCount: 0,
                boxroTalksCount: 0,
                likesCount: 0,
                downloadsCount: 0,
                sharesCount: 0,
                viewsCount: 0,
                storeRedirectsCount: 0,
                uid: user.uid || ''
              });
            }
            const userStat = userStatsMap.get(email)!;
            userStat.likesCount++;
          }
        });
        
        downloadedBy.forEach((userId: string) => {
          const user = users.find(u => u.uid === userId);
          if (user) {
            const email = user.email || 'unknown';
            if (!userStatsMap.has(email)) {
              userStatsMap.set(email, {
                email,
                displayName: (user.displayName && !user.displayName.includes('@')) ? user.displayName : (user.email ? user.email.split('@')[0] : '익명'),
                authorNickname: (user.authorNickname && !user.authorNickname.includes('@')) ? user.authorNickname : (user.displayName && !user.displayName.includes('@')) ? user.displayName : (user.email ? user.email.split('@')[0] : '익명'),
                photoURL: user.photoURL || '',
                createdAt: user.createdAt || '',
                lastSignIn: user.lastSignIn || '',
                designsCount: 0,
                boxroTalksCount: 0,
                likesCount: 0,
                downloadsCount: 0,
                sharesCount: 0,
                viewsCount: 0,
                storeRedirectsCount: 0,
                uid: user.uid || ''
              });
            }
            const userStat = userStatsMap.get(email)!;
            userStat.downloadsCount++;
          }
        });
        
        // 공유는 여러 번 공유해도 매번 카운트 (shares 필드 사용)
        const totalShares = design.shares || 0;
        if (totalShares > 0) {
          // sharedBy 배열의 사용자들에게 공유 수만큼 카운트
          sharedBy.forEach((userId: string) => {
            const user = users.find(u => u.uid === userId);
            if (user) {
              const email = user.email || 'unknown';
              if (!userStatsMap.has(email)) {
                userStatsMap.set(email, {
                  email,
                  displayName: user.displayName || '익명',
                  photoURL: user.photoURL || '',
                  createdAt: user.createdAt || '',
                  lastSignIn: user.lastSignIn || '',
                  designsCount: 0,
                  boxroTalksCount: 0,
                  likesCount: 0,
                  downloadsCount: 0,
                  sharesCount: 0,
                  viewsCount: 0,
                  storeRedirectsCount: 0,
                  uid: user.uid || ''
                });
              }
              const userStat = userStatsMap.get(email)!;
              userStat.sharesCount += totalShares; // 전체 공유 수 사용
            }
          });
        }

        viewedBy.forEach((userId: string) => {
          const user = users.find(u => u.uid === userId);
          if (user) {
            const email = user.email || 'unknown';
            if (!userStatsMap.has(email)) {
              userStatsMap.set(email, {
                email,
                displayName: (user.displayName && !user.displayName.includes('@')) ? user.displayName : (user.email ? user.email.split('@')[0] : '익명'),
                authorNickname: (user.authorNickname && !user.authorNickname.includes('@')) ? user.authorNickname : (user.displayName && !user.displayName.includes('@')) ? user.displayName : (user.email ? user.email.split('@')[0] : '익명'),
                photoURL: user.photoURL || '',
                createdAt: user.createdAt || '',
                lastSignIn: user.lastSignIn || '',
                designsCount: 0,
                boxroTalksCount: 0,
                likesCount: 0,
                downloadsCount: 0,
                sharesCount: 0,
                viewsCount: 0,
                storeRedirectsCount: 0,
                uid: user.uid || ''
              });
            }
            const userStat = userStatsMap.get(email)!;
            userStat.viewsCount += design.views || 0; // 전체 조회 수 사용
          }
        });
      });

      // 스토리에서 사용자 활동 추적
      stories.forEach((story: any) => {
        const likedBy = story.likedBy || [];
        const sharedBy = story.sharedBy || [];
        const viewedBy = story.viewedBy || [];
        
        // 각 사용자별로 활동 카운트
        likedBy.forEach((userId: string) => {
          const user = users.find(u => u.uid === userId);
          if (user) {
            const email = user.email || 'unknown';
            if (!userStatsMap.has(email)) {
              userStatsMap.set(email, {
                email,
                displayName: (user.displayName && !user.displayName.includes('@')) ? user.displayName : (user.email ? user.email.split('@')[0] : '익명'),
                authorNickname: (user.authorNickname && !user.authorNickname.includes('@')) ? user.authorNickname : (user.displayName && !user.displayName.includes('@')) ? user.displayName : (user.email ? user.email.split('@')[0] : '익명'),
                photoURL: user.photoURL || '',
                createdAt: user.createdAt || '',
                lastSignIn: user.lastSignIn || '',
                designsCount: 0,
                boxroTalksCount: 0,
                likesCount: 0,
                downloadsCount: 0,
                sharesCount: 0,
                viewsCount: 0,
                storeRedirectsCount: 0,
                uid: user.uid || ''
              });
            }
            const userStat = userStatsMap.get(email)!;
            userStat.likesCount++;
          }
        });
        
        // 공유는 여러 번 공유해도 매번 카운트 (shares 필드 사용)
        const totalShares = story.shares || 0;
        if (totalShares > 0) {
          // sharedBy 배열의 사용자들에게 공유 수만큼 카운트
          sharedBy.forEach((userId: string) => {
            const user = users.find(u => u.uid === userId);
            if (user) {
              const email = user.email || 'unknown';
              if (!userStatsMap.has(email)) {
                userStatsMap.set(email, {
                  email,
                  displayName: user.displayName || '익명',
                  photoURL: user.photoURL || '',
                  createdAt: user.createdAt || '',
                  lastSignIn: user.lastSignIn || '',
                  designsCount: 0,
                  boxroTalksCount: 0,
                  likesCount: 0,
                  downloadsCount: 0,
                  sharesCount: 0,
                  viewsCount: 0,
                  storeRedirectsCount: 0,
                  uid: user.uid || ''
                });
              }
              const userStat = userStatsMap.get(email)!;
              userStat.sharesCount += totalShares; // 전체 공유 수 사용
            }
          });
        }

        viewedBy.forEach((userId: string) => {
          const user = users.find(u => u.uid === userId);
          if (user) {
            const email = user.email || 'unknown';
            if (!userStatsMap.has(email)) {
              userStatsMap.set(email, {
                email,
                displayName: (user.displayName && !user.displayName.includes('@')) ? user.displayName : (user.email ? user.email.split('@')[0] : '익명'),
                authorNickname: (user.authorNickname && !user.authorNickname.includes('@')) ? user.authorNickname : (user.displayName && !user.displayName.includes('@')) ? user.displayName : (user.email ? user.email.split('@')[0] : '익명'),
                photoURL: user.photoURL || '',
                createdAt: user.createdAt || '',
                lastSignIn: user.lastSignIn || '',
                designsCount: 0,
                boxroTalksCount: 0,
                likesCount: 0,
                downloadsCount: 0,
                sharesCount: 0,
                viewsCount: 0,
                storeRedirectsCount: 0,
                uid: user.uid || ''
              });
            }
            const userStat = userStatsMap.get(email)!;
            userStat.viewsCount += story.views || 0; // 전체 조회 수 사용
          }
        });
      });

      // 스토어 아이템에서 사용자 활동 추적
      storeItems.forEach((storeItem: any) => {
        const likedBy = storeItem.likedBy || [];
        const sharedBy = storeItem.sharedBy || [];
        const viewedBy = storeItem.viewedBy || [];
        
        // 각 사용자별로 활동 카운트
        likedBy.forEach((userId: string) => {
          const user = users.find(u => u.uid === userId);
          if (user) {
            const email = user.email || 'unknown';
            if (!userStatsMap.has(email)) {
              userStatsMap.set(email, {
                email,
                displayName: (user.displayName && !user.displayName.includes('@')) ? user.displayName : (user.email ? user.email.split('@')[0] : '익명'),
                authorNickname: (user.authorNickname && !user.authorNickname.includes('@')) ? user.authorNickname : (user.displayName && !user.displayName.includes('@')) ? user.displayName : (user.email ? user.email.split('@')[0] : '익명'),
                photoURL: user.photoURL || '',
                createdAt: user.createdAt || '',
                lastSignIn: user.lastSignIn || '',
                designsCount: 0,
                boxroTalksCount: 0,
                likesCount: 0,
                downloadsCount: 0,
                sharesCount: 0,
                viewsCount: 0,
                storeRedirectsCount: 0,
                uid: user.uid || ''
              });
            }
            const userStat = userStatsMap.get(email)!;
            userStat.likesCount++;
          }
        });
        
        // 공유는 여러 번 공유해도 매번 카운트 (shares 필드 사용)
        const totalShares = storeItem.shares || 0;
        if (totalShares > 0) {
          // sharedBy 배열의 사용자들에게 공유 수만큼 카운트
          sharedBy.forEach((userId: string) => {
            const user = users.find(u => u.uid === userId);
            if (user) {
              const email = user.email || 'unknown';
              if (!userStatsMap.has(email)) {
                userStatsMap.set(email, {
                  email,
                  displayName: user.displayName || '익명',
                  photoURL: user.photoURL || '',
                  createdAt: user.createdAt || '',
                  lastSignIn: user.lastSignIn || '',
                  designsCount: 0,
                  boxroTalksCount: 0,
                  likesCount: 0,
                  downloadsCount: 0,
                  sharesCount: 0,
                  viewsCount: 0,
                  storeRedirectsCount: 0,
                  uid: user.uid || ''
                });
              }
              const userStat = userStatsMap.get(email)!;
              userStat.sharesCount += totalShares; // 전체 공유 수 사용
            }
          });
        }

        viewedBy.forEach((userId: string) => {
          const user = users.find(u => u.uid === userId);
          if (user) {
            const email = user.email || 'unknown';
            if (!userStatsMap.has(email)) {
              userStatsMap.set(email, {
                email,
                displayName: (user.displayName && !user.displayName.includes('@')) ? user.displayName : (user.email ? user.email.split('@')[0] : '익명'),
                authorNickname: (user.authorNickname && !user.authorNickname.includes('@')) ? user.authorNickname : (user.displayName && !user.displayName.includes('@')) ? user.displayName : (user.email ? user.email.split('@')[0] : '익명'),
                photoURL: user.photoURL || '',
                createdAt: user.createdAt || '',
                lastSignIn: user.lastSignIn || '',
                designsCount: 0,
                boxroTalksCount: 0,
                likesCount: 0,
                downloadsCount: 0,
                sharesCount: 0,
                viewsCount: 0,
                storeRedirectsCount: 0,
                uid: user.uid || ''
              });
            }
            const userStat = userStatsMap.get(email)!;
            userStat.viewsCount += storeItem.views || 0; // 전체 조회 수 사용
          }
        });
      });

      // Firestore에서 가져온 사용자 정보로 업데이트
      users.forEach((userData: any) => {
        const email = userData.email || 'unknown';
        const existingStats = userStatsMap.get(email);
        
        if (existingStats) {
          // 기존 통계에 프로필 정보 업데이트
          existingStats.displayName = userData.displayName || userData.email || '';
          existingStats.authorNickname = userData.authorNickname || '';
          existingStats.photoURL = userData.photoURL || '';
          existingStats.createdAt = userData.createdAt || '';
          existingStats.lastSignIn = userData.lastSignIn || '';
          existingStats.uid = userData.uid || '';
          
          // 디버깅: photoURL 확인
          console.log('사용자 프로필 데이터:', {
            email: userData.email,
            displayName: userData.displayName,
            photoURL: userData.photoURL,
            hasPhotoURL: !!userData.photoURL
          });
        } else {
          // 새로운 사용자 추가 (활동이 없는 사용자)
          userStatsMap.set(email, {
            email: email,
            displayName: userData.displayName || userData.email || '',
            authorNickname: userData.authorNickname || '',
            photoURL: userData.photoURL || '',
            createdAt: userData.createdAt || '',
            lastSignIn: userData.lastSignIn || '',
            designsCount: 0,
            boxroTalksCount: 0,
            likesCount: 0,
            downloadsCount: 0,
            sharesCount: 0,
            viewsCount: 0,
            storeRedirectsCount: 0,
            uid: userData.uid || ''
          });
        }
      });

      // PWA 설치 정보 업데이트
      for (const [email, userStat] of userStatsMap.entries()) {
        // User Agent 기반으로 PWA 설치 정보 매칭 (임시 방법)
        for (const [tempKey, pwaInfo] of pwaInstallMap.entries()) {
          // 실제로는 더 정확한 사용자 식별이 필요하지만, 
          // 현재는 User Agent의 일부를 기반으로 추정
          if (pwaInfo.installed) {
            userStat.pwaInstalled = true;
            userStat.pwaInstallDate = pwaInfo.installDate;
            break; // 첫 번째 매칭되는 PWA 설치 정보만 사용
          }
        }
      }

      const finalUserStats = Array.from(userStatsMap.values());
      setUserStats(finalUserStats);
      setFilteredUserStats(finalUserStats);

      // 전체 통계 계산 (갤러리 + 스토리 통합)
      const activeUsers = finalUserStats.filter(user => user.designsCount > 0 || user.boxroTalksCount > 0).length;
      const inactiveUsers = finalUserStats.length - activeUsers;
      
      // 갤러리 통계
      const galleryViews = designs.reduce((sum, design: any) => sum + (design.views || 0), 0);
      const galleryBoxroTalks = activeGalleryBoxroTalks.length;
      const galleryLikes = designs.reduce((sum, design: any) => sum + (design.likes || 0), 0);
      const galleryShares = designs.reduce((sum, design: any) => sum + (design.shares || 0), 0);
      const galleryDownloads = designs.reduce((sum, design: any) => sum + (design.downloads || 0), 0);
      
      // 스토리 통계 (스토어 관련 박스로 톡 제외)
      const storyViews = stories.reduce((sum, story: any) => sum + (story.views || 0), 0);
      
      // 스토어 관련 박스로 톡을 제외한 순수 스토리 박스로 톡만 계산 (삭제되지 않은 것만 + 고아 박스로톡 제외)
      const deletedFilteredPureStoryBoxroTalks = storyBoxroTalks.filter(talk => 
        !talk.storeId && !talk.storeItemId && talk.type !== 'store' && 
        !(talk.text && talk.text.includes('스토어')) &&
        !(talk.articleId && talk.articleId.includes('store')) &&
        talk.isDeleted !== true && talk.deletedAt === undefined
      );
      const filteredStoryBoxroTalks = await filterOrphanedBoxroTalks(deletedFilteredPureStoryBoxroTalks, 'story');
      const storyBoxroTalksCount = filteredStoryBoxroTalks.length;
      
      const storyLikes = stories.reduce((sum, story: any) => sum + (story.likes || 0), 0);
      const storyShares = stories.reduce((sum, story: any) => sum + (story.shares || 0), 0);
      
      // 도안 다운로드 통계 가져오기
      const blueprintDownloadsQuery = query(collection(db, 'blueprintDownloads'));
      const blueprintDownloadsSnapshot = await getDocs(blueprintDownloadsQuery);
      const blueprintDownloads = blueprintDownloadsSnapshot.size;
      
      // 도안 다운로드에서 사용자 활동 추적
      blueprintDownloadsSnapshot.docs.forEach((doc) => {
        const downloadData = doc.data();
        const userId = downloadData.userId;
        const user = users.find(u => u.uid === userId);
        if (user) {
          const email = user.email || 'unknown';
          if (!userStatsMap.has(email)) {
            userStatsMap.set(email, {
              email,
              displayName: user.displayName || '익명',
              photoURL: user.photoURL || '',
              createdAt: user.createdAt || '',
              lastSignIn: user.lastSignIn || '',
              designsCount: 0,
              boxroTalksCount: 0,
              likesCount: 0,
              downloadsCount: 0,
              sharesCount: 0,
              viewsCount: 0,
              uid: user.uid || ''
            });
          }
          const userStat = userStatsMap.get(email)!;
          userStat.downloadsCount++;
        }
      });
      
      // 전체 통합 통계 (삭제되지 않은 박스로 톡만)
      const totalBoxroTalks = activeGalleryBoxroTalks.length + storyBoxroTalksCount + storeBoxroTalksCount;
      
      
      
      const totalStats = {
        totalUsers: userStatsMap.size,
        totalDesigns: designs.length,
        totalBoxroTalks: totalBoxroTalks, // 갤러리 + 스토리 + 스토어 박스로 톡
        totalLikes: galleryLikes + storyLikes + storeLikes, // 갤러리 + 스토리 + 스토어 좋아요
        totalDownloads: galleryDownloads + blueprintDownloads, // 갤러리 + 도안 다운로드
        totalShares: galleryShares + storyShares + storeShares, // 갤러리 + 스토리 + 스토어 공유
        totalViews: galleryViews + storyViews + storeViews, // 갤러리 + 스토리 + 스토어 조회
        activeUsers: activeUsers,
        inactiveUsers: inactiveUsers,
        totalStories: stories.length,
        totalStoreItems: storeItems.length,
        galleryViews: galleryViews,
        galleryBoxroTalks: galleryBoxroTalks,
        galleryLikes: galleryLikes,
        galleryShares: galleryShares,
        galleryDownloads: galleryDownloads,
        storyViews: storyViews,
        storyBoxroTalks: storyBoxroTalksCount,
        storyLikes: storyLikes,
        storyShares: storyShares,
        storeViews: storeViews,
        storeRedirects: storeRedirects,
        storeBoxroTalks: storeBoxroTalksCount,
        storeLikes: storeLikes,
        storeShares: storeShares,
        blueprintDownloads: blueprintDownloads,
        firebaseConnected: connectionStatus.firebaseConnected,
        dbConnected: connectionStatus.dbConnected,
        storageConnected: connectionStatus.storageConnected,
        totalCommits: await getTotalCommits(),
        lastDeploy: await getLastDeployTime(),
        lastBuild: await getLastBuildTime(),
        todayActiveUsers: await getTodayActiveUsers(),
        recent24hActivity: await getRecent24hActivity(),
        peakTime: await getPeakTime()
      };

      setAdminStats(totalStats);

    } catch (error: unknown) {
      console.error('관리자 데이터 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <CommonBackground>
        <CommonHeader />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-lg font-semibold text-white mb-2">로그인이 필요합니다</h1>
            <p className="text-sm text-white/80">관리자 화면에 접근하려면 로그인해주세요.</p>
          </div>
        </div>
      </CommonBackground>
    );
  }

  if (!isAdminUser) {
    return (
      <CommonBackground>
        <CommonHeader />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white mb-4">접근 권한이 없습니다</h1>
            <p className="text-white">관리자만 접근할 수 있는 페이지입니다.</p>
          </div>
        </div>
      </CommonBackground>
    );
  }

  if (loading) {
    return (
      <CommonBackground>
        <CommonHeader />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
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
              관리자 데이터를 불러오는 중...
            </h3>
            <p className="text-sm text-white/80">관리자 정보를 준비하고 있어요!</p>
          </div>
        </div>
      </CommonBackground>
    );
  }

  return (
    <CommonBackground>
      <CommonHeader />
      <div className="max-w-7xl mx-auto px-0 md:px-8">
        <div className="mb-6 mt-10 px-4 md:px-0">
        <PageHeader 
          title="관리자 대시보드" 
          description="시스템 통계 및 사용자 관리"
         />
        </div>

        {/* 탭 메뉴 */}
        <div className="flex justify-between items-center mb-8 px-4 md:px-0">
          <div className="flex gap-4 overflow-x-auto scrollbar-hide min-w-0 pb-1">
            <button
              onClick={() => setActiveTab('overall-stats')}
              className={`relative px-0 py-2 text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
                activeTab === 'overall-stats' 
                  ? 'text-white' 
                  : 'text-white/50 hover:text-white/80'
              }`}
            >
              대시보드
              {activeTab === 'overall-stats' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white rounded-full"></div>
              )}
            </button>
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`relative px-0 py-2 text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
                activeTab === 'dashboard' 
                  ? 'text-white' 
                  : 'text-white/50 hover:text-white/80'
              }`}
            >
              회원 통계
              {activeTab === 'dashboard' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white rounded-full"></div>
              )}
            </button>
            <button
              onClick={() => setActiveTab('home-cards')}
              className={`relative px-0 py-2 text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
                activeTab === 'home-cards' 
                  ? 'text-white' 
                  : 'text-white/50 hover:text-white/80'
              }`}
            >
              홈카드 노출순서
              {activeTab === 'home-cards' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white rounded-full"></div>
              )}
            </button>
            <button
              onClick={() => setActiveTab('home-card-management')}
              className={`relative px-0 py-2 text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
                activeTab === 'home-card-management' 
                  ? 'text-white' 
                  : 'text-white/50 hover:text-white/80'
              }`}
            >
              홈카드 관리
              {activeTab === 'home-card-management' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white rounded-full"></div>
              )}
            </button>
            <button
              onClick={() => setActiveTab('popularity-management')}
              className={`relative px-0 py-2 text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
                activeTab === 'popularity-management' 
                  ? 'text-white' 
                  : 'text-white/50 hover:text-white/80'
              }`}
            >
              인기도 관리
              {activeTab === 'popularity-management' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white rounded-full"></div>
              )}
            </button>
            <button
              onClick={() => setActiveTab('banner-management')}
              className={`relative px-0 py-2 text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
                activeTab === 'banner-management' 
                  ? 'text-white' 
                  : 'text-white/50 hover:text-white/80'
              }`}
            >
              배너 관리
              {activeTab === 'banner-management' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white rounded-full"></div>
              )}
            </button>
            <button
              onClick={() => setActiveTab('terms-management')}
              className={`relative px-0 py-2 text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
                activeTab === 'terms-management' 
                  ? 'text-white' 
                  : 'text-white/50 hover:text-white/80'
              }`}
            >
              이용약관 관리
              {activeTab === 'terms-management' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white rounded-full"></div>
              )}
            </button>
          </div>
          
          {/* 홈 카드 노출 순서 탭 버튼들 */}
          {activeTab === 'home-cards' && (
            <div className="hidden lg:flex gap-2">
              <Button 
                onClick={saveOrder} 
                disabled={saving}
                className="bg-sky-500 hover:bg-sky-600 text-white rounded-full text-sm px-3 py-1 whitespace-nowrap"
              >
                {saving ? '저장 중...' : '노출 순서 저장'}
              </Button>
              <Button 
                onClick={resetOrder}
                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full text-sm px-3 py-1"
              >
                순서 초기화 ({sortAscending ? '오름차순' : '내림차순'})
              </Button>
              <Button 
                onClick={fetchHomeCards}
                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full text-sm px-3 py-1"
              >
                순서 불러오기 (현재 홈 카드)
              </Button>
            </div>
          )}

        </div>

        {/* 모바일 전용 홈 카드 버튼들 */}
        {activeTab === 'home-cards' && (
          <div className="flex flex-col gap-2 px-4 lg:hidden mb-4">
            <Button 
              onClick={saveOrder} 
              disabled={saving}
              className="bg-sky-500 hover:bg-sky-600 text-white rounded-full text-sm px-3 py-1 w-full whitespace-nowrap"
            >
              {saving ? '저장 중...' : '노출 순서 저장'}
            </Button>
            <Button 
              onClick={resetOrder}
              className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full text-sm px-3 py-1 w-full"
            >
              순서 초기화 ({sortAscending ? '오름차순' : '내림차순'})
            </Button>
            <Button 
              onClick={fetchHomeCards}
              className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full text-sm px-3 py-1 w-full"
            >
              순서 불러오기 (현재 홈 카드)
            </Button>
        </div>
        )}


        {/* 탭 내용 */}
        {activeTab === 'dashboard' && (
          <>

        {/* 회원 리스트 */}
        <div className="bg-white/95 backdrop-blur-sm border border-white/20 rounded-lg p-6 mb-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">
              회원 통계
            </h3>
          </div>
          

        {/* 검색 및 필터 */}
        <div className="flex flex-col lg:flex-row gap-3 mb-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="이메일 또는 이름으로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-6 py-2 rounded-md bg-white text-[14px] border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-3 min-w-0">
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 rounded-md bg-white text-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-0 flex-1 sm:flex-none"
            >
              <option value="">전체 회원</option>
              <option value="active">활성 회원</option>
              <option value="inactive">비활성 회원</option>
            </select>
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 rounded-md bg-white text-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-0 flex-1 sm:flex-none"
            >
              <option value="recent">최근 가입순</option>
              <option value="oldest">오래된 가입순</option>
              <option value="name">이름순</option>
              <option value="email">이메일순</option>
            </select>
            <select
              value={userStatsPageSize}
              onChange={(e) => handleUserStatsPageSizeChange(Number(e.target.value))}
              className="px-3 py-2 rounded-md bg-white text-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-0 flex-1 sm:flex-none"
            >
              <option value={20}>20개</option>
              <option value={30}>30개</option>
              <option value={50}>50개</option>
              <option value={100}>100개</option>
            </select>
          </div>
        </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px]">
                <thead>
                  <tr className="border-b-2 border-gray-300">
                    <th className="text-left py-3 px-1 text-[13px] font-medium text-gray-800 w-40">
                      <button
                        onClick={() => {
                          if (tableSortField === 'email') {
                            setTableSortDirection(tableSortDirection === 'asc' ? 'desc' : 'asc');
                          } else {
                            setTableSortField('email');
                            setTableSortDirection('asc');
                          }
                        }}
                        className="flex items-center gap-1 hover:text-blue-600 transition-colors"
                      >
                        이메일
                        {tableSortField === 'email' && (
                          tableSortDirection === 'desc' ? <ArrowDown className="w-2.5 h-2.5" /> : <ArrowUp className="w-2.5 h-2.5" />
                        )}
                      </button>
                    </th>
                    <th className="text-left py-3 px-1 text-[13px] font-medium text-gray-800 w-40">
                      <button
                        onClick={() => {
                          if (tableSortField === 'displayName') {
                            setTableSortDirection(tableSortDirection === 'asc' ? 'desc' : 'asc');
                          } else {
                            setTableSortField('displayName');
                            setTableSortDirection('asc');
                          }
                        }}
                        className="flex items-center gap-1 hover:text-blue-600 transition-colors"
                      >
                        이름
                        {tableSortField === 'displayName' && (
                          tableSortDirection === 'desc' ? <ArrowDown className="w-2.5 h-2.5" /> : <ArrowUp className="w-2.5 h-2.5" />
                        )}
                      </button>
                    </th>
                    <th className="text-center py-3 px-1 text-[13px] font-medium text-gray-800 w-24">
                      <button
                        onClick={() => {
                          if (tableSortField === 'createdAt') {
                            setTableSortDirection(tableSortDirection === 'asc' ? 'desc' : 'asc');
                          } else {
                            setTableSortField('createdAt');
                            setTableSortDirection('desc');
                          }
                        }}
                        className="flex items-center justify-center gap-0.5 hover:text-blue-600 transition-colors w-full"
                      >
                        가입일
                        {tableSortField === 'createdAt' && (
                          tableSortDirection === 'desc' ? <ArrowDown className="w-2.5 h-2.5" /> : <ArrowUp className="w-2.5 h-2.5" />
                        )}
                      </button>
                    </th>
                    <th className="text-center py-3 px-1 text-[13px] font-medium text-gray-800 w-24">
                      <button
                        onClick={() => {
                          if (tableSortField === 'lastSignIn') {
                            setTableSortDirection(tableSortDirection === 'asc' ? 'desc' : 'asc');
                          } else {
                            setTableSortField('lastSignIn');
                            setTableSortDirection('desc');
                          }
                        }}
                        className="flex items-center justify-center gap-0.5 hover:text-blue-600 transition-colors w-full"
                      >
                        최근 로그인
                        {tableSortField === 'lastSignIn' && (
                          tableSortDirection === 'desc' ? <ArrowDown className="w-2.5 h-2.5" /> : <ArrowUp className="w-2.5 h-2.5" />
                        )}
                      </button>
                    </th>
                    <th className="text-center py-3 px-1 text-[13px] font-medium text-gray-800 w-[58px]">
                      <button
                        onClick={() => {
                          if (tableSortField === 'designsCount') {
                            setTableSortDirection(tableSortDirection === 'asc' ? 'desc' : 'asc');
                          } else {
                            setTableSortField('designsCount');
                            setTableSortDirection('desc');
                          }
                        }}
                        className="flex items-center justify-center gap-0.5 hover:text-blue-600 transition-colors w-full"
                      >
                        작품
                        {tableSortField === 'designsCount' && (
                          tableSortDirection === 'desc' ? <ArrowDown className="w-2.5 h-2.5" /> : <ArrowUp className="w-2.5 h-2.5" />
                        )}
                      </button>
                    </th>
                    <th className="text-center py-3 px-1 text-[13px] font-medium text-gray-800 w-[58px]">
                      <button
                        onClick={() => {
                          if (tableSortField === 'likesCount') {
                            setTableSortDirection(tableSortDirection === 'asc' ? 'desc' : 'asc');
                          } else {
                            setTableSortField('likesCount');
                            setTableSortDirection('desc');
                          }
                        }}
                        className="flex items-center justify-center gap-0.5 hover:text-blue-600 transition-colors w-full"
                      >
                        좋아요
                        {tableSortField === 'likesCount' && (
                          tableSortDirection === 'desc' ? <ArrowDown className="w-2.5 h-2.5" /> : <ArrowUp className="w-2.5 h-2.5" />
                        )}
                      </button>
                    </th>
                    <th className="text-center py-3 px-1 text-[13px] font-medium text-gray-800 w-[58px]">
                      <button
                        onClick={() => {
                          if (tableSortField === 'sharesCount') {
                            setTableSortDirection(tableSortDirection === 'asc' ? 'desc' : 'asc');
                          } else {
                            setTableSortField('sharesCount');
                            setTableSortDirection('desc');
                          }
                        }}
                        className="flex items-center justify-center gap-0.5 hover:text-blue-600 transition-colors w-full"
                      >
                        공유
                        {tableSortField === 'sharesCount' && (
                          tableSortDirection === 'desc' ? <ArrowDown className="w-2.5 h-2.5" /> : <ArrowUp className="w-2.5 h-2.5" />
                        )}
                      </button>
                    </th>
                    <th className="text-center py-3 px-1 text-[13px] font-medium text-gray-800 w-[58px]">
                      <button
                        onClick={() => {
                          if (tableSortField === 'boxroTalksCount') {
                            setTableSortDirection(tableSortDirection === 'asc' ? 'desc' : 'asc');
                          } else {
                            setTableSortField('boxroTalksCount');
                            setTableSortDirection('desc');
                          }
                        }}
                        className="flex items-center justify-center gap-0.5 hover:text-blue-600 transition-colors w-full"
                      >
                        톡
                        {tableSortField === 'boxroTalksCount' && (
                          tableSortDirection === 'desc' ? <ArrowDown className="w-2.5 h-2.5" /> : <ArrowUp className="w-2.5 h-2.5" />
                        )}
                      </button>
                    </th>
                    <th className="text-center py-3 px-1 text-[13px] font-medium text-gray-800 w-[58px]">
                      <button
                        onClick={() => {
                          if (tableSortField === 'downloadsCount') {
                            setTableSortDirection(tableSortDirection === 'asc' ? 'desc' : 'asc');
                          } else {
                            setTableSortField('downloadsCount');
                            setTableSortDirection('desc');
                          }
                        }}
                        className="flex items-center justify-center gap-0.5 hover:text-blue-600 transition-colors w-full"
                      >
                        다운로드
                        {tableSortField === 'downloadsCount' && (
                          tableSortDirection === 'desc' ? <ArrowDown className="w-2.5 h-2.5" /> : <ArrowUp className="w-2.5 h-2.5" />
                        )}
                      </button>
                    </th>
                    <th className="text-center py-3 px-1 text-[13px] font-medium text-gray-800 w-[58px]">
                      <button
                        onClick={() => {
                          if (tableSortField === 'viewsCount') {
                            setTableSortDirection(tableSortDirection === 'asc' ? 'desc' : 'asc');
                          } else {
                            setTableSortField('viewsCount');
                            setTableSortDirection('desc');
                          }
                        }}
                        className="flex items-center justify-center gap-0.5 hover:text-blue-600 transition-colors w-full"
                      >
                        조회
                        {tableSortField === 'viewsCount' && (
                          tableSortDirection === 'desc' ? <ArrowDown className="w-2.5 h-2.5" /> : <ArrowUp className="w-2.5 h-2.5" />
                        )}
                      </button>
                    </th>
                    <th className="text-center py-3 px-1 text-[13px] font-medium text-gray-800 w-[58px]">
                      <button
                        onClick={() => {
                          if (tableSortField === 'storeRedirectsCount') {
                            setTableSortDirection(tableSortDirection === 'asc' ? 'desc' : 'asc');
                          } else {
                            setTableSortField('storeRedirectsCount');
                            setTableSortDirection('desc');
                          }
                        }}
                        className="flex items-center justify-center gap-0.5 hover:text-blue-600 transition-colors w-full"
                      >
                        스토어
                        {tableSortField === 'storeRedirectsCount' && (
                          tableSortDirection === 'desc' ? <ArrowDown className="w-2.5 h-2.5" /> : <ArrowUp className="w-2.5 h-2.5" />
                        )}
                      </button>
                    </th>
                    <th className="text-center py-3 px-1 text-[13px] font-medium text-gray-800 w-24">
                      PWA
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {getUserStatsPageData().map((user, index) => (
                    <React.Fragment key={index}>
                      <tr 
                        className="border-b border-gray-200 hover:bg-gray-50 cursor-pointer"
                        onClick={() => handleUserClick(user.email)}
                      >
                        <td className="py-3 px-2 font-medium text-[13px] text-gray-800 w-40">{user.email}</td>
                      <td className="py-3 px-1 flex items-center gap-3 w-40">
                        {user.photoURL ? (
                          <img 
                            src={user.photoURL.startsWith('data:image/') ? user.photoURL : `https://images.weserv.nl/?url=${encodeURIComponent(user.photoURL)}&w=32&h=32&fit=cover&output=webp`}
                            alt={user.displayName}
                            className="w-8 h-8 rounded-full object-cover"
                            onLoad={() => console.log('✅ 관리자 페이지 프로필 이미지 로드 성공:', user.photoURL)}
                            onError={(e) => console.error('❌ 관리자 페이지 프로필 이미지 로드 실패:', e, user.photoURL)}
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 text-sm font-medium">
                            {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
                          </div>
                        )}
                        <div className="flex flex-col">
                          <span className="text-[13px] font-medium text-gray-800">{user.displayName}</span>
                          {user.authorNickname && (
                            <span className="text-[11px] text-gray-600">@{user.authorNickname}</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-1 text-center text-[13px] text-gray-800 w-24">
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString('ko-KR') : 'N/A'}
                      </td>
                      <td className="py-3 px-1 text-center text-[13px] text-gray-800 w-24">
                        {user.lastSignIn ? new Date(user.lastSignIn).toLocaleDateString('ko-KR') : 'N/A'}
                      </td>
                      <td className="py-3 px-2 text-center w-[58px]">
                        <span className="bg-blue-100 text-blue-800 px-1 py-1 rounded-full text-[13px]">
                          {user.designsCount}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-center w-[58px]">
                        <span className="bg-pink-100 text-pink-800 px-1 py-1 rounded-full text-[13px]">
                          {user.likesCount}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-center w-[58px]">
                        <span className="bg-purple-100 text-purple-800 px-1 py-1 rounded-full text-[13px]">
                          {user.sharesCount}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-center w-[58px]">
                        <span className="bg-green-100 text-green-800 px-1 py-1 rounded-full text-[13px]">
                          {user.boxroTalksCount}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-center w-[58px]">
                        <span className="bg-teal-100 text-teal-800 px-1 py-1 rounded-full text-[13px]">
                          {user.downloadsCount}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-center w-[58px]">
                        <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-[13px]">
                          {user.viewsCount}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-center w-[58px]">
                        <span className="bg-orange-100 text-orange-800 px-1 py-1 rounded-full text-[13px]">
                          {user.storeRedirectsCount || 0}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-center w-24">
                        {user.pwaInstalled ? (
                          <div className="flex flex-col items-center">
                            <span className="bg-green-100 text-green-800 px-1 py-1 rounded-full text-[12px] mb-1">
                              설치됨
                            </span>
                            {user.pwaInstallDate && (
                              <span className="text-[10px] text-gray-600">
                                {new Date(user.pwaInstallDate).toLocaleDateString('ko-KR')}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-[12px]">-</span>
                        )}
                      </td>
                    </tr>
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* 페이지네이션 - 임시로 항상 표시 */}
            {userStatsTotalPages >= 1 && (
              <div className="flex flex-col items-center gap-4 mt-6">
                {/* 디버그 정보 */}
                <div className="text-xs text-gray-600">
                  총 데이터: {filteredUserStats.length}개 | 
                  페이지 크기: {userStatsPageSize}개 | 
                  총 페이지: {userStatsTotalPages}개 | 
                  현재 페이지: {userStatsCurrentPage}개
                </div>
                
                <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() => handleUserStatsPageChange(userStatsCurrentPage - 1)}
                  disabled={userStatsCurrentPage === 1}
                  className="px-3 py-2 bg-white/80 border border-gray-300 rounded-lg hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: userStatsTotalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => handleUserStatsPageChange(page)}
                      className={`px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                        page === userStatsCurrentPage
                          ? 'bg-blue-500 text-white'
                          : 'bg-white/80 border border-gray-300 hover:bg-white/90'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>
                
                <button
                  onClick={() => handleUserStatsPageChange(userStatsCurrentPage + 1)}
                  disabled={userStatsCurrentPage === userStatsTotalPages}
                  className="px-3 py-2 bg-white/80 border border-gray-300 rounded-lg hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
                </div>
              </div>
            )}
        </div>
          </>
        )}

        {/* 사용자 활동 팝업 모달 */}
        {showUserModal && selectedUser && (
          <div 
            className="fixed inset-0 bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-pink-900/20 backdrop-blur-md z-50 flex items-center justify-center p-4"
            onClick={closeUserModal}
          >
            <div
              className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 max-w-[95vw] md:max-w-5xl w-full h-[70vh] md:h-[60vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center px-6 py-4 border-b border-white/20">
                <h3 className="text-xl font-semibold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  {selectedUser} 활동 내역
                </h3>
                <button
                  onClick={closeUserModal}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold hover:bg-gray-100 rounded-full w-8 h-8 flex items-center justify-center transition-all duration-200"
                >
                  ×
                </button>
              </div>
              
              <div className="px-6 py-4 overflow-y-auto max-h-[calc(70vh-80px)] md:max-h-[calc(60vh-80px)]">
                {/* 탭 메뉴 */}
                <div className="flex border-b border-gray-200 mb-4 overflow-x-auto">
                  {['작품', '좋아요', '공유', '박스로 톡', '다운로드', '조회', '스토어'].map((tab) => {
                    const count = tab === '작품' ? userActivities[selectedUser]?.designs?.length || 0 :
                                  tab === '좋아요' ? userActivities[selectedUser]?.likes?.length || 0 :
                                  tab === '공유' ? userActivities[selectedUser]?.shares?.reduce((sum: number, share: any) => sum + (share.shares || 0), 0) || 0 :
                                  tab === '박스로 톡' ? userActivities[selectedUser]?.boxroTalks?.length || 0 :
                                  tab === '다운로드' ? userActivities[selectedUser]?.downloads?.length || 0 :
                                  tab === '조회' ? userActivities[selectedUser]?.views?.reduce((sum: number, view: any) => sum + (view.views || 0), 0) || 0 :
                                  userActivities[selectedUser]?.storeRedirects?.reduce((sum: number, redirect: any) => sum + (redirect.storeRedirects || 0), 0) || 0;
                    
                    return (
                      <button
                        key={tab}
                        onClick={() => {
                          setActiveActivityTab(tab);
                          setCurrentPage(1);
                        }}
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex-shrink-0 ${
                          activeActivityTab === tab
                            ? 'border-blue-500 text-gray-800'
                            : 'border-transparent text-gray-800 hover:text-gray-800 hover:border-gray-300'
                        }`}
                      >
                        {tab} ({count})
                      </button>
                    );
                  })}
                </div>

                {/* 탭 내용 */}
                <div className="min-h-[200px]">
                  {activeActivityTab === '작품' && (
                    <div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-[13px] bg-white min-w-[800px]">
                          <thead>
                            <tr className="border-b border-gray-200">
                              <th className="text-left py-1 px-3 font-medium text-gray-800 bg-gray-50">작품</th>
                              <th 
                                className="text-left py-1 px-3 font-medium text-gray-800 bg-gray-50 cursor-pointer hover:bg-gray-100"
                                onClick={() => handleActivitySort('createdAt')}
                              >
                                <div className="flex items-center gap-1">
                                  생성일
                                  {activitySortField === 'createdAt' && (
                                    activitySortDirection === 'desc' ? 
                                    <ArrowDown className="w-3 h-3" /> : 
                                    <ArrowUp className="w-3 h-3" />
                        )}
                      </div>
                    </th>
                    <th 
                                className="text-center py-1 px-3 font-medium text-gray-800 bg-gray-50 w-20 cursor-pointer hover:bg-gray-100"
                                onClick={() => handleActivitySort('likes')}
                    >
                      <div className="flex items-center justify-center gap-1">
                        좋아요
                                  {activitySortField === 'likes' && (
                                    activitySortDirection === 'desc' ? 
                                    <ArrowDown className="w-3 h-3" /> : 
                                    <ArrowUp className="w-3 h-3" />
                        )}
                      </div>
                    </th>
                    <th 
                                className="text-center py-1 px-3 font-medium text-gray-800 bg-gray-50 w-20 cursor-pointer hover:bg-gray-100"
                                onClick={() => handleActivitySort('shares')}
                    >
                      <div className="flex items-center justify-center gap-1">
                        공유
                                  {activitySortField === 'shares' && (
                                    activitySortDirection === 'desc' ? 
                                    <ArrowDown className="w-3 h-3" /> : 
                                    <ArrowUp className="w-3 h-3" />
                        )}
                      </div>
                    </th>
                    <th 
                                className="text-center py-1 px-3 font-medium text-gray-800 bg-gray-50 w-20 cursor-pointer hover:bg-gray-100"
                                onClick={() => handleActivitySort('boxroTalks')}
                    >
                      <div className="flex items-center justify-center gap-1">
                        톡
                                  {activitySortField === 'boxroTalks' && (
                                    activitySortDirection === 'desc' ? 
                                    <ArrowDown className="w-3 h-3" /> : 
                                    <ArrowUp className="w-3 h-3" />
                        )}
                      </div>
                    </th>
                    <th 
                                className="text-center py-1 px-3 font-medium text-gray-800 bg-gray-50 w-20 cursor-pointer hover:bg-gray-100"
                                onClick={() => handleActivitySort('downloads')}
                    >
                      <div className="flex items-center justify-center gap-1">
                        다운로드
                                  {activitySortField === 'downloads' && (
                                    activitySortDirection === 'desc' ? 
                                    <ArrowDown className="w-3 h-3" /> : 
                                    <ArrowUp className="w-3 h-3" />
                        )}
                      </div>
                    </th>
                            </tr>
                          </thead>
                          <tbody>
                            {getSortedActivityData(userActivities[selectedUser]?.designs || []).slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((design: any, idx: number) => (
                              <tr key={idx} className="border-b border-gray-100 hover:bg-blue-50">
                                <td className="py-1 px-3">
                                  <div className="flex items-center gap-3">
                                    <div className="w-[58px] h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                                      {design.thumbnail ? (
                                        <img 
                                          src={design.thumbnail} 
                                          alt={design.title}
                                          className="w-full h-full object-cover"
                                          onError={(e) => {
                                            e.currentTarget.style.display = 'none';
                                            const nextElement = e.currentTarget.nextElementSibling as HTMLElement;
                                            if (nextElement) {
                                              nextElement.style.display = 'flex';
                                            }
                                          }}
                                        />
                                      ) : null}
                                      <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400 text-xs" style={{display: design.thumbnail ? 'none' : 'flex'}}>
                                        작품
                                      </div>
                                    </div>
                                    <a 
                                      href={`/gallery#${design.id}`} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="text-gray-800 hover:text-gray-600 hover:underline"
                                    >
                                      {design.title}
                                    </a>
                                  </div>
                                </td>
                                <td className="py-1 px-3 text-gray-800 text-xs">
                                  {new Date(design.createdAt?.toDate?.() || design.createdAt).toLocaleString('ko-KR')}
                                </td>
                                <td className="py-1 px-3 text-center text-gray-800 w-20">{(design.likes || 0) + (design.popularityBoost?.likes || 0)}</td>
                                <td className="py-1 px-3 text-center text-gray-800 w-20">{(design.shares || 0) + (design.popularityBoost?.shares || 0)}</td>
                                <td className="py-1 px-3 text-center text-gray-800 w-20">{design.boxroTalks || 0}</td>
                                <td className="py-1 px-3 text-center text-gray-800 w-20">{(design.downloads || 0) + (design.popularityBoost?.downloads || 0)}</td>
                              </tr>
                            )) || (
                              <tr>
                                <td colSpan={6} className="py-4 text-center text-gray-500">작품이 없습니다</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                      {/* 페이징 */}
                      {userActivities[selectedUser]?.designs?.length > itemsPerPage && (
                        <div className="flex justify-center mt-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                              disabled={currentPage === 1}
                              className="px-3 py-1 text-sm border rounded disabled:opacity-50"
                            >
                              이전
                            </button>
                            <span className="px-3 py-1 text-sm">
                              {currentPage} / {Math.ceil((userActivities[selectedUser]?.designs?.length || 0) / itemsPerPage)}
                            </span>
                            <button
                              onClick={() => setCurrentPage(Math.min(Math.ceil((userActivities[selectedUser]?.designs?.length || 0) / itemsPerPage), currentPage + 1))}
                              disabled={currentPage >= Math.ceil((userActivities[selectedUser]?.designs?.length || 0) / itemsPerPage)}
                              className="px-3 py-1 text-sm border rounded disabled:opacity-50"
                            >
                              다음
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {activeActivityTab === '박스로 톡' && (
                    <div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-[13px] bg-white min-w-[800px]">
                          <thead>
                            <tr className="border-b border-gray-200">
                              <th className="text-left py-1 px-3 font-medium text-gray-800 bg-gray-50">내용</th>
                              <th 
                                className="text-left py-1 px-3 font-medium text-gray-800 bg-gray-50 cursor-pointer hover:bg-gray-100"
                                onClick={() => handleActivitySort('createdAt')}
                              >
                                <div className="flex items-center gap-1">
                                  작성일
                                  {activitySortField === 'createdAt' && (
                                    activitySortDirection === 'desc' ? 
                                    <ArrowDown className="w-3 h-3" /> : 
                                    <ArrowUp className="w-3 h-3" />
                        )}
                      </div>
                    </th>
                    <th 
                                className="text-left py-1 px-3 font-medium text-gray-800 bg-gray-50 cursor-pointer hover:bg-gray-100"
                                onClick={() => handleActivitySort('source')}
                              >
                                <div className="flex items-center gap-1">
                                  메뉴명
                                  {activitySortField === 'source' && (
                                    activitySortDirection === 'desc' ? 
                                    <ArrowDown className="w-3 h-3" /> : 
                                    <ArrowUp className="w-3 h-3" />
                        )}
                      </div>
                    </th>
                              <th className="text-left py-1 px-3 font-medium text-gray-800 bg-gray-50">작품</th>
                              <th className="text-left py-1 px-3 font-medium text-gray-800 bg-gray-50">작가</th>
                  </tr>
                </thead>
                <tbody>
                            {getSortedActivityData(userActivities[selectedUser]?.boxroTalks || []).slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((boxroTalk: any, idx: number) => (
                              <tr key={idx} className="border-b border-gray-100 hover:bg-green-50">
                                <td className="py-1 px-3 text-gray-800">{boxroTalk.content}</td>
                                <td className="py-1 px-3 text-gray-800 text-xs">
                                  {new Date(boxroTalk.createdAt?.toDate?.() || boxroTalk.createdAt).toLocaleString('ko-KR')}
                                </td>
                                <td className="py-1 px-3 text-gray-800 text-xs">
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    boxroTalk.source === 'gallery' 
                                      ? 'bg-blue-100 text-blue-800' 
                                      : boxroTalk.source === 'story'
                                      ? 'bg-purple-100 text-purple-800'
                                      : 'bg-green-100 text-green-800'
                                  }`}>
                                    {boxroTalk.source === 'gallery' ? '갤러리' : 
                                     boxroTalk.source === 'story' ? '이야기' : '스토어'}
                                  </span>
                                </td>
                                <td className="py-1 px-3 text-gray-800 text-xs">
                                  <div className="flex items-center gap-2">
                                     {boxroTalk.designThumbnail ? (
                                       <img 
                                         src={boxroTalk.designThumbnail} 
                                         alt={boxroTalk.designTitle || '작품 썸네일'}
                                         className="w-[58px] h-12 object-cover rounded"
                                         onError={(e) => {
                                           e.currentTarget.style.display = 'none';
                                           e.currentTarget.nextElementSibling.style.display = 'flex';
                                         }}
                                       />
                                     ) : null}
                                     <div className="w-[58px] h-12 bg-gray-200 rounded flex items-center justify-center text-gray-400 text-xs" style={{display: boxroTalk.designThumbnail ? 'none' : 'flex'}}>
                                       작품
                          </div>
                                    <a 
                                      href={boxroTalk.designId ? `/gallery#${boxroTalk.designId}` : `/story/${boxroTalk.articleId}`} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="text-gray-800 hover:text-gray-600 hover:underline"
                                    >
                                      {boxroTalk.designTitle || boxroTalk.articleTitle || '박스로 톡'}
                                    </a>
                                  </div>
                                </td>
                                <td className="py-1 px-3 text-gray-800 text-xs">
                                  {boxroTalk.designAuthor || '작가 정보 없음'}
                                </td>
                              </tr>
                            )) || (
                              <tr>
                                <td colSpan={4} className="py-4 text-center text-gray-500">박스로 톡이 없습니다</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                      {/* 페이징 */}
                      {userActivities[selectedUser]?.boxroTalks?.length > itemsPerPage && (
                        <div className="flex justify-center mt-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                              disabled={currentPage === 1}
                              className="px-3 py-1 text-sm border rounded disabled:opacity-50"
                            >
                              이전
                            </button>
                            <span className="px-3 py-1 text-sm">
                              {currentPage} / {Math.ceil((userActivities[selectedUser]?.boxroTalks?.length || 0) / itemsPerPage)}
                            </span>
                            <button
                              onClick={() => setCurrentPage(Math.min(Math.ceil((userActivities[selectedUser]?.boxroTalks?.length || 0) / itemsPerPage), currentPage + 1))}
                              disabled={currentPage >= Math.ceil((userActivities[selectedUser]?.boxroTalks?.length || 0) / itemsPerPage)}
                              className="px-3 py-1 text-sm border rounded disabled:opacity-50"
                            >
                              다음
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {activeActivityTab === '좋아요' && (
                    <div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-[13px] bg-white min-w-[800px]">
                          <thead>
                            <tr className="border-b border-gray-200">
                              <th 
                                className="text-left py-1 px-3 font-medium text-gray-800 bg-gray-50 cursor-pointer hover:bg-gray-100"
                                onClick={() => handleActivitySort('createdAt')}
                              >
                                <div className="flex items-center gap-1">
                                  좋아요한 날짜
                                  {activitySortField === 'createdAt' && (
                                    activitySortDirection === 'desc' ? 
                                    <ArrowDown className="w-3 h-3" /> : 
                                    <ArrowUp className="w-3 h-3" />
                                  )}
                                </div>
                              </th>
                              <th 
                                className="text-left py-1 px-3 font-medium text-gray-800 bg-gray-50 cursor-pointer hover:bg-gray-100"
                                onClick={() => handleActivitySort('source')}
                              >
                                <div className="flex items-center gap-1">
                                  메뉴명
                                  {activitySortField === 'source' && (
                                    activitySortDirection === 'desc' ? 
                                    <ArrowDown className="w-3 h-3" /> : 
                                    <ArrowUp className="w-3 h-3" />
                                  )}
                                </div>
                              </th>
                              <th className="text-left py-1 px-3 font-medium text-gray-800 bg-gray-50">작품</th>
                              <th className="text-left py-1 px-3 font-medium text-gray-800 bg-gray-50">작가</th>
                              <th className="text-center py-1 px-3 font-medium text-gray-800 bg-gray-50">전체 좋아요 수</th>
                              <th className="text-left py-1 px-3 font-medium text-gray-800 bg-gray-50">생성일</th>
                            </tr>
                          </thead>
                          <tbody>
                            {getSortedActivityData(userActivities[selectedUser]?.likes || []).slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((like: any, idx: number) => (
                              <tr key={idx} className="border-b border-gray-100 hover:bg-red-50">
                                <td className="py-1 px-3 text-gray-800 text-xs">
                                  {new Date(like.likedAt?.toDate?.() || like.likedAt || like.createdAt?.toDate?.() || like.createdAt).toLocaleString('ko-KR')}
                      </td>
                                <td className="py-1 px-3 text-gray-800 text-xs">
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    like.articleId 
                                      ? 'bg-purple-100 text-purple-800' 
                                      : 'bg-blue-100 text-blue-800'
                                  }`}>
                                    {like.articleId ? '이야기' : '갤러리'}
                                  </span>
                      </td>
                                <td className="py-1 px-3 text-gray-800">
                                  <div className="flex items-center gap-2">
                                    {like.thumbnail ? (
                                      <img 
                                        src={like.thumbnail} 
                                        alt={like.title || '작품 썸네일'}
                                        className="w-[58px] h-12 object-cover rounded"
                                        onError={(e) => {
                                          e.currentTarget.style.display = 'none';
                                          e.currentTarget.nextElementSibling.style.display = 'flex';
                                        }}
                                      />
                                    ) : null}
                                    <div className="w-[58px] h-12 bg-gray-200 rounded flex items-center justify-center text-gray-400 text-xs" style={{display: like.thumbnail ? 'none' : 'flex'}}>
                                      작품
                                    </div>
                                    <a 
                                      href={like.articleId ? `/story/${like.articleId}` : `/gallery#${like.id}`} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="text-gray-800 hover:text-gray-600 hover:underline"
                                    >
                                      {like.title}
                                    </a>
                                  </div>
                      </td>
                                <td className="py-1 px-3 text-gray-800 text-xs">{like.author}</td>
                                <td className="py-1 px-3 text-center text-gray-800">{like.likes}</td>
                                <td className="py-1 px-3 text-gray-800 text-xs">
                                  {new Date(like.createdAt?.toDate?.() || like.createdAt).toLocaleString('ko-KR')}
                                </td>
                              </tr>
                            )) || (
                              <tr>
                                <td colSpan={5} className="py-4 text-center text-gray-500">좋아요가 없습니다</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                      {/* 페이징 */}
                      {userActivities[selectedUser]?.likes?.length > itemsPerPage && (
                        <div className="flex justify-center mt-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                              disabled={currentPage === 1}
                              className="px-3 py-1 text-sm border rounded disabled:opacity-50"
                            >
                              이전
                            </button>
                            <span className="px-3 py-1 text-sm">
                              {currentPage} / {Math.ceil((userActivities[selectedUser]?.likes?.length || 0) / itemsPerPage)}
                        </span>
                            <button
                              onClick={() => setCurrentPage(Math.min(Math.ceil((userActivities[selectedUser]?.likes?.length || 0) / itemsPerPage), currentPage + 1))}
                              disabled={currentPage >= Math.ceil((userActivities[selectedUser]?.likes?.length || 0) / itemsPerPage)}
                              className="px-3 py-1 text-sm border rounded disabled:opacity-50"
                            >
                              다음
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {activeActivityTab === '다운로드' && (
                    <div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-[13px] bg-white min-w-[800px]">
                          <thead>
                            <tr className="border-b border-gray-200">
                              <th 
                                className="text-left py-1 px-3 font-medium text-gray-800 bg-gray-50 cursor-pointer hover:bg-gray-100"
                                onClick={() => handleActivitySort('createdAt')}
                              >
                                <div className="flex items-center gap-1">
                                  다운로드한 날짜
                                  {activitySortField === 'createdAt' && (
                                    activitySortDirection === 'desc' ? 
                                    <ArrowDown className="w-3 h-3" /> : 
                                    <ArrowUp className="w-3 h-3" />
                                  )}
                                </div>
                              </th>
                              <th 
                                className="text-left py-1 px-3 font-medium text-gray-800 bg-gray-50 cursor-pointer hover:bg-gray-100"
                                onClick={() => handleActivitySort('source')}
                              >
                                <div className="flex items-center gap-1">
                                  메뉴명
                                  {activitySortField === 'source' && (
                                    activitySortDirection === 'desc' ? 
                                    <ArrowDown className="w-3 h-3" /> : 
                                    <ArrowUp className="w-3 h-3" />
                                  )}
                                </div>
                              </th>
                              <th className="text-left py-1 px-3 font-medium text-gray-800 bg-gray-50">작품</th>
                              <th className="text-left py-1 px-3 font-medium text-gray-800 bg-gray-50">작가</th>
                              <th className="text-center py-1 px-3 font-medium text-gray-800 bg-gray-50">전체 다운로드 수</th>
                              <th className="text-left py-1 px-3 font-medium text-gray-800 bg-gray-50">생성일</th>
                            </tr>
                          </thead>
                          <tbody>
                            {getSortedActivityData(userActivities[selectedUser]?.downloads || []).slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((download: any, idx: number) => (
                              <tr key={idx} className="border-b border-gray-100 hover:bg-purple-50">
                                <td className="py-1 px-3 text-gray-800 text-xs">
                                  {new Date(download.downloadedAt?.toDate?.() || download.downloadedAt || download.createdAt?.toDate?.() || download.createdAt).toLocaleString('ko-KR')}
                      </td>
                                <td className="py-1 px-3 text-gray-800 text-xs">
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    download.type === 'blueprint' 
                                      ? 'bg-green-100 text-green-800' 
                                      : 'bg-blue-100 text-blue-800'
                                  }`}>
                                    {download.type === 'blueprint' ? '개인도안' : '갤러리'}
                        </span>
                      </td>
                                <td className="py-1 px-3 text-gray-800">
                                  <div className="flex items-center gap-2">
                                    {download.thumbnail ? (
                                      <img 
                                        src={download.thumbnail} 
                                        alt={download.title || '작품 썸네일'}
                                        className="w-[58px] h-12 object-cover rounded"
                                        onError={(e) => {
                                          e.currentTarget.style.display = 'none';
                                          e.currentTarget.nextElementSibling.style.display = 'flex';
                                        }}
                                      />
                                    ) : null}
                                    <div className="w-[58px] h-12 bg-gray-200 rounded flex items-center justify-center text-gray-400 text-xs" style={{display: download.thumbnail ? 'none' : 'flex'}}>
                                      작품
                                    </div>
                                    <a 
                                      href={download.type === 'blueprint' ? `/draw` : `/gallery#${download.id}`} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="text-gray-800 hover:text-gray-600 hover:underline"
                                    >
                                      {download.title}
                                    </a>
                                  </div>
                                </td>
                                <td className="py-1 px-3 text-gray-800 text-xs">{download.author}</td>
                                <td className="py-1 px-3 text-center text-gray-800">{download.downloads}</td>
                                <td className="py-1 px-3 text-gray-800 text-xs">
                                  {new Date(download.createdAt?.toDate?.() || download.createdAt).toLocaleString('ko-KR')}
                                </td>
                              </tr>
                            )) || (
                              <tr>
                                <td colSpan={5} className="py-4 text-center text-gray-500">다운로드가 없습니다</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                      {/* 페이징 */}
                      {userActivities[selectedUser]?.downloads?.length > itemsPerPage && (
                        <div className="flex justify-center mt-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                              disabled={currentPage === 1}
                              className="px-3 py-1 text-sm border rounded disabled:opacity-50"
                            >
                              이전
                            </button>
                            <span className="px-3 py-1 text-sm">
                              {currentPage} / {Math.ceil((userActivities[selectedUser]?.downloads?.length || 0) / itemsPerPage)}
                        </span>
                            <button
                              onClick={() => setCurrentPage(Math.min(Math.ceil((userActivities[selectedUser]?.downloads?.length || 0) / itemsPerPage), currentPage + 1))}
                              disabled={currentPage >= Math.ceil((userActivities[selectedUser]?.downloads?.length || 0) / itemsPerPage)}
                              className="px-3 py-1 text-sm border rounded disabled:opacity-50"
                            >
                              다음
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {activeActivityTab === '공유' && (
                    <div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-[13px] bg-white min-w-[800px]">
                          <thead>
                            <tr className="border-b border-gray-200">
                              <th 
                                className="text-left py-1 px-3 font-medium text-gray-800 bg-gray-50 cursor-pointer hover:bg-gray-100"
                                onClick={() => handleActivitySort('createdAt')}
                              >
                                <div className="flex items-center gap-1">
                                  공유한 날짜
                                  {activitySortField === 'createdAt' && (
                                    activitySortDirection === 'desc' ? 
                                    <ArrowDown className="w-3 h-3" /> : 
                                    <ArrowUp className="w-3 h-3" />
                                  )}
                                </div>
                              </th>
                              <th 
                                className="text-left py-1 px-3 font-medium text-gray-800 bg-gray-50 cursor-pointer hover:bg-gray-100"
                                onClick={() => handleActivitySort('source')}
                              >
                                <div className="flex items-center gap-1">
                                  메뉴명
                                  {activitySortField === 'source' && (
                                    activitySortDirection === 'desc' ? 
                                    <ArrowDown className="w-3 h-3" /> : 
                                    <ArrowUp className="w-3 h-3" />
                                  )}
                                </div>
                              </th>
                              <th className="text-left py-1 px-3 font-medium text-gray-800 bg-gray-50">작품</th>
                              <th className="text-left py-1 px-3 font-medium text-gray-800 bg-gray-50">작가</th>
                              <th className="text-center py-1 px-3 font-medium text-gray-800 bg-gray-50">전체 공유 수</th>
                              <th className="text-left py-1 px-3 font-medium text-gray-800 bg-gray-50">생성일</th>
                            </tr>
                          </thead>
                          <tbody>
                            {getSortedActivityData(userActivities[selectedUser]?.shares || []).slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((share: any, idx: number) => (
                              <tr key={idx} className="border-b border-gray-100 hover:bg-orange-50">
                                <td className="py-1 px-3 text-gray-800 text-xs">
                                  {new Date(share.sharedAt?.toDate?.() || share.sharedAt || share.createdAt?.toDate?.() || share.createdAt).toLocaleString('ko-KR')}
                      </td>
                                <td className="py-1 px-3 text-gray-800 text-xs">
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    share.articleId 
                                      ? 'bg-purple-100 text-purple-800' 
                                      : 'bg-blue-100 text-blue-800'
                                  }`}>
                                    {share.articleId ? '이야기' : '갤러리'}
                        </span>
                      </td>
                                <td className="py-1 px-3 text-gray-800">
                                  <div className="flex items-center gap-2">
                                    {share.thumbnail ? (
                                      <img 
                                        src={share.thumbnail} 
                                        alt={share.title || '작품 썸네일'}
                                        className="w-[58px] h-12 object-cover rounded"
                                        onError={(e) => {
                                          e.currentTarget.style.display = 'none';
                                          e.currentTarget.nextElementSibling.style.display = 'flex';
                                        }}
                                      />
                                    ) : null}
                                    <div className="w-[58px] h-12 bg-gray-200 rounded flex items-center justify-center text-gray-400 text-xs" style={{display: share.thumbnail ? 'none' : 'flex'}}>
                                      작품
                                    </div>
                                    <a 
                                      href={share.articleId ? `/story/${share.articleId}` : `/gallery#${share.id}`} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="text-gray-800 hover:text-gray-600 hover:underline"
                                    >
                                      {share.title}
                                    </a>
                                  </div>
                                </td>
                                <td className="py-1 px-3 text-gray-800 text-xs">{share.author}</td>
                                <td className="py-1 px-3 text-center text-gray-800">{share.shares}</td>
                                <td className="py-1 px-3 text-gray-800 text-xs">
                                  {new Date(share.createdAt?.toDate?.() || share.createdAt).toLocaleString('ko-KR')}
                                </td>
                              </tr>
                            )) || (
                              <tr>
                                <td colSpan={5} className="py-4 text-center text-gray-500">공유가 없습니다</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                      {/* 페이징 */}
                      {userActivities[selectedUser]?.shares?.length > itemsPerPage && (
                        <div className="flex justify-center mt-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                              disabled={currentPage === 1}
                              className="px-3 py-1 text-sm border rounded disabled:opacity-50"
                            >
                              이전
                            </button>
                            <span className="px-3 py-1 text-sm">
                              {currentPage} / {Math.ceil((userActivities[selectedUser]?.shares?.length || 0) / itemsPerPage)}
                        </span>
                            <button
                              onClick={() => setCurrentPage(Math.min(Math.ceil((userActivities[selectedUser]?.shares?.length || 0) / itemsPerPage), currentPage + 1))}
                              disabled={currentPage >= Math.ceil((userActivities[selectedUser]?.shares?.length || 0) / itemsPerPage)}
                              className="px-3 py-1 text-sm border rounded disabled:opacity-50"
                            >
                              다음
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {activeActivityTab === '조회' && (
                    <div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-[13px] bg-white min-w-[800px]">
                          <thead>
                            <tr className="border-b border-gray-200">
                              <th 
                                className="text-left py-1 px-3 font-medium text-gray-800 bg-gray-50 cursor-pointer hover:bg-gray-100"
                                onClick={() => handleActivitySort('createdAt')}
                              >
                                <div className="flex items-center gap-1">
                                  조회한 날짜
                                  {activitySortField === 'createdAt' && (
                                    activitySortDirection === 'desc' ? 
                                    <ArrowDown className="w-3 h-3" /> : 
                                    <ArrowUp className="w-3 h-3" />
                                  )}
                                </div>
                              </th>
                              <th 
                                className="text-left py-1 px-3 font-medium text-gray-800 bg-gray-50 cursor-pointer hover:bg-gray-100"
                                onClick={() => handleActivitySort('source')}
                              >
                                <div className="flex items-center gap-1">
                                  메뉴명
                                  {activitySortField === 'source' && (
                                    activitySortDirection === 'desc' ? 
                                    <ArrowDown className="w-3 h-3" /> : 
                                    <ArrowUp className="w-3 h-3" />
                                  )}
                                </div>
                              </th>
                              <th className="text-left py-1 px-3 font-medium text-gray-800 bg-gray-50">작품</th>
                              <th className="text-left py-1 px-3 font-medium text-gray-800 bg-gray-50">작가</th>
                              <th className="text-center py-1 px-3 font-medium text-gray-800 bg-gray-50">전체 조회 수</th>
                              <th className="text-left py-1 px-3 font-medium text-gray-800 bg-gray-50">생성일</th>
                            </tr>
                          </thead>
                          <tbody>
                            {getSortedActivityData(userActivities[selectedUser]?.views || []).slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((view: any, idx: number) => (
                              <tr key={idx} className="border-b border-gray-100 hover:bg-orange-50">
                                <td className="py-1 px-3 text-gray-800 text-xs">
                                  {new Date(view.viewedAt?.toDate?.() || view.viewedAt || view.createdAt?.toDate?.() || view.createdAt).toLocaleString('ko-KR')}
                      </td>
                                <td className="py-1 px-3 text-gray-800 text-xs">
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    view.type === 'story' 
                                      ? 'bg-purple-100 text-purple-800' 
                                      : view.type === 'store'
                                      ? 'bg-orange-100 text-orange-800'
                                      : 'bg-blue-100 text-blue-800'
                                  }`}>
                                    {view.type === 'story' ? '이야기' : view.type === 'store' ? '스토어' : '갤러리'}
                        </span>
                      </td>
                                <td className="py-1 px-3 text-gray-800">
                                  <div className="flex items-center gap-2">
                                    {view.thumbnail ? (
                                      <img 
                                        src={view.thumbnail} 
                                        alt={view.title || '작품 썸네일'}
                                        className="w-[58px] h-12 object-cover rounded"
                                        onError={(e) => {
                                          e.currentTarget.style.display = 'none';
                                          e.currentTarget.nextElementSibling.style.display = 'flex';
                                        }}
                                      />
                                    ) : null}
                                    <div className="w-[58px] h-12 bg-gray-200 rounded flex items-center justify-center text-gray-400 text-xs" style={{display: view.thumbnail ? 'none' : 'flex'}}>
                                      작품
                                    </div>
                                    <a 
                                      href={view.type === 'story' ? `/story/${view.id}` : view.type === 'store' ? `/store/${view.id}` : `/gallery#${view.id}`} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="text-gray-800 hover:text-gray-600 hover:underline"
                                    >
                                      {view.title}
                                    </a>
                                  </div>
                                </td>
                                <td className="py-1 px-3 text-gray-800 text-xs">{view.author}</td>
                                <td className="py-1 px-3 text-center text-gray-800">{view.views}</td>
                                <td className="py-1 px-3 text-gray-800 text-xs">
                                  {new Date(view.createdAt?.toDate?.() || view.createdAt).toLocaleString('ko-KR')}
                      </td>
                    </tr>
                            )) || (
                              <tr>
                                <td colSpan={6} className="py-4 text-center text-gray-500">조회가 없습니다</td>
                              </tr>
                            )}
                </tbody>
              </table>
            </div>
                      {/* 페이징 */}
                      {userActivities[selectedUser]?.views?.length > itemsPerPage && (
                        <div className="flex justify-center mt-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                              disabled={currentPage === 1}
                              className="px-3 py-1 text-sm border rounded disabled:opacity-50"
                            >
                              이전
                            </button>
                            <span className="px-3 py-1 text-sm">
                              {currentPage} / {Math.ceil((userActivities[selectedUser]?.views?.length || 0) / itemsPerPage)}
                            </span>
                            <button
                              onClick={() => setCurrentPage(Math.min(Math.ceil((userActivities[selectedUser]?.views?.length || 0) / itemsPerPage), currentPage + 1))}
                              disabled={currentPage >= Math.ceil((userActivities[selectedUser]?.views?.length || 0) / itemsPerPage)}
                              className="px-3 py-1 text-sm border rounded disabled:opacity-50"
                            >
                              다음
                            </button>
      </div>
                        </div>
                      )}
                    </div>
                  )}

                  {activeActivityTab === '스토어' && (
                    <div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-[13px] bg-white min-w-[800px]">
                          <thead>
                            <tr className="border-b border-gray-200">
                              <th 
                                className="text-left py-1 px-3 font-medium text-gray-800 bg-gray-50 cursor-pointer hover:bg-gray-100"
                                onClick={() => handleActivitySort('createdAt')}
                              >
                                <div className="flex items-center gap-1">
                                  바로가기 날짜
                                  {activitySortField === 'createdAt' && (
                                    activitySortDirection === 'desc' ? 
                                    <ArrowDown className="w-3 h-3" /> : 
                                    <ArrowUp className="w-3 h-3" />
                                  )}
                                </div>
                              </th>
                              <th className="text-left py-1 px-3 font-medium text-gray-800 bg-gray-50">작품</th>
                              <th className="text-left py-1 px-3 font-medium text-gray-800 bg-gray-50">작가</th>
                              <th className="text-center py-1 px-3 font-medium text-gray-800 bg-gray-50">전체 바로가기 수</th>
                              <th className="text-left py-1 px-3 font-medium text-gray-800 bg-gray-50">생성일</th>
                            </tr>
                          </thead>
                          <tbody>
                            {getSortedActivityData(userActivities[selectedUser]?.storeRedirects || []).slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((redirect: any, idx: number) => (
                              <tr key={idx} className="border-b border-gray-100 hover:bg-orange-50">
                                <td className="py-1 px-3 text-gray-800 text-xs">
                                  {new Date(redirect.redirectedAt?.toDate?.() || redirect.redirectedAt || redirect.createdAt?.toDate?.() || redirect.createdAt).toLocaleString('ko-KR')}
                                </td>
                                <td className="py-1 px-3">
                                  <div className="flex items-center gap-3">
                                    <div className="w-[58px] h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                                      {redirect.thumbnail ? (
                                        <img 
                                          src={redirect.thumbnail} 
                                          alt={redirect.title}
                                          className="w-full h-full object-cover"
                                          onError={(e) => {
                                            e.currentTarget.style.display = 'none';
                                            const nextElement = e.currentTarget.nextElementSibling as HTMLElement;
                                            if (nextElement) {
                                              nextElement.style.display = 'flex';
                                            }
                                          }}
                                        />
                                      ) : null}
                                      <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400 text-xs" style={{display: redirect.thumbnail ? 'none' : 'flex'}}>
                                        스토어
                                      </div>
                                    </div>
                                    <a 
                                      href={`/store/${redirect.id}`} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="text-gray-800 hover:text-gray-600 hover:underline truncate max-w-xs"
                                    >
                                      {redirect.title}
                                    </a>
                                  </div>
                                </td>
                                <td className="py-1 px-3 text-gray-800 text-xs">{redirect.author}</td>
                                <td className="py-1 px-3 text-center text-gray-800">{redirect.storeRedirects}</td>
                                <td className="py-1 px-3 text-gray-800 text-xs">
                                  {new Date(redirect.createdAt?.toDate?.() || redirect.createdAt).toLocaleString('ko-KR')}
                                </td>
                              </tr>
                            )) || (
                              <tr>
                                <td colSpan={5} className="py-4 text-center text-gray-500">스토어 바로가기가 없습니다</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                      {/* 페이징 */}
                      {userActivities[selectedUser]?.storeRedirects?.length > itemsPerPage && (
                        <div className="flex justify-center mt-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                              disabled={currentPage === 1}
                              className="px-3 py-1 text-sm border rounded disabled:opacity-50"
                            >
                              이전
                            </button>
                            <span className="px-3 py-1 text-sm">
                              {currentPage} / {Math.ceil((userActivities[selectedUser]?.storeRedirects?.length || 0) / itemsPerPage)}
                            </span>
                            <button
                              onClick={() => setCurrentPage(Math.min(Math.ceil((userActivities[selectedUser]?.storeRedirects?.length || 0) / itemsPerPage), currentPage + 1))}
                              disabled={currentPage >= Math.ceil((userActivities[selectedUser]?.storeRedirects?.length || 0) / itemsPerPage)}
                              className="px-3 py-1 text-sm border rounded disabled:opacity-50"
                            >
                              다음
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'overall-stats' && (
          <AdminDashboard adminStats={adminStats} loading={loading} />
        )}

        {activeTab === 'home-cards' && (
          <HomeCardOrder
            homeCardsLoading={homeCardsLoading}
            saving={saving}
            homeCards={homeCards}
            hiddenCards={hiddenCards}
            filterSource={filterSource}
            setFilterSource={setFilterSource}
            filterDateFrom={filterDateFrom}
            setFilterDateFrom={setFilterDateFrom}
            filterDateTo={filterDateTo}
            setFilterDateTo={setFilterDateTo}
            filterSearch={filterSearch}
            setFilterSearch={setFilterSearch}
            getFilteredHomeCards={getFilteredHomeCards}
            moveCard={moveCard}
            saveOrder={saveOrder}
            toggleCardVisibility={toggleCardVisibility}
            resetFilters={() => {
              setFilterSource('');
              setFilterDateFrom('');
              setFilterDateTo('');
              setFilterSearch('');
            }}
            onDragEnd={onDragEnd}
          />
        )}

        {activeTab === 'home-card-management' && (
          <HomeCardManagement
            homeCardTitle={homeCardTitle}
            setHomeCardTitle={setHomeCardTitle}
            homeCardDescription={homeCardDescription}
            setHomeCardDescription={setHomeCardDescription}
            homeCardThumbnail={homeCardThumbnail}
            setHomeCardThumbnail={setHomeCardThumbnail}
            homeCardUrl={homeCardUrl}
            setHomeCardUrl={setHomeCardUrl}
            homeCardOpenInNewTab={homeCardOpenInNewTab}
            setHomeCardOpenInNewTab={setHomeCardOpenInNewTab}
            homeCardTitleColor={homeCardTitleColor}
            setHomeCardTitleColor={setHomeCardTitleColor}
            homeCardDescriptionColor={homeCardDescriptionColor}
            setHomeCardDescriptionColor={setHomeCardDescriptionColor}
            homeCardTextPosition={homeCardTextPosition}
            setHomeCardTextPosition={setHomeCardTextPosition}
            homeCardBackgroundColor={homeCardBackgroundColor}
            setHomeCardBackgroundColor={setHomeCardBackgroundColor}
            isEditMode={isEditMode}
            addingCard={addingCard}
            deletingCard={deletingCard}
            editingCard={editingCard}
            addHomeCard={addHomeCard}
            saveEditCard={saveEditCard}
            startEditCard={startEditCard}
            deleteHomeCard={deleteHomeCard}
            cancelEdit={cancelEdit}
            resetForm={resetForm}
            homeCardList={homeCardList}
            getFilteredHomeCardList={getFilteredHomeCardList}
            homeCardFilterDateFrom={homeCardFilterDateFrom}
            setHomeCardFilterDateFrom={setHomeCardFilterDateFrom}
            homeCardFilterDateTo={homeCardFilterDateTo}
            setHomeCardFilterDateTo={setHomeCardFilterDateTo}
            homeCardFilterSearch={homeCardFilterSearch}
            setHomeCardFilterSearch={setHomeCardFilterSearch}
            resetHomeCardFilters={resetHomeCardFilters}
          />
        )}

        {activeTab === 'popularity-management' && (
          <PopularityManagement
            popularityItems={popularityItems}
            popularityLoading={popularityLoading}
            popularityFilter={popularityFilter}
            setPopularityFilter={setPopularityFilter}
            popularitySortBy={popularitySortBy}
            setPopularitySortBy={setPopularitySortBy}
            popularitySortOrder={popularitySortOrder}
            setPopularitySortOrder={setPopularitySortOrder}
            popularityPageSize={popularityPageSize}
            handlePageSizeChange={handlePageSizeChange}
            popularityBoosts={popularityBoosts}
            setPopularityBoosts={setPopularityBoosts}
            updatePopularityBoost={updatePopularityBoost}
            getSortedPopularityItems={getSortedPopularityItems}
            handlePageChange={handlePageChange}
            popularityTotalPages={popularityTotalPages}
            popularityCurrentPage={popularityCurrentPage}
            popularityAllItems={popularityAllItems}
          />
        )}

        {activeTab === 'banner-management' && (
          <BannerManagement
            bannerTitle={bannerTitle}
            setBannerTitle={setBannerTitle}
            bannerDescription={bannerDescription}
            setBannerDescription={setBannerDescription}
            bannerThumbnail={bannerThumbnail}
            setBannerThumbnail={setBannerThumbnail}
            bannerUrl={bannerUrl}
            setBannerUrl={setBannerUrl}
            bannerOpenInNewTab={bannerOpenInNewTab}
            setBannerOpenInNewTab={setBannerOpenInNewTab}
            bannerTitleColor={bannerTitleColor}
            setBannerTitleColor={setBannerTitleColor}
            bannerDescriptionColor={bannerDescriptionColor}
            setBannerDescriptionColor={setBannerDescriptionColor}
            bannerTextPosition={bannerTextPosition}
            setBannerTextPosition={setBannerTextPosition}
            bannerBackgroundColor={bannerBackgroundColor}
            setBannerBackgroundColor={setBannerBackgroundColor}
            bannerTargetPages={bannerTargetPages}
            setBannerTargetPages={setBannerTargetPages}
            isEditMode={isBannerEditMode}
            addingBanner={addingBanner}
            deletingBanner={deletingBanner}
            addBanner={addBanner}
            saveEditBanner={saveEditBanner}
            startEditBanner={startEditBanner}
            deleteBanner={deleteBanner}
            toggleBannerActive={toggleBannerActive}
            moveBannerOrder={moveBannerOrder}
            cancelEdit={cancelBannerEdit}
            resetForm={resetBannerForm}
            bannerList={bannerList}
            getFilteredBannerList={getFilteredBannerList}
            bannerFilterDateFrom={bannerFilterDateFrom}
            setBannerFilterDateFrom={setBannerFilterDateFrom}
            bannerFilterDateTo={bannerFilterDateTo}
            setBannerFilterDateTo={setBannerFilterDateTo}
            bannerFilterSearch={bannerFilterSearch}
            setBannerFilterSearch={setBannerFilterSearch}
            resetBannerFilters={resetBannerFilters}
            bannerSortBy={bannerSortBy}
            setBannerSortBy={setBannerSortBy}
            bannerSortOrder={bannerSortOrder}
            setBannerSortOrder={setBannerSortOrder}
          />
        )}

        {activeTab === 'terms-management' && (
          <TermsManagement />
        )}
      </div>
      {/* 오류 모달 */}
      <ErrorModal
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        message={errorMessage}
      />
    </CommonBackground>
  );
}
