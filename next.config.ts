import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  allowedDevOrigins: ['*'],
  reactStrictMode: false

};

export default nextConfig;
