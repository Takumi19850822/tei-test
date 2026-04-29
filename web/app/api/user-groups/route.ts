import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase";
import { forbidden, serverError, unauthorized } from "@/lib/api";
import { ensureMenuAccess } from "@/lib/authz";

/** 所属グループのプルダウン用 */
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
      .from("user_groups")
      .select("id, group_name, version")
      .order("group_name", { ascending: true });

    if (error) return serverError("グループ一覧の取得に失敗しました。", error.message);
    return NextResponse.json({ ok: true, data: data ?? [] }, { status: 200 });
  } catch (error) {
    const details = error instanceof Error ? error.message : "Unknown error";
    return serverError("グループ一覧の取得に失敗しました。", details);
  }
}
