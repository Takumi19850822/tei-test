import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase";
import {
  badRequest,
  forbidden,
  serverError,
  unauthorized,
} from "@/lib/api";
import { ensureMenuAccess } from "@/lib/authz";

export async function GET(request: Request) {
  try {
    const access = await ensureMenuAccess(request, "customers", 1);
    if (!access.ok) {
      if (access.status === 401) return unauthorized(access.message ?? "Unauthorized");
      if (access.status === 403) return forbidden(access.message ?? "Forbidden");
      return serverError("権限チェックに失敗しました。", access.message);
    }
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) return serverError("顧客一覧の取得に失敗しました。", error.message);
    return NextResponse.json({ ok: true, data: data ?? [] }, { status: 200 });
  } catch (error) {
    const details = error instanceof Error ? error.message : "Unknown error";
    return serverError("顧客一覧の取得に失敗しました。", details);
  }
}

export async function POST(request: Request) {
  try {
    const access = await ensureMenuAccess(request, "customers", 2);
    if (!access.ok) {
      if (access.status === 401) return unauthorized(access.message ?? "Unauthorized");
      if (access.status === 403) return forbidden(access.message ?? "Forbidden");
      return serverError("権限チェックに失敗しました。", access.message);
    }
    const body = await request.json();
    const organizationName = String(body.organizationName ?? "").trim();
    if (!organizationName) return badRequest("顧客団体名は必須です。");

    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("customers")
      .insert({
        organization_name: organizationName,
        department_name: String(body.departmentName ?? "").trim() || null,
        is_active: body.isActive !== false,
      })
      .select("*")
      .single();
    if (error) return serverError("顧客作成に失敗しました。", error.message);
    return NextResponse.json({ ok: true, data }, { status: 201 });
  } catch (error) {
    const details = error instanceof Error ? error.message : "Unknown error";
    return serverError("顧客作成に失敗しました。", details);
  }
}
