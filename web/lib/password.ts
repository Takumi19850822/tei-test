/** DB の password_hash と照合（sha256: プレフィックスは Web Crypto SHA-256） */
export const PLACEHOLDER_PASSWORD_HASH = "temporary_hash_replace_me";

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
  if (s.startsWith("sha256:")) {
    return (await fingerprintPassword(plain)) === s;
  }
  return false;
}
