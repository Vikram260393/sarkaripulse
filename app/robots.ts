import type { MetadataRoute } from "next";
import { getCanonicalBaseUrl } from "@/lib/seo/metadata";

export default function robots(): MetadataRoute.Robots {
  const base = getCanonicalBaseUrl();
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin/", "/api/", "/*?q="],
    },
    sitemap: [
      `${base}/sitemap.xml`,
      `${base}/sitemap-en.xml`,
      `${base}/sitemap-hi.xml`,
      `${base}/sitemap-mr.xml`,
    ],
  };
}
