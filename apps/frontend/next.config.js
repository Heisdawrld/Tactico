/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true, // Required for PixiJS
  },
  experimental: {
    appDir: true,
  },
};

module.exports = nextConfig;