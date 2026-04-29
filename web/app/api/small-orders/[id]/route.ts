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

    const itemName = String(body.itemName ?? "").trim();
    if (!itemName) return badRequest("itemNameは必須です。");

    const uuidOrNull = (v: unknown) => {
      const s = String(v ?? "").trim();
      return s || null;
    };

    const updates: Record<string, unknown> = {
      order_date: String(body.orderDate ?? "").trim() || null,
      item_name: itemName,
      base_fee: toNumber(body.baseFee, 0),
      final_billing_amount: toNumber(body.finalBillingAmount, 0),
      order_category: String(body.orderCategory ?? "").trim() || null,
      order_type: String(body.orderType ?? "").trim() || null,
      estimate_id: uuidOrNull(body.estimateId),
      assignee_user_id: uuidOrNull(body.assigneeUserId),
      customer_branch_id: uuidOrNull(body.customerBranchId),
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
      version: expectedVersion + 1,
    };

    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("small_orders")
      .update(updates)
      .eq("id", id)
      .eq("version", expectedVersion)
      .select("*");
    if (error) return serverError("小口受注の更新に失敗しました。", error.message);
    if (!data || data.length === 0) {
      return conflict("小口受注が更新済みです。再読込してから更新してください。");
    }
    return NextResponse.json({ ok: true, data: data[0] }, { status: 200 });
  } catch (error) {
    const details = error instanceof Error ? error.message : "Unknown error";
    return serverError("小口受注の更新に失敗しました。", details);
  }
}
