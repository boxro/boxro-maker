"use client";

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";

interface OnboardingTutorialProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  showDontShowAgain?: boolean;
  redirectTo?: string;
}

const tutorialSteps = [
  {
    id: 1,
    title: "박스카 그리기",
    mainText: "상상한 자동차를 그려보세요 🚗✨",
    subText: "화면 위에 쓱쓱, 자유롭게 그리면 시작돼요!",
    detailText: "펜으로 그리고, 지우개로 수정할 수 있어요.",
    visual: "✏️🎨",
    bgColor: "from-blue-500 to-cyan-500",
    image: "/onboarding_01.png"
  },
  {
    id: 2,
    title: "3D 미리보기",
    mainText: "내가 그린 자동차가 3D로 짠!",
    subText: "AI가 그림을 분석해 박스카로 변신시켜요.",
    detailText: "마음에 안 들면 다른 차로 쓱 바꿔보세요!",
    visual: "🔄✨",
    bgColor: "from-purple-500 to-pink-500",
    image: "/onboarding_02.png"
  },
  {
    id: 3,
    title: "박스카 꾸미기",
    mainText: "빛나는 휠, 멋진 램프, 나만의 컬러까지",
    subText: "360° 돌려보며 나만의 스타일을 완성해요.",
    visual: "🎨⚡",
    bgColor: "from-green-500 to-emerald-500",
    image: "/onboarding_03.png"
  },
  {
    id: 4,
    title: "박스카 도안 완성!",
    mainText: "내가 그린 자동차가 도안으로 쏙!",
    subText: "인쇄해서 조립하면 진짜 박스카 완성!",
    detailText: "친구들과 공유하고 자랑해보세요.",
    visual: "📄✂️",
    bgColor: "from-orange-500 to-red-500",
    image: "/onboarding_04.png"
  }
];

