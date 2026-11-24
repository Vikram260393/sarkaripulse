import { NextResponse } from "next/server";
import { renderLanguageSitemapXml } from "@/lib/seo/sitemap";

export function GET() {
  return new NextResponse(renderLanguageSitemapXml("en"), {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
