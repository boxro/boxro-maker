import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { MagazineProvider } from "@/contexts/MagazineContext";

const inter = Inter({ subsets: ["latin"] });


export const metadata: Metadata = {
  title: "박스로 메이커",
  description: "상상하는 자동차를 만들어보세요!",
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
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className={inter.className}>
        <AuthProvider>
          <LanguageProvider>
            <MagazineProvider>
              {children}
            </MagazineProvider>
          </LanguageProvider>
        </AuthProvider>
      </body>
    </html>
  );
}