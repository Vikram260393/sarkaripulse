"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Globe, Info, Menu, X } from "lucide-react";
import { LanguageCode, SUPPORTED_LANGUAGES } from "@/lib/types/recruitment";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { buildLanguageSwitchPath } from "@/lib/utils/formatters";

interface SiteHeaderProps {
  lang: LanguageCode;
}

export function SiteHeader({ lang }: SiteHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname() || `/${lang}`;
  const dict = getDictionary(lang);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setMenuOpen(false);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const topNavLinks = [
    { label: dict.nav.latestJobs, href: `/${lang}/latest-jobs` },
    { label: dict.nav.maharashtra, href: `/${lang}/states/maharashtra`, highlight: true },
    { label: dict.nav.centralGovt, href: `/${lang}/category/central-government` },
    { label: dict.nav.results, href: `/${lang}/results` },
    { label: dict.nav.admitCards, href: `/${lang}/admit-cards` },
    { label: dict.nav.syllabus, href: `/${lang}/syllabus` },
    { label: dict.nav.tools, href: `/${lang}/tools` },
  ];

  // Full 20-section taxonomy per Blueprint Ch. 02 (compact drawer/grid)
  const allSectionGroups = [
    {
      heading: dict.nav.latestJobs,
      links: [
        { label: dict.nav.latestJobs, href: `/${lang}/latest-jobs` },
        { label: dict.nav.centralGovt, href: `/${lang}/category/central-government` },
        { label: dict.nav.stateJobs, href: `/${lang}/category/state-jobs` },
        { label: dict.nav.maharashtra, href: `/${lang}/states/maharashtra` },
      ],
    },
    {
      heading: dict.search.categoryLabel,
      links: [
        { label: dict.nav.railway, href: `/${lang}/category/railway` },
        { label: dict.nav.banking, href: `/${lang}/category/banking` },
        { label: dict.nav.defence, href: `/${lang}/category/defence` },
        { label: dict.nav.police, href: `/${lang}/category/police` },
        { label: dict.nav.psu, href: `/${lang}/category/psu` },
        { label: dict.nav.teaching, href: `/${lang}/category/teaching` },
        { label: dict.nav.engineering, href: `/${lang}/category/engineering` },
      ],
    },
    {
      heading: dict.home.lifecycleHeading,
      links: [
        { label: dict.nav.results, href: `/${lang}/results` },
        { label: dict.nav.admitCards, href: `/${lang}/admit-cards` },
        { label: dict.nav.answerKeys, href: `/${lang}/answer-keys` },
        { label: dict.nav.syllabus, href: `/${lang}/syllabus` },
        { label: dict.nav.previousPapers, href: `/${lang}/previous-papers` },
        { label: dict.nav.admissions, href: `/${lang}/admissions` },
      ],
    },
    {
      heading: dict.nav.careerGuides,
      links: [
        { label: dict.nav.careerGuides, href: `/${lang}/career-guides` },
        { label: dict.nav.tools, href: `/${lang}/tools` },
        { label: dict.nav.downloads, href: `/${lang}/downloads` },
        { label: "Saved Jobs & Alerts", href: `/${lang}/account` },
      ],
    },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-sp-border bg-white shadow-xs">
      {/* Mandatory Independent Platform Disclaimer Bar (Blueprint Ch. 01) */}
      <div className="bg-sp-navy text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-1.5 text-xs">
          <p className="flex items-center gap-1.5 leading-snug text-blue-100">
            <Info className="h-3.5 w-3.5 shrink-0 text-sp-accent" aria-hidden="true" />
            <span>{dict.independentBanner}</span>
          </p>
        </div>
      </div>

      {/* Main Header Row */}
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3">
        {/* Brand Logo (Geometric pulse mark — NO national emblems or government seals) */}
        <Link
          href={`/${lang}`}
          className="flex items-center gap-2 sm:gap-2.5 shrink-0 group min-w-0"
          onClick={() => setMenuOpen(false)}
        >
          <span
            className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg bg-sp-navy text-white shadow-xs transition-colors group-hover:bg-sp-blue shrink-0"
            aria-hidden="true"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="h-4 w-4 sm:h-5 sm:w-5"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 12h4l2.5-6 4 12 2.5-6H21" />
            </svg>
          </span>
          <span className="flex flex-col">
            <span className="text-base sm:text-lg font-extrabold tracking-tight text-sp-navy leading-none">
              Sarkari<span className="text-sp-blue">Pulse</span>
            </span>
            <span className="text-[11px] font-medium text-sp-muted mt-0.5 hidden sm:inline">
              {dict.tagline}
            </span>
          </span>
        </Link>

        {/* Compact Desktop Primary Nav */}
        <nav aria-label="Primary navigation" className="hidden lg:flex items-center gap-1">
          {topNavLinks.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-sp-navy text-white"
                    : item.highlight
                    ? "bg-amber-100 text-sp-navy font-semibold hover:bg-amber-200"
                    : "text-sp-text hover:bg-slate-100 hover:text-sp-navy"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Right Controls: Language Switcher + Compact All-Sections Menu */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <div
            className="flex items-center rounded-lg border border-sp-border bg-sp-bg p-0.5"
            role="group"
            aria-label="Language switcher"
          >
            <Globe
              className="mx-1.5 h-3.5 w-3.5 text-sp-muted hidden sm:block"
              aria-hidden="true"
            />
            {SUPPORTED_LANGUAGES.map((code) => {
              const { href } = buildLanguageSwitchPath(pathname, code);
              const isCurrent = code === lang;
              const shortMobileLabel =
                code === "en" ? "EN" : dict.languageName[code];
              return (
                <Link
                  key={code}
                  href={href}
                  hrefLang={code}
                  lang={code}
                  aria-current={isCurrent ? "true" : undefined}
                  className={`rounded-md px-1.5 sm:px-2 py-1 text-[11px] sm:text-xs font-semibold transition-colors whitespace-nowrap ${
                    isCurrent
                      ? "bg-sp-navy text-white"
                      : "text-sp-muted hover:text-sp-navy"
                  }`}
                >
                  <span className="sm:hidden">{shortMobileLabel}</span>
                  <span className="hidden sm:inline">{dict.languageName[code]}</span>
                </Link>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-expanded={menuOpen}
            aria-controls="sp-all-sections-drawer"
            aria-label={menuOpen ? dict.nav.closeMenu : dict.nav.moreMenu}
            className="inline-flex items-center gap-1.5 rounded-lg border border-sp-border bg-white px-2 sm:px-3 py-1.5 text-sm font-semibold text-sp-navy hover:bg-slate-100 cursor-pointer shrink-0"
          >
            {menuOpen ? (
              <X className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Menu className="h-4 w-4" aria-hidden="true" />
            )}
            <span className="hidden sm:inline">{dict.nav.allSections}</span>
          </button>
        </div>
      </div>

      {/* Compact Expandable All-20-Sections Navigation Drawer */}
      {menuOpen && (
        <div
          id="sp-all-sections-drawer"
          className="border-t border-sp-border bg-sp-bg px-4 py-5 shadow-md"
        >
          <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {allSectionGroups.map((group) => (
              <div key={group.heading}>
                <h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-sp-muted">
                  {group.heading}
                </h2>
                <ul className="space-y-1">
                  {group.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        onClick={() => setMenuOpen(false)}
                        className="block rounded-md px-2.5 py-1.5 text-sm font-medium text-sp-text hover:bg-white hover:text-sp-blue"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
