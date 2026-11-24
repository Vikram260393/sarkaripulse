"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { LanguageCode } from "@/lib/types/recruitment";
import { getDictionary } from "@/lib/i18n/dictionaries";

interface SearchBarProps {
  lang: LanguageCode;
  initialQuery?: string;
  compact?: boolean;
}

export function SearchBar({
  lang,
  initialQuery = "",
  compact = false,
}: SearchBarProps) {
  const [query, setQuery] = useState(initialQuery);
  const router = useRouter();
  const dict = getDictionary(lang);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = query.trim();
    const target = trimmed
      ? `/${lang}/latest-jobs?q=${encodeURIComponent(trimmed)}`
      : `/${lang}/latest-jobs`;
    router.push(target);
  }

  return (
    <form
      onSubmit={handleSubmit}
      role="search"
      aria-label={dict.search.label}
      className="w-full"
    >
      <div
        className={`flex items-stretch overflow-hidden rounded-xl border border-sp-border bg-white shadow-sm focus-within:border-sp-blue focus-within:ring-2 focus-within:ring-sp-blue/20 ${
          compact ? "h-10" : "h-12 sm:h-13"
        }`}
      >
        <label htmlFor={`search-input-${compact ? "compact" : "hero"}`} className="sr-only">
          {dict.search.label}
        </label>
        <div className="flex items-center pl-3.5 text-slate-500">
          <Search className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
        </div>
        <input
          id={`search-input-${compact ? "compact" : "hero"}`}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={dict.search.placeholder}
          className="w-full min-w-0 bg-transparent px-3 text-sm sm:text-base text-sp-text placeholder:text-slate-500 focus:outline-none"
        />
        <button
          type="submit"
          className="shrink-0 bg-sp-navy px-4 sm:px-6 text-sm font-semibold text-white transition-colors hover:bg-sp-navy-dark cursor-pointer"
        >
          {dict.search.button}
        </button>
      </div>
    </form>
  );
}
