/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/credentials',
        destination: `${process.env.API_BASE_URL}/credentials/`,
      },
      {
        source: '/auth/:path*',
        destination: `${process.env.API_BASE_URL}/auth/:path*`
      },
      {
        source: '/credentials/:path*',
        destination: `${process.env.API_BASE_URL}/credentials/:path*`
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
