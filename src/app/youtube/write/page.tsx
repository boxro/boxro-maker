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
  const [cardBackgroundColor, setCardBackgroundColor] = useState('#ffffff');
  const [isPublished, setIsPublished] = useState(false);
  // 안내 메시지 모달 상태
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [infoMessage, setInfoMessage] = useState('');
  
  // 성공 메시지 모달 상태
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState(''); // 0-75, 기본값 4 (하단)
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
        thumbnail: thumbnail || '',
        authorId: user.uid,
        tags: [],
        views: 0,
        likes: 0,
        shares: 0,
        boxroTalks: 0,
        youtubeRedirects: 0,
        isPublished: true,
        cardBackgroundColor: cardBackgroundColor,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      console.log('Firebase에 저장할 박스로 유튜브 데이터:', articleData);
      
      // Firebase에 저장
      const docRef = await addDoc(collection(db, 'youtubeItems'), articleData);
      console.log('유튜브 아이템 저장 완료, ID:', docRef.id);
      
      
      // 인덱스 캐시 무효화 (새 카드가 인덱스에 포함되도록)
      if (typeof window !== 'undefined') {
        (window as any).__youtubeIndexLoaded = false;
        (window as any).__youtubeIndexCache = new Map();
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
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* 입력 폼 */}
                <div className="space-y-4">
                {/* 제목 */}
                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-2">
                    영상 제목
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="영상 카드에 표시될 제목"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-[14px] mb-3 bg-white"
                  />
                </div>

                {/* 요약 */}
                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-2">
                    영상 설명
                  </label>
                  <textarea
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    placeholder="영상 카드에 표시될 설명"
                    rows={12}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-[14px] bg-white"
                  />
                  <div className="mt-1 p-2 bg-blue-50 border border-blue-200 rounded-md">
                    <div className="text-xs text-blue-800">
                      <p className="font-bold mb-1">마크다운 작성 방법:</p>
                      <div className="space-y-1 text-xs">
                        <p>• <span className="font-bold">**굵은 글씨**</span> → <strong>굵은 글씨</strong></p>
                        <p>• <span className="font-bold">*기울임*</span> → <em>기울임</em></p>
                        <p>• <span className="font-bold">~~취소선~~</span> → <del>취소선</del></p>
                      </div>
                    </div>
                  </div>
                </div>


                {/* 스토어 URL */}
                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-2">
                    유튜브 바로가기 URL
                  </label>
                  <input
                    type="url"
                    value={storeUrl}
                    onChange={(e) => setStoreUrl(e.target.value)}
                    placeholder="유튜브 바로가기 URL을 입력하세요 (예: https://youtube.com/watch?v=...)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-[14px] bg-white"
                  />
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
                  
                  {/* 카드 배경색 선택 - 썸네일 바로 아래 */}
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-800 mb-2">
                      카드 배경색
                    </label>
                    <div className="flex items-center gap-4">
                      <input
                        type="color"
                        value={cardBackgroundColor === 'transparent' ? '#ffffff' : cardBackgroundColor}
                        onChange={(e) => setCardBackgroundColor(e.target.value)}
                        className="w-16 h-12 border-0 rounded-md cursor-pointer"
                      />
                      <input
                        type="text"
                        value={cardBackgroundColor}
                        onChange={(e) => setCardBackgroundColor(e.target.value)}
                        placeholder="#ffffff"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-[14px] bg-white"
                      />
                    </div>
                  </div>
                </div>


                </div>

                {/* 미리보기 */}
                <div className="flex justify-center">
                  <div 
                    className="group shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden w-[375px] rounded-2xl relative"
                    style={{ backgroundColor: cardBackgroundColor }}
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
                          color: '#000000',
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
                        <div 
                          className="text-[15px] mb-3 whitespace-pre-wrap"
                          style={{ color: '#000000', lineHeight: '1.6' }}
                          dangerouslySetInnerHTML={{
                            __html: summary
                              .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold">$1</strong>')
                              .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
                              .replace(/~~(.*?)~~/g, '<del class="line-through">$1</del>')
                              .replace(/\n/g, '<br>')
                          }}
                        />
                      )}
                    </div>
                  </div>
                </div>
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
