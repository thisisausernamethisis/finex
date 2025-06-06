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
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Optimize for serverless functions
      config.externals = [...config.externals, '@prisma/client']
    }
    return config
  }
}

module.exports = nextConfig