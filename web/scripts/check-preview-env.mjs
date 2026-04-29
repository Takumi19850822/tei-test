/**
 * Cloudflare プレビュー前に web/.dev.vars を検査する。
 * 使い方: cd web && npm run check:env
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.join(__dirname, "..");
const devVarsPath = path.join(webRoot, ".dev.vars");

if (!fs.existsSync(devVarsPath)) {
  console.error("[check:env] NG: web/.dev.vars がありません。");
  console.error("  手順: web フォルダで  Copy-Item .dev.vars.example .dev.vars  （詳細は ENV_SETUP.md）");
  process.exit(1);
}

const raw = fs.readFileSync(devVarsPath, "utf8");
/** @type {Record<string, string>} */
const map = {};
for (const line of raw.split(/\r?\n/)) {
  const t = line.trim();
  if (!t || t.startsWith("#")) continue;
  const i = t.indexOf("=");
  if (i === -1) continue;
  const k = t.slice(0, i).trim();
  const v = t.slice(i + 1).trim();
  map[k] = v;
}

const errors = [];

const url = map.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
if (!url || url.includes("YOUR_PROJECT")) {
  errors.push("NEXT_PUBLIC_SUPABASE_URL が空かプレースホルダのままです。Supabase の Project URL を設定してください。");
}

const key = map.SUPABASE_SERVICE_ROLE_KEY?.trim() ?? "";
if (!key || key === "your_service_role_key") {
  errors.push(
    "SUPABASE_SERVICE_ROLE_KEY が空かプレースホルダのままです。Supabase の service_role キーを設定してください。",
  );
}

const nextJsEnv = map.NEXTJS_ENV?.trim() ?? "";
const isDevLike = nextJsEnv === "development";
const session = map.SESSION_SECRET?.trim() ?? "";
const sessionOk = session.length >= 32;

if (!isDevLike && !sessionOk) {
  errors.push(
    "NEXTJS_ENV=development の行がないため、SESSION_SECRET（32文字以上）が必須です。プレビューなら .dev.vars.example どおり NEXTJS_ENV=development を残してください。",
  );
}

if (errors.length > 0) {
  console.error("[check:env] web/.dev.vars に問題があります:");
  for (const e of errors) console.error("  - " + e);
  console.error("");
  console.error("  全文の手順: web/ENV_SETUP.md");
  process.exit(1);
}

console.log("[check:env] OK — web/.dev.vars はプレビューに進めます。次: npm run preview");
process.exit(0);
