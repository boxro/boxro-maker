'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera, Save } from 'lucide-react';
import { useRouter } from 'next/navigation';
import CommonHeader from '@/components/CommonHeader';
import { SuccessModal } from '@/components/Modal';
import CommonFooter from '@/components/CommonFooter';
import CommonBackground from '@/components/CommonBackground';

export default function EditProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [profileData, setProfileData] = useState({
    originalName: '',
    displayName: '',
    photoURL: '',
    email: ''
  });
  const [tempImage, setTempImage] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resizeImageToSquare = (file: File, size: number): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        canvas.width = size;
        canvas.height = size;
        
        if (ctx) {
          const minDimension = Math.min(img.width, img.height);
          const startX = (img.width - minDimension) / 2;
          const startY = (img.height - minDimension) / 2;
          
          ctx.drawImage(
            img,
            startX, startY, minDimension, minDimension,
            0, 0, size, size
          );
          
          canvas.toBlob((blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('이미지 변환 실패'));
            }
          }, 'image/jpeg', 0.8);
        } else {
          reject(new Error('Canvas 컨텍스트를 가져올 수 없습니다'));
        }
      };
      
      img.onerror = () => reject(new Error('이미지 로드 실패'));
      img.src = URL.createObjectURL(file);
    });
  };

  useEffect(() => {
    if (user) {
      const loadUserProfile = async () => {
        try {
          const userRef = doc(db, 'users', user.uid);
          const userSnap = await getDoc(userRef);
          
          if (userSnap.exists()) {
            const userData = userSnap.data();
            setProfileData({
              originalName: userData.author || user.displayName || '',
              displayName: userData.authorNickname || userData.displayName || user.displayName || '',
              photoURL: userData.customPhotoURL || userData.photoURL || user.photoURL || '',
              email: userData.email || user.email || ''
            });
          } else {
            setProfileData({
              originalName: user.displayName || '',
              displayName: user.displayName || '',
              photoURL: user.photoURL || '',
              email: user.email || ''
            });
          }
        } catch (error) {
          console.error('프로필 정보 로드 오류:', error);
          setProfileData({
            originalName: user.displayName || '',
            displayName: user.displayName || '',
            photoURL: user.photoURL || '',
            email: user.email || ''
          });
        }
      };
      
      loadUserProfile();
    }
  }, [user]);

  const handleImageUpload = async (file: File) => {
    if (!user) return;

    setIsUploadingImage(true);
    setMessage('');

    try {
      if (!file.type.startsWith('image/')) {
        setMessage('이미지 파일만 업로드할 수 있습니다.');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setMessage('이미지 크기는 5MB 이하여야 합니다.');
        return;
      }

      // 임시로 Base64로 변환하여 임시 상태에만 저장
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const base64String = e.target?.result as string;
          
          // 임시 상태에만 저장 (DB에는 저장하지 않음)
          setTempImage(base64String);
          setMessage('이미지가 선택되었습니다. 저장 버튼을 눌러 변경사항을 적용하세요.');
        } catch (error) {
          console.error('이미지 변환 실패:', error);
          setMessage('이미지 변환에 실패했습니다. 다시 시도해주세요.');
        } finally {
          setIsUploadingImage(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (error: any) {
      console.error('이미지 업로드 오류:', error);
      
      if (error.code === 'storage/retry-limit-exceeded') {
        setMessage('서버가 일시적으로 불안정합니다. 잠시 후 다시 시도해주세요.');
      } else if (error.code === 'storage/network-request-failed' || error.message?.includes('network')) {
        setMessage('네트워크 연결을 확인해주세요');
      } else if (error.code === 'storage/quota-exceeded') {
        setMessage('저장 공간이 부족합니다. 관리자에게 문의해주세요.');
      } else if (error.code === 'storage/unauthorized') {
        setMessage('업로드 권한이 없습니다. 다시 로그인해주세요.');
      } else {
        setMessage('이미지 업로드에 실패했습니다. 다시 시도해주세요.');
      }
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setIsSaving(true);
    setMessage('');

    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        displayName: profileData.displayName,
        authorNickname: profileData.displayName,
        photoURL: tempImage || profileData.photoURL, // 임시 이미지가 있으면 사용
        customPhotoURL: tempImage || profileData.photoURL, // 임시 이미지가 있으면 사용
        updatedAt: new Date().toISOString()
      });

      try {
        const galleryRef = collection(db, 'communityDesigns');
        const userDesignsQuery = query(galleryRef, where('authorId', '==', user.uid));
        const userDesignsSnapshot = await getDocs(userDesignsQuery);
        
        const updatePromises = userDesignsSnapshot.docs.map(doc => 
          updateDoc(doc.ref, { authorNickname: profileData.displayName })
        );
        
        await Promise.all(updatePromises);
      } catch (error) {
        console.warn('기존 작품 닉네임 업데이트 실패:', error);
      }

      try {
        const commentsRef = collection(db, 'boxroTalks');
        const userCommentsQuery = query(commentsRef, where('authorId', '==', user.uid));
        const userCommentsSnapshot = await getDocs(userCommentsQuery);
        
        const commentUpdatePromises = userCommentsSnapshot.docs.map(doc => 
          updateDoc(doc.ref, { authorNickname: profileData.displayName })
        );
        
        await Promise.all(commentUpdatePromises);
      } catch (error) {
        console.warn('기존 댓글 닉네임 업데이트 실패:', error);
      }

      // 임시 이미지를 정리하고 상태 업데이트
      if (tempImage) {
        setProfileData(prev => ({
          ...prev,
          photoURL: tempImage
        }));
        setTempImage(null);
      }
      
      setShowSuccessModal(true);
      setIsEditing(false);
    } catch (error: any) {
      console.error('프로필 저장 오류:', error);
      
      if (error.code === 'unavailable' || error.message?.includes('network') || error.message?.includes('fetch')) {
        setMessage('네트워크 연결을 확인해주세요');
      } else {
        setMessage('프로필 저장에 실패했습니다. 다시 시도해주세요.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    // 임시 이미지 초기화
    setTempImage(null);
    setMessage('');
    router.push('/');
  };

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth');
    }
  }, [user, loading, router]);

  if (!user) {
    return null;
  }

  return (
    <CommonBackground>
      <CommonHeader />
      <div className="pt-12 flex-1 min-h-screen">
        <div className="max-w-2xl mx-auto px-4">

          <Card className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20">
            <CardHeader className="text-center pb-0">
              <CardTitle className="text-[22px] font-bold text-black" style={{ fontFamily: 'CookieRun, cursive' }}>
                프로필 수정
              </CardTitle>
            </CardHeader>

            <CardContent className="pt-0">
              <div className="text-center mb-4">
                <div className="relative inline-block">
                  <div className="w-24 h-24 mx-auto mb-2 rounded-full overflow-hidden flex items-center justify-center bg-gray-200">
                    {(tempImage || profileData.photoURL) ? (
                      <img 
                        src={tempImage || profileData.photoURL} 
                        alt="프로필 이미지" 
                        className="w-full h-full object-cover"
                        crossOrigin="anonymous"
                        onLoad={() => {
                          const fallback = document.querySelector('.profile-fallback');
                          if (fallback) {
                            fallback.classList.add('hidden');
                          }
                        }}
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          const fallback = document.querySelector('.profile-fallback');
                          if (fallback) {
                            fallback.classList.remove('hidden');
                          }
                        }}
                      />
                    ) : null}
                    <span className="profile-fallback text-2xl font-bold text-gray-600">
                      {profileData.displayName?.charAt(0) || 'U'}
                    </span>
                  </div>
                  {isEditing && (
                    <Button
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploadingImage}
                      className="absolute bottom-3 -right-8 w-10 h-10 rounded-full bg-white border-2 border-purple-200 hover:bg-purple-50 hover:border-purple-400 text-purple-600 hover:text-purple-700 flex items-center justify-center"
                    >
                      {isUploadingImage ? (
                        <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <Camera className="w-4 h-4" />
                      )}
                    </Button>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    이메일 <span className="text-[12px] text-gray-500 font-normal">(변경할 수 없어요)</span>
                  </label>
                  <Input
                    value={profileData.email}
                    disabled
                    className="bg-gray-50 text-gray-500 text-[15px]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    이름 <span className="text-[12px] text-gray-500 font-normal">(변경할 수 없어요)</span>
                  </label>
                  <Input
                    value={profileData.originalName || profileData.displayName}
                    disabled
                    className="bg-gray-50 text-gray-500 text-[15px]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    닉네임
                  </label>
                  <Input
                    value={profileData.displayName}
                    onChange={(e) => setProfileData(prev => ({ ...prev, displayName: e.target.value }))}
                    disabled={!isEditing}
                    placeholder="닉네임을 입력하세요"
                    maxLength={20}
                    className="text-[15px] bg-white border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                  />
                </div>

                {message && (
                  <div className={`p-3 rounded-lg text-sm ${
                    message.includes('성공') 
                      ? 'bg-green-50 text-green-700 border border-green-200' 
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}>
                    {message}
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleCancel}
                  variant="outline"
                  className="flex-1 border-2 border-gray-200 hover:bg-gray-50 hover:border-gray-300"
                  disabled={isSaving}
                >
                  취소
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={isSaving || !profileData.displayName.trim()}
                  className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                >
                  {isSaving ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      저장 중...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Save className="w-4 h-4" />
                      저장하기
                    </div>
                  )}
                </Button>
              </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <CommonFooter />

      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="프로필이 업데이트됐어요"
        description="변경사항이 성공적으로 저장되었습니다"
        buttonText="홈으로 이동"
        onButtonClick={() => router.push('/')}
        icon="✨"
      />
    </CommonBackground>
  );
}
