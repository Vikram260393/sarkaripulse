import Link from "next/link";

export default function LocalizedNotFound() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 text-center">
      <p className="text-xs font-bold uppercase tracking-wider text-sp-blue">
        404 — Page Not Found
      </p>
      <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold text-sp-navy">
        We could not find that recruitment page
      </h1>
      <p className="mt-3 text-sm text-sp-muted">
        The link may have moved or the URL may be mistyped. Browse the latest verified government recruitments below.
      </p>
      <div className="mt-6 flex justify-center gap-3">
        <Link
          href="/en"
          className="rounded-lg bg-sp-navy px-4 py-2 text-sm font-semibold text-white hover:bg-sp-navy-dark"
        >
          Go to Homepage
        </Link>
        <Link
          href="/en/latest-jobs"
          className="rounded-lg border border-sp-border bg-white px-4 py-2 text-sm font-semibold text-sp-navy hover:bg-slate-100"
        >
          Browse Latest Jobs
        </Link>
      </div>
    </div>
  );
}
