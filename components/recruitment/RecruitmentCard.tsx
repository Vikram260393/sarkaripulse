import Link from "next/link";
import { ArrowRight, Building2, Calendar, GraduationCap, MapPin, Users } from "lucide-react";
import { LanguageCode, RecruitmentRecord } from "@/lib/types/recruitment";
import { getDictionary } from "@/lib/i18n/dictionaries";
import {
  formatCalendarDate,
  formatVacancyCount,
  formatVerifiedTimestamp,
  isRecruitmentClosed,
  resolveLocalizedText,
} from "@/lib/utils/formatters";
import { getQualificationBySlug, getStateBySlug } from "@/lib/data/taxonomy";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { BookmarkButton } from "@/components/recruitment/BookmarkButton";

interface RecruitmentCardProps {
  record: RecruitmentRecord;
  lang: LanguageCode;
}

export function RecruitmentCard({ record, lang }: RecruitmentCardProps) {
  const dict = getDictionary(lang);
  const title = resolveLocalizedText(record.title, lang);
  const organisation = resolveLocalizedText(record.organisation, lang);
  const stateInfo = getStateBySlug(record.stateSlug);
  const stateLabel = stateInfo
    ? resolveLocalizedText(stateInfo.name, lang).value
    : record.stateCode;
  const closed = isRecruitmentClosed(record.lifecycleStatus);

  const qualificationLabels = record.qualificationSlugs
    .map((slug) => {
      const q = getQualificationBySlug(slug);
      return q ? resolveLocalizedText(q.name, lang).value : slug;
    })
    .join(", ");

  return (
    <article
      className={`flex flex-col justify-between rounded-xl border bg-white p-5 shadow-xs transition-shadow hover:shadow-md ${
        closed ? "border-slate-300 bg-slate-50/70" : "border-sp-border"
      }`}
    >
      <div>
        {/* Top Metadata Row */}
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <StatusBadge status={record.lifecycleStatus} lang={lang} />
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
              record.stateCode === "MH"
                ? "bg-amber-100 text-sp-navy"
                : "bg-slate-100 text-slate-700"
            }`}
          >
            <MapPin className="h-3 w-3 shrink-0" aria-hidden="true" />
            {stateLabel}
          </span>
          {record.notificationReference && (
            <span className="text-xs font-mono text-sp-muted">
              {record.notificationReference}
            </span>
          )}
        </div>

        {/* Title & Organisation */}
        <h3 className="text-base sm:text-lg font-bold leading-snug text-sp-navy">
          <Link
            href={`/${lang}/jobs/${record.slug}`}
            className="hover:text-sp-blue hover:underline underline-offset-2"
          >
            {title.value}
          </Link>
        </h3>
        <p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-sp-muted">
          <Building2 className="h-4 w-4 shrink-0 text-sp-blue" aria-hidden="true" />
          <span>{organisation.value}</span>
        </p>

        {/* Structured Key Facts Grid */}
        <dl className="mt-4 grid grid-cols-1 gap-2.5 rounded-lg bg-sp-bg p-3 text-xs sm:grid-cols-3">
          <div>
            <dt className="flex items-center gap-1 font-medium text-sp-muted">
              <Users className="h-3.5 w-3.5 text-sp-blue" aria-hidden="true" />
              {dict.card.vacancies}
            </dt>
            <dd className="mt-0.5 text-sm font-bold text-sp-text">
              {formatVacancyCount(record.vacancyTotal, lang)}
            </dd>
          </div>
          <div>
            <dt className="flex items-center gap-1 font-medium text-sp-muted">
              <Calendar className="h-3.5 w-3.5 text-sp-blue" aria-hidden="true" />
              {dict.card.lastDate}
            </dt>
            <dd className="mt-0.5 text-sm font-bold text-sp-text">
              {formatCalendarDate(record.applicationEnd, lang)}
            </dd>
          </div>
          <div>
            <dt className="flex items-center gap-1 font-medium text-sp-muted">
              <GraduationCap className="h-3.5 w-3.5 text-sp-blue" aria-hidden="true" />
              {dict.card.qualification}
            </dt>
            <dd className="mt-0.5 text-sm font-semibold text-sp-text">
              {qualificationLabels}
            </dd>
          </div>
        </dl>

        {closed && (
          <p className="mt-3 text-xs font-medium text-slate-700">
            {dict.card.closedNote}
          </p>
        )}
      </div>

      {/* Footer Row */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-sp-border pt-3">
        <span className="text-xs text-sp-muted">
          {dict.card.lastVerified}:{" "}
          <time dateTime={record.lastVerifiedAt}>
            {formatVerifiedTimestamp(record.lastVerifiedAt, lang)}
          </time>
        </span>
        <div className="flex items-center gap-2">
          <BookmarkButton slug={record.slug} lang={lang} compact />
          <Link
            href={`/${lang}/jobs/${record.slug}`}
            className="inline-flex items-center gap-1 text-sm font-semibold text-sp-blue hover:text-sp-navy"
          >
            <span>{dict.card.viewDetails}</span>
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </article>
  );
}
