'use client';

// 최신 버전: 2025-10-09 01:30
import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useScrollLock } from '@/hooks/useScrollLock';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import CommonHeader from "@/components/CommonHeader";
import CommonBackground from "@/components/CommonBackground";
import PageHeader from "@/components/PageHeader";
import DrawSplashScreen from "@/components/DrawSplashScreen";
import ErrorModal from "@/components/ErrorModal";
import { 
  ArrowLeft, 
  ArrowRight,
  Palette, 
  Download, 
  Save,
  Sparkles,
  Eraser,
  PenTool,
  Menu,
  X,
  Heart,
  Users,
  Smartphone,
  ShoppingBag,
  Home,
  Search,
  BarChart3,
  Pencil,
  Brain,
  Ruler,
  Triangle,
  Building,
  Box,
  Circle,
  Eye,
  FileText,
  Check,
  Printer,
  Upload,
  Tag,
  Share2,
  ExternalLink
} from "lucide-react";

import ThreeDRenderer from '@/components/ThreeDRenderer';
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from '@/contexts/AuthContext';
import { analyzeCarShape } from '@/lib/carShapeAnalyzer';
import { mapAnalysisToTemplate } from '@/lib/carTemplateMapper';
import { db } from '@/lib/firebase';
import type { Firestore } from 'firebase/firestore';
import { collection, addDoc, serverTimestamp, setDoc, doc, getDoc, updateDoc, increment, arrayUnion } from 'firebase/firestore';
import * as THREE from 'three';
import jsPDF from 'jspdf';

type DrawingTool = 'pen' | 'eraser';

// 공통 스타일 상수
const CARD_STYLES = "bg-white/90 backdrop-blur-sm border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden py-5 mx-4 md:mx-0";
const CARD_STYLES_ROUNDED = "bg-white/90 backdrop-blur-sm border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 rounded-2xl overflow-hidden py-5 mx-4 md:mx-0";
const DRAWING_CANVAS_CARD_STYLES = "bg-white/95 border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden py-5 w-full rounded-2xl";
const THREE_D_RENDERER_CONTAINER = "w-full border-4 border-solid border-yellow-400/70 rounded-2xl overflow-hidden";
const PRIMARY_BUTTON_STYLES = "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 rounded-full px-6 py-3";
const PRIMARY_BUTTON_STYLES_SMALL = "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-6 py-2";

