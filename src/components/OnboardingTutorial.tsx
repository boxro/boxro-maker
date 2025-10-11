"use client";

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";

interface OnboardingTutorialProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
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

export default function OnboardingTutorial({ isOpen, onClose, onComplete }: OnboardingTutorialProps) {
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

  const handleComplete = () => {
    if (dontShowAgain) {
      localStorage.setItem('onboarding_completed', 'true');
    }
    onComplete();
    onClose();
  };

  const handleSkip = () => {
    onClose();
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
          <div className="px-8 pt-8 pb-6 flex flex-col flex-1">
            {/* 상단 콘텐츠 */}
            <div className="flex-1">
              {/* 진행 표시 */}
              <div className="flex justify-center items-center mb-4">
                <div className="flex space-x-2 items-center">
                  {tutorialSteps.map((_, index) => (
                    <div
                      key={index}
                      className={`rounded-full transition-all duration-200 ${
                        index === currentStep 
                          ? 'w-3 h-3 bg-purple-500' 
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
                <p className="text-gray-900 mb-0" style={{fontSize: '15px'}}>
                  {currentTutorial.subText}
                </p>

                {/* 디테일 텍스트 */}
                {currentTutorial.detailText && (
                  <p className="text-gray-900" style={{fontSize: '15px'}}>
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
                  className="flex-1 border-2 border-gray-200 hover:bg-gray-50 hover:border-gray-300 rounded-full text-gray-900"
                  style={{fontSize: '15px'}}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  이전
                </Button>
                )}

                <Button
                  onClick={handleNext}
                  className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-full"
                  style={{fontSize: '15px'}}
                >
                  {isLastStep ? (
                    <>
                      지금 시작하기
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </>
                  ) : (
                    <>
                      다음
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </>
                  )}
                </Button>
              </div>

              {/* 하단 체크박스 (모든 단계에서 표시) */}
              <div>
                <label className="flex items-center justify-center space-x-2 text-gray-700">
                  <input
                    type="checkbox"
                    checked={dontShowAgain}
                    onChange={(e) => setDontShowAgain(e.target.checked)}
                    className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                  />
                    <span style={{fontSize: '13px'}}>다시보지 않기</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
