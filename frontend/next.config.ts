import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  // Allow builds to continue even if external resources fail
  experimental: {
    optimizePackageImports: ["lucide-react", "@radix-ui/react-dialog"],
  },
};

export default nextConfig;
