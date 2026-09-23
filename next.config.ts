import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  allowedDevOrigins: ['*'],
  reactStrictMode: false,
  experimental: {
    // Attachments go through Server Actions; allow the 10MB file limit plus multipart overhead.
    serverActions: {
      bodySizeLimit: '11mb',
    },
  },

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