export default function OnboardingTutorial({ isOpen, onClose, onComplete, showDontShowAgain = true, redirectTo }: OnboardingTutorialProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
    }
  }, [isOpen]);

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    // "무료로 시작하기" 버튼 클릭 시 - 영구적으로 온보딩 스킵
    try {
      const { doc, setDoc, getDoc } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase');
      const { auth } = await import('@/lib/firebase');
      const { onAuthStateChanged } = await import('firebase/auth');
      
      // 항상 현재 로그인된 사용자 ID를 가져오기
      return new Promise((resolve) => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
          unsubscribe();
          if (user) {
            const userId = user.uid;
            console.log('🔍 무료로 시작하기 버튼 클릭 - 현재 로그인된 사용자 ID:', userId);
            console.log('🔍 사용자 정보 상세:', { 
              uid: user.uid, 
              email: user.email, 
              displayName: user.displayName 
            });
            
            // localStorage에 사용자 ID 저장
            localStorage.setItem('current_user_id', userId);
            console.log('✅ localStorage에 사용자 ID 저장 완료');
            
            // Firestore에 온보딩 스킵 상태 저장 (영구적)
            console.log('🔄 Firestore에 온보딩 스킵 상태 저장 시작:', userId);
            try {
              // 먼저 기존 사용자 문서 확인
              const userRef = doc(db, 'users', userId);
              const userSnap = await getDoc(userRef);
              
              if (userSnap.exists()) {
                // 기존 문서가 있으면 업데이트
                await setDoc(userRef, {
                  onboardingSkipped: true,
                  onboardingSkippedAt: new Date().toISOString()
                }, { merge: true });
                console.log('✅ 기존 문서에 온보딩 스킵 상태 업데이트 완료');
              } else {
                // 기존 문서가 없으면 새로 생성
                await setDoc(userRef, {
                  uid: userId,
                  email: user.email,
                  displayName: user.displayName,
                  onboardingSkipped: true,
                  onboardingSkippedAt: new Date().toISOString(),
                  createdAt: new Date().toISOString()
                });
                console.log('✅ 새 사용자 문서에 온보딩 스킵 상태 저장 완료');
              }
              
              console.log('✅ 온보딩 스킵 상태 Firestore에 저장됨 (영구적):', userId);
            } catch (firestoreError) {
              console.error('❌ Firestore 저장 실패:', firestoreError);
              // Firestore 실패 시 localStorage로 폴백
              try {
                localStorage.setItem(`onboarding_skipped_${userId}`, 'true');
                console.log('✅ localStorage 폴백 저장 완료');
              } catch (localStorageError) {
                console.error('❌ localStorage 폴백 저장도 실패:', localStorageError);
              }
            }
            
            // localStorage에도 백업 저장
            try {
              localStorage.setItem(`onboarding_skipped_${userId}`, 'true');
              console.log('✅ localStorage 백업 저장 완료');
            } catch (localStorageError) {
              console.warn('⚠️ localStorage 백업 저장 실패:', localStorageError);
            }
            
            onComplete();
            onClose();
            
            // 리다이렉트가 지정된 경우 해당 페이지로 이동
            if (redirectTo) {
              window.location.href = redirectTo;
            }
            
            resolve(undefined);
          } else {
            console.warn('⚠️ 사용자가 로그인되지 않아서 온보딩 스킵 상태를 저장할 수 없음');
            onComplete();
            onClose();
            
            // 리다이렉트가 지정된 경우 해당 페이지로 이동
            if (redirectTo) {
              window.location.href = redirectTo;
            }
            
            resolve(undefined);
          }
        });
      });
    } catch (error) {
      console.error('❌ 전체 저장 프로세스 실패:', error);
      
      // 전체 실패 시 localStorage로 폴백
      try {
        const userId = localStorage.getItem('current_user_id');
        if (userId) {
          localStorage.setItem(`onboarding_skipped_${userId}`, 'true');
          console.log('✅ localStorage 폴백 저장 완료');
        }
      } catch (localStorageError) {
        console.error('❌ localStorage 폴백 저장도 실패:', localStorageError);
      }
      
      onComplete();
      onClose();
      
      // 리다이렉트가 지정된 경우 해당 페이지로 이동
      if (redirectTo) {
        window.location.href = redirectTo;
      }
    }
  };

  const handleSkip = async () => {
    // X 버튼 클릭 시 - 임시 스킵 상태를 저장 (다음 로그인 시에만 다시 표시)
    try {
      const { doc, setDoc, getDoc } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase');
      const { auth } = await import('@/lib/firebase');
      const { onAuthStateChanged } = await import('firebase/auth');
      
      // 항상 현재 로그인된 사용자 ID를 가져오기
      return new Promise((resolve) => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
          unsubscribe();
          if (user) {
            const userId = user.uid;
            console.log('🔍 X 버튼 클릭 - 현재 로그인된 사용자 ID:', userId);
            console.log('🔍 사용자 정보 상세:', { 
              uid: user.uid, 
              email: user.email, 
              displayName: user.displayName 
            });
            
            // localStorage에 사용자 ID 저장
            localStorage.setItem('current_user_id', userId);
            console.log('✅ localStorage에 사용자 ID 저장 완료');
            
            // Firestore에 임시 스킵 상태 저장
            console.log('🔄 Firestore에 임시 스킵 상태 저장 시작:', userId);
            try {
              // 먼저 기존 사용자 문서 확인
              const userRef = doc(db, 'users', userId);
              const userSnap = await getDoc(userRef);
              
              if (userSnap.exists()) {
                // 기존 문서가 있으면 업데이트
                await setDoc(userRef, {
                  onboardingTemporarilySkipped: true,
                  onboardingTemporarilySkippedAt: new Date().toISOString()
                }, { merge: true });
                console.log('✅ 기존 문서에 임시 스킵 상태 업데이트 완료');
              } else {
                // 기존 문서가 없으면 새로 생성
                await setDoc(userRef, {
                  uid: userId,
                  email: user.email,
                  displayName: user.displayName,
                  onboardingTemporarilySkipped: true,
                  onboardingTemporarilySkippedAt: new Date().toISOString(),
                  createdAt: new Date().toISOString()
                });
                console.log('✅ 새 사용자 문서에 임시 스킵 상태 저장 완료');
              }
              
              console.log('✅ 온보딩 임시 스킵 상태 Firestore에 저장됨 (다음 로그인 시 다시 표시):', userId);
            } catch (firestoreError) {
              console.error('❌ Firestore 저장 실패:', firestoreError);
              // Firestore 실패 시 localStorage로 폴백
              try {
                localStorage.setItem(`onboarding_temporarily_skipped_${userId}`, 'true');
                console.log('✅ localStorage 폴백 저장 완료');
              } catch (localStorageError) {
                console.error('❌ localStorage 폴백 저장도 실패:', localStorageError);
              }
            }
            
            // localStorage에도 백업 저장
            try {
              localStorage.setItem(`onboarding_temporarily_skipped_${userId}`, 'true');
              console.log('✅ localStorage 백업 저장 완료');
            } catch (localStorageError) {
              console.warn('⚠️ localStorage 백업 저장 실패:', localStorageError);
            }
            
            console.log('⏭️ 온보딩 스플래시 닫기 (다음 로그인 시 다시 표시)');
            onClose();
            resolve(undefined);
          } else {
            console.warn('⚠️ 사용자가 로그인되지 않아서 온보딩 임시 스킵 상태를 저장할 수 없음');
            console.log('⏭️ 온보딩 스플래시 닫기 (다음 로그인 시 다시 표시)');
            onClose();
            resolve(undefined);
          }
        });
      });
    } catch (error) {
      console.error('❌ 전체 저장 프로세스 실패:', error);
      
      // 전체 실패 시 localStorage로 폴백
      try {
        const userId = localStorage.getItem('current_user_id');
        if (userId) {
          localStorage.setItem(`onboarding_temporarily_skipped_${userId}`, 'true');
          console.log('✅ localStorage 폴백 저장 완료');
        }
      } catch (localStorageError) {
        console.error('❌ localStorage 폴백 저장도 실패:', localStorageError);
      }
      
      console.log('⏭️ 온보딩 스플래시 닫기 (다음 로그인 시 다시 표시)');
      onClose();
    }
  };

  if (!isOpen) return null;

  const currentTutorial = tutorialSteps[currentStep];
  const isLastStep = currentStep === tutorialSteps.length - 1;

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-pink-900/20 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 w-full max-w-lg relative h-[580px] sm:h-[680px] flex flex-col overflow-hidden">
        {/* 닫기 버튼 */}
        <div className="absolute top-2 right-4 z-10">
          <button
            onClick={handleSkip}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold flex-shrink-0"
          >
            ×
          </button>
        </div>

        <div className="p-0 flex-1 flex flex-col">
          {/* 상단 이미지 영역 */}
          <div className="relative w-full h-[280px] sm:h-80 md:h-96">
            <Image
              src={currentTutorial.image || "/onboarding_01.png"}
              alt={`온보딩 ${currentStep + 1}단계`}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              priority
            />
          </div>

          {/* 하단 콘텐츠 영역 */}
          <div className="px-8 pt-6 pb-6 flex flex-col flex-1">
            {/* 상단 콘텐츠 */}
            <div className="flex-1">
              {/* 진행 표시 - 고정 높이로 레이아웃 시프트 방지 */}
              <div className="flex justify-center items-center mb-4" style={{ height: '16px' }}>
                <div className="flex space-x-2 items-center">
                  {tutorialSteps.map((_, index) => (
                    <div
                      key={index}
                      className={`rounded-full transition-all duration-200 ${
                        index === currentStep 
                          ? 'w-2.5 h-2.5 bg-purple-500' 
                          : 'w-2 h-2 bg-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* 제목 */}
              <div className="text-center mb-2">
                <h2 className="text-[22px] font-bold text-gray-800 mb-0" style={{fontFamily: 'CookieRun, sans-serif'}}>
                  {currentTutorial.title}
                </h2>
              </div>

              {/* 설명 */}
              <div className="text-center">
                {/* 메인 텍스트 */}
                <p className="text-gray-900 mb-3 font-bold" style={{fontSize: '16px'}}>
                  {currentTutorial.mainText}
                </p>

                {/* 서브 텍스트 */}
                <p className="text-gray-900 mb-0" style={{fontSize: '14px'}}>
                  {currentTutorial.subText}
                </p>

                {/* 디테일 텍스트 */}
                {currentTutorial.detailText && (
                  <p className="text-gray-900" style={{fontSize: '14px'}}>
                    {currentTutorial.detailText}
                  </p>
                )}
              </div>
            </div>

            {/* 하단 고정 영역 */}
            <div className="mt-auto">
              {/* 버튼들 */}
              <div className="flex flex-row gap-3 mb-3">
                {currentStep > 0 && (
                <Button
                  variant="outline"
                  onClick={handlePrev}
                  className="flex-none w-20 border-2 border-gray-200 hover:bg-gray-50 hover:border-gray-300 rounded-full text-gray-900"
                  style={{fontSize: '14px'}}
                >
                  <ChevronLeft className="w-4 h-4 -mr-1" />
                  이전
                </Button>
                )}

                <Button
                  onClick={handleNext}
                  className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-full"
                  style={{fontSize: '14px'}}
                >
                  {isLastStep ? (
                    <>
                      무료로 시작하기
                      <ChevronRight className="w-4 h-4 -ml-1" />
                    </>
                  ) : (
                    <>
                      다음
                      <ChevronRight className="w-4 h-4 -ml-1" />
                    </>
                  )}
                </Button>
              </div>

              {/* 하단 체크박스 (조건부 표시, 레이아웃 유지) */}
              <div className="h-6 flex items-center justify-center">
                {showDontShowAgain && (
                  <label className="flex items-center justify-center space-x-2 text-gray-700">
                    <input
                      type="checkbox"
                      checked={dontShowAgain}
                      onChange={(e) => setDontShowAgain(e.target.checked)}
                      className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                    />
                    <span style={{fontSize: '13px'}}>다시보지 않기</span>
                  </label>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
