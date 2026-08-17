import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  allowedDevOrigins: ["*.space-z.ai", "http://127.0.0.1:3000", "http://localhost:3000"],
  reactStrictMode: false,
  // Performance: compress responses
  compress: true,
  // Performance: power headers for caching static assets
  async headers() {
    return [
      {
        source: '/icons/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/studyai-logo.png',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=86400' },
        ],
      },
      {
        source: '/logo.svg',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=86400' },
        ],
      },
      {
        source: '/manifest.json',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=3600' },
        ],
      },
      {
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
        ],
      },
    ];
  },
  // External packages
  serverExternalPackages: [
    'z-ai-web-dev-sdk',
    'sharp',
    '@neondatabase/serverless',
    '@libsql/client',
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
