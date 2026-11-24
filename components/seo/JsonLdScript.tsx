import { serializeSafeJsonLd } from "@/lib/seo/jsonld";

interface JsonLdScriptProps {
  data: Record<string, unknown> | null;
}

export function JsonLdScript({ data }: JsonLdScriptProps) {
  if (!data) return null;
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeSafeJsonLd(data) }}
    />
  );
}
