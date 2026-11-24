import { notFound } from "next/navigation";
import { isValidLanguage } from "@/lib/utils/formatters";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { HubSectionPage } from "@/components/pages/HubSectionPage";

export default async function CareerGuidesPage({
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
      title={dict.nav.careerGuides}
      description="Practical original guides on application steps, document checklists, pay matrices, and exam preparation."
      records={[]}
      emptyMessage="Editorial career guides will be published starting in Phase 5."
    />
  );
}
