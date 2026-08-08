import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  allowedDevOrigins: ["*.space-z.ai", "http://127.0.0.1:3000", "http://localhost:3000"],
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // External packages that should NOT be bundled by webpack/turbopack
  // This prevents crash if they have native dependencies or aren't available
  serverExternalPackages: [
    'z-ai-web-dev-sdk',
    'sharp',
  ],
  transpilePackages: [
    '@tiptap/react',
    '@tiptap/starter-kit',
    '@tiptap/extension-underline',
    '@tiptap/extension-text-align',
    '@tiptap/extension-highlight',
    '@tiptap/extension-placeholder',
    '@tiptap/extension-task-list',
    '@tiptap/extension-task-item',
    '@tiptap/extension-color',
    '@tiptap/extension-text-style',
    '@tiptap/pm',
  ],
};

export default nextConfig;
