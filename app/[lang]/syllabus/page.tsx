import { notFound } from "next/navigation";
import { isValidLanguage } from "@/lib/utils/formatters";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { MOCK_RECRUITMENTS } from "@/lib/data/mock-recruitments";
import { HubSectionPage } from "@/components/pages/HubSectionPage";

export default async function SyllabusPage({
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
      title={dict.nav.syllabus}
      description="Official examination patterns and structured syllabus summaries grounded in recruiting authority notifications."
      records={MOCK_RECRUITMENTS.slice(0, 3)}
      emptyMessage="No syllabus records yet."
    />
  );
}
