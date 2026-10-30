import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: process.env.FITTY_TEST_BUILD === "1" ? ".next-test" : ".next",
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
