import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  allowedDevOrigins: ["*.space-z.ai"],
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
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
