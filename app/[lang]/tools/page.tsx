import { notFound } from "next/navigation";
import { isValidLanguage } from "@/lib/utils/formatters";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { AgeCalculator } from "@/components/tools/AgeCalculator";

export default async function ToolsPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isValidLanguage(lang)) notFound();
  const dict = getDictionary(lang);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 space-y-6">
      <Breadcrumbs
        items={[
          { label: dict.detail.breadcrumbHome, href: `/${lang}` },
          { label: dict.nav.tools },
        ]}
      />

      <header>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-sp-navy">
          {dict.nav.tools}
        </h1>
        <p className="mt-1 text-sm text-sp-muted">
          Practical candidate planning utilities with transparent assumptions.
        </p>
      </header>

      <AgeCalculator lang={lang} />
    </div>
  );
}
