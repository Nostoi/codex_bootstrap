/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',

  // Skip ESLint during build in production
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Skip TypeScript checking during build in production
  typescript: {
    ignoreBuildErrors: true,
  },

  // Performance optimizations for ADHD-friendly experience
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['@/components', '@/lib', '@/hooks'],
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  },

  // Compression and caching
  compress: true,
  poweredByHeader: false,

  // Bundle optimization
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Bundle analyzer in development
    if (dev && !isServer) {
      const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: 'server',
          analyzerPort: 8888,
          openAnalyzer: false,
        })
      );
    }

    // Optimize chunk splitting for better caching and ADHD performance
    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        maxSize: 300000, // 300KB max chunk size for ADHD-friendly loading
        cacheGroups: {
          // Critical path - core ADHD functionality
          critical: {
            test: /[\\/]src[\\/](components[\\/](ui[\\/](Button|Input|Select|Badge)|layout)|hooks[\\/](useTask|useApi|useAuth))[\\/]/,
            name: 'critical',
            priority: 30,
            chunks: 'all',
            enforce: true,
          },
          // React framework - separate for caching
          react: {
            test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
            name: 'react',
            priority: 25,
            chunks: 'all',
            enforce: true,
          },
          // Zustand state management - separate for frequent updates
          state: {
            test: /[\\/]node_modules[\\/](zustand|immer)[\\/]/,
            name: 'state',
            priority: 24,
            chunks: 'all',
          },
          // UI libraries - icons, animations, etc
          ui: {
            test: /[\\/]node_modules[\\/](lucide-react|@radix-ui|tailwind|daisyui)[\\/]/,
            name: 'ui',
            priority: 23,
            chunks: 'all',
          },
          // Analytics and advanced features - lazy load
          analytics: {
            test: /[\\/]src[\\/](components[\\/](analytics|insights)|lib[\\/](analytics|tracking))[\\/]/,
            name: 'analytics',
            priority: 15,
            chunks: 'async',
          },
          // Calendar and integrations - lazy load
          calendar: {
            test: /[\\/]src[\\/](components[\\/]calendar|lib[\\/](calendar|google|microsoft))[\\/]/,
            name: 'calendar',
            priority: 14,
            chunks: 'async',
          },
          // AI features - lazy load
          ai: {
            test: /[\\/](src[\\/](components[\\/]ai|lib[\\/]ai)|node_modules[\\/](@openai|openai))[\\/]/,
            name: 'ai',
            priority: 13,
            chunks: 'async',
          },
          // Main vendor bundle - remaining third party
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            priority: 10,
            chunks: 'all',
            maxSize: 200000, // 200KB max for vendor chunks
          },
          // Common app code
          common: {
            test: /[\\/]src[\\/]/,
            name: 'common',
            minChunks: 2,
            priority: 5,
            chunks: 'all',
            maxSize: 150000, // 150KB max for common chunks
          },
        },
      };
    }

    // Tree shaking optimization - only in production to avoid turbo conflicts
    if (!dev) {
      config.optimization.usedExports = true;
      config.optimization.sideEffects = false;
    }

    // Service Worker support
    if (!isServer && !dev) {
      config.plugins.push(
        new webpack.DefinePlugin({
          'process.env.SW_ENABLED': JSON.stringify(true),
        })
      );
    }

    return config;
  },

  // Headers for performance and security with CDN optimization
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
          {
            key: 'Service-Worker-Allowed',
            value: '/',
          },
        ],
      },
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
          {
            key: 'CDN-Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/images/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, stale-while-revalidate=3600',
          },
          {
            key: 'CDN-Cache-Control',
            value: 'public, max-age=2592000', // 30 days for CDN
          },
        ],
      },
      {
        source: '/fonts/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
          {
            key: 'CDN-Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=300, stale-while-revalidate=60',
          },
          {
            key: 'CDN-Cache-Control',
            value: 'public, max-age=60', // Shorter CDN cache for API
          },
        ],
      },
    ];
  },

  // API rewrites
  async rewrites() {
    const backendUrl =
      process.env.NODE_ENV === 'production'
        ? 'http://backend:8000' // Docker container name for production
        : process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:3501'; // Development

    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },

  // Image optimization for faster loading with CDN support
  images: {
    domains: ['localhost', 'codex-bootstrap.com', 'cdn.codex-bootstrap.com'],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 86400, // 24 hours
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    // CDN-optimized image settings for ADHD-friendly fast loading
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    loader: process.env.NODE_ENV === 'production' ? 'custom' : 'default',
    loaderFile: process.env.NODE_ENV === 'production' ? './lib/cdn-image-loader.js' : undefined,
  },

  // Redirects for better UX
  async redirects() {
    return [
      {
        source: '/home',
        destination: '/',
        permanent: true,
      },
    ];
  },

  // Environment variables for runtime
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },

  // Static optimization
  trailingSlash: false,

  // Development improvements
  ...(process.env.NODE_ENV === 'development' && {
    onDemandEntries: {
      maxInactiveAge: 25 * 1000,
      pagesBufferLength: 2,
    },
  }),
};

module.exports = nextConfig;
