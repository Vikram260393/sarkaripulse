import { notFound } from "next/navigation";
import { isValidLanguage, resolveLocalizedText } from "@/lib/utils/formatters";
import { getStateBySlug, STATES } from "@/lib/data/taxonomy";
import { MOCK_RECRUITMENTS } from "@/lib/data/mock-recruitments";
import { SUPPORTED_LANGUAGES } from "@/lib/types/recruitment";
import { HubSectionPage } from "@/components/pages/HubSectionPage";

export function generateStaticParams() {
  const params: { lang: string; slug: string }[] = [];
  for (const lang of SUPPORTED_LANGUAGES) {
    for (const st of STATES) {
      params.push({ lang, slug: st.slug });
    }
  }
  return params;
}

export default async function StatePage({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}) {
  const { lang, slug } = await params;
  if (!isValidLanguage(lang)) notFound();

  const state = getStateBySlug(slug);
  if (!state) notFound();

  const records = MOCK_RECRUITMENTS.filter((r) => r.stateSlug === slug);

  return (
    <HubSectionPage
      lang={lang}
      title={resolveLocalizedText(state.name, lang).value}
      description={resolveLocalizedText(state.description, lang).value}
      badgeText={state.isPriority ? "Priority Coverage" : undefined}
      records={records}
      emptyMessage="No sample records for this state yet. Live verified official state boards will populate here after Phase 4 onboarding."
    />
  );
}
