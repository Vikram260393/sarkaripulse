import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AlertTriangle,
  Building2,
  Calendar,
  Download,
  ExternalLink,
  Flag,
  Globe,
  Info,
  Lock,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import {
  extractDestinationDomain,
  formatCalendarDate,
  formatCurrencyInr,
  formatVacancyCount,
  formatVerifiedTimestamp,
  isRecruitmentClosed,
  isSafeHttpUrl,
  isValidLanguage,
  resolveLocalizedText,
} from "@/lib/utils/formatters";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getRecruitmentBySlug, MOCK_RECRUITMENTS } from "@/lib/data/mock-recruitments";
import { getQualificationBySlug } from "@/lib/data/taxonomy";
import { SUPPORTED_LANGUAGES } from "@/lib/types/recruitment";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { SamplePreviewBanner } from "@/components/ui/SamplePreviewBanner";
import { JsonLdScript } from "@/components/seo/JsonLdScript";
import { CorrectionReportForm } from "@/components/feedback/CorrectionReportForm";
import { BookmarkButton } from "@/components/recruitment/BookmarkButton";
import { buildLocalizedAlternates } from "@/lib/seo/metadata";
import {
  buildArticleJsonLd,
  buildBreadcrumbJsonLd,
  buildJobPostingJsonLd,
} from "@/lib/seo/jsonld";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}): Promise<Metadata> {
  const { lang, slug } = await params;
  const resolvedLang = isValidLanguage(lang) ? lang : "en";
  const record = getRecruitmentBySlug(slug);
  if (!record) return {};

  const title = resolveLocalizedText(record.title, resolvedLang).value;
  const summary = resolveLocalizedText(record.summary, resolvedLang).value;

  return {
    title,
    description: summary,
    alternates: buildLocalizedAlternates(
      `/jobs/${record.slug}`,
      resolvedLang,
      record.availableLanguages
    ),
    openGraph: {
      title,
      description: summary,
      type: "article",
    },
  };
}

export function generateStaticParams() {
  const params: { lang: string; slug: string }[] = [];
  for (const lang of SUPPORTED_LANGUAGES) {
    for (const rec of MOCK_RECRUITMENTS) {
      params.push({ lang, slug: rec.slug });
    }
  }
  return params;
}

