import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase";
import { badRequest, serverError, unauthorized } from "@/lib/api";
import {
  PLACEHOLDER_PASSWORD_HASH,
  hashPassword,
  isLegacySha256Hash,
  verifyPassword,
} from "@/lib/password";
import { buildSessionSetCookieHeader, signSessionToken } from "@/lib/session";

/** ヘッダ不要。login_id + パスワードで検証し、HttpOnly セッション Cookie を発行する。 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const loginId = String(body.loginId ?? "").trim();
    const password = String(body.password ?? "");
    if (!loginId) return badRequest("ログインIDは必須です。");
    if (!password) return badRequest("パスワードを入力してください。");

    const supabase = createSupabaseAdminClient();
    const { data: user, error } = await supabase
      .from("users")
      .select("login_id, user_name, is_active, password_hash")
      .eq("login_id", loginId)
      .maybeSingle();

    if (error) return serverError("ユーザーの確認に失敗しました。", error.message);
    if (!user || !user.is_active) {
      return unauthorized("ログインIDまたはパスワードが正しくありません。");
    }

    const hashRaw = String(user.password_hash ?? "").trim();

    function jsonOk(loginIdOut: string, userName: string) {
      return NextResponse.json(
        { ok: true, data: { loginId: loginIdOut, userName } },
        { status: 200 },
      );
    }

    const ok = await verifyPassword(password, hashRaw);

    const hashLooksUnset =
      hashRaw === PLACEHOLDER_PASSWORD_HASH ||
      hashRaw === "" ||
      (!hashRaw.startsWith("sha256:") && !hashRaw.startsWith("pbkdf2:"));

    const needsOwnerBootstrap =
      loginId === "owner" &&
      password === "owner" &&
      !ok &&
      hashLooksUnset;

    if (needsOwnerBootstrap) {
      const fixed = await hashPassword("owner");
      const { error: upErr } = await supabase
        .from("users")
        .update({ password_hash: fixed })
        .eq("login_id", "owner");
      if (!upErr) {
        const res = jsonOk(user.login_id, user.user_name);
        const token = await signSessionToken(user.login_id);
        res.headers.append("Set-Cookie", buildSessionSetCookieHeader(token));
        return res;
      }
      return serverError("ログイン時のパスワード初期化に失敗しました。", upErr.message);
    }

    if (hashRaw === PLACEHOLDER_PASSWORD_HASH || hashRaw === "") {
      if (loginId === "owner") {
        return unauthorized("ログインIDまたはパスワードが正しくありません。");
      }
      return unauthorized(
        "このユーザーはパスワードが未設定です。社員管理でパスワード（初期設定）を登録してください。",
      );
    }

    if (!ok) {
      return unauthorized("ログインIDまたはパスワードが正しくありません。");
    }

    if (isLegacySha256Hash(hashRaw)) {
      const newHash = await hashPassword(password);
      const { error: upErr } = await supabase
        .from("users")
        .update({ password_hash: newHash })
        .eq("login_id", loginId);
      if (upErr) {
        return serverError("パスワードハッシュの更新に失敗しました。", upErr.message);
      }
    }

    const res = jsonOk(user.login_id, user.user_name);
    const token = await signSessionToken(user.login_id);
    res.headers.append("Set-Cookie", buildSessionSetCookieHeader(token));
    return res;
  } catch (error) {
    const details = error instanceof Error ? error.message : "Unknown error";
    return serverError("ログインに失敗しました。", details);
  }
}
