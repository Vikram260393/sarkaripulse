import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { LanguageCode, RecruitmentRecord } from "@/lib/types/recruitment";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { SearchBar } from "@/components/ui/SearchBar";
import { SamplePreviewBanner } from "@/components/ui/SamplePreviewBanner";
import { RecruitmentCard } from "@/components/recruitment/RecruitmentCard";

interface HubSectionPageProps {
  lang: LanguageCode;
  title: string;
  description: string;
  records: readonly RecruitmentRecord[];
  emptyMessage: string;
  badgeText?: string;
}

export function HubSectionPage({
  lang,
  title,
  description,
  records,
  emptyMessage,
  badgeText,
}: HubSectionPageProps) {
  const dict = getDictionary(lang);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 space-y-6">
      <Breadcrumbs
        items={[
          { label: dict.detail.breadcrumbHome, href: `/${lang}` },
          { label: title },
        ]}
      />

      <header className="rounded-2xl border border-sp-border bg-white p-6 shadow-xs">
        {badgeText && (
          <span className="mb-2 inline-block rounded-full bg-amber-100 px-3 py-0.5 text-xs font-bold text-sp-navy">
            {badgeText}
          </span>
        )}
        <h1 className="text-2xl sm:text-3xl font-extrabold text-sp-navy">
          {title}
        </h1>
        <p className="mt-2 max-w-3xl text-sm sm:text-base text-sp-muted">
          {description}
        </p>
        <div className="mt-4 max-w-xl">
          <SearchBar lang={lang} compact />
        </div>
      </header>

      <SamplePreviewBanner lang={lang} />

      {records.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {records.map((rec) => (
            <RecruitmentCard key={rec.id} record={rec} lang={lang} />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-sp-border bg-white p-8 text-center">
          <p className="text-sm text-sp-muted">{emptyMessage}</p>
          <Link
            href={`/${lang}/latest-jobs`}
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-sp-navy px-4 py-2 text-sm font-semibold text-white hover:bg-sp-navy-dark"
          >
            <span>{dict.home.viewAllJobs}</span>
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      )}
    </div>
  );
}
