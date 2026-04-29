import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase";
import {
  badRequest,
  conflict,
  serverError,
  unauthorized,
} from "@/lib/api";
import { hashPassword, verifyPassword } from "@/lib/password";
import { buildSessionSetCookieHeader, getSessionLoginId, signSessionToken } from "@/lib/session";

/**
 * ログイン中ユーザー自身のログインID・氏名・パスワード変更（社員管理の staff:2 不要）
 */
export async function PATCH(request: Request) {
  try {
    const sessionLoginId = await getSessionLoginId(request);
    if (!sessionLoginId) {
      return unauthorized("ログインが必要です。");
    }

    const body = await request.json();
    const currentPassword = String(body.currentPassword ?? "");
    const newPassword = String(body.newPassword ?? "").trim();
    const newLoginId = String(body.newLoginId ?? "").trim();
    const newUserName = String(body.userName ?? "").trim();
    const expectedVersion = Number.parseInt(String(body.version), 10);

    if (!currentPassword) {
      return badRequest("現在のパスワードを入力してください。");
    }
    if (!Number.isInteger(expectedVersion)) {
      return badRequest("versionは必須です。");
    }

    const supabase = createSupabaseAdminClient();
    const { data: user, error: fetchErr } = await supabase
      .from("users")
      .select("id, login_id, user_name, password_hash, is_active, version")
      .eq("login_id", sessionLoginId)
      .maybeSingle();

    if (fetchErr) {
      return serverError("ユーザーの取得に失敗しました。", fetchErr.message);
    }
    if (!user?.is_active) {
      return unauthorized("有効なユーザーが見つかりません。");
    }

    const hash = String(user.password_hash ?? "");
    const pwdOk = await verifyPassword(currentPassword, hash);
    if (!pwdOk) {
      return unauthorized("現在のパスワードが正しくありません。");
    }

    const wantPw = newPassword.length > 0;
    const wantId = newLoginId.length > 0 && newLoginId !== sessionLoginId;
    const wantName =
      newUserName.length > 0 && newUserName !== String(user.user_name ?? "").trim();
    if (!wantPw && !wantId && !wantName) {
      return badRequest(
        "新しいパスワード・ログインID・氏名のいずれかを変更してください。",
      );
    }

    if (wantId) {
      const { data: taken, error: takenErr } = await supabase
        .from("users")
        .select("id")
        .eq("login_id", newLoginId)
        .maybeSingle();
      if (takenErr) {
        return serverError("ログインIDの確認に失敗しました。", takenErr.message);
      }
      if (taken && taken.id !== user.id) {
        return conflict("そのログインIDは既に使われています。");
      }
    }

    const updates: Record<string, unknown> = {
      version: expectedVersion + 1,
    };
    if (wantPw) {
      updates.password_hash = await hashPassword(newPassword);
    }
    if (wantId) {
      updates.login_id = newLoginId;
    }
    if (wantName) {
      updates.user_name = newUserName;
    }

    const { data: updated, error: upErr } = await supabase
      .from("users")
      .update(updates)
      .eq("id", user.id)
      .eq("version", expectedVersion)
      .select("login_id, user_name, version")
      .maybeSingle();

    if (upErr) {
      return serverError("アカウントの更新に失敗しました。", upErr.message);
    }
    if (!updated) {
      return conflict("データが更新済みです。画面を再読み込みしてから再度お試しください。");
    }

    const res = NextResponse.json(
      {
        ok: true,
        data: {
          login_id: updated.login_id,
          user_name: updated.user_name,
          version: updated.version,
        },
      },
      { status: 200 },
    );
    if (wantId) {
      const token = await signSessionToken(updated.login_id);
      res.headers.append("Set-Cookie", buildSessionSetCookieHeader(token));
    }
    return res;
  } catch (error) {
    const details = error instanceof Error ? error.message : "Unknown error";
    return serverError("アカウントの更新に失敗しました。", details);
  }
}

/** 自分の表示用（権限メニュー不要） */
export async function GET(request: Request) {
  try {
    const sessionLoginId = await getSessionLoginId(request);
    if (!sessionLoginId) {
      return unauthorized("ログインが必要です。");
    }

    const supabase = createSupabaseAdminClient();
    const { data: user, error } = await supabase
      .from("users")
      .select("login_id, user_name, version")
      .eq("login_id", sessionLoginId)
      .eq("is_active", true)
      .maybeSingle();

    if (error) {
      return serverError("ユーザーの取得に失敗しました。", error.message);
    }
    if (!user) {
      return unauthorized("有効なユーザーが見つかりません。");
    }

    return NextResponse.json({ ok: true, data: user }, { status: 200 });
  } catch (error) {
    const details = error instanceof Error ? error.message : "Unknown error";
    return serverError("ユーザーの取得に失敗しました。", details);
  }
}
