/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    '@tactico/auth',
    '@tactico/database',
    '@tactico/shared',
    '@tactico/ui',
  ],
};

module.exports = nextConfig;
