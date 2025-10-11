"use client";

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

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
    detailText: "색깔 펜으로 그리고, 지우개로 수정할 수 있어요.",
    visual: "✏️🎨",
    bgColor: "from-blue-500 to-cyan-500"
  },
  {
    id: 2,
    title: "3D 미리보기",
    mainText: "내가 그린 자동차가 3D로 짠! 🎉",
    subText: "AI가 그림을 분석해 멋진 박스카로 변신시켜요.",
    detailText: "마음에 안 들면 다른 차종으로 쓱 바꿔보세요!",
    visual: "🔄✨",
    bgColor: "from-purple-500 to-pink-500"
  },
  {
    id: 3,
    title: "박스카 꾸미기",
    mainText: "빛나는 휠, 멋진 램프, 나만의 컬러까지 💫",
    subText: "360° 돌려보며 나만의 스타일을 완성해요.",
    visual: "🎨⚡",
    bgColor: "from-green-500 to-emerald-500"
  },
  {
    id: 4,
    title: "박스카 도안 완성!",
    mainText: "내가 그린 자동차가 도안으로 쏙! 🧩",
    subText: "인쇄해서 조립하면 진짜 박스카 완성!",
    detailText: "친구들과 공유하고 자랑해보세요.",
    visual: "📄✂️",
    bgColor: "from-orange-500 to-red-500"
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
      <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 max-w-md sm:max-w-lg w-full mx-2 sm:mx-6 relative h-[500px] flex flex-col">
        {/* 닫기 버튼 */}
        <div className="absolute top-2 right-4 z-10">
          <button
            onClick={handleSkip}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold flex-shrink-0"
          >
            ×
          </button>
        </div>

        <div className="p-4 sm:p-6 flex-1 flex flex-col">
          {/* 진행 표시 */}
          <div className="flex justify-center mb-6">
            <div className="flex space-x-2">
              {tutorialSteps.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentStep ? 'bg-purple-500' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* 메인 콘텐츠 */}
          <div className="text-center mb-8 flex-1 flex flex-col justify-center">
            {/* 비주얼 아이콘 */}
            <div className="text-6xl mb-4">
              {currentTutorial.visual}
            </div>

            {/* 제목 */}
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4" style={{fontFamily: 'CookieRun, sans-serif'}}>
              {currentTutorial.title}
            </h2>

            {/* 메인 텍스트 */}
            <p className="text-base sm:text-lg text-gray-800 mb-3" style={{fontSize: '16px'}}>
              {currentTutorial.mainText}
            </p>

            {/* 서브 텍스트 */}
            <p className="text-gray-700 mb-2 text-sm sm:text-base" style={{fontSize: '14px'}}>
              {currentTutorial.subText}
            </p>

            {/* 디테일 텍스트 */}
            {currentTutorial.detailText && (
              <p className="text-gray-600 text-xs sm:text-sm">
                {currentTutorial.detailText}
              </p>
            )}
          </div>

          {/* 버튼들 */}
          <div className="flex gap-3">
            {currentStep > 0 && (
            <Button
              variant="outline"
              onClick={handlePrev}
              className="flex-1 border-2 border-gray-200 hover:bg-gray-50 hover:border-gray-300 rounded-full text-gray-900 text-sm sm:text-base"
              style={{fontSize: '14px'}}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              이전
            </Button>
            )}

            <Button
              onClick={handleNext}
              className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-full text-sm sm:text-base"
              style={{fontSize: '14px'}}
            >
              {isLastStep ? (
                <>
                  지금 나만의 박스카를 만들어볼까요?
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
          <div className="mt-4">
            <label className="flex items-center justify-center space-x-2 text-gray-700">
              <input
                type="checkbox"
                checked={dontShowAgain}
                onChange={(e) => setDontShowAgain(e.target.checked)}
                className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
              />
              <span className="text-xs sm:text-sm" style={{fontSize: '12px'}}>다시보지 않기</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
