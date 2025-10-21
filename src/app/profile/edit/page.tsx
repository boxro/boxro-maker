'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { doc, getDoc, updateDoc, collection, query, where, getDocs, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera, Save, Trash2 } from 'lucide-react';
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
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 모달이 열릴 때 body 스크롤 방지
  useEffect(() => {
    if (showDeleteModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    // 컴포넌트 언마운트 시 스크롤 복원
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showDeleteModal]);

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

  // 프로필 이미지 압축 함수 (100px, 100KB)
  const compressProfileImage = (file: File, maxWidth: number = 100, quality: number = 0.8): Promise<string> => {
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
        // 100px로 강제 리사이즈 (가로 기준)
        const maxWidth = 100;
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
        let startQuality = hasTransparency ? 0.8 : 0.7;
        
        // 파일 크기가 100KB 이하가 될 때까지 품질을 낮춤
        const compressImageRecursive = (currentQuality: number): string => {
          const dataUrl = canvas.toDataURL(format, currentQuality);
          const sizeKB = dataUrl.length / 1024;
          
          console.log(`프로필 압축 시도: 품질 ${currentQuality.toFixed(1)}, 크기 ${sizeKB.toFixed(1)}KB`);
          
          // 크기가 여전히 100KB보다 크고 품질을 더 낮출 수 있다면 재귀 호출
          if (sizeKB > 100 && currentQuality > 0.05) {
            return compressImageRecursive(currentQuality - 0.05);
          }
          
          console.log(`프로필 최종 압축: 품질 ${currentQuality.toFixed(1)}, 크기 ${sizeKB.toFixed(1)}KB`);
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

      // 이미지 압축 적용
      const compressedImage = await compressProfileImage(file, 100, 0.8);
      
      // 임시 상태에만 저장 (DB에는 저장하지 않음)
      setTempImage(compressedImage);
      setMessage('이미지가 선택되었습니다. 저장 버튼을 눌러 변경사항을 적용하세요.');
    } catch (error: any) {
      console.error('이미지 업로드 오류:', error);
      
      if (error.message?.includes('이미지 압축')) {
        setMessage('이미지 압축 중 오류가 발생했습니다. 다시 시도해주세요.');
      } else if (error.code === 'storage/retry-limit-exceeded') {
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

  const handleDeleteAccount = async () => {
    if (!user) return;
    
    if (deleteConfirmText !== '탈퇴') {
      setMessage('정확히 "탈퇴"라고 입력해주세요.');
      return;
    }

    setIsDeleting(true);
    setMessage('');

    try {
      const userId = user.uid;
      
      // 1. 사용자의 모든 갤러리 디자인 삭제
      try {
        const galleryRef = collection(db, 'communityDesigns');
        const userDesignsQuery = query(galleryRef, where('authorId', '==', userId));
        const userDesignsSnapshot = await getDocs(userDesignsQuery);
        
        const deleteDesignPromises = userDesignsSnapshot.docs.map(doc => deleteDoc(doc.ref));
        await Promise.all(deleteDesignPromises);
        console.log('✅ 갤러리 디자인 삭제 완료');
      } catch (error) {
        console.warn('갤러리 디자인 삭제 실패:', error);
      }

      // 2. 사용자의 모든 댓글 삭제
      try {
        const commentsRef = collection(db, 'boxroTalks');
        const userCommentsQuery = query(commentsRef, where('authorId', '==', userId));
        const userCommentsSnapshot = await getDocs(userCommentsQuery);
        
        const deleteCommentPromises = userCommentsSnapshot.docs.map(doc => deleteDoc(doc.ref));
        await Promise.all(deleteCommentPromises);
        console.log('✅ 댓글 삭제 완료');
      } catch (error) {
        console.warn('댓글 삭제 실패:', error);
      }

      // 3. 사용자 프로필 정보 삭제
      try {
        const userRef = doc(db, 'users', userId);
        await deleteDoc(userRef);
        console.log('✅ 사용자 프로필 삭제 완료');
      } catch (error) {
        console.warn('사용자 프로필 삭제 실패:', error);
      }

      // 4. Firebase Auth에서 사용자 삭제
      try {
        const { deleteUser } = await import('firebase/auth');
        const { auth } = await import('@/lib/firebase');
        
        if (!auth.currentUser) {
          throw new Error('현재 로그인된 사용자가 없습니다.');
        }
        
        await deleteUser(auth.currentUser);
        console.log('✅ Firebase Auth 사용자 삭제 완료');
      } catch (error: any) {
        console.error('Firebase Auth 사용자 삭제 실패:', error);
        
        if (error.code === 'auth/requires-recent-login') {
          throw new Error('보안을 위해 다시 로그인한 후 탈퇴를 진행해주세요.');
        } else if (error.code === 'auth/network-request-failed') {
          throw new Error('네트워크 연결을 확인해주세요.');
        } else if (error.code === 'auth/too-many-requests') {
          throw new Error('요청이 너무 많습니다. 잠시 후 다시 시도해주세요.');
        } else {
          throw new Error(`계정 삭제에 실패했습니다: ${error.message}`);
        }
      }

      // 5. 로컬 스토리지 정리
      try {
        localStorage.clear();
        console.log('✅ 로컬 스토리지 정리 완료');
      } catch (error) {
        console.warn('로컬 스토리지 정리 실패:', error);
      }

      // 6. 홈페이지로 리다이렉트
      router.push('/');
      
    } catch (error: any) {
      console.error('회원 탈퇴 오류:', error);
      
      // 에러 메시지가 이미 설정된 경우 그대로 사용
      if (error.message && error.message !== '회원 탈퇴에 실패했습니다. 다시 시도해주세요.') {
        setMessage(error.message);
      } else if (error.code === 'auth/requires-recent-login') {
        setMessage('보안을 위해 다시 로그인한 후 탈퇴를 진행해주세요.');
      } else if (error.code === 'auth/network-request-failed') {
        setMessage('네트워크 연결을 확인해주세요.');
      } else if (error.code === 'auth/too-many-requests') {
        setMessage('요청이 너무 많습니다. 잠시 후 다시 시도해주세요.');
      } else {
        setMessage(`회원 탈퇴에 실패했습니다: ${error.message || '알 수 없는 오류가 발생했습니다.'}`);
      }
    } finally {
      setIsDeleting(false);
    }
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
                      {profileData.email?.charAt(0) || profileData.displayName?.charAt(0) || 'U'}
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
                    className="bg-gray-50 text-gray-500 text-[14px]"
                  />
                </div>

                {(profileData.originalName || profileData.displayName) && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      이름 <span className="text-[12px] text-gray-500 font-normal">(변경할 수 없어요)</span>
                    </label>
                    <Input
                      value={profileData.originalName || profileData.displayName}
                      disabled
                      className="bg-gray-50 text-gray-500 text-[14px]"
                    />
                  </div>
                )}

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
                    className="text-[14px] bg-white border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                  />
                  <div className="text-left mt-4">
                    <button
                      onClick={() => setShowDeleteModal(true)}
                      className="text-gray-500 hover:text-red-600 underline"
                    >
                      <span style={{ fontSize: '14px' }}>회원탈퇴</span>
                      <span style={{ fontSize: '12px' }}> (모든 데이터가 영구적으로 삭제됩니다.)</span>
                    </button>
                  </div>
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
                  className="flex-1 border-2 border-gray-200 hover:bg-gray-50 hover:border-gray-300 rounded-full"
                  disabled={isSaving}
                >
                  취소
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={isSaving || !profileData.displayName.trim()}
                  className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-full"
                >
                  {isSaving ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      저장 중...
                    </div>
                  ) : (
                    '저장하기'
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

      {/* 회원 탈퇴 확인 모달 */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-pink-900/20 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 w-full max-w-md">
            <div className="p-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                  <Trash2 className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2" style={{ fontSize: '18px' }}>회원 탈퇴</h3>
                <p className="text-sm text-gray-600 mb-4">
                  정말 떠나시겠어요? 😢<br />
                  <strong className="text-red-600">모든 데이터가 영구적으로 삭제</strong>되며 복구할 수 없습니다.
                </p>
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                  <p className="text-xs text-red-700">
                    • 갤러리에 올린 모든 작품<br />
                    • 친구들과 이야기 나눈 톡<br />
                    • 프로필 정보 및 활동 기록
                  </p>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    아래에 <strong>"탈퇴"</strong>라고 입력해주세요
                  </label>
                  <Input
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder="탈퇴"
                    className="text-center border-red-300 focus:border-red-500 focus:ring-red-500 placeholder:text-gray-300"
                  />
                </div>
              </div>
              
              {message && (
                <div className={`p-3 rounded-lg text-sm mb-4 ${
                  message.includes('실패') 
                    ? 'bg-red-50 text-red-700 border border-red-200' 
                    : 'bg-green-50 text-green-700 border border-green-200'
                }`}>
                  {message}
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeleteConfirmText('');
                    setMessage('');
                    document.body.style.overflow = 'unset';
                  }}
                  variant="outline"
                  className="flex-1 border-2 border-gray-200 hover:bg-gray-50 hover:border-gray-300 rounded-full"
                  disabled={isDeleting}
                >
                  취소
                </Button>
                <Button
                  onClick={handleDeleteAccount}
                  disabled={isDeleting || deleteConfirmText !== '탈퇴'}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-full"
                >
                  {isDeleting ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      탈퇴 중...
                    </div>
                  ) : (
                    '탈퇴하기'
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </CommonBackground>
  );
}
