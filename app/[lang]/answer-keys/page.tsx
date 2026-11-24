import { notFound } from "next/navigation";
import { isValidLanguage } from "@/lib/utils/formatters";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { MOCK_RECRUITMENTS } from "@/lib/data/mock-recruitments";
import { HubSectionPage } from "@/components/pages/HubSectionPage";

export default async function AnswerKeysPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isValidLanguage(lang)) notFound();
  const dict = getDictionary(lang);
  const records = MOCK_RECRUITMENTS.filter(
    (r) => r.lifecycleStatus === "answer_key_released"
  );

  return (
    <HubSectionPage
      lang={lang}
      title={dict.nav.answerKeys}
      description="Provisional and final official answer keys with verified objection deadlines."
      records={records}
      emptyMessage="No sample answer key notices in Phase 2 fixtures yet. Live official answer keys will appear here after Phase 4."
    />
  );
}
