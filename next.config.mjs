const nextConfig = {
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
      // 영구 리디렉션 (308) - Google이 최종 목적지를 색인하도록
      { source: '/gallery', destination: '/community', permanent: true },
      { source: '/gallery/:path*', destination: '/community/:path*', permanent: true },
    ];
  },
  // prefetch 비활성화로 Failed to fetch 에러 방지
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
  webpack: (config) => {
    // Typescript paths(@/*) 별칭을 Webpack에도 반영
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      '@': new URL('./src', import.meta.url).pathname,
    };
    // SVG를 React 컴포넌트로 임포트할 수 있도록 설정
    config.module = config.module || { rules: [] };
    config.module.rules = config.module.rules || [];
    config.module.rules.push({
      test: /\.svg$/,
      issuer: /\.[jt]sx?$/,
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


