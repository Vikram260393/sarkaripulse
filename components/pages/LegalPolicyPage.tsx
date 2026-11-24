import { LanguageCode } from "@/lib/types/recruitment";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getLegalDocument, LegalSlug } from "@/lib/data/legal-pages";
import { resolveLocalizedText } from "@/lib/utils/formatters";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";

interface LegalPolicyPageProps {
  lang: LanguageCode;
  slug: LegalSlug;
}

export function LegalPolicyPage({ lang, slug }: LegalPolicyPageProps) {
  const dict = getDictionary(lang);
  const doc = getLegalDocument(slug);
  const title = resolveLocalizedText(doc.title, lang).value;
  const summary = resolveLocalizedText(doc.summary, lang).value;

  return (
    <article className="mx-auto max-w-4xl px-4 py-8">
      <Breadcrumbs
        items={[
          { label: dict.detail.breadcrumbHome, href: `/${lang}` },
          { label: title },
        ]}
      />

      <div className="rounded-2xl border border-sp-border bg-white p-6 sm:p-8 shadow-xs space-y-6">
        <header className="border-b border-sp-border pb-4">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-sp-navy">
            {title}
          </h1>
          <p className="mt-2 text-sm sm:text-base text-sp-muted">{summary}</p>
        </header>

        <div className="space-y-6">
          {doc.sections.map((section, idx) => (
            <section key={idx}>
              <h2 className="text-lg font-bold text-sp-navy">
                {resolveLocalizedText(section.heading, lang).value}
              </h2>
              <p className="mt-2 text-sm sm:text-base text-sp-text leading-relaxed">
                {resolveLocalizedText(section.body, lang).value}
              </p>
            </section>
          ))}
        </div>
      </div>
    </article>
  );
}
