import { notFound } from "next/navigation";
import { isValidLanguage } from "@/lib/utils/formatters";
import { LegalPolicyPage } from "@/components/pages/LegalPolicyPage";
import { CorrectionReportForm } from "@/components/feedback/CorrectionReportForm";

export default async function CorrectionPolicyPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isValidLanguage(lang)) notFound();
  return (
    <div>
      <LegalPolicyPage lang={lang} slug="correction-policy" />
      <div className="mx-auto max-w-4xl px-4 pb-8">
        <CorrectionReportForm
          lang={lang}
          defaultPageUrl={`/${lang}/correction-policy`}
        />
      </div>
    </div>
  );
}
