/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true, // Required for PixiJS
  },
  transpilePackages: ["@tactico/simulation-engine", "@tactico/shared"],
};

module.exports = nextConfig;