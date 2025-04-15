/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    serverComponentsExternalPackages: ["next-auth"],
  },
  typescript: {
    ignoreBuildErrors: true,
  }
};

export default nextConfig;
