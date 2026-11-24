#!/usr/bin/env node
/**
 * SarkariPulse Secret & Client-Bundle Isolation Scanner (Blueprint Ch. 07, 23, 27).
 * Scans workspace files for accidentally committed secrets, API keys, private keys,
 * or server-only credentials referenced in client-facing components/pages.
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const IGNORED_DIRS = new Set([
  "node_modules",
  ".next",
  ".git",
  "coverage",
  "out",
  "dist",
]);

const SECRET_PATTERNS = [
  { name: "Google/Gemini API Key", regex: /\bAIza[0-9A-Za-z_-]{35}\b/ },
  { name: "Private Key Header", regex: /-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----/ },
  { name: "Supabase Secret JWT", regex: /\beyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\b/ },
  { name: "Hardcoded Service Role Key Assignment", regex: /SUPABASE_SERVICE_ROLE_KEY\s*=\s*["']?[A-Za-z0-9._-]{20,}/ },
  { name: "Hardcoded Gemini Key Assignment", regex: /GEMINI_API_KEY\s*=\s*["']?[A-Za-z0-9._-]{20,}/ },
];

const findings = [];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (IGNORED_DIRS.has(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath);
      continue;
    }
    if (!/\.(ts|tsx|js|jsx|mjs|cjs|json|sql|yml|yaml|md|env|example)$/.test(entry.name)) {
      continue;
    }
    const rel = path.relative(ROOT, fullPath).replace(/\\/g, "/");
    const content = fs.readFileSync(fullPath, "utf8");

    for (const pattern of SECRET_PATTERNS) {
      if (pattern.regex.test(content)) {
        findings.push(`[SECRET] ${pattern.name} detected in ${rel}`);
      }
    }

    if (rel.startsWith("components/") || rel.startsWith("app/[lang]/")) {
      if (content.includes("SUPABASE_SERVICE_ROLE_KEY") || content.includes("supabase-admin")) {
        findings.push(`[ISOLATION] Server-only admin reference in client-facing file ${rel}`);
      }
    }
  }
}

walk(ROOT);

if (findings.length > 0) {
  console.error("SECURITY SCAN FAILED:");
  for (const f of findings) {
    console.error(`  - ${f}`);
  }
  process.exit(1);
}

console.log("SECURITY SCAN PASSED: zero leaked secrets or client-bundle admin imports detected.");
