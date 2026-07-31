import type { NextConfig } from "next";

const isGitHubPages = process.env.GITHUB_PAGES === "true";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  ...(isGitHubPages
    ? {
        output: "export" as const,
        basePath: "/mercatto-market-web",
        trailingSlash: true,
      }
    : {}),
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
