import { notFound } from "next/navigation";
import { isValidLanguage } from "@/lib/utils/formatters";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { HubSectionPage } from "@/components/pages/HubSectionPage";

export default async function PreviousPapersPage({
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
      title={dict.nav.previousPapers}
      description="Authorised previous examination question papers linked or hosted strictly where redistribution rights permit."
      records={[]}
      emptyMessage="Previous question paper library will be populated in Phase 5 after rights verification and PDF storage setup."
    />
  );
}
