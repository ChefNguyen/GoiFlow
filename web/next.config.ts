import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  poweredByHeader: false,
  reactStrictMode: true,
  turbopack: {
    root: path.resolve(__dirname),
  },
  async rewrites() {
    let backendUrl = (process.env.BACKEND_API_URL || "http://localhost:8080/api/v1").replace(/\/+$/, "");
    if (!backendUrl.endsWith("/api/v1")) {
      backendUrl = `${backendUrl}/api/v1`;
    }
    return [
      {
        source: "/api/game/:path*",
        destination: `${backendUrl}/game/:path*`,
      },
      {
        source: "/api/user/:path*",
        destination: `${backendUrl}/user/:path*`,
      },
      {
        source: "/api/library/:path*",
        destination: `${backendUrl}/library/:path*`,
      },
      {
        source: "/api/leaderboard/:path*",
        destination: `${backendUrl}/leaderboard/:path*`,
      },
      {
        source: "/api/auth/register",
        destination: `${backendUrl}/auth/register`,
      },
      {
        source: "/api/auth/request-otp",
        destination: `${backendUrl}/auth/request-otp`,
      },
      {
        source: "/api/auth/verify-otp",
        destination: `${backendUrl}/auth/verify-otp`,
      },
      {
        source: "/api/auth/login",
        destination: `${backendUrl}/auth/login`,
      },
    ];
  },
};

export default nextConfig;
