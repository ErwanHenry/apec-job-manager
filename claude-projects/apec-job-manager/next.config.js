/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  poweredByHeader: false,

  // Vercel optimization
  experimental: {
    optimizePackageImports: ['@headlessui/react', '@heroicons/react'],
  },

  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'apec.fr',
      },
    ],
  },

  // Security headers
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
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ];
  },

  // Environment variables exposed to the browser
  env: {
    NEXT_PUBLIC_APP_NAME: 'APEC Job Manager',
    NEXT_PUBLIC_APP_VERSION: '2.0.0',
  },
};

module.exports = nextConfig;
