import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { StoryProvider } from "@/contexts/StoryContext";
import OnboardingWrapper from "@/components/OnboardingWrapper";
import ConditionalPWA from "@/components/ConditionalPWA";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";

const inter = Inter({ subsets: ["latin"] });


export const metadata: Metadata = {
  title: "BOXRO 박스로 | Eco-Friendly Maker Project",
  description: "버려진 박스로 자동차를 만들고, 상상력을 움직이는 친환경 놀이 플랫폼",
  openGraph: {
    title: "BOXRO 박스로 | Eco-Friendly Maker Project",
    description: "버려진 박스로 자동차를 만들고, 상상력을 움직이는 친환경 놀이 플랫폼",
    siteName: "BOXRO 박스로 | Eco-Friendly Maker Project",
    type: "website",
    locale: "ko_KR",
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'BOXRO 박스로 | Eco-Friendly Maker Project',
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "BOXRO 박스로 | Eco-Friendly Maker Project",
    description: "버려진 박스로 자동차를 만들고, 상상력을 움직이는 친환경 놀이 플랫폼",
    images: ['/og-image.png'],
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
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;700;900&display=swap" 
          rel="stylesheet" 
        />
        <link 
          href="https://fonts.googleapis.com/css2?family=Nanum+Gothic:wght@400;700;800&display=swap" 
          rel="stylesheet" 
        />
        <link 
          href="https://fonts.googleapis.com/css2?family=CookieRun:wght@400;700;900&display=swap" 
          rel="stylesheet" 
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#3b82f6" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="박스로" />
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
              </OnboardingWrapper>
            </StoryProvider>
          </LanguageProvider>
        </AuthProvider>
      </body>
    </html>
  );
}