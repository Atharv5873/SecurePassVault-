/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    const apiBaseUrl = process.env.API_BASE_URL || 'https://securepassvault-1.onrender.com';
    console.log('API Base URL:', apiBaseUrl);

    return [
      {
        source: '/credentials',
        destination: `${apiBaseUrl}/credentials/`,
      },
      {
        source: '/auth/:path*',
        destination: `${apiBaseUrl}/auth/:path*`
      },
      {
        source: '/admin/:path*',
        destination: `${apiBaseUrl}/admin/:path*`
      },
      {
        source: '/credentials/:path*',
        destination: `${apiBaseUrl}/credentials/:path*`
      }
    ];
  },
  images: {
    domains: ['localhost', 'cybercordon.vercel.app'],
  },
  experimental: {
    serverActions: {},
  },
};

module.exports = nextConfig;
