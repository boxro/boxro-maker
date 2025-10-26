"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ErrorModal from "@/components/ErrorModal";
import { 
  ArrowLeft,
  Save,
  Play,
  X
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useStory } from "@/contexts/StoryContext";
import CommonHeader from "@/components/CommonHeader";
import CommonBackground from "@/components/CommonBackground";

export default function WriteYoutubePage() {
  const { user } = useAuth();
  const { setArticles } = useStory();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
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
  const [cardBackgroundColor, setCardBackgroundColor] = useState("#ffffff");
  const [homeCardBackgroundColor, setHomeCardBackgroundColor] = useState("#3b82f6");
  const [cardTextPosition, setCardTextPosition] = useState(4); // 0-75, 기본값 4 (하단)
  const [saving, setSaving] = useState(false);
  
  // 오류 모달 상태
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  

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



  // 관리자 이메일 목록
  const adminEmails = [
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
      setErrorMessage('박스로 유튜브 영상 작성 권한이 없습니다.');
      setShowErrorModal(true);
      router.push('/youtube');
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


  // 이미지 압축 함수 (400px, 1.0 품질)
  const compressImage = (file: File, maxWidth: number = 400, quality: number = 1.0): Promise<string> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // 400px로 강제 리사이즈 (가로 기준)
        const maxWidth = 400;
        const ratio = maxWidth / img.width;
        canvas.width = maxWidth;
        canvas.height = img.height * ratio;
        
        // 이미지 그리기
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        // 투명도가 있는 이미지인지 확인
        const imageData = ctx?.getImageData(0, 0, canvas.width, canvas.height);
        const hasTransparency = imageData?.data.some((_, index) => index % 4 === 3 && imageData.data[index] < 255);
        
        // 투명도가 있으면 PNG, 없으면 JPG 사용 (원본 포맷 유지)
        const format = hasTransparency ? 'image/png' : 'image/jpeg';
        
        // 1.0 품질로 압축 (원본 품질 유지)
        const dataUrl = canvas.toDataURL(format, 1.0);
        
        console.log(`압축 완료: 품질 1.0, 크기 ${(dataUrl.length / 1024).toFixed(1)}KB`);
        
        resolve(dataUrl);
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
      
      // Firebase에 박스로 유튜브 저장
      const { collection, addDoc, serverTimestamp, doc, getDoc } = await import("firebase/firestore");
      const { db } = await import("@/lib/firebase");
      
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
      
      const articleData = {
        title: title.trim(),
        summary: summary.trim() || '',
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
        cardBackgroundColor: cardBackgroundColor,
        homeCardBackgroundColor: homeCardBackgroundColor,
        textPosition: cardTextPosition,
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

      console.log('Firebase에 저장할 박스로 유튜브 데이터:', articleData);
      
      // Firebase에 저장
      const docRef = await addDoc(collection(db, 'youtubeItems'), articleData);
      console.log('유튜브 아이템 저장 완료, ID:', docRef.id);
      
      // 홈 카드로 노출하는 경우 homeCards 컬렉션에도 저장 (홈카드 정보가 완전할 때만)
      if (showOnHome && cardTitle.trim() && cardDescription.trim() && cardThumbnail) {
        const homeCardData = {
          source: 'youtubeItems',
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
      
      setSuccessMessage('영상이 성공적으로 등록되었습니다!');
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
            <CardTitle className="text-[18px]">새 영상 등록</CardTitle>
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
                    영상 제목
                  </label>
                  <div className="bg-transparent p-4 rounded-lg border border-gray-300">
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="영상 카드에 표시될 제목"
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
                    영상 설명
                  </label>
                  <div className="bg-transparent p-4 rounded-lg border border-gray-300">
                    <textarea
                      value={summary}
                      onChange={(e) => setSummary(e.target.value)}
                      placeholder="영상 카드에 표시될 설명"
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


                {/* 스토어 URL */}
                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-2">
                    유튜브 바로가기 URL
                  </label>
                  <div className="bg-transparent p-4 rounded-lg border border-gray-300">
                    <input
                      type="url"
                      value={storeUrl}
                      onChange={(e) => setStoreUrl(e.target.value)}
                      placeholder="유튜브 바로가기 URL을 입력하세요 (예: https://youtube.com/watch?v=...)"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-[14px] bg-white"
                    />
                  </div>
                </div>

                {/* 썸네일 */}
                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-2">
                    영상 썸네일 (카드 이미지)
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
                    영상 배경 색상
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
                          alt={title || "박스로 유튜브"}
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
                          className="text-[15px] mb-3 whitespace-pre-wrap"
                          style={{ color: summaryColor, lineHeight: '1.6' }}
                        >
                          {summary}
                        </p>
                      )}
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
            <Link href="/youtube">
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
                <Play className="w-4 h-4 md:w-5 md:h-5" />
                <span className="font-medium" style={{fontSize: '14px'}}>영상등록</span>
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
                  router.push('/youtube');
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
