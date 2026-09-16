import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  allowedDevOrigins: ['*'],
  reactStrictMode: false,

  redirects() {
    return [
      {
        source: '/reports',
        destination: '/reports/projects',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
