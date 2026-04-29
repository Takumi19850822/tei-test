const COOKIE_NAME = "tei_session";
const MAX_AGE_SEC = 7 * 24 * 3600;

/** ローカル `next dev`、または `.dev.vars` の `NEXTJS_ENV=development`（Cloudflare プレビュー等） */
function isDevLikeRuntime(): boolean {
  return (
    process.env.NODE_ENV === "development" ||
    process.env.NEXTJS_ENV === "development"
  );
}

function getSessionSecret(): string {
  const s = process.env.SESSION_SECRET?.trim();
  if (s && s.length >= 32) return s;
  if (isDevLikeRuntime()) {
    return "dev-tei-session-secret-32chars-min!!";
  }
  throw new Error(
    "SESSION_SECRET が未設定です（32文字以上が必要です）。本番の Worker では wrangler secret またはダッシュボードで設定してください。",
  );
}

function b64url(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]!);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlToBytes(s: string): Uint8Array {
  const pad = "=".repeat((4 - (s.length % 4)) % 4);
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + pad;
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)!;
  return out;
}

async function hmacSha256B64url(message: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(message),
  );
  return b64url(new Uint8Array(sig));
}

function sigEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function signSessionToken(loginId: string): Promise<string> {
  const exp = Math.floor(Date.now() / 1000) + MAX_AGE_SEC;
  const payload = JSON.stringify({ lid: loginId.trim(), exp });
  const payloadB64 = b64url(new TextEncoder().encode(payload));
  const sig = await hmacSha256B64url(payloadB64, getSessionSecret());
  return `${payloadB64}.${sig}`;
}

export async function verifySessionToken(token: string): Promise<string | null> {
  const trimmed = token.trim();
  const dot = trimmed.lastIndexOf(".");
  if (dot <= 0) return null;
  const payloadB64 = trimmed.slice(0, dot);
  const sig = trimmed.slice(dot + 1);
  const expectSig = await hmacSha256B64url(payloadB64, getSessionSecret());
  if (!sigEqual(sig, expectSig)) return null;
  let payload: { lid?: string; exp?: number };
  try {
    payload = JSON.parse(new TextDecoder().decode(b64urlToBytes(payloadB64))) as {
      lid?: string;
      exp?: number;
    };
  } catch {
    return null;
  }
  if (typeof payload.exp !== "number" || payload.exp < Math.floor(Date.now() / 1000)) {
    return null;
  }
  if (typeof payload.lid !== "string" || !payload.lid.trim()) return null;
  return payload.lid.trim();
}

function parseCookies(header: string | null): Record<string, string> {
  const out: Record<string, string> = {};
  if (!header) return out;
  for (const part of header.split(";")) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    const k = part.slice(0, idx).trim();
    const v = part.slice(idx + 1).trim();
    if (k) out[k] = decodeURIComponent(v);
  }
  return out;
}

export async function getSessionLoginId(request: Request): Promise<string | null> {
  const raw = parseCookies(request.headers.get("cookie"))[COOKIE_NAME];
  if (!raw) return null;
  return verifySessionToken(raw);
}

export function buildSessionSetCookieHeader(token: string): string {
  const secure = process.env.NODE_ENV === "production";
  const tail = secure ? "; Secure" : "";
  return `${COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${MAX_AGE_SEC}${tail}`;
}

export function buildClearSessionCookieHeader(): string {
  const secure = process.env.NODE_ENV === "production";
  const tail = secure ? "; Secure" : "";
  return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${tail}`;
}

export { COOKIE_NAME as SESSION_COOKIE_NAME };
