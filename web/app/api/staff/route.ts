import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase";
import {
  badRequest,
  forbidden,
  serverError,
  unauthorized,
} from "@/lib/api";
import { ensureMenuAccess } from "@/lib/authz";
import { hashPassword } from "@/lib/password";

export async function GET(request: Request) {
  try {
    const access = await ensureMenuAccess(request, "staff", 1);
    if (!access.ok) {
      if (access.status === 401) return unauthorized(access.message ?? "Unauthorized");
      if (access.status === 403) return forbidden(access.message ?? "Forbidden");
      return serverError("権限チェックに失敗しました。", access.message);
    }

    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("users")
      .select("id, login_id, user_name, group_id, email, phone, is_active, version, created_at")
      .order("user_name", { ascending: true });

    if (error) return serverError("社員一覧の取得に失敗しました。", error.message);
    return NextResponse.json({ ok: true, data: data ?? [] }, { status: 200 });
  } catch (error) {
    const details = error instanceof Error ? error.message : "Unknown error";
    return serverError("社員一覧の取得に失敗しました。", details);
  }
}

export async function POST(request: Request) {
  try {
    const access = await ensureMenuAccess(request, "staff", 2);
    if (!access.ok) {
      if (access.status === 401) return unauthorized(access.message ?? "Unauthorized");
      if (access.status === 403) return forbidden(access.message ?? "Forbidden");
      return serverError("権限チェックに失敗しました。", access.message);
    }

    const body = await request.json();
    const loginId = String(body.loginId ?? "").trim();
    const userName = String(body.userName ?? "").trim();
    if (!loginId || !userName) return badRequest("loginIdとuserNameは必須です。");

    const pwd = String(body.initialPassword ?? "").trim();
    if (!pwd) {
      return badRequest("初期パスワードは必須です（ログイン時に使用します）。");
    }
    const password_hash = await hashPassword(pwd);

    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("users")
      .insert({
        login_id: loginId,
        user_name: userName,
        password_hash,
        group_id: body.groupId ? String(body.groupId).trim() || null : null,
        email: String(body.email ?? "").trim() || null,
        phone: String(body.phone ?? "").trim() || null,
        is_active: body.isActive !== false,
      })
      .select("id, login_id, user_name, group_id, email, phone, is_active, version, created_at")
      .single();

    if (error) return serverError("社員の作成に失敗しました。", error.message);
    return NextResponse.json({ ok: true, data }, { status: 201 });
  } catch (error) {
    const details = error instanceof Error ? error.message : "Unknown error";
    return serverError("社員の作成に失敗しました。", details);
  }
}
