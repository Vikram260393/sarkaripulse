/**
 * Supabase Edge Function — Scheduled Automation Dispatcher (Blueprint Ch. 04, 19, 20, 31).
 * Ensures production data collection runs via deployed backend services rather than
 * depending on a developer's laptop being powered on.
 *
 * Deployment (Supabase Staging / Production):
 *   npx supabase functions deploy scheduled-pipeline --no-verify-jwt
 *   npx supabase secrets set CRON_SECRET=<secret> SARKARIPULSE_APP_URL=https://staging.sarkaripulse.in
 */

// Deno runtime global declaration for TypeScript workspace compatibility
declare const Deno: {
  env: { get(key: string): string | undefined };
  serve(handler: (req: Request) => Response | Promise<Response>): void;
};

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "METHOD_NOT_ALLOWED" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  const cronSecret = Deno.env.get("CRON_SECRET")?.trim();
  const appUrl = Deno.env.get("SARKARIPULSE_APP_URL")?.trim();

  if (!cronSecret || !appUrl) {
    return new Response(
      JSON.stringify({ error: "MISCONFIGURED_EDGE_FUNCTION" }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    );
  }

  const incomingAuth = req.headers.get("authorization")?.trim();
  if (incomingAuth !== `Bearer ${cronSecret}`) {
    return new Response(JSON.stringify({ error: "UNAUTHORIZED" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const target = `${appUrl.replace(/\/+$/, "")}/api/cron/run`;
  const upstream = await fetch(target, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${cronSecret}`,
      "Content-Type": "application/json",
    },
  });

  const bodyText = await upstream.text();
  return new Response(bodyText, {
    status: upstream.status,
    headers: { "Content-Type": "application/json" },
  });
});
