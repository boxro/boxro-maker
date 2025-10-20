import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [],
  },
  // 캐시 비활성화
  experimental: {
    staleTimes: {
      dynamic: 0,
      static: 0,
    },
  },
  async redirects() {
    return [
      {
        source: '/gallery',
        destination: '/community',
        permanent: false,
      },
      {
        source: '/gallery/:path*',
        destination: '/community/:path*',
        permanent: false,
      },
    ];
  },
  // prefetch 비활성화로 Failed to fetch 에러 방지
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
  webpack: (config) => {
    // SVG를 React 컴포넌트로 임포트할 수 있도록 설정
    // 예: import Logo from "./logo.svg";
    //     <Logo />
    config.module = config.module || { rules: [] } as any;
    (config.module as any).rules = (config.module as any).rules || [];
    (config.module as any).rules.push({
      test: /\.svg$/,
      issuer: { and: [/{\\.js|\.jsx|\.ts|\.tsx}$/] },
      use: [
        {
          loader: '@svgr/webpack',
          options: { svgo: true },
        },
      ],
    });
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
    };
    return config;
  },
};

export default nextConfig;
