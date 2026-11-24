import { FlaskConical } from "lucide-react";
import { LanguageCode } from "@/lib/types/recruitment";
import { getDictionary } from "@/lib/i18n/dictionaries";

export function SamplePreviewBanner({ lang }: { lang: LanguageCode }) {
  const dict = getDictionary(lang);
  return (
    <div
      role="note"
      className="mb-6 flex items-start gap-2.5 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-xs sm:text-sm text-amber-950"
    >
      <FlaskConical
        className="mt-0.5 h-4 w-4 shrink-0 text-amber-800"
        aria-hidden="true"
      />
      <p>{dict.samplePreviewNotice}</p>
    </div>
  );
}
