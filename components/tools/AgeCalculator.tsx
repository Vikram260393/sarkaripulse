"use client";

import { useState, FormEvent } from "react";
import { Calculator, Info } from "lucide-react";
import { LanguageCode } from "@/lib/types/recruitment";
import { getDictionary } from "@/lib/i18n/dictionaries";

interface AgeResult {
  years: number;
  months: number;
  days: number;
}

export function calculateCalendarAge(dobStr: string, cutoffStr: string): AgeResult | null {
  const dobMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dobStr);
  const cutoffMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(cutoffStr);
  if (!dobMatch || !cutoffMatch) return null;

  const dob = new Date(
    Date.UTC(Number(dobMatch[1]), Number(dobMatch[2]) - 1, Number(dobMatch[3]))
  );
  const cutoff = new Date(
    Date.UTC(Number(cutoffMatch[1]), Number(cutoffMatch[2]) - 1, Number(cutoffMatch[3]))
  );

  if (Number.isNaN(dob.getTime()) || Number.isNaN(cutoff.getTime()) || dob > cutoff) {
    return null;
  }

  let years = cutoff.getUTCFullYear() - dob.getUTCFullYear();
  let months = cutoff.getUTCMonth() - dob.getUTCMonth();
  let days = cutoff.getUTCDate() - dob.getUTCDate();

  if (days < 0) {
    months -= 1;
    const prevMonthLastDay = new Date(
      Date.UTC(cutoff.getUTCFullYear(), cutoff.getUTCMonth(), 0)
    ).getUTCDate();
    days += prevMonthLastDay;
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }

  return { years, months, days };
}

export function AgeCalculator({ lang }: { lang: LanguageCode }) {
  const dict = getDictionary(lang);
  const [dob, setDob] = useState("2001-06-15");
  const [cutoff, setCutoff] = useState("2027-01-01");
  const [result, setResult] = useState<AgeResult | null>(() =>
    calculateCalendarAge("2001-06-15", "2027-01-01")
  );
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const computed = calculateCalendarAge(dob, cutoff);
    if (!computed) {
      setResult(null);
      setError(dict.tools.invalidDates);
      return;
    }
    setError(null);
    setResult(computed);
  }

  return (
    <section className="rounded-xl border border-sp-border bg-white p-6 shadow-xs">
      <div className="mb-4 flex items-center gap-2">
        <Calculator className="h-5 w-5 text-sp-blue" aria-hidden="true" />
        <h2 className="text-xl font-bold text-sp-navy">{dict.tools.ageCalcTitle}</h2>
      </div>

      {/* Mandatory Assumption & Non-Official Ruling Notice (Blueprint Ch. 02) */}
      <div className="mb-5 flex items-start gap-2.5 rounded-lg border border-blue-200 bg-blue-50 p-3.5 text-xs sm:text-sm text-sp-navy">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-sp-blue" aria-hidden="true" />
        <p>{dict.tools.ageCalcDisclaimer}</p>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:items-end">
        <div>
          <label htmlFor="age-calc-dob" className="mb-1 block text-sm font-semibold text-sp-text">
            {dict.tools.dobLabel}
          </label>
          <input
            id="age-calc-dob"
            type="date"
            value={dob}
            onChange={(e) => setDob(e.target.value)}
            required
            className="w-full rounded-lg border border-sp-border bg-white px-3 py-2 text-sm text-sp-text"
          />
        </div>

        <div>
          <label htmlFor="age-calc-cutoff" className="mb-1 block text-sm font-semibold text-sp-text">
            {dict.tools.cutoffLabel}
          </label>
          <input
            id="age-calc-cutoff"
            type="date"
            value={cutoff}
            onChange={(e) => setCutoff(e.target.value)}
            required
            className="w-full rounded-lg border border-sp-border bg-white px-3 py-2 text-sm text-sp-text"
          />
        </div>

        <button
          type="submit"
          className="rounded-lg bg-sp-navy px-5 py-2.5 text-sm font-semibold text-white hover:bg-sp-navy-dark cursor-pointer"
        >
          {dict.tools.calculateBtn}
        </button>
      </form>

      {error && (
        <p role="alert" className="mt-4 text-sm font-semibold text-rose-700">
          {error}
        </p>
      )}

      {result && (
        <div
          role="status"
          aria-live="polite"
          className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 p-4"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-900">
            {dict.tools.resultPrefix}
          </p>
          <p className="mt-1 text-2xl font-extrabold text-sp-navy">
            {result.years} {dict.tools.years}, {result.months} {dict.tools.months},{" "}
            {result.days} {dict.tools.days}
          </p>
        </div>
      )}
    </section>
  );
}
