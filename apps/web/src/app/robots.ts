import type { MetadataRoute } from "next";
import { publicEnv } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/privacidad", "/terminos"],
      disallow: [
        "/api/",
        "/auth/",
        "/home",
        "/library",
        "/workout",
        "/tools",
        "/progress",
        "/profile",
        "/onboarding",
      ],
    },
    sitemap: `${publicEnv().site}/sitemap.xml`,
  };
}
