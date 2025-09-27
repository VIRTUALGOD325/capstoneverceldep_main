// Next.js configuration
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: { 
    appDir: true 
  },
  output: 'standalone', // Enable standalone build for Docker
  env: {
    BACKEND_URL: process.env.BACKEND_URL,
  }
};

export default nextConfig;
