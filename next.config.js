/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
  // For Replit proxy compatibility, Next.js 13 handles host headers automatically
  async rewrites() {
    return [];
  }
};

module.exports = nextConfig;
