import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  experimental: {
    // Photo recipe import can ship multi-MB base64-encoded images to a server
    // action. Default is 1 MB which crashes anything bigger than a thumbnail.
    serverActions: {
      bodySizeLimit: '8mb',
    },
  },
};

export default nextConfig;
