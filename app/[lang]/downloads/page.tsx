import { notFound } from "next/navigation";
import { isValidLanguage } from "@/lib/utils/formatters";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { HubSectionPage } from "@/components/pages/HubSectionPage";

export default async function DownloadsPage({
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
      title={dict.nav.downloads}
      description="Branded SarkariPulse informational PDF guides (with embedded Devanagari fonts) and verified links to official notifications."
      records={[]}
      emptyMessage="The PDF document library will activate in Phase 5 with Supabase Storage and SHA-256 checksum verification."
    />
  );
}
