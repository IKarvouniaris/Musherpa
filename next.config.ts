import type { NextConfig } from "next";

// Content-Security-Policy is intentionally strict: only 'self' plus the exact
// hosts the app talks to (Supabase project). Fonts/scripts/styles are all
// self-hosted via next/font and Next's build output, so no third-party CDNs
// need to be allow-listed.
// React's dev mode needs eval() for its debugging tools (never in production
// builds) — only relax the policy for that when actually running `next dev`.
const isDev = process.env.NODE_ENV !== "production";

// Turbopack's dev client (HMR, error overlay) runs itself off of blob:
// workers/scripts and blob: connections — none of that exists in a
// production build, so it's only allowed here in dev.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval' blob:" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self' data:",
  `connect-src 'self' https://*.supabase.co wss://*.supabase.co${isDev ? " blob:" : ""}`,
  `worker-src 'self'${isDev ? " blob:" : ""}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
