"use client";

import { useEffect, useState, FormEvent } from "react";
import Link from "next/link";
import { Bell, Bookmark, Download, ShieldCheck, Trash2 } from "lucide-react";
import { LanguageCode, RecruitmentRecord } from "@/lib/types/recruitment";
import { STATES, QUALIFICATIONS } from "@/lib/data/taxonomy";
import { resolveLocalizedText } from "@/lib/utils/formatters";
import { trackSafeEvent } from "@/lib/analytics/events";

const BOOKMARKS_KEY = "sarkaripulse_saved_slugs_v1";
const PREFS_KEY = "sarkaripulse_alert_prefs_v1";

interface AlertPrefsState {
  email: string;
  states: string[];
  qualifications: string[];
  frequency: "daily_digest" | "weekly_digest" | "instant_verified";
  isSubscribed: boolean;
}

const DEFAULT_PREFS: AlertPrefsState = {
  email: "",
  states: ["maharashtra"],
  qualifications: ["graduate"],
  frequency: "daily_digest",
  isSubscribed: false,
};

interface CandidateAccountClientProps {
  lang: LanguageCode;
  allRecords: readonly RecruitmentRecord[];
  supabaseConfigured: boolean;
}

export function CandidateAccountClient({
  lang,
  allRecords,
  supabaseConfigured,
}: CandidateAccountClientProps) {
  const [savedSlugs, setSavedSlugs] = useState<string[]>([]);
  const [prefs, setPrefs] = useState<AlertPrefsState>(DEFAULT_PREFS);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    try {
      const rawBm = window.localStorage.getItem(BOOKMARKS_KEY);
      if (rawBm) {
        const parsed = JSON.parse(rawBm);
        if (Array.isArray(parsed)) setSavedSlugs(parsed);
      }
      const rawPrefs = window.localStorage.getItem(PREFS_KEY);
      if (rawPrefs) {
        const parsed = JSON.parse(rawPrefs) as Partial<AlertPrefsState>;
        setPrefs({ ...DEFAULT_PREFS, ...parsed });
      }
    } catch {
      // Ignore storage access errors
    }
  }, []);

  const savedRecords = allRecords.filter((r) => savedSlugs.includes(r.slug));

  function removeBookmark(slug: string) {
    const next = savedSlugs.filter((s) => s !== slug);
    setSavedSlugs(next);
    try {
      window.localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(next));
    } catch {
      // Ignore
    }
  }

  function toggleSelection(field: "states" | "qualifications", value: string) {
    setPrefs((prev) => {
      const exists = prev[field].includes(value);
      return {
        ...prev,
        [field]: exists
          ? prev[field].filter((v) => v !== value)
          : [...prev[field], value],
      };
    });
  }

  function savePreferences(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    try {
      window.localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
    } catch {
      // Ignore
    }
    if (prefs.isSubscribed) {
      trackSafeEvent("alert_subscribed", {
        language: lang,
        channel: "email",
        frequency: prefs.frequency,
      });
    }
    setStatusMessage(
      supabaseConfigured
        ? "Preferences saved locally. Sign in with Supabase Auth to sync across devices."
        : "Preferences saved in your browser. Once Supabase Staging Auth & transactional email are connected (PRE-04, PRE-08), digest emails will sync automatically."
    );
  }

  function exportLocalData() {
    const payload = {
      exported_at_utc: new Date().toISOString(),
      saved_bookmarks: savedSlugs,
      alert_preferences: prefs,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sarkaripulse-my-preferences.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  function clearAllLocalData() {
    setSavedSlugs([]);
    setPrefs(DEFAULT_PREFS);
    try {
      window.localStorage.removeItem(BOOKMARKS_KEY);
      window.localStorage.removeItem(PREFS_KEY);
    } catch {
      // Ignore
    }
    setStatusMessage("All saved bookmarks and alert preferences have been cleared.");
  }

  return (
    <div className="space-y-6">
      {/* Privacy by Design Guarantee (Blueprint Ch. 17 & Ch. 23) */}
      <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 text-xs sm:text-sm text-sp-navy">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-sp-blue" aria-hidden="true" />
        <div>
          <p className="font-bold">Optional Account • Privacy by Design</p>
          <p className="mt-0.5 text-sp-muted">
            Full recruitment browsing never requires registration. SarkariPulse never asks for Aadhaar, PAN, caste certificates, passwords, OTPs, or bank credentials. Alerts are periodic digests from verified official notices (never real-time promises).
          </p>
        </div>
      </div>

      {/* Saved Bookmarks */}
      <section className="rounded-xl border border-sp-border bg-white p-6 shadow-xs">
        <h2 className="flex items-center gap-2 text-lg font-extrabold text-sp-navy">
          <Bookmark className="h-5 w-5 text-sp-blue" aria-hidden="true" />
          Saved Recruitments ({savedRecords.length})
        </h2>
        {savedRecords.length === 0 ? (
          <p className="mt-3 text-sm text-sp-muted">
            No saved recruitments yet. Click <strong>Save</strong> on any job card or detail page to track it here.
          </p>
        ) : (
          <ul className="mt-4 space-y-2.5">
            {savedRecords.map((rec) => (
              <li
                key={rec.slug}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-sp-border bg-sp-bg px-4 py-3"
              >
                <div>
                  <Link
                    href={`/${lang}/jobs/${rec.slug}`}
                    className="text-sm font-bold text-sp-navy hover:text-sp-blue hover:underline"
                  >
                    {resolveLocalizedText(rec.title, lang).value}
                  </Link>
                  <p className="text-xs text-sp-muted">
                    {resolveLocalizedText(rec.organisation, lang).value}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => removeBookmark(rec.slug)}
                  className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-white px-2.5 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50 cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Email Alert Digest Preferences */}
      <section className="rounded-xl border border-sp-border bg-white p-6 shadow-xs">
        <h2 className="flex items-center gap-2 text-lg font-extrabold text-sp-navy">
          <Bell className="h-5 w-5 text-sp-blue" aria-hidden="true" />
          Verified Email Alert Preferences
        </h2>

        {statusMessage && (
          <p
            role="status"
            className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-sm text-emerald-950"
          >
            {statusMessage}
          </p>
        )}

        <form onSubmit={savePreferences} className="mt-4 space-y-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="alert-email" className="mb-1 block text-xs font-semibold text-sp-navy">
                Email Address (used only for verified recruitment digests)
              </label>
              <input
                id="alert-email"
                type="email"
                value={prefs.email}
                onChange={(e) => setPrefs((p) => ({ ...p, email: e.target.value }))}
                placeholder="you@example.com"
                className="w-full rounded-lg border border-sp-border bg-white px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label htmlFor="alert-frequency" className="mb-1 block text-xs font-semibold text-sp-navy">
                Digest Frequency
              </label>
              <select
                id="alert-frequency"
                value={prefs.frequency}
                onChange={(e) =>
                  setPrefs((p) => ({
                    ...p,
                    frequency: e.target.value as AlertPrefsState["frequency"],
                  }))
                }
                className="w-full rounded-lg border border-sp-border bg-white px-3 py-2 text-sm"
              >
                <option value="daily_digest">Daily Verified Digest (Recommended)</option>
                <option value="weekly_digest">Weekly Summary Digest</option>
                <option value="instant_verified">As Verified (Periodic Scan)</option>
              </select>
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold text-sp-navy">States &amp; Scope</p>
            <div className="flex flex-wrap gap-2">
              {STATES.map((st) => {
                const active = prefs.states.includes(st.slug);
                return (
                  <button
                    key={st.slug}
                    type="button"
                    aria-pressed={active}
                    onClick={() => toggleSelection("states", st.slug)}
                    className={`rounded-full border px-3 py-1 text-xs font-semibold cursor-pointer ${
                      active
                        ? "border-sp-navy bg-sp-navy text-white"
                        : "border-sp-border bg-sp-bg text-sp-navy hover:border-sp-blue"
                    }`}
                  >
                    {resolveLocalizedText(st.name, lang).value}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold text-sp-navy">Qualifications</p>
            <div className="flex flex-wrap gap-2">
              {QUALIFICATIONS.map((q) => {
                const active = prefs.qualifications.includes(q.slug);
                return (
                  <button
                    key={q.slug}
                    type="button"
                    aria-pressed={active}
                    onClick={() => toggleSelection("qualifications", q.slug)}
                    className={`rounded-full border px-3 py-1 text-xs font-semibold cursor-pointer ${
                      active
                        ? "border-sp-navy bg-sp-navy text-white"
                        : "border-sp-border bg-sp-bg text-sp-navy hover:border-sp-blue"
                    }`}
                  >
                    {resolveLocalizedText(q.name, lang).value}
                  </button>
                );
              })}
            </div>
          </div>

          <label className="flex items-start gap-2 text-sm text-sp-text cursor-pointer">
            <input
              type="checkbox"
              checked={prefs.isSubscribed}
              onChange={(e) =>
                setPrefs((p) => ({ ...p, isSubscribed: e.target.checked }))
              }
              className="mt-1"
            />
            <span>
              I consent to receive verified SarkariPulse recruitment alert digests (one-click unsubscribe included in every email; never payment links or OTP prompts).
            </span>
          </label>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="submit"
              className="rounded-lg bg-sp-navy px-5 py-2.5 text-sm font-semibold text-white hover:bg-sp-navy-dark cursor-pointer"
            >
              Save Alert Preferences
            </button>
            <button
              type="button"
              onClick={exportLocalData}
              className="inline-flex items-center gap-1.5 rounded-lg border border-sp-border bg-white px-4 py-2.5 text-sm font-semibold text-sp-navy hover:bg-slate-100 cursor-pointer"
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              Export My Data (JSON)
            </button>
            <button
              type="button"
              onClick={clearAllLocalData}
              className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-white px-4 py-2.5 text-sm font-semibold text-rose-700 hover:bg-rose-50 cursor-pointer"
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              Delete Saved Data
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
