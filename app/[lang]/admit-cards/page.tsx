import { notFound } from "next/navigation";
import { isValidLanguage } from "@/lib/utils/formatters";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { MOCK_RECRUITMENTS } from "@/lib/data/mock-recruitments";
import { HubSectionPage } from "@/components/pages/HubSectionPage";

export default async function AdmitCardsPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isValidLanguage(lang)) notFound();
  const dict = getDictionary(lang);
  const records = MOCK_RECRUITMENTS.filter(
    (r) => r.lifecycleStatus === "admit_card_released"
  );

  return (
    <HubSectionPage
      lang={lang}
      title={dict.nav.admitCards}
      description="Official hall ticket and admit card release alerts with verified portal destination domains."
      records={records}
      emptyMessage="No sample admit card notices yet."
    />
  );
}
