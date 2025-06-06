/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Ensure middleware runs on Edge Runtime for better performance
    serverComponentsExternalPackages: ['@prisma/client'],
  },
  // Optimize for Vercel Edge Runtime
  trailingSlash: false,
  poweredByHeader: false,
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