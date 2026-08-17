import type { NextConfig } from "next";
import path from "node:path";

function apiConnectSource(): string {
  const configured = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (!configured) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("NEXT_PUBLIC_API_URL is required in production");
    }
    return "'self'";
  }

  if (configured.startsWith("/")) return "'self'";

  const apiUrl = new URL(configured);
  if (process.env.NODE_ENV === "production" && apiUrl.protocol !== "https:") {
    throw new Error("NEXT_PUBLIC_API_URL must use HTTPS in production");
  }
  return `'self' ${apiUrl.origin}`;
}

const productionSecurityHeaders = [
  { key: "Content-Security-Policy", value: `default-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; object-src 'none'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src ${apiConnectSource()}; upgrade-insecure-requests` },
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
};

export default nextConfig;
