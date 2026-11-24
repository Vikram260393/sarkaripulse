import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { LanguageCode } from "@/lib/types/recruitment";
import { getDictionary } from "@/lib/i18n/dictionaries";

interface SiteFooterProps {
  lang: LanguageCode;
}

export function SiteFooter({ lang }: SiteFooterProps) {
  const dict = getDictionary(lang);

  const policyLinks = [
    { label: dict.legal.about, href: `/${lang}/about` },
    { label: dict.legal.contact, href: `/${lang}/contact` },
    { label: dict.legal.privacy, href: `/${lang}/privacy-policy` },
    { label: dict.legal.terms, href: `/${lang}/terms` },
    { label: dict.legal.disclaimer, href: `/${lang}/disclaimer` },
    { label: dict.legal.editorialPolicy, href: `/${lang}/editorial-policy` },
    { label: dict.legal.correctionPolicy, href: `/${lang}/correction-policy` },
    { label: dict.legal.advertisingPolicy, href: `/${lang}/advertising-policy` },
  ];

  return (
    <footer className="mt-16 border-t border-sp-border bg-sp-navy text-blue-100">
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {/* Brand & Independent Disclaimer */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-sp-accent" aria-hidden="true" />
              <span className="text-lg font-bold text-white">
                {dict.brandName}
              </span>
            </div>
            <p className="text-sm font-medium text-white">{dict.tagline}</p>
            <p className="text-xs leading-relaxed text-blue-100/90">
              {dict.legal.footerDisclaimer}
            </p>
          </div>

          {/* Quick Recruitment Hubs */}
          <div>
            <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-sp-accent">
              {dict.nav.allSections}
            </h2>
            <ul className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <li>
                <Link href={`/${lang}/latest-jobs`} className="hover:text-white hover:underline">
                  {dict.nav.latestJobs}
                </Link>
              </li>
              <li>
                <Link href={`/${lang}/states/maharashtra`} className="hover:text-white hover:underline">
                  {dict.nav.maharashtra}
                </Link>
              </li>
              <li>
                <Link href={`/${lang}/category/central-government`} className="hover:text-white hover:underline">
                  {dict.nav.centralGovt}
                </Link>
              </li>
              <li>
                <Link href={`/${lang}/results`} className="hover:text-white hover:underline">
                  {dict.nav.results}
                </Link>
              </li>
              <li>
                <Link href={`/${lang}/admit-cards`} className="hover:text-white hover:underline">
                  {dict.nav.admitCards}
                </Link>
              </li>
              <li>
                <Link href={`/${lang}/answer-keys`} className="hover:text-white hover:underline">
                  {dict.nav.answerKeys}
                </Link>
              </li>
              <li>
                <Link href={`/${lang}/syllabus`} className="hover:text-white hover:underline">
                  {dict.nav.syllabus}
                </Link>
              </li>
              <li>
                <Link href={`/${lang}/tools`} className="hover:text-white hover:underline">
                  {dict.nav.tools}
                </Link>
              </li>
            </ul>
          </div>

          {/* Mandatory Trust & Legal Pages (Blueprint Ch. 05) */}
          <div>
            <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-sp-accent">
              {dict.legal.disclaimer} &amp; Policies
            </h2>
            <ul className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              {policyLinks.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="hover:text-white hover:underline">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-white/15 pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-blue-200">
          <p>{dict.legal.copyrightLine}</p>
          <p>English • हिन्दी • मराठी</p>
        </div>
      </div>
    </footer>
  );
}
