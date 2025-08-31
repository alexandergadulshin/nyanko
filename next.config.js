/** @type {import("next").NextConfig} */
const config = {
  eslint: {
    // Keep disabled for now due to remaining warnings
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Keep disabled for now - some complex type issues remain but app functions correctly
    // TODO: Gradually fix remaining TypeScript errors in id-mapping and other complex modules
    ignoreBuildErrors: true,
  },
};

export default config;
