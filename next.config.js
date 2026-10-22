/** @type {import('next').NextConfig} */
const nextConfig = {
  // Imagen Docker (Dokploy): server minimo en .next/standalone. En Vercel se ignora.
  output: 'standalone',
  experimental: {
    // Tree-shaking selectivo: solo importa lo usado de estos paquetes, evita código muerto.
    optimizePackageImports: [
      'lucide-react',
      'react-icons',
      'recharts',
      'date-fns',
      '@radix-ui/react-icons'
    ]
  },
  async headers() {
    // Áreas privadas: nunca deben indexarse aunque alguien enlace a ellas.
    const noindex = [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }]
    return ['/dashboard', '/admin', '/api', '/login', '/register', '/reset_password', '/hse', '/maintenance'].map(
      (base) => ({ source: `${base}/:path*`, headers: noindex })
    )
  },
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
        hostname: 'cc-s3.31.97.42.82.sslip.io',
        pathname: '/**'
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
