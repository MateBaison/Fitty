import type { MetadataRoute } from "next";
import { publicEnv } from "@/lib/env";

export default function sitemap(): MetadataRoute.Sitemap {
  const site = publicEnv().site;
  return ["/login", "/privacy", "/terms", "/support"].map((path) => ({
    url: `${site}${path}`,
  }));
}
