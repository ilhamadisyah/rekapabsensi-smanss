import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["exceljs", "xlsx"],
  reactStrictMode: true,
};

export default nextConfig;
