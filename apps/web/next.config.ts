import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: process.env.FITTY_TEST_BUILD === "1" ? ".next-test" : ".next",
  transpilePackages: ["@fitty/core"],
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(self), microphone=(), geolocation=(self)",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains",
          },
        ],
      },
    ];
  },
  async redirects() {
    // The previous production domain now forwards to the Fitty domain.
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "hercules-navy.vercel.app" }],
        destination: "https://fitty.uy/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
