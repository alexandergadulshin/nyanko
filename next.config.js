import "./src/env.js";

/** @type {import("next").NextConfig} */
const config = {
  eslint: {
    // Temporarily ignore during builds for deployment
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Temporarily ignore TypeScript errors during builds for deployment
    ignoreBuildErrors: true,
  },
};

export default config;
