/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@tactico/database", "@tactico/shared"],
};

module.exports = nextConfig;