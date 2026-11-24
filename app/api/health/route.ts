import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/server/config/env";
import { createPublicSupabaseClient } from "@/server/db/supabase-public";

export async function GET() {
  const supabaseConfigured = isSupabaseConfigured();
  let dbReachable: boolean | null = null;

  if (supabaseConfigured) {
    const client = createPublicSupabaseClient();
    if (client) {
      const { error } = await client.from("states").select("code").limit(1);
      dbReachable = !error;
    }
  }

  return NextResponse.json(
    {
      status: "ok",
      service: "sarkaripulse",
      timestamp_utc: new Date().toISOString(),
      database: {
        configured: supabaseConfigured,
        reachable: dbReachable,
        mode: supabaseConfigured ? "supabase" : "sample_preview_local",
      },
    },
    {
      status: 200,
      headers: { "Cache-Control": "no-store" },
    }
  );
}
