/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Keep verification builds separate from a running development preview.
  distDir: process.env.TACTICO_BUILD_DIR || '.next',
  images: {
    unoptimized: true, // Required for PixiJS
  },
  transpilePackages: ["@tactico/simulation-engine", "@tactico/shared", "@tactico/database"],
};

module.exports = nextConfig;
