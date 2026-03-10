const withPWA = require("@ducanh2912/next-pwa").default({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
    ],
  },
  webpack(config) {
    config.module.rules.push({
      test: /.svg$/i,
      issuer: /.[jt]sx?$/,
      use: ['@svgr/webpack'],
    });
    return config;
  },
};

module.exports = withPWA(nextConfig);