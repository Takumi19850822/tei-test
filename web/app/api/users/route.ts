import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase";
import { forbidden, serverError, unauthorized } from "@/lib/api";
import { ensureMenuAccess } from "@/lib/authz";

/** 案件の営業担当選択など用。案件メニュー閲覧権限があれば利用可。 */
export async function GET(request: Request) {
  try {
    const access = await ensureMenuAccess(request, "cases", 1);
    if (!access.ok) {
      if (access.status === 401) return unauthorized(access.message ?? "Unauthorized");
      if (access.status === 403) return forbidden(access.message ?? "Forbidden");
      return serverError("権限チェックに失敗しました。", access.message);
    }

    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("users")
      .select("id, user_name, login_id, is_active")
      .order("user_name", { ascending: true });

    if (error) return serverError("ユーザー一覧の取得に失敗しました。", error.message);
    return NextResponse.json({ ok: true, data: data ?? [] }, { status: 200 });
  } catch (error) {
    const details = error instanceof Error ? error.message : "Unknown error";
    return serverError("ユーザー一覧の取得に失敗しました。", details);
  }
}
