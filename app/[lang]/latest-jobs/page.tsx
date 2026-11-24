import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isValidLanguage } from "@/lib/utils/formatters";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { MOCK_RECRUITMENTS } from "@/lib/data/mock-recruitments";
import { FilterQuery } from "@/lib/types/recruitment";
import {
  buildLocalizedAlternates,
  shouldNoIndexDirectory,
} from "@/lib/seo/metadata";
import { filterRecruitments } from "@/lib/utils/search";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { SamplePreviewBanner } from "@/components/ui/SamplePreviewBanner";
import { RecruitmentDirectoryClient } from "@/components/recruitment/RecruitmentDirectoryClient";

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const { lang } = await params;
  const resolvedLang = isValidLanguage(lang) ? lang : "en";
  const sp = await searchParams;
  const dict = getDictionary(resolvedLang);

  const initialQuery: FilterQuery = {
    q: typeof sp.q === "string" ? sp.q : undefined,
    state: typeof sp.state === "string" ? sp.state : undefined,
    category: typeof sp.category === "string" ? sp.category : undefined,
    qualification: typeof sp.qualification === "string" ? sp.qualification : undefined,
    status: typeof sp.status === "string" ? sp.status : undefined,
    employmentType: typeof sp.employmentType === "string" ? sp.employmentType : undefined,
  };
  const matchCount = filterRecruitments(MOCK_RECRUITMENTS, initialQuery).length;
  const noIndex = shouldNoIndexDirectory(sp, matchCount);

  return {
    title: dict.nav.latestJobs,
    description: dict.home.heroSubtitle,
    alternates: buildLocalizedAlternates("/latest-jobs", resolvedLang),
    robots: noIndex ? { index: false, follow: true } : { index: true, follow: true },
  };
}

export default async function LatestJobsPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { lang } = await params;
  if (!isValidLanguage(lang)) {
    notFound();
  }
  const sp = await searchParams;
  const dict = getDictionary(lang);

  const initialQuery: FilterQuery = {
    q: typeof sp.q === "string" ? sp.q : undefined,
    state: typeof sp.state === "string" ? sp.state : undefined,
    category: typeof sp.category === "string" ? sp.category : undefined,
    qualification:
      typeof sp.qualification === "string" ? sp.qualification : undefined,
    status: typeof sp.status === "string" ? sp.status : undefined,
    employmentType:
      typeof sp.employmentType === "string" ? sp.employmentType : undefined,
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Breadcrumbs
        items={[
          { label: dict.detail.breadcrumbHome, href: `/${lang}` },
          { label: dict.nav.latestJobs },
        ]}
      />

      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-sp-navy">
          {dict.nav.latestJobs}
        </h1>
        <p className="mt-1 text-sm text-sp-muted">{dict.home.heroSubtitle}</p>
      </div>

      <SamplePreviewBanner lang={lang} />

      <RecruitmentDirectoryClient
        lang={lang}
        records={MOCK_RECRUITMENTS}
        initialQuery={initialQuery}
      />
    </div>
  );
}
