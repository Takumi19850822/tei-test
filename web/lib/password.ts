/** DB の password_hash。プレースホルダ・レガシー sha256:、推奨 pbkdf2: */

import { pbkdf2Async } from "@noble/hashes/pbkdf2.js";
import { sha256 } from "@noble/hashes/sha2.js";

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

/**
 * PBKDF2-HMAC-SHA256。Web Crypto（特に Cloudflare Workers）では iterations が 10 万回で打ち切られるため、
 * 同じアルゴリズムで制限のない実装を使う。
 */
async function pbkdf2Derive(
  password: string,
  salt: Uint8Array,
  iterations: number,
  lengthBytes: number,
): Promise<Uint8Array> {
  return pbkdf2Async(sha256, password, salt, { c: iterations, dkLen: lengthBytes });
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
