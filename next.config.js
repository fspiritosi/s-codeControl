/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // domains: ['zktcbhhlcksopklpnubj.supabase.co', 'th.bing.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'zktcbhhlcksopklpnubj.supabase.co'
      },
      {
        protocol: 'https',
        hostname: 'th.bing.com'
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1'
      }
    ]
  }
}

module.exports = nextConfig
