"use client";

import { useEffect, useState } from "react";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { LanguageCode } from "@/lib/types/recruitment";
import { trackSafeEvent } from "@/lib/analytics/events";

const STORAGE_KEY = "sarkaripulse_saved_slugs_v1";

interface BookmarkButtonProps {
  slug: string;
  lang: LanguageCode;
  compact?: boolean;
}

const LABELS: Record<LanguageCode, { save: string; saved: string }> = {
  en: { save: "Save", saved: "Saved" },
  hi: { save: "सहेजें", saved: "सहेजा गया" },
  mr: { save: "जतन करा", saved: "जतन केले" },
};

export function BookmarkButton({
  slug,
  lang,
  compact = false,
}: BookmarkButtonProps) {
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const list = JSON.parse(raw) as string[];
        setSaved(Array.isArray(list) && list.includes(slug));
      }
    } catch {
      // Ignore storage access restrictions
    }
  }, [slug]);

  function toggleBookmark() {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      const list = raw ? (JSON.parse(raw) as string[]) : [];
      const set = new Set(Array.isArray(list) ? list : []);
      if (set.has(slug)) {
        set.delete(slug);
        setSaved(false);
      } else {
        set.add(slug);
        setSaved(true);
        trackSafeEvent("bookmark_added", {
          language: lang,
          recruitment_id: slug,
        });
      }
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]));
    } catch {
      setSaved((prev) => !prev);
    }
  }

  return (
    <button
      type="button"
      onClick={toggleBookmark}
      aria-pressed={saved}
      className={`inline-flex items-center gap-1.5 rounded-lg border font-semibold transition-colors cursor-pointer ${
        compact ? "px-2.5 py-1 text-xs" : "px-3.5 py-2 text-xs sm:text-sm"
      } ${
        saved
          ? "border-sp-blue bg-blue-50 text-sp-navy"
          : "border-sp-border bg-white text-sp-muted hover:border-sp-blue hover:text-sp-navy"
      }`}
    >
      {saved ? (
        <BookmarkCheck className="h-3.5 w-3.5 text-sp-blue" aria-hidden="true" />
      ) : (
        <Bookmark className="h-3.5 w-3.5" aria-hidden="true" />
      )}
      <span>{saved ? LABELS[lang].saved : LABELS[lang].save}</span>
    </button>
  );
}
