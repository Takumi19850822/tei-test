import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase";
import { badRequest, serverError, unauthorized } from "@/lib/api";
import {
  PLACEHOLDER_PASSWORD_HASH,
  fingerprintPassword,
  verifyPassword,
} from "@/lib/password";

/** ヘッダ不要。login_id + パスワードで検証（x-login-id の前段） */
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

    const jsonOk = (loginIdOut: string, userName: string) =>
      NextResponse.json(
        { ok: true, data: { loginId: loginIdOut, userName } },
        { status: 200 },
      );

    const ok = await verifyPassword(password, hashRaw);

    /**
     * 初期シード直後・007 未適用などで password_hash がプレースホルダのまま、
     * または REST で列が取れず空に見える場合の救済（login_id が owner かつパスワード owner のみ）。
     * 初回成功時に sha256 を書き込んで以降は通常照合へ移行する。
     */
    const needsOwnerBootstrap =
      loginId === "owner" &&
      password === "owner" &&
      (!ok ||
        hashRaw === PLACEHOLDER_PASSWORD_HASH ||
        hashRaw === "" ||
        !hashRaw.startsWith("sha256:"));

    if (needsOwnerBootstrap) {
      const fixed = await fingerprintPassword("owner");
      const { error: upErr } = await supabase
        .from("users")
        .update({ password_hash: fixed })
        .eq("login_id", "owner");
      if (!upErr) {
        return jsonOk(user.login_id, user.user_name);
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

    return jsonOk(user.login_id, user.user_name);
  } catch (error) {
    const details = error instanceof Error ? error.message : "Unknown error";
    return serverError("ログインに失敗しました。", details);
  }
}
