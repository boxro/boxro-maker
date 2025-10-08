"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { X, Car, Palette, Download } from "lucide-react";
import Image from "next/image";

interface DrawSplashScreenProps {
  onClose: () => void;
  onSignUp: () => void;
}

export default function DrawSplashScreen({ onClose, onSignUp }: DrawSplashScreenProps) {
  // 스크롤 방지
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-pink-900/20 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden py-0">
        <CardContent className="p-0">
          {/* 닫기 버튼 */}
          <div className="absolute top-2 right-4 z-10">
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl font-bold flex-shrink-0"
            >
              ×
            </button>
          </div>

          {/* 상단 이미지 영역 */}
          <div className="relative w-full h-[230px] sm:h-64 md:h-80">
            <Image
              src="/draw-boxro.png"
              alt="박스카 그리기 일러스트"
              fill
              className="object-cover"
              priority
            />
          </div>

          {/* 하단 콘텐츠 영역 */}
          <div className="p-8">
            {/* 타이틀 */}
            <div className="text-center mb-6">
              <h2 className="text-[22px] font-bold text-gray-800 mb-4 font-cookie-run">
                <span className="block md:inline">내 박스카,</span>
                <span className="block md:inline"> 오래 간직하고 싶나요? 🚗✨</span>
              </h2>
            </div>

            {/* 설명 */}
            <div className="text-center mb-8">
              <p className="text-gray-700 text-[15px] leading-relaxed">
                누구나 자유롭게 그리고 꾸밀 수 있어요!<br />
                하지만 도안 저장과 다운로드는<br />
                <span className="font-semibold text-blue-600">회원만 이용할 수 있어요.</span>
              </p>
            </div>

            {/* 버튼들 */}
            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <Button
                variant="outline"
                onClick={onClose}
                className="flex-1 border-2 border-gray-200 hover:bg-gray-50 hover:border-gray-300 rounded-full"
              >
                그냥 그리기 (가입 없이 체험)
              </Button>
              <Button
                onClick={onSignUp}
                className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-full"
              >
                저장하고 싶어요 (회원 가입)
              </Button>
            </div>

          </div>
        </CardContent>
      </Card>
    </div>
  );
}
