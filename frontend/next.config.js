/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@soroban-limit-orders/sdk'],
  images: { unoptimized: true },
};

module.exports = nextConfig;