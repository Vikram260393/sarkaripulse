import { notFound } from "next/navigation";
import { isValidLanguage } from "@/lib/utils/formatters";
import { LegalPolicyPage } from "@/components/pages/LegalPolicyPage";

export default async function AdvertisingPolicyPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isValidLanguage(lang)) notFound();
  return <LegalPolicyPage lang={lang} slug="advertising-policy" />;
}
