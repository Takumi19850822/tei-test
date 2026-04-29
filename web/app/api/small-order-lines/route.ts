import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase";
import {
  badRequest,
  forbidden,
  serverError,
  toNumber,
  unauthorized,
} from "@/lib/api";
import { ensureMenuAccess } from "@/lib/authz";

export async function GET(request: Request) {
  try {
    const access = await ensureMenuAccess(request, "smallOrders", 1);
    if (!access.ok) {
      if (access.status === 401) return unauthorized(access.message ?? "Unauthorized");
      if (access.status === 403) return forbidden(access.message ?? "Forbidden");
      return serverError("権限チェックに失敗しました。", access.message);
    }
    const { searchParams } = new URL(request.url);
    const smallOrderId = String(searchParams.get("smallOrderId") ?? "").trim();
    if (!smallOrderId) return badRequest("smallOrderIdは必須です。");
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("small_order_lines")
      .select("*")
      .eq("small_order_id", smallOrderId)
      .order("line_no", { ascending: true });
    if (error) return serverError("小口受注明細の取得に失敗しました。", error.message);
    return NextResponse.json({ ok: true, data: data ?? [] }, { status: 200 });
  } catch (error) {
    const details = error instanceof Error ? error.message : "Unknown error";
    return serverError("小口受注明細の取得に失敗しました。", details);
  }
}

export async function POST(request: Request) {
  try {
    const access = await ensureMenuAccess(request, "smallOrders", 2);
    if (!access.ok) {
      if (access.status === 401) return unauthorized(access.message ?? "Unauthorized");
      if (access.status === 403) return forbidden(access.message ?? "Forbidden");
      return serverError("権限チェックに失敗しました。", access.message);
    }
    const body = await request.json();
    const smallOrderId = String(body.smallOrderId ?? "").trim();
    const detailName = String(body.detailName ?? "").trim();
    if (!smallOrderId || !detailName) return badRequest("smallOrderIdとdetailNameは必須です。");

    const supabase = createSupabaseAdminClient();
    const lineNo = Number.parseInt(String(body.lineNo ?? ""), 10);
    let nextLineNo = lineNo;
    if (!Number.isInteger(nextLineNo) || nextLineNo < 1) {
      const { data: existing } = await supabase
        .from("small_order_lines")
        .select("line_no")
        .eq("small_order_id", smallOrderId)
        .order("line_no", { ascending: false })
        .limit(1);
      nextLineNo = (existing?.[0]?.line_no ?? 0) + 1;
    }

    const { data, error } = await supabase
      .from("small_order_lines")
      .insert({
        small_order_id: smallOrderId,
        template_id: body.templateId ?? null,
        line_no: nextLineNo,
        detail_name: detailName,
        planned_hours: toNumber(body.plannedHours, 0),
        actual_hours: toNumber(body.actualHours, 0),
        planned_amount: toNumber(body.plannedAmount, 0),
        actual_amount: toNumber(body.actualAmount, 0),
      })
      .select("*")
      .single();
    if (error) return serverError("小口受注明細の作成に失敗しました。", error.message);
    return NextResponse.json({ ok: true, data }, { status: 201 });
  } catch (error) {
    const details = error instanceof Error ? error.message : "Unknown error";
    return serverError("小口受注明細の作成に失敗しました。", details);
  }
}
