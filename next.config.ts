import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  // Use standalone output for optimized deployment.
  // This is required by the Railpack/Dokploy environment.
  output: "standalone",

  // Disable Turbopack for production builds to avoid OOM errors.
  // The --webpack flag in package.json ensures this, but adding it here for safety.
  experimental: {
    // Limit CPU count to prevent OOM during production build on high-core machines.
    cpus: 4,
    workerThreads: false,
    // Explicitly trace and include the native Copilot CLI binary in the standalone build.
    // This resolves the "Copilot binary not found" error in production environments.
    outputFileTracingIncludes: {
      "/api/chat": [
        "./node_modules/.pnpm/@github+copilot-linux-x64@*/node_modules/@github/copilot-linux-x64/copilot"
      ]
    }
  }
};

export default withNextIntl(nextConfig);
