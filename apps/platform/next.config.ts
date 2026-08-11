import type { NextConfig } from "next";
import path from "node:path";

// Local admin-web and mobile development must share the same backend state.
// Deployments should provide API_PROXY_TARGET explicitly.
const apiProxyTarget = (
  process.env.NODE_ENV === "development"
    ? "http://127.0.0.1:4000/api"
    : (process.env.API_PROXY_TARGET ?? "http://127.0.0.1:4000/api")
).replace(/\/$/, "");
const productionSecurityHeaders = [
  { key: "Content-Security-Policy", value: "default-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; object-src 'none'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self'; upgrade-insecure-requests" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=31536000" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
];

const nextConfig: NextConfig = {
  output: "standalone",
  // Dev-only: allow HMR and other dev endpoints when the portal is opened over the LAN IP.
  allowedDevOrigins: ["172.168.2.230", "*.local"],
  // Workspace modules ship TypeScript sources, so Next has to compile them.
  transpilePackages: ["@supercampus/application-desk"],
  outputFileTracingRoot: path.join(__dirname, "../.."),
  poweredByHeader: false,
  async headers() {
    if (process.env.NODE_ENV !== "production") return [];
    return [{ source: "/:path*", headers: productionSecurityHeaders }];
  },
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${apiProxyTarget}/:path*` }];
  },
};

export default nextConfig;
