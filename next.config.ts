import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['192.168.1.5', 'localhost'],

  /* config options here */
    eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
    images: {
    domains: ['bc.imgix.net'],
    // Or use remotePatterns for better security (recommended)
    remotePatterns: [
   
      {
        protocol: 'https',
        hostname: 'bc.imgix.net',
        port: '',
        pathname: '/**',
      }
    ],
  },
};

export default nextConfig;
