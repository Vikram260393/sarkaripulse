import { notFound } from "next/navigation";
import { isValidLanguage } from "@/lib/utils/formatters";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { HubSectionPage } from "@/components/pages/HubSectionPage";

export default async function AdmissionsPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isValidLanguage(lang)) notFound();
  const dict = getDictionary(lang);

  return (
    <HubSectionPage
      lang={lang}
      title={dict.nav.admissions}
      description="Public university, CET, polytechnic, and national entrance examination notifications."
      records={[]}
      emptyMessage="Entrance and admission notices will populate after Phase 4 source onboarding."
    />
  );
}
