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
import CommonBackground from "@/components/CommonBackground";
import HomeStoryCards from "@/components/HomeStoryCards";

export default function HomePage() {

  return (
    <CommonBackground>
      {/* Common Header */}
      <CommonHeader />

      {/* Main Content with top padding for fixed header */}
      <div className="pt-16 flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden">
          <div className="max-w-6xl mx-auto px-4" style={{ paddingTop: '-20px', paddingBottom: '36px' }}>
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
              
              <span className="text-[22px] sm:text-[30px] text-white/90 font-bold block mb-[22px] font-cookie-run">
                상상하는 자동차를 만들어보세요✨
              </span>
              
              <p className="text-white/90 max-w-3xl mx-auto leading-relaxed" style={{ marginBottom: '46px', fontSize: '14px' }}>
                아이들이 직접 자동차를 디자인하고,<br />
                박스카 도안을 출력해 조립하며,<br />
                친구들과 공유할 수 있는 창작 놀이 플랫폼입니다.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/draw">
                  <Button size="lg" className="text-white px-12 py-4 text-lg rounded-full min-w-[200px] hover:scale-103 transition-all duration-200" style={{ backgroundColor: '#26085e' }}>
                    무료로 시작하기
                    <ArrowRight className="w-5 h-5 ml-0" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Cards Section - 통합된 다단 레이아웃 */}
        <section className="py-6 relative">
          <div className="max-w-6xl mx-auto px-4">
            <div className="columns-1 md:columns-2 lg:columns-3 gap-3 space-y-3">

              {/* 박스카 이야기 카드들 */}
              <HomeStoryCards />

            </div>
          </div>
        </section>

        <CommonFooter />
      </div>
    </CommonBackground>
  );
}