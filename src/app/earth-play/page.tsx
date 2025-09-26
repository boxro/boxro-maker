'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  ArrowLeft,
  Recycle,
  Leaf,
  Car,
  Download,
  Target,
  Palette,
  Smartphone,
  Users
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import CommonHeader from "@/components/CommonHeader";


export default function EarthPlayPage() {
  const { user, logout } = useAuth();


  return (
    <div className="min-h-screen py-16" style={{ background: 'linear-gradient(100deg, #2563eb, #7c3aed, #ec4899)' }}>
      {/* Common Header */}
      <CommonHeader />

      {/* Main Content with top padding for fixed header */}
      <div className="pt-20">

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 py-16">
          <div className="text-center">
            <div className="mb-8">
              <div className="w-24 h-24 mx-auto bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mb-6">
                <span className="text-4xl">🌍</span>
              </div>
            </div>
            
            <h1 className="text-[42px] font-bold text-white mb-6 leading-tight font-cookie-run">
              <span className="bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                🌍 지구를 지키는 놀이
              </span>
            </h1>
            
            <p className="text-white/90 max-w-3xl mx-auto leading-relaxed text-lg mb-8">
              버려진 박스의 변신
            </p>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-12 bg-gradient-to-b from-transparent to-white/5 relative">
        <div className="max-w-4xl mx-auto px-4">
          <div className="space-y-12">
            
            {/* 첫 번째 섹션 */}
            <Card className="bg-white/10 backdrop-blur-sm border border-white/20 shadow-2xl">
              <CardContent className="p-8">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-white mb-6 font-cookie-run">
                    버려진 박스의 변신
                  </h2>
                  <p className="text-white/90 text-lg leading-relaxed mb-6">
                    택배 상자, 포장 상자… 그냥 버리면 쓰레기지만,<br />
                    박스로에서는 멋진 자동차로 다시 태어나요!
                  </p>
                  <div className="w-16 h-1 bg-gradient-to-r from-green-400 to-emerald-400 mx-auto"></div>
                </div>
              </CardContent>
            </Card>

            {/* 두 번째 섹션 */}
            <Card className="bg-white/10 backdrop-blur-sm border border-white/20 shadow-2xl">
              <CardContent className="p-8">
                <div className="text-center">
                  <div className="flex items-center justify-center mb-6">
                    <Recycle className="w-8 h-8 text-green-400 mr-3" />
                    <h2 className="text-2xl font-bold text-white font-cookie-run">
                      자원을 아끼는 작은 실천 ♻️
                    </h2>
                  </div>
                  <p className="text-white/90 text-lg leading-relaxed mb-6">
                    새 상자를 만들 땐 많은 탄소가 발생해요.<br />
                    하지만 이미 있는 박스를 사용하면
                  </p>
                  <div className="flex justify-center space-x-8 mb-6">
                    <div className="text-center">
                      <Leaf className="w-12 h-12 text-green-400 mx-auto mb-2" />
                      <p className="text-white/90">🌱 나무도 지키고,</p>
                    </div>
                    <div className="text-center">
                      <Recycle className="w-12 h-12 text-green-400 mx-auto mb-2" />
                      <p className="text-white/90">🌱 쓰레기도 줄일 수 있죠.</p>
                    </div>
                  </div>
                  <div className="w-16 h-1 bg-gradient-to-r from-green-400 to-emerald-400 mx-auto"></div>
                </div>
              </CardContent>
            </Card>

            {/* 세 번째 섹션 */}
            <Card className="bg-white/10 backdrop-blur-sm border border-white/20 shadow-2xl">
              <CardContent className="p-8">
                <div className="text-center">
                  <div className="flex items-center justify-center mb-6">
                    <Car className="w-8 h-8 text-blue-400 mr-3" />
                    <h2 className="text-2xl font-bold text-white font-cookie-run">
                      놀이 속에서 배우는 가치 🚗✨
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="text-center">
                      <Palette className="w-12 h-12 text-blue-400 mx-auto mb-3" />
                      <p className="text-white/90">상상한 자동차를 그려요.</p>
                    </div>
                    <div className="text-center">
                      <Download className="w-12 h-12 text-blue-400 mx-auto mb-3" />
                      <p className="text-white/90">도안으로 만들고 조립해요.</p>
                    </div>
                    <div className="text-center">
                      <span className="text-4xl mb-3 block">🎨</span>
                      <p className="text-white/90">색과 휠, 뱃지로 꾸며요.</p>
                    </div>
                    <div className="text-center">
                      <Smartphone className="w-12 h-12 text-blue-400 mx-auto mb-3" />
                      <p className="text-white/90">스마트폰으로 움직여요.</p>
                    </div>
                  </div>
                  <p className="text-white/90 text-lg leading-relaxed mb-6">
                    즐겁게 놀면서 환경도 함께 배울 수 있어요.
                  </p>
                  <div className="w-16 h-1 bg-gradient-to-r from-green-400 to-emerald-400 mx-auto"></div>
                </div>
              </CardContent>
            </Card>

            {/* 네 번째 섹션 */}
            <Card className="bg-white/10 backdrop-blur-sm border border-white/20 shadow-2xl">
              <CardContent className="p-8">
                <div className="text-center">
                  <div className="flex items-center justify-center mb-6">
                    <Users className="w-8 h-8 text-pink-400 mr-3" />
                    <h2 className="text-2xl font-bold text-white font-cookie-run">
                      엄마 아빠와 함께 👨‍👩‍👧
                    </h2>
                  </div>
                  <p className="text-white/90 text-lg leading-relaxed mb-6">
                    아이에겐 만드는 재미,<br />
                    부모에겐 환경 교육의 기회.<br />
                    완성된 박스카는 놀이가 끝나면<br />
                    다시 재활용할 수도 있어요!
                  </p>
                  <div className="w-16 h-1 bg-gradient-to-r from-green-400 to-emerald-400 mx-auto"></div>
                </div>
              </CardContent>
            </Card>

            {/* 다섯 번째 섹션 */}
            <Card className="bg-white/10 backdrop-blur-sm border border-white/20 shadow-2xl">
              <CardContent className="p-8">
                <div className="text-center">
                  <div className="flex items-center justify-center mb-6">
                    <Target className="w-8 h-8 text-yellow-400 mr-3" />
                    <h2 className="text-2xl font-bold text-white font-cookie-run">
                      박스로의 약속 🎯
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div className="text-center">
                      <Recycle className="w-12 h-12 text-yellow-400 mx-auto mb-3" />
                      <p className="text-white/90 text-lg">다시 쓰고 ♻️</p>
                    </div>
                    <div className="text-center">
                      <span className="text-4xl mb-3 block">🎉</span>
                      <p className="text-white/90 text-lg">즐겁게 놀고 🎉</p>
                    </div>
                    <div className="text-center">
                      <span className="text-4xl mb-3 block">🌍</span>
                      <p className="text-white/90 text-lg">지구도 지키는 🌍</p>
                    </div>
                  </div>
                  <p className="text-white/90 text-lg leading-relaxed mb-6">
                    👉 박스로는 지속 가능한 놀이를 만들어 갑니다.
                  </p>
                  <div className="w-16 h-1 bg-gradient-to-r from-green-400 to-emerald-400 mx-auto"></div>
                </div>
              </CardContent>
            </Card>

            {/* CTA Section */}
            <div className="text-center">
              <Link href="/draw">
                <Button size="lg" className="text-white px-8 py-4 text-lg rounded-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700">
                  지금 시작하기
                  <ArrowLeft className="w-5 h-5 ml-2 rotate-180" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
      </div>
    </div>
  );
}
