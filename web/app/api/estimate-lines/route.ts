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
import { computeLineTaxAmount, computeParentTotals } from "@/lib/totals";

async function recalculateEstimateTotals(estimateId: string) {
  const supabase = createSupabaseAdminClient();
  const { data: lines, error: lineError } = await supabase
    .from("estimate_lines")
    .select("unit_price, quantity, tax_amount")
    .eq("estimate_id", estimateId);

  if (lineError) {
    throw new Error(lineError.message);
  }

  const totals = computeParentTotals(lines ?? []);
  const { error: updateError } = await supabase
    .from("estimates")
    .update({
      subtotal: totals.subtotal,
      tax_amount: totals.taxAmount,
      total_amount: totals.totalAmount,
    })
    .eq("id", estimateId);

  if (updateError) {
    throw new Error(updateError.message);
  }
}

export async function GET(request: Request) {
  try {
    const access = await ensureMenuAccess(request, "estimateLines", 1);
    if (!access.ok) {
      if (access.status === 401) return unauthorized(access.message ?? "Unauthorized");
      if (access.status === 403) return forbidden(access.message ?? "Forbidden");
      return serverError("権限チェックに失敗しました。", access.message);
    }

    const { searchParams } = new URL(request.url);
    const estimateId = String(searchParams.get("estimateId") ?? "").trim();
    if (!estimateId) {
      return badRequest("estimateIdは必須です。");
    }

    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("estimate_lines")
      .select("*")
      .eq("estimate_id", estimateId)
      .order("line_no", { ascending: true });

    if (error) {
      return serverError("見積明細の取得に失敗しました。", error.message);
    }

    return NextResponse.json({ ok: true, data: data ?? [] }, { status: 200 });
  } catch (error) {
    const details = error instanceof Error ? error.message : "Unknown error";
    return serverError("見積明細の取得に失敗しました。", details);
  }
}

export async function POST(request: Request) {
  try {
    const access = await ensureMenuAccess(request, "estimateLines", 2);
    if (!access.ok) {
      if (access.status === 401) return unauthorized(access.message ?? "Unauthorized");
      if (access.status === 403) return forbidden(access.message ?? "Forbidden");
      return serverError("権限チェックに失敗しました。", access.message);
    }

    const body = await request.json();
    const estimateId = String(body.estimateId ?? "").trim();
    const itemName = String(body.itemName ?? "").trim();
    const lineNo = Number.parseInt(String(body.lineNo), 10);
    const unitPrice = toNumber(body.unitPrice, 0);
    const quantity = toNumber(body.quantity, 1);
    const taxRate = toNumber(body.taxRate, 10);
    const note = String(body.note ?? "").trim();

    if (!estimateId || !itemName || !Number.isInteger(lineNo)) {
      return badRequest("estimateId, lineNo, itemNameは必須です。");
    }

    const taxAmount =
      body.taxAmount !== undefined
        ? toNumber(body.taxAmount, 0)
        : computeLineTaxAmount(unitPrice, quantity, taxRate);

    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("estimate_lines")
      .insert({
        estimate_id: estimateId,
        line_no: lineNo,
        item_name: itemName,
        unit_price: unitPrice,
        quantity,
        unit: String(body.unit ?? "").trim() || null,
        tax_rate: taxRate,
        tax_amount: taxAmount,
        note: note || null,
      })
      .select("*")
      .single();

    if (error) {
      return serverError("見積明細の作成に失敗しました。", error.message);
    }

    await recalculateEstimateTotals(estimateId);
    return NextResponse.json({ ok: true, data }, { status: 201 });
  } catch (error) {
    const details = error instanceof Error ? error.message : "Unknown error";
    return serverError("見積明細の作成に失敗しました。", details);
  }
}
