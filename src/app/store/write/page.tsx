"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ErrorModal from "@/components/ErrorModal";
import RichTextEditor from "@/components/RichTextEditor";
import { 
  ArrowLeft,
  Save,
  ShoppingBag,
  X
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useStory } from "@/contexts/StoryContext";
import CommonHeader from "@/components/CommonHeader";
import CommonBackground from "@/components/CommonBackground";

export default function WriteStoryPage() {
  const { user } = useAuth();
  const { setArticles } = useStory();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [summary, setSummary] = useState("");
  const [price, setPrice] = useState("");
  const [isFullDonation, setIsFullDonation] = useState(false);
  const [storeUrl, setStoreUrl] = useState("");
  const [thumbnail, setThumbnail] = useState("");
  const [isPublished, setIsPublished] = useState(false);
  const [showOnHome, setShowOnHome] = useState(false);
  
  // 안내 메시지 모달 상태
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [infoMessage, setInfoMessage] = useState('');
  
  // 성공 메시지 모달 상태
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  const [cardTitle, setCardTitle] = useState("");
  const [cardDescription, setCardDescription] = useState("");
  const [cardThumbnail, setCardThumbnail] = useState("");
  const [cardTitleColor, setCardTitleColor] = useState("#ffffff");
  const [cardDescriptionColor, setCardDescriptionColor] = useState("#ffffff");
  const [titleColor, setTitleColor] = useState("#000000");
  const [summaryColor, setSummaryColor] = useState("#000000");
  const [priceColor, setPriceColor] = useState("#fa2c37");
  const [cardBackgroundColor, setCardBackgroundColor] = useState("#ffffff");
  const [homeCardBackgroundColor, setHomeCardBackgroundColor] = useState("#3b82f6");
  const [cardTextPosition, setCardTextPosition] = useState(4); // 0-75, 기본값 4 (하단)
  const [viewTopImage, setViewTopImage] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  
  // 오류 모달 상태
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // 뷰 상단 이미지 압축 함수 (800px, 80%)
  const compressViewTopImage = (file: File, maxWidth: number = 800, quality: number = 0.8): Promise<string> => {
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
        // 800px로 강제 리사이즈 (가로 기준)
        const maxWidth = 800;
        const ratio = maxWidth / img.width;
        canvas.width = maxWidth;
        canvas.height = img.height * ratio;
        
        // 이미지 그리기
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        // 투명도가 있는 이미지인지 확인
        const imageData = ctx?.getImageData(0, 0, canvas.width, canvas.height);
        const hasTransparency = imageData?.data.some((_, index) => index % 4 === 3 && imageData.data[index] < 255);
        
        // 투명도가 있으면 PNG, 없으면 JPG 사용 (고품질)
        const format = hasTransparency ? 'image/png' : 'image/jpeg';
        let startQuality = hasTransparency ? 0.8 : 0.8; // 80% 품질
        
        // 파일 크기가 800KB 이하가 될 때까지 품질을 낮춤 (제한 완화)
        const compressImageRecursive = (currentQuality: number): string => {
          const dataUrl = canvas.toDataURL(format, currentQuality);
          const sizeKB = dataUrl.length / 1024;
          
          console.log(`뷰상단 압축 시도: 품질 ${currentQuality.toFixed(1)}, 크기 ${sizeKB.toFixed(1)}KB`);
          
          // 크기가 여전히 800KB보다 크고 품질을 더 낮출 수 있다면 재귀 호출
          if (sizeKB > 800 && currentQuality > 0.1) {
            return compressImageRecursive(currentQuality - 0.05);
          }
          
          console.log(`뷰상단 최종 압축: 품질 ${currentQuality.toFixed(1)}, 크기 ${sizeKB.toFixed(1)}KB`);
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

  // 이미지 리사이즈 함수 (투명도 감지)
  const resizeImage = (file: File, maxWidth: number = 800): Promise<string> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        let { width, height } = img;
        
        // 가로가 maxWidth보다 큰 경우에만 리사이즈
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        ctx?.drawImage(img, 0, 0, width, height);
        
        // 투명도가 있는 이미지인지 확인
        const imageData = ctx?.getImageData(0, 0, width, height);
        const hasTransparency = imageData?.data.some((_, index) => index % 4 === 3 && imageData.data[index] < 255);
        
        // 투명도가 있으면 PNG, 없으면 JPG 사용 (강력한 압축)
        const format = hasTransparency ? 'image/png' : 'image/jpeg';
        let quality = hasTransparency ? 0.6 : 0.5; // 더 강력한 압축
        
        // 파일 크기가 500KB 이하가 될 때까지 품질을 낮춤
        const compressImage = (currentQuality: number): string => {
          const dataUrl = canvas.toDataURL(format, currentQuality);
          const sizeKB = (dataUrl.length * 0.75) / 1024; // base64 크기를 KB로 변환
          
          if (sizeKB > 500 && currentQuality > 0.1) {
            return compressImage(currentQuality - 0.1);
          }
          
          return dataUrl;
        };
        
        resolve(compressImage(quality));
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  // 에디터용 이미지 압축 함수 (500px, 80%)
  const compressEditorImage = (file: File, maxWidth: number = 500, quality: number = 0.8): Promise<string> => {
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
        // 500px로 강제 리사이즈 (가로 기준)
        const maxWidth = 500;
        const ratio = maxWidth / img.width;
        canvas.width = maxWidth;
        canvas.height = img.height * ratio;
        
        // 이미지 그리기
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        // 투명도가 있는 이미지인지 확인
        const imageData = ctx?.getImageData(0, 0, canvas.width, canvas.height);
        const hasTransparency = imageData?.data.some((_, index) => index % 4 === 3 && imageData.data[index] < 255);
        
        // 투명도가 있으면 PNG, 없으면 JPG 사용 (고품질)
        const format = hasTransparency ? 'image/png' : 'image/jpeg';
        let startQuality = hasTransparency ? 0.8 : 0.8; // 80% 품질
        
        // 파일 크기가 300KB 이하가 될 때까지 품질을 낮춤
        const compressImageRecursive = (currentQuality: number): string => {
          const dataUrl = canvas.toDataURL(format, currentQuality);
          const sizeKB = dataUrl.length / 1024;
          
          console.log(`에디터 압축 시도: 품질 ${currentQuality.toFixed(1)}, 크기 ${sizeKB.toFixed(1)}KB`);
          
          // 크기가 여전히 300KB보다 크고 품질을 더 낮출 수 있다면 재귀 호출
          if (sizeKB > 300 && currentQuality > 0.05) {
            return compressImageRecursive(currentQuality - 0.05);
          }
          
          console.log(`에디터 최종 압축: 품질 ${currentQuality.toFixed(1)}, 크기 ${sizeKB.toFixed(1)}KB`);
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

  // 에디터용 이미지 업로드 함수
  const handleEditorImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setErrorMessage('이미지 파일만 업로드할 수 있습니다.');
        setShowErrorModal(true);
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setErrorMessage('이미지 크기는 5MB 이하여야 합니다.');
        setShowErrorModal(true);
        return;
      }

      try {
        const compressedImage = await compressEditorImage(file, 500, 0.8);
        setUploadedImages(prev => [...prev, compressedImage]);
      } catch (error) {
        console.error('이미지 압축 실패:', error);
        setErrorMessage('이미지 처리 중 오류가 발생했습니다.');
        setShowErrorModal(true);
      }
    }
  };

  // 이미지 삭제 함수
  const removeEditorImage = (index: number) => {
    const imageToRemove = uploadedImages[index];
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
    
    // 에디터에서도 해당 이미지 제거
    if (imageToRemove && content.includes(imageToRemove)) {
      // 정규표현식 대신 문자열 치환 사용
      const updatedContent = content.replace(`src="${imageToRemove}"`, 'src=""');
      setContent(updatedContent);
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
    if (!user) {
      router.push('/login');
      return;
    }
    
    if (!adminEmails.includes(user.email || "")) {
      setErrorMessage('박스로 스토어 도안 작성 권한이 없습니다.');
      setShowErrorModal(true);
      router.push('/store');
      return;
    }
  }, [user, router]);

  // 이미지 업로드 처리
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        // 이미지 압축 (최대 800px, 품질 80%)
        const compressedImage = await compressImage(file, 800, 0.8);
        setThumbnail(compressedImage);
      } catch (error) {
        console.error('이미지 압축 실패:', error);
        setErrorMessage('이미지 업로드 중 오류가 발생했습니다.');
        setShowErrorModal(true);
      }
    }
  };

  // 뷰 상단 이미지 업로드 처리
  const handleViewTopImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        // 이미지 압축 (800px, 80% 품질)
        const compressedImage = await compressViewTopImage(file, 800, 0.8);
        setViewTopImage(compressedImage);
      } catch (error) {
        console.error('이미지 압축 실패:', error);
        setErrorMessage('이미지 업로드 중 오류가 발생했습니다.');
        setShowErrorModal(true);
      }
    }
  };

  // 이미지 압축 함수 (투명도 감지)
  const compressImage = (file: File, maxWidth: number = 800, quality: number = 0.8): Promise<string> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
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
        
        // 투명도가 있으면 PNG, 없으면 JPG 사용 (강력한 압축)
        const format = hasTransparency ? 'image/png' : 'image/jpeg';
        let startQuality = hasTransparency ? 0.6 : 0.5; // 더 강력한 압축
        
        // 파일 크기가 500KB 이하가 될 때까지 품질을 낮춤
        const compressImageRecursive = (currentQuality: number): string => {
          const dataUrl = canvas.toDataURL(format, currentQuality);
          const sizeKB = dataUrl.length / 1024;
          
          console.log(`압축 시도: 품질 ${currentQuality.toFixed(1)}, 크기 ${sizeKB.toFixed(1)}KB`);
          
          if (sizeKB > 500 && currentQuality > 0.05) {
            return compressImageRecursive(currentQuality - 0.05);
          }
          
          console.log(`최종 압축: 품질 ${currentQuality.toFixed(1)}, 크기 ${sizeKB.toFixed(1)}KB`);
          return dataUrl;
        };
        
        resolve(compressImageRecursive(startQuality));
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  // 카드 썸네일 업로드 처리
  const handleCardThumbnailUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        // 이미지 압축 (최대 800px, 품질 80%)
        const compressedImage = await compressImage(file, 800, 0.8);
        setCardThumbnail(compressedImage);
      } catch (error) {
        console.error('이미지 압축 실패:', error);
        setErrorMessage('이미지 업로드 중 오류가 발생했습니다.');
        setShowErrorModal(true);
      }
    }
  };

  // 태그 배열로 변환

  // 글 저장
  const saveArticle = async () => {
    if (!user) return;
    
    if (!title.trim()) {
      setInfoMessage('제목을 입력해주세요.');
      setShowInfoModal(true);
      return;
    }
    
    // content는 선택사항이므로 validation 제거
    
    // summary는 선택사항이므로 validation 제거

    // 홈카드 정보 유효성 검사
    if (showOnHome) {
      if (!cardTitle.trim() || !cardDescription.trim() || !cardThumbnail) {
        setInfoMessage('홈카드에 노출하려면 제목, 설명, 썸네일을 모두 입력해주세요.');
        setShowInfoModal(true);
        return;
      }
    }

    try {
      setSaving(true);
      
      // Firebase에 박스카 이야기 저장
      const { collection, addDoc, serverTimestamp, doc, getDoc } = await import("firebase/firestore");
      const { db } = await import("@/lib/firebase");
      
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
      
      const articleData = {
        title: title.trim(),
        content: content.trim() || '',
        summary: summary.trim() || '',
        price: price.trim() || '',
        storeUrl: storeUrl.trim() || '',
        author: user.displayName || (user.email ? user.email.split('@')[0] : 'Anonymous'),
        authorNickname: userNickname,
        authorEmail: user.email || '',
        showOnHome: showOnHome,
        cardTitle: cardTitle.trim() || '',
        cardDescription: cardDescription.trim() || '',
        cardThumbnail: cardThumbnail || '',
        cardTitleColor: cardTitleColor,
        cardDescriptionColor: cardDescriptionColor,
        titleColor: titleColor,
        summaryColor: summaryColor,
        priceColor: priceColor,
        isFullDonation: isFullDonation,
        cardBackgroundColor: cardBackgroundColor,
        homeCardBackgroundColor: homeCardBackgroundColor,
        textPosition: cardTextPosition,
        viewTopImage: viewTopImage,
        authorId: user.uid,
        thumbnail: thumbnail,
        tags: [],
        views: 0,
        likes: 0,
        shares: 0,
        boxroTalks: 0,
        isPublished: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      console.log('Firebase에 저장할 박스카 이야기 데이터:', articleData);
      
      // Firebase에 저장
      const docRef = await addDoc(collection(db, 'storeItems'), articleData);
      console.log('스토어 아이템 저장 완료, ID:', docRef.id);
      
      // 홈 카드로 노출하는 경우 homeCards 컬렉션에도 저장 (홈카드 정보가 완전할 때만)
      if (showOnHome && cardTitle.trim() && cardDescription.trim() && cardThumbnail) {
        const homeCardData = {
          source: 'storeItems',
          sourceId: docRef.id,
          cardTitle: cardTitle.trim() || '',
          cardDescription: cardDescription.trim() || '',
          cardThumbnail: cardThumbnail || '',
          cardTitleColor: cardTitleColor,
          cardDescriptionColor: cardDescriptionColor,
          cardBackgroundColor: cardBackgroundColor,
          textPosition: cardTextPosition,
          isVisible: true,
          order: 0, // 기본 순서
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };
        
        await addDoc(collection(db, 'homeCards'), homeCardData);
        console.log('홈 카드 저장 완료');
      }
      
      setSuccessMessage('도안이 성공적으로 등록되었습니다!');
      setShowSuccessModal(true);
      
    } catch (error) {
      console.error('저장 실패:', error);
      setErrorMessage('저장 중 오류가 발생했습니다.');
      setShowErrorModal(true);
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <CommonBackground className="flex items-center justify-center">
        <div className="text-center">
          <p className="text-white">로그인이 필요합니다.</p>
          <Link href="/auth">
            <Button className="mt-4">로그인하기</Button>
          </Link>
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
          <Card className="bg-white/95 backdrop-blur-sm border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden py-5 w-full rounded-2xl">
          <CardHeader>
            <CardTitle className="text-[18px]">새 도안 등록</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 기본 정보 박스 */}
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
              <h3 className="font-medium text-gray-800 mb-4" style={{ fontSize: '16px' }}>
                기본 정보
              </h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* 입력 폼 */}
                <div className="space-y-4">
                {/* 제목 */}
                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-2">
                    도안 제목
                  </label>
                  <div className="bg-transparent p-4 rounded-lg border border-gray-300">
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="도안 카드에 표시될 제목"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-[14px] mb-3 bg-white"
                    />
                    <div className="flex gap-2">
                      <input 
                        type="color" 
                        value={titleColor}
                        onChange={(e) => setTitleColor(e.target.value)}
                        className="w-12 h-10 border-0 rounded-md cursor-pointer"
                      />
                      <input 
                        type="text" 
                        value={titleColor}
                        onChange={(e) => setTitleColor(e.target.value)}
                        placeholder="#000000"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-[14px] bg-white"
                      />
                    </div>
                  </div>
                </div>

                {/* 요약 */}
                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-2">
                    도안 설명
                  </label>
                  <div className="bg-transparent p-4 rounded-lg border border-gray-300">
                    <textarea
                      value={summary}
                      onChange={(e) => setSummary(e.target.value)}
                      placeholder="도안 카드에 표시될 설명"
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-[14px] mb-2 bg-white"
                    />
                    <div className="flex gap-2">
                      <input 
                        type="color" 
                        value={summaryColor}
                        onChange={(e) => setSummaryColor(e.target.value)}
                        className="w-12 h-10 border-0 rounded-md cursor-pointer"
                      />
                      <input 
                        type="text" 
                        value={summaryColor}
                        onChange={(e) => setSummaryColor(e.target.value)}
                        placeholder="#000000"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-[14px] bg-white"
                      />
                    </div>
                  </div>
                </div>

                {/* 가격 */}
                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-2">
                    도안 가격
                  </label>
                  <div className="bg-transparent p-4 rounded-lg border border-gray-300">
                    <input
                      type="text"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="도안 가격을 입력하세요 (예: 5,000원)"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-[14px] mb-3 bg-white"
                    />
                    <div className="flex gap-2">
                      <input 
                        type="color" 
                        value={priceColor}
                        onChange={(e) => setPriceColor(e.target.value)}
                        className="w-12 h-10 border-0 rounded-md cursor-pointer"
                      />
                      <input 
                        type="text" 
                        value={priceColor}
                        onChange={(e) => setPriceColor(e.target.value)}
                        placeholder="#000000"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-[14px] bg-white"
                      />
                    </div>
                    
                    {/* 수익금 전액 기부 체크박스 */}
                    <div className="mt-3">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isFullDonation}
                          onChange={(e) => setIsFullDonation(e.target.checked)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">수익금 전액 기부</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* 스토어 URL */}
                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-2">
                    스토어 바로가기 URL
                  </label>
                  <div className="bg-transparent p-4 rounded-lg border border-gray-300">
                    <input
                      type="url"
                      value={storeUrl}
                      onChange={(e) => setStoreUrl(e.target.value)}
                      placeholder="스토어 바로가기 URL을 입력하세요 (예: https://boxro.crafts)"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-[14px] bg-white"
                    />
                  </div>
                </div>

                {/* 썸네일 */}
                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-2">
                    도안 썸네일 (카드 이미지)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-[14px] bg-white"
                    />
                    {thumbnail && (
                      <button
                        type="button"
                        onClick={() => {
                          console.log('썸네일 삭제 전:', thumbnail);
                          setThumbnail('');
                          console.log('썸네일 삭제 후:', '');
                        }}
                        className="px-3 py-2 bg-sky-500 hover:bg-sky-600 text-white text-sm rounded-md transition-colors whitespace-nowrap flex-shrink-0"
                      >
                        삭제
                      </button>
                    )}
                  </div>
                </div>

                {/* 이야기 목록 카드 색상 */}
                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-2">
                    도안 배경 색상
                  </label>
                  <div className="bg-transparent p-4 rounded-lg border border-gray-300">
                    <div className="flex gap-2">
                      <input 
                        type="color" 
                        value={cardBackgroundColor}
                        onChange={(e) => setCardBackgroundColor(e.target.value)}
                        className="w-12 h-10 border-0 rounded-md cursor-pointer"
                      />
                      <input 
                        type="text" 
                        value={cardBackgroundColor}
                        onChange={(e) => setCardBackgroundColor(e.target.value)}
                        placeholder="#ffffff"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-[14px] bg-white"
                      />
                    </div>
                  </div>
                </div>

                </div>

                {/* 미리보기 */}
                <div className="flex justify-center">
                  <div 
                    className="group shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden w-[325px] rounded-2xl relative"
                    style={{ backgroundColor: cardBackgroundColor || 'rgba(255, 255, 255, 0.97)' }}
                  >
                    {/* 썸네일 */}
                    {thumbnail && (
                      <div className="w-full overflow-hidden">
                        <img 
                          src={thumbnail} 
                          alt={title || "박스카 이야기"}
                          className="w-full h-auto object-contain transition-transform duration-300 group-hover:scale-[1.03]"
                        />
                      </div>
                    )}
                    
                    {/* 제목과 요약 */}
                    <div className="px-7 py-4">
                      <h4 
                        className="text-lg font-semibold mb-4 mt-2"
                        style={{ 
                          color: titleColor,
                          display: '-webkit-box',
                          WebkitLineClamp: 1,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          lineHeight: '1.4',
                          maxHeight: '1.4em'
                        }}
                      >
                        {(() => {
                          const text = title || "제목을 입력하세요";
                          if (text.length > 20) {
                            // UTF-8 안전한 문자열 자르기
                            const truncated = Array.from(text).slice(0, 20).join('');
                            return `${truncated}...`;
                          }
                          return text;
                        })()}
                      </h4>
                      {summary && (
                        <p 
                          className="text-sm mb-3 whitespace-pre-wrap"
                          style={{ color: summaryColor }}
                        >
                          {summary}
                        </p>
                      )}
                      {price && (
                        <div className="mb-3">
                          <p 
                            className="text-lg font-semibold"
                            style={{ color: priceColor }}
                          >
                            {price}
                          </p>
                          {isFullDonation && (
                            <div 
                              className="inline-block px-3 py-1 rounded-full text-white text-sm font-medium mt-2"
                              style={{ backgroundColor: priceColor || '#1f2937' }}
                            >
                              수익금 전액 기부
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 뷰 상단 이미지 */}
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
              <h3 className="font-medium text-gray-800 mb-4" style={{ fontSize: '16px' }}>
                뷰 상단 이미지
              </h3>
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-2">
                  뷰 상단 이미지
                </label>
                <div className="bg-transparent p-4 rounded-lg border border-gray-300">
                  <div className="flex gap-2 mb-3">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleViewTopImageUpload}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-[14px] bg-white"
                    />
                    {viewTopImage && (
                      <button
                        type="button"
                        onClick={() => {
                          console.log('뷰 상단 이미지 삭제 전:', viewTopImage);
                          setViewTopImage('');
                          console.log('뷰 상단 이미지 삭제 후:', '');
                        }}
                        className="px-3 py-2 bg-sky-500 hover:bg-sky-600 text-white text-sm rounded-md transition-colors whitespace-nowrap flex-shrink-0"
                      >
                        삭제
                      </button>
                    )}
                  </div>
                  {viewTopImage && (
                    <div className="mt-3">
                      <img
                        src={viewTopImage}
                        alt="뷰 상단 이미지 미리보기"
                        className="w-full h-auto max-h-64 object-contain rounded-lg border border-gray-200"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 내용 */}
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
              <h3 className="font-medium text-gray-800 mb-4" style={{ fontSize: '16px' }}>
                내용
              </h3>
              
              {/* 이미지 업로더 */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-800 mb-3">이미지 업로드</label>
                <div className="p-4 bg-white rounded-lg border border-gray-200">
                <div className="flex flex-col gap-4">
                  {/* 파일 선택 버튼과 업로드된 이미지들을 같은 줄에 배치 */}
                  <div className="flex items-start gap-4 w-full">
                    {/* 파일 선택 버튼 */}
                    <div className="flex-shrink-0">
                      <label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleEditorImageUpload}
                          className="hidden"
                          id="image-upload"
                        />
                        <div className="w-20 h-20 bg-blue-50 hover:bg-blue-100 border-2 border-blue-300 rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors">
                          <div className="text-blue-600 text-2xl mb-1">📷</div>
                          <div className="text-blue-700 text-xs font-medium">선택</div>
                        </div>
                      </label>
                    </div>
                    
                    {/* 업로드된 이미지들 - 가로 정렬 */}
                    {uploadedImages.length > 0 && (
                      <div className="flex gap-3 overflow-x-auto pb-2 w-full">
                        {uploadedImages.map((image, index) => (
                          <div key={index} className="flex items-center gap-2 flex-shrink-0">
                            <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                              <img 
                                src={image} 
                                alt={`업로드된 이미지 ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="flex flex-col gap-1">
                              <button
                                type="button"
                                onClick={async () => {
                                  try {
                                    if (navigator.clipboard && navigator.clipboard.writeText) {
                                      await navigator.clipboard.writeText(image);
                                      alert('이미지 URL이 클립보드에 복사되었습니다!');
                                    } else {
                                      // 클립보드 API를 사용할 수 없는 경우
                                      const textArea = document.createElement('textarea');
                                      textArea.value = image;
                                      document.body.appendChild(textArea);
                                      textArea.select();
                                      document.execCommand('copy');
                                      document.body.removeChild(textArea);
                                      alert('이미지 URL이 클립보드에 복사되었습니다!');
                                    }
                                  } catch (error) {
                                    console.error('클립보드 복사 실패:', error);
                                    alert('복사에 실패했습니다. 다시 시도해주세요.');
                                  }
                                }}
                                className="px-2 py-1 bg-green-500 hover:bg-green-600 text-white text-xs rounded transition-colors"
                              >
                                복사
                              </button>
                              <button
                                type="button"
                                onClick={() => removeEditorImage(index)}
                                className="px-2 py-1 bg-orange-500 hover:bg-orange-600 text-white text-xs rounded transition-colors"
                              >
                                삭제
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <p className="text-xs text-gray-500 text-center">이미지를 업로드한 후 URL을 복사하여 에디터에 붙여넣으세요.</p>
                </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-800 mb-2">
                  에디터
                </label>
                <RichTextEditor
                  content={content}
                  onChange={setContent}
                  placeholder="박스카 이야기의 본문을 작성하세요..."
                />
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <div className="text-sm text-blue-800">
                    <div className="space-y-1 text-xs">
                      <p>• <span className="font-bold">H1</span>: CookieRun, 20px (제목)</p>
                      <p>• <span className="font-bold">H2</span>: CookieRun, 18px (부제목)</p>
                      <p>• <span className="font-bold">H3</span>: Inter, 16px (소제목)</p>
                      <p>• <span className="font-bold">기본글꼴</span>: Inter, 14px (본문)</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 홈 카드 노출 옵션 */}
            <div className="pt-6">
              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <div className="mb-4">
                  <h3 className="font-medium text-gray-800 mb-4" style={{ fontSize: '16px' }}>
                    홈 카드 정보
                  </h3>
                  
                  {/* 홈카드 노출 토글 스위치 */}
                  <div className="flex items-center justify-between mb-6">
                    <label className="text-sm font-medium text-gray-700">
                      홈카드에 노출하기
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowOnHome(!showOnHome)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        showOnHome ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          showOnHome ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* 홈카드 정보 입력 필드들 - 토글이 켜졌을 때만 활성화 */}
                {showOnHome && (
                  <div className="space-y-4 p-4 bg-blue-50 rounded-lg">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* 입력 폼 */}
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-800 mb-2">
                            홈카드 제목
                          </label>
                          <div className="bg-transparent p-4 rounded-lg border border-gray-300">
                            <input 
                              type="text" 
                              value={cardTitle}
                              onChange={(e) => setCardTitle(e.target.value)}
                              placeholder="홈 카드에 표시될 제목을 입력하세요"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-[14px] mb-3 bg-white"
                              required={showOnHome}
                            />
                            <div className="flex gap-2">
                              <input 
                                type="color" 
                                value={cardTitleColor}
                                onChange={(e) => setCardTitleColor(e.target.value)}
                                className="w-12 h-10 border-0 rounded-md cursor-pointer"
                              />
                              <input 
                                type="text" 
                                value={cardTitleColor}
                                onChange={(e) => setCardTitleColor(e.target.value)}
                                placeholder="#ffffff"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-[14px] bg-white"
                              />
                            </div>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-800 mb-2">
                            홈카드 설명
                          </label>
                          <div className="bg-transparent p-4 rounded-lg border border-gray-300">
                            <textarea 
                              value={cardDescription}
                              onChange={(e) => setCardDescription(e.target.value)}
                              placeholder="홈 카드에 표시될 설명을 입력하세요"
                              rows={3}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-[14px] mb-2 bg-white"
                              required={showOnHome}
                            />
                            <div className="flex gap-2">
                              <input 
                                type="color" 
                                value={cardDescriptionColor}
                                onChange={(e) => setCardDescriptionColor(e.target.value)}
                                className="w-12 h-10 border-0 rounded-md cursor-pointer"
                              />
                              <input 
                                type="text" 
                                value={cardDescriptionColor}
                                onChange={(e) => setCardDescriptionColor(e.target.value)}
                                placeholder="#ffffff"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-[14px] bg-white"
                              />
                            </div>
                          </div>
                        </div>
                        
                        {/* 텍스트 위치 조절 */}
                        <div>
                          <label className="block text-sm font-medium text-gray-800 mb-2">텍스트 위치</label>
                          <div className="bg-transparent p-4 rounded-lg border border-gray-300">
                            <div className="flex items-center gap-3">
                              <span className="text-sm text-gray-600 w-12">위</span>
                              <input
                                type="range"
                                min="0"
                                max="75"
                                value={cardTextPosition}
                                onChange={(e) => setCardTextPosition(Number(e.target.value))}
                                className="flex-1 h-2 appearance-none cursor-pointer"
                                style={{
                                  background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(cardTextPosition / 75) * 100}%, #e5e7eb ${(cardTextPosition / 75) * 100}%, #e5e7eb 100%)`,
                                  borderRadius: '8px'
                                }}
                              />
                              <span className="text-sm text-gray-600 w-12">아래</span>
                            </div>
                            <div className="text-center mt-2">
                              <span className="text-xs text-gray-500">{cardTextPosition}%</span>
                            </div>
                          </div>
                        </div>
                        
                        {/* 홈카드 배경 색상 */}
                        <div className="mt-6">
                          <label className="block text-sm font-medium text-gray-700 mb-2">홈카드 배경 색상</label>
                          <div className="bg-transparent p-4 rounded-lg border border-gray-300">
                            <div className="flex gap-2">
                              <input 
                                type="color" 
                                value={homeCardBackgroundColor || '#3b82f6'}
                                onChange={(e) => setHomeCardBackgroundColor(e.target.value)}
                                className="w-[58px] h-10 border-0 rounded-md cursor-pointer"
                              />
                              <input 
                                type="text" 
                                value={homeCardBackgroundColor || '#3b82f6'}
                                onChange={(e) => setHomeCardBackgroundColor(e.target.value)}
                                placeholder="#3b82f6"
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-[14px] bg-white"
                              />
                              <button
                                type="button"
                                onClick={() => setHomeCardBackgroundColor('transparent')}
                                className={`px-3 py-2 text-sm rounded-md border flex-shrink-0 ${
                                  homeCardBackgroundColor === 'transparent' 
                                    ? 'bg-blue-100 border-blue-300 text-blue-700' 
                                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                                }`}
                              >
                                투명
                              </button>
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-800 mb-2">
                            홈카드 썸네일 (홈카드 배경 이미지)
                          </label>
                          <div className="flex gap-2">
                            <input 
                              type="file" 
                              accept="image/*"
                              onChange={handleCardThumbnailUpload}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-[14px] bg-white"
                              required={showOnHome}
                            />
                            {cardThumbnail && (
                              <button
                                type="button"
                                onClick={() => {
                                  console.log('카드 썸네일 삭제 전:', cardThumbnail);
                                  setCardThumbnail('');
                                  console.log('카드 썸네일 삭제 후:', '');
                                }}
                                className="px-3 py-2 bg-sky-500 hover:bg-sky-600 text-white text-sm rounded-md transition-colors"
                              >
                                삭제
                              </button>
                            )}
                          </div>
                        </div>
                  </div>

                  {/* 미리보기 */}
                  <div className="flex justify-center">
                    <Card className="group hover:shadow-xl transition-all duration-300 border-0 border-green-300/50 shadow-2xl break-inside-avoid mb-4 relative overflow-hidden bg-transparent w-[325px] h-[480px] flex flex-col justify-end cursor-pointer">
                      {/* 배경 이미지 */}
                      <div className="absolute inset-0 overflow-hidden">
                        {cardThumbnail ? (
                          <img
                            src={cardThumbnail}
                            alt="홈카드 배경"
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                          />
                        ) : (
                          <div 
                            className="w-full h-full"
                            style={{ 
                              backgroundColor: homeCardBackgroundColor === 'transparent' ? 'transparent' : homeCardBackgroundColor,
                              background: homeCardBackgroundColor === 'transparent' ? 'transparent' : `linear-gradient(135deg, ${homeCardBackgroundColor} 0%, ${homeCardBackgroundColor} 100%)`
                            }}
                          />
                        )}
                      </div>
                      <CardHeader 
                        className="text-center pt-1 pb-2 relative z-10"
                        style={{
                          position: 'absolute',
                          bottom: `${cardTextPosition}%`,
                          left: '50%',
                          transform: 'translateX(-50%)',
                          width: '100%'
                        }}
                      >
                        <CardTitle className="text-[24px] font-bold mb-1 font-cookie-run" style={{ color: cardTitleColor }}>
                          {cardTitle || "카드 제목"}
                        </CardTitle>
                        <p className="leading-relaxed" style={{ fontSize: '14px', whiteSpace: 'pre-line', color: cardDescriptionColor }}>
                          {cardDescription || "카드 설명이 여기에 표시됩니다.\n최대 2줄까지 권장됩니다."}
                        </p>
                      </CardHeader>
                    </Card>
                  </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

          </CardContent>
        </Card>

        {/* 버튼들 - 카드 밖에 위치 */}
        <div className="mt-6 px-4 md:px-0">
          <div className="flex justify-between items-center">
            <Link href="/store">
              <Button 
                className="bg-pink-500 hover:bg-pink-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 rounded-full w-[74px] h-[74px] md:w-20 md:h-20 p-2 md:p-3 flex flex-col items-center justify-center gap-1"
              >
                <ArrowLeft className="w-4 h-4 md:w-5 md:h-5" />
                <span className="font-medium" style={{fontSize: '14px'}}>목록으로</span>
              </Button>
            </Link>
            <div className="flex gap-3">
              <Button 
                onClick={saveArticle}
                disabled={saving}
                className="bg-sky-500 hover:bg-sky-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 rounded-full w-[74px] h-[74px] md:w-20 md:h-20 p-2 md:p-3 flex flex-col items-center justify-center gap-1"
              >
                <ShoppingBag className="w-4 h-4 md:w-5 md:h-5" />
                <span className="font-medium" style={{fontSize: '14px'}}>도안등록</span>
              </Button>
            </div>
          </div>
        </div>
        </div>
      </div>

      {/* 오류 모달 */}
      <ErrorModal
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        message={errorMessage}
      />

      {/* 성공 메시지 모달 */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-gradient-to-br from-green-900/20 via-blue-900/20 to-purple-900/20 backdrop-blur-md z-50 flex items-center justify-center">
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-6 max-w-sm w-full mx-6">
            <div className="text-center">
              <h3 className="text-[18px] font-semibold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-2">
                복사 완료
              </h3>
              <p className="text-gray-600 text-[14px] mb-4">
                {successMessage}
              </p>
              <Button
                onClick={() => setShowSuccessModal(false)}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white transition-all duration-200 rounded-full text-[14px]"
              >
                확인
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 안내 메시지 모달 */}
      {showInfoModal && (
        <div className="fixed inset-0 bg-gradient-to-br from-green-900/20 via-blue-900/20 to-purple-900/20 backdrop-blur-md z-50 flex items-center justify-center">
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-6 max-w-sm w-full mx-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                입력 안내
              </h3>
              <p className="text-gray-900 mb-4" style={{fontSize: '14px'}}>
                {infoMessage}
              </p>
              <Button
                onClick={() => setShowInfoModal(false)}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white transition-all duration-200 rounded-full"
                style={{fontSize: '14px'}}
              >
                확인
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 성공 메시지 모달 */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-gradient-to-br from-green-900/20 via-blue-900/20 to-purple-900/20 backdrop-blur-md z-50 flex items-center justify-center">
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-6 max-w-sm w-full mx-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                등록 완료
              </h3>
              <p className="text-gray-900 mb-4" style={{fontSize: '14px'}}>
                {successMessage}
              </p>
              <Button
                onClick={() => {
                  setShowSuccessModal(false);
                  router.push('/store');
                }}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white transition-all duration-200 rounded-full"
                style={{fontSize: '14px'}}
              >
                확인
              </Button>
            </div>
          </div>
        </div>
      )}

    </CommonBackground>
  );
}
