import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase";
import { badRequest, conflict, forbidden, serverError, unauthorized } from "@/lib/api";
import { ensureMenuAccess } from "@/lib/authz";
import { hashPassword } from "@/lib/password";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  try {
    const access = await ensureMenuAccess(request, "staff", 2);
    if (!access.ok) {
      if (access.status === 401) return unauthorized(access.message ?? "Unauthorized");
      if (access.status === 403) return forbidden(access.message ?? "Forbidden");
      return serverError("権限チェックに失敗しました。", access.message);
    }

    const { id } = await params;
    const body = await request.json();
    const expectedVersion = Number.parseInt(String(body.version), 10);
    if (!Number.isInteger(expectedVersion)) return badRequest("versionは必須です。");

    const loginId = String(body.loginId ?? "").trim();
    const userName = String(body.userName ?? "").trim();
    if (!loginId || !userName) return badRequest("loginIdとuserNameは必須です。");

    const updates: Record<string, unknown> = {
      login_id: loginId,
      user_name: userName,
      group_id: body.groupId ? String(body.groupId).trim() || null : null,
      email: String(body.email ?? "").trim() || null,
      phone: String(body.phone ?? "").trim() || null,
      is_active: Boolean(body.isActive),
      version: expectedVersion + 1,
    };

    const newPwd = String(body.newPassword ?? "").trim();
    if (newPwd) {
      updates.password_hash = await hashPassword(newPwd);
    }

    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("users")
      .update(updates)
      .eq("id", id)
      .eq("version", expectedVersion)
      .select("id, login_id, user_name, group_id, email, phone, is_active, version, created_at");

    if (error) return serverError("社員の更新に失敗しました。", error.message);
    if (!data || data.length === 0) {
      return conflict("社員が更新済みです。再読込してから更新してください。");
    }
    return NextResponse.json({ ok: true, data: data[0] }, { status: 200 });
  } catch (error) {
    const details = error instanceof Error ? error.message : "Unknown error";
    return serverError("社員の更新に失敗しました。", details);
  }
}
