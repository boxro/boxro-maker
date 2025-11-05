"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ErrorModal from "@/components/ErrorModal";
import { 
  ArrowLeft,
  Save,
  BookOpen,
  X
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useStory } from "@/contexts/StoryContext";
import CommonHeader from "@/components/CommonHeader";
import CommonBackground from "@/components/CommonBackground";
import PageHeader from "@/components/PageHeader";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface StoryArticle {
  id: string;
  title: string;
  author: string;
  authorEmail: string;
  authorId: string;
  summary: string;
  tags: string[];
  views: number;
  likes: number;
  isPublished: boolean;
  thumbnail?: string;
  cardBackgroundColor?: string;
  createdAt: any;
  updatedAt: any;
}

// content에서 base64 이미지 추출 함수

export default function EditStoryPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const { articles, updateArticle } = useStory();
  const router = useRouter();
  const [article, setArticle] = useState<StoryArticle | null>(null);
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [thumbnail, setThumbnail] = useState("");
  const [cardBackgroundColor, setCardBackgroundColor] = useState('#ffffff');
  const [saving, setSaving] = useState(false);
  
  // 모달 상태
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [successTitle, setSuccessTitle] = useState('발행 완료');
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [infoMessage, setInfoMessage] = useState('');
  
  const [loading, setLoading] = useState(true);

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
        } catch (error: any) {
          console.error('❌ 압축 처리 중 오류:', error);
          reject(new Error(`이미지 압축 중 오류가 발생했습니다: ${error.message}`));
        }
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
      alert('박스카 이야기 글 편집 권한이 없습니다.');
      router.push('/story');
      return;
    }
  }, [user, router]);

  // 기존 글 데이터 로드
  const fetchArticle = async () => {
    try {
      setLoading(true);
      
      // Firebase에서 박스카 이야기 데이터 가져오기
      const articleRef = doc(db, 'storyArticles', id as string);
      const articleSnap = await getDoc(articleRef);
      
      if (articleSnap.exists()) {
        const articleData = {
          id: articleSnap.id,
          ...articleSnap.data()
        } as StoryArticle;
        
        setArticle(articleData);
        setTitle(articleData.title);
        setSummary(articleData.summary);
        setThumbnail(articleData.thumbnail || '');
        setCardBackgroundColor(articleData.cardBackgroundColor || '#ffffff');
      } else {
        alert('글이 존재하지 않습니다.');
        router.push('/story');
      }
    } catch (error) {
      console.error('글 로드 실패:', error);
      alert('글을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchArticle();
    }
  }, [id]);




  // 이미지 압축 함수 (400px, 1.0 품질)
  const compressImage = (file: File, maxWidth: number = 400, quality: number = 1.0): Promise<string> => {
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
        } catch (error: any) {
          console.error('❌ 압축 처리 중 오류:', error);
          reject(new Error(`이미지 압축 중 오류가 발생했습니다: ${error.message}`));
        }
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        // 이미지 압축 (400px, 1.0 품질)
        const compressedImage = await compressImage(file, 400, 1.0);
        setThumbnail(compressedImage);
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
    if (!user || !article) return;
    
    if (!title.trim()) {
      setInfoMessage('제목을 입력해주세요.');
      setShowInfoModal(true);
      return;
    }

    try {
      setSaving(true);
      
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
        tags: [],
        thumbnail: thumbnail || '',
        authorNickname: userNickname,
        cardBackgroundColor: cardBackgroundColor,
        updatedAt: new Date()
      };

      // Firebase에서 글 업데이트
      const articleRef = doc(db, 'storyArticles', article.id);
      await updateDoc(articleRef, articleData);
      
      // 인덱스 캐시 무효화 (수정된 카드가 인덱스에 반영되도록)
      if (typeof window !== 'undefined') {
        (window as any).__storyIndexLoaded = false;
        (window as any).__storyIndexCache = new Map();
      }
      
      setSuccessMessage('글이 성공적으로 발행되었습니다!');
      setShowSuccessModal(true);
      
    } catch (error) {
      console.error('저장 실패:', error);
      setErrorMessage('저장 중 오류가 발생했습니다.');
      setShowErrorModal(true);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <CommonBackground>
        <CommonHeader />
        <div className="max-w-7xl mx-auto px-4 md:px-8 flex-1">
          <div className="mt-10">
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
                  박스카 이야기를 불러오는 중...
                </h3>
                <p className="text-sm text-white/80">재미있는 박스카 이야기들을 준비하고 있어요! ✨</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </CommonBackground>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">로그인이 필요합니다.</p>
          <Link href="/login">
            <Button className="mt-4">로그인하기</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">글을 찾을 수 없습니다.</p>
          <Link href="/story">
            <Button className="mt-4 bg-white border border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 rounded-full px-6 py-3 text-gray-700">
              <ArrowLeft className="w-4 h-4 mr-2" />
              목록으로
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <CommonBackground>
      <CommonHeader />
      <div className="max-w-7xl mx-auto px-4 md:px-8 flex-1">
        {/* 글 내용 */}
        <div className="mt-12">
          <Card className="bg-white/97 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden w-full rounded-2xl pt-0 pb-6 border-0">
          <CardHeader className="pt-8">
            <CardTitle className="text-[18px]">박스카 이야기 수정</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* 입력 필드들 */}
                <div className="space-y-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      이야기 제목
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="이야기 카드에 표시될 제목"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-[14px] bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      이야기 설명
                    </label>
                    <textarea
                      value={summary}
                      onChange={(e) => setSummary(e.target.value)}
                      placeholder="이야기 카드에 표시될 설명"
                      rows={24}
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

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      이야기 썸네일 (카드 이미지)
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
                            setThumbnail('');
                          }}
                          className="px-3 py-2 bg-sky-500 hover:bg-sky-600 text-white text-sm rounded-md transition-colors whitespace-nowrap flex-shrink-0"
                        >
                          삭제
                        </button>
                      )}
                    </div>
                    
                    {/* 카드 배경색 선택 - 썸네일 바로 아래 */}
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        카드 배경색
                      </label>
                      <div className="flex items-center gap-4">
                        <input 
                          type="color" 
                          value={cardBackgroundColor === 'transparent' ? '#ffffff' : cardBackgroundColor}
                          onChange={(e) => setCardBackgroundColor(e.target.value)}
                          className="w-12 h-10 border-0 rounded-md cursor-pointer"
                        />
                        <input 
                          type="text" 
                          value={cardBackgroundColor}
                          onChange={(e) => setCardBackgroundColor(e.target.value)}
                          placeholder="#ffffff"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-[14px] bg-white"
                        />
                        <button
                          type="button"
                          onClick={() => setCardBackgroundColor('transparent')}
                          className={`px-3 py-2 text-sm rounded-md border transition-colors ${
                            cardBackgroundColor === 'transparent'
                              ? 'bg-blue-100 border-blue-300 text-blue-700'
                              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          투명
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 미리보기 - 오른쪽에 배치 */}
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
        </div>

        {/* 버튼들 - 카드 밖에 위치 */}
        <div className="mt-6 px-4 md:px-0">
          <div className="flex justify-between items-center">
            <Link href="/story">
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
                <BookOpen className="w-4 h-4 md:w-5 md:h-5" />
                <span className="font-medium" style={{fontSize: '14px'}}>발행하기</span>
              </Button>
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
              <h3 className="text-lg font-semibold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                {successTitle}
              </h3>
              <p className="text-gray-900 mb-4" style={{fontSize: '14px'}}>
                {successMessage}
              </p>
              <Button
                onClick={() => {
                  setShowSuccessModal(false);
                  router.push('/story');
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
    </CommonBackground>
  );
}
