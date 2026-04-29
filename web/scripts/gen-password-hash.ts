/**
 * マイグレーション用の password_hash を1回だけ生成する（結果のみ SQL に貼る）。
 * 使い方: cd web && npx --yes tsx scripts/gen-password-hash.ts "your-password"
 */
import { hashPassword } from "../lib/password";

const plain = process.argv[2] ?? "";
if (!plain) {
  console.error("Usage: npx tsx scripts/gen-password-hash.ts <password>");
  process.exit(1);
}
void (async () => {
  const h = await hashPassword(plain);
  console.log(h);
})();
