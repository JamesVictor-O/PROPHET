/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "picsum.photos",
      },
    ],
  },
  // These packages use Node.js internals — exclude from webpack bundling so
  // Node.js resolves them at runtime (CJS path) instead of the broken ESM chunk
  serverExternalPackages: [
    "@0glabs/0g-serving-broker",
    "ethers",
  ],
};

export default nextConfig;
