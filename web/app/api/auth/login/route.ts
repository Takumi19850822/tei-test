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
    const loginIdInput = String(body.loginId ?? "").trim();
    const password = String(body.password ?? "");
    if (!loginIdInput) return badRequest("ログインIDは必須です。");
    if (!password) return badRequest("パスワードを入力してください。");

    const supabase = createSupabaseAdminClient();
    const dev = process.env.NODE_ENV === "development";

    async function findUserByLoginId(loginId: string) {
      return supabase
        .from("users")
        .select("login_id, user_name, is_active, password_hash")
        .eq("login_id", loginId)
        .maybeSingle();
    }

    let { data: user, error } = await findUserByLoginId(loginIdInput);
    if (error) return serverError("ユーザーの確認に失敗しました。", error.message);

    if (!user) {
      const lower = loginIdInput.toLowerCase();
      if (lower !== loginIdInput) {
        const second = await findUserByLoginId(lower);
        if (second.error) {
          return serverError("ユーザーの確認に失敗しました。", second.error.message);
        }
        user = second.data;
      }
    }

    if (!user || !user.is_active) {
      if (dev) {
        if (!user) {
          console.warn(
            "[auth/login] public.users に login_id が見つかりません:",
            loginIdInput,
          );
        } else {
          console.warn("[auth/login] is_active=false:", user.login_id);
        }
      }
      return unauthorized(
        "ログインIDまたはパスワードが正しくありません。",
        dev
          ? !user
            ? "開発用: ユーザーがありません。`013_kimura_user.sql` を Supabase の SQL で実行済みか、login_id の表記（半角・大文字小文字）を確認してください。"
            : "開発用: このアカウントは無効（is_active が false）です。"
          : undefined,
      );
    }

    const hashRaw = String(user.password_hash ?? "").trim();

    function jsonOk(loginIdOut: string, userName: string) {
      return NextResponse.json(
        { ok: true, data: { loginId: loginIdOut, userName } },
        { status: 200 },
      );
    }

    const ok = await verifyPassword(password, hashRaw);

    if (hashRaw === PLACEHOLDER_PASSWORD_HASH || hashRaw === "") {
      return unauthorized(
        "このユーザーはパスワードが未設定です。社員管理でパスワード（初期設定）を登録してください。",
      );
    }

    if (!ok) {
      if (dev) {
        console.warn("[auth/login] パスワードが一致しません:", user.login_id);
      }
      return unauthorized(
        "ログインIDまたはパスワードが正しくありません。",
        dev
          ? "開発用: パスワードが一致していません。`password_hash` が意図した平文に対するものか、別環境の DB を見ていないか確認してください。"
          : undefined,
      );
    }

    if (isLegacySha256Hash(hashRaw)) {
      const newHash = await hashPassword(password);
      const { error: upErr } = await supabase
        .from("users")
        .update({ password_hash: newHash })
        .eq("login_id", user.login_id);
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
