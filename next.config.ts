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
  async redirects() {
    return [
      // 영구 리디렉션 (308) - Google이 최종 목적지를 색인하도록
      {
        source: '/gallery',
        destination: '/community',
        permanent: true,
      },
      {
        source: '/gallery/:path*',
        destination: '/community/:path*',
        permanent: true,
      },
    ];
  },
  experimental: {
    staleTimes: {
      dynamic: 0,
      static: 0,
    },
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  },
  // prefetch 비활성화로 Failed to fetch 에러 방지
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
    };
    return config;
  },
};

export default nextConfig;
