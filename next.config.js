/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // domains: ['zktcbhhlcksopklpnubj.supabase.co', 'th.bing.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'zktcbhhlcksopklpnubj.supabase.co',
        pathname: '/storage/v1/object/public/**'
      },
      {
        protocol: 'https',
        hostname: 'th.bing.com'
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '54321',
        pathname: '/storage/v1/object/public/**'
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '54321',
        pathname: '/storage/v1/object/public/**'
      }
    ]
  }
}

module.exports = nextConfig
