import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Parent directory has an unrelated lockfile; pin the workspace root here.
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
