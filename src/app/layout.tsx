import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { StoryProvider } from "@/contexts/StoryContext";
import OnboardingWrapper from "@/components/OnboardingWrapper";
import ConditionalPWA from "@/components/ConditionalPWA";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import ServiceWorkerUpdate from "@/components/ServiceWorkerUpdate";
import KakaoInAppRedirect from "@/components/KakaoInAppRedirect";

const inter = Inter({ subsets: ["latin"] });


export const metadata: Metadata = {
  metadataBase: new URL(process.env.NODE_ENV === 'production' ? 'https://boxro.vercel.app' : 'http://localhost:3000'),
  title: "BOXRO 박스로 | AI가 아이의 그림을 박스카로 만들어주는 창작 플랫폼",
  description: "아이가 그린 자동차를 AI가 도안으로 만들어줘요. 상상한 그림이 진짜 박스카로 변신하는 즐거운 창작 놀이터! 🚗✨",
  alternates: {
    canonical: process.env.NEXT_PUBLIC_SITE_URL || 'https://boxro.vercel.app',
  },
  openGraph: {
    title: "BOXRO 박스로 | AI가 아이의 그림을 박스카로 만들어주는 창작 플랫폼",
    description: "아이가 그린 자동차를 AI가 도안으로 만들어줘요.\n상상한 그림이 진짜 박스카로 변신하는 즐거운 창작 놀이터! 🚗✨",
    siteName: "BOXRO 박스로 | Eco-Friendly Maker Project",
    type: "website",
    locale: "ko_KR",
    images: [
      {
        url: 'https://boxro.vercel.app/og-image.png',
        width: 1200,
        height: 630,
        alt: 'BOXRO 박스로 | Eco-Friendly Maker Project',
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "BOXRO 박스로 | AI가 아이의 그림을 박스카로 만들어주는 창작 플랫폼",
    description: "아이가 그린 자동차를 AI가 도안으로 만들어줘요. 상상한 그림이 진짜 박스카로 변신하는 즐거운 창작 놀이터! 🚗✨",
    images: ['https://boxro.vercel.app/og-image.png'],
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon.png', type: 'image/png' }
    ],
    shortcut: '/favicon.png',
    apple: '/favicon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <link 
          href="https://fonts.googleapis.com/css2?family=Nanum+Gothic:wght@400;700;800&display=swap" 
          rel="stylesheet" 
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#2563eb" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="BOXRO" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body className={inter.className}>
        <AuthProvider>
          <LanguageProvider>
            <StoryProvider>
              <OnboardingWrapper>
                {children}
                <ConditionalPWA />
                <PWAInstallPrompt />
                <ServiceWorkerUpdate />
                <KakaoInAppRedirect />
              </OnboardingWrapper>
            </StoryProvider>
          </LanguageProvider>
        </AuthProvider>
      </body>
    </html>
  );
}