/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: ["framer-motion", "lucide-react"],
  },
  images: {
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384, 560],
    qualities: [75, 100],
  },
};

module.exports = nextConfig;