export default async function RecruitmentDetailPage({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}) {
  const { lang, slug } = await params;
  if (!isValidLanguage(lang)) {
    notFound();
  }
  const record = getRecruitmentBySlug(slug);
  if (!record) {
    notFound();
  }

  const dict = getDictionary(lang);
  const title = resolveLocalizedText(record.title, lang);
  const summary = resolveLocalizedText(record.summary, lang);
  const organisation = resolveLocalizedText(record.organisation, lang);
  const department = resolveLocalizedText(record.department, lang);
  const closed = isRecruitmentClosed(record.lifecycleStatus);
  const translationUnavailable = !record.availableLanguages.includes(lang);

  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: dict.detail.breadcrumbHome, path: `/${lang}` },
    { name: dict.detail.breadcrumbJobs, path: `/${lang}/latest-jobs` },
    { name: title.value },
  ]);
  const articleJsonLd = buildArticleJsonLd(record, lang);
  const jobPostingJsonLd = buildJobPostingJsonLd(record, lang);

  return (
    <article className="mx-auto max-w-5xl px-4 py-8">
      <JsonLdScript data={breadcrumbJsonLd} />
      <JsonLdScript data={articleJsonLd} />
      <JsonLdScript data={jobPostingJsonLd} />
      <Breadcrumbs
        items={[
          { label: dict.detail.breadcrumbHome, href: `/${lang}` },
          { label: dict.detail.breadcrumbJobs, href: `/${lang}/latest-jobs` },
          { label: title.value },
        ]}
      />

      {record.isSamplePreview && <SamplePreviewBanner lang={lang} />}

      {/* Graceful Translation Fallback Notice (Blueprint Ch. 14) */}
      {translationUnavailable && (
        <div
          role="status"
          className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-blue-300 bg-blue-50 px-4 py-3 text-sm text-sp-navy"
        >
          <p className="flex items-center gap-2 font-medium">
            <Globe className="h-4 w-4 shrink-0 text-sp-blue" aria-hidden="true" />
            <span>{dict.detail.translationFallbackBanner}</span>
          </p>
          <Link
            href={`/en/jobs/${record.slug}`}
            className="rounded-lg bg-sp-navy px-3 py-1.5 text-xs font-semibold text-white hover:bg-sp-navy-dark"
          >
            {dict.detail.readEnglishMaster}
          </Link>
        </div>
      )}

      {/* Prominent Closed Banner (Blueprint Ch. 09 & Ch. 33) */}
      {closed && (
        <div
          role="alert"
          className="mb-5 flex items-start gap-3 rounded-xl border border-slate-400 bg-slate-100 p-4 text-slate-900"
        >
          <Lock className="mt-0.5 h-5 w-5 shrink-0 text-slate-700" aria-hidden="true" />
          <div>
            <p className="text-sm font-bold">{dict.detail.closedBannerTitle}</p>
            <p className="mt-1 text-xs sm:text-sm text-slate-700">
              {dict.detail.closedBannerBody}
            </p>
          </div>
        </div>
      )}

      {/* Header Card */}
      <header className="rounded-2xl border border-sp-border bg-white p-6 shadow-xs">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={record.lifecycleStatus} lang={lang} />
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-sp-navy">
              <ShieldCheck className="h-3.5 w-3.5 text-sp-blue" aria-hidden="true" />
              {dict.detail.verifiedSourceBadge}
            </span>
          </div>
          <BookmarkButton slug={record.slug} lang={lang} />
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-sp-navy leading-tight">
          {title.value}
        </h1>

        <div className="mt-3 space-y-1 text-sm text-sp-muted">
          <p className="flex items-center gap-2 font-semibold text-sp-text">
            <Building2 className="h-4 w-4 text-sp-blue shrink-0" aria-hidden="true" />
            <span>{organisation.value}</span>
            {lang !== "en" &&
              organisation.value !== record.officialEnglishOrganisation && (
                <span className="text-xs font-normal text-sp-muted">
                  ({record.officialEnglishOrganisation})
                </span>
              )}
          </p>
          <p>{department.value}</p>
        </div>

        {/* Key Metadata Strip */}
        <dl className="mt-5 grid grid-cols-1 gap-3 rounded-xl bg-sp-bg p-4 text-xs sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <dt className="font-semibold text-sp-muted">
              {dict.detail.notificationNo}
            </dt>
            <dd className="mt-0.5 font-mono text-sm font-bold text-sp-navy">
              {record.notificationReference ?? "Not specified"}
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-sp-muted">{dict.card.vacancies}</dt>
            <dd className="mt-0.5 text-sm font-bold text-sp-navy">
              {formatVacancyCount(record.vacancyTotal, lang)}
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-sp-muted">{dict.card.lastDate}</dt>
            <dd className="mt-0.5 text-sm font-bold text-sp-navy">
              {formatCalendarDate(record.applicationEnd, lang)}
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-sp-muted">
              {dict.detail.lastVerified}
            </dt>
            <dd className="mt-0.5 text-sm font-bold text-sp-navy">
              <time dateTime={record.lastVerifiedAt}>
                {formatVerifiedTimestamp(record.lastVerifiedAt, lang)}
              </time>
            </dd>
          </div>
        </dl>
      </header>

      {/* Structured 18-Section Editorial Body (Blueprint Ch. 13) */}
      <div className="mt-6 space-y-6">
        {/* 1. Recruitment Overview */}
        <section className="rounded-xl border border-sp-border bg-white p-6">
          <h2 className="text-lg font-extrabold text-sp-navy">
            1. {dict.detail.sections.overview}
          </h2>
          <p className="mt-2 text-sm sm:text-base text-sp-text leading-relaxed">
            {summary.value}
          </p>
        </section>

        {/* 2. Important Dates */}
        <section className="rounded-xl border border-sp-border bg-white p-6">
          <h2 className="flex items-center gap-2 text-lg font-extrabold text-sp-navy">
            <Calendar className="h-5 w-5 text-sp-blue" aria-hidden="true" />
            2. {dict.detail.sections.importantDates}
          </h2>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-sp-border bg-sp-bg text-xs font-bold uppercase text-sp-muted">
                  <th scope="col" className="px-4 py-2.5">
                    {dict.detail.tableHeaders.event}
                  </th>
                  <th scope="col" className="px-4 py-2.5">
                    {dict.detail.tableHeaders.date}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sp-border">
                {record.dates.map((d) => (
                  <tr key={d.dateType}>
                    <td className="px-4 py-2.5 font-medium text-sp-text">
                      {resolveLocalizedText(d.label, lang).value}
                    </td>
                    <td className="px-4 py-2.5 font-semibold text-sp-navy">
                      {formatCalendarDate(d.eventDate, lang, d.eventTimeLabel)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* 3 & 4. Vacancy Distribution & Post Details */}
        <section className="rounded-xl border border-sp-border bg-white p-6">
          <h2 className="text-lg font-extrabold text-sp-navy">
            3. {dict.detail.sections.vacancyDistribution} &amp;{" "}
            {dict.detail.sections.postDetails}
          </h2>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-sp-border bg-sp-bg text-xs font-bold uppercase text-sp-muted">
                  <th scope="col" className="px-3 py-2.5">
                    {dict.detail.tableHeaders.postName}
                  </th>
                  <th scope="col" className="px-3 py-2.5">
                    {dict.detail.tableHeaders.vacancies}
                  </th>
                  <th scope="col" className="px-3 py-2.5">
                    {dict.detail.tableHeaders.payLevel}
                  </th>
                  <th scope="col" className="px-3 py-2.5">
                    {dict.detail.tableHeaders.qualification}
                  </th>
                  <th scope="col" className="px-3 py-2.5">
                    {dict.detail.tableHeaders.age}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sp-border">
                {record.posts.map((post, idx) => (
                  <tr key={post.postCode ?? idx}>
                    <td className="px-3 py-2.5 font-semibold text-sp-navy">
                      {resolveLocalizedText(post.postName, lang).value}
                    </td>
                    <td className="px-3 py-2.5 font-semibold">
                      {formatVacancyCount(post.vacancyCount, lang)}
                    </td>
                    <td className="px-3 py-2.5">{post.payLevel ?? "—"}</td>
                    <td className="px-3 py-2.5">
                      {resolveLocalizedText(post.qualificationSummary, lang).value}
                    </td>
                    <td className="px-3 py-2.5">{post.ageRange ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* 5, 6, 7, 8. Eligibility: Qualification, Experience, Age & Relaxation */}
        <section className="rounded-xl border border-sp-border bg-white p-6 space-y-4">
          <h2 className="text-lg font-extrabold text-sp-navy">
            4. {dict.detail.sections.qualification},{" "}
            {dict.detail.sections.experience} &amp; {dict.detail.sections.ageLimit}
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-lg bg-sp-bg p-4">
              <h3 className="text-sm font-bold text-sp-navy">
                {dict.detail.sections.qualification}
              </h3>
              <ul className="mt-2 list-disc pl-5 text-sm text-sp-text space-y-1">
                {record.qualificationSlugs.map((qSlug) => {
                  const q = getQualificationBySlug(qSlug);
                  return (
                    <li key={qSlug}>
                      {q ? resolveLocalizedText(q.name, lang).value : qSlug}
                    </li>
                  );
                })}
              </ul>
            </div>
            <div className="rounded-lg bg-sp-bg p-4">
              <h3 className="text-sm font-bold text-sp-navy">
                {dict.detail.sections.experience}
              </h3>
              <p className="mt-2 text-sm text-sp-text">
                {resolveLocalizedText(record.experienceRequirement, lang).value}
              </p>
            </div>
          </div>

          <div className="rounded-lg bg-sp-bg p-4 space-y-2">
            <h3 className="text-sm font-bold text-sp-navy">
              {dict.detail.sections.ageLimit} &amp;{" "}
              {dict.detail.sections.categoryRelaxation}
            </h3>
            <p className="text-sm font-semibold text-sp-text">
              {record.minAge !== null && record.maxAge !== null
                ? `${record.minAge} – ${record.maxAge} years`
                : "Not specified in the notification"}{" "}
              (Cut-off: {formatCalendarDate(record.ageCutOffDate, lang)})
            </p>
            <p className="text-sm text-sp-muted">
              {resolveLocalizedText(record.ageRelaxationNote, lang).value}
            </p>
          </div>
        </section>

        {/* 9 & 10. Fee & Salary / Pay Level */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <section className="rounded-xl border border-sp-border bg-white p-6">
            <h2 className="text-lg font-extrabold text-sp-navy">
              5. {dict.detail.sections.fee}
            </h2>
            <table className="mt-3 w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-sp-border bg-sp-bg text-xs font-bold uppercase text-sp-muted">
                  <th scope="col" className="px-3 py-2">
                    {dict.detail.tableHeaders.category}
                  </th>
                  <th scope="col" className="px-3 py-2">
                    {dict.detail.tableHeaders.feeAmount}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sp-border">
                {record.feeSchedule.map((fee, idx) => (
                  <tr key={idx}>
                    <td className="px-3 py-2">
                      {resolveLocalizedText(fee.category, lang).value}
                    </td>
                    <td className="px-3 py-2 font-semibold text-sp-navy">
                      {formatCurrencyInr(fee.amountInr, lang)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="rounded-xl border border-sp-border bg-white p-6">
            <h2 className="text-lg font-extrabold text-sp-navy">
              6. {dict.detail.sections.salary}
            </h2>
            <p className="mt-3 text-base font-bold text-sp-navy">
              {record.paySummary.displayLabel ?? "Not specified in the notification"}
            </p>
            <p className="mt-2 text-sm text-sp-muted">
              {resolveLocalizedText(record.paySummary.sourceBasis, lang).value}
            </p>
          </section>
        </div>

        {/* 11 & 12. Selection Process & Exam Pattern */}
        <section className="rounded-xl border border-sp-border bg-white p-6 space-y-4">
          <h2 className="text-lg font-extrabold text-sp-navy">
            7. {dict.detail.sections.selectionProcess} &amp;{" "}
            {dict.detail.sections.examPattern}
          </h2>
          <ol className="list-decimal pl-5 space-y-1.5 text-sm text-sp-text">
            {record.selectionStages.map((stage, idx) => (
              <li key={idx}>{resolveLocalizedText(stage, lang).value}</li>
            ))}
          </ol>
          <p className="rounded-lg bg-sp-bg p-4 text-sm text-sp-text">
            {resolveLocalizedText(record.examPatternSummary, lang).value}
          </p>
        </section>

        {/* 13 & 14. Required Documents & Application Steps */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <section className="rounded-xl border border-sp-border bg-white p-6">
            <h2 className="text-lg font-extrabold text-sp-navy">
              8. {dict.detail.sections.documents}
            </h2>
            <ul className="mt-3 list-disc pl-5 space-y-1.5 text-sm text-sp-text">
              {record.requiredDocuments.map((doc, idx) => (
                <li key={idx}>{resolveLocalizedText(doc, lang).value}</li>
              ))}
            </ul>
          </section>

          <section className="rounded-xl border border-sp-border bg-white p-6">
            <h2 className="text-lg font-extrabold text-sp-navy">
              9. {dict.detail.sections.applicationSteps}
            </h2>
            <ol className="mt-3 list-decimal pl-5 space-y-1.5 text-sm text-sp-text">
              {record.applicationSteps.map((step, idx) => (
                <li key={idx}>{resolveLocalizedText(step, lang).value}</li>
              ))}
            </ol>
          </section>
        </div>

        {/* 15. Official Links (Visibly External, Destination Domain Displayed, Expired Disabled) */}
        <section className="rounded-xl border-2 border-sp-blue/30 bg-white p-6">
          <h2 className="text-lg font-extrabold text-sp-navy">
            10. {dict.detail.sections.officialLinks}
          </h2>
          <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs sm:text-sm text-amber-950">
            <ShieldAlert
              className="mt-0.5 h-4 w-4 shrink-0 text-amber-800"
              aria-hidden="true"
            />
            <p>{dict.detail.paymentWarning}</p>
          </div>

          <ul className="mt-4 space-y-3">
            {record.links.map((link, idx) => {
              const domain = extractDestinationDomain(link.url);
              const isSafe = isSafeHttpUrl(link.url);
              const disabled =
                link.isExpired ||
                (closed && link.linkType === "official_apply") ||
                !isSafe;

              return (
                <li
                  key={idx}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-sp-border bg-sp-bg px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-bold text-sp-navy">
                      {resolveLocalizedText(link.label, lang).value}
                    </p>
                    {domain && (
                      <p className="text-xs text-sp-muted">
                        {dict.detail.destinationDomain}:{" "}
                        <span className="font-mono font-semibold text-sp-text">
                          {domain}
                        </span>
                      </p>
                    )}
                  </div>

                  {disabled ? (
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-700">
                      <Lock className="h-3.5 w-3.5" aria-hidden="true" />
                      {dict.detail.expiredLinkDisabled}
                    </span>
                  ) : (
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={dict.detail.externalLinkNote}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-sp-navy px-4 py-2 text-xs sm:text-sm font-semibold text-white hover:bg-sp-blue"
                    >
                      <span>{domain ?? "Open Portal"}</span>
                      <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                    </a>
                  )}
                </li>
              );
            })}
          </ul>

          {/* Clearly labelled SarkariPulse Informational Guide PDF (separate from Official Notification) */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-blue-200 bg-blue-50/70 px-4 py-3">
            <div>
              <p className="text-sm font-bold text-sp-navy">
                SarkariPulse Informational Guide (PDF)
              </p>
              <p className="text-xs text-sp-muted">
                Printable candidate summary generated by SarkariPulse — NOT an official government notification.
              </p>
            </div>
            <a
              href={`/api/public/guides/${record.slug}?lang=${lang}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-sp-navy bg-white px-3.5 py-2 text-xs sm:text-sm font-semibold text-sp-navy hover:bg-sp-navy hover:text-white transition-colors"
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              <span>Download Summary PDF</span>
            </a>
          </div>
        </section>

        {/* 16. Grounded FAQs (Only rendered when present — no fabricated FAQs per Ch. 13) */}
        {record.faqs.length > 0 && (
          <section className="rounded-xl border border-sp-border bg-white p-6">
            <h2 className="text-lg font-extrabold text-sp-navy">
              11. {dict.detail.sections.faqs}
            </h2>
            <dl className="mt-3 space-y-4">
              {record.faqs.map((faq, idx) => (
                <div key={idx} className="rounded-lg bg-sp-bg p-4">
                  <dt className="text-sm font-bold text-sp-navy">
                    {resolveLocalizedText(faq.question, lang).value}
                  </dt>
                  <dd className="mt-1 text-sm text-sp-text">
                    {resolveLocalizedText(faq.answer, lang).value}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        )}

        {/* 17. Source Citations & Update History */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <section className="rounded-xl border border-sp-border bg-white p-6">
            <h2 className="text-base font-extrabold text-sp-navy">
              {dict.detail.sections.sourceCitations}
            </h2>
            <ul className="mt-3 space-y-2 text-xs text-sp-muted">
              {record.sourceCitations.map((cit, idx) => (
                <li key={idx} className="rounded-lg bg-sp-bg p-3">
                  <p className="font-semibold text-sp-text">{cit.sourceName}</p>
                  <p className="mt-0.5 font-mono">
                    {cit.officialDomain} • Ref: {cit.documentReference ?? "N/A"}
                  </p>
                  <p className="mt-0.5">
                    {dict.detail.lastVerified}:{" "}
                    {formatVerifiedTimestamp(cit.retrievedAt, lang)}
                  </p>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-xl border border-sp-border bg-white p-6">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-base font-extrabold text-sp-navy">
                {dict.detail.sections.updateHistory}
              </h2>
              <Link
                href={`/${lang}/correction-policy`}
                className="inline-flex items-center gap-1 text-xs font-semibold text-sp-blue hover:underline"
              >
                <Flag className="h-3.5 w-3.5" aria-hidden="true" />
                {dict.detail.reportError}
              </Link>
            </div>
            <ul className="mt-3 space-y-2 text-xs text-sp-muted">
              {record.updateHistory.map((item, idx) => (
                <li key={idx} className="rounded-lg bg-sp-bg p-3">
                  <p className="font-semibold text-sp-navy">
                    {formatVerifiedTimestamp(item.updatedAt, lang)}
                  </p>
                  <p className="mt-0.5 text-sp-text">
                    {resolveLocalizedText(item.summary, lang).value}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* 18. Mandatory Independent Platform & Official Notice Disclaimer */}
        <section className="rounded-xl border border-slate-300 bg-slate-100 p-5 text-xs sm:text-sm text-slate-800 space-y-2">
          <h2 className="flex items-center gap-2 font-bold text-sp-navy">
            <Info className="h-4 w-4 text-sp-blue" aria-hidden="true" />
            {dict.detail.sections.disclaimer}
          </h2>
          <p>{dict.detail.officialNoticeGoverns}</p>
          <p className="flex items-center gap-1.5 text-xs text-slate-600">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>{dict.legal.footerDisclaimer}</span>
          </p>
        </section>

        {/* Unauthenticated Correction-Report Form (Blueprint Ch. 22) */}
        <CorrectionReportForm
          lang={lang}
          defaultPageUrl={`/${lang}/jobs/${record.slug}`}
        />
      </div>
    </article>
  );
}
