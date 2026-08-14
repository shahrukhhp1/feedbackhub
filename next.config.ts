import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["pino", "pino-pretty", "thread-stream"],
  outputFileTracingIncludes: {
    "/*": [
      "./node_modules/@swc/helpers/**/*",
      "./node_modules/@next/swc-win32-x64-msvc/**/*",
    ],
  },
};

export default nextConfig;
