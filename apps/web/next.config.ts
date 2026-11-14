import type { NextConfig } from 'next';
const apiOrigin = process.env.API_INTERNAL_URL ?? 'http://localhost:3001/api';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [{ source: '/_backend/:path*', destination: `${apiOrigin}/:path*` }];
  },
};
export default nextConfig;
