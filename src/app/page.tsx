'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Car, 
  Palette, 
  Download, 
  Share2, 
  Play,
  Sparkles,
  ArrowRight,
  Star,
  Users,
  Heart,
  Smartphone,
  ShoppingBag,
  BookOpen
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import CommonHeader from "@/components/CommonHeader";
import CommonFooter from "@/components/CommonFooter";

export default function HomePage() {

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(100deg, #2563eb, #7c3aed, #ec4899)' }}>
      {/* Common Header */}
      <CommonHeader />

      {/* Main Content with top padding for fixed header */}
      <div className="pt-20">
        {/* Hero Section */}
        <section className="relative overflow-hidden">
          <div className="max-w-6xl mx-auto px-4" style={{ paddingTop: '54px', paddingBottom: '54px' }}>
            <div className="text-center">
              <div className="mb-1 mt-0">
                <div className="relative mx-auto w-[280px] h-[210px] md:w-[360px] md:h-[270px]">
                  {/* 그림자 이미지 (고정) */}
                  <Image 
                    src="/boxro-boxcar-shadow.png" 
                    alt="Boxro Maker Shadow" 
                    width={360} 
                    height={270} 
                    className="w-[280px] h-[210px] md:w-[360px] md:h-[270px] object-contain absolute top-0 left-0"
                    priority
                  />
                  {/* 박스카 이미지 (애니메이션) */}
                  <Image 
                    src="/boxro-boxcar.png" 
                    alt="Boxro Maker Character" 
                    width={360} 
                    height={270} 
                    className="w-[280px] h-[210px] md:w-[360px] md:h-[270px] animate-gentle-bounce object-contain relative z-10"
                    priority
                  />
                </div>
              </div>
              
              <span className="text-[22px] text-white/90 font-bold block mb-[22px] font-cookie-run">
                상상하는 자동차를 만들어보세요✨
              </span>
              
              <p className="text-white/90 max-w-3xl mx-auto leading-relaxed" style={{ marginBottom: '46px', fontSize: '15px' }}>
                아이들이 직접 자동차를 디자인하고,<br />
                박스카 도안을 출력해 조립하며,<br />
                친구들과 공유할 수 있는 창작 놀이 플랫폼입니다.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/draw">
                  <Button size="lg" className="text-white px-12 py-4 text-lg rounded-full min-w-[200px]" style={{ background: 'rgba(0,0,0,0.6)' }}>
                    지금 시작하기
                    <ArrowRight className="w-5 h-5 ml-0" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Cards Section - 통합된 다단 레이아웃 */}
        <section className="py-6 bg-gradient-to-b from-transparent to-white/5 relative">
          <div className="max-w-6xl mx-auto px-4">
            <div 
              className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6"
              style={{ 
                columnGap: '1.5rem'
              }}
            >
              {/* 박스카 그리기 */}
              <Link href="/draw" className="block">
                <Card className="group hover:shadow-xl transition-all duration-300 border-0 border-blue-300/50 shadow-2xl break-inside-avoid mb-6 relative overflow-hidden bg-transparent min-h-[480px] flex flex-col justify-end cursor-pointer">
                  {/* 배경 이미지 */}
                  <div className="absolute inset-0 overflow-hidden">
                    <Image
                      src="/boxro_draw.png"
                      alt="박스카 그리기 배경"
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                    />
                  </div>
                  <CardHeader className="text-center pt-1 pb-2 relative z-10">
                    <CardTitle className="text-[24px] font-bold mb-1 font-cookie-run">
                      <span className="text-white">박스카</span> <span className="text-sky-400">그리기</span>
                    </CardTitle>
                    <p className="text-white/90 leading-relaxed" style={{ fontSize: '15px' }}>
                      상상한 자동차를 직접 그려보세요! <br />
                      화면 위에 쓱쓱, 마음껏 그릴 수 있어요.
                    </p>
                  </CardHeader>
                </Card>
              </Link>

              {/* 출력하기 */}
              <div className="cursor-pointer">
                <Card className="group hover:shadow-xl transition-all duration-300 border-0 border-green-300/50 shadow-2xl break-inside-avoid mb-6 relative overflow-hidden bg-transparent min-h-[480px] flex flex-col justify-end">
                  {/* 배경 이미지 */}
                  <div className="absolute inset-0 overflow-hidden">
                    <Image
                      src="/boxro_print.png"
                      alt="박스카 출력하기 배경"
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                    />
                  </div>
                  <CardHeader className="text-center pt-1 pb-2 relative z-10">
                    <CardTitle className="text-[24px] font-bold mb-1 font-cookie-run">
                      <span className="text-white">도안</span> <span className="text-pink-400">출력하기</span>
                    </CardTitle>
                    <p className="text-white/90 leading-relaxed" style={{ fontSize: '15px' }}>
                      내 그림이 도안으로 변해요! <br />
                      출력해서 진짜 박스카를 만들 수 있어요.
                    </p>
                  </CardHeader>
                </Card>
              </div>

              {/* 박스로 유튜브 영상 */}
              <a 
                href="https://www.youtube.com/channel/UCgSpzmyqcN1pQ3m76SEDGyA"
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <Card className="group hover:shadow-xl transition-all duration-300 border-0 border-red-300/50 shadow-2xl break-inside-avoid mb-6 relative overflow-hidden bg-transparent min-h-[480px] flex flex-col justify-end cursor-pointer">
                  {/* 배경 이미지 */}
                  <div className="absolute inset-0 overflow-hidden">
                    <Image
                      src="/boxro_youtube.png"
                      alt="박스로 유튜브 영상 배경"
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                    />
                  </div>
                  
                  {/* 플레이 버튼 */}
                  <div className="absolute inset-0 flex items-center justify-center z-20">
                    <div className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-2xl">
                      <Play className="w-8 h-8 text-white ml-1" />
                    </div>
                  </div>
                  
                  <CardHeader className="text-center pt-1 pb-2 relative z-10">
                    <CardTitle className="text-[24px] font-bold text-white mb-1 font-cookie-run">
                      <span className="text-white">박스로</span> <span className="text-red-500">유튜브 영상</span>
                    </CardTitle>
                    <p className="text-white/90 leading-relaxed" style={{ fontSize: '15px' }}>
                      박스로만의 특별한 콘텐츠를 만나보세요! <br />
                      영상으로 쉽게 확인할 수 있어요.
                    </p>
                  </CardHeader>
                </Card>
              </a>

              {/* 박스로 무선조종 앱 */}
              <Link href="/remote-control" className="block">
                <Card className="group hover:shadow-xl transition-all duration-300 border-0 border-blue-300/50 shadow-2xl break-inside-avoid mb-6 relative overflow-hidden bg-transparent min-h-[480px] flex flex-col justify-end cursor-pointer">
                  {/* 배경 이미지 */}
                  <div className="absolute inset-0 overflow-hidden">
                    <Image
                      src="/boxro_remote.png"
                      alt="박스로 무선조종 앱 배경"
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                    />
                  </div>
                  <CardHeader className="text-center pt-1 pb-2 relative z-10">
                    <CardTitle className="text-[24px] font-bold text-white mb-1 font-cookie-run">
                      <span className="text-white">박스로</span> <span className="bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">무선조종 앱</span>
                    </CardTitle>
                    <p className="text-white/90 leading-relaxed" style={{ fontSize: '15px' }}>
                      스마트폰으로 내 박스카를 조종해보세요! <br />
                      새롭고 신나는 경험이 기다리고 있어요.
                    </p>
                  </CardHeader>
                </Card>
              </Link>

              {/* Boxro Store */}
              <Link href="/store" className="block">
                <Card className="group hover:shadow-xl transition-all duration-300 border-0 border-orange-300/50 shadow-2xl break-inside-avoid mb-6 relative overflow-hidden bg-transparent min-h-[480px] flex flex-col justify-end cursor-pointer">
                  {/* 배경 이미지 */}
                  <div className="absolute inset-0 overflow-hidden">
                    <Image
                      src="/boxro_store.png"
                      alt="박스로 스토어 배경"
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                    />
                  </div>
                  <CardHeader className="text-center pt-1 pb-2 relative z-10">
                    <CardTitle className="text-[24px] font-bold text-white mb-1 font-cookie-run">
                      <span className="text-white">박스로</span> <span className="bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">스토어</span>
                    </CardTitle>
                    <p className="text-white/90 leading-relaxed" style={{ fontSize: '15px' }}>
                      다양한 박스카 도안을 살펴보세요! <br />
                      내 손으로 멋진 작품을 완성할 수 있어요
                    </p>
                  </CardHeader>
                </Card>
              </Link>
              
              {/* 지구를 지키는 놀이 카드 */}
              <Link href="/earth-play" className="block w-full">
                <Card className="group hover:shadow-xl transition-all duration-300 border-0 border-green-300/50 shadow-2xl break-inside-avoid mb-6 relative overflow-hidden bg-transparent min-h-[480px] flex flex-col justify-end cursor-pointer">
                  {/* 배경 이미지 */}
                  <div className="absolute inset-0 overflow-hidden">
                    <Image
                      src="/boxro_green.png"
                      alt="지구를 지키는 놀이 배경"
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                    />
                  </div>
                  <CardHeader className="text-center pt-1 pb-2 relative z-10">
                    <CardTitle className="text-[24px] font-bold text-white mb-1 font-cookie-run">
                      <span className="text-white">지구를 지키는</span> <span className="text-green-400">놀이</span>
                    </CardTitle>
                    <p className="text-white/90 leading-relaxed" style={{ fontSize: '15px' }}>
                      버려지는 박스로 멋진 자동차를 만들며, <br />
                      자원도 아끼고 환경도 지켜요.
                    </p>
                  </CardHeader>
                </Card>
              </Link>
            </div>
          </div>
        </section>

        <CommonFooter />
      </div>
    </div>
  );
}