import type { NextConfig } from "next";
import { withContentlayer } from 'next-contentlayer';

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
};

export default withContentlayer(nextConfig);
