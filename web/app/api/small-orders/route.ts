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
    const caseId = String(searchParams.get("caseId") ?? "").trim();
    const supabase = createSupabaseAdminClient();
    let query = supabase.from("small_orders").select("*").order("created_at", { ascending: false });
    if (caseId) query = query.eq("case_id", caseId);
    const { data, error } = await query;
    if (error) return serverError("小口受注一覧の取得に失敗しました。", error.message);
    return NextResponse.json({ ok: true, data: data ?? [] }, { status: 200 });
  } catch (error) {
    const details = error instanceof Error ? error.message : "Unknown error";
    return serverError("小口受注一覧の取得に失敗しました。", details);
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
    const caseId = String(body.caseId ?? "").trim();
    const itemName = String(body.itemName ?? "").trim();
    if (!caseId || !itemName) return badRequest("caseIdとitemNameは必須です。");

    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("small_orders")
      .insert({
        case_id: caseId,
        order_date: String(body.orderDate ?? "").trim() || new Date().toISOString().slice(0, 10),
        item_name: itemName,
        base_fee: toNumber(body.baseFee, 0),
        final_billing_amount: toNumber(body.finalBillingAmount, 0),
        order_category: String(body.orderCategory ?? "").trim() || null,
        order_type: String(body.orderType ?? "").trim() || null,
        estimate_id: body.estimateId ?? null,
        assignee_user_id: body.assigneeUserId ?? null,
        customer_branch_id: body.customerBranchId ?? null,
        delivery_date: String(body.deliveryDate ?? "").trim() || null,
        delivery_slot: String(body.deliverySlot ?? "").trim() || null,
        delivery_note: String(body.deliveryNote ?? "").trim() || null,
        planned_billing_amount: toNumber(body.plannedBillingAmount, 0),
        actual_billing_amount: toNumber(body.actualBillingAmount, 0),
        planned_human_rate_amount: toNumber(body.plannedHumanRateAmount, 0),
        actual_human_rate_amount: toNumber(body.actualHumanRateAmount, 0),
        planned_profit_amount: toNumber(body.plannedProfitAmount, 0),
        actual_profit_amount: toNumber(body.actualProfitAmount, 0),
        final_profit_amount: toNumber(body.finalProfitAmount, 0),
      })
      .select("*")
      .single();
    if (error) return serverError("小口受注の作成に失敗しました。", error.message);
    return NextResponse.json({ ok: true, data }, { status: 201 });
  } catch (error) {
    const details = error instanceof Error ? error.message : "Unknown error";
    return serverError("小口受注の作成に失敗しました。", details);
  }
}
