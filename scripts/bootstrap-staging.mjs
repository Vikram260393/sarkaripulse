#!/usr/bin/env node
/**
 * SarkariPulse Staging & Live Readiness Bootstrap Checker (Blueprint Ch. 27).
 * Validates `.env.local` keys without printing any secret values, checks Git & CLI
 * readiness, and prints exact next commands for Supabase Staging & Vercel deployment.
 */
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const ROOT = process.cwd();
const envPath = path.join(ROOT, ".env.local");

function parseEnvFile(filePath) {
  const vars = {};
  if (!fs.existsSync(filePath)) return vars;
  for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim();
    vars[key] = val;
  }
  return vars;
}

function hasCommand(cmd) {
  try {
    execSync(`${cmd} --version`, { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

const envVars = { ...parseEnvFile(envPath), ...process.env };
const requiredKeys = [
  { key: "NEXT_PUBLIC_SUPABASE_URL", scope: "Supabase Staging URL (PRE-04)" },
  { key: "NEXT_PUBLIC_SUPABASE_ANON_KEY", scope: "Supabase Staging Anon Key (PRE-04)" },
  { key: "SUPABASE_SERVICE_ROLE_KEY", scope: "Supabase Server-Only Service Role Key (PRE-04)" },
  { key: "GEMINI_API_KEY", scope: "Gemini Server-Only API Key (PRE-05)" },
  { key: "CRON_SECRET", scope: "Cron Worker Bearer Secret" },
  { key: "WEBHOOK_SIGNING_SECRET", scope: "HMAC Webhook Signing Secret" },
];

console.log("=== SarkariPulse Staging & Launch Readiness Check ===");
console.log(`Local .env.local present : ${fs.existsSync(envPath) ? "YES" : "NO (copy .env.example to .env.local)"}`);
console.log(`Git CLI installed        : ${hasCommand("git") ? "YES" : "NO (install via: winget install --id Git.Git -e)"}`);
console.log(`Node.js / npm            : ${hasCommand("node") && hasCommand("npm") ? "READY" : "MISSING"}`);
console.log("");

let missingCount = 0;
for (const item of requiredKeys) {
  const present = Boolean(envVars[item.key] && envVars[item.key].length > 8);
  console.log(`[${present ? "SET" : "MISSING"}] ${item.key} — ${item.scope}`);
  if (!present) missingCount += 1;
}

console.log("");
if (missingCount === 0) {
  console.log("All required Staging environment keys are configured!");
  console.log("Next commands:");
  console.log("  1. npx supabase link --project-ref <STAGING_REF>");
  console.log("  2. npx supabase db push --include-all");
  console.log("  3. npx vercel --prod=false   (deploy Staging preview first)");
} else {
  console.log(`${missingCount} environment key(s) still missing in .env.local.`);
  console.log("Copy .env.example to .env.local and fill in your Staging keys (never commit .env.local).");
}
