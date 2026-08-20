import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // No "output: standalone" — Vercel uses its own build pipeline
  allowedDevOrigins: ["*.space-z.ai", "http://127.0.0.1:3000", "http://localhost:3000"],
  reactStrictMode: false,
  poweredByHeader: false,
  compress: true,
  // Security headers (cache headers moved to vercel.json for production)
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
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
