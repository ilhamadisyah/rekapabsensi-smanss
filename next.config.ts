import type { NextConfig } from "next";

const securityHeaders = [
  // 1. Content Security Policy (XSS, Injection, Frame restriction)
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      "img-src 'self' data: blob: https:",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
      "frame-ancestors 'none'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; '),
  },
  // 2. Anti Clickjacking
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  // 3. Anti MIME-Type Sniffing
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  // 4. Referrer Policy
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  // 5. Permissions Policy (Hardware access prevention)
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
  },
  // 6. Strict Transport Security (HSTS - 2 years)
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  // 7. X-XSS-Protection Legacy Filter
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block',
  },
  // 8. DNS Prefetch Control
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on',
  },
];

const nextConfig: NextConfig = {
  serverExternalPackages: ["exceljs", "xlsx"],
  reactStrictMode: true,
  poweredByHeader: false, // Port protection & info disclosure prevention: hides X-Powered-By: Next.js
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
