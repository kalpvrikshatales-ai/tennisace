const { withSentryConfig } = require('@sentry/nextjs')

const nextConfig = {
  // Enable React strict mode for development
  reactStrictMode: true,

  // Image optimization
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      { protocol: 'http', hostname: 'localhost' },
    ],
  },

  // Compression
  compress: true,

  // Headers for caching
  headers: async () => {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, stale-while-revalidate=86400',
          },
        ],
      },
    ]
  },

  // Environment variables
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
    NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
  },
}

// Wrap with Sentry config
const sentryWebpackPluginOptions = {
  silent: true,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  hideSourceMaps: true,
  skipSourceMapUpload: !process.env.SENTRY_AUTH_TOKEN,
  dryRun: !process.env.SENTRY_AUTH_TOKEN,
}

module.exports = withSentryConfig(nextConfig, sentryWebpackPluginOptions)
