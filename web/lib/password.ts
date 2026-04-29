/** DB の password_hash。プレースホルダ・レガシー sha256:、推奨 pbkdf2: */

export const PLACEHOLDER_PASSWORD_HASH = "temporary_hash_replace_me";

const PBKDF2_ITER = 210_000;
const PBKDF2_HASH_BYTES = 32;
const PBKDF2_SALT_BYTES = 16;

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

function bytesEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i]! ^ b[i]!;
  return diff === 0;
}

async function pbkdf2Derive(
  password: string,
  salt: Uint8Array,
  iterations: number,
  lengthBytes: number,
): Promise<Uint8Array> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: salt as BufferSource, iterations, hash: "SHA-256" },
    keyMaterial,
    lengthBytes * 8,
  );
  return new Uint8Array(bits);
}

/** 新規保存・更新時に使用（ソルト付き PBKDF2） */
export async function hashPassword(plain: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(PBKDF2_SALT_BYTES));
  const hash = await pbkdf2Derive(plain, salt, PBKDF2_ITER, PBKDF2_HASH_BYTES);
  return `pbkdf2:${PBKDF2_ITER}:${b64url(salt)}:${b64url(hash)}`;
}

/** レガシー検証用（sha256: のみ生成） */
export async function fingerprintPassword(plain: string): Promise<string> {
  const data = new TextEncoder().encode(plain);
  const digest = await crypto.subtle.digest("SHA-256", data);
  const hex = Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `sha256:${hex}`;
}

export async function verifyPassword(plain: string, storedHash: string): Promise<boolean> {
  const s = String(storedHash ?? "").trim();
  if (!s || s === PLACEHOLDER_PASSWORD_HASH) {
    return false;
  }
  if (s.startsWith("pbkdf2:")) {
    const parts = s.split(":");
    if (parts.length !== 4) return false;
    const iter = Number.parseInt(parts[1]!, 10);
    if (!Number.isInteger(iter) || iter < 100_000) return false;
    let salt: Uint8Array;
    let expect: Uint8Array;
    try {
      salt = b64urlToBytes(parts[2]!);
      expect = b64urlToBytes(parts[3]!);
    } catch {
      return false;
    }
    if (salt.length < 8 || expect.length < 16) return false;
    const hash = await pbkdf2Derive(plain, salt, iter, expect.length);
    return bytesEqual(hash, expect);
  }
  if (s.startsWith("sha256:")) {
    return (await fingerprintPassword(plain)) === s;
  }
  return false;
}

/** ログイン成功後、sha256 だけ PBKDF2 へ繰り上げる判定 */
export function isLegacySha256Hash(storedHash: string): boolean {
  const s = String(storedHash ?? "").trim();
  return s.startsWith("sha256:");
}
