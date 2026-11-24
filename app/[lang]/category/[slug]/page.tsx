import { notFound } from "next/navigation";
import { isValidLanguage, resolveLocalizedText } from "@/lib/utils/formatters";
import { CATEGORIES, getCategoryBySlug } from "@/lib/data/taxonomy";
import { MOCK_RECRUITMENTS } from "@/lib/data/mock-recruitments";
import { SUPPORTED_LANGUAGES } from "@/lib/types/recruitment";
import { HubSectionPage } from "@/components/pages/HubSectionPage";

export function generateStaticParams() {
  const params: { lang: string; slug: string }[] = [];
  for (const lang of SUPPORTED_LANGUAGES) {
    for (const cat of CATEGORIES) {
      params.push({ lang, slug: cat.slug });
    }
  }
  return params;
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}) {
  const { lang, slug } = await params;
  if (!isValidLanguage(lang)) notFound();

  const category = getCategoryBySlug(slug);
  if (!category) notFound();

  const records = MOCK_RECRUITMENTS.filter((r) => r.categorySlug === slug);

  return (
    <HubSectionPage
      lang={lang}
      title={resolveLocalizedText(category.name, lang).value}
      description={resolveLocalizedText(category.description, lang).value}
      records={records}
      emptyMessage="No sample records in this sector fixture yet. Live verified notices will populate here after Phase 4 source onboarding."
    />
  );
}
