import { notFound } from "next/navigation";
import { isValidLanguage, resolveLocalizedText } from "@/lib/utils/formatters";
import { getQualificationBySlug, QUALIFICATIONS } from "@/lib/data/taxonomy";
import { MOCK_RECRUITMENTS } from "@/lib/data/mock-recruitments";
import { SUPPORTED_LANGUAGES } from "@/lib/types/recruitment";
import { HubSectionPage } from "@/components/pages/HubSectionPage";

export function generateStaticParams() {
  const params: { lang: string; slug: string }[] = [];
  for (const lang of SUPPORTED_LANGUAGES) {
    for (const q of QUALIFICATIONS) {
      params.push({ lang, slug: q.slug });
    }
  }
  return params;
}

export default async function QualificationPage({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}) {
  const { lang, slug } = await params;
  if (!isValidLanguage(lang)) notFound();

  const qual = getQualificationBySlug(slug);
  if (!qual) notFound();

  const records = MOCK_RECRUITMENTS.filter((r) =>
    r.qualificationSlugs.includes(slug)
  );

  return (
    <HubSectionPage
      lang={lang}
      title={resolveLocalizedText(qual.name, lang).value}
      description={resolveLocalizedText(qual.description, lang).value}
      records={records}
      emptyMessage="No sample records matched this qualification yet. Live verified notices will populate here after Phase 4 onboarding."
    />
  );
}
