import type { MetadataRoute } from "next";
import { buildLanguageSitemapEntries } from "@/lib/seo/sitemap";
import { SUPPORTED_LANGUAGES } from "@/lib/types/recruitment";

export default function sitemap(): MetadataRoute.Sitemap {
  const allEntries: MetadataRoute.Sitemap = [];
  for (const lang of SUPPORTED_LANGUAGES) {
    const langEntries = buildLanguageSitemapEntries(lang);
    for (const item of langEntries) {
      allEntries.push({
        url: item.url,
        lastModified: item.lastModified,
        changeFrequency: item.changeFrequency,
        priority: item.priority,
        alternates: item.alternates
          ? { languages: item.alternates }
          : undefined,
      });
    }
  }
  return allEntries;
}
