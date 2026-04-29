import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase";
import {
  badRequest,
  conflict,
  forbidden,
  serverError,
  toNumber,
  unauthorized,
} from "@/lib/api";
import { ensureMenuAccess } from "@/lib/authz";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  try {
    const access = await ensureMenuAccess(request, "smallOrders", 2);
    if (!access.ok) {
      if (access.status === 401) return unauthorized(access.message ?? "Unauthorized");
      if (access.status === 403) return forbidden(access.message ?? "Forbidden");
      return serverError("権限チェックに失敗しました。", access.message);
    }

    const { id } = await params;
    const body = await request.json();
    const expectedVersion = Number.parseInt(String(body.version), 10);
    if (!Number.isInteger(expectedVersion)) return badRequest("versionは必須です。");

    const detailName = String(body.detailName ?? "").trim();
    if (!detailName) return badRequest("detailNameは必須です。");

    const payload: Record<string, unknown> = {
      version: expectedVersion + 1,
      detail_name: detailName,
      planned_hours: toNumber(body.plannedHours, 0),
      actual_hours: toNumber(body.actualHours, 0),
      planned_amount: toNumber(body.plannedAmount, 0),
      actual_amount: toNumber(body.actualAmount, 0),
    };
    if (body.templateId !== undefined) {
      payload.template_id = body.templateId || null;
    }

    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("small_order_lines")
      .update(payload)
      .eq("id", id)
      .eq("version", expectedVersion)
      .select("*");
    if (error) return serverError("小口受注明細の更新に失敗しました。", error.message);
    if (!data || data.length === 0) {
      return conflict("小口受注明細が更新済みです。再読込してから更新してください。");
    }
    return NextResponse.json({ ok: true, data: data[0] }, { status: 200 });
  } catch (error) {
    const details = error instanceof Error ? error.message : "Unknown error";
    return serverError("小口受注明細の更新に失敗しました。", details);
  }
}
