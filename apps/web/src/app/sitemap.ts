import type { MetadataRoute } from "next";
import { publicEnv } from "@/lib/env";

export default function sitemap(): MetadataRoute.Sitemap {
  const site = publicEnv().site;
  return ["/login", "/privacidad", "/terminos"].map((path) => ({
    url: `${site}${path}`,
  }));
}