export default function DrawPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<'draw' | 'preview' | 'decorate' | 'export'>('draw');
  const [currentTool, setCurrentTool] = useState<DrawingTool>('pen');
  const [lineWidth, setLineWidth] = useState(3);
  const [color, setColor] = useState('#000000');
  const [isMobile, setIsMobile] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawing, setHasDrawing] = useState(false);
  const [hasBeenToPreview, setHasBeenToPreview] = useState(false);
  const [savedDrawingData, setSavedDrawingData] = useState<string | null>(null);
  const [drawingAnalysis, setDrawingAnalysis] = useState<any | null>(null); // 분석 결과 저장
  const [selectedCarType, setSelectedCarType] = useState<string | null>(null); // 사용자가 선택한 차종
  const [showGalleryShareModal, setShowGalleryShareModal] = useState(false);
  const [shareTitle, setShareTitle] = useState('');
  const [shareTags, setShareTags] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [saveTitle, setSaveTitle] = useState('');
  const [saveDescription, setSaveDescription] = useState('');
  const [pendingSaveTitle, setPendingSaveTitle] = useState('');
  const [showGallerySuccessModal, setShowGallerySuccessModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showSplashScreen, setShowSplashScreen] = useState(false);
  
  // 로그인 유도 모달 상태
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginModalType, setLoginModalType] = useState<'share' | 'download'>('share');
  
  // 꾸미기 기능을 위한 상태들
  const [carColor, setCarColor] = useState('#FFFFFF');
  const [roofColor, setRoofColor] = useState('#FFFFFF');
  const [headlightColor, setHeadlightColor] = useState('#87CEEB');
  const [taillightColor, setTaillightColor] = useState('#FF6B6B');
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  
  // 모달이 열릴 때 배경 스크롤 방지
  useScrollLock(!!selectedItem);
  
  const [selectedWheel, setSelectedWheel] = useState<string | null>(null);
  const [selectedBadge, setSelectedBadge] = useState<string | null>(null);
  const [selectedPlate, setSelectedPlate] = useState<string | null>(null);
  
  // 각 카테고리별 선택된 옵션 상태
  const [selectedHeadlight, setSelectedHeadlight] = useState<string | null>(null);
  const [selectedTaillight, setSelectedTaillight] = useState<string | null>(null);
  const [selectedGrille, setSelectedGrille] = useState<string | null>(null);
  
  // 적용된 아이템들을 추적하는 상태
  const [appliedItems, setAppliedItems] = useState<Set<string>>(new Set());
  
  // 도안 관련 상태
  const [blueprintGenerated, setBlueprintGenerated] = useState(false);
  const [blueprintGenerating, setBlueprintGenerating] = useState(false);
  const [blueprintImages, setBlueprintImages] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);

  // 클라이언트 렌더링 감지
  useEffect(() => {
    setIsClient(true);
    // 클라이언트에서 초기 모바일 상태 설정
    setIsMobile(window.innerWidth <= 768);
  }, []);

  // 스플래시 화면 표시 로직 (로그인하지 않은 사용자에게만)
  useEffect(() => {
    // 로딩 중이거나 클라이언트가 아닐 때는 스플래시를 표시하지 않음
    if (!isClient || loading) {
      setShowSplashScreen(false);
      return;
    }
    
    // 로딩이 완료된 후에만 스플래시 표시 여부 결정
    if (!user) {
      setShowSplashScreen(true);
    } else {
      setShowSplashScreen(false);
    }
  }, [isClient, user, loading]);

  // 로그인 모달 열기
  const openLoginModal = (type: 'share' | 'download') => {
    setLoginModalType(type);
    setShowLoginModal(true);
  };

  // 로그인 모달 닫기
  const closeLoginModal = () => {
    setShowLoginModal(false);
    setLoginModalType('share');
  };

  // 로그인하고 액션 수행
  const handleLoginAndAction = () => {
    closeLoginModal();
    window.location.href = '/auth';
  };

  // 화면 크기 감지 (클라이언트에서만 실행)
  useEffect(() => {
    const checkScreenSize = () => {
      const newIsMobile = window.innerWidth <= 768;
      setIsMobile(newIsMobile);
    };

    // 초기 설정은 위의 useEffect에서 처리됨

    // 리사이즈 이벤트 리스너 (디바운싱 추가)
    let resizeTimeout: NodeJS.Timeout;
    const debouncedCheckScreenSize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(checkScreenSize, 100);
    };

    window.addEventListener('resize', debouncedCheckScreenSize);
    window.addEventListener('orientationchange', checkScreenSize);

    return () => {
      window.removeEventListener('resize', debouncedCheckScreenSize);
      window.removeEventListener('orientationchange', checkScreenSize);
      clearTimeout(resizeTimeout);
    };
  }, [isMobile]);

  // 도안 만들기 버튼 클릭 핸들러
  const handleGenerateBlueprint = () => {
    setCurrentStep('export'); // 바로 페이지 이동
    // 도안 생성은 useEffect에서 자동으로 처리됨
  };

  // 스플래시 화면 핸들러들
  const handleCloseSplash = () => {
    setShowSplashScreen(false);
  };

  const handleSignUpFromSplash = () => {
    setShowSplashScreen(false);
    router.push('/auth?mode=signup');
  };

  // 화면 크기 변경 시 캔버스 재초기화
  useEffect(() => {
    if (canvasRef.current) {
      // 약간의 지연을 두고 재초기화 (DOM 업데이트 완료 후)
      setTimeout(() => {
        initializeCanvas();
      }, 50);
    }
  }, [isMobile]);


  // 3D 렌더러 참조 (도안용)
  const threeDRendererRef = useRef<{ 
    getRenderer: () => THREE.WebGLRenderer | null;
    getScene: () => THREE.Scene | null;
    getCamera: () => THREE.PerspectiveCamera | null;
    forceRender: () => void;
  }>(null);

  // 3D 렌더러 참조 (썸네일용)
  const thumbnailRendererRef = useRef<{ 
    getRenderer: () => THREE.WebGLRenderer | null;
    getScene: () => THREE.Scene | null;
    getCamera: () => THREE.PerspectiveCamera | null;
    forceRender: () => void;
  }>(null);


  // 썸네일용 스냅샷 캡처 함수
  const captureThumbnailSnapshot = useCallback((): Promise<string | null> => {
    return new Promise((resolve) => {
      const tryCapture = (attempts = 0) => {
        const renderer = thumbnailRendererRef.current?.getRenderer();
        
        if (!renderer || !renderer.domElement) {
          if (attempts < 15) {
            setTimeout(() => tryCapture(attempts + 1), 1000);
          } else {
            console.error('❌ 썸네일용 렌더러를 찾을 수 없습니다');
            resolve(null);
          }
          return;
        }
        
        try {
          // 렌더러 강제 렌더링
          if (thumbnailRendererRef.current?.forceRender) {
            thumbnailRendererRef.current.forceRender();
          }
          
          // 더 긴 대기 후 캡처
          setTimeout(() => {
            try {
              const dataURL = renderer.domElement.toDataURL('image/png');
              resolve(dataURL);
            } catch (error) {
              console.error('❌ 썸네일용 스냅샷 캡처 실패:', error);
              if (attempts < 15) {
                setTimeout(() => tryCapture(attempts + 1), 1000);
              } else {
                resolve(null);
              }
            }
          }, 300);
        } catch (error) {
          console.error('❌ 썸네일용 스냅샷 캡처 실패:', error);
          if (attempts < 15) {
            setTimeout(() => tryCapture(attempts + 1), 1000);
          } else {
            resolve(null);
          }
        }
      };
      
      tryCapture();
    });
  }, [thumbnailRendererRef]);


  // 블루프린트용 이미지 생성 함수 (모바일 해상도에 따른 리사이징 적용)
  const createBlueprintFromSnapshot = (snapshotDataUrl: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(snapshotDataUrl);
          return;
        }

        // 기본 크롭 사이즈 (4:3 비율)
        const baseCropWidth = 650;
        const baseCropHeight = 488; // 4:3 비율
        
        // 데스크톱과 모바일 모두 2배 크롭 사이즈 사용
        const cropWidth = baseCropWidth * 2; // 1300
        const cropHeight = baseCropHeight * 2; // 976
        
        // 스냅샷의 크기에 맞춰 크롭 사이즈 조정
        const maxCropWidth = Math.min(cropWidth, img.width);
        const maxCropHeight = Math.min(cropHeight, img.height);
        const actualCropWidth = maxCropWidth;
        const actualCropHeight = maxCropHeight;
        
        // 크롭 위치 (해상도에 따라 조정)
        const centerX = (img.width - actualCropWidth) / 2;
        const centerY = (img.height - actualCropHeight) / 2;
        
        // 데스크톱과 모바일 모두 2배 오프셋 사용
        const offsetX = 40 * 2; // 80px
        const offsetY = 100 * 2; // 200px
        
        const cropX = centerX - offsetX;
        const cropY = centerY - offsetY;
        
        // 데스크톱과 모바일 모두 2배 크롭 후 리사이징 적용
        if (img.width > 1000) {
          // 고해상도 스냅샷을 기본 크기로 리사이징
          const targetWidth = baseCropWidth; // 650
          const targetHeight = baseCropHeight; // 488
          
          canvas.width = targetWidth;
          canvas.height = targetHeight;
          
          // 크롭된 이미지를 기본 크기로 리사이징하여 그리기
          ctx.drawImage(
            img,
            cropX, cropY, actualCropWidth, actualCropHeight,  // 소스 크롭 영역 (2배 크기)
            0, 0, targetWidth, targetHeight  // 타겟 크기 (기본 크기로 리사이징)
          );
        } else {
          // 저해상도는 원본 크기 유지
          canvas.width = actualCropWidth;
          canvas.height = actualCropHeight;
          
          ctx.drawImage(
            img,
            cropX, cropY, actualCropWidth, actualCropHeight,  // 소스 크롭 영역
            0, 0, actualCropWidth, actualCropHeight  // 타겟 크기 (원본 크기 유지)
          );
        }
        
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = () => {
        console.error('❌ 블루프린트용 이미지 로드 실패');
        resolve(snapshotDataUrl);
      };
      img.src = snapshotDataUrl;
    });
  };

  // 공통 헤더/푸터 함수 (원래 서식 복원)
  const drawCommonHeaderFooter = async (ctx: CanvasRenderingContext2D, a4Width: number, a4Height: number) => {
    // 로고 (좌측상단) - 원래 서식
    const logoImg = new Image();
    await new Promise<void>((resolve) => {
      logoImg.onload = () => {
        const logoSize = 150; // 원래 크기
        const logoX = 50; // 좌측 상단에서 50px 떨어진 위치
        const logoY = 20; // 상단에서 20px 떨어진 위치
        ctx.drawImage(logoImg, logoX, logoY, logoSize, logoSize);
        resolve();
      };
      logoImg.onerror = () => {
        // 로고 로드 실패 시 텍스트로 대체
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('BOXRO', 50, 40);
        resolve();
      };
      logoImg.src = '/logo.png';
    });
    
    // 설명 텍스트 (로고 오른쪽에 좌측 정렬) - 조정된 위치
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('From BOXRO, Made for the Planet & Play.', 240, 70); // 60 → 70 (10px 아래로)
    
    ctx.font = '22px Arial';
    ctx.fillText('아이들이 직접 디자인하고 조립하며,', 240, 105); // 100 → 105 (5px 아래로)
    ctx.fillText('창의력과 손끝 감각을 키우는 친환경 메이킹 놀이예요. ✨', 240, 135); // 130 → 135 (5px 아래로)
    
    // 도안 생성날짜 (오른쪽상단) - 원래 서식
    const now = new Date();
    const dateStr = now.getFullYear() + '.' +
                   String(now.getMonth() + 1).padStart(2, '0') + '.' +
                   String(now.getDate()).padStart(2, '0') + ' ' +
                   String(now.getHours()).padStart(2, '0') + ':' +
                   String(now.getMinutes()).padStart(2, '0');
    ctx.fillStyle = '#000000';
    ctx.font = '18px Arial';
    ctx.textAlign = 'right';
    ctx.fillText('도안 생성일자 : ' + dateStr, a4Width - 50, 80);
    
    // Copyright (아래 가운데) - 원래 서식
    ctx.fillStyle = '#000000';
    ctx.font = '18px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('ⓒ 2022 Boxro All rights reserved.', a4Width / 2, a4Height - 60);
  };

  // 3D 모델 기반 도안 전개도 생성 함수 (A4 가로 방향, 여러 장)
  const generateBlueprint = useCallback(async () => {
    // A4 가로 방향 (297mm × 210mm) - 150DPI 기준 (50% 해상도)
    const a4Width = 1754;  // 297mm × 150DPI / 25.4mm (기존 3508의 50%)
    const a4Height = 1240; // 210mm × 150DPI / 25.4mm (기존 2480의 50%)
    
    // 도안 페이지들 생성
    const pages = [];
    
    // 차종 정보
    const carType = selectedCarType || drawingAnalysis?.analysis?.carType || "sedan";
    
    // 현재 선택된 차량 색상
    const currentCarColor = carColor;

    // 3D 렌더러와 정확히 동일한 비율
    const baseTotalLength = 6.0;
    const totalLength = carType === 'sedan-type2' ? baseTotalLength * 1.2 : baseTotalLength;
    const totalHeight = 3.0;
    const totalDepth = 2.5;

    // A4 페이지에 맞는 스케일 팩터 (실제 크기 13.5cm로 출력)
    // totalLength = 6.0이므로, 6.0 * scale = 135mm (13.5cm)가 되도록
    // scale = 135mm / 6.0 = 22.5mm per unit
    // 150DPI 기준: 22.5mm * 150DPI / 25.4mm = 133 pixels per unit
    const scale = 133; // 1 unit = 133 pixels (약 22.5mm) - 총 길이 13.5cm
    
    // 각 면을 별도 페이지로 생성하는 함수
    const createPage = async (title: string, drawFunction: (ctx: CanvasRenderingContext2D) => void | Promise<void>) => {
      const canvas = document.createElement('canvas');
      canvas.width = a4Width;
      canvas.height = a4Height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      // 배경을 흰색으로
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 페이지 제목
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 48px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(title, canvas.width / 2, 80);
      
      
      // 도안 그리기 (async 지원)
      const result = drawFunction(ctx);
      if (result instanceof Promise) {
        await result;
      }
      
      return canvas.toDataURL('image/png');
    };

    // 3D 렌더러의 createSedanShape 함수를 정확히 복사
    const createSedanShape = () => {
      const bonnetHeight = totalHeight * 0.4;
      const cabinHeight = totalHeight * 0.84;
      const trunkHeight = totalHeight * 0.5;
      
      return [
        [-totalLength/2, 0],
        [-totalLength/2, bonnetHeight],
        [-totalLength/4, bonnetHeight * 1.4],
        [-totalLength/10, cabinHeight],
        [totalLength/6, cabinHeight],
        [totalLength/3.2, trunkHeight * 1.1],
        [totalLength/2, trunkHeight],
        [totalLength/2, 0]
      ];
    };

  // 3D 좌표에서 부품 길이 계산 함수
  const getPartLength = (startIndex: number, endIndex: number) => {
    const coords = createSedanShape();
    return Math.abs(coords[endIndex][0] - coords[startIndex][0]);
    };

    const createSedanType2Shape = () => {
      const bonnetHeight = totalHeight * 0.4;
      const cabinHeight = totalHeight * 0.84;
      const trunkHeight = totalHeight * 0.5;
      
      return [
        [-totalLength/2, 0],
        [-totalLength/2, bonnetHeight * 1.0],
        [-totalLength/4, bonnetHeight * 1.3],
        [-totalLength/10, cabinHeight],
        [totalLength/5.5, cabinHeight],
        [totalLength/3, trunkHeight * 1.02],
        [totalLength/2, trunkHeight * 0.9],
        [totalLength/2, 0]
      ];
    };

    const createSuvShape = () => {
      // SUV: 3D 렌더러와 동일한 모양
      const bonnetHeight = totalHeight * 0.4;   // 보닛 (템플릿과 동일)
      const cabinHeight = totalHeight * 0.84;   // 캐빈 (템플릿과 동일)
      
      return [
        [-totalLength/2, 0],
        [-totalLength/2, bonnetHeight],
        [-totalLength/4, bonnetHeight * 1.4], // 템플릿과 동일한 경사
        [-totalLength/10, cabinHeight], // A필러 (앞유리) - 템플릿과 동일한 각도
        [totalLength/2.5, cabinHeight], // 캐빈 지붕 - SUV는 뒤로 쭉 늘림 (트렁크 없음)
        [totalLength/2, cabinHeight * 0.6], // 뒷 창문 경사도 (C필러) - 템플릿과 동일
        [totalLength/2, 0] // 뒷부분 직각으로 바닥까지
      ];
    };

    const createTruckShape = () => {
      const bonnetHeight = totalHeight * 0.4;
      const cabinHeight = totalHeight * 0.84;
      const bedHeight = totalHeight * 0.4;
      
      return [
        [-totalLength/2, 0],
        [-totalLength/2, bonnetHeight],
        [-totalLength/3, cabinHeight],
        [totalLength/500, cabinHeight],
        [totalLength/500, bedHeight],
        [totalLength/1.5, bedHeight],
        [totalLength/1.5, 0]
      ];
    };

  const createBusShape = () => {
    // 버스: 3D 렌더러와 동일한 모양
    const bonnetHeight = totalHeight * 0.4;
    const cabinHeight = totalHeight * 0.84;
    
    return [
      [-totalLength/2, 0],
      [-totalLength/2, bonnetHeight],
      [-totalLength/3, cabinHeight], // A필러
      [totalLength/1.8, cabinHeight], // 캐빈 지붕 - 3D 렌더러와 동일하게 수정
      [totalLength/1.8, 0] // 뒷부분 직각으로 바닥까지
    ];
  };

  const createBusType2Shape = () => {
    // 통통버스: 3D 렌더러와 동일한 모양 (직각 테일게이트)
    const bonnetHeight = totalHeight * 0.4;
    const cabinHeight = totalHeight * 0.84;
    
    return [
      [-totalLength/2, 0],
      [-totalLength/2, bonnetHeight],
      [-totalLength/4, bonnetHeight * 1.4], // 보닛 경사
      [-totalLength/10, cabinHeight], // A필러
      [totalLength/2, cabinHeight], // 캐빈 지붕 - 뒤로 쭉 늘림
      [totalLength/2, 0] // 뒷부분 직각으로 바닥까지
    ];
  };

    const createSportsShape = () => {
      // 스포츠카: 3D 렌더러와 동일한 모양 (낮고 길쭉한 형태)
      const bonnetHeight = totalHeight * 0.25;   // 보닛 (낮게)
      const cabinHeight = totalHeight * 0.6;    // 캐빈 (낮게)
      const trunkHeight = totalHeight * 0.3;    // 트렁크 (낮게)
      
      return [
        [-totalLength/2, 0],
        [-totalLength/2, bonnetHeight * 1.4], // 보닛 시작점 1.4로 조정
        [-totalLength/5, bonnetHeight * 1.7], // 보닛 끝점 위로 조금만 올림
        [-totalLength/25, cabinHeight * 1.15], // A필러 (앞유리) - 경사가 강함
        [totalLength/5, cabinHeight * 1.1], // 캐빈 지붕 - 짧고 낮음
        [totalLength/2.5, trunkHeight * 1.5], // C필러 (뒷유리) - 강한 경사
        [totalLength/2, trunkHeight * 1.1], // 트렁크 (뒷부분) - 낮고 짧음
        [totalLength/2, 0]
      ];
    };

    // 차종별 Shape 선택
    let carShapePoints;
    switch (carType) {
      case 'sedan':
        carShapePoints = createSedanShape();
        break;
      case 'sedan-type2':
        carShapePoints = createSedanType2Shape();
        break;
      case 'suv':
        carShapePoints = createSuvShape();
        break;
      case 'truck':
        carShapePoints = createTruckShape();
        break;
      case 'bus':
        carShapePoints = createBusShape();
        break;
        case 'bus-type2':
          carShapePoints = createBusType2Shape(); // bus-type2는 별도의 모양 사용
          break;
      case 'sports':
        carShapePoints = createSportsShape();
        break;
      default:
        carShapePoints = createSedanShape();
    }

    // 썸네일용 스냅샷 먼저 캡처 (렌더러 초기화 대기)
    await new Promise(resolve => setTimeout(resolve, 2000)); // 2초 대기
    const thumbnailSnapshotDataUrl = await captureThumbnailSnapshot();
    
    if (!thumbnailSnapshotDataUrl) {
      throw new Error('썸네일용 스냅샷 캡처 실패');
    }
    
    // 650x650 크롭된 이미지를 갤러리 썸네일과 블루프린트 모두에 사용
    const sharedImageDataUrl = await createBlueprintFromSnapshot(thumbnailSnapshotDataUrl);
    
    // 공유 이미지를 Image 객체로 변환 (갤러리와 블루프린트 모두 사용)
    const snapshotImg = new Image();
    await new Promise((resolve, reject) => {
      snapshotImg.onload = resolve;
      snapshotImg.onerror = reject;
      snapshotImg.src = sharedImageDataUrl;
    });
    
    // 페이지 1: 스냅샷과 정보
    const snapshotPage = await createPage('', async (ctx) => {
      // 배경
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, a4Width, a4Height);
      
      // === 1페이지 스냅샷 설정 (메모) ===
      // 스냅샷은 원본 비율 그대로 유지 (naturalWidth, naturalHeight 사용)
      // 텍스트는 스냅샷 위치와 무관하게 고정값 사용
      // 모바일과 데스크톱 도면은 동일해야 함
      // 
      // 스냅샷 위치: 모바일/데스크톱 Y=440px (동일)
      // 스냅샷 크기: 원본 크기 그대로 사용
      // 텍스트 위치: Y=1000px, Y=1030px (고정값)
      // 3D 렌더러 카메라: camera.position.set(-6.6, 2.5, 4.8) 고정
      // 그리드 색상: 0xF0F0F0, 0xF5F5F5 (연한 회색)
      // 
      // 나중에 다시 조정할 때 이 설정을 참고할 것!
      
      // 3D 렌더링 스냅샷 영역 (중앙) - 원본 크기 그대로 사용
      const isMobile = window.innerWidth < 768;
      // 스냅샷 원본 크기 그대로 사용
      const snapshotWidth = snapshotImg.naturalWidth;
      const snapshotHeight = snapshotImg.naturalHeight;
      const snapshotX = (a4Width - snapshotWidth) / 2;
      const snapshotY = 440; // 450 - 10
      
      
      
              // 3D 렌더링 스냅샷 그리기
              if (snapshotImg && snapshotImg instanceof HTMLImageElement) {
                ctx.drawImage(snapshotImg, snapshotX, snapshotY, snapshotWidth, snapshotHeight);
              } else {
                // 스냅샷을 캡처할 수 없으면 플레이스홀더 표시
                ctx.fillStyle = '#E9ECEF';
                ctx.fillRect(snapshotX, snapshotY, snapshotWidth, snapshotHeight);
                
                ctx.fillStyle = '#6C757D';
                ctx.font = 'bold 32px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('3D 박스카 스냅샷', a4Width / 2, snapshotY + snapshotHeight / 2 - 20);
                ctx.font = '20px Arial';
                ctx.fillText('(스냅샷을 캡처할 수 없습니다)', a4Width / 2, snapshotY + snapshotHeight / 2 + 20);
              }
      
      // 로고+타이틀+설명문 통합 이미지 (레이어 최상단으로 이동)
      const titleImg = new Image();
      await new Promise((resolve, reject) => {
        titleImg.onload = () => {
          // 원본 이미지 비율 계산 (1526 × 1054)
          const originalWidth = titleImg.naturalWidth;
          const originalHeight = titleImg.naturalHeight;
          const aspectRatio = originalWidth / originalHeight;
          
          // 최대 너비 설정 (A4 페이지에 맞게)
          const maxWidth = 400;
          const calculatedWidth = Math.min(maxWidth, originalWidth);
          const calculatedHeight = calculatedWidth / aspectRatio;
          
          // 중앙 정렬
          const titleImgX = a4Width / 2 - calculatedWidth / 2;
          const titleImgY = 150;
          
          console.log('🔍 로고 이미지 크기:', {
            original: `${originalWidth} × ${originalHeight}`,
            aspectRatio: aspectRatio.toFixed(3),
            calculated: `${calculatedWidth} × ${calculatedHeight.toFixed(2)}`
          });
          
          ctx.drawImage(titleImg, titleImgX, titleImgY, calculatedWidth, calculatedHeight);
          resolve(true);
        };
        titleImg.onerror = () => {
          ctx.fillStyle = '#1e40af';
          ctx.font = 'bold 24px Arial';
          ctx.textAlign = 'center';
          ctx.fillText('BOXRO MAKER', a4Width / 2, 180);
          resolve(true);
        };
        titleImg.src = '/logo+title.png';
      });
      
      // 정보 섹션 (하단) - 데스크톱에서만 텍스트를 아래로 200px 내림
      const infoY = snapshotY + 506 + 60 + (isMobile ? 0 : 200); // 모바일: 원래 위치, 데스크톱: 200px 아래로
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 20px Arial';
      ctx.textAlign = 'left';
      
        
        // 생성날짜 (오른쪽 상단, 팩스 번호 스타일)
        const now = new Date();
        const dateStr = now.getFullYear() + '.' + 
                       String(now.getMonth() + 1).padStart(2, '0') + '.' + 
                       String(now.getDate()).padStart(2, '0') + ' ' + 
                       String(now.getHours()).padStart(2, '0') + ':' + 
                       String(now.getMinutes()).padStart(2, '0');
        
        // 오른쪽 상단에 도안 생성일자 표시
        ctx.font = '18px Arial';
        ctx.textAlign = 'right';
        ctx.fillText('도안 생성일자 : ' + dateStr, a4Width - 50, 80);
      
      // 설명 텍스트 (가운데 정렬) - 스냅샷과 무관하게 고정 위치
      ctx.font = 'bold 24px Arial';
      ctx.textAlign = 'center';
      const textY1 = 985; // 990 → 985 (5px 위로)
      ctx.fillText('From BOXRO, Made for the Planet & Play.', a4Width / 2, textY1);
      
      ctx.font = '22px Arial';
      const textY2 = 1025; // 1030 → 1025 (5px 위로)
      ctx.fillText('아이들이 직접 디자인하고 조립하며,', a4Width / 2, textY2);
      const textY3 = 1055; // 1060 → 1055 (5px 위로)
      ctx.fillText('창의력과 손끝 감각을 키우는 친환경 메이킹 놀이예요. ✨', a4Width / 2, textY3);
      
      // Copyright (가운데 정렬)
      ctx.font = '18px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('ⓒ 2022 Boxro All rights reserved.', a4Width / 2, a4Height - 60);
    });

    // 페이지 2
    const sideViewPage = await createPage('', async (ctx) => {
      // 공통 헤더/푸터 적용 (먼저 그리기)
      await drawCommonHeaderFooter(ctx, a4Width, a4Height);
      
      const centerX = a4Width / 2;
      const topCenterY = a4Height / 3 + 200;
      const bottomCenterY = a4Height * 2 / 3 + 200;
      
      // 차량 타입 확인
      const currentCarType = selectedCarType || drawingAnalysis?.analysis?.carType || "sedan";
      
      // 위쪽 그리기
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.fillStyle = currentCarColor;
      
      if (currentCarType === 'bus-type2') {
        // 통통버스: 일반적인 측면 그리기
        ctx.beginPath();
        carShapePoints.forEach((point, index) => {
          const x = centerX + point[0] * scale;
          const y = topCenterY - point[1] * scale;
          
          if (index === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        });
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else {
        // 다른 차종: 기존 방식
        ctx.beginPath();
        (carShapePoints as number[][]).forEach((point, index) => {
          const x = centerX + point[0] * scale;
          const y = topCenterY - point[1] * scale;
          
          if (index === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        });
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
      
      // 위쪽 창문 그리기
      ctx.fillStyle = '#87CEEB'; // 하늘색
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1;
      
      if (currentCarType === 'sedan-type2') {
        // 큰세단: sedan-type2 (나중에 추가된 큰 세단) - 3D 렌더러 좌표 기반으로 창문 2개 구현
        
        // 앞창문 (3D 렌더러 좌표: X=-0.75, Y=totalHeight*0.808)
        // 차체 캐빈 부분에 맞춰 위치 조정 (캐빈 시작: -totalLength/10, 끝: totalLength/6)
        // 3D 렌더러에서 -0.75는 차체 중심 기준이므로, 캐빈 부분에 맞춰 조정
        const sedan1FrontWindowX = centerX - totalLength * 0.1 * scale; // 캐빈 앞부분에 위치 (오른쪽으로 이동)
        const frontWindowY = topCenterY - totalHeight * 0.65 * scale; // 통통버스와 동일하게 조정
        
        ctx.beginPath();
        // 3D 렌더러 좌표를 캔버스 좌표로 변환 (Y축 반전)
        ctx.moveTo(sedan1FrontWindowX - 0.35 * scale, frontWindowY + 0.35 * scale); // 왼쪽 아래
        ctx.lineTo(sedan1FrontWindowX + 0.7 * scale, frontWindowY + 0.35 * scale);  // 오른쪽 아래
        ctx.lineTo(sedan1FrontWindowX + 0.7 * scale, frontWindowY - 0.28 * scale);  // 오른쪽 위
        ctx.lineTo(sedan1FrontWindowX + 0.2 * scale, frontWindowY - 0.28 * scale);  // 왼쪽 위
        ctx.closePath();
        ctx.fillStyle = '#87CEEB'; // 하늘색
        ctx.fill();
        ctx.stroke();
        
        // 뒷창문 (3D 렌더러 좌표: X=0.80, Y=totalHeight*0.808)
        // 차체 캐빈 부분에 맞춰 위치 조정 (캐빈 끝: totalLength/6)
        const rearWindowX = centerX + totalLength * 0.12 * scale; // 캐빈 뒷부분에 위치 (왼쪽으로 이동)
        const rearWindowY = topCenterY - totalHeight * 0.65 * scale; // 통통버스와 동일하게 조정
        
        ctx.beginPath();
        // 3D 렌더러 좌표를 캔버스 좌표로 변환 (Y축 반전)
        ctx.moveTo(rearWindowX - 0.55 * scale, rearWindowY + 0.35 * scale); // 왼쪽 아래
        ctx.lineTo(rearWindowX + 0.8 * scale, rearWindowY + 0.35 * scale);  // 오른쪽 아래
        ctx.lineTo(rearWindowX + 0.12 * scale, rearWindowY - 0.28 * scale); // 오른쪽 위
        ctx.lineTo(rearWindowX - 0.55 * scale, rearWindowY - 0.28 * scale); // 왼쪽 위
        ctx.closePath();
        ctx.fillStyle = '#87CEEB'; // 하늘색
        ctx.fill();
        ctx.stroke();
      } else if (currentCarType === 'sedan') {
        // 꼬마세단: sedan (기본 세단) - 3D 렌더러 좌표 기반으로 창문 2개 구현
        
        // 앞창문 (3D 렌더러 좌표: X=-0.75, Y=totalHeight*0.808)
        // 차체 캐빈 부분에 맞춰 위치 조정 (캐빈 시작: -totalLength/10, 끝: totalLength/6)
        // 3D 렌더러에서 -0.75는 차체 중심 기준이므로, 캐빈 부분에 맞춰 조정
        const sedan1FrontWindowX = centerX - totalLength * 0.11 * scale; // 캐빈 앞부분에 위치 (0.01 오른쪽으로)
        const frontWindowY = topCenterY - totalHeight * 0.65 * scale; // 통통버스와 동일하게 조정
        
        ctx.beginPath();
        // 3D 렌더러 좌표를 캔버스 좌표로 변환 (Y축 반전)
        ctx.moveTo(sedan1FrontWindowX - 0.35 * scale, frontWindowY + 0.35 * scale); // 왼쪽 아래
        ctx.lineTo(sedan1FrontWindowX + 0.7 * scale, frontWindowY + 0.35 * scale);  // 오른쪽 아래
        ctx.lineTo(sedan1FrontWindowX + 0.7 * scale, frontWindowY - 0.28 * scale);  // 오른쪽 위
        ctx.lineTo(sedan1FrontWindowX + 0.2 * scale, frontWindowY - 0.28 * scale);  // 왼쪽 위
        ctx.closePath();
        ctx.fillStyle = '#87CEEB'; // 하늘색
        ctx.fill();
        ctx.stroke();
        
        // 뒷창문 (3D 렌더러 좌표: X=0.85, Y=totalHeight*0.808)
        // 차체 캐빈 부분에 맞춰 위치 조정 (캐빈 끝: totalLength/6)
        const rearWindowX = centerX + totalLength * 0.14 * scale; // 캐빈 뒷부분에 위치 (0.01 오른쪽으로)
        const rearWindowY = topCenterY - totalHeight * 0.65 * scale; // 통통버스와 동일하게 조정
        
        ctx.beginPath();
        // 3D 렌더러 좌표를 캔버스 좌표로 변환 (Y축 반전)
        ctx.moveTo(rearWindowX - 0.55 * scale, rearWindowY + 0.35 * scale); // 왼쪽 아래
        ctx.lineTo(rearWindowX + 0.5 * scale, rearWindowY + 0.35 * scale);  // 오른쪽 아래
        ctx.lineTo(rearWindowX + 0.02 * scale, rearWindowY - 0.28 * scale); // 오른쪽 위
        ctx.lineTo(rearWindowX - 0.55 * scale, rearWindowY - 0.28 * scale); // 왼쪽 위
        ctx.closePath();
        ctx.fillStyle = '#87CEEB'; // 하늘색
        ctx.fill();
        ctx.stroke();
      } else if (currentCarType === 'truck') {
        // 빵빵트럭: truck (트럭) - 3D 렌더러 좌표 기반으로 앞창문 1개 구현
        
        // 앞창문 (3D 렌더러 좌표: translate(-1.9, totalHeight * 0.808, ...))
        // 차체 캐빈 부분에 맞춰 위치 조정
        const sedan1FrontWindowX = centerX - totalLength * 0.3 * scale; // 캐빈 앞부분에 위치 (오른쪽으로 이동)
        const frontWindowY = topCenterY - totalHeight * 0.64 * scale; // 0.01 아래로 내림
        
        ctx.beginPath();
        // 3D 렌더러 좌표를 캔버스 좌표로 변환 (Y축 반전)
        ctx.moveTo(sedan1FrontWindowX - 0.35 * scale, frontWindowY + 0.35 * scale); // 왼쪽 아래
        ctx.lineTo(sedan1FrontWindowX + 1.0 * scale, frontWindowY + 0.35 * scale);  // 오른쪽 아래
        ctx.lineTo(sedan1FrontWindowX + 1.0 * scale, frontWindowY - 0.28 * scale);  // 오른쪽 위
        ctx.lineTo(sedan1FrontWindowX + 0.02 * scale, frontWindowY - 0.28 * scale); // 왼쪽 위
        ctx.closePath();
        ctx.fillStyle = '#87CEEB'; // 하늘색
        ctx.fill();
        ctx.stroke();
      } else if (currentCarType === 'bus') {
        // 네모버스: bus (네모난 버스) - 3D 렌더러 좌표 기반으로 창문 4개 구현
        
        // 앞창문 (3D 렌더러 좌표: translate(-1.9, totalHeight * 0.808, ...))
        // 차체 캐빈 부분에 맞춰 위치 조정
        const sedan1FrontWindowX = centerX - totalLength * 0.3 * scale; // 캐빈 앞부분에 위치
        const frontWindowY = topCenterY - totalHeight * 0.65 * scale; // 꼬마세단과 동일하게 조정
        
        ctx.beginPath();
        // 3D 렌더러 좌표를 캔버스 좌표로 변환 (Y축 반전)
        ctx.moveTo(sedan1FrontWindowX - 0.35 * scale, frontWindowY + 0.35 * scale); // 왼쪽 아래
        ctx.lineTo(sedan1FrontWindowX + 0.8 * scale, frontWindowY + 0.35 * scale);  // 오른쪽 아래
        ctx.lineTo(sedan1FrontWindowX + 0.8 * scale, frontWindowY - 0.28 * scale);  // 오른쪽 위
        ctx.lineTo(sedan1FrontWindowX + 0.02 * scale, frontWindowY - 0.28 * scale); // 왼쪽 위
        ctx.closePath();
        ctx.fillStyle = '#87CEEB'; // 하늘색
        ctx.fill();
        ctx.stroke();
        
        // 추가 창문 3개 - 각각 개별적으로 위치 설정
        const windowWidth = 0.95 * scale; // 실제 창문 폭 (-0.35 ~ +0.6 = 0.95)
        const windowSpacing = 0.2 * scale; // 창문 간격
        const additionalWindowY = topCenterY - totalHeight * 0.65 * scale; // 꼬마세단과 동일하게 조정
        
        // 추가창문 1 (i=0) - 오른쪽으로 이동 후 왼쪽으로 0.08 조정
        let additionalWindowX1 = centerX - totalLength * 0.1 * scale + 0.3 * scale - 0.08 * scale;
        ctx.beginPath();
        ctx.moveTo(additionalWindowX1 - 0.35 * scale, additionalWindowY + 0.35 * scale);
        ctx.lineTo(additionalWindowX1 + 0.6 * scale, additionalWindowY + 0.35 * scale);
        ctx.lineTo(additionalWindowX1 + 0.6 * scale, additionalWindowY - 0.28 * scale);
        ctx.lineTo(additionalWindowX1 - 0.35 * scale, additionalWindowY - 0.28 * scale);
        ctx.closePath();
        ctx.fillStyle = '#87CEEB';
        ctx.fill();
        ctx.stroke();
        
        // 추가창문 2 (i=1) - 오른쪽으로 이동 후 왼쪽으로 0.01 조정
        let additionalWindowX2 = centerX - totalLength * 0.1 * scale + (windowWidth + windowSpacing) * 1 + 0.3 * scale + 0.02 * scale - 0.03 * scale;
        ctx.beginPath();
        ctx.moveTo(additionalWindowX2 - 0.35 * scale, additionalWindowY + 0.35 * scale);
        ctx.lineTo(additionalWindowX2 + 0.6 * scale, additionalWindowY + 0.35 * scale);
        ctx.lineTo(additionalWindowX2 + 0.6 * scale, additionalWindowY - 0.28 * scale);
        ctx.lineTo(additionalWindowX2 - 0.35 * scale, additionalWindowY - 0.28 * scale);
        ctx.closePath();
        ctx.fillStyle = '#87CEEB';
        ctx.fill();
        ctx.stroke();
        
        // 추가창문 3 (i=2) - 오른쪽으로 이동
        let additionalWindowX3 = centerX - totalLength * 0.1 * scale + (windowWidth + windowSpacing) * 2 + 0.3 * scale + 0.02 * scale + 0.05 * scale;
        ctx.beginPath();
        ctx.moveTo(additionalWindowX3 - 0.35 * scale, additionalWindowY + 0.35 * scale);
        ctx.lineTo(additionalWindowX3 + 0.6 * scale, additionalWindowY + 0.35 * scale);
        ctx.lineTo(additionalWindowX3 + 0.6 * scale, additionalWindowY - 0.28 * scale);
        ctx.lineTo(additionalWindowX3 - 0.35 * scale, additionalWindowY - 0.28 * scale);
        ctx.closePath();
        ctx.fillStyle = '#87CEEB';
        ctx.fill();
        ctx.stroke();
      } else if (currentCarType === 'bus-type2') {
        // 통통버스: bus-type2 (둥근 버스) - 측면 창문 3개 (새로 계산)
        
        // 첫 번째 창문: translate(-0.65, totalHeight * 0.808, ...)
        const window1X = centerX - 0.65 * scale;
        const window1Y = topCenterY - totalHeight * 0.65 * scale; // 미세하게 올림
        
        ctx.beginPath();
        ctx.moveTo(window1X - 0.35 * scale, window1Y + 0.35 * scale);
        ctx.lineTo(window1X + 1.0 * scale, window1Y + 0.35 * scale);
        ctx.lineTo(window1X + 1.0 * scale, window1Y - 0.28 * scale);
        ctx.lineTo(window1X + 0.25 * scale, window1Y - 0.28 * scale);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // 두 번째 창문: windowX = 1.0 (0.02 왼쪽으로 이동)
        const window2X = centerX + 1.0 * scale - 0.02 * scale;
        const window2Y = topCenterY - totalHeight * 0.65 * scale; // 미세하게 올림
        
        ctx.beginPath();
        ctx.moveTo(window2X - 0.35 * scale, window2Y + 0.35 * scale);
        ctx.lineTo(window2X + 0.55 * scale, window2Y + 0.35 * scale);
        ctx.lineTo(window2X + 0.55 * scale, window2Y - 0.28 * scale);
        ctx.lineTo(window2X - 0.35 * scale, window2Y - 0.28 * scale);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // 세 번째 창문: windowX = 2.15 (0.04 왼쪽으로 이동)
        const window3X = centerX + 2.2 * scale - 0.04 * scale; // 더 미세하게 오른쪽으로 이동
        const window3Y = topCenterY - totalHeight * 0.65 * scale; // 미세하게 올림
        
        ctx.beginPath();
        ctx.moveTo(window3X - 0.35 * scale, window3Y + 0.35 * scale);
        ctx.lineTo(window3X + 0.45 * scale, window3Y + 0.35 * scale);
        ctx.lineTo(window3X + 0.45 * scale, window3Y - 0.28 * scale);
        ctx.lineTo(window3X - 0.35 * scale, window3Y - 0.28 * scale);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
      
      // 바퀴 구멍 그리기 (3D 렌더러에서 타이어 좌표 가져옴)
      // 3D 렌더러: wheelX = [-totalLength * 0.35, totalLength * 0.35], wheelR = 0.6
      // 타이어 직경을 작게 줄인 상태의 구멍 (차체를 관통하는 원형 구멍)
      ctx.fillStyle = '#FFFFFF'; // 흰색으로 구멍 표시
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      
      // 앞바퀴 구멍 (왼쪽)
      const frontWheelX = centerX - totalLength * 0.35 * scale;
      const frontWheelY = topCenterY - totalHeight * 0.07 * scale; // 차체 하단에서 조금 더 아래로
      const wheelHoleRadius = 0.06 * scale; // 타이어 직경을 10%로 줄인 구멍 크기 (0.6 * 0.1 = 0.06)
      
      ctx.beginPath();
      ctx.arc(frontWheelX, frontWheelY, wheelHoleRadius, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
      
      // 뒷바퀴 구멍 (오른쪽)
      const rearWheelX = centerX + totalLength * 0.35 * scale;
      const rearWheelY = topCenterY - totalHeight * 0.07 * scale; // 차체 하단에서 조금 더 아래로
      
      ctx.beginPath();
      ctx.arc(rearWheelX, rearWheelY, wheelHoleRadius, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
      
      if (currentCarType === 'suv') {
        // SUV: suv (SUV) - 3D 렌더러 좌표 기반으로 창문 3개 구현
        
        // 앞창문 (3D 렌더러 좌표: translate(-0.65, totalHeight * 0.808, ...))
        // 차체 캐빈 부분에 맞춰 위치 조정
        const sedan1FrontWindowX = centerX - totalLength * 0.12 * scale; // 캐빈 앞부분에 위치 (0.02만큼 왼쪽으로 이동)
        const frontWindowY = topCenterY - totalHeight * 0.65 * scale; // 꼬마세단과 동일하게 조정
        
        ctx.beginPath();
        // 3D 렌더러 좌표를 캔버스 좌표로 변환 (Y축 반전)
        ctx.moveTo(sedan1FrontWindowX - 0.35 * scale, frontWindowY + 0.35 * scale); // 왼쪽 아래
        ctx.lineTo(sedan1FrontWindowX + 0.8 * scale, frontWindowY + 0.35 * scale);  // 오른쪽 아래
        ctx.lineTo(sedan1FrontWindowX + 0.8 * scale, frontWindowY - 0.28 * scale);  // 오른쪽 위
        ctx.lineTo(sedan1FrontWindowX + 0.25 * scale, frontWindowY - 0.28 * scale); // 왼쪽 위
        ctx.closePath();
        ctx.fillStyle = '#87CEEB'; // 하늘색
        ctx.fill();
        ctx.stroke();
        
        // 두 번째 창문 (측면 창문) - translate(0.8, totalHeight * 0.808, ...)
        const sideWindowX = centerX + totalLength * 0.12 * scale; // 캐빈 중간부분에 위치 (미세하게 왼쪽으로 이동)
        const sideWindowY = topCenterY - totalHeight * 0.65 * scale; // 꼬마세단과 동일하게 조정
        
        ctx.beginPath();
        // 3D 렌더러 좌표를 캔버스 좌표로 변환 (Y축 반전)
        ctx.moveTo(sideWindowX - 0.35 * scale, sideWindowY + 0.35 * scale); // 왼쪽 아래
        ctx.lineTo(sideWindowX + 0.6 * scale, sideWindowY + 0.35 * scale);  // 오른쪽 아래
        ctx.lineTo(sideWindowX + 0.6 * scale, sideWindowY - 0.28 * scale);  // 오른쪽 위
        ctx.lineTo(sideWindowX - 0.35 * scale, sideWindowY - 0.28 * scale); // 왼쪽 위
        ctx.closePath();
        ctx.fillStyle = '#87CEEB'; // 하늘색
        ctx.fill();
        ctx.stroke();
        
        // 세 번째 창문 (뒷창문) - translate(2.0, totalHeight * 0.808, ...)
        const thirdWindowX = centerX + totalLength * 0.32 * scale; // 캐빈 뒷부분에 위치 (미세하게 왼쪽으로 이동)
        const thirdWindowY = topCenterY - totalHeight * 0.65 * scale; // 꼬마세단과 동일하게 조정
        
        ctx.beginPath();
        // 3D 렌더러 좌표를 캔버스 좌표로 변환 (Y축 반전)
        ctx.moveTo(thirdWindowX - 0.35 * scale, thirdWindowY + 0.35 * scale); // 왼쪽 아래
        ctx.lineTo(thirdWindowX + 0.6 * scale, thirdWindowY + 0.35 * scale);  // 오른쪽 아래
        ctx.lineTo(thirdWindowX + 0.25 * scale, thirdWindowY - 0.28 * scale); // 오른쪽 위
        ctx.lineTo(thirdWindowX - 0.35 * scale, thirdWindowY - 0.28 * scale); // 왼쪽 위
        ctx.closePath();
        ctx.fillStyle = '#87CEEB'; // 하늘색
        ctx.fill();
        ctx.stroke();
      } else if (currentCarType === 'sports') {
        // 스포츠카: sports (스포츠카) - 3D 렌더러 좌표 기반으로 창문 1개 구현
        
        // 앞창문 (3D 렌더러 좌표: X=-0.75, Y=totalHeight*0.808)
        // 차체 캐빈 부분에 맞춰 위치 조정 (캐빈 시작: -totalLength/10, 끝: totalLength/6)
        // 3D 렌더러에서 -0.75는 차체 중심 기준이므로, 캐빈 부분에 맞춰 조정
        const sedan1FrontWindowX = centerX - totalLength * 0.06 * scale; // 캐빈 앞부분에 위치 (조금만 더 오른쪽으로 이동)
        const frontWindowY = topCenterY - totalHeight * 0.53 * scale; // 0.01 위쪽으로 이동
        
        ctx.beginPath();
        // 3D 렌더러 좌표를 캔버스 좌표로 변환 (Y축 반전)
        ctx.moveTo(sedan1FrontWindowX - 0.35 * scale, frontWindowY + 0.35 * scale); // 왼쪽 아래
        ctx.lineTo(sedan1FrontWindowX + 2.0 * scale, frontWindowY + 0.35 * scale);  // 오른쪽 아래
        ctx.lineTo(sedan1FrontWindowX + 1.5 * scale, frontWindowY - 0.12 * scale);  // 오른쪽 위
        ctx.lineTo(sedan1FrontWindowX + 0.2 * scale, frontWindowY - 0.18 * scale);  // 왼쪽 위
        ctx.closePath();
        ctx.fillStyle = '#87CEEB'; // 하늘색
        ctx.fill();
        ctx.stroke();
      }
      
      // 위쪽 라벨 추가 (좌측면도) - 도면 바로 아래에 배치
      ctx.fillStyle = '#333333';
      ctx.font = '16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('좌측면도', centerX, topCenterY + 30);
      
      // 아래쪽 그리기 (좌우반전)
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.fillStyle = currentCarColor;
      
      if (currentCarType === 'bus-type2') {
        // 통통버스: 일반적인 측면 그리기 (좌우반전)
        ctx.beginPath();
        carShapePoints.forEach((point, index) => {
          const x = centerX - point[0] * scale; // X축 반전
          const y = bottomCenterY - point[1] * scale;
          
          if (index === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        });
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else {
        // 다른 차종: 기존 방식 (좌우반전)
        ctx.beginPath();
        (carShapePoints as number[][]).forEach((point, index) => {
          const x = centerX - point[0] * scale; // X축 반전
          const y = bottomCenterY - point[1] * scale;
          
          if (index === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        });
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
      
      // 아래쪽 창문 그리기 (위쪽 복제, 좌우반전)
      ctx.fillStyle = '#87CEEB'; // 하늘색
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1;
      
      if (currentCarType === 'sedan-type2') {
        // 큰세단: sedan-type2 (나중에 추가된 큰 세단) - 3D 렌더러 좌표 기반으로 창문 2개 구현 (좌우반전)
        
        // 앞창문 (좌우반전)
        const sedan1FrontWindowX = centerX + totalLength * 0.1 * scale; // X축 반전
        const frontWindowY = bottomCenterY - totalHeight * 0.65 * scale;
        
        ctx.beginPath();
        // 좌우반전된 좌표
        ctx.moveTo(sedan1FrontWindowX + 0.35 * scale, frontWindowY + 0.35 * scale); // 오른쪽 아래
        ctx.lineTo(sedan1FrontWindowX - 0.7 * scale, frontWindowY + 0.35 * scale);  // 왼쪽 아래
        ctx.lineTo(sedan1FrontWindowX - 0.7 * scale, frontWindowY - 0.28 * scale);  // 왼쪽 위
        ctx.lineTo(sedan1FrontWindowX - 0.2 * scale, frontWindowY - 0.28 * scale);  // 오른쪽 위
        ctx.closePath();
        ctx.fillStyle = '#87CEEB';
        ctx.fill();
        ctx.stroke();
        
        // 뒷창문 (좌우반전)
        const rearWindowX = centerX - totalLength * 0.12 * scale; // X축 반전
        const rearWindowY = bottomCenterY - totalHeight * 0.65 * scale;
        
        ctx.beginPath();
        // 좌우반전된 좌표
        ctx.moveTo(rearWindowX + 0.55 * scale, rearWindowY + 0.35 * scale); // 오른쪽 아래
        ctx.lineTo(rearWindowX - 0.8 * scale, rearWindowY + 0.35 * scale);  // 왼쪽 아래
        ctx.lineTo(rearWindowX - 0.12 * scale, rearWindowY - 0.28 * scale); // 왼쪽 위
        ctx.lineTo(rearWindowX + 0.55 * scale, rearWindowY - 0.28 * scale); // 오른쪽 위
        ctx.closePath();
        ctx.fillStyle = '#87CEEB';
        ctx.fill();
        ctx.stroke();
      } else if (currentCarType === 'sedan') {
        // 꼬마세단: sedan (기본 세단) - 3D 렌더러 좌표 기반으로 창문 2개 구현 (좌우반전)
        
        // 앞창문 (좌우반전)
        const sedan1FrontWindowX = centerX + totalLength * 0.11 * scale; // X축 반전
        const frontWindowY = bottomCenterY - totalHeight * 0.65 * scale;
        
        ctx.beginPath();
        // 좌우반전된 좌표
        ctx.moveTo(sedan1FrontWindowX + 0.35 * scale, frontWindowY + 0.35 * scale); // 오른쪽 아래
        ctx.lineTo(sedan1FrontWindowX - 0.7 * scale, frontWindowY + 0.35 * scale);  // 왼쪽 아래
        ctx.lineTo(sedan1FrontWindowX - 0.7 * scale, frontWindowY - 0.28 * scale);  // 왼쪽 위
        ctx.lineTo(sedan1FrontWindowX - 0.2 * scale, frontWindowY - 0.28 * scale);  // 오른쪽 위
        ctx.closePath();
        ctx.fillStyle = '#87CEEB';
        ctx.fill();
        ctx.stroke();
        
        // 뒷창문 (좌우반전)
        const rearWindowX = centerX - totalLength * 0.14 * scale; // X축 반전
        const rearWindowY = bottomCenterY - totalHeight * 0.65 * scale;
        
        ctx.beginPath();
        // 좌우반전된 좌표
        ctx.moveTo(rearWindowX + 0.55 * scale, rearWindowY + 0.35 * scale); // 오른쪽 아래
        ctx.lineTo(rearWindowX - 0.5 * scale, rearWindowY + 0.35 * scale);  // 왼쪽 아래
        ctx.lineTo(rearWindowX - 0.02 * scale, rearWindowY - 0.28 * scale); // 왼쪽 위
        ctx.lineTo(rearWindowX + 0.55 * scale, rearWindowY - 0.28 * scale); // 오른쪽 위
        ctx.closePath();
        ctx.fillStyle = '#87CEEB';
        ctx.fill();
        ctx.stroke();
      } else if (currentCarType === 'truck') {
        // 빵빵트럭: truck (트럭) - 3D 렌더러 좌표 기반으로 앞창문 1개 구현 (좌우반전)
        
        // 앞창문 (좌우반전)
        const sedan1FrontWindowX = centerX + totalLength * 0.3 * scale; // X축 반전
        const frontWindowY = bottomCenterY - totalHeight * 0.64 * scale;
        
        ctx.beginPath();
        // 좌우반전된 좌표
        ctx.moveTo(sedan1FrontWindowX + 0.35 * scale, frontWindowY + 0.35 * scale); // 오른쪽 아래
        ctx.lineTo(sedan1FrontWindowX - 1.0 * scale, frontWindowY + 0.35 * scale);  // 왼쪽 아래
        ctx.lineTo(sedan1FrontWindowX - 1.0 * scale, frontWindowY - 0.28 * scale);  // 왼쪽 위
        ctx.lineTo(sedan1FrontWindowX - 0.02 * scale, frontWindowY - 0.28 * scale); // 오른쪽 위
        ctx.closePath();
        ctx.fillStyle = '#87CEEB';
        ctx.fill();
        ctx.stroke();
      } else if (currentCarType === 'bus') {
        // 네모버스: bus (네모난 버스) - 3D 렌더러 좌표 기반으로 창문 4개 구현 (좌우반전)
        
        // 앞창문 (좌우반전)
        const sedan1FrontWindowX = centerX + totalLength * 0.3 * scale; // X축 반전
        const frontWindowY = bottomCenterY - totalHeight * 0.65 * scale;
        
        ctx.beginPath();
        // 좌우반전된 좌표
        ctx.moveTo(sedan1FrontWindowX + 0.35 * scale, frontWindowY + 0.35 * scale); // 오른쪽 아래
        ctx.lineTo(sedan1FrontWindowX - 0.8 * scale, frontWindowY + 0.35 * scale);  // 왼쪽 아래
        ctx.lineTo(sedan1FrontWindowX - 0.8 * scale, frontWindowY - 0.28 * scale);  // 왼쪽 위
        ctx.lineTo(sedan1FrontWindowX - 0.02 * scale, frontWindowY - 0.28 * scale); // 오른쪽 위
        ctx.closePath();
        ctx.fillStyle = '#87CEEB';
        ctx.fill();
        ctx.stroke();
        
        // 추가 창문 3개 - 각각 개별적으로 위치 설정 (좌우반전)
        const windowWidth = 0.95 * scale;
        const windowSpacing = 0.2 * scale;
        const additionalWindowY = bottomCenterY - totalHeight * 0.65 * scale;
        
        // 추가창문 1 (좌우반전)
        let additionalWindowX1 = centerX + totalLength * 0.1 * scale - 0.3 * scale + 0.08 * scale; // X축 반전
        ctx.beginPath();
        // 좌우반전된 좌표
        ctx.moveTo(additionalWindowX1 + 0.35 * scale, additionalWindowY + 0.35 * scale); // 오른쪽 아래
        ctx.lineTo(additionalWindowX1 - 0.6 * scale, additionalWindowY + 0.35 * scale);  // 왼쪽 아래
        ctx.lineTo(additionalWindowX1 - 0.6 * scale, additionalWindowY - 0.28 * scale);  // 왼쪽 위
        ctx.lineTo(additionalWindowX1 + 0.35 * scale, additionalWindowY - 0.28 * scale); // 오른쪽 위
        ctx.closePath();
        ctx.fillStyle = '#87CEEB';
        ctx.fill();
        ctx.stroke();
        
        // 추가창문 2 (좌우반전)
        let additionalWindowX2 = centerX + totalLength * 0.1 * scale - (windowWidth + windowSpacing) * 1 - 0.3 * scale - 0.02 * scale + 0.03 * scale; // X축 반전
        ctx.beginPath();
        // 좌우반전된 좌표
        ctx.moveTo(additionalWindowX2 + 0.35 * scale, additionalWindowY + 0.35 * scale); // 오른쪽 아래
        ctx.lineTo(additionalWindowX2 - 0.6 * scale, additionalWindowY + 0.35 * scale);  // 왼쪽 아래
        ctx.lineTo(additionalWindowX2 - 0.6 * scale, additionalWindowY - 0.28 * scale);  // 왼쪽 위
        ctx.lineTo(additionalWindowX2 + 0.35 * scale, additionalWindowY - 0.28 * scale); // 오른쪽 위
        ctx.closePath();
        ctx.fillStyle = '#87CEEB';
        ctx.fill();
        ctx.stroke();
        
        // 추가창문 3 (좌우반전)
        let additionalWindowX3 = centerX + totalLength * 0.1 * scale - (windowWidth + windowSpacing) * 2 - 0.3 * scale - 0.02 * scale - 0.05 * scale; // X축 반전
        ctx.beginPath();
        // 좌우반전된 좌표
        ctx.moveTo(additionalWindowX3 + 0.35 * scale, additionalWindowY + 0.35 * scale); // 오른쪽 아래
        ctx.lineTo(additionalWindowX3 - 0.6 * scale, additionalWindowY + 0.35 * scale);  // 왼쪽 아래
        ctx.lineTo(additionalWindowX3 - 0.6 * scale, additionalWindowY - 0.28 * scale);  // 왼쪽 위
        ctx.lineTo(additionalWindowX3 + 0.35 * scale, additionalWindowY - 0.28 * scale); // 오른쪽 위
        ctx.closePath();
        ctx.fillStyle = '#87CEEB';
        ctx.fill();
        ctx.stroke();
      } else if (currentCarType === 'bus-type2') {
        // 통통버스: bus-type2 (둥근 버스) - 측면 창문 3개 (좌우반전)
        
        // 첫 번째 창문 (좌우반전)
        const window1X = centerX + 0.65 * scale; // X축 반전
        const window1Y = bottomCenterY - totalHeight * 0.65 * scale;
        
        ctx.beginPath();
        // 좌우반전된 좌표
        ctx.moveTo(window1X + 0.35 * scale, window1Y + 0.35 * scale); // 오른쪽 아래
        ctx.lineTo(window1X - 1.0 * scale, window1Y + 0.35 * scale);  // 왼쪽 아래
        ctx.lineTo(window1X - 1.0 * scale, window1Y - 0.28 * scale);  // 왼쪽 위
        ctx.lineTo(window1X - 0.25 * scale, window1Y - 0.28 * scale); // 오른쪽 위
        ctx.closePath();
        ctx.fillStyle = '#87CEEB';
        ctx.fill();
        ctx.stroke();
        
        // 두 번째 창문 (좌우반전, 0.02 왼쪽으로 이동)
        const window2X = centerX - 1.0 * scale + 0.02 * scale; // X축 반전
        const window2Y = bottomCenterY - totalHeight * 0.65 * scale;
        
        ctx.beginPath();
        // 좌우반전된 좌표
        ctx.moveTo(window2X + 0.35 * scale, window2Y + 0.35 * scale); // 오른쪽 아래
        ctx.lineTo(window2X - 0.55 * scale, window2Y + 0.35 * scale);  // 왼쪽 아래
        ctx.lineTo(window2X - 0.55 * scale, window2Y - 0.28 * scale);  // 왼쪽 위
        ctx.lineTo(window2X + 0.35 * scale, window2Y - 0.28 * scale); // 오른쪽 위
        ctx.closePath();
        ctx.fillStyle = '#87CEEB';
        ctx.fill();
        ctx.stroke();
        
        // 세 번째 창문 (좌우반전, 0.04 왼쪽으로 이동)
        const window3X = centerX - 2.2 * scale + 0.04 * scale; // X축 반전
        const window3Y = bottomCenterY - totalHeight * 0.65 * scale;
        
        ctx.beginPath();
        // 좌우반전된 좌표
        ctx.moveTo(window3X + 0.35 * scale, window3Y + 0.35 * scale); // 오른쪽 아래
        ctx.lineTo(window3X - 0.45 * scale, window3Y + 0.35 * scale);  // 왼쪽 아래
        ctx.lineTo(window3X - 0.45 * scale, window3Y - 0.28 * scale);  // 왼쪽 위
        ctx.lineTo(window3X + 0.35 * scale, window3Y - 0.28 * scale); // 오른쪽 위
        ctx.closePath();
        ctx.fillStyle = '#87CEEB';
        ctx.fill();
        ctx.stroke();
      } else if (currentCarType === 'suv') {
        // SUV: suv (SUV) - 3D 렌더러 좌표 기반으로 창문 3개 구현 (좌우반전)
        
        // 앞창문 (좌우반전)
        const sedan1FrontWindowX = centerX + totalLength * 0.12 * scale; // X축 반전
        const frontWindowY = bottomCenterY - totalHeight * 0.65 * scale;
        
        ctx.beginPath();
        // 좌우반전된 좌표
        ctx.moveTo(sedan1FrontWindowX + 0.35 * scale, frontWindowY + 0.35 * scale); // 오른쪽 아래
        ctx.lineTo(sedan1FrontWindowX - 0.8 * scale, frontWindowY + 0.35 * scale);  // 왼쪽 아래
        ctx.lineTo(sedan1FrontWindowX - 0.8 * scale, frontWindowY - 0.28 * scale);  // 왼쪽 위
        ctx.lineTo(sedan1FrontWindowX - 0.25 * scale, frontWindowY - 0.28 * scale); // 오른쪽 위
        ctx.closePath();
        ctx.fillStyle = '#87CEEB';
        ctx.fill();
        ctx.stroke();
        
        // 측면창문 1 (좌우반전)
        const sideWindow1X = centerX - totalLength * 0.12 * scale; // X축 반전
        const sideWindow1Y = bottomCenterY - totalHeight * 0.65 * scale;
        
        ctx.beginPath();
        // 좌우반전된 좌표
        ctx.moveTo(sideWindow1X + 0.35 * scale, sideWindow1Y + 0.35 * scale); // 오른쪽 아래
        ctx.lineTo(sideWindow1X - 0.6 * scale, sideWindow1Y + 0.35 * scale);  // 왼쪽 아래
        ctx.lineTo(sideWindow1X - 0.6 * scale, sideWindow1Y - 0.28 * scale);  // 왼쪽 위
        ctx.lineTo(sideWindow1X + 0.35 * scale, sideWindow1Y - 0.28 * scale); // 오른쪽 위
        ctx.closePath();
        ctx.fillStyle = '#87CEEB';
        ctx.fill();
        ctx.stroke();
        
        // 측면창문 2 (좌우반전)
        const sideWindow2X = centerX - totalLength * 0.32 * scale; // X축 반전
        const sideWindow2Y = bottomCenterY - totalHeight * 0.65 * scale;
        
        ctx.beginPath();
        // 좌우반전된 좌표
        ctx.moveTo(sideWindow2X + 0.35 * scale, sideWindow2Y + 0.35 * scale); // 오른쪽 아래
        ctx.lineTo(sideWindow2X - 0.6 * scale, sideWindow2Y + 0.35 * scale);  // 왼쪽 아래
        ctx.lineTo(sideWindow2X - 0.25 * scale, sideWindow2Y - 0.28 * scale); // 왼쪽 위
        ctx.lineTo(sideWindow2X + 0.35 * scale, sideWindow2Y - 0.28 * scale); // 오른쪽 위
        ctx.closePath();
        ctx.fillStyle = '#87CEEB';
        ctx.fill();
        ctx.stroke();
      } else if (currentCarType === 'sports') {
        // 스포츠카: sports (스포츠카) - 3D 렌더러 좌표 기반으로 창문 1개 구현 (좌우반전)
        
        // 앞창문 (좌우반전)
        const sedan1FrontWindowX = centerX + totalLength * 0.06 * scale; // X축 반전
        const frontWindowY = bottomCenterY - totalHeight * 0.53 * scale;
        
        ctx.beginPath();
        // 좌우반전된 좌표
        ctx.moveTo(sedan1FrontWindowX + 0.35 * scale, frontWindowY + 0.35 * scale); // 오른쪽 아래
        ctx.lineTo(sedan1FrontWindowX - 2.0 * scale, frontWindowY + 0.35 * scale);  // 왼쪽 아래
        ctx.lineTo(sedan1FrontWindowX - 1.5 * scale, frontWindowY - 0.12 * scale);  // 왼쪽 위
        ctx.lineTo(sedan1FrontWindowX - 0.2 * scale, frontWindowY - 0.18 * scale);  // 오른쪽 위
        ctx.closePath();
        ctx.fillStyle = '#87CEEB';
        ctx.fill();
        ctx.stroke();
      }
      
      // 아래쪽 바퀴 구멍 그리기 (좌우반전)
      ctx.fillStyle = '#FFFFFF'; // 흰색으로 구멍 표시
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      
      // 앞바퀴 구멍 (오른쪽, 좌우반전)
      const bottomFrontWheelX = centerX + totalLength * 0.35 * scale; // X축 반전
      const bottomFrontWheelY = bottomCenterY - totalHeight * 0.07 * scale;
      const bottomWheelHoleRadius = 0.06 * scale;
      
      ctx.beginPath();
      ctx.arc(bottomFrontWheelX, bottomFrontWheelY, bottomWheelHoleRadius, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
      
      // 뒷바퀴 구멍 (왼쪽, 좌우반전)
      const bottomRearWheelX = centerX - totalLength * 0.35 * scale; // X축 반전
      const bottomRearWheelY = bottomCenterY - totalHeight * 0.07 * scale;
      
      ctx.beginPath();
      ctx.arc(bottomRearWheelX, bottomRearWheelY, bottomWheelHoleRadius, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
      
      // 아래쪽 라벨 추가 (우측면도) - 도면 바로 아래에 배치
      ctx.fillStyle = '#333333';
      ctx.font = '16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('우측면도', centerX, bottomCenterY + 30);
    });





    // 모든 페이지를 배열에 추가
    if (snapshotPage) pages.push(snapshotPage);

    if (sideViewPage) pages.push(sideViewPage);

    // 페이지 3: 측면도 기준으로 부품 도안 생성
    const frontViewPage = await createPage('', async (ctx) => {
      
      const canvas = ctx.canvas;
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      
      const scale = 133; // 측면도와 동일한 스케일

      // 배경
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 공통 헤더/푸터 적용 (배경 그린 후)
      await drawCommonHeaderFooter(ctx, canvas.width, canvas.height);

      // 꼬마세단(sedan) 부품 도안 그리기
      if (carType === 'sedan-type2') {
        // 큰세단: sedan-type2 - 스포츠카 참고해서 2행 레이아웃으로 재작업
        const totalDepth = 2.5; // 차체폭 (예전에 구한 값)
        const carWidth = totalDepth * scale; // 차체폭
        
        // 차량 색상 설정 (2페이지와 동일)
        ctx.fillStyle = currentCarColor;

        // 2페이지와 동일한 위치 기준 사용
        const a4Height = canvas.height;
        const topBaseY = a4Height / 3 + 200; // 2페이지와 동일한 위쪽 기준선
        const bottomBaseY = a4Height * 2 / 3 + 200; // 2페이지와 동일한 아래쪽 기준선
        
        // 큰세단 3D 모델에서 carShapePoints 가져오기
        const carShapePoints = createSedanType2Shape();
        
        // === 큰세단 각 영역 길이 계산 방법 (메모) - 스포츠카 계산 방식 참고 ===
        // 1. 앞면: Y좌표 차이 (높이) - carShapePoints[1][1] - carShapePoints[0][1]
        //    → Math.abs(carShapePoints[1][1] - carShapePoints[0][1]) * scale
        // 2. 보닛: 대각선 길이 (피타고라스) - √(dx² + dy²) - carShapePoints[1]에서 carShapePoints[2]까지
        //    → dx = carShapePoints[2][0] - carShapePoints[1][0], dy = carShapePoints[2][1] - carShapePoints[1][1]
        //    → Math.sqrt(dx*dx + dy*dy) * scale
        // 3. 앞창문: 대각선 길이 (피타고라스) - √(dx² + dy²) - carShapePoints[2]에서 carShapePoints[3]까지
        //    → dx = carShapePoints[3][0] - carShapePoints[2][0], dy = carShapePoints[3][1] - carShapePoints[2][1]
        //    → Math.sqrt(dx*dx + dy*dy) * scale
        // 4. 지붕: X좌표 차이 (수평 길이) - carShapePoints[4][0] - carShapePoints[3][0]
        //    → Math.abs(carShapePoints[4][0] - carShapePoints[3][0]) * scale
        // 5. 뒷창문: 대각선 길이 (피타고라스) - √(dx² + dy²) - carShapePoints[4]에서 carShapePoints[5]까지
        //    → dx = carShapePoints[5][0] - carShapePoints[4][0], dy = carShapePoints[5][1] - carShapePoints[4][1]
        //    → Math.sqrt(dx*dx + dy*dy) * scale
        // 6. 트렁크: 대각선 길이 (피타고라스) - √(dx² + dy²) - carShapePoints[5]에서 carShapePoints[6]까지
        //    → dx = carShapePoints[6][0] - carShapePoints[5][0], dy = carShapePoints[6][1] - carShapePoints[5][1]
        //    → Math.sqrt(dx*dx + dy*dy) * scale
        // 7. 뒷면: Y좌표 차이 (높이) - carShapePoints[7][1] - carShapePoints[6][1]
        //    → Math.abs(carShapePoints[7][1] - carShapePoints[6][1]) * scale
        //
        // 주의사항: 큰세단은 8개 포인트를 사용 (carShapePoints[0] ~ carShapePoints[7])
        // 앞면과 뒷면은 Y좌표 차이로 계산, 지붕은 X좌표 차이로 계산, 나머지는 대각선 길이(피타고라스)로 계산
        // 스포츠카와 달리 지붕은 X좌표 차이로 계산 (수평 길이)
        // 
        // 계산 방식 요약:
        // - Y좌표 차이 (높이): 앞면, 뒷면
        // - X좌표 차이 (수평 길이): 지붕
        // - 대각선 길이 (피타고라스): 보닛, 앞창문, 뒷창문, 트렁크
        // 
        // 나중에 다른 방식으로 계산하는 실수 방지를 위해 반드시 이 방식을 따를 것!
        
        // 각 부품의 길이 계산
        const frontLength = Math.abs(carShapePoints[1][1] - carShapePoints[0][1]) * scale;
        
        // 보닛: 대각선 길이 (피타고라스)
        const bonnetDx = carShapePoints[2][0] - carShapePoints[1][0];
        const bonnetDy = carShapePoints[2][1] - carShapePoints[1][1];
        const bonnetLength = Math.sqrt(bonnetDx * bonnetDx + bonnetDy * bonnetDy) * scale;
        
        // 앞창문: 대각선 길이 (피타고라스)
        const frontWindowDx = carShapePoints[3][0] - carShapePoints[2][0];
        const frontWindowDy = carShapePoints[3][1] - carShapePoints[2][1];
        const frontWindowLength = Math.sqrt(frontWindowDx * frontWindowDx + frontWindowDy * frontWindowDy) * scale;
        
        // 지붕: X좌표 차이 (수평 길이)
        const roofLength = Math.abs(carShapePoints[4][0] - carShapePoints[3][0]) * scale;
        
        // 뒷창문: 대각선 길이 (피타고라스)
        const rearWindowDx = carShapePoints[5][0] - carShapePoints[4][0];
        const rearWindowDy = carShapePoints[5][1] - carShapePoints[4][1];
        const rearWindowLength = Math.sqrt(rearWindowDx * rearWindowDx + rearWindowDy * rearWindowDy) * scale;
        
        // 트렁크: 대각선 길이 (피타고라스)
        const trunkDx = carShapePoints[6][0] - carShapePoints[5][0];
        const trunkDy = carShapePoints[6][1] - carShapePoints[5][1];
        const trunkLength = Math.sqrt(trunkDx * trunkDx + trunkDy * trunkDy) * scale;
        
        const rearLength = Math.abs(carShapePoints[7][1] - carShapePoints[6][1]) * scale;
        
        // === 위쪽 부품들 (앞면, 보닛, 앞창문, 지붕) - 2행 레이아웃 ===
        const topPartsWidth = frontLength + bonnetLength + frontWindowLength + roofLength + (3 * 50); // 3개 간격 * 50px
        const topPartsStartX = centerX - topPartsWidth / 2;
        
        // 앞면 그리기
        const topFrontX = topPartsStartX + frontLength/2;
        ctx.fillStyle = currentCarColor;
        ctx.strokeStyle = '#333333';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(topFrontX - frontLength/2, topBaseY);
        ctx.lineTo(topFrontX + frontLength/2, topBaseY);
        ctx.lineTo(topFrontX + frontLength/2, topBaseY - carWidth);
        ctx.lineTo(topFrontX - frontLength/2, topBaseY - carWidth);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // "앞면" 텍스트
        ctx.fillStyle = '#333333';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('앞면', topFrontX, topBaseY + 30);
        
        // 보닛 그리기
        const topBonnetX = topPartsStartX + frontLength + 50 + bonnetLength/2;
        ctx.fillStyle = currentCarColor;
        ctx.strokeStyle = '#333333';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(topBonnetX - bonnetLength/2, topBaseY);
        ctx.lineTo(topBonnetX + bonnetLength/2, topBaseY);
        ctx.lineTo(topBonnetX + bonnetLength/2, topBaseY - carWidth);
        ctx.lineTo(topBonnetX - bonnetLength/2, topBaseY - carWidth);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // "보닛" 텍스트
        ctx.fillStyle = '#333333';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('보닛', topBonnetX, topBaseY + 30);
        
        // 앞창문 그리기
        const topFrontWindowX = topPartsStartX + frontLength + 50 + bonnetLength + 50 + frontWindowLength/2;
        ctx.fillStyle = currentCarColor;
        ctx.strokeStyle = '#333333';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(topFrontWindowX - frontWindowLength/2, topBaseY);
        ctx.lineTo(topFrontWindowX + frontWindowLength/2, topBaseY);
        ctx.lineTo(topFrontWindowX + frontWindowLength/2, topBaseY - carWidth);
        ctx.lineTo(topFrontWindowX - frontWindowLength/2, topBaseY - carWidth);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // "앞창문" 텍스트
        ctx.fillStyle = '#333333';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('앞창문', topFrontWindowX, topBaseY + 30);
        
        // 앞유리 그리기
        const sedanType2FrontGlassX = topFrontWindowX;
        const sedanType2FrontGlassY = topBaseY - carWidth/2;
        ctx.beginPath();
        const sedanType2FrontGlassWidth = frontWindowLength * 0.58;
        const sedanType2FrontGlassHeight = carWidth * 0.78;
        ctx.moveTo(sedanType2FrontGlassX - sedanType2FrontGlassWidth/2, sedanType2FrontGlassY + sedanType2FrontGlassHeight/2);
        ctx.lineTo(sedanType2FrontGlassX + sedanType2FrontGlassWidth/2, sedanType2FrontGlassY + sedanType2FrontGlassHeight/2);
        ctx.lineTo(sedanType2FrontGlassX + sedanType2FrontGlassWidth/2, sedanType2FrontGlassY - sedanType2FrontGlassHeight/2);
        ctx.lineTo(sedanType2FrontGlassX - sedanType2FrontGlassWidth/2, sedanType2FrontGlassY - sedanType2FrontGlassHeight/2);
        ctx.closePath();
        ctx.fillStyle = '#87CEEB';
        ctx.fill();
        ctx.strokeStyle = '#333333';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // 지붕 그리기
        const topRoofX = topPartsStartX + frontLength + 50 + bonnetLength + 50 + frontWindowLength + 50 + roofLength/2;
        ctx.fillStyle = currentCarColor;
        ctx.strokeStyle = '#333333';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(topRoofX - roofLength/2, topBaseY);
        ctx.lineTo(topRoofX + roofLength/2, topBaseY);
        ctx.lineTo(topRoofX + roofLength/2, topBaseY - carWidth);
        ctx.lineTo(topRoofX - roofLength/2, topBaseY - carWidth);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // "지붕" 텍스트
        ctx.fillStyle = '#333333';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('지붕', topRoofX, topBaseY + 30);
        
        // === 아래쪽 부품들 (뒷창문, 트렁크, 뒷면) - 2행 레이아웃 ===
        const bottomPartsWidth = rearWindowLength + trunkLength + rearLength + (2 * 50); // 2개 간격 * 50px
        const bottomPartsStartX = centerX - bottomPartsWidth / 2;
        
        // 뒷창문 그리기
        const bottomRearWindowX = bottomPartsStartX + rearWindowLength/2;
        ctx.fillStyle = currentCarColor;
        ctx.strokeStyle = '#333333';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(bottomRearWindowX - rearWindowLength/2, bottomBaseY);
        ctx.lineTo(bottomRearWindowX + rearWindowLength/2, bottomBaseY);
        ctx.lineTo(bottomRearWindowX + rearWindowLength/2, bottomBaseY - carWidth);
        ctx.lineTo(bottomRearWindowX - rearWindowLength/2, bottomBaseY - carWidth);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // "뒷창문" 텍스트
        ctx.fillStyle = '#333333';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('뒷창문', bottomRearWindowX, bottomBaseY + 30);
        
        // 뒷유리 그리기 (뒷창문 중앙에 배치)
        const sedanType2RearGlassX = bottomRearWindowX;
        const sedanType2RearGlassY = bottomBaseY - carWidth/2;
        ctx.beginPath();
        const sedanType2RearGlassWidth = sedanType2FrontGlassWidth;
        const sedanType2RearGlassHeight = sedanType2FrontGlassHeight;
        ctx.moveTo(sedanType2RearGlassX - sedanType2RearGlassWidth/2, sedanType2RearGlassY + sedanType2RearGlassHeight/2);
        ctx.lineTo(sedanType2RearGlassX + sedanType2RearGlassWidth/2, sedanType2RearGlassY + sedanType2RearGlassHeight/2);
        ctx.lineTo(sedanType2RearGlassX + sedanType2RearGlassWidth/2, sedanType2RearGlassY - sedanType2RearGlassHeight/2);
        ctx.lineTo(sedanType2RearGlassX - sedanType2RearGlassWidth/2, sedanType2RearGlassY - sedanType2RearGlassHeight/2);
        ctx.closePath();
        ctx.fillStyle = '#87CEEB';
        ctx.fill();
        ctx.strokeStyle = '#333333';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // 트렁크 그리기
        const bottomTrunkX = bottomPartsStartX + rearWindowLength + 50 + trunkLength/2;
        ctx.fillStyle = currentCarColor;
        ctx.strokeStyle = '#333333';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(bottomTrunkX - trunkLength/2, bottomBaseY);
        ctx.lineTo(bottomTrunkX + trunkLength/2, bottomBaseY);
        ctx.lineTo(bottomTrunkX + trunkLength/2, bottomBaseY - carWidth);
        ctx.lineTo(bottomTrunkX - trunkLength/2, bottomBaseY - carWidth);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // "트렁크" 텍스트
        ctx.fillStyle = '#333333';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('트렁크', bottomTrunkX, bottomBaseY + 30);
        
        // 뒷면 그리기
        const bottomRearX = bottomPartsStartX + rearWindowLength + 50 + trunkLength + 50 + rearLength/2;
        ctx.fillStyle = currentCarColor;
        ctx.strokeStyle = '#333333';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(bottomRearX - rearLength/2, bottomBaseY);
        ctx.lineTo(bottomRearX + rearLength/2, bottomBaseY);
        ctx.lineTo(bottomRearX + rearLength/2, bottomBaseY - carWidth);
        ctx.lineTo(bottomRearX - rearLength/2, bottomBaseY - carWidth);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // "뒷면" 텍스트
        ctx.fillStyle = '#333333';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('뒷면', bottomRearX, bottomBaseY + 30);

      } else if (carType === 'sports') {
        // 스포츠카: sports - 통통버스 참고해서 2행 레이아웃으로 재작업
        const totalDepth = 2.5; // 차체폭 (예전에 구한 값)
        const carWidth = totalDepth * scale; // 차체폭
        
        // 차량 색상 설정 (2페이지와 동일)
        ctx.fillStyle = currentCarColor;

        // 2페이지와 동일한 위치 기준 사용
        const a4Height = canvas.height;
        const topBaseY = a4Height / 3 + 200; // 2페이지와 동일한 위쪽 기준선
        const bottomBaseY = a4Height * 2 / 3 + 200; // 2페이지와 동일한 아래쪽 기준선
        
        // 스포츠카 3D 모델에서 carShapePoints 가져오기
        const carShapePoints = createSportsShape();
        
        // === 스포츠카 각 영역 길이 계산 방법 (메모) - 통통버스 계산 방식 참고 ===
        // 1. 앞면: Y좌표 차이 (높이) - carShapePoints[1][1] - carShapePoints[0][1]
        //    → Math.abs(carShapePoints[1][1] - carShapePoints[0][1]) * scale
        // 2. 보닛: 대각선 길이 (피타고라스) - √(dx² + dy²) - carShapePoints[1]에서 carShapePoints[2]까지
        //    → dx = carShapePoints[2][0] - carShapePoints[1][0], dy = carShapePoints[2][1] - carShapePoints[1][1]
        //    → Math.sqrt(dx*dx + dy*dy) * scale
        // 3. 앞창문: 대각선 길이 (피타고라스) - √(dx² + dy²) - carShapePoints[2]에서 carShapePoints[3]까지
        //    → dx = carShapePoints[3][0] - carShapePoints[2][0], dy = carShapePoints[3][1] - carShapePoints[2][1]
        //    → Math.sqrt(dx*dx + dy*dy) * scale
        // 4. 지붕: 대각선 길이 (피타고라스) - √(dx² + dy²) - carShapePoints[3]에서 carShapePoints[4]까지
        //    → dx = carShapePoints[4][0] - carShapePoints[3][0], dy = carShapePoints[4][1] - carShapePoints[3][1]
        //    → Math.sqrt(dx*dx + dy*dy) * scale
        // 5. 뒷창문: 대각선 길이 (피타고라스) - √(dx² + dy²) - carShapePoints[4]에서 carShapePoints[5]까지
        //    → dx = carShapePoints[5][0] - carShapePoints[4][0], dy = carShapePoints[5][1] - carShapePoints[4][1]
        //    → Math.sqrt(dx*dx + dy*dy) * scale
        // 6. 트렁크: 대각선 길이 (피타고라스) - √(dx² + dy²) - carShapePoints[5]에서 carShapePoints[6]까지
        //    → dx = carShapePoints[6][0] - carShapePoints[5][0], dy = carShapePoints[6][1] - carShapePoints[5][1]
        //    → Math.sqrt(dx*dx + dy*dy) * scale
        // 7. 뒷면: Y좌표 차이 (높이) - carShapePoints[7][1] - carShapePoints[6][1]
        //    → Math.abs(carShapePoints[7][1] - carShapePoints[6][1]) * scale
        //
        // 주의사항: 스포츠카는 8개 포인트를 사용 (carShapePoints[0] ~ carShapePoints[7])
        // 앞면과 뒷면은 Y좌표 차이로 계산, 나머지는 모두 대각선 길이(피타고라스)로 계산
        // 통통버스와 달리 트렁크가 별도로 존재함
        
        // 각 부품의 길이 계산
        const frontLength = Math.abs(carShapePoints[1][1] - carShapePoints[0][1]) * scale;
        
        // 보닛: 대각선 길이 (피타고라스)
        const bonnetDx = carShapePoints[2][0] - carShapePoints[1][0];
        const bonnetDy = carShapePoints[2][1] - carShapePoints[1][1];
        const bonnetLength = Math.sqrt(bonnetDx * bonnetDx + bonnetDy * bonnetDy) * scale;
        
        // 앞창문: 대각선 길이 (피타고라스)
        const frontWindowDx = carShapePoints[3][0] - carShapePoints[2][0];
        const frontWindowDy = carShapePoints[3][1] - carShapePoints[2][1];
        const frontWindowLength = Math.sqrt(frontWindowDx * frontWindowDx + frontWindowDy * frontWindowDy) * scale;
        
        // 지붕: 대각선 길이 (피타고라스)
        const roofDx = carShapePoints[4][0] - carShapePoints[3][0];
        const roofDy = carShapePoints[4][1] - carShapePoints[3][1];
        const roofLength = Math.sqrt(roofDx * roofDx + roofDy * roofDy) * scale;
        
        // 뒷창문: 대각선 길이 (피타고라스)
        const rearWindowDx = carShapePoints[5][0] - carShapePoints[4][0];
        const rearWindowDy = carShapePoints[5][1] - carShapePoints[4][1];
        const rearWindowLength = Math.sqrt(rearWindowDx * rearWindowDx + rearWindowDy * rearWindowDy) * scale;
        
        // 트렁크: 대각선 길이 (피타고라스)
        const trunkDx = carShapePoints[6][0] - carShapePoints[5][0];
        const trunkDy = carShapePoints[6][1] - carShapePoints[5][1];
        const trunkLength = Math.sqrt(trunkDx * trunkDx + trunkDy * trunkDy) * scale;
        
        const rearLength = Math.abs(carShapePoints[7][1] - carShapePoints[6][1]) * scale;
        
        // === 위쪽 부품들 (앞면, 보닛, 앞창문, 지붕) - 2행 레이아웃 ===
        const topPartsWidth = frontLength + bonnetLength + frontWindowLength + roofLength + (3 * 50); // 3개 간격 * 50px
        const topPartsStartX = centerX - topPartsWidth / 2;
        
        // 앞면 그리기
        const topFrontX = topPartsStartX + frontLength/2;
        ctx.fillStyle = currentCarColor;
        ctx.strokeStyle = '#333333';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(topFrontX - frontLength/2, topBaseY);
        ctx.lineTo(topFrontX + frontLength/2, topBaseY);
        ctx.lineTo(topFrontX + frontLength/2, topBaseY - carWidth);
        ctx.lineTo(topFrontX - frontLength/2, topBaseY - carWidth);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // "앞면" 텍스트
        ctx.fillStyle = '#333333';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('앞면', topFrontX, topBaseY + 30);
        
        // 보닛 그리기
        const topBonnetX = topPartsStartX + frontLength + 50 + bonnetLength/2;
        ctx.fillStyle = currentCarColor;
        ctx.strokeStyle = '#333333';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(topBonnetX - bonnetLength/2, topBaseY);
        ctx.lineTo(topBonnetX + bonnetLength/2, topBaseY);
        ctx.lineTo(topBonnetX + bonnetLength/2, topBaseY - carWidth);
        ctx.lineTo(topBonnetX - bonnetLength/2, topBaseY - carWidth);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // "보닛" 텍스트
        ctx.fillStyle = '#333333';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('보닛', topBonnetX, topBaseY + 30);
        
        // 앞창문 그리기
        const topFrontWindowX = topPartsStartX + frontLength + 50 + bonnetLength + 50 + frontWindowLength/2;
        ctx.fillStyle = currentCarColor;
        ctx.strokeStyle = '#333333';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(topFrontWindowX - frontWindowLength/2, topBaseY);
        ctx.lineTo(topFrontWindowX + frontWindowLength/2, topBaseY);
        ctx.lineTo(topFrontWindowX + frontWindowLength/2, topBaseY - carWidth);
        ctx.lineTo(topFrontWindowX - frontWindowLength/2, topBaseY - carWidth);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // "앞창문" 텍스트
        ctx.fillStyle = '#333333';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('앞창문', topFrontWindowX, topBaseY + 30);
        
        // 앞유리 그리기
        const sportsFrontGlassX = topFrontWindowX;
        const sportsFrontGlassY = topBaseY - carWidth/2;
        ctx.beginPath();
        const sportsFrontGlassWidth = frontWindowLength * 0.58;
        const sportsFrontGlassHeight = carWidth * 0.78;
        ctx.moveTo(sportsFrontGlassX - sportsFrontGlassWidth/2, sportsFrontGlassY + sportsFrontGlassHeight/2);
        ctx.lineTo(sportsFrontGlassX + sportsFrontGlassWidth/2, sportsFrontGlassY + sportsFrontGlassHeight/2);
        ctx.lineTo(sportsFrontGlassX + sportsFrontGlassWidth/2, sportsFrontGlassY - sportsFrontGlassHeight/2);
        ctx.lineTo(sportsFrontGlassX - sportsFrontGlassWidth/2, sportsFrontGlassY - sportsFrontGlassHeight/2);
        ctx.closePath();
        ctx.fillStyle = '#87CEEB';
        ctx.fill();
        ctx.strokeStyle = '#333333';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // 지붕 그리기
        const topRoofX = topPartsStartX + frontLength + 50 + bonnetLength + 50 + frontWindowLength + 50 + roofLength/2;
        ctx.fillStyle = currentCarColor;
        ctx.strokeStyle = '#333333';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(topRoofX - roofLength/2, topBaseY);
        ctx.lineTo(topRoofX + roofLength/2, topBaseY);
        ctx.lineTo(topRoofX + roofLength/2, topBaseY - carWidth);
        ctx.lineTo(topRoofX - roofLength/2, topBaseY - carWidth);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // "지붕" 텍스트
        ctx.fillStyle = '#333333';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('지붕', topRoofX, topBaseY + 30);
        
        // === 아래쪽 부품들 (뒷창문, 트렁크, 뒷면) - 2행 레이아웃 ===
        const bottomPartsWidth = rearWindowLength + trunkLength + rearLength + (2 * 50); // 2개 간격 * 50px
        const bottomPartsStartX = centerX - bottomPartsWidth / 2;
        
        // 뒷창문 그리기
        const bottomRearWindowX = bottomPartsStartX + rearWindowLength/2;
        ctx.fillStyle = currentCarColor;
        ctx.strokeStyle = '#333333';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(bottomRearWindowX - rearWindowLength/2, bottomBaseY);
        ctx.lineTo(bottomRearWindowX + rearWindowLength/2, bottomBaseY);
        ctx.lineTo(bottomRearWindowX + rearWindowLength/2, bottomBaseY - carWidth);
        ctx.lineTo(bottomRearWindowX - rearWindowLength/2, bottomBaseY - carWidth);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // "뒷창문" 텍스트
        ctx.fillStyle = '#333333';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('뒷창문', bottomRearWindowX, bottomBaseY + 30);
        
        // 뒷유리 그리기 (뒷창문 중앙에 배치)
        const sportsRearGlassX = bottomRearWindowX;
        const sportsRearGlassY = bottomBaseY - carWidth/2;
        ctx.beginPath();
        const sportsRearGlassWidth = sportsFrontGlassWidth;
        const sportsRearGlassHeight = sportsFrontGlassHeight;
        ctx.moveTo(sportsRearGlassX - sportsRearGlassWidth/2, sportsRearGlassY + sportsRearGlassHeight/2);
        ctx.lineTo(sportsRearGlassX + sportsRearGlassWidth/2, sportsRearGlassY + sportsRearGlassHeight/2);
        ctx.lineTo(sportsRearGlassX + sportsRearGlassWidth/2, sportsRearGlassY - sportsRearGlassHeight/2);
        ctx.lineTo(sportsRearGlassX - sportsRearGlassWidth/2, sportsRearGlassY - sportsRearGlassHeight/2);
        ctx.closePath();
        ctx.fillStyle = '#87CEEB';
        ctx.fill();
        ctx.strokeStyle = '#333333';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // 트렁크 그리기
        const bottomTrunkX = bottomPartsStartX + rearWindowLength + 50 + trunkLength/2;
        ctx.fillStyle = currentCarColor;
        ctx.strokeStyle = '#333333';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(bottomTrunkX - trunkLength/2, bottomBaseY);
        ctx.lineTo(bottomTrunkX + trunkLength/2, bottomBaseY);
        ctx.lineTo(bottomTrunkX + trunkLength/2, bottomBaseY - carWidth);
        ctx.lineTo(bottomTrunkX - trunkLength/2, bottomBaseY - carWidth);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // "트렁크" 텍스트
        ctx.fillStyle = '#333333';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('트렁크', bottomTrunkX, bottomBaseY + 30);
        
        // 뒷면 그리기
        const bottomRearX = bottomPartsStartX + rearWindowLength + 50 + trunkLength + 50 + rearLength/2;
        ctx.fillStyle = currentCarColor;
        ctx.strokeStyle = '#333333';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(bottomRearX - rearLength/2, bottomBaseY);
        ctx.lineTo(bottomRearX + rearLength/2, bottomBaseY);
        ctx.lineTo(bottomRearX + rearLength/2, bottomBaseY - carWidth);
        ctx.lineTo(bottomRearX - rearLength/2, bottomBaseY - carWidth);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // "뒷면" 텍스트
        ctx.fillStyle = '#333333';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('뒷면', bottomRearX, bottomBaseY + 30);

      } else if (carType === 'suv') {
        // SUV: suv - 앞면, 보닛, 앞창문, 지붕, 뒷창문, 뒷면 (트렁크 없음)
        const totalDepth = 2.5; // 차체폭 (예전에 구한 값)
        const carWidth = totalDepth * scale; // 차체폭
        
        // 차량 색상 설정 (2페이지와 동일)
        ctx.fillStyle = currentCarColor;

        // 2페이지와 동일한 위치 기준 사용
        const a4Height = canvas.height;
        const topBaseY = a4Height / 3 + 200; // 위쪽 부품들의 기준선
        const bottomBaseY = a4Height / 3 + 200 + carWidth + 100; // 아래쪽 부품들의 기준선 (위쪽 부품 아래 + 간격)
        
        // 2페이지 측면도에서 사용한 carShapePoints 좌표 기준으로 계산
        const carShapePoints = createSuvShape();
        
        // === SUV 각 영역 길이 계산 방법 (메모) ===
        // 1. 앞면: Y좌표 차이 (높이) - carShapePoints[1][1] - carShapePoints[0][1]
        // 2. 보닛: 대각선 길이 (피타고라스) - √(dx² + dy²) - carShapePoints[1]에서 carShapePoints[2]까지
        // 3. 앞창문: 대각선 길이 (피타고라스) - √(dx² + dy²) - carShapePoints[2]에서 carShapePoints[3]까지
        // 4. 지붕: X좌표 차이 (수평 길이) - carShapePoints[4][0] - carShapePoints[3][0]
        // 5. 뒷창문: 대각선 길이 (피타고라스) - √(dx² + dy²) - carShapePoints[4]에서 carShapePoints[5]까지
        // 6. 뒷면: Y좌표 차이 (높이) - carShapePoints[6][1] - carShapePoints[5][1]
        
        const frontLength = Math.abs(carShapePoints[1][1] - carShapePoints[0][1]) * scale; // 앞면 (높이, Y좌표 차이)
        
        // 보닛 대각선 길이 계산
        const bonnetDx = carShapePoints[2][0] - carShapePoints[1][0]; // X 차이
        const bonnetDy = carShapePoints[2][1] - carShapePoints[1][1]; // Y 차이
        const bonnetLength = Math.sqrt(bonnetDx * bonnetDx + bonnetDy * bonnetDy) * scale; // 대각선 길이
        
        // 앞창문 대각선 길이 계산
        const frontWindowDx = carShapePoints[3][0] - carShapePoints[2][0]; // X 차이
        const frontWindowDy = carShapePoints[3][1] - carShapePoints[2][1]; // Y 차이
        const frontWindowLength = Math.sqrt(frontWindowDx * frontWindowDx + frontWindowDy * frontWindowDy) * scale; // 대각선 길이
        
        const roofLength = Math.abs(carShapePoints[4][0] - carShapePoints[3][0]) * scale; // 지붕
        
        // 뒷창문 대각선 길이 계산
        const rearWindowDx = carShapePoints[5][0] - carShapePoints[4][0]; // X 차이
        const rearWindowDy = carShapePoints[5][1] - carShapePoints[4][1]; // Y 차이
        const rearWindowLength = Math.sqrt(rearWindowDx * rearWindowDx + rearWindowDy * rearWindowDy) * scale; // 대각선 길이
        
        const rearLength = Math.abs(carShapePoints[6][1] - carShapePoints[5][1]) * scale; // 뒷면 (높이, Y좌표 차이)
        
        // === 위쪽 부품들 (앞면, 보닛, 앞창문, 지붕) - 가운데 정렬 ===
        const topPartsWidth = frontLength + bonnetLength + frontWindowLength + roofLength + (3 * 50); // 3개 간격 * 50px
        const topPartsStartX = centerX - topPartsWidth / 2; // 위쪽 부품들을 가운데 정렬
        
        // === 아래쪽 부품들 (뒷창문, 뒷면) - 가운데 정렬 ===
        const bottomPartsWidth = rearWindowLength + rearLength + (1 * 50); // 1개 간격 * 50px
        const bottomPartsStartX = centerX - bottomPartsWidth / 2; // 아래쪽 부품들을 가운데 정렬
        
        // === 위쪽 부품들 그리기 (오른쪽부터) ===
        // 지붕 그리기 (가장 오른쪽)
        const roofX = topPartsStartX + topPartsWidth - roofLength/2;
        ctx.fillStyle = currentCarColor;
        ctx.strokeStyle = '#333333';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(roofX - roofLength/2, topBaseY);
        ctx.lineTo(roofX + roofLength/2, topBaseY);
        ctx.lineTo(roofX + roofLength/2, topBaseY - carWidth);
        ctx.lineTo(roofX - roofLength/2, topBaseY - carWidth);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // "지붕" 텍스트
        ctx.fillStyle = '#333333';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('지붕', roofX, topBaseY + 30);
        
        // 앞창문 그리기 (지붕 왼쪽)
        const frontWindowX = topPartsStartX + topPartsWidth - roofLength - 50 - frontWindowLength/2;
        ctx.fillStyle = currentCarColor;
        ctx.strokeStyle = '#333333';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(frontWindowX - frontWindowLength/2, topBaseY);
        ctx.lineTo(frontWindowX + frontWindowLength/2, topBaseY);
        ctx.lineTo(frontWindowX + frontWindowLength/2, topBaseY - carWidth);
        ctx.lineTo(frontWindowX - frontWindowLength/2, topBaseY - carWidth);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // "앞창문" 텍스트
        ctx.fillStyle = '#333333';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('앞창문', frontWindowX, topBaseY + 30);
        
        // 앞유리 그리기 (앞창문 위에)
        const suvFrontGlassX = frontWindowX; // 앞창문 부품과 같은 X 위치
        const suvFrontGlassY = topBaseY - carWidth/2; // 앞창문 부품 중앙 높이
        
        ctx.beginPath();
        // 앞창문 부품의 58% 크기로 앞유리 그리기
        const suvFrontGlassWidth = frontWindowLength * 0.58;
        const suvFrontGlassHeight = carWidth * 0.78;
        
        ctx.moveTo(suvFrontGlassX - suvFrontGlassWidth/2, suvFrontGlassY + suvFrontGlassHeight/2);
        ctx.lineTo(suvFrontGlassX + suvFrontGlassWidth/2, suvFrontGlassY + suvFrontGlassHeight/2);
        ctx.lineTo(suvFrontGlassX + suvFrontGlassWidth/2, suvFrontGlassY - suvFrontGlassHeight/2);
        ctx.lineTo(suvFrontGlassX - suvFrontGlassWidth/2, suvFrontGlassY - suvFrontGlassHeight/2);
        ctx.closePath();
        ctx.fillStyle = '#87CEEB'; // 하늘색
        ctx.fill();
        ctx.strokeStyle = '#333333';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // 보닛 그리기 (앞창문 왼쪽)
        const bonnetX = topPartsStartX + topPartsWidth - roofLength - 50 - frontWindowLength - 50 - bonnetLength/2;
        ctx.fillStyle = currentCarColor;
        ctx.strokeStyle = '#333333';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(bonnetX - bonnetLength/2, topBaseY);
        ctx.lineTo(bonnetX + bonnetLength/2, topBaseY);
        ctx.lineTo(bonnetX + bonnetLength/2, topBaseY - carWidth);
        ctx.lineTo(bonnetX - bonnetLength/2, topBaseY - carWidth);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // "보닛" 텍스트
        ctx.fillStyle = '#333333';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('보닛', bonnetX, topBaseY + 30);
        
        // 앞면 그리기 (보닛 왼쪽)
        const frontX = topPartsStartX + frontLength/2;
        ctx.fillStyle = currentCarColor;
        ctx.strokeStyle = '#333333';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(frontX - frontLength/2, topBaseY);
        ctx.lineTo(frontX + frontLength/2, topBaseY);
        ctx.lineTo(frontX + frontLength/2, topBaseY - carWidth);
        ctx.lineTo(frontX - frontLength/2, topBaseY - carWidth);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // "앞면" 텍스트
        ctx.fillStyle = '#333333';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('앞면', frontX, topBaseY + 30);
        
        // === 아래쪽 부품들 그리기 (오른쪽부터) ===
        // 뒷면 그리기 (아래쪽 가장 오른쪽)
        const bottomRearX = bottomPartsStartX + bottomPartsWidth - rearLength/2;
        ctx.fillStyle = currentCarColor;
        ctx.strokeStyle = '#333333';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(bottomRearX - rearLength/2, bottomBaseY);
        ctx.lineTo(bottomRearX + rearLength/2, bottomBaseY);
        ctx.lineTo(bottomRearX + rearLength/2, bottomBaseY - carWidth);
        ctx.lineTo(bottomRearX - rearLength/2, bottomBaseY - carWidth);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // "뒷면" 텍스트
        ctx.fillStyle = '#333333';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('뒷면', bottomRearX, bottomBaseY + 30);
        
        // 뒷창문 그리기 (아래쪽 왼쪽)
        const bottomRearWindowX = bottomPartsStartX + rearWindowLength/2;
        ctx.fillStyle = currentCarColor;
        ctx.strokeStyle = '#333333';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(bottomRearWindowX - rearWindowLength/2, bottomBaseY);
        ctx.lineTo(bottomRearWindowX + rearWindowLength/2, bottomBaseY);
        ctx.lineTo(bottomRearWindowX + rearWindowLength/2, bottomBaseY - carWidth);
        ctx.lineTo(bottomRearWindowX - rearWindowLength/2, bottomBaseY - carWidth);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // "뒷창문" 텍스트
        ctx.fillStyle = '#333333';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('뒷창문', bottomRearWindowX, bottomBaseY + 30);
        
        // 뒷유리 그리기 (뒷창문 위에)
        const suvRearGlassX = bottomRearWindowX; // 뒷창문 부품과 같은 X 위치
        const suvRearGlassY = bottomBaseY - carWidth/2; // 뒷창문 부품 중앙 높이
        
        ctx.beginPath();
        // 뒷창문 부품의 58% 크기로 뒷유리 그리기
        const suvRearGlassWidth = rearWindowLength * 0.58;
        const suvRearGlassHeight = carWidth * 0.78;
        
        ctx.moveTo(suvRearGlassX - suvRearGlassWidth/2, suvRearGlassY + suvRearGlassHeight/2);
        ctx.lineTo(suvRearGlassX + suvRearGlassWidth/2, suvRearGlassY + suvRearGlassHeight/2);
        ctx.lineTo(suvRearGlassX + suvRearGlassWidth/2, suvRearGlassY - suvRearGlassHeight/2);
        ctx.lineTo(suvRearGlassX - suvRearGlassWidth/2, suvRearGlassY - suvRearGlassHeight/2);
        ctx.closePath();
        ctx.fillStyle = '#87CEEB'; // 하늘색
        ctx.fill();
        ctx.strokeStyle = '#333333';
        ctx.lineWidth = 1;
        ctx.stroke();

      } else if (carType === 'truck') {
        // 빵빵트럭: truck - 앞면, 앞창문, 지붕, 뒷유리, 베드, 뒷면
        const totalDepth = 2.5; // 차체폭 (예전에 구한 값)
        const carWidth = totalDepth * scale; // 차체폭
        
        // 차량 색상 설정 (2페이지와 동일)
        ctx.fillStyle = currentCarColor;

        // 2페이지와 동일한 위치 기준 사용
        const a4Height = canvas.height;
        const topBaseY = a4Height / 3 + 200; // 2페이지와 동일한 위쪽 기준선
        const bottomBaseY = a4Height * 2 / 3 + 200; // 2페이지와 동일한 아래쪽 기준선
        
        // 2페이지 측면도에서 사용한 carShapePoints 좌표 기준으로 계산
        const carShapePoints = createTruckShape();
        
        // === 위쪽 부품들 (앞면~지붕) - 전체 너비 계산 후 가운데 정렬 ===
        // 각 부품의 길이 계산 (3D 모델 좌표 기준)
        // carShapePoints[0]: [-totalLength/2, 0] - 시작점
        // carShapePoints[1]: [-totalLength/2, bonnetHeight] - 앞면 상단
        // carShapePoints[2]: [-totalLength/3, cabinHeight] - A필러 (앞창문)
        // carShapePoints[3]: [totalLength/500, cabinHeight] - 캐빈 지붕 끝
        // carShapePoints[4]: [totalLength/500, bedHeight] - 베드 시작 (캐빈 뒷면)
        // carShapePoints[5]: [totalLength/1.5, bedHeight] - 베드 끝
        // carShapePoints[6]: [totalLength/1.5, 0] - 뒷면 하단
        
        // === 트럭 각 영역 길이 계산 방법 (메모) ===
        // 1. 앞면: Y좌표 차이 (높이) - carShapePoints[1][1] - carShapePoints[0][1]
        // 2. 앞창문: 대각선 길이 (피타고라스) - √(dx² + dy²) - carShapePoints[1]에서 carShapePoints[2]까지
        // 3. 지붕: X좌표 차이 (수평 길이) - carShapePoints[3][0] - carShapePoints[2][0]
        // 4. 뒷창문: Y좌표 차이 (높이) - carShapePoints[4][1] - carShapePoints[3][1]
        // 5. 베드: X좌표 차이 (수평 길이) - carShapePoints[5][0] - carShapePoints[4][0]
        // 6. 뒷면: Y좌표 차이 (높이) - carShapePoints[6][1] - carShapePoints[5][1]
        
        const frontLength = Math.abs(carShapePoints[1][1] - carShapePoints[0][1]) * scale; // 앞면 (높이, Y좌표 차이)
        // 앞창문 대각선 길이 계산
        const frontWindowDx = carShapePoints[2][0] - carShapePoints[1][0]; // X 차이
        const frontWindowDy = carShapePoints[2][1] - carShapePoints[1][1]; // Y 차이
        const frontWindowLength = Math.sqrt(frontWindowDx * frontWindowDx + frontWindowDy * frontWindowDy) * scale; // 대각선 길이
        const roofLength = Math.abs(carShapePoints[3][0] - carShapePoints[2][0]) * scale; // 캐빈 지붕
        const rearWindowLength = Math.abs(carShapePoints[4][1] - carShapePoints[3][1]) * scale; // 캐빈 뒷면 (뒷유리, Y좌표 차이 = 높이)
        const bedLength = Math.abs(carShapePoints[5][0] - carShapePoints[4][0]) * scale; // 베드
        const rearLength = Math.abs(carShapePoints[6][1] - carShapePoints[5][1]) * scale; // 뒷면 (높이, Y좌표 차이)
        
        // === 위쪽 부품들 (앞면, 앞창문, 지붕, 뒷창문) - 가운데 정렬 ===
        const topPartsWidth = frontLength + frontWindowLength + roofLength + rearWindowLength + (3 * 50); // 3개 간격 * 50px
        const topPartsStartX = centerX - topPartsWidth / 2; // 위쪽 부품들을 가운데 정렬
        
        // === 아래쪽 부품들 (베드, 뒷면) - 가운데 정렬 ===
        const bottomPartsWidth = bedLength + rearLength + (1 * 50); // 1개 간격 * 50px
        const bottomPartsStartX = centerX - bottomPartsWidth / 2; // 아래쪽 부품들을 가운데 정렬
        
        // === 위쪽 부품들 그리기 (앞면, 앞창문, 지붕, 뒷창문) ===
        
        // 뒷창문 그리기 (가장 오른쪽)
        const rearWindowX = topPartsStartX + topPartsWidth - rearWindowLength/2;
        ctx.fillStyle = currentCarColor;
        ctx.strokeStyle = '#333333';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(rearWindowX - rearWindowLength/2, topBaseY);
        ctx.lineTo(rearWindowX + rearWindowLength/2, topBaseY);
        ctx.lineTo(rearWindowX + rearWindowLength/2, topBaseY - carWidth);
        ctx.lineTo(rearWindowX - rearWindowLength/2, topBaseY - carWidth);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // "뒷창문" 텍스트
        ctx.fillStyle = '#333333';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('뒷창문', rearWindowX, topBaseY + 30);
        
        // 지붕 그리기 (뒷창문 왼쪽)
        const roofX = topPartsStartX + frontLength + frontWindowLength + 50 + 50 + roofLength/2;
        ctx.fillStyle = currentCarColor;
        ctx.strokeStyle = '#333333';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(roofX - roofLength/2, topBaseY);
        ctx.lineTo(roofX + roofLength/2, topBaseY);
        ctx.lineTo(roofX + roofLength/2, topBaseY - carWidth);
        ctx.lineTo(roofX - roofLength/2, topBaseY - carWidth);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // "지붕" 텍스트
        ctx.fillStyle = '#333333';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('지붕', roofX, topBaseY + 30);
        
        // 앞창문 그리기 (지붕 왼쪽)
        const frontWindowX = topPartsStartX + frontLength + 50 + frontWindowLength/2;
        ctx.fillStyle = currentCarColor;
        ctx.strokeStyle = '#333333';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(frontWindowX - frontWindowLength/2, topBaseY);
        ctx.lineTo(frontWindowX + frontWindowLength/2, topBaseY);
        ctx.lineTo(frontWindowX + frontWindowLength/2, topBaseY - carWidth);
        ctx.lineTo(frontWindowX - frontWindowLength/2, topBaseY - carWidth);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // "앞창문" 텍스트
        ctx.fillStyle = '#333333';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('앞창문', frontWindowX, topBaseY + 30);
        
        // 앞면 그리기 (가장 왼쪽)
        const frontX = topPartsStartX + frontLength/2;
        ctx.fillStyle = currentCarColor;
        ctx.strokeStyle = '#333333';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(frontX - frontLength/2, topBaseY);
        ctx.lineTo(frontX + frontLength/2, topBaseY);
        ctx.lineTo(frontX + frontLength/2, topBaseY - carWidth);
        ctx.lineTo(frontX - frontLength/2, topBaseY - carWidth);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // "앞면" 텍스트
        ctx.fillStyle = '#333333';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('앞면', frontX, topBaseY + 30);
        
        // === 아래쪽 부품들 그리기 (베드, 뒷면) ===
        
        // 베드 그리기 (아래쪽 왼쪽)
        const bedX = bottomPartsStartX + bedLength/2;
        ctx.fillStyle = currentCarColor;
        ctx.strokeStyle = '#333333';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(bedX - bedLength/2, bottomBaseY);
        ctx.lineTo(bedX + bedLength/2, bottomBaseY);
        ctx.lineTo(bedX + bedLength/2, bottomBaseY - carWidth);
        ctx.lineTo(bedX - bedLength/2, bottomBaseY - carWidth);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // "베드" 텍스트
        ctx.fillStyle = '#333333';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('베드', bedX, bottomBaseY + 30);
        
        // 뒷면 그리기 (아래쪽 오른쪽)
        const rearX = bottomPartsStartX + bottomPartsWidth - rearLength/2;
        ctx.fillStyle = currentCarColor;
        ctx.strokeStyle = '#333333';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(rearX - rearLength/2, bottomBaseY);
        ctx.lineTo(rearX + rearLength/2, bottomBaseY);
        ctx.lineTo(rearX + rearLength/2, bottomBaseY - carWidth);
        ctx.lineTo(rearX - rearLength/2, bottomBaseY - carWidth);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // "뒷면" 텍스트
        ctx.fillStyle = '#333333';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('뒷면', rearX, bottomBaseY + 30);
        

        // === 위쪽 부품들에 유리 추가 ===
        
        // 뒷유리 그리기 (뒷창문 위에)
        const truckRearGlassX = rearWindowX; // 뒷창문 부품과 같은 X 위치
        const truckRearGlassY = topBaseY - carWidth/2; // 뒷창문 부품 중앙 높이
        
        ctx.beginPath();
        // 뒷창문 부품의 58% 크기로 뒷유리 그리기
        const truckRearGlassWidth = rearWindowLength * 0.58;
        const truckRearGlassHeight = carWidth * 0.78;
        
        ctx.moveTo(truckRearGlassX - truckRearGlassWidth/2, truckRearGlassY + truckRearGlassHeight/2);
        ctx.lineTo(truckRearGlassX + truckRearGlassWidth/2, truckRearGlassY + truckRearGlassHeight/2);
        ctx.lineTo(truckRearGlassX + truckRearGlassWidth/2, truckRearGlassY - truckRearGlassHeight/2);
        ctx.lineTo(truckRearGlassX - truckRearGlassWidth/2, truckRearGlassY - truckRearGlassHeight/2);
        ctx.closePath();
        ctx.fillStyle = '#87CEEB'; // 하늘색
        ctx.fill();
        ctx.strokeStyle = '#333333';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // 앞유리 그리기 (앞창문 위에)
        const truckFrontGlassX = frontWindowX; // 앞창문 부품과 같은 X 위치
        const truckFrontGlassY = topBaseY - carWidth/2; // 앞창문 부품 중앙 높이
        
        ctx.beginPath();
        // 앞창문 부품의 58% 크기로 앞유리 그리기
        const truckFrontGlassWidth = frontWindowLength * 0.58;
        const truckFrontGlassHeight = carWidth * 0.78;
        
        ctx.moveTo(truckFrontGlassX - truckFrontGlassWidth/2, truckFrontGlassY + truckFrontGlassHeight/2);
        ctx.lineTo(truckFrontGlassX + truckFrontGlassWidth/2, truckFrontGlassY + truckFrontGlassHeight/2);
        ctx.lineTo(truckFrontGlassX + truckFrontGlassWidth/2, truckFrontGlassY - truckFrontGlassHeight/2);
        ctx.lineTo(truckFrontGlassX - truckFrontGlassWidth/2, truckFrontGlassY - truckFrontGlassHeight/2);
        ctx.closePath();
        ctx.fillStyle = '#87CEEB'; // 하늘색
        ctx.fill();
        ctx.strokeStyle = '#333333';
        ctx.lineWidth = 1;
        ctx.stroke();

      } else if (carType === 'bus') {
        // 네모버스: bus - 앞면, 보닛, 앞창문, 지붕, 뒷면
        const totalDepth = 2.5; // 차체폭 (예전에 구한 값)
        const carWidth = totalDepth * scale; // 차체폭
        
        // 차량 색상 설정 (2페이지와 동일)
        ctx.fillStyle = currentCarColor;

        // 2페이지와 동일한 위치 기준 사용
        const a4Height = canvas.height;
        const topBaseY = a4Height / 3 + 200; // 위쪽 부품들의 기준선
        const bottomBaseY = a4Height / 3 + 200 + carWidth + 100; // 아래쪽 부품들의 기준선 (위쪽 부품 아래 + 간격)
        
        // 2페이지 측면도에서 사용한 carShapePoints 좌표 기준으로 계산
        const carShapePoints = createBusShape();
        
        // === 네모버스 각 영역 길이 계산 방법 (메모) - 통통버스 계산 방식 참고 ===
        // 1. 앞면: Y좌표 차이 (높이) - carShapePoints[1][1] - carShapePoints[0][1]
        //    → Math.abs(carShapePoints[1][1] - carShapePoints[0][1]) * scale
        // 2. 앞창문: 대각선 길이 (피타고라스) - √(dx² + dy²) - carShapePoints[1]에서 carShapePoints[2]까지
        //    → dx = carShapePoints[2][0] - carShapePoints[1][0], dy = carShapePoints[2][1] - carShapePoints[1][1]
        //    → Math.sqrt(dx*dx + dy*dy) * scale
        // 3. 지붕: X좌표 차이 (수평 길이) - carShapePoints[3][0] - carShapePoints[2][0]
        //    → Math.abs(carShapePoints[3][0] - carShapePoints[2][0]) * scale
        // 4. 뒷면: Y좌표 차이 (높이) - carShapePoints[4][1] - carShapePoints[3][1] (뒷창문과 뒷면이 하나)
        //    → Math.abs(carShapePoints[4][1] - carShapePoints[3][1]) * scale
        // 
        // 주의사항: 네모버스는 보닛이 없으므로 4개 부품만 존재 (앞면, 앞창문, 지붕, 뒷면)
        // 통통버스와 달리 보닛 계산은 하지 않음
        
        const frontLength = Math.abs(carShapePoints[1][1] - carShapePoints[0][1]) * scale; // 앞면 (높이, Y좌표 차이)
        
        // 앞창문 대각선 길이 계산 (통통버스와 동일한 방식)
        const frontWindowDx = carShapePoints[2][0] - carShapePoints[1][0]; // X 차이
        const frontWindowDy = carShapePoints[2][1] - carShapePoints[1][1]; // Y 차이
        const frontWindowLength = Math.sqrt(frontWindowDx * frontWindowDx + frontWindowDy * frontWindowDy) * scale; // 대각선 길이
        
        const roofLength = Math.abs(carShapePoints[3][0] - carShapePoints[2][0]) * scale; // 지붕 (통통버스와 동일한 방식)
        
        const rearLength = Math.abs(carShapePoints[4][1] - carShapePoints[3][1]) * scale; // 뒷면 (높이, Y좌표 차이) - 뒷창문과 뒷면이 하나
        
        // === 위쪽 부품들 (앞면, 앞창문, 지붕) - 가운데 정렬 ===
        const topPartsWidth = frontLength + frontWindowLength + roofLength + (2 * 50); // 2개 간격 * 50px
        const topPartsStartX = centerX - topPartsWidth / 2; // 위쪽 부품들을 가운데 정렬
        
        // === 아래쪽 부품들 (뒷면만) - 가운데 정렬 ===
        const bottomPartsWidth = rearLength; // 뒷면만 있음
        const bottomPartsStartX = centerX - bottomPartsWidth / 2; // 아래쪽 부품들을 가운데 정렬
        
        // === 위쪽 부품들 그리기 (오른쪽부터) ===
        // 지붕 그리기 (가장 오른쪽)
        const roofX = topPartsStartX + topPartsWidth - roofLength/2;
        ctx.fillStyle = currentCarColor;
        ctx.strokeStyle = '#333333';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(roofX - roofLength/2, topBaseY);
        ctx.lineTo(roofX + roofLength/2, topBaseY);
        ctx.lineTo(roofX + roofLength/2, topBaseY - carWidth);
        ctx.lineTo(roofX - roofLength/2, topBaseY - carWidth);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // "지붕" 텍스트
        ctx.fillStyle = '#333333';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('지붕', roofX, topBaseY + 30);
        
        // 앞창문 그리기 (지붕 왼쪽)
        const frontWindowX = topPartsStartX + topPartsWidth - roofLength - 50 - frontWindowLength/2;
        ctx.fillStyle = currentCarColor;
        ctx.strokeStyle = '#333333';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(frontWindowX - frontWindowLength/2, topBaseY);
        ctx.lineTo(frontWindowX + frontWindowLength/2, topBaseY);
        ctx.lineTo(frontWindowX + frontWindowLength/2, topBaseY - carWidth);
        ctx.lineTo(frontWindowX - frontWindowLength/2, topBaseY - carWidth);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // "앞창문" 텍스트
        ctx.fillStyle = '#333333';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('앞창문', frontWindowX, topBaseY + 30);
        
        // 앞유리 그리기 (앞창문 위에)
        const busFrontGlassX = frontWindowX; // 앞창문 부품과 같은 X 위치
        const busFrontGlassY = topBaseY - carWidth/2; // 앞창문 부품 중앙 높이
        
        ctx.beginPath();
        // 앞창문 부품의 58% 크기로 앞유리 그리기
        const busFrontGlassWidth = frontWindowLength * 0.58;
        const busFrontGlassHeight = carWidth * 0.78;
        
        ctx.moveTo(busFrontGlassX - busFrontGlassWidth/2, busFrontGlassY + busFrontGlassHeight/2);
        ctx.lineTo(busFrontGlassX + busFrontGlassWidth/2, busFrontGlassY + busFrontGlassHeight/2);
        ctx.lineTo(busFrontGlassX + busFrontGlassWidth/2, busFrontGlassY - busFrontGlassHeight/2);
        ctx.lineTo(busFrontGlassX - busFrontGlassWidth/2, busFrontGlassY - busFrontGlassHeight/2);
        ctx.closePath();
        ctx.fillStyle = '#87CEEB'; // 하늘색
        ctx.fill();
        ctx.strokeStyle = '#333333';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // 앞면 그리기 (앞창문 왼쪽)
        const frontX = topPartsStartX + frontLength/2;
        ctx.fillStyle = currentCarColor;
        ctx.strokeStyle = '#333333';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(frontX - frontLength/2, topBaseY);
        ctx.lineTo(frontX + frontLength/2, topBaseY);
        ctx.lineTo(frontX + frontLength/2, topBaseY - carWidth);
        ctx.lineTo(frontX - frontLength/2, topBaseY - carWidth);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // "앞면" 텍스트
        ctx.fillStyle = '#333333';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('앞면', frontX, topBaseY + 30);
        
        // === 아래쪽 부품들 그리기 ===
        // 뒷면 그리기 (아래쪽 가운데)
        const bottomRearX = centerX;
        ctx.fillStyle = currentCarColor;
        ctx.strokeStyle = '#333333';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(bottomRearX - rearLength/2, bottomBaseY);
        ctx.lineTo(bottomRearX + rearLength/2, bottomBaseY);
        ctx.lineTo(bottomRearX + rearLength/2, bottomBaseY - carWidth);
        ctx.lineTo(bottomRearX - rearLength/2, bottomBaseY - carWidth);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // "뒷면" 텍스트
        ctx.fillStyle = '#333333';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('뒷면', bottomRearX, bottomBaseY + 30);

        // === 뒷유리 그리기 (뒷면 위에) ===
        // 앞유리 크기와 동일하게 설정
        const busRearGlassWidth = frontWindowLength * 0.58; // 앞유리와 같은 비율
        const busRearGlassHeight = carWidth * 0.78; // 앞유리와 같은 높이
        
        // 뒷면 좌측에 붙이기 (통통버스와 동일한 간격)
        const busRearGlassX = bottomRearX - rearLength/2 + busRearGlassWidth/2 + 35; // 뒷면 좌측 + 여백 (통통버스와 동일)
        const busRearGlassY = bottomBaseY - carWidth/2; // 뒷면 부품 중앙 높이
        
        ctx.beginPath();
        
        ctx.moveTo(busRearGlassX - busRearGlassWidth/2, busRearGlassY + busRearGlassHeight/2);
        ctx.lineTo(busRearGlassX + busRearGlassWidth/2, busRearGlassY + busRearGlassHeight/2);
        ctx.lineTo(busRearGlassX + busRearGlassWidth/2, busRearGlassY - busRearGlassHeight/2);
        ctx.lineTo(busRearGlassX - busRearGlassWidth/2, busRearGlassY - busRearGlassHeight/2);
        ctx.closePath();
        ctx.fillStyle = '#87CEEB'; // 하늘색
        ctx.fill();
        ctx.strokeStyle = '#333333';
        ctx.lineWidth = 1;
        ctx.stroke();

      } else if (carType === 'bus-type2') {
        // 통통버스: bus-type2 - 앞면, 보닛, 앞창문, 지붕, 뒷창문, 뒷면
        const totalDepth = 2.5; // 차체폭 (예전에 구한 값)
        const carWidth = totalDepth * scale; // 차체폭
        
        // 차량 색상 설정 (2페이지와 동일)
        ctx.fillStyle = currentCarColor;

        // 2페이지와 동일한 위치 기준 사용
        const a4Height = canvas.height;
        const topBaseY = a4Height / 3 + 200; // 위쪽 부품들의 기준선
        const bottomBaseY = a4Height / 3 + 200 + carWidth + 100; // 아래쪽 부품들의 기준선 (위쪽 부품 아래 + 간격)
        
        // 2페이지 측면도에서 사용한 carShapePoints 좌표 기준으로 계산
        const carShapePoints = createBusType2Shape();
        
        // === 통통버스 각 영역 길이 계산 방법 (메모) ===
        // 1. 앞면: Y좌표 차이 (높이) - carShapePoints[1][1] - carShapePoints[0][1]
        // 2. 보닛: 대각선 길이 (피타고라스) - √(dx² + dy²) - carShapePoints[1]에서 carShapePoints[2]까지
        // 3. 앞창문: 대각선 길이 (피타고라스) - √(dx² + dy²) - carShapePoints[2]에서 carShapePoints[3]까지
        // 4. 지붕: X좌표 차이 (수평 길이) - carShapePoints[4][0] - carShapePoints[3][0]
        // 5. 뒷면: Y좌표 차이 (높이) - carShapePoints[5][1] - carShapePoints[4][1] (뒷창문과 뒷면이 하나)
        
        const frontLength = Math.abs(carShapePoints[1][1] - carShapePoints[0][1]) * scale; // 앞면 (높이, Y좌표 차이)
        
        // 보닛 대각선 길이 계산
        const bonnetDx = carShapePoints[2][0] - carShapePoints[1][0]; // X 차이
        const bonnetDy = carShapePoints[2][1] - carShapePoints[1][1]; // Y 차이
        const bonnetLength = Math.sqrt(bonnetDx * bonnetDx + bonnetDy * bonnetDy) * scale; // 대각선 길이
        
        // 앞창문 대각선 길이 계산
        const frontWindowDx = carShapePoints[3][0] - carShapePoints[2][0]; // X 차이
        const frontWindowDy = carShapePoints[3][1] - carShapePoints[2][1]; // Y 차이
        const frontWindowLength = Math.sqrt(frontWindowDx * frontWindowDx + frontWindowDy * frontWindowDy) * scale; // 대각선 길이
        
        const roofLength = Math.abs(carShapePoints[4][0] - carShapePoints[3][0]) * scale; // 지붕
        
        const rearLength = Math.abs(carShapePoints[5][1] - carShapePoints[4][1]) * scale; // 뒷면 (높이, Y좌표 차이) - 뒷창문과 뒷면이 하나
        
        // === 위쪽 부품들 (앞면, 보닛, 앞창문, 지붕) - 가운데 정렬 ===
        const topPartsWidth = frontLength + bonnetLength + frontWindowLength + roofLength + (3 * 50); // 3개 간격 * 50px
        const topPartsStartX = centerX - topPartsWidth / 2; // 위쪽 부품들을 가운데 정렬
        
        // === 아래쪽 부품들 (뒷면만) - 가운데 정렬 ===
        const bottomPartsWidth = rearLength; // 뒷면만 있음
        const bottomPartsStartX = centerX - bottomPartsWidth / 2; // 아래쪽 부품들을 가운데 정렬
        
        // === 위쪽 부품들 그리기 (오른쪽부터) ===
        // 지붕 그리기 (가장 오른쪽)
        const roofX = topPartsStartX + topPartsWidth - roofLength/2;
        ctx.fillStyle = currentCarColor;
        ctx.strokeStyle = '#333333';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(roofX - roofLength/2, topBaseY);
        ctx.lineTo(roofX + roofLength/2, topBaseY);
        ctx.lineTo(roofX + roofLength/2, topBaseY - carWidth);
        ctx.lineTo(roofX - roofLength/2, topBaseY - carWidth);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // "지붕" 텍스트
        ctx.fillStyle = '#333333';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('지붕', roofX, topBaseY + 30);
        
        // 앞창문 그리기 (지붕 왼쪽)
        const frontWindowX = topPartsStartX + topPartsWidth - roofLength - 50 - frontWindowLength/2;
        ctx.fillStyle = currentCarColor;
        ctx.strokeStyle = '#333333';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(frontWindowX - frontWindowLength/2, topBaseY);
        ctx.lineTo(frontWindowX + frontWindowLength/2, topBaseY);
        ctx.lineTo(frontWindowX + frontWindowLength/2, topBaseY - carWidth);
        ctx.lineTo(frontWindowX - frontWindowLength/2, topBaseY - carWidth);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // "앞창문" 텍스트
        ctx.fillStyle = '#333333';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('앞창문', frontWindowX, topBaseY + 30);
        
        // 앞유리 그리기 (앞창문 위에)
        const busType2FrontGlassX = frontWindowX; // 앞창문 부품과 같은 X 위치
        const busType2FrontGlassY = topBaseY - carWidth/2; // 앞창문 부품 중앙 높이
        
        ctx.beginPath();
        // 앞창문 부품의 58% 크기로 앞유리 그리기
        const busType2FrontGlassWidth = frontWindowLength * 0.58;
        const busType2FrontGlassHeight = carWidth * 0.78;
        
        ctx.moveTo(busType2FrontGlassX - busType2FrontGlassWidth/2, busType2FrontGlassY + busType2FrontGlassHeight/2);
        ctx.lineTo(busType2FrontGlassX + busType2FrontGlassWidth/2, busType2FrontGlassY + busType2FrontGlassHeight/2);
        ctx.lineTo(busType2FrontGlassX + busType2FrontGlassWidth/2, busType2FrontGlassY - busType2FrontGlassHeight/2);
        ctx.lineTo(busType2FrontGlassX - busType2FrontGlassWidth/2, busType2FrontGlassY - busType2FrontGlassHeight/2);
        ctx.closePath();
        ctx.fillStyle = '#87CEEB'; // 하늘색
        ctx.fill();
        ctx.strokeStyle = '#333333';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // 보닛 그리기 (앞창문 왼쪽)
        const bonnetX = topPartsStartX + topPartsWidth - roofLength - 50 - frontWindowLength - 50 - bonnetLength/2;
        ctx.fillStyle = currentCarColor;
        ctx.strokeStyle = '#333333';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(bonnetX - bonnetLength/2, topBaseY);
        ctx.lineTo(bonnetX + bonnetLength/2, topBaseY);
        ctx.lineTo(bonnetX + bonnetLength/2, topBaseY - carWidth);
        ctx.lineTo(bonnetX - bonnetLength/2, topBaseY - carWidth);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // "보닛" 텍스트
        ctx.fillStyle = '#333333';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('보닛', bonnetX, topBaseY + 30);
        
        // 앞면 그리기 (보닛 왼쪽)
        const frontX = topPartsStartX + frontLength/2;
        ctx.fillStyle = currentCarColor;
        ctx.strokeStyle = '#333333';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(frontX - frontLength/2, topBaseY);
        ctx.lineTo(frontX + frontLength/2, topBaseY);
        ctx.lineTo(frontX + frontLength/2, topBaseY - carWidth);
        ctx.lineTo(frontX - frontLength/2, topBaseY - carWidth);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // "앞면" 텍스트
        ctx.fillStyle = '#333333';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('앞면', frontX, topBaseY + 30);
        
        // === 아래쪽 부품들 그리기 ===
        // 뒷면 그리기 (뒷창문과 뒷면이 하나)
        const bottomRearX = bottomPartsStartX + rearLength/2;
        ctx.fillStyle = currentCarColor;
        ctx.strokeStyle = '#333333';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(bottomRearX - rearLength/2, bottomBaseY);
        ctx.lineTo(bottomRearX + rearLength/2, bottomBaseY);
        ctx.lineTo(bottomRearX + rearLength/2, bottomBaseY - carWidth);
        ctx.lineTo(bottomRearX - rearLength/2, bottomBaseY - carWidth);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // "뒷면" 텍스트
        ctx.fillStyle = '#333333';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('뒷면', bottomRearX, bottomBaseY + 30);
        
        // 뒷유리 그리기 (앞유리와 같은 크기로 뒷면 좌측에 붙이기)
        // 앞유리 크기와 동일하게 설정
        const busType2RearGlassWidth = frontWindowLength * 0.58; // 앞유리와 같은 비율
        const busType2RearGlassHeight = carWidth * 0.78; // 앞유리와 같은 높이
        
        // 뒷면 좌측에 붙이기 (앞창문과 같은 간격)
        const busType2RearGlassX = bottomRearX - rearLength/2 + busType2RearGlassWidth/2 + 35; // 뒷면 좌측 + 여백 (5px 좌측 이동)
        const busType2RearGlassY = bottomBaseY - carWidth/2; // 뒷면 부품 중앙 높이
        
        ctx.beginPath();
        ctx.moveTo(busType2RearGlassX - busType2RearGlassWidth/2, busType2RearGlassY + busType2RearGlassHeight/2);
        ctx.lineTo(busType2RearGlassX + busType2RearGlassWidth/2, busType2RearGlassY + busType2RearGlassHeight/2);
        ctx.lineTo(busType2RearGlassX + busType2RearGlassWidth/2, busType2RearGlassY - busType2RearGlassHeight/2);
        ctx.lineTo(busType2RearGlassX - busType2RearGlassWidth/2, busType2RearGlassY - busType2RearGlassHeight/2);
        ctx.closePath();
        ctx.fillStyle = '#87CEEB'; // 하늘색
        ctx.fill();
        ctx.strokeStyle = '#333333';
        ctx.lineWidth = 1;
        ctx.stroke();

      } else if (carType === 'sedan') {
        // 꼬마세단: sedan - 큰세단 참고해서 2행 레이아웃으로 재작업
        const totalDepth = 2.5; // 차체폭 (예전에 구한 값)
        const carWidth = totalDepth * scale; // 차체폭
        
        // 차량 색상 설정 (2페이지와 동일)
        ctx.fillStyle = currentCarColor;

        // 2페이지와 동일한 위치 기준 사용
        const a4Height = canvas.height;
        const topBaseY = a4Height / 3 + 200; // 2페이지와 동일한 위쪽 기준선
        const bottomBaseY = a4Height * 2 / 3 + 200; // 2페이지와 동일한 아래쪽 기준선
        
        // 꼬마세단 3D 모델에서 carShapePoints 가져오기
        const carShapePoints = createSedanShape();
        
        // === 꼬마세단 각 영역 길이 계산 방법 (메모) - 큰세단 계산 방식 참고 ===
        // 1. 앞면: Y좌표 차이 (높이) - carShapePoints[1][1] - carShapePoints[0][1]
        //    → Math.abs(carShapePoints[1][1] - carShapePoints[0][1]) * scale
        // 2. 보닛: 대각선 길이 (피타고라스) - √(dx² + dy²) - carShapePoints[1]에서 carShapePoints[2]까지
        //    → dx = carShapePoints[2][0] - carShapePoints[1][0], dy = carShapePoints[2][1] - carShapePoints[1][1]
        //    → Math.sqrt(dx*dx + dy*dy) * scale
        // 3. 앞창문: 대각선 길이 (피타고라스) - √(dx² + dy²) - carShapePoints[2]에서 carShapePoints[3]까지
        //    → dx = carShapePoints[3][0] - carShapePoints[2][0], dy = carShapePoints[3][1] - carShapePoints[2][1]
        //    → Math.sqrt(dx*dx + dy*dy) * scale
        // 4. 지붕: X좌표 차이 (수평 길이) - carShapePoints[4][0] - carShapePoints[3][0]
        //    → Math.abs(carShapePoints[4][0] - carShapePoints[3][0]) * scale
        // 5. 뒷창문: 대각선 길이 (피타고라스) - √(dx² + dy²) - carShapePoints[4]에서 carShapePoints[5]까지
        //    → dx = carShapePoints[5][0] - carShapePoints[4][0], dy = carShapePoints[5][1] - carShapePoints[4][1]
        //    → Math.sqrt(dx*dx + dy*dy) * scale
        // 6. 트렁크: 대각선 길이 (피타고라스) - √(dx² + dy²) - carShapePoints[5]에서 carShapePoints[6]까지
        //    → dx = carShapePoints[6][0] - carShapePoints[5][0], dy = carShapePoints[6][1] - carShapePoints[5][1]
        //    → Math.sqrt(dx*dx + dy*dy) * scale
        // 7. 뒷면: Y좌표 차이 (높이) - carShapePoints[7][1] - carShapePoints[6][1]
        //    → Math.abs(carShapePoints[7][1] - carShapePoints[6][1]) * scale
        //
        // 주의사항: 꼬마세단은 8개 포인트를 사용 (carShapePoints[0] ~ carShapePoints[7])
        // 앞면과 뒷면은 Y좌표 차이로 계산, 지붕은 X좌표 차이로 계산, 나머지는 대각선 길이(피타고라스)로 계산
        // 큰세단과 동일하게 지붕은 X좌표 차이로 계산 (수평 길이)
        // 
        // 계산 방식 요약:
        // - Y좌표 차이 (높이): 앞면, 뒷면
        // - X좌표 차이 (수평 길이): 지붕
        // - 대각선 길이 (피타고라스): 보닛, 앞창문, 뒷창문, 트렁크
        // 
        // 나중에 다른 방식으로 계산하는 실수 방지를 위해 반드시 이 방식을 따를 것!
        
        // 각 부품의 길이 계산
        const frontLength = Math.abs(carShapePoints[1][1] - carShapePoints[0][1]) * scale;
        
        // 보닛: 대각선 길이 (피타고라스)
        const bonnetDx = carShapePoints[2][0] - carShapePoints[1][0];
        const bonnetDy = carShapePoints[2][1] - carShapePoints[1][1];
        const bonnetLength = Math.sqrt(bonnetDx * bonnetDx + bonnetDy * bonnetDy) * scale;
        
        // 앞창문: 대각선 길이 (피타고라스)
        const frontWindowDx = carShapePoints[3][0] - carShapePoints[2][0];
        const frontWindowDy = carShapePoints[3][1] - carShapePoints[2][1];
        const frontWindowLength = Math.sqrt(frontWindowDx * frontWindowDx + frontWindowDy * frontWindowDy) * scale;
        
        // 지붕: X좌표 차이 (수평 길이)
        const roofLength = Math.abs(carShapePoints[4][0] - carShapePoints[3][0]) * scale;
        
        // 뒷창문: 대각선 길이 (피타고라스)
        const rearWindowDx = carShapePoints[5][0] - carShapePoints[4][0];
        const rearWindowDy = carShapePoints[5][1] - carShapePoints[4][1];
        const rearWindowLength = Math.sqrt(rearWindowDx * rearWindowDx + rearWindowDy * rearWindowDy) * scale;
        
        // 트렁크: 대각선 길이 (피타고라스)
        const trunkDx = carShapePoints[6][0] - carShapePoints[5][0];
        const trunkDy = carShapePoints[6][1] - carShapePoints[5][1];
        const trunkLength = Math.sqrt(trunkDx * trunkDx + trunkDy * trunkDy) * scale;
        
        const rearLength = Math.abs(carShapePoints[7][1] - carShapePoints[6][1]) * scale;
        
        // === 위쪽 부품들 (앞면, 보닛, 앞창문, 지붕) - 2행 레이아웃 ===
        const topPartsWidth = frontLength + bonnetLength + frontWindowLength + roofLength + (3 * 50); // 3개 간격 * 50px
        const topPartsStartX = centerX - topPartsWidth / 2;
        
        // 앞면 그리기
        const topFrontX = topPartsStartX + frontLength/2;
        ctx.fillStyle = currentCarColor;
        ctx.strokeStyle = '#333333';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(topFrontX - frontLength/2, topBaseY);
        ctx.lineTo(topFrontX + frontLength/2, topBaseY);
        ctx.lineTo(topFrontX + frontLength/2, topBaseY - carWidth);
        ctx.lineTo(topFrontX - frontLength/2, topBaseY - carWidth);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // "앞면" 텍스트
        ctx.fillStyle = '#333333';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('앞면', topFrontX, topBaseY + 30);
        
        // 보닛 그리기
        const topBonnetX = topPartsStartX + frontLength + 50 + bonnetLength/2;
        ctx.fillStyle = currentCarColor;
        ctx.strokeStyle = '#333333';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(topBonnetX - bonnetLength/2, topBaseY);
        ctx.lineTo(topBonnetX + bonnetLength/2, topBaseY);
        ctx.lineTo(topBonnetX + bonnetLength/2, topBaseY - carWidth);
        ctx.lineTo(topBonnetX - bonnetLength/2, topBaseY - carWidth);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // "보닛" 텍스트
        ctx.fillStyle = '#333333';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('보닛', topBonnetX, topBaseY + 30);
        
        // 앞창문 그리기
        const topFrontWindowX = topPartsStartX + frontLength + 50 + bonnetLength + 50 + frontWindowLength/2;
        ctx.fillStyle = currentCarColor;
        ctx.strokeStyle = '#333333';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(topFrontWindowX - frontWindowLength/2, topBaseY);
        ctx.lineTo(topFrontWindowX + frontWindowLength/2, topBaseY);
        ctx.lineTo(topFrontWindowX + frontWindowLength/2, topBaseY - carWidth);
        ctx.lineTo(topFrontWindowX - frontWindowLength/2, topBaseY - carWidth);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // "앞창문" 텍스트
        ctx.fillStyle = '#333333';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('앞창문', topFrontWindowX, topBaseY + 30);
        
        // 앞유리 그리기
        const sedanFrontGlassX = topFrontWindowX;
        const sedanFrontGlassY = topBaseY - carWidth/2;
        ctx.beginPath();
        const sedanFrontGlassWidth = frontWindowLength * 0.58;
        const sedanFrontGlassHeight = carWidth * 0.78;
        ctx.moveTo(sedanFrontGlassX - sedanFrontGlassWidth/2, sedanFrontGlassY + sedanFrontGlassHeight/2);
        ctx.lineTo(sedanFrontGlassX + sedanFrontGlassWidth/2, sedanFrontGlassY + sedanFrontGlassHeight/2);
        ctx.lineTo(sedanFrontGlassX + sedanFrontGlassWidth/2, sedanFrontGlassY - sedanFrontGlassHeight/2);
        ctx.lineTo(sedanFrontGlassX - sedanFrontGlassWidth/2, sedanFrontGlassY - sedanFrontGlassHeight/2);
        ctx.closePath();
        ctx.fillStyle = '#87CEEB';
        ctx.fill();
        ctx.strokeStyle = '#333333';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // 지붕 그리기
        const topRoofX = topPartsStartX + frontLength + 50 + bonnetLength + 50 + frontWindowLength + 50 + roofLength/2;
        ctx.fillStyle = currentCarColor;
        ctx.strokeStyle = '#333333';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(topRoofX - roofLength/2, topBaseY);
        ctx.lineTo(topRoofX + roofLength/2, topBaseY);
        ctx.lineTo(topRoofX + roofLength/2, topBaseY - carWidth);
        ctx.lineTo(topRoofX - roofLength/2, topBaseY - carWidth);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // "지붕" 텍스트
        ctx.fillStyle = '#333333';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('지붕', topRoofX, topBaseY + 30);
        
        // === 아래쪽 부품들 (뒷창문, 트렁크, 뒷면) - 2행 레이아웃 ===
        const bottomPartsWidth = rearWindowLength + trunkLength + rearLength + (2 * 50); // 2개 간격 * 50px
        const bottomPartsStartX = centerX - bottomPartsWidth / 2;
        
        // 뒷창문 그리기
        const bottomRearWindowX = bottomPartsStartX + rearWindowLength/2;
        ctx.fillStyle = currentCarColor;
        ctx.strokeStyle = '#333333';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(bottomRearWindowX - rearWindowLength/2, bottomBaseY);
        ctx.lineTo(bottomRearWindowX + rearWindowLength/2, bottomBaseY);
        ctx.lineTo(bottomRearWindowX + rearWindowLength/2, bottomBaseY - carWidth);
        ctx.lineTo(bottomRearWindowX - rearWindowLength/2, bottomBaseY - carWidth);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // "뒷창문" 텍스트
        ctx.fillStyle = '#333333';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('뒷창문', bottomRearWindowX, bottomBaseY + 30);
        
        // 뒷유리 그리기 (뒷창문 중앙에 배치)
        const sedanRearGlassX = bottomRearWindowX;
        const sedanRearGlassY = bottomBaseY - carWidth/2;
        ctx.beginPath();
        const sedanRearGlassWidth = sedanFrontGlassWidth;
        const sedanRearGlassHeight = sedanFrontGlassHeight;
        ctx.moveTo(sedanRearGlassX - sedanRearGlassWidth/2, sedanRearGlassY + sedanRearGlassHeight/2);
        ctx.lineTo(sedanRearGlassX + sedanRearGlassWidth/2, sedanRearGlassY + sedanRearGlassHeight/2);
        ctx.lineTo(sedanRearGlassX + sedanRearGlassWidth/2, sedanRearGlassY - sedanRearGlassHeight/2);
        ctx.lineTo(sedanRearGlassX - sedanRearGlassWidth/2, sedanRearGlassY - sedanRearGlassHeight/2);
        ctx.closePath();
        ctx.fillStyle = '#87CEEB';
        ctx.fill();
        ctx.strokeStyle = '#333333';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // 트렁크 그리기
        const bottomTrunkX = bottomPartsStartX + rearWindowLength + 50 + trunkLength/2;
        ctx.fillStyle = currentCarColor;
        ctx.strokeStyle = '#333333';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(bottomTrunkX - trunkLength/2, bottomBaseY);
        ctx.lineTo(bottomTrunkX + trunkLength/2, bottomBaseY);
        ctx.lineTo(bottomTrunkX + trunkLength/2, bottomBaseY - carWidth);
        ctx.lineTo(bottomTrunkX - trunkLength/2, bottomBaseY - carWidth);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // "트렁크" 텍스트
        ctx.fillStyle = '#333333';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('트렁크', bottomTrunkX, bottomBaseY + 30);
        
        // 뒷면 그리기
        const bottomRearX = bottomPartsStartX + rearWindowLength + 50 + trunkLength + 50 + rearLength/2;
        ctx.fillStyle = currentCarColor;
        ctx.strokeStyle = '#333333';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(bottomRearX - rearLength/2, bottomBaseY);
        ctx.lineTo(bottomRearX + rearLength/2, bottomBaseY);
        ctx.lineTo(bottomRearX + rearLength/2, bottomBaseY - carWidth);
        ctx.lineTo(bottomRearX - rearLength/2, bottomBaseY - carWidth);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // "뒷면" 텍스트
        ctx.fillStyle = '#333333';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('뒷면', bottomRearX, bottomBaseY + 30);

      }
    });

    if (frontViewPage) pages.push(frontViewPage);

    // 4페이지: 바닥면과 타이어 도안 (깨끗하게 새로 생성)
    const floorViewPage = await createPage('', async (ctx) => {

      // 4페이지 전체를 더 위로 올리기 위해 높이 기준 조정
      const topBaseY = a4Height / 3 + 20; // 180px 위로 올림 (200-20=180)
      const bottomBaseY = a4Height * 2 / 3 + 20; // 180px 위로 올림 (200-20=180)
      const centerX = a4Width / 2;
      const scale = 133;

      // 공통 헤더/푸터 적용
      await drawCommonHeaderFooter(ctx, a4Width, a4Height);

      // 모든 차종의 바닥면과 타이어 도안
      if (carType === 'sedan' || carType === 'sedan-type2' || carType === 'sports' || carType === 'suv' || carType === 'truck' || carType === 'bus-type2' || carType === 'bus') {
        const totalDepth = 2.5;
        const carWidth = totalDepth * scale;
        const carShapePoints = createSedanShape();
        
        // 바닥면 길이 계산 (모든 차종 동일)
        const floorLength = Math.abs(carShapePoints[7][0] - carShapePoints[0][0]) * scale;
        
        // 바닥면을 3페이지와 동일한 높이에 배치 (3페이지 위쪽 부품들과 같은 높이)
        const floorX = centerX;
        const floorY = topBaseY; // 3페이지 위쪽 부품들과 동일한 높이
        
        ctx.fillStyle = currentCarColor;
        ctx.strokeStyle = '#333333';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(floorX - floorLength/2, floorY - carWidth/2);
        ctx.lineTo(floorX + floorLength/2, floorY - carWidth/2);
        ctx.lineTo(floorX + floorLength/2, floorY + carWidth/2);
        ctx.lineTo(floorX - floorLength/2, floorY + carWidth/2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // "바닥면" 텍스트
        ctx.fillStyle = '#333333';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('바닥면', floorX, floorY + carWidth/2 + 30);

        // 바퀴와 타이어를 분리해서 배치
        const wheelDiameter = carWidth * 0.5; // 2배로 키움 (0.25 -> 0.5)
        const wheelRadius = wheelDiameter / 2;
        const tireCircumference = wheelDiameter * Math.PI * 1.15; // 15% 길게 (풀칠 여유)
        const tireSideWidth = wheelDiameter * 0.24; // 20% 두껍게 (0.2 * 1.2 = 0.24)
        
        // 바퀴 8개를 왼쪽에 배치 (2줄, 각 줄에 4개씩)
        const wheelY = bottomBaseY; // 3페이지 아래쪽 부품들과 동일한 높이
        const wheelSpacing = 200; // 바퀴 간격 (더 넓게)
        const wheelRowSpacing = 110; // 위아래 간격
        const wheelStartX = centerX - 400; // 왼쪽으로 더 이동
        const wheelPositions = [
          { x: wheelStartX - wheelSpacing * 1.5, y: wheelY - wheelRowSpacing, label: '앞바퀴1-1' },
          { x: wheelStartX - wheelSpacing * 0.5, y: wheelY - wheelRowSpacing, label: '앞바퀴1-2' },
          { x: wheelStartX + wheelSpacing * 0.5, y: wheelY - wheelRowSpacing, label: '앞바퀴2-1' },
          { x: wheelStartX + wheelSpacing * 1.5, y: wheelY - wheelRowSpacing, label: '앞바퀴2-2' },
          { x: wheelStartX - wheelSpacing * 1.5, y: wheelY + wheelRowSpacing, label: '뒷바퀴1-1' },
          { x: wheelStartX - wheelSpacing * 0.5, y: wheelY + wheelRowSpacing, label: '뒷바퀴1-2' },
          { x: wheelStartX + wheelSpacing * 0.5, y: wheelY + wheelRowSpacing, label: '뒷바퀴2-1' },
          { x: wheelStartX + wheelSpacing * 1.5, y: wheelY + wheelRowSpacing, label: '뒷바퀴2-2' }
        ];
        
        // 타이어 4개를 오른쪽에 4줄로 세로 배치 (한 줄에 1개씩)
        const tireStartX = centerX + 400; // 오른쪽으로 조금만 이동 (원복 + 100px)
        const tireSpacing = 100; // 타이어 세로 간격
        const tireStartY = bottomBaseY - 150; // 위쪽부터 시작
        const tirePositions = [
          { x: tireStartX, y: tireStartY, label: '앞타이어1' },
          { x: tireStartX, y: tireStartY + tireSpacing, label: '앞타이어2' },
          { x: tireStartX, y: tireStartY + tireSpacing * 2, label: '뒷타이어1' },
          { x: tireStartX, y: tireStartY + tireSpacing * 3, label: '뒷타이어2' }
        ];
        
        // 바퀴 8개 그리기 (위쪽)
        wheelPositions.forEach((pos) => {
          // 바퀴 외곽선
          ctx.fillStyle = '#333333';
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, wheelRadius, 0, 2 * Math.PI);
          ctx.fill();
          ctx.strokeStyle = '#666666';
          ctx.lineWidth = 2;
          ctx.stroke();
          
          // 바퀴 중앙 구멍 (작은 동그라미)
          const holeRadius = wheelRadius * 0.075; // 바퀴 반지름의 7.5% 크기 (절반으로 줄임)
          ctx.fillStyle = '#FFFFFF'; // 흰색으로 구멍 표시
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, holeRadius, 0, 2 * Math.PI);
          ctx.fill();
          ctx.strokeStyle = '#333333';
          ctx.lineWidth = 1;
          ctx.stroke();
          
          // 바퀴 라벨
          ctx.fillStyle = '#333333';
          ctx.font = '16px Arial';
          ctx.textAlign = 'center';
          ctx.fillText(pos.label, pos.x, pos.y + wheelRadius + 20);
        });
        
        // 타이어 4개 그리기 (아래쪽)
        tirePositions.forEach((pos) => {
          // 직사각형 타이어 바닥면 (원둘레를 감싸는 부분)
          ctx.fillStyle = '#333333';
          ctx.strokeStyle = '#666666';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(pos.x - tireCircumference/2, pos.y - tireSideWidth/2);
          ctx.lineTo(pos.x + tireCircumference/2, pos.y - tireSideWidth/2);
          ctx.lineTo(pos.x + tireCircumference/2, pos.y + tireSideWidth/2);
          ctx.lineTo(pos.x - tireCircumference/2, pos.y + tireSideWidth/2);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          
          // 타이어 라벨
          ctx.fillStyle = '#333333';
          ctx.font = '16px Arial';
          ctx.textAlign = 'center';
          ctx.fillText(pos.label, pos.x, pos.y + tireSideWidth/2 + 25);
        });
        
        // 부품 설명 제거됨
      }
    });

    if (floorViewPage) pages.push(floorViewPage);

    // 5페이지: 꾸미기 아이템 도안 (헤드램프, 리어램프, 그릴, 뱃지, 번호판)
    // 꼬마세단이고 선택된 꾸미기 아이템이 있을 때만 생성
    const currentCarType = selectedCarType || drawingAnalysis?.analysis?.carType || "sedan";
    
    // 꾸미기 아이템들을 배열로 정의 (동적 처리)
    const decorationItems = [
      { 
        type: 'headlight', 
        selected: selectedHeadlight, 
        label: '헤드램프',
        folder: 'headlights',
        defaultSize: { width: 0.6, height: 0.6 * (293/288) }, // 실제 이미지 비율: 288x293
        specialSizes: {
          'cute3': { width: 0.5, height: 0.5 * (293/288) },
          'cute6': { width: 0.648, height: 0.648 * (201/293) } // 실제 이미지 비율: 293x201
        },
        specialFiles: {
          'cute6': { left: 'headlight-cute6-eyes-left.png', right: 'headlight-cute6-eyes-right.png' },
          'cute-eyes-image': 'headlight-cute1.png',
          'cute-eyes': 'headlight-cute1.png'
        }
      },
      { 
        type: 'taillight', 
        selected: selectedTaillight, 
        label: '리어램프',
        folder: 'rearlights',
        defaultSize: { width: 0.5, height: 0.5 * (288/293) } // 실제 이미지 비율: 293x288
      },
      { 
        type: 'grille', 
        selected: selectedGrille, 
        label: '그릴',
        folder: 'grills',
        defaultSize: { 
          width: 0.8 * 1.4 * 1.1 * 1.1, // 3D 렌더러와 동일한 가로 크기 (1.232)
          height: (0.8 * 1.4 * 1.1 * 1.1) / (696 / 229) // 실제 이미지 비율: 696x229
        }
      },
      { 
        type: 'badge', 
        selected: selectedBadge, 
        label: '뱃지',
        folder: 'badges',
        defaultSize: { width: 0.936, height: 0.936 } // 3D 렌더러와 동일한 크기
      },
      { 
        type: 'plate', 
        selected: selectedPlate, 
        label: '번호판',
        folder: 'plates',
        defaultSize: { width: 1.0, height: 1.0 * (174/517) } // 실제 이미지 비율: 517x174
      },
      { 
        type: 'wheel', 
        selected: selectedWheel, 
        label: '타이어휠',
        folder: 'wheels',
        defaultSize: { width: 0.8, height: 0.8 } // 3D 렌더러 크기 (도안 바퀴 사이즈에 맞춰 조정됨)
      }
    ];

    // 선택된 아이템들만 필터링
    const selectedItems = decorationItems.filter(item => item.selected);
    
    // 선택된 꾸미기 아이템이 있을 때만 5페이지 생성 (모든 차종에 적용)
    if (selectedItems.length > 0) {
      const decorationPage = await createPage('', async (ctx) => {
        // 공통 헤더/푸터 적용
        await drawCommonHeaderFooter(ctx, a4Width, a4Height);

        const centerX = a4Width / 2;
        const centerY = a4Height / 2 - 150; // 150px 위로 이동 (50 + 100)
        const scale = 133; // 2D 도안 스케일
        
        // 아이템들을 3열로 배치 (타이어휠은 마지막 행에 4개)
        const itemsPerRow = 3;
        const itemSpacing = 270; // 아이템 간 간격
        const rowSpacing = 190; // 행 간 간격
        
        // 타이어휠을 제외한 다른 아이템들만 먼저 처리
        const nonWheelItems = selectedItems.filter(item => item.type !== 'wheel');
        const wheelItems = selectedItems.filter(item => item.type === 'wheel');
        
        // 일반 아이템들 배치 (동적 가운데 정렬)
        for (let index = 0; index < nonWheelItems.length; index++) {
          const item = nonWheelItems[index];
          const row = Math.floor(index / itemsPerRow);
          const col = index % itemsPerRow;
          
          // 현재 행의 아이템 개수 계산
          const itemsInCurrentRow = Math.min(itemsPerRow, nonWheelItems.length - row * itemsPerRow);
          
          // 현재 행의 아이템들을 가운데 정렬
          const totalRowWidth = itemSpacing * (itemsInCurrentRow - 1);
          const startX = centerX - totalRowWidth / 2;
          
          const itemX = startX + col * itemSpacing;
          const itemY = centerY - rowSpacing/2 + row * rowSpacing;
          
          // 아이템 크기 계산
          const itemSize3D = (item.specialSizes as any)?.[item.selected!] || item.defaultSize;
          const itemSize2D = {
            width: itemSize3D.width * scale,
            height: itemSize3D.height * scale
          };
          
          // 일반 아이템 그리기 (타이어휠 제외)
          if (item.type === 'headlight' || item.type === 'taillight') {
            // 램프 간격 (좌우 2개 배치) - 적당한 간격
            const lampSpacing = itemSize2D.width + 100;
            
            // 왼쪽 램프 위치
            const leftLampX = itemX - lampSpacing / 2;
            const lampY = itemY - itemSize2D.height / 2;
            
            // 오른쪽 램프 위치
            const rightLampX = itemX + lampSpacing / 2 - itemSize2D.width;
            
            // 램프 이미지 경로 생성 (헤드램프/리어램프)
            let leftImagePath, rightImagePath;
            
            if (item.type === 'headlight' && (item.specialFiles as any)?.[item.selected!]) {
              // 헤드램프 특별 파일 처리
              if (typeof (item.specialFiles as any)[item.selected!] === 'string') {
                leftImagePath = rightImagePath = `/${item.folder}/${(item.specialFiles as any)[item.selected!]}`;
              } else {
                // cute6 같은 경우 좌우 다른 이미지
                const specialFile = (item.specialFiles as any)[item.selected!];
                leftImagePath = `/${item.folder}/${specialFile.left}`;
                rightImagePath = `/${item.folder}/${specialFile.right}`;
              }
            } else {
              // 일반적인 경우 (리어램프 포함)
              if (item.type === 'taillight') {
                leftImagePath = rightImagePath = `/rearlights/${item.selected}.png`;
              } else {
                leftImagePath = rightImagePath = `/${item.folder}/${item.type}-${item.selected}.png`;
              }
            }
            
            // 5페이지 램프 그리기
            
            // 램프 이미지 로드 및 그리기 (좌우 2개)
            const loadLampImages = () => {
              return new Promise<void>((resolve) => {
                let loadedCount = 0;
                const totalImages = 2;
                
                const onImageLoad = () => {
                  loadedCount++;
                  if (loadedCount === totalImages) {
                    resolve();
                  }
                };
                
                const onImageError = (imagePath: string) => {
                  onImageLoad();
                };
                
                // 왼쪽 램프 이미지
                const leftImg = new Image();
                leftImg.onload = () => {
                  ctx.drawImage(leftImg, leftLampX, lampY, itemSize2D.width, itemSize2D.height);
                  onImageLoad();
                };
                leftImg.onerror = () => onImageError(leftImagePath);
                leftImg.src = leftImagePath;
                
                // 오른쪽 램프 이미지
                const rightImg = new Image();
                rightImg.onload = () => {
                  ctx.drawImage(rightImg, rightLampX, lampY, itemSize2D.width, itemSize2D.height);
                  onImageLoad();
                };
                rightImg.onerror = () => onImageError(rightImagePath);
                rightImg.src = rightImagePath;
              });
            };
            
            await loadLampImages();
            
          } else {
            // 다른 아이템들은 1개만 그리기
            // 이미지 경로 생성 (동적) - 실제 파일 구조에 맞게 수정
            let imagePath;
            
            // 실제 파일 구조에 맞게 경로 수정 (item.selected가 이미 완전한 파일명)
            if (item.type === 'taillight') {
              imagePath = `/rearlights/${item.selected}.png`;
            } else if (item.type === 'grille') {
              imagePath = `/grills/${item.selected}.png`;
            } else if (item.type === 'badge') {
              imagePath = `/badges/${item.selected}.png`;
            } else if (item.type === 'plate') {
              imagePath = `/plates/${item.selected}.png`;
            } else if (item.type === 'wheel') {
              imagePath = `/wheels/${item.selected}.png`;
            } else {
              imagePath = `/${item.folder}/${item.type}-${item.selected}.png`;
            }
            
            // 5페이지 아이템 그리기
            
            // 아이템 이미지 로드 및 그리기
            const loadItemImage = () => {
              return new Promise<void>((resolve) => {
                if (item.type === 'badge') {
                  // 뱃지는 헤드램프와 동일한 방식으로 2개 1쌍 표시
                  const badgeSpacing = itemSize2D.width + 150; // 뱃지 간격을 더 넓게 조정
                  
                  // 왼쪽 뱃지 위치
                  const leftBadgeX = itemX - badgeSpacing / 2;
                  const badgeY = itemY - itemSize2D.height / 2;
                  
                  // 오른쪽 뱃지 위치
                  const rightBadgeX = itemX + badgeSpacing / 2 - itemSize2D.width;
                  
                  const loadBadgeImages = () => {
                    return new Promise<void>((resolve) => {
                      let loadedCount = 0;
                      const totalImages = 2;
                      
                      const onImageLoad = () => {
                        loadedCount++;
                        if (loadedCount === totalImages) {
                          resolve();
                        }
                      };
                      
                      const onImageError = (imagePath: string) => {
                        onImageLoad(); // 실패해도 카운트 증가
                      };
                      
                      // 왼쪽 뱃지 이미지
                      const leftBadgeImg = new Image();
                      leftBadgeImg.onload = () => {
                        ctx.drawImage(leftBadgeImg, leftBadgeX, badgeY, itemSize2D.width, itemSize2D.height);
                        onImageLoad();
                      };
                      leftBadgeImg.onerror = () => onImageError(imagePath);
                      leftBadgeImg.src = imagePath;
                      
                      // 오른쪽 뱃지 이미지
                      const rightBadgeImg = new Image();
                      rightBadgeImg.onload = () => {
                        ctx.drawImage(rightBadgeImg, rightBadgeX, badgeY, itemSize2D.width, itemSize2D.height);
                        onImageLoad();
                      };
                      rightBadgeImg.onerror = () => onImageError(imagePath);
                      rightBadgeImg.src = imagePath;
                    });
                  };
                  
                  loadBadgeImages().then(() => {
                    resolve();
                  }).catch((error) => {
                    resolve();
                  });
                } else {
                  // 다른 아이템들은 기존 방식대로 처리
                  const img = new Image();
                  img.onload = () => {
                    ctx.drawImage(img, itemX - itemSize2D.width/2, itemY - itemSize2D.height/2, itemSize2D.width, itemSize2D.height);
                    resolve();
                  };
                  img.onerror = () => {
                    // 이미지 로드 실패 시 텍스트로 대체
                    ctx.fillStyle = '#333333';
                    ctx.font = '16px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillText(item.label, itemX, itemY);
                    resolve();
                  };
                  img.src = imagePath;
                }
              });
            };
            
            await loadItemImage();
          }
          
          // 아이템 라벨
          ctx.fillStyle = '#333333';
          ctx.font = '18px Arial';
          ctx.textAlign = 'center';
          // 아이템 라벨
          const labelY = itemY + itemSize2D.height/2 + 30;
          
          if (item.type === 'badge') {
            // 뱃지 라벨은 헤드램프와 동일하게 중앙에 위치
            ctx.fillText(item.label, itemX, labelY);
          } else {
            // 다른 아이템들은 기존 방식대로
            ctx.fillText(item.label, itemX, labelY);
          }
        }
        
        // 타이어휠 처리 (마지막 행에 4개 배치)
        if (wheelItems.length > 0) {
          const wheelItem = wheelItems[0]; // 첫 번째 타이어휠 아이템 사용
          const wheelRow = Math.ceil(nonWheelItems.length / itemsPerRow); // 마지막 행
          const wheelY = centerY - rowSpacing/2 + wheelRow * rowSpacing;
          
          // 타이어휠 크기 계산
          const carWidth = 2.0;
          const blueprintWheelDiameter = carWidth * 0.5;
          const blueprintWheelSize = blueprintWheelDiameter * scale;
          const wheelSize2D = {
            width: blueprintWheelSize,
            height: blueprintWheelSize
          };
          
          // 타이어휠 4개 배치 (4열 1행)
          const wheelSpacing = wheelSize2D.width + 0; // 휠 간격
          
          // 타이어휠 4개 위치 (한 줄로 배치, 가운데 정렬)
          const totalWheelWidth = wheelSize2D.width * 4 + wheelSpacing * 3; // 4개 휠 + 3개 간격
          const startX = centerX - totalWheelWidth / 2; // 전체 너비의 절반만큼 왼쪽으로 이동
          
          const wheel1X = startX;
          const wheel2X = startX + wheelSize2D.width + wheelSpacing;
          const wheel3X = startX + (wheelSize2D.width + wheelSpacing) * 2;
          const wheel4X = startX + (wheelSize2D.width + wheelSpacing) * 3;
          const wheelYPos = wheelY;
          
          // 타이어휠 이미지 경로
          const wheelImagePath = `/wheels/${wheelItem.selected}.png`;
          
          // 5페이지 타이어 휠 4개 그리기 (4열 1행)
          
          // 타이어 휠 4개 이미지 로드 및 그리기
          const loadWheelImages = () => {
            return new Promise<void>((resolve) => {
              let loadedCount = 0;
              const totalImages = 4;
              
              const onImageLoad = () => {
                loadedCount++;
                if (loadedCount === totalImages) {
                  resolve();
                }
              };
              
              const onImageError = (imagePath: string) => {
                onImageLoad();
              };
              
              // 타이어휠 1
              const wheel1Img = new Image();
              wheel1Img.onload = () => {
                ctx.drawImage(wheel1Img, wheel1X, wheelYPos, wheelSize2D.width, wheelSize2D.height);
                onImageLoad();
              };
              wheel1Img.onerror = () => onImageError(wheelImagePath);
              wheel1Img.src = wheelImagePath;
              
              // 타이어휠 2
              const wheel2Img = new Image();
              wheel2Img.onload = () => {
                ctx.drawImage(wheel2Img, wheel2X, wheelYPos, wheelSize2D.width, wheelSize2D.height);
                onImageLoad();
              };
              wheel2Img.onerror = () => onImageError(wheelImagePath);
              wheel2Img.src = wheelImagePath;
              
              // 타이어휠 3
              const wheel3Img = new Image();
              wheel3Img.onload = () => {
                ctx.drawImage(wheel3Img, wheel3X, wheelYPos, wheelSize2D.width, wheelSize2D.height);
                onImageLoad();
              };
              wheel3Img.onerror = () => onImageError(wheelImagePath);
              wheel3Img.src = wheelImagePath;
              
              // 타이어휠 4
              const wheel4Img = new Image();
              wheel4Img.onload = () => {
                ctx.drawImage(wheel4Img, wheel4X, wheelYPos, wheelSize2D.width, wheelSize2D.height);
                onImageLoad();
              };
              wheel4Img.onerror = () => onImageError(wheelImagePath);
              wheel4Img.src = wheelImagePath;
            });
          };
          
          await loadWheelImages();
          
          // 타이어휠 라벨
          ctx.fillStyle = '#333333';
          ctx.font = '18px Arial';
          ctx.textAlign = 'center';
          const wheelLabelY = wheelYPos + wheelSize2D.height + 50;
          ctx.fillText(wheelItem.label, centerX, wheelLabelY);
        }
      });

      if (decorationPage) pages.push(decorationPage);
    }

    // 모든 페이지를 상태에 저장
    if (pages.length > 0) {
      setBlueprintImages(pages);
      setBlueprintGenerated(true);
      setCurrentPage(0); // 첫 번째 페이지로 초기화
    }
  }, [selectedCarType, drawingAnalysis, carColor, selectedHeadlight, selectedTaillight, selectedGrille, selectedBadge, selectedPlate, selectedWheel, captureThumbnailSnapshot, createBlueprintFromSnapshot]);

  // export 단계로 이동할 때 도안이 없으면 자동 생성
  useEffect(() => {
    if (currentStep === 'export' && !blueprintGenerated && !blueprintGenerating) {
      setBlueprintGenerating(true);
      generateBlueprint()
        .then(() => {
          setBlueprintGenerating(false);
        })
        .catch((error) => {
          console.error('도안 생성 실패:', error);
          setBlueprintGenerating(false);
        });
    }
  }, [currentStep, blueprintGenerated, blueprintGenerating]);

  // carColor가 변경되면 도안을 다시 생성하도록 플래그 리셋 및 자동 재생성
  useEffect(() => {
    if (blueprintGenerated || blueprintGenerating) {
      setBlueprintGenerated(false);
      setBlueprintGenerating(false);
      
      // export 단계에 있다면 자동으로 도안 재생성
      if (currentStep === 'export') {
        setTimeout(() => {
          setBlueprintGenerating(true);
          generateBlueprint()
            .then(() => {
              setBlueprintGenerating(false);
            })
            .catch((error) => {
              console.error('도안 재생성 실패:', error);
              setBlueprintGenerating(false);
            });
        }, 100);
      }
    }
  }, [carColor, currentStep]);

  // 도안 다운로드 기록 저장 함수
  const saveBlueprintDownloadRecord = async (downloadType: 'single' | 'all' | 'pdf', fileName: string) => {
    if (!user) return;

    try {
      const downloadRecord = {
        userId: user.uid,
        userEmail: user.email || '',
        userDisplayName: user.authorNickname || user.displayName || (user.email ? user.email.split('@')[0] : 'Anonymous'),
        downloadType: downloadType,
        fileName: fileName,
        carType: selectedCarType || drawingAnalysis?.analysis?.carType || 'sedan',
        carColor: carColor,
        downloadCount: 1,
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db as any, 'blueprintDownloads'), downloadRecord);
    } catch (error) {
      console.error('❌ 도안 다운로드 기록 저장 실패:', error);
    }
  };

  // 도안 다운로드 함수 (현재 페이지)
  const downloadBlueprint = async () => {
    if (blueprintImages.length === 0 || currentPage >= blueprintImages.length) return;
    
    const fileName = `boxro-blueprint-page${currentPage + 1}.png`;
    const link = document.createElement('a');
    link.download = fileName;
    link.href = blueprintImages[currentPage];
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // 다운로드 기록 저장
    await saveBlueprintDownloadRecord('single', fileName);
  };

  // 모든 페이지를 세로로 배치하되 페이지 구분선이 있는 이미지로 다운로드
  const downloadAllPages = async () => {
    if (blueprintImages.length === 0) return;
    
    try {
      // A4 가로 방향 크기 (297mm x 210mm, 150DPI) - 실제 도안 크기와 동일
      const a4Width = 1754;  // 가로 (297mm)
      const a4Height = 1240; // 세로 (210mm)
      const pageCount = blueprintImages.length;
      
      // 페이지 간 간격 (구분선 포함)
      const pageGap = 20; // 20px 간격
      
      // 세로로 배치할 캔버스 크기 계산
      const combinedWidth = a4Width;
      const combinedHeight = (a4Height * pageCount) + (pageGap * (pageCount - 1));
      
      // 합쳐진 이미지를 그릴 캔버스 생성
      const canvas = document.createElement('canvas');
      canvas.width = combinedWidth;
      canvas.height = combinedHeight;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) return;
      
      // 배경을 흰색으로 설정
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, combinedWidth, combinedHeight);
      
      // 각 페이지 이미지를 세로로 배치하고 구분선 추가
      for (let i = 0; i < pageCount; i++) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        await new Promise((resolve, reject) => {
          img.onload = () => {
            const y = i * (a4Height + pageGap);
            ctx.drawImage(img, 0, y, a4Width, a4Height);
            
            // 페이지 구분선 그리기 (마지막 페이지가 아닌 경우)
            if (i < pageCount - 1) {
              ctx.strokeStyle = '#CCCCCC';
              ctx.lineWidth = 2;
              ctx.setLineDash([5, 5]); // 점선
              ctx.beginPath();
              ctx.moveTo(0, y + a4Height + pageGap / 2);
              ctx.lineTo(a4Width, y + a4Height + pageGap / 2);
              ctx.stroke();
              ctx.setLineDash([]); // 점선 해제
            }
            
            resolve(true);
          };
          img.onerror = reject;
          img.src = blueprintImages[i];
        });
      }
      
      // 합쳐진 이미지 다운로드
      const fileName = `boxro-blueprint-all-pages.png`;
      canvas.toBlob(async (blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.download = fileName;
          link.href = url;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);

          // 다운로드 기록 저장
          await saveBlueprintDownloadRecord('all', fileName);
        }
      }, 'image/png');
      
    } catch (error) {
      console.error('합쳐진 이미지 생성 실패:', error);
      setErrorMessage('이미지 합치기 중 오류가 발생했습니다.');
      setShowErrorModal(true);
    }
  };

  // 박스카 갤러리에 디자인 공유
  const shareToGallery = async () => {
    if (!user) {
      alert('로그인이 필요합니다.');
      return;
    }

    if (!shareTitle.trim()) {
      // 제목이 비어있을 때는 모달을 닫지 않고 사용자에게 알림
      return;
    }

    try {
      // 사용자의 최신 닉네임 가져오기
      let userNickname = user.displayName || (user.email ? user.email.split('@')[0] : 'Anonymous');
      try {
        const userRef = doc(db as any, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const userData = userSnap.data();
          userNickname = userData.authorNickname || userData.displayName || user.displayName || (user.email ? user.email.split('@')[0] : 'Anonymous');
        }
      } catch (error) {
        console.warn('사용자 닉네임 조회 실패, 기본값 사용:', error);
      }

      // 이미지 압축
      const compressedImages = await Promise.all(
        blueprintImages.map(img => compressImage(img, 0.6))
      );
      
      // 3D 스냅샷을 썸네일로 사용 (650x650 크롭된 이미지 사용)
      const snapshot = await captureThumbnailSnapshot();
      const thumbnail = snapshot ? await createBlueprintFromSnapshot(snapshot) : await compressImage(blueprintImages[0], 0.5);
      
      // 태그를 배열로 변환
      const tagsArray = shareTags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
      
      // Firebase에 디자인 데이터 저장
      const designData = {
        name: shareTitle,
        type: selectedCarType || drawingAnalysis?.analysis?.carType || 'sedan',
        author: user.displayName || (user.email ? user.email.split('@')[0] : 'Anonymous'),
        authorNickname: userNickname, // Firestore에서 가져온 최신 닉네임 사용
        authorEmail: user.email || '',
        authorId: user.uid, // 작성자 ID 추가
        thumbnail: thumbnail,
        tags: tagsArray,
        blueprintImages: compressedImages,
        likes: 0,
        downloads: 0,
        views: 0,
        boxroTalks: 0,
        likedBy: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      // 박스카 갤러리에 공유 (communityDesigns 컬렉션)
      const galleryDocRef = await addDoc(collection(db as any, 'communityDesigns'), designData);
      
      // 사용자의 개인 디자인 컬렉션에도 저장
      const userDesignData = {
        ...designData,
        authorId: user.uid,
        galleryId: galleryDocRef.id, // 박스카 갤러리 문서 ID 참조
        isPublic: true
      };
      
      await addDoc(collection(db as any, 'userDesigns'), userDesignData);
      
      setShowGalleryShareModal(false);
      setShowGallerySuccessModal(true);
      setShareTitle('');
      setShareTags('');
    } catch (error) {
      console.error('공유 실패:', error);
      if (error instanceof Error && error.message.includes('size')) {
        setErrorMessage('이미지가 너무 큽니다. 다시 시도해주세요.');
      } else {
        setErrorMessage('공유 중 오류가 발생했습니다.');
      }
      setShowErrorModal(true);
    }
  };



  // 이미지 압축 함수
  const compressImage = (imageDataUrl: string, quality: number = 0.7): Promise<string> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // 이미지 크기를 줄임 (최대 800px 너비)
        const maxWidth = 800;
        const maxHeight = 600;
        let { width, height } = img;
        
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        ctx?.drawImage(img, 0, 0, width, height);
        
        // 투명도가 있는 이미지인지 확인
        const imageData = ctx?.getImageData(0, 0, width, height);
        const hasTransparency = imageData?.data.some((_, index) => index % 4 === 3 && imageData.data[index] < 255);
        
        // 투명도가 있으면 PNG, 없으면 JPG 사용
        const compressedDataUrl = hasTransparency 
          ? canvas.toDataURL('image/png', 1.0)
          : canvas.toDataURL('image/jpeg', quality);
        resolve(compressedDataUrl);
      };
      
      img.src = imageDataUrl;
    });
  };

  // 나만의 박스카 버튼 클릭 핸들러 (컨펌 후 바로 저장)
  const handleSaveToMyDesigns = async () => {
    if (!user) {
      alert('로그인이 필요합니다.');
      return;
    }

    if (blueprintImages.length === 0) {
      alert('먼저 도안을 생성해주세요.');
      return;
    }

    // 동적 제목 생성 함수
    const generateFunTitle = (carType: string) => {
      const adjectives = {
        'sedan-type1': ['부릉부릉 너무 귀여운', '씽씽 달리는', '방긋 웃는', '깜찍발랄한', '콩콩 튀는'],
        'sedan-type2': ['든든하게 달리는', '똑똑하고 멋진', '반짝반짝 빛나는', '여유로운', '묵직하게 힘찬'],
        'sports': ['번쩍번쩍 멋있는', '쌩쌩 신나는', '슝슝 달려가는', '짜릿하게 질주하는', '번개처럼 빠른'],
        'suv': ['우당탕탕 용감한', '씩씩하게 달리는', '어디든 갈 수 있는', '힘센', '모험심 가득한'],
        'truck': ['든든하게 짐을 싣는', '빵빵 힘찬', '우직한', '무거운 것도 척척', '으랏차차 힘센'],
        'bus': ['즐겁게 달리는', '방긋 인사하는', '신나게 출발하는', '콩닥콩닥 두근거리는', '꽉 찬 웃음의'],
        'bus-square': ['네모네모 귀여운', '사각사각 멋진', '반듯반듯 착한', '네모난 세상', '네모로 즐거운']
      };
      
      const carTypeNames = {
        'sedan-type1': '꼬마세단',
        'sedan-type2': '큰세단', 
        'sports': '스포츠카',
        'suv': 'SUV',
        'truck': '빵빵트럭',
        'bus': '통통버스',
        'bus-square': '네모버스'
      };
      
      const typeAdjectives = adjectives[carType as keyof typeof adjectives] || adjectives['sedan-type1'];
      const typeName = carTypeNames[carType as keyof typeof carTypeNames] || '꼬마세단';
      
      const randomAdjective = typeAdjectives[Math.floor(Math.random() * typeAdjectives.length)];
      return `${randomAdjective} ${typeName}`;
    };

    // 분석된 차종을 제목 생성용 차종으로 매핑
    const mapAnalyzedCarType = (analyzedType: string) => {
      const mapping: { [key: string]: string } = {
        'sedan': 'sedan-type1',
        'suv': 'suv',
        'truck': 'truck',
        'bus': 'bus',
        'sports': 'sports'
      };
      return mapping[analyzedType] || 'sedan-type1';
    };

    // 동적 제목 생성
    const currentCarType = selectedCarType || drawingAnalysis?.analysis?.classification?.carType || 'sedan';
    const mappedCarType = mapAnalyzedCarType(currentCarType);
    const autoTitle = generateFunTitle(mappedCarType);

    // 확인 모달 표시
    setPendingSaveTitle(autoTitle);
    setSaveTitle(autoTitle); // 모달이 열릴 때 자동으로 제목 설정
    setShowConfirmModal(true);
  };

  // 확인 모달에서 확인 버튼 클릭
  const handleConfirmSave = async () => {
    setShowConfirmModal(false);
    await saveToMyDesignsWithTitle(saveTitle, saveDescription);
  };

  // 확인 모달에서 취소 버튼 클릭
  const handleCancelSave = () => {
    setShowConfirmModal(false);
    setPendingSaveTitle('');
    setSaveTitle('');
    setSaveDescription('');
  };

  // 개인 디자인 저장 (제목과 설명을 받아서)
  const saveToMyDesignsWithTitle = async (finalTitle: string, finalDescription: string = '') => {
    if (!user) {
      alert('로그인이 필요합니다.');
      return;
    }

    if (blueprintImages.length === 0) {
      alert('먼저 도안을 생성해주세요.');
      return;
    }

    try {
      // 이미지 압축
      const compressedImages = await Promise.all(
        blueprintImages.map(img => compressImage(img, 0.6))
      );
      
      // 3D 스냅샷을 썸네일로 사용 (650x650 크롭된 이미지 사용)
      const snapshot = await captureThumbnailSnapshot();
      const thumbnail = snapshot ? await createBlueprintFromSnapshot(snapshot) : await compressImage(blueprintImages[0], 0.5);
      
      // 태그는 빈 배열로 설정
      const tagsArray: string[] = [];
      
      // 사용자의 개인 디자인 데이터
      const userDesignData = {
        name: finalTitle,
        type: selectedCarType || drawingAnalysis?.analysis?.carType || 'sedan',
        author: user.displayName || (user.email ? user.email.split('@')[0] : 'Anonymous'),
        authorEmail: user.email || '',
        authorId: user.uid, // 이 값이 중요합니다
        thumbnail: thumbnail,
        description: finalDescription,
        tags: tagsArray,
        blueprintImages: compressedImages,
        likes: 0,
        downloads: 0,
        views: 0,
        boxroTalks: 0,
        isPublic: false, // 개인 저장이므로 공개하지 않음
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db as any, 'userDesigns'), userDesignData);
      
      setShowSuccessModal(true);
      setSaveTitle('');
      setSaveDescription('');
    } catch (error) {
      console.error('저장 실패:', error);
      if (error instanceof Error && error.message.includes('size')) {
        setErrorMessage('이미지가 너무 큽니다. 다시 시도해주세요.');
        setShowErrorModal(true);
      } else {
        setErrorMessage('저장 중 오류가 발생했습니다.');
        setShowErrorModal(true);
      }
    }
  };

  // PDF 형태로 모든 페이지 다운로드
  const downloadAllPagesAsPDF = async () => {
    if (blueprintImages.length === 0) return;
    
    try {
      // A4 가로 방향으로 PDF 생성 (mm 단위) - 도안이 가로 방향이므로
      const pdf = new jsPDF({
        orientation: 'landscape', // 가로 방향
        unit: 'mm',
        format: 'a4'
      });
      
      // 각 페이지를 PDF에 추가
      for (let i = 0; i < blueprintImages.length; i++) {
        if (i > 0) {
          pdf.addPage(); // 첫 번째 페이지 이후에 새 페이지 추가
        }
        
        // 이미지를 A4 가로 크기로 PDF 페이지에 추가
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        await new Promise((resolve, reject) => {
          img.onload = () => {
            // A4 가로 크기 (297mm x 210mm)로 이미지 추가
            pdf.addImage(img, 'PNG', 0, 0, 297, 210);
            resolve(true);
          };
          img.onerror = reject;
          img.src = blueprintImages[i];
        });
      }
      
      // PDF 다운로드 - 생성일자 포함 파일명
      const now = new Date();
      const dateStr = now.getFullYear() + 
                     String(now.getMonth() + 1).padStart(2, '0') + 
                     String(now.getDate()).padStart(2, '0') + 
                     String(now.getHours()).padStart(2, '0') + 
                     String(now.getMinutes()).padStart(2, '0');
      const fileName = `boxro_pattern_release_${dateStr}.pdf`;
      pdf.save(fileName);

      // 다운로드 기록 저장
      await saveBlueprintDownloadRecord('pdf', fileName);
      
    } catch (error) {
      console.error('PDF 생성 실패:', error);
      setErrorMessage('PDF 생성 중 오류가 발생했습니다. jsPDF 라이브러리가 필요합니다.');
      setShowErrorModal(true);
    }
  };

  // 페이지 변경 함수
  const goToPage = (pageIndex: number) => {
    if (pageIndex >= 0 && pageIndex < blueprintImages.length) {
      setCurrentPage(pageIndex);
    }
  };

  // 이전 페이지
  const goToPreviousPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  // 다음 페이지
  const goToNextPage = () => {
    if (currentPage < blueprintImages.length - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  // 캔버스 초기화 (고속 최적화)
  const initializeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // 점선 div 컨테이너의 크기를 가져옴
    const parentElement = canvas.parentElement;
    if (!parentElement) return;

    // 점선 div의 실제 크기 측정
    const rect = parentElement.getBoundingClientRect();
    const containerWidth = rect.width;
    const containerHeight = rect.height;
    
    
    // 점선 div의 크기에 맞춰 캔버스 크기 설정
    const canvasWidth = Math.floor(containerWidth);
    const canvasHeight = Math.floor(containerHeight);
    
    // 캔버스 크기 설정 (점선 div 크기에 맞춤)
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    
    // CSS 크기도 명시적으로 설정하여 일치시킴
    canvas.style.width = `${canvasWidth}px`;
    canvas.style.height = `${canvasHeight}px`;
    
    // 캔버스는 점선 div 안에서 100% 크기로 설정됨
    
    
    
    const context = canvas.getContext('2d');
    if (!context) return;

    // contextRef 설정
    contextRef.current = context;
    
    // 기본 설정 (최소한의 설정만)
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvasWidth, canvasHeight);
    
    // 그리드 그리기
    context.strokeStyle = '#f3f4f6'; // 더 연한 회색
    context.lineWidth = 1;
    
    // 세로선 그리기 (20px 간격)
    for (let x = 0; x <= canvasWidth; x += 20) {
      context.beginPath();
      context.moveTo(x, 0);
      context.lineTo(x, canvasHeight);
      context.stroke();
    }
    
    // 가로선 그리기 (20px 간격)
    for (let y = 0; y <= canvasHeight; y += 20) {
      context.beginPath();
      context.moveTo(0, y);
      context.lineTo(canvasWidth, y);
      context.stroke();
    }
    
    // 현재 도구 설정
    if (currentTool === 'eraser') {
      context.strokeStyle = '#ffffff';
      context.lineWidth = lineWidth * 2;
    } else {
      context.strokeStyle = color;
      context.lineWidth = lineWidth;
    }
    
  }, [isMobile]);

    // 컴포넌트 마운트 시 캔버스 초기화 (한 번만)
  useEffect(() => {
      // DOM과 CSS가 완전히 준비된 후 캔버스 초기화
      const timer = setTimeout(() => {
    initializeCanvas();
      }, 100); // 200ms -> 100ms로 감소
      
      // 페이지 포커스 이벤트 비활성화 (캔버스 크기 안정화를 위해)
    
    // 윈도우 리사이즈 이벤트 활성화 (반응형을 위해)
    let resizeTimeout: NodeJS.Timeout;
    let lastResizeTime = 0;
    const handleResize = () => {
      const now = Date.now();
      // 300ms 이내의 연속 리사이즈는 무시 (성능 최적화)
      if (now - lastResizeTime < 300) {
        return;
      }
      lastResizeTime = now;
      
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        requestAnimationFrame(initializeCanvas);
      }, 200); // 300ms -> 200ms 디바운싱
    };

    // 모바일 방향 전환 이벤트 비활성화 (캔버스 크기 안정화를 위해)
    
    // 모든 이벤트 리스너 비활성화 (캔버스 크기 안정화를 위해)
    window.addEventListener('resize', handleResize);
    // window.addEventListener('orientationchange', handleOrientationChange);
    
    // ResizeObserver 비활성화 (캔버스 크기 안정화를 위해)
    
    return () => {
      // 이벤트 리스너 정리
      window.removeEventListener('resize', handleResize);
      // 타이머 정리
      clearTimeout(timer);
      clearTimeout(resizeTimeout);
    };
  }, []);

  // 도구나 색상 변경 시 컨텍스트 업데이트
  useEffect(() => {
    if (contextRef.current) {
      if (currentTool === 'eraser') {
        contextRef.current.strokeStyle = '#ffffff';
        contextRef.current.lineWidth = lineWidth * 2;
      } else {
        contextRef.current.strokeStyle = color;
        contextRef.current.lineWidth = lineWidth;
      }
    }
  }, [color, lineWidth, currentTool]);

  // 프리뷰에서 돌아올 때 드로잉 상태 복원 (캔버스 재초기화 필요)
  useEffect(() => {
    if (currentStep === 'draw' && hasBeenToPreview) {
      // 프리뷰에서 돌아온 경우, 캔버스 재초기화 후 드로잉 복원
      setTimeout(() => {
        initializeCanvas(); // 캔버스 재초기화 필요
        if (savedDrawingData) {
          restoreDrawing();
        }
      }, 100); // 캔버스 초기화 후 복원
    }
  }, [currentStep, hasBeenToPreview, savedDrawingData, isMobile]);

  // 좌표 변환 (정확한 캔버스 좌표 계산)
  const getCanvasCoordinates = (canvasX: number, canvasY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    
    // CSS 크기와 실제 캔버스 크기의 비율 계산
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    // 캔버스 기준 좌표를 실제 캔버스 좌표로 변환
    const x = canvasX * scaleX;
    const y = canvasY * scaleY;
    
    // 디버깅을 위한 로그 (개발 시에만)
    if (process.env.NODE_ENV === 'development') {
      console.log('Canvas coords:', { canvasX, canvasY, x, y, scaleX, scaleY, rectWidth: rect.width, rectHeight: rect.height, canvasWidth: canvas.width, canvasHeight: canvas.height });
    }
    
    return { x, y };
  };

  // 드로잉 시작
  const startDrawing = (clientX: number, clientY: number) => {
    if (!contextRef.current) {
      initializeCanvas(); // Context가 없으면 캔버스 재초기화
      return;
    }
    
    setIsDrawing(true);
    const coords = getCanvasCoordinates(clientX, clientY);
    
    // 컨텍스트 설정 재확인
    if (currentTool === 'eraser') {
      contextRef.current.strokeStyle = '#ffffff';
      contextRef.current.lineWidth = lineWidth * 2;
    } else {
      contextRef.current.strokeStyle = color;
      contextRef.current.lineWidth = lineWidth;
    }
    
    contextRef.current.beginPath();
    contextRef.current.moveTo(coords.x, coords.y);
  };

  // 드로잉
  const draw = (clientX: number, clientY: number) => {
    if (!isDrawing || !contextRef.current) return;
    
    const coords = getCanvasCoordinates(clientX, clientY);
    contextRef.current.lineTo(coords.x, coords.y);
    contextRef.current.stroke();
    
    // 드로잉이 발생했음을 표시
    setHasDrawing(true);
  };

  // 드로잉 종료
  const stopDrawing = () => {
    setIsDrawing(false);
  };

  // 드로잉 데이터 복원
  const restoreDrawing = () => {
    const canvas = canvasRef.current;
    if (!canvas || !savedDrawingData) return;
    
    const img = new Image();
    img.onload = () => {
      if (!contextRef.current) return;
      
      // 캔버스 초기화
      contextRef.current.fillStyle = '#ffffff';
      contextRef.current.fillRect(0, 0, canvas.width, canvas.height);
      
      // 저장된 드로잉 복원
      contextRef.current.drawImage(img, 0, 0, canvas.width, canvas.height);
    };
    img.src = savedDrawingData;
  };

  // 캔버스 클리어
  const clearCanvas = () => {
    if (!contextRef.current) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // 점선 div 컨테이너의 크기를 가져옴
    const parentElement = canvas.parentElement;
    if (!parentElement) return;

    // 점선 div의 실제 크기 측정
    const rect = parentElement.getBoundingClientRect();
    const containerWidth = rect.width;
    const containerHeight = rect.height;
    
    // 점선 div의 크기에 맞춰 캔버스 크기 설정
    const canvasWidth = Math.floor(containerWidth);
    const canvasHeight = Math.floor(containerHeight);
    
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    
    // 캔버스 클리어
    contextRef.current.clearRect(0, 0, canvasWidth, canvasHeight);
    
    
    // 흰색으로 채우기
    contextRef.current.fillStyle = '#ffffff';
    contextRef.current.fillRect(0, 0, canvas.width, canvas.height);
    
    // 그리드 그리기
    contextRef.current.strokeStyle = '#f3f4f6'; // 더 연한 회색
    contextRef.current.lineWidth = 1;
    
    // 세로선 그리기 (20px 간격)
    for (let x = 0; x <= canvasWidth; x += 20) {
      contextRef.current.beginPath();
      contextRef.current.moveTo(x, 0);
      contextRef.current.lineTo(x, canvasHeight);
      contextRef.current.stroke();
    }
    
    // 가로선 그리기 (20px 간격)
    for (let y = 0; y <= canvasHeight; y += 20) {
      contextRef.current.beginPath();
      contextRef.current.moveTo(0, y);
      contextRef.current.lineTo(canvasWidth, y);
      contextRef.current.stroke();
    }
    
    // 도구 설정 복원
    if (currentTool === 'eraser') {
      contextRef.current.strokeStyle = '#ffffff';
      contextRef.current.lineWidth = lineWidth * 2;
    } else {
      contextRef.current.strokeStyle = color;
      contextRef.current.lineWidth = lineWidth;
    }
    
    // 드로잉 상태 초기화
    setHasDrawing(false);
    setSavedDrawingData(null);
  };

  // 드로잉 분석 및 저장
  const saveDrawing = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // 자동차 쉐입 분석 수행
    try {
      const analysis = analyzeCarShape(canvas);
      
      // 분석 결과를 템플릿과 매핑
      const templateMapping = mapAnalysisToTemplate(analysis);
      
      // 분석 결과 저장
      setDrawingAnalysis({
        analysis,
        templateMapping
      });
      
      // 분석된 차종을 기본 선택으로 설정
      setSelectedCarType(analysis.carType);
    
    const dataUrl = canvas.toDataURL('image/png');
    setSavedDrawingData(dataUrl); // 드로잉 데이터 저장
    setHasBeenToPreview(true);
    setCurrentStep('preview');
    } catch (error) {
      console.error('❌ 분석 중 오류 발생:', error);
      // 분석 실패 시에도 3D 프리뷰로 이동 (기본값 사용)
      const dataUrl = canvas.toDataURL('image/png');
      setSavedDrawingData(dataUrl);
      setHasBeenToPreview(true);
      setCurrentStep('preview');
    }
  };



  // 이벤트 리스너 설정
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const mouseDownHandler = (e: MouseEvent) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      startDrawing(x, y);
    };

    const mouseMoveHandler = (e: MouseEvent) => {
      e.preventDefault();
      if (isDrawing) {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        draw(x, y);
      }
    };

    const mouseUpHandler = (e: MouseEvent) => {
      e.preventDefault();
      if (isDrawing) {
        stopDrawing();
      }
    };

    const mouseLeaveHandler = (e: MouseEvent) => {
      e.preventDefault();
      if (isDrawing) {
        stopDrawing();
      }
    };

    // 터치 이벤트 핸들러 (좌표 변환 적용)
    const touchStartHandler = (e: TouchEvent) => {
      e.preventDefault();
      const touch = e.touches[0];
      const rect = canvas.getBoundingClientRect();
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;
      startDrawing(x, y);
    };

    const touchMoveHandler = (e: TouchEvent) => {
      e.preventDefault();
      if (isDrawing) {
        const touch = e.touches[0];
        const rect = canvas.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        draw(x, y);
      }
    };

    const touchEndHandler = (e: TouchEvent) => {
      e.preventDefault();
      if (isDrawing) {
        stopDrawing();
      }
    };

    // 이벤트 리스너 등록
    canvas.addEventListener('mousedown', mouseDownHandler);
    canvas.addEventListener('mousemove', mouseMoveHandler);
    canvas.addEventListener('mouseup', mouseUpHandler);
    canvas.addEventListener('mouseleave', mouseLeaveHandler);
    
    // 터치 이벤트는 passive: true로 설정하여 스크롤 충돌 방지
    canvas.addEventListener('touchstart', touchStartHandler, { passive: true });
    canvas.addEventListener('touchmove', touchMoveHandler, { passive: true });
    canvas.addEventListener('touchend', touchEndHandler, { passive: true });

    return () => {
      canvas.removeEventListener('mousedown', mouseDownHandler);
      canvas.removeEventListener('mousemove', mouseMoveHandler);
      canvas.removeEventListener('mouseup', mouseUpHandler);
      canvas.removeEventListener('mouseleave', mouseLeaveHandler);
      
      canvas.removeEventListener('touchstart', touchStartHandler);
      canvas.removeEventListener('touchmove', touchMoveHandler);
      canvas.removeEventListener('touchend', touchEndHandler);
    };
  }, [isDrawing, color, lineWidth, currentTool, currentStep]);

  const renderDrawStep = () => (
    <div className="space-y-4">
      <div className="mb-6 mt-10 px-4 md:px-0">
        <PageHeader 
          title="박스카 그리기"
          description="상상한 자동차를 그려보세요! 화면 위에 쓱쓱 자유롭게 ✨"
        />
      </div>

      {/* Drawing Canvas - 통합된 카드 */}
      <Card className={DRAWING_CANVAS_CARD_STYLES}>
        <CardHeader className="text-gray-800 px-4 md:px-8 pb-0 pt-0">
          <CardTitle className="flex items-center text-lg">
            <Sparkles className="w-5 h-5 mr-2 text-blue-600" />
            <span className="bg-gradient-to-r from-blue-600 to-pink-600 bg-clip-text text-transparent">그리기 캔버스</span>
          </CardTitle>
          {/* 안내 문구 */}
          <p className="text-xs text-gray-600 mt-0 mb-0 text-left">
            다양한 색상의 펜으로 그림을 그리고, 지우개로 지울 수 있어요.
          </p>
        </CardHeader>
        <CardContent 
          className="px-4 md:px-8 pt-0 pb-0 -mt-3"
        >
          {/* 그리기 도구 박스 */}
          <div className="bg-white rounded-xl p-4 border border-gray-200 mb-2" style={{ touchAction: 'auto' }}>
            {/* 첫 번째 행: 툴과 컬러 */}
            <div className="flex items-center gap-4 sm:gap-6">
              {/* Tool Selection */}
              <div className="flex-shrink-0">
                <div className="flex gap-2">
                  <Button
                    variant={currentTool === 'pen' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCurrentTool('pen')}
                    className={`w-14 h-18 p-0 flex items-center justify-center transition-all duration-200 rounded-xl ${
                      currentTool === 'pen' 
                        ? 'bg-gradient-to-br from-blue-500 to-purple-500 text-white' 
                        : 'bg-white border-2 border-blue-200 hover:bg-blue-50 hover:border-blue-300'
                    }`}
                    title="Pen Tool"
                  >
                    <PenTool className="w-7 h-7" />
                  </Button>
                  <Button
                    variant={currentTool === 'eraser' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCurrentTool('eraser')}
                    className={`w-14 h-18 p-0 flex items-center justify-center transition-all duration-200 rounded-xl ${
                      currentTool === 'eraser' 
                        ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white' 
                        : 'bg-white border-2 border-purple-200 hover:bg-purple-50 hover:border-purple-300'
                    }`}
                    title="Eraser Tool"
                  >
                    <Eraser className="w-7 h-7" />
                  </Button>
                </div>
              </div>

              {/* Color Selection */}
              {currentTool === 'pen' && (
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col gap-1 sm:gap-2">
                    {/* 첫 번째 줄: 5개 컬러 */}
                    <div className="flex gap-1 sm:gap-2">
                      {['#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00'].map((c) => (
                        <button
                          key={c}
                          className={`w-8 h-8 border-2 transition-all duration-200 rounded-lg ${color === c ? 'border-gray-800 scale-110' : 'border-transparent hover:scale-105'}`}
                          style={{ backgroundColor: c }}
                          onClick={() => setColor(c)}
                        />
                      ))}
                    </div>
                    {/* 두 번째 줄: 5개 컬러 */}
                    <div className="flex gap-1 sm:gap-2">
                      {['#FF00FF', '#00FFFF', '#FFA500', '#800080', '#008000'].map((c) => (
                        <button
                          key={c}
                          className={`w-8 h-8 border-2 transition-all duration-200 rounded-lg ${color === c ? 'border-gray-800 scale-110' : 'border-transparent hover:scale-105'}`}
                          style={{ backgroundColor: c }}
                          onClick={() => setColor(c)}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* 캔버스 */}
          <div 
            className={THREE_D_RENDERER_CONTAINER} 
            style={{ 
              aspectRatio: isClient ? (isMobile ? '4/3' : '2/1') : '2/1',
              touchAction: 'none',
              userSelect: 'none',
              overscrollBehavior: 'none'
            }}
          >
            <canvas
              ref={canvasRef}
              style={{ 
                width: '100%',
                height: '100%',
                touchAction: 'none',
                userSelect: 'none',
                WebkitTouchCallout: 'none',
                WebkitUserSelect: 'none',
                msUserSelect: 'none',
                MozUserSelect: 'none',
                overscrollBehavior: 'none',
                scrollBehavior: 'auto'
              }}
            />
          </div>
          
          {/* Action Buttons - 카드 안에 좌우 배치 */}
          <div className="flex items-center justify-between pt-3" style={{ touchAction: 'auto' }}>
            <div>
              <Button 
                variant="outline" 
                onClick={clearCanvas}
                className="bg-white/80 backdrop-blur-sm border-2 border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 rounded-full w-[74px] h-[74px] md:w-20 md:h-20 p-2 md:p-3 flex flex-col items-center justify-center gap-1 text-gray-900"
              >
                <Eraser className="w-4 h-4 md:w-5 md:h-5" />
                <span className="font-medium" style={{fontSize: '14px'}}>초기화</span>
              </Button>
            </div>
            <div>
              <Button 
                onClick={saveDrawing}
                disabled={!hasDrawing && !hasBeenToPreview}
                className={`rounded-full w-[74px] h-[74px] md:w-20 md:h-20 p-2 md:p-3 flex flex-col items-center justify-center gap-1 transition-all duration-200 ${
                  !hasDrawing && !hasBeenToPreview
                    ? 'opacity-50 cursor-not-allowed bg-gray-300' 
                    : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg hover:shadow-xl'
                }`}
              >
                <Sparkles className="w-4 h-4 md:w-5 md:h-5" />
                <span className="font-medium" style={{fontSize: '14px'}}>3D생성</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderPreviewStep = () => (
    <div className="space-y-4">

      <div className="mb-6 mt-10 px-4 md:px-0">
        <PageHeader 
          title="3D 미리보기"
          description="내가 그린 그림이 3D 박스카로 짠!"
        />
      </div>

      {/* 3D Preview */}
      <div className="w-full">
        {/* Main 3D Preview */}
        <div className="w-full">
          <Card className="bg-white/95 border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden py-5 w-full rounded-2xl">
            <CardHeader className="text-gray-800 px-4 md:px-8 pb-0 pt-0">
              <CardTitle className="text-lg flex items-center">
                <Brain className="w-5 h-5 mr-2 text-blue-600" />
                <span className="bg-gradient-to-r from-blue-600 to-pink-600 bg-clip-text text-transparent">AI가 분석한 박스카</span>
              </CardTitle>
              {/* 안내 문구 */}
              <p className="text-xs text-gray-600 mt-0 mb-0 text-left">
                결과가 마음에 안 든다면? 다른 차종으로 쓱 바꿔보세요!
              </p>
            </CardHeader>
            <CardContent className="px-4 md:px-8 pt-0 pb-0 -mt-3">
              {/* 분석 결과 표시 */}
              {drawingAnalysis && (
                <div className="mb-2">
                  
                  {/* 차종 선택 버튼들 */}
                  <div className="grid grid-cols-4 md:grid-cols-7 gap-2">
                    {[
                      // 차종 타입 정의 (이미지 사용)
                      { type: 'sedan', label: '꼬마세단', image: '/buttons/button-sedan.png' },           // 꼬마세단: sedan (기본 세단)
                      { type: 'sedan-type2', label: '큰세단', image: '/buttons/button-sedan2.png' }, // 큰세단: sedan-type2 (나중에 추가된 큰 세단)
                      { type: 'sports', label: '스포츠카', image: '/buttons/button-sportscar.png' },         // 스포츠카: sports
                      { type: 'suv', label: 'SUV', image: '/buttons/button-suv.png' },                 // SUV: suv
                      { type: 'truck', label: '빵빵트럭', image: '/buttons/button-truck.png' },         // 빵빵트럭: truck (트럭)
                      { type: 'bus-type2', label: '통통버스', image: '/buttons/button-bus2.png' },   // 통통버스: bus-type2 (둥근 버스)
                      { type: 'bus', label: '네모버스', image: '/buttons/button-bus.png' }             // 네모버스: bus (네모난 버스)
                    ].map((car) => {
                      return (
                        <button
                          key={car.type}
                          onClick={() => {
                            setSelectedCarType(car.type);
                          }}
                          className={`flex flex-col items-center justify-center px-2 py-2 md:p-2 rounded-xl border-2 transition-all duration-200 h-[85px] md:h-[106px] ${
                            selectedCarType === car.type
                              ? 'border-transparent bg-gradient-to-br from-blue-500 to-purple-500 text-white'
                              : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50 text-gray-700'
                          }`}
                        >
                          <img 
                            src={car.image} 
                            alt={car.label}
                            className="w-16 h-16 md:w-24 md:h-24 mb-1 object-contain"
                          />
                          <span className="font-medium" style={{fontSize: '13px'}}>{car.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
              
                  <div className={THREE_D_RENDERER_CONTAINER} style={{ aspectRatio: isClient ? (isMobile ? '4/3' : '2/1') : '2/1' }}>
                    <ThreeDRenderer 
                      carType={(() => {
                        const finalCarType = selectedCarType || drawingAnalysis?.analysis?.carType || "sedan";
                        return finalCarType;
                      })()} 
                      drawingAnalysis={drawingAnalysis}
                      fill={true}
                      scale={1.5}
                      isMobile={isMobile}
                      carColor={carColor}
                      roofColor={roofColor}
                      selectedBadge={selectedBadge}
                      selectedPlate={selectedPlate}
                      headlightColor={headlightColor}
                      taillightColor={taillightColor}
                      selectedHeadlight={selectedHeadlight}
                      selectedWheel={selectedWheel}
                      selectedGrille={selectedGrille}
                      selectedTaillight={selectedTaillight}
                    />
                  </div>
                  
                  {/* Action Buttons - 카드 안에 좌우 배치 */}
                  <div className="pt-3">
                    <div className="flex items-center justify-between">
                      <Button 
                        variant="outline" 
                        onClick={() => setCurrentStep('draw')}
                        className="bg-white/80 backdrop-blur-sm border-2 border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 rounded-full w-[74px] h-[74px] md:w-20 md:h-20 p-2 md:p-3 flex flex-col items-center justify-center gap-1 text-gray-900"
                      >
                        <ArrowLeft className="w-4 h-4 md:w-5 md:h-5" />
                        <span className="font-medium" style={{fontSize: '14px'}}>뒤로</span>
                      </Button>
                      <Button 
                        onClick={() => setCurrentStep('decorate')} 
                        className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 rounded-full w-[74px] h-[74px] md:w-20 md:h-20 p-2 md:p-3 flex flex-col items-center justify-center gap-1"
                      >
                        <Sparkles className="w-4 h-4 md:w-5 md:h-5" />
                        <span className="font-medium" style={{fontSize: '14px'}}>꾸미기</span>
                      </Button>
                    </div>
                  </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );

  const renderDecorateStep = () => (
    <div className="space-y-4">

      <div className="mb-6 mt-10 px-4 md:px-0">
        <PageHeader 
          title="박스카 꾸미기"
          description="헤드램프부터 휠, 색상까지✨ 원하는 대로 꾸며보세요!"
        />
      </div>

      {/* 3D 박스카 미리보기 + 꾸미기 아이템 */}
      <Card className="bg-white/95 border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden py-5 w-full rounded-2xl mb-6 relative">
        <CardHeader className="text-gray-800 px-4 md:px-8 pb-0 pt-0">
          <CardTitle className="text-lg flex items-center">
            <Palette className="w-5 h-5 mr-2 text-blue-600" />
            <span className="bg-gradient-to-r from-blue-600 to-pink-600 bg-clip-text text-transparent">꾸미기 아이템</span>
          </CardTitle>
          {/* 안내 문구 */}
          <p className="text-xs text-gray-600 mt-0 mb-0 text-left">
            내 박스카를 360° 돌려보며, 아이템으로 나만의 스타일을 완성해요.
          </p>
        </CardHeader>
        <CardContent className="px-4 md:px-8 pt-0 pb-0 -mt-3">
          {/* 꾸미기 아이템 선택 버튼들 */}
          <div className="grid grid-cols-4 md:grid-cols-7 gap-2">
            {[
              { type: 'headlight', label: '헤드램프', image: 'button-headlamps.png' },
              { type: 'taillight', label: '리어램프', image: 'button-realamps.png' },
              { type: 'grille', label: '그릴', image: 'button-grill.png' },
              { type: 'badge', label: '뱃지', image: 'button-badge.png' },
              { type: 'plate', label: '번호판', image: 'button-plate.png' },
              { type: 'wheel', label: '휠', image: 'button-wheel.png' },
              { type: 'body-color', label: '색상', image: 'button-color.png' }
            ].map((item) => {
              const isApplied = appliedItems.has(item.type);
              return (
                <button
                  key={item.type}
                  onClick={() => setSelectedItem(item.type)}
                  className={`relative flex flex-col items-center justify-center p-2 rounded-xl border-2 transition-all duration-200 h-[85px] md:h-[106px] ${
                    selectedItem === item.type
                      ? 'border-transparent bg-gradient-to-br from-blue-500 to-purple-500 text-white'
                      : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50 text-gray-700'
                  }`}
                >
                  {/* 체크 아이콘 */}
                  {isApplied && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                  <img 
                    src={`/buttons/${item.image}`} 
                    alt={item.label}
                    className="w-16 h-16 md:w-[90px] md:h-[90px] mb-1 object-contain"
                  />
                  <span className="font-medium" style={{fontSize: '13px'}}>{item.label}</span>
                </button>
              );
            })}
          </div>
          
          {/* 3D 렌더링 영역 */}
          <div className={`${THREE_D_RENDERER_CONTAINER} mt-2 mb-3`} style={{ aspectRatio: isClient ? (isMobile ? '4/3' : '2/1') : '2/1' }}>
            <ThreeDRenderer 
              ref={threeDRendererRef}
              carType={(() => {
                const finalCarType = selectedCarType || drawingAnalysis?.analysis?.carType || "sedan";
                return finalCarType;
              })()} 
              drawingAnalysis={drawingAnalysis}
              fill={true}
              scale={1.5}
              isMobile={isMobile}
              carColor={carColor}
              roofColor={roofColor}
              selectedBadge={selectedBadge}
              selectedPlate={selectedPlate}
              headlightColor={headlightColor}
              taillightColor={taillightColor}
              selectedHeadlight={selectedHeadlight}
              selectedWheel={selectedWheel}
              selectedGrille={selectedGrille}
              selectedTaillight={selectedTaillight}
            />
          </div>

          {/* Action Buttons - 카드 안에 배치 */}
          <div className="flex items-center justify-between">
            <Button 
              variant="outline" 
              onClick={() => setCurrentStep('preview')}
              className="bg-white/80 backdrop-blur-sm border-2 border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 rounded-full w-[74px] h-[74px] md:w-20 md:h-20 p-2 md:p-3 flex flex-col items-center justify-center gap-1 text-gray-900"
            >
              <ArrowLeft className="w-4 h-4 md:w-5 md:h-5" />
              <span className="font-medium" style={{fontSize: '14px'}}>뒤로</span>
            </Button>
            <Button 
              onClick={handleGenerateBlueprint} 
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 rounded-full w-[74px] h-[74px] md:w-20 md:h-20 p-2 md:p-3 flex flex-col items-center justify-center gap-1"
            >
              <Sparkles className="w-4 h-4 md:w-5 md:h-5" />
              <span className="font-medium" style={{fontSize: '14px'}}>도안생성</span>
            </Button>
          </div>
        </CardContent>

        {/* 모달 오버레이 - 포털 사용 */}
        {selectedItem && createPortal(
          <div 
            className="fixed inset-0 bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-pink-900/20 backdrop-blur-md flex items-center justify-center"
            style={{ zIndex: 99999 }}
            onClick={() => setSelectedItem(null)}
          >
            <div 
              className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 max-w-4xl w-full max-h-[calc(80vh+10px)] overflow-y-auto mx-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 pr-4">
                    <h3 className="text-lg font-semibold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                      {selectedItem === 'body-color' && '박스카 색상 선택'}
                      {selectedItem === 'headlight' && '헤드램프 선택'}
                      {selectedItem === 'taillight' && '리어램프 선택'}
                      {selectedItem === 'grille' && '라디에이터 그릴 선택'}
                      {selectedItem === 'badge' && '뱃지 선택'}
                      {selectedItem === 'plate' && '번호판 선택'}
                      {selectedItem === 'wheel' && '타이어 휠 선택'}
                    </h3>
                    {/* 안내 문구 */}
                    <p className="text-xs text-gray-600 mt-3">
                      아이템을 다시 선택하면 원래 모습으로 돌아가요. 마음에 들 때까지 바꿔보세요!
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedItem(null)}
                    className="text-gray-500 hover:text-gray-700 text-2xl font-bold flex-shrink-0 -mt-2"
                  >
                    ×
                  </button>
                </div>
              
              {/* 박스카 색상 */}
              {selectedItem === 'body-color' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {[
                      '#FF6B6B', // 짙은 빨간색 (페라리 레드)
                      '#7FE5E0', // 밝은 청록색 (포르쉐 청록)
                      '#4682B4', // 진한 하늘색 (스틸 블루)
                      '#B8F2E6', // 밝은 민트색 (민트 그린)
                      '#FFFF99', // 밝은 노란색 (포르쉐 옐로우)
                      '#E6B3FF', // 밝은 자주색 (포르쉐 퍼플)
                      '#C8F7C5', // 밝은 연두색 (라임 그린)
                      '#FFE066', // 밝은 골드 (골드)
                      '#E6CCFF', // 밝은 라벤더 (라벤더)
                      '#B3D9FF', // 밝은 파란색 (오션 블루)
                      '#FFCC99', // 밝은 오렌지 (오렌지)
                      '#B3FFB3', // 밝은 초록 (그린)
                      '#F0F0F0', // 밝은 회색 (실버)
                      '#FFE6E6', // 밝은 핑크 (핑크)
                      '#E6F3FF', // 밝은 아이스 블루 (아이스 블루)
                      '#FFE6CC'  // 밝은 피치 (피치)
                    ].map(color => (
                      <button
                        key={color}
                      className={`relative flex items-center justify-center p-2 rounded-lg border-2 transition-all duration-200 h-[64px] md:h-[70px] ${
                          carColor === color
                            ? 'border-transparent bg-gradient-to-br from-blue-500 to-purple-500 text-white'
                            : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                        }`}
                        onClick={() => {
                          if (carColor === color) {
                            // 같은 색상을 다시 클릭하면 해제 (기본 색상으로)
                            setCarColor('#FFFFFF');
                            setAppliedItems(prev => {
                              const newSet = new Set(prev);
                              newSet.delete('body-color');
                              return newSet;
                            });
                          } else {
                            // 새로운 색상 선택
                            setCarColor(color);
                            setAppliedItems(prev => new Set(prev).add('body-color'));
                          }
                        }}
                        title={color}
                      >
                        <div 
                          className="w-12 h-12 rounded-lg"
                          style={{ backgroundColor: color }}
                        />
                        {carColor === color && (
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 헤드램프 */}
              {selectedItem === 'headlight' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {[
                      // { type: 'round-yellow', label: '동그란 헤드램프 (노란색)', icon: '🟡', color: '#FFD700' },
                      // { type: 'round-white', label: '동그란 헤드램프 (하얀색)', icon: '⚪', color: '#FFFFFF' },
                      // { type: 'square-yellow', label: '사각형 헤드램프 (노란색)', icon: '🟨', color: '#FFD700' },
                      // { type: 'square-white', label: '사각형 헤드램프 (하얀색)', icon: '⬜', color: '#FFFFFF' },
                      // { type: 'cute-eyes', label: '귀여운 눈', icon: '😊', color: '#FFFFFF' },
                      { type: 'cute-eyes-image', label: '귀여운 눈 (이미지)', icon: '😊', color: '#FFFFFF' },
                      { type: 'cute2', label: '귀여운 눈2', icon: '😊', color: '#FFFFFF' },
                      { type: 'cute3', label: '귀여운 눈3', icon: '😊', color: '#FFFFFF' },
                      { type: 'cute4', label: '귀여운 눈4', icon: '😊', color: '#FFFFFF' },
                      { type: 'cute5', label: '귀여운 눈5', icon: '😊', color: '#FFFFFF' },
                      { type: 'cute6', label: '귀여운 눈6 (좌우다름)', icon: '😊', color: '#FFFFFF' },
                      { type: 'cute7', label: '귀여운 눈7', icon: '😊', color: '#FFFFFF' },
                      { type: 'cute8', label: '귀여운 눈8', icon: '😊', color: '#FFFFFF' },
                      { type: 'cute9', label: '귀여운 눈9', icon: '😊', color: '#FFFFFF' },
                      { type: 'cute10', label: '귀여운 눈10', icon: '😊', color: '#FFFFFF' },
                      { type: 'cute11', label: '귀여운 눈11', icon: '😊', color: '#FFFFFF' },
                      { type: 'cute12', label: '귀여운 눈12', icon: '😊', color: '#FFFFFF' },
                      // { type: 'angry-eyes', label: '화난 눈', icon: '😠', color: '#FF6B6B' },
                      // { type: 'happy-eyes', label: '웃는 눈', icon: '😄', color: '#FFFFFF' },
                      // { type: 'blinking-eyes', label: '깜빡이는 눈', icon: '😉', color: '#FFFFFF' }
                  ].map((item) => (
                    <button
                      key={item.type}
                      onClick={() => {
                        if (selectedHeadlight === item.type) {
                          // 이미 선택된 아이템을 다시 클릭하면 해제
                          setSelectedHeadlight(null);
                          setAppliedItems(prev => {
                            const newSet = new Set(prev);
                            newSet.delete('headlight');
                            return newSet;
                          });
                        } else {
                          // 새로운 아이템 선택
                          setSelectedHeadlight(item.type);
                          setAppliedItems(prev => new Set(prev).add('headlight'));
                        }
                      }}
                      className={`relative flex flex-col items-center justify-center p-2 rounded-lg border-2 transition-all duration-200 h-[64px] md:h-[70px] ${
                        selectedHeadlight === item.type
                          ? 'border-transparent bg-gradient-to-br from-blue-500 to-purple-500 text-white'
                          : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                      }`}
                    >
                      {item.type === 'cute-eyes-image' ? (
                        <div className="flex gap-1">
                          <img 
                            src="/headlights/headlight-cute1.png" 
                            alt="귀여운 눈" 
                            className="w-14 h-10 object-contain"
                          />
                          <img 
                            src="/headlights/headlight-cute1.png" 
                            alt="귀여운 눈" 
                            className="w-14 h-10 object-contain"
                          />
                        </div>
                      ) : item.type === 'cute2' ? (
                        <div className="flex gap-1">
                          <img 
                            src="/headlights/headlight-cute2.png" 
                            alt="귀여운 눈2" 
                            className="w-14 h-10 object-contain"
                          />
                          <img 
                            src="/headlights/headlight-cute2.png" 
                            alt="귀여운 눈2" 
                            className="w-14 h-10 object-contain"
                          />
                        </div>
                      ) : item.type === 'cute3' ? (
                        <div className="flex gap-1">
                          <img 
                            src="/headlights/headlight-cute3.png" 
                            alt="귀여운 눈3" 
                            className="w-14 h-10 object-contain"
                          />
                          <img 
                            src="/headlights/headlight-cute3.png" 
                            alt="귀여운 눈3" 
                            className="w-14 h-10 object-contain"
                          />
                        </div>
                      ) : item.type === 'cute4' ? (
                        <div className="flex gap-1">
                          <img 
                            src="/headlights/headlight-cute4.png" 
                            alt="귀여운 눈4" 
                            className="w-14 h-10 object-contain"
                          />
                          <img 
                            src="/headlights/headlight-cute4.png" 
                            alt="귀여운 눈4" 
                            className="w-14 h-10 object-contain"
                          />
                        </div>
                      ) : item.type === 'cute5' ? (
                        <div className="flex gap-1 items-center">
                          <img 
                            src="/headlights/headlight-cute5.png" 
                            alt="귀여운 눈5" 
                            className="w-14 h-10 object-contain"
                          />
                          <img 
                            src="/headlights/headlight-cute5.png" 
                            alt="귀여운 눈5" 
                            className="w-14 h-10 object-contain"
                          />
                        </div>
                      ) : item.type === 'cute6' ? (
                        <div className="flex gap-1 items-center">
                          <img 
                            src="/headlights/headlight-cute6-eyes-left.png" 
                            alt="귀여운 눈6 왼쪽" 
                            className="w-11 h-8 md:w-12 h-8 object-contain"
                          />
                          <img 
                            src="/headlights/headlight-cute6-eyes-right.png" 
                            alt="귀여운 눈6 오른쪽" 
                            className="w-11 h-8 md:w-12 h-8 object-contain"
                          />
                        </div>
                      ) : item.type === 'cute7' ? (
                        <div className="flex gap-1 items-center">
                          <img 
                            src="/headlights/headlight-cute7.png" 
                            alt="귀여운 눈7" 
                            className="w-14 h-10 object-contain"
                          />
                          <img 
                            src="/headlights/headlight-cute7.png" 
                            alt="귀여운 눈7" 
                            className="w-14 h-10 object-contain"
                          />
                        </div>
                      ) : item.type === 'cute8' ? (
                        <div className="flex gap-1 items-center">
                          <img 
                            src="/headlights/headlight-cute8.png" 
                            alt="귀여운 눈8" 
                            className="w-14 h-10 object-contain"
                          />
                          <img 
                            src="/headlights/headlight-cute8.png" 
                            alt="귀여운 눈8" 
                            className="w-14 h-10 object-contain"
                          />
                        </div>
                      ) : item.type === 'cute9' ? (
                        <div className="flex gap-1 items-center">
                          <img 
                            src="/headlights/headlight-cute9.png" 
                            alt="귀여운 눈9" 
                            className="w-14 h-10 object-contain"
                          />
                          <img 
                            src="/headlights/headlight-cute9.png" 
                            alt="귀여운 눈9" 
                            className="w-14 h-10 object-contain"
                          />
                        </div>
                      ) : item.type === 'cute10' ? (
                        <div className="flex gap-1 items-center">
                          <img 
                            src="/headlights/headlight-cute10.png" 
                            alt="귀여운 눈10" 
                            className="w-14 h-10 object-contain"
                          />
                          <img 
                            src="/headlights/headlight-cute10.png" 
                            alt="귀여운 눈10" 
                            className="w-14 h-10 object-contain"
                          />
                        </div>
                      ) : item.type === 'cute11' ? (
                        <div className="flex gap-1 items-center">
                          <img 
                            src="/headlights/headlight-cute11.png" 
                            alt="귀여운 눈11" 
                            className="w-14 h-10 object-contain"
                          />
                          <img 
                            src="/headlights/headlight-cute11.png" 
                            alt="귀여운 눈11" 
                            className="w-14 h-10 object-contain"
                          />
                        </div>
                      ) : item.type === 'cute12' ? (
                        <div className="flex gap-1 items-center">
                          <img 
                            src="/headlights/headlight-cute12.png" 
                            alt="귀여운 눈12" 
                            className="w-14 h-10 object-contain"
                          />
                          <img 
                            src="/headlights/headlight-cute12.png" 
                            alt="귀여운 눈12" 
                            className="w-14 h-10 object-contain"
                          />
                        </div>
                      ) : (
                        <span className="text-2xl mb-1">{item.icon}</span>
                      )}
                      {selectedHeadlight === item.type && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
                </div>
              )}

              {/* 리어램프 */}
              {selectedItem === 'taillight' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {[
                      { type: 'rearlight-1', label: '리어램프 1' },
                      { type: 'rearlight-2', label: '리어램프 2' },
                      { type: 'rearlight-3', label: '리어램프 3' },
                      { type: 'rearlight-4', label: '리어램프 4' },
                      { type: 'rearlight-5', label: '리어램프 5' },
                      { type: 'rearlight-6', label: '리어램프 6' },
                      { type: 'rearlight-7', label: '리어램프 7' },
                      { type: 'rearlight-8', label: '리어램프 8' },
                      { type: 'rearlight-9', label: '리어램프 9' },
                      { type: 'rearlight-10', label: '리어램프 10' },
                      { type: 'rearlight-11', label: '리어램프 11' },
                      { type: 'rearlight-12', label: '리어램프 12' }
                    ].map(item => (
                      <button
                        key={item.type}
                        onClick={() => {
                          if (selectedTaillight === item.type) {
                            setSelectedTaillight(null);
                            setAppliedItems(prev => {
                              const newSet = new Set(prev);
                              newSet.delete('taillight');
                              return newSet;
                            });
                          } else {
                            setSelectedTaillight(item.type);
                            setAppliedItems(prev => new Set(prev).add('taillight'));
                          }
                        }}
                        className={`relative flex flex-col items-center justify-center p-2 rounded-lg border-2 transition-all duration-200 h-[64px] md:h-[70px] ${
                          selectedTaillight === item.type
                            ? 'border-transparent bg-gradient-to-br from-blue-500 to-purple-500 text-white'
                            : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                        }`}
                      >
                        <div className="flex gap-1">
                          <img
                            src={`/rearlights/${item.type}.png`}
                            alt={item.type}
                            className="w-14 h-10 object-contain"
                          />
                          <img
                            src={`/rearlights/${item.type}.png`}
                            alt={item.type}
                            className="w-14 h-10 object-contain"
                          />
                        </div>
                        {selectedTaillight === item.type && (
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 라디에이터 그릴 */}
              {selectedItem === 'grille' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {[
                      { type: 'grill-1', label: '그릴 1' },
                      { type: 'grill-2', label: '그릴 2' },
                      { type: 'grill-3', label: '그릴 3' },
                      { type: 'grill-4', label: '그릴 4' },
                      { type: 'grill-5', label: '그릴 5' },
                      { type: 'grill-6', label: '그릴 6' },
                      { type: 'grill-7', label: '그릴 7' },
                      { type: 'grill-8', label: '그릴 8' },
                      { type: 'grill-9', label: '그릴 9' },
                      { type: 'grill-10', label: '그릴 10' },
                      { type: 'grill-11', label: '그릴 11' },
                      { type: 'grill-12', label: '그릴 12' }
                    ].map(item => (
                      <button
                        key={item.type}
                        onClick={() => {
                          if (selectedGrille === item.type) {
                            setSelectedGrille(null);
                            setAppliedItems(prev => {
                              const newSet = new Set(prev);
                              newSet.delete('grille');
                              return newSet;
                            });
                          } else {
                            setSelectedGrille(item.type);
                            setAppliedItems(prev => new Set(prev).add('grille'));
                          }
                        }}
                        className={`relative flex flex-col items-center justify-center p-2 rounded-lg border-2 transition-all duration-200 h-[64px] md:h-[70px] ${
                          selectedGrille === item.type
                            ? 'border-transparent bg-gradient-to-br from-blue-500 to-purple-500 text-white'
                            : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                        }`}
                      >
                        <img
                          src={`/grills/${item.type}.png`}
                          alt={item.type}
                          className="w-28 h-20 object-contain"
                        />
                        {selectedGrille === item.type && (
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

         {/* 뱃지 */}
         {selectedItem === 'badge' && (
           <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
             {[
               { type: 'badge-1', image: '/badges/badge-1.png' },
               { type: 'badge-2', image: '/badges/badge-2.png' },
               { type: 'badge-3', image: '/badges/badge-3.png' },
               { type: 'badge-4', image: '/badges/badge-4.png' },
               { type: 'badge-5', image: '/badges/badge-5.png' },
               { type: 'badge-6', image: '/badges/badge-6.png' },
               { type: 'badge-7', image: '/badges/badge-7.png' },
               { type: 'badge-8', image: '/badges/badge-8.png' },
               { type: 'badge-9', image: '/badges/badge-9.png' },
               { type: 'badge-10', image: '/badges/badge-10.png' },
               { type: 'badge-11', image: '/badges/badge-11.png' },
               { type: 'badge-12', image: '/badges/badge-12.png' },
               { type: 'badge-13', image: '/badges/badge-13.png' },
               { type: 'badge-14', image: '/badges/badge-14.png' },
               { type: 'badge-15', image: '/badges/badge-15.png' },
               { type: 'badge-16', image: '/badges/badge-16.png' }
             ].map((badge) => (
                    <button
                      key={badge.type}
                      onClick={() => {
                        if (selectedBadge === badge.type) {
                          setSelectedBadge(null);
                          setAppliedItems(prev => {
                            const newSet = new Set(prev);
                            newSet.delete('badge');
                            return newSet;
                          });
                        } else {
                          setSelectedBadge(badge.type);
                          setAppliedItems(prev => new Set(prev).add('badge'));
                        }
                      }}
                      className={`relative flex items-center justify-center p-3 rounded-lg border-2 transition-all duration-200 h-[64px] md:h-[70px] ${
                        selectedBadge === badge.type
                          ? 'border-transparent bg-gradient-to-br from-blue-500 to-purple-500 text-white'
                          : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                      }`}
                    >
                      <img 
                        src={badge.image} 
                        alt={badge.type}
                        className="w-13 h-13 object-contain"
                      />
                      {selectedBadge === badge.type && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
         )}

         {/* 번호판 */}
         {selectedItem === 'plate' && (
           <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
             {[
               { type: 'plate-1', label: '번호판 1' },
               { type: 'plate-2', label: '번호판 2' },
               { type: 'plate-3', label: '번호판 3' },
               { type: 'plate-4', label: '번호판 4' },
               { type: 'plate-5', label: '번호판 5' },
               { type: 'plate-6', label: '번호판 6' },
               { type: 'plate-7', label: '번호판 7' },
               { type: 'plate-8', label: '번호판 8' },
               { type: 'plate-9', label: '번호판 9' },
               { type: 'plate-10', label: '번호판 10' },
               { type: 'plate-11', label: '번호판 11' },
               { type: 'plate-12', label: '번호판 12' }
             ].map((item) => (
               <button
                 key={item.type}
                 onClick={() => {
                   if (selectedPlate === item.type) {
                     setSelectedPlate(null);
                     setAppliedItems(prev => {
                       const newSet = new Set(prev);
                       newSet.delete('plate');
                       return newSet;
                     });
                   } else {
                     setSelectedPlate(item.type);
                     setAppliedItems(prev => new Set(prev).add('plate'));
                   }
                 }}
                 className={`relative flex flex-col items-center p-3 rounded-lg border-2 transition-all duration-200 h-[64px] md:h-[70px] ${
                   selectedPlate === item.type
                     ? 'border-transparent bg-gradient-to-br from-blue-500 to-purple-500 text-white'
                     : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                 }`}
               >
                 <img
                   src={`/plates/${item.type}.png`}
                   alt={item.type}
                   className="w-26 h-13 object-contain"
                 />
                 {selectedPlate === item.type && (
                   <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                     <Check className="w-3 h-3 text-white" />
                   </div>
                 )}
               </button>
             ))}
           </div>
         )}

            {/* 타이어 휠 */}
              {selectedItem === 'wheel' && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {[
                    { type: 'wheel-1', label: '휠 1', icon: '⚫' },
                    { type: 'wheel-2', label: '휠 2', icon: '⚫' },
                    { type: 'wheel-3', label: '휠 3', icon: '⚫' },
                    { type: 'wheel-4', label: '휠 4', icon: '⚫' },
                    { type: 'wheel-5', label: '휠 5', icon: '⚫' },
                    { type: 'wheel-6', label: '휠 6', icon: '⚫' },
                    { type: 'wheel-7', label: '휠 7', icon: '⚫' },
                    { type: 'wheel-8', label: '휠 8', icon: '⚫' }
                  ].map((item) => (
                    <button
                      key={item.type}
                      onClick={() => {
                        if (selectedWheel === item.type) {
                          setSelectedWheel(null);
                          setAppliedItems(prev => {
                            const newSet = new Set(prev);
                            newSet.delete('wheel');
                            return newSet;
                          });
                        } else {
                          setSelectedWheel(item.type);
                          setAppliedItems(prev => new Set(prev).add('wheel'));
                        }
                      }}
                        className={`relative flex flex-col items-center justify-center p-2 rounded-lg border-2 transition-all duration-200 h-[64px] md:h-[70px] ${
                        selectedWheel === item.type
                          ? 'border-transparent bg-gradient-to-br from-blue-500 to-purple-500 text-white'
                          : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                      }`}
                    >
                      {item.type === 'wheel-1' ? (
                        <img 
                          src="/wheels/wheel-1.png" 
                          alt="휠 1" 
                          className="w-[52px] h-[52px] object-contain"
                        />
                      ) : item.type === 'wheel-2' ? (
                        <img 
                          src="/wheels/wheel-2.png" 
                          alt="휠 2" 
                          className="w-[52px] h-[52px] object-contain"
                        />
                      ) : item.type === 'wheel-3' ? (
                        <img 
                          src="/wheels/wheel-3.png" 
                          alt="휠 3" 
                          className="w-[52px] h-[52px] object-contain"
                        />
                      ) : item.type === 'wheel-4' ? (
                        <img 
                          src="/wheels/wheel-4.png" 
                          alt="휠 4" 
                          className="w-[52px] h-[52px] object-contain"
                        />
                      ) : item.type === 'wheel-5' ? (
                        <img 
                          src="/wheels/wheel-5.png" 
                          alt="휠 5" 
                          className="w-[52px] h-[52px] object-contain"
                        />
                      ) : item.type === 'wheel-6' ? (
                        <img 
                          src="/wheels/wheel-6.png" 
                          alt="휠 6" 
                          className="w-[52px] h-[52px] object-contain"
                        />
                      ) : item.type === 'wheel-7' ? (
                        <img 
                          src="/wheels/wheel-7.png" 
                          alt="휠 7" 
                          className="w-[52px] h-[52px] object-contain"
                        />
                      ) : item.type === 'wheel-8' ? (
                        <img 
                          src="/wheels/wheel-8.png" 
                          alt="휠 8" 
                          className="w-[52px] h-[52px] object-contain"
                        />
                      ) : (
                        <span className="text-2xl mb-1">{item.icon}</span>
                      )}
                      {selectedWheel === item.type && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}



                <div className="mt-4 flex justify-center">
          <Button 
                    onClick={() => {
                      setSelectedItem(null);
                    }}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-full px-12 py-3"
                    style={{fontSize: '14px'}}
                  >
                    선택
          </Button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
      </Card>
    </div>
  );

  const renderExportStep = () => (
    <div className="space-y-4">
      {/* 메인 3D 렌더러 (도안용) */}
      <div className="hidden">
        <ThreeDRenderer 
          ref={threeDRendererRef}
          carType={(() => {
            const finalCarType = selectedCarType || drawingAnalysis?.analysis?.carType || "sedan";
            console.log('🎯 도안용 렌더러에 전달되는 carType:', finalCarType);
            return finalCarType;
          })()} 
          drawingAnalysis={drawingAnalysis}
          fill={false}
          width={1200}
          height={800}
          scale={1.5}
          isMobile={isMobile}
          carColor={carColor}
          roofColor={roofColor}
          headlightColor={headlightColor}
          taillightColor={taillightColor}
          selectedBadge={selectedBadge}
          selectedGrille={selectedGrille}
          selectedHeadlight={selectedHeadlight}
          selectedTaillight={selectedTaillight}
          selectedPlate={selectedPlate}
          selectedWheel={selectedWheel}
        />
      </div>
      
      {/* 숨겨진 3D 렌더러 (썸네일용) */}
      <div className="hidden">
        <ThreeDRenderer 
          ref={thumbnailRendererRef}
          carType={(() => {
            const finalCarType = selectedCarType || drawingAnalysis?.analysis?.carType || "sedan";
            console.log('🎯 썸네일용 렌더러에 전달되는 carType:', finalCarType);
            return finalCarType;
          })()} 
          drawingAnalysis={drawingAnalysis}
          fill={false}
          width={1200}
          height={800}
          scale={1.5}
          isMobile={isMobile}
          carColor={carColor}
          roofColor={roofColor}
          headlightColor={headlightColor}
          taillightColor={taillightColor}
          selectedBadge={selectedBadge}
          selectedPlate={selectedPlate}
          selectedHeadlight={selectedHeadlight}
          selectedWheel={selectedWheel}
          selectedGrille={selectedGrille}
          selectedTaillight={selectedTaillight}
        />
      </div>

      {/* 도안 생성 중 로딩 상태 */}
      {blueprintGenerating && (
        <div className="fixed inset-0 bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-pink-900/20 backdrop-blur-md z-50 flex items-center justify-center">
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 px-6 py-8 max-w-md w-full mx-6">
            <div className="text-center">
              {/* 로고 점프 애니메이션 */}
              <div className="w-20 h-20 mx-auto mb-6 flex items-end justify-center">
                <img 
                  src="/logo_remoteonly.png" 
                  alt="박스로 로고" 
                  className="w-16 h-16 animate-bounce"
                  style={{ 
                    animationDuration: '0.6s',
                    animationIterationCount: 'infinite',
                    animationTimingFunction: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)'
                  }}
                />
              </div>
              
              <h3 className="text-lg font-semibold bg-gradient-to-r from-blue-600 to-pink-600 bg-clip-text text-transparent mb-2">
                박스카 도안을 준비하고 있어요!
              </h3>
              <p className="text-gray-900" style={{fontSize: '14px'}}>3D 박스카가 도안으로 변신 중이에요...</p>
            </div>
          </div>
        </div>
      )}


      <div className="mb-6 mt-10 px-4 md:px-0">
        <PageHeader 
          title="박스카 도안 완성!"
          description="내가 그린 자동차가 도안으로 바뀌었어요. 파일을 내려받아 인쇄하면, 진짜 박스카 만들 준비 완료!"
        />
      </div>

      {/* 3D 박스카 미리보기 + 도안 다운로드 */}
      <Card className="bg-white/95 border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden py-5 w-full rounded-2xl mb-6 relative">
        <CardHeader className="text-gray-800 px-4 md:px-8 pb-0 pt-0">
          <CardTitle className="text-lg flex items-center">
            <Printer className="w-5 h-5 mr-2 text-blue-600" />
            <span className="bg-gradient-to-r from-blue-600 to-pink-600 bg-clip-text text-transparent">내가 만든 박스카 도안</span>
          </CardTitle>
          {/* 안내 문구 */}
          <p className="text-xs text-gray-600 mt-0 mb-0 text-left">
            나만의 박스카를 완성해보세요. 친구들과 함께 만들면 더 즐거워요.
          </p>
        </CardHeader>
        <CardContent className="px-4 md:px-8 pt-0 pb-0 -mt-3">
          {/* 도안 미리보기 영역 */}
          <div className={`${THREE_D_RENDERER_CONTAINER} bg-white flex items-center justify-center mb-4`} style={{ aspectRatio: isClient ? (isMobile ? '4/3' : '2/1') : '2/1' }}>
            {blueprintGenerated && blueprintImages.length > 0 ? (
              <img 
                src={blueprintImages[currentPage]} 
                alt={`박스카 도안 페이지 ${currentPage + 1}`}
                className="max-w-full max-h-full object-contain rounded-lg"
              />
            ) : (
              <div className="text-center text-gray-500">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
                <p className="text-lg font-medium mb-2">도안 준비 중...</p>
                <p className="text-sm">잠시만 기다려주세요</p>
              </div>
            )}
          </div>

          {/* 페이징 컨트롤 */}
          {blueprintGenerated && blueprintImages.length > 1 && (
            <div className="flex items-center justify-center gap-2 mb-4">
              <button
                onClick={goToPreviousPage}
                disabled={currentPage === 0}
                className="px-3 py-2 bg-white/80 border border-gray-300 rounded-lg hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              
              <div className="flex items-center gap-1">
                {blueprintImages.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goToPage(index)}
                    className={`w-8 h-8 rounded-lg text-sm font-medium transition-all duration-200 ${
                      currentPage === index
                        ? 'bg-blue-500 text-white'
                        : 'bg-white/80 border border-gray-300 text-gray-700 hover:bg-white/90'
                    }`}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>
              
              <button
                onClick={goToNextPage}
                disabled={currentPage === blueprintImages.length - 1}
                className="px-3 py-2 bg-white/80 border border-gray-300 rounded-lg hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* 페이지 정보 */}

          {/* 구분선 */}
          <div className="border-t border-gray-300 mt-0 mb-3"></div>

          {/* Action Buttons - 카드 안에 배치 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Button 
                variant="outline" 
                onClick={() => setCurrentStep('decorate')}
                className="bg-white/80 backdrop-blur-sm border-2 border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 rounded-full w-[74px] h-[74px] md:w-20 md:h-20 p-2 md:p-3 flex flex-col items-center justify-center gap-1 text-gray-900"
              >
                <ArrowLeft className="w-4 h-4 md:w-5 md:h-5" />
                <span className="font-medium" style={{fontSize: '14px'}}>뒤로</span>
              </Button>
            </div>
            <div className="flex items-center gap-2">
            {/* <Button 
              onClick={downloadBlueprint}
              disabled={!blueprintGenerated || blueprintImages.length === 0}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 rounded-full w-16 h-16 md:w-20 md:h-20 p-2 md:p-3 flex flex-col items-center justify-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4 md:w-5 md:h-5" />
              <span className="text-xs md:text-sm font-medium">다운로드</span>
            </Button> */}
            {/* <Button 
              onClick={downloadAllPages}
              disabled={!blueprintGenerated || blueprintImages.length === 0}
              className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 rounded-full w-16 h-16 md:w-20 md:h-20 p-2 md:p-3 flex flex-col items-center justify-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4 md:w-5 md:h-5" />
              <span className="text-xs md:text-sm font-medium">전체</span>
            </Button> */}
        <Button 
          onClick={() => {
            if (!user) {
              openLoginModal('share');
              return;
            }
            // 박스카 갤러리 공유 모달 열 때 자동으로 랜덤 제목 생성
            const generateFunTitle = (carType: string) => {
              const adjectives = {
                'sedan-type1': ['부릉부릉 너무 귀여운', '씽씽 달리는', '방긋 웃는', '깜찍발랄한', '콩콩 튀는'],
                'sedan-type2': ['든든하게 달리는', '똑똑하고 멋진', '반짝반짝 빛나는', '여유로운', '묵직하게 힘찬'],
                'sports': ['번쩍번쩍 멋있는', '쌩쌩 신나는', '슝슝 달려가는', '짜릿하게 질주하는', '번개처럼 빠른'],
                'suv': ['우당탕탕 용감한', '씩씩하게 달리는', '어디든 갈 수 있는', '힘센', '모험심 가득한'],
                'truck': ['든든하게 짐을 싣는', '빵빵 힘찬', '우직한', '무거운 것도 척척', '으랏차차 힘센'],
                'bus': ['즐겁게 달리는', '방긋 인사하는', '신나게 출발하는', '콩닥콩닥 두근거리는', '꽉 찬 웃음의'],
                'bus-square': ['네모네모 귀여운', '사각사각 멋진', '반듯반듯 착한', '네모난 세상', '네모로 즐거운']
              };
              
              const carTypeNames = {
                'sedan-type1': '꼬마세단',
                'sedan-type2': '큰세단', 
                'sports': '스포츠카',
                'suv': 'SUV',
                'truck': '빵빵트럭',
                'bus': '통통버스',
                'bus-square': '네모버스'
              };
              
              const typeAdjectives = adjectives[carType as keyof typeof adjectives] || adjectives['sedan-type1'];
              const typeName = carTypeNames[carType as keyof typeof carTypeNames] || '꼬마세단';
              
              const randomAdjective = typeAdjectives[Math.floor(Math.random() * typeAdjectives.length)];
              return `${randomAdjective} ${typeName}`;
            };

            const mapAnalyzedCarType = (analyzedType: string) => {
              const mapping: { [key: string]: string } = {
                'sedan': 'sedan-type1',
                'suv': 'suv',
                'truck': 'truck',
                'bus': 'bus',
                'sports': 'sports'
              };
              return mapping[analyzedType] || 'sedan-type1';
            };

            const carType = selectedCarType || drawingAnalysis?.analysis?.carType || 'sedan';
            const mappedCarType = mapAnalyzedCarType(carType);
            const funTitle = generateFunTitle(mappedCarType);
            setShareTitle(funTitle);
            setShowGalleryShareModal(true);
          }}
          disabled={!blueprintGenerated || blueprintImages.length === 0}
          className="bg-gradient-to-r from-sky-400 to-sky-500 hover:from-sky-500 hover:to-sky-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 rounded-3xl w-[74px] h-[74px] md:w-20 md:h-20 p-2 md:p-3 flex flex-col items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="text-center" style={{ lineHeight: '1.15' }}>
            <div className="font-medium" style={{ lineHeight: '1.15', fontSize: '14px' }}>갤러리</div>
            <div className="font-medium" style={{ lineHeight: '1.15', fontSize: '14px' }}>공유</div>
          </div>
        </Button>
            <Button 
              onClick={() => {
                if (!user) {
                  openLoginModal('download');
                  return;
                }
                downloadAllPagesAsPDF();
              }}
              disabled={!blueprintGenerated || blueprintImages.length === 0}
              className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 rounded-3xl w-[74px] h-[74px] md:w-20 md:h-20 p-2 md:p-3 flex flex-col items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="text-center" style={{ lineHeight: '1.15' }}>
                <div className="font-medium" style={{ lineHeight: '1.15', fontSize: '14px' }}>도안</div>
                <div className="font-medium" style={{ lineHeight: '1.15', fontSize: '14px' }}>다운로드</div>
              </div>
            </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <CommonBackground>
      <CommonHeader />
      <div className="max-w-7xl mx-auto px-0 md:px-8">
        {currentStep === 'draw' && renderDrawStep()}
        {currentStep === 'preview' && renderPreviewStep()}
        {currentStep === 'decorate' && renderDecorateStep()}
        {currentStep === 'export' && renderExportStep()}
      </div>

      {/* 스플래시 화면 */}
      {showSplashScreen && (
        <DrawSplashScreen
          onClose={handleCloseSplash}
          onSignUp={handleSignUpFromSplash}
        />
      )}

      {/* AI 알고리즘 설명 모달 - 제거됨 */}
      {false && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => {}}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-800">
                  🔎 Boxro Maker AI 알고리즘 소개
                </h3>
                <button
                  onClick={() => {}}
                  className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
                >
                  ×
                </button>
              </div>

              {/* AI 알고리즘 설명 내용 */}
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-800 mb-2">"내가 그린 그림이 어떻게 자동차로 분류될까?"</h4>
                  <p className="text-blue-700 text-sm">궁금했던 과정을 쉽고 투명하게 알려드립니다.</p>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-800 mb-2">1. 분석 과정</h4>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="bg-blue-100 px-2 py-1 rounded">1️⃣ 그림 불러오기</span>
                    <span>→</span>
                    <span className="bg-green-100 px-2 py-1 rounded">2️⃣ 특징 추출</span>
                    <span>→</span>
                    <span className="bg-yellow-100 px-2 py-1 rounded">3️⃣ 패턴 인식</span>
                    <span>→</span>
                    <span className="bg-purple-100 px-2 py-1 rounded">4️⃣ 차종 판별</span>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-800 mb-2">2. 분석 요소</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="bg-blue-50 p-2 rounded">
                      <strong>📏 비율 분석:</strong> 길이·높이, 앞/중간/뒤 비율
                    </div>
                    <div className="bg-green-50 p-2 rounded">
                      <strong>📐 각도 분석:</strong> 앞유리·뒷유리 기울기
                    </div>
                    <div className="bg-yellow-50 p-2 rounded">
                      <strong>🪟 창문 패턴:</strong> 개수, 크기, 배치, 모양
                    </div>
                    <div className="bg-purple-50 p-2 rounded">
                      <strong>🏗️ 차체 구조:</strong> 전체 실루엣, 뒷면 구조
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-800 mb-2">3. 차종 분류 로직</h4>
                  <div className="space-y-2">
                    <div className="bg-gray-50 p-3 rounded">
                      <strong>🎯 규칙 기반 판별:</strong>
                      <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                        <div>🏎️ 스포츠카: 낮은 차체, 긴 보닛</div>
                        <div>🚛 트럭: 높은 캐빈, 긴 적재 공간</div>
                        <div>🚌 버스: 높은 차체, 창문 많음</div>
                        <div>🚙 SUV: 높은 차체, 경사진 뒷유리</div>
                      </div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded text-sm">
                      <strong>🤖 머신러닝 보완:</strong> 9가지 핵심 특징을 수치화 → 학습된 모델과 비교 → 신뢰도 점수 제공
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-800 mb-2">4. 신뢰성</h4>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div className="bg-green-50 p-2 rounded text-center">
                      <div className="text-lg">✅</div>
                      <strong>정확도</strong><br/>95% 이상
                    </div>
                    <div className="bg-blue-50 p-2 rounded text-center">
                      <div className="text-lg">⚡</div>
                      <strong>속도</strong><br/>0.3초 이내
                    </div>
                    <div className="bg-purple-50 p-2 rounded text-center">
                      <div className="text-lg">🎯</div>
                      <strong>객관성</strong><br/>수치 기반
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-800 mb-2">5. 핵심 메시지</h4>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-2 text-sm">
                      <span className="bg-white px-2 py-1 rounded">✏️ 그림</span>
                      <span>→</span>
                      <span className="bg-white px-2 py-1 rounded">🤖 AI 분석</span>
                      <span>→</span>
                      <span className="bg-white px-2 py-1 rounded">🚗 차종 분류</span>
                    </div>
                    <p className="text-sm text-gray-700">
                      👉 "과학적이고 객관적인 분석으로 정확한 차종을 찾아드립니다!"
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* 박스카 갤러리 공유 모달 */}
      {showGalleryShareModal && (
        <div className="fixed inset-0 bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-pink-900/20 backdrop-blur-md z-50 flex items-center justify-center">
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-6 max-w-sm w-full mx-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                멋진 작품이네요!
              </h3>
              <p className="text-gray-900 mb-6" style={{fontSize: '14px'}}>
                박스카 갤러리에 공유할까요?
              </p>
            
              <div className="space-y-4">
                <div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={shareTitle}
                      onChange={(e) => {
                        if (e.target.value.length <= 30) {
                          setShareTitle(e.target.value);
                        }
                      }}
                      placeholder="작품 제목을 입력하세요"
                      maxLength={30}
                      className={`flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 text-[14px] ${
                        !shareTitle.trim() 
                          ? 'border-red-300 focus:ring-red-500' 
                          : 'border-gray-300 focus:ring-purple-500'
                      }`}
                    />
                    <button
                      onClick={() => {
                        // 동적 제목 생성 함수 (박스카 저장과 동일)
                        const generateFunTitle = (carType: string) => {
                          const adjectives = {
                            'sedan-type1': ['부릉부릉 너무 귀여운', '씽씽 달리는', '방긋 웃는', '깜찍발랄한', '콩콩 튀는'],
                            'sedan-type2': ['든든하게 달리는', '똑똑하고 멋진', '반짝반짝 빛나는', '여유로운', '묵직하게 힘찬'],
                            'sports': ['번쩍번쩍 멋있는', '쌩쌩 신나는', '슝슝 달려가는', '짜릿하게 질주하는', '번개처럼 빠른'],
                            'suv': ['우당탕탕 용감한', '씩씩하게 달리는', '어디든 갈 수 있는', '힘센', '모험심 가득한'],
                            'truck': ['든든하게 짐을 싣는', '빵빵 힘찬', '우직한', '무거운 것도 척척', '으랏차차 힘센'],
                            'bus': ['즐겁게 달리는', '방긋 인사하는', '신나게 출발하는', '콩닥콩닥 두근거리는', '꽉 찬 웃음의'],
                            'bus-square': ['네모네모 귀여운', '사각사각 멋진', '반듯반듯 착한', '네모난 세상', '네모로 즐거운']
                          };
                          
                          const carTypeNames = {
                            'sedan-type1': '꼬마세단',
                            'sedan-type2': '큰세단', 
                            'sports': '스포츠카',
                            'suv': 'SUV',
                            'truck': '빵빵트럭',
                            'bus': '통통버스',
                            'bus-square': '네모버스'
                          };
                          
                          const typeAdjectives = adjectives[carType as keyof typeof adjectives] || adjectives['sedan-type1'];
                          const typeName = carTypeNames[carType as keyof typeof carTypeNames] || '꼬마세단';
                          
                          const randomAdjective = typeAdjectives[Math.floor(Math.random() * typeAdjectives.length)];
                          return `${randomAdjective} ${typeName}`;
                        };

                        // 분석된 차종을 제목 생성용 차종으로 매핑
                        const mapAnalyzedCarType = (analyzedType: string) => {
                          const mapping: { [key: string]: string } = {
                            'sedan': 'sedan-type1',
                            'suv': 'suv',
                            'truck': 'truck',
                            'bus': 'bus',
                            'sports': 'sports'
                          };
                          return mapping[analyzedType] || 'sedan-type1';
                        };

                        const carType = selectedCarType || drawingAnalysis?.analysis?.carType || 'sedan';
                        const mappedCarType = mapAnalyzedCarType(carType);
                        const funTitle = generateFunTitle(mappedCarType);
                        setShareTitle(funTitle);
                      }}
                      className="px-4 py-2 bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200 transition-colors text-sm font-medium whitespace-nowrap min-w-[80px]"
                    >
                      랜덤
                    </button>
                  </div>
                  {!shareTitle.trim() && (
                    <p className="text-red-500 text-xs mt-1">제목을 입력하거나 랜덤 버튼을 눌러주세요</p>
                  )}
                  <p className="text-gray-900 mt-2" style={{fontSize: '13px'}}>
                    이 작품에 어울리는 이름을 지어보세요.<br />
                    랜덤 버튼으로 재밌게 바꿀 수도 있어요.
                  </p>
                </div>
                
              </div>
            
              <div className="flex gap-3 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setShowGalleryShareModal(false)}
                  className="flex-1 border-2 border-gray-200 hover:bg-gray-50 hover:border-gray-300 rounded-full text-gray-900"
                  style={{fontSize: '14px'}}
                >
                  취소
                </Button>
                <Button
                  onClick={shareToGallery}
                  disabled={!shareTitle.trim()}
                  className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-full"
                  style={{fontSize: '14px'}}
                >
                  공유하기
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 저장 확인 모달 */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-pink-900/20 backdrop-blur-md z-50 flex items-center justify-center">
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-6 max-w-sm w-full mx-6">
            <div className="text-center">
              <div className="text-[30px] mb-2">✨</div>
              <h3 className="text-lg font-semibold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                멋진 작품이네요!
              </h3>
              <p className="text-gray-600 text-sm mb-6">
                나만의 박스카에 저장할까요?
              </p>
            
              <div className="space-y-4">
                <div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={saveTitle}
                      onChange={(e) => {
                        if (e.target.value.length <= 30) {
                          setSaveTitle(e.target.value);
                        }
                      }}
                      placeholder="작품 제목을 입력하세요"
                      maxLength={30}
                      className={`flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 text-[14px] ${
                        !saveTitle.trim() 
                          ? 'border-red-300 focus:ring-red-500' 
                          : 'border-gray-300 focus:ring-purple-500'
                      }`}
                    />
                    <button
                      onClick={() => {
                        // 동적 제목 생성 함수 (박스카 저장과 동일)
                        const generateFunTitle = (carType: string) => {
                          const adjectives = {
                            'sedan-type1': ['부릉부릉 너무 귀여운', '씽씽 달리는', '방긋 웃는', '깜찍발랄한', '콩콩 튀는'],
                            'sedan-type2': ['든든하게 달리는', '똑똑하고 멋진', '반짝반짝 빛나는', '여유로운', '묵직하게 힘찬'],
                            'sports': ['번쩍번쩍 멋있는', '쌩쌩 신나는', '슝슝 달려가는', '짜릿하게 질주하는', '번개처럼 빠른'],
                            'suv': ['우당탕탕 용감한', '씩씩하게 달리는', '어디든 갈 수 있는', '힘센', '모험심 가득한'],
                            'truck': ['든든하게 짐을 싣는', '빵빵 힘찬', '우직한', '무거운 것도 척척', '으랏차차 힘센'],
                            'bus': ['즐겁게 달리는', '방긋 인사하는', '신나게 출발하는', '콩닥콩닥 두근거리는', '꽉 찬 웃음의'],
                            'bus-square': ['네모네모 귀여운', '사각사각 멋진', '반듯반듯 착한', '네모난 세상', '네모로 즐거운']
                          };
                          
                          const carTypeNames = {
                            'sedan-type1': '꼬마세단',
                            'sedan-type2': '큰세단', 
                            'sports': '스포츠카',
                            'suv': 'SUV',
                            'truck': '빵빵트럭',
                            'bus': '통통버스',
                            'bus-square': '네모버스'
                          };
                          
                          const typeAdjectives = adjectives[carType as keyof typeof adjectives] || adjectives['sedan-type1'];
                          const typeName = carTypeNames[carType as keyof typeof carTypeNames] || '꼬마세단';
                          
                          const randomAdjective = typeAdjectives[Math.floor(Math.random() * typeAdjectives.length)];
                          return `${randomAdjective} ${typeName}`;
                        };

                        // 분석된 차종을 제목 생성용 차종으로 매핑
                        const mapAnalyzedCarType = (analyzedType: string) => {
                          const mapping: { [key: string]: string } = {
                            'sedan': 'sedan-type1',
                            'suv': 'suv',
                            'truck': 'truck',
                            'bus': 'bus',
                            'sports': 'sports'
                          };
                          return mapping[analyzedType] || 'sedan-type1';
                        };

                        const carType = selectedCarType || drawingAnalysis?.analysis?.carType || 'sedan';
                        const mappedCarType = mapAnalyzedCarType(carType);
                        const funTitle = generateFunTitle(mappedCarType);
                        setSaveTitle(funTitle);
                      }}
                      className="px-3 py-2 bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200 transition-colors text-sm font-medium"
                    >
                      랜덤
                    </button>
                  </div>
                </div>
                
                <div>
                  <textarea
                    value={saveDescription}
                    onChange={(e) => {
                      if (e.target.value.length <= 20) {
                        setSaveDescription(e.target.value);
                      }
                    }}
                    placeholder="작품에 대한 설명을 입력하세요"
                    rows={2}
                    maxLength={20}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-[14px]"
                  />
                </div>
              </div>
            
              <div className="flex gap-3 mt-6">
                <Button
                  variant="outline"
                  onClick={handleCancelSave}
                  className="flex-1 border-2 border-gray-200 hover:bg-gray-50 hover:border-gray-300 rounded-full"
                >
                  취소
                </Button>
                <Button
                  onClick={handleConfirmSave}
                  disabled={!saveTitle.trim()}
                  className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-full"
                >
                  저장하기
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 박스카 갤러리 공유 성공 모달 */}
      {showGallerySuccessModal && (
        <div className="fixed inset-0 bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-pink-900/20 backdrop-blur-md z-50 flex items-center justify-center">
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-6 max-w-sm w-full mx-6">
            <div className="text-center">
              <div className="flex justify-center mb-2">
                <div className="text-[30px]">✨</div>
              </div>
              <h3 className="text-lg font-semibold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                성공적으로 공유되었습니다!
              </h3>
              <p className="text-gray-900 mb-7" style={{fontSize: '14px'}}>
                다른 사람들과 함께 멋진 작품을 나눠보세요
              </p>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowGallerySuccessModal(false)}
                  className="flex-1 border-2 border-gray-200 hover:bg-gray-50 hover:border-gray-300 rounded-full text-gray-900"
                  style={{fontSize: '14px'}}
                >
                  나중에
                </Button>
                <Button
                  onClick={() => {
                    setShowGallerySuccessModal(false);
                    router.push('/gallery');
                  }}
                  className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-full"
                  style={{fontSize: '14px'}}
                >
                  박스카 갤러리 보러가기
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 에러 모달 */}
      <ErrorModal
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        message={errorMessage || "예상치 못한 오류가 발생했습니다.\n페이지를 새로고침하거나 다시 시도해주세요."}
      />

      {/* 저장 성공 모달 */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-pink-900/20 backdrop-blur-md z-50 flex items-center justify-center">
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-6 max-w-sm w-full mx-6">
            <div className="text-center">
              <div className="text-2xl mb-4">✨</div>
              <h3 className="text-lg font-semibold bg-gradient-to-r from-blue-600 to-pink-600 bg-clip-text text-transparent mb-2">
                나만의 박스카에 성공적으로 저장되었습니다!
              </h3>
              <p className="text-gray-600 text-sm mb-7">
                이제 나만의 박스카에서 확인할 수 있어요
              </p>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowSuccessModal(false)}
                  className="flex-1 border-2 border-gray-200 hover:bg-gray-50 hover:border-gray-300"
                >
                  나중에
                </Button>
                <Button
                  onClick={() => {
                    setShowSuccessModal(false);
                    router.push('/my-designs');
                  }}
                  className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                >
                  나만의 박스카 보러가기
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
                    {loginModalType === 'share' && '✨'}
                    {loginModalType === 'download' && '📥'}
                  </div>
                </div>
                <h3 className="text-lg font-semibold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                  {loginModalType === 'share' && '지금 친구들에게 뽐내볼까요?'}
                  {loginModalType === 'download' && '내 박스카를 지금 만들고 싶나요?'}
                </h3>
                <p className="text-gray-600 text-sm mb-6">
                  {loginModalType === 'share' && '내 박스카를 공유하려면 로그인해보세요!'}
                  {loginModalType === 'download' && '도안을 내려받으려면 로그인해주세요!'}
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
    </CommonBackground>
  );
}

