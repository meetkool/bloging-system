import type { NextConfig } from "next";
import { withContentlayer } from 'next-contentlayer';

const nextConfig: NextConfig = {
  // output: 'export', // Disabled to support API routes for GitHub Gist editor
  trailingSlash: true,
  images: { unoptimized: true },
};

export default withContentlayer(nextConfig);
