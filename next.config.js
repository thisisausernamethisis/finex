/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Ensure middleware runs on Edge Runtime for better performance
    serverComponentsExternalPackages: ['@prisma/client'],
  },
  // Optimize for Vercel Edge Runtime
  trailingSlash: false,
  poweredByHeader: false,
  // Cache control headers
  headers: async () => {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
          {
            key: 'X-Cache-Bust',
            value: process.env.CACHE_BUST_VERSION || process.env.DEPLOYMENT_TRIGGER || new Date().toISOString(),
          },
        ],
      },
    ]
  },
  // Webpack configuration for Edge Runtime compatibility
  webpack: (config, { isServer, nextRuntime }) => {
    if (isServer && nextRuntime === 'nodejs') {
      // Only externalize for Node.js runtime, not Edge Runtime
      config.externals.push('@prisma/client')
    }
    return config
  }
}

module.exports = nextConfig