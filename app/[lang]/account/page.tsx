import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isValidLanguage } from "@/lib/utils/formatters";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { MOCK_RECRUITMENTS } from "@/lib/data/mock-recruitments";
import { isSupabaseConfigured } from "@/server/config/env";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { CandidateAccountClient } from "@/components/account/CandidateAccountClient";

export const metadata: Metadata = {
  title: "Saved Jobs & Alerts",
  robots: { index: false, follow: false },
};

export default async function AccountPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isValidLanguage(lang)) notFound();
  const dict = getDictionary(lang);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Breadcrumbs
        items={[
          { label: dict.detail.breadcrumbHome, href: `/${lang}` },
          { label: "Saved Jobs & Alerts" },
        ]}
      />
      <header className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-sp-navy">
          Saved Jobs &amp; Alert Preferences
        </h1>
        <p className="mt-1 text-sm text-sp-muted">
          Track bookmarked recruitments and manage optional verified email alerts with full export and deletion controls.
        </p>
      </header>

      <CandidateAccountClient
        lang={lang}
        allRecords={MOCK_RECRUITMENTS}
        supabaseConfigured={isSupabaseConfigured()}
      />
    </div>
  );
}
