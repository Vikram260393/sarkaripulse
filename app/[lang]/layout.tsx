import type { Metadata } from "next";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { Inter, Noto_Sans_Devanagari } from "next/font/google";
import "../globals.css";
import { isValidLanguage } from "@/lib/utils/formatters";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { SUPPORTED_LANGUAGES } from "@/lib/types/recruitment";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-inter",
  display: "swap",
});

const notoDevanagari = Noto_Sans_Devanagari({
  subsets: ["devanagari"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-devanagari",
  display: "swap",
});

export function generateStaticParams() {
  return SUPPORTED_LANGUAGES.map((lang) => ({ lang }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const resolvedLang = isValidLanguage(lang) ? lang : "en";
  const dict = getDictionary(resolvedLang);

  return {
    title: {
      default: `${dict.brandName} — ${dict.tagline}`,
      template: `%s | ${dict.brandName}`,
    },
    description: dict.home.heroSubtitle,
    alternates: {
      languages: {
        en: "/en",
        hi: "/hi",
        mr: "/mr",
        "x-default": "/en",
      },
    },
  };
}

export default async function LocalizedLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isValidLanguage(lang)) {
    notFound();
  }
  const dict = getDictionary(lang);

  return (
    <html
      lang={lang}
      className={`${inter.variable} ${notoDevanagari.variable}`}
    >
      <body className="min-h-screen flex flex-col bg-sp-bg text-sp-text">
        <a href="#main-content" className="skip-link">
          {dict.skipToContent}
        </a>
        <SiteHeader lang={lang} />
        <main id="main-content" className="flex-1">
          {children}
        </main>
        <SiteFooter lang={lang} />
      </body>
    </html>
  );
}
