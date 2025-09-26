"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Car, 
  Heart, 
  Users, 
  ShoppingBag, 
  Smartphone,
  Wifi,
  Bluetooth,
  Play,
  Pause,
  TrendingUp
} from "lucide-react";
import { useAuth } from '@/contexts/AuthContext';
import CommonHeader from '@/components/CommonHeader';
import PageHeader from '@/components/PageHeader';

export default function RemoteControlPage() {
  const { user, logout } = useAuth();


  return (
    <div 
      className="min-h-screen py-16 md:py-24"
      style={{
        background: 'linear-gradient(100deg, #2563eb, #7c3aed, #ec4899)',
        touchAction: 'pan-y',
        overscrollBehavior: 'none'
      }}
    >
      {/* Common Header */}
      <CommonHeader />
      
      <div className="max-w-7xl mx-auto px-0 md:px-8">
        <div className="mb-6 mt-10 px-4 md:px-0">
          <PageHeader 
            title="박스로 무선조종 앱"
            description="스마트폰으로 박스카를 원격 조종하고 게임을 즐겨보세요"
          />
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 px-4 md:px-0">
          <Link href="/draw">
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
              <Car className="w-4 h-4 mr-2" />
              박스카 만들기
            </Button>
          </Link>
        </div>

        {/* App Download Section */}
        <Card className="bg-white border-2 border-white/30 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden py-5 w-full rounded-2xl mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="w-5 h-5" />
              앱 다운로드
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="text-center">
                <div className="w-24 h-24 mx-auto bg-gradient-to-br from-blue-400 to-purple-500 rounded-2xl mb-4 flex items-center justify-center">
                  <Smartphone className="w-12 h-12 text-white" />
                </div>
                <h3 className="text-lg font-semibold mb-2">iOS 앱</h3>
                <p className="text-gray-600 mb-4">App Store에서 다운로드</p>
                <Button className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600">
                  App Store
                </Button>
              </div>
              <div className="text-center">
                <div className="w-24 h-24 mx-auto bg-gradient-to-br from-green-400 to-blue-500 rounded-2xl mb-4 flex items-center justify-center">
                  <Smartphone className="w-12 h-12 text-white" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Android 앱</h3>
                <p className="text-gray-600 mb-4">Google Play에서 다운로드</p>
                <Button className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600">
                  Google Play
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Connection and Control */}
        <Card className="bg-white border-2 border-white/30 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden py-5 w-full rounded-2xl mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wifi className="w-5 h-5" />
              연결 및 조종
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <Wifi className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <h4 className="font-semibold mb-1">WiFi 연결</h4>
                <p className="text-sm text-gray-600">같은 WiFi 네트워크에서 연결</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <Bluetooth className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                <h4 className="font-semibold mb-1">블루투스 연결</h4>
                <p className="text-sm text-gray-600">직접 블루투스로 연결</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <Play className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <h4 className="font-semibold mb-1">즉시 조종</h4>
                <p className="text-sm text-gray-600">연결 후 바로 조종 시작</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <Card className="bg-white border-2 border-white/30 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden py-5 w-full rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Car className="w-5 h-5" />
                조종 기능
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  전진/후진/좌회전/우회전
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  속도 조절 (3단계)
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  조명 제어
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  사운드 효과
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-white border-2 border-white/30 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden py-5 w-full rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                게임 모드
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  자동차 경주
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  장애물 피하기
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  미션 완성
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  멀티플레이어
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* System Requirements */}
        <Card className="bg-white border-2 border-white/30 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden py-5 w-full rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="w-5 h-5" />
              시스템 요구사항
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-3 text-gray-900">iOS</h4>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• iOS 13.0 이상</li>
                  <li>• iPhone 6s 이상</li>
                  <li>• iPad 5세대 이상</li>
                  <li>• WiFi 또는 블루투스 지원</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-3 text-gray-900">Android</h4>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• Android 8.0 이상</li>
                  <li>• RAM 2GB 이상</li>
                  <li>• WiFi 또는 블루투스 지원</li>
                  <li>• OpenGL ES 3.0 지원</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
