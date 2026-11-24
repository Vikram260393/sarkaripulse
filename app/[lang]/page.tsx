import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  Award,
  BookOpen,
  CheckCircle2,
  FileCheck2,
  FileText,
  KeyRound,
  MapPin,
  ShieldCheck,
} from "lucide-react";
import { isValidLanguage, resolveLocalizedText } from "@/lib/utils/formatters";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { MOCK_RECRUITMENTS } from "@/lib/data/mock-recruitments";
import { QUALIFICATIONS, STATES } from "@/lib/data/taxonomy";
import { SearchBar } from "@/components/ui/SearchBar";
import { SamplePreviewBanner } from "@/components/ui/SamplePreviewBanner";
import { RecruitmentCard } from "@/components/recruitment/RecruitmentCard";
import { JsonLdScript } from "@/components/seo/JsonLdScript";
import { buildOrganizationJsonLd, buildWebSiteJsonLd } from "@/lib/seo/jsonld";

export default async function HomePage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isValidLanguage(lang)) {
    notFound();
  }
  const dict = getDictionary(lang);

  const maharashtraJobs = MOCK_RECRUITMENTS.filter((r) => r.stateCode === "MH");

  const quickChips = [
    { label: dict.nav.maharashtra, href: `/${lang}/states/maharashtra` },
    { label: "10th Pass", href: `/${lang}/qualification/10th-pass` },
    { label: "12th Pass", href: `/${lang}/qualification/12th-pass` },
    { label: dict.nav.police, href: `/${lang}/category/police` },
    { label: dict.nav.railway, href: `/${lang}/category/railway` },
    { label: dict.nav.centralGovt, href: `/${lang}/category/central-government` },
  ];

  const lifecycleHubs = [
    {
      label: dict.nav.results,
      href: `/${lang}/results`,
      icon: <Award className="h-5 w-5 text-sp-blue" aria-hidden="true" />,
    },
    {
      label: dict.nav.admitCards,
      href: `/${lang}/admit-cards`,
      icon: <FileCheck2 className="h-5 w-5 text-sp-blue" aria-hidden="true" />,
    },
    {
      label: dict.nav.answerKeys,
      href: `/${lang}/answer-keys`,
      icon: <KeyRound className="h-5 w-5 text-sp-blue" aria-hidden="true" />,
    },
    {
      label: dict.nav.syllabus,
      href: `/${lang}/syllabus`,
      icon: <BookOpen className="h-5 w-5 text-sp-blue" aria-hidden="true" />,
    },
    {
      label: dict.nav.previousPapers,
      href: `/${lang}/previous-papers`,
      icon: <FileText className="h-5 w-5 text-sp-blue" aria-hidden="true" />,
    },
    {
      label: dict.nav.downloads,
      href: `/${lang}/downloads`,
      icon: <CheckCircle2 className="h-5 w-5 text-sp-blue" aria-hidden="true" />,
    },
  ];

  return (
    <div>
      <JsonLdScript data={buildOrganizationJsonLd()} />
      <JsonLdScript data={buildWebSiteJsonLd(lang)} />
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-sp-navy via-sp-navy to-[#1b4e93] text-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:py-14">
          <div className="max-w-3xl">
            <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-amber-200 border border-white/15">
              <ShieldCheck className="h-3.5 w-3.5 text-sp-accent" aria-hidden="true" />
              {dict.home.heroEyebrow}
            </p>
            <h1 className="mt-4 text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight text-white">
              {dict.home.heroTitle}
            </h1>
            <p className="mt-3 text-sm sm:text-base text-blue-100 leading-relaxed">
              {dict.home.heroSubtitle}
            </p>

            {/* Primary Search Entry Point */}
            <div className="mt-6">
              <SearchBar lang={lang} />
            </div>

            {/* Quick Filter Pills */}
            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
              <span className="font-semibold text-blue-200">
                {dict.home.quickFiltersLabel}
              </span>
              {quickChips.map((chip) => (
                <Link
                  key={chip.href}
                  href={chip.href}
                  className="rounded-full bg-white/12 px-3 py-1 font-medium text-white hover:bg-sp-accent hover:text-sp-navy transition-colors"
                >
                  {chip.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-8 space-y-12">
        <SamplePreviewBanner lang={lang} />

        {/* Maharashtra Priority Spotlight */}
        <section aria-labelledby="maharashtra-spotlight-heading">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-sp-navy">
                <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                {dict.nav.maharashtra}
              </div>
              <h2
                id="maharashtra-spotlight-heading"
                className="mt-1.5 text-xl sm:text-2xl font-extrabold text-sp-navy"
              >
                {dict.home.maharashtraHeading}
              </h2>
              <p className="mt-1 text-sm text-sp-muted">
                {dict.home.maharashtraSubheading}
              </p>
            </div>
            <Link
              href={`/${lang}/states/maharashtra`}
              className="inline-flex items-center gap-1 text-sm font-semibold text-sp-blue hover:text-sp-navy"
            >
              <span>{dict.home.viewAllJobs}</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {maharashtraJobs.slice(0, 2).map((record) => (
              <RecruitmentCard key={record.id} record={record} lang={lang} />
            ))}
          </div>
        </section>

        {/* Latest Recruitments */}
        <section aria-labelledby="latest-jobs-heading">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2
              id="latest-jobs-heading"
              className="text-xl sm:text-2xl font-extrabold text-sp-navy"
            >
              {dict.home.latestHeading}
            </h2>
            <Link
              href={`/${lang}/latest-jobs`}
              className="inline-flex items-center gap-1 text-sm font-semibold text-sp-blue hover:text-sp-navy"
            >
              <span>{dict.home.viewAllJobs}</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {MOCK_RECRUITMENTS.map((record) => (
              <RecruitmentCard key={record.id} record={record} lang={lang} />
            ))}
          </div>
        </section>

        {/* Lifecycle Event Hubs */}
        <section aria-labelledby="lifecycle-hubs-heading">
          <h2
            id="lifecycle-hubs-heading"
            className="mb-4 text-xl sm:text-2xl font-extrabold text-sp-navy"
          >
            {dict.home.lifecycleHeading}
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {lifecycleHubs.map((hub) => (
              <Link
                key={hub.href}
                href={hub.href}
                className="flex flex-col items-start gap-2 rounded-xl border border-sp-border bg-white p-4 shadow-xs transition-all hover:border-sp-blue hover:shadow-md"
              >
                {hub.icon}
                <span className="text-sm font-bold text-sp-navy">{hub.label}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* Browse by Qualification & State */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <section
            aria-labelledby="browse-qual-heading"
            className="rounded-xl border border-sp-border bg-white p-6 shadow-xs"
          >
            <h2
              id="browse-qual-heading"
              className="mb-4 text-lg font-extrabold text-sp-navy"
            >
              {dict.home.browseQualificationHeading}
            </h2>
            <div className="flex flex-wrap gap-2">
              {QUALIFICATIONS.map((q) => (
                <Link
                  key={q.slug}
                  href={`/${lang}/qualification/${q.slug}`}
                  className="rounded-lg border border-sp-border bg-sp-bg px-3.5 py-2 text-sm font-semibold text-sp-navy hover:border-sp-blue hover:bg-blue-50"
                >
                  {resolveLocalizedText(q.name, lang).value}
                </Link>
              ))}
            </div>
          </section>

          <section
            aria-labelledby="browse-state-heading"
            className="rounded-xl border border-sp-border bg-white p-6 shadow-xs"
          >
            <h2
              id="browse-state-heading"
              className="mb-4 text-lg font-extrabold text-sp-navy"
            >
              {dict.home.browseStateHeading}
            </h2>
            <div className="flex flex-wrap gap-2">
              {STATES.map((st) => (
                <Link
                  key={st.slug}
                  href={`/${lang}/states/${st.slug}`}
                  className={`rounded-lg border px-3.5 py-2 text-sm font-semibold transition-colors ${
                    st.isPriority
                      ? "border-amber-400 bg-amber-50 text-sp-navy hover:bg-amber-100"
                      : "border-sp-border bg-sp-bg text-sp-navy hover:border-sp-blue hover:bg-blue-50"
                  }`}
                >
                  {resolveLocalizedText(st.name, lang).value}
                </Link>
              ))}
            </div>
          </section>
        </div>

        {/* Source-Led Trust & Verification Standards */}
        <section
          aria-labelledby="trust-standards-heading"
          className="rounded-2xl border border-blue-200 bg-white p-6 sm:p-8 shadow-xs"
        >
          <div className="max-w-3xl">
            <h2
              id="trust-standards-heading"
              className="text-xl font-extrabold text-sp-navy"
            >
              {dict.home.trustHeading}
            </h2>
            <p className="mt-2 text-sm text-sp-muted">
              {dict.home.trustSubtitle}
            </p>
          </div>
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-lg bg-sp-bg p-4">
              <p className="text-sm font-bold text-sp-navy">1. Official Primary Evidence</p>
              <p className="mt-1 text-xs text-sp-muted">
                Tier 1 government portals and official notifications outrank aggregators. Every critical fact stores a source reference and timestamp.
              </p>
            </div>
            <div className="rounded-lg bg-sp-bg p-4">
              <p className="text-sm font-bold text-sp-navy">2. Transparent External Links</p>
              <p className="mt-1 text-xs text-sp-muted">
                Official apply links visibly show their destination domain. SarkariPulse never collects fees, passwords, OTPs, or Aadhaar details.
              </p>
            </div>
            <div className="rounded-lg bg-sp-bg p-4">
              <p className="text-sm font-bold text-sp-navy">3. Clear Correction History</p>
              <p className="mt-1 text-xs text-sp-muted">
                Corrigenda and deadline extensions are logged transparently with prior history preserved — never silently overwritten.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
