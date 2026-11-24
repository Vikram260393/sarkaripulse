import { notFound } from "next/navigation";
import { isValidLanguage } from "@/lib/utils/formatters";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { MOCK_RECRUITMENTS } from "@/lib/data/mock-recruitments";
import { HubSectionPage } from "@/components/pages/HubSectionPage";

export default async function ResultsPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isValidLanguage(lang)) notFound();
  const dict = getDictionary(lang);
  const records = MOCK_RECRUITMENTS.filter(
    (r) => r.lifecycleStatus === "result_declared"
  );

  return (
    <HubSectionPage
      lang={lang}
      title={dict.nav.results}
      description="Verified government examination results, merit lists, and cutoff updates linked to official board portals."
      records={records}
      emptyMessage="No sample result notices yet."
    />
  );
}
