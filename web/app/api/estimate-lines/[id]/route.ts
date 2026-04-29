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
import { computeLineTaxAmount, computeParentTotals } from "@/lib/totals";
import { ensureMenuAccess } from "@/lib/authz";

type Params = {
  params: Promise<{ id: string }>;
};

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

export async function PATCH(request: Request, { params }: Params) {
  try {
    const access = await ensureMenuAccess(request, "estimateLines", 2);
    if (!access.ok) {
      if (access.status === 401) return unauthorized(access.message ?? "Unauthorized");
      if (access.status === 403) return forbidden(access.message ?? "Forbidden");
      return serverError("権限チェックに失敗しました。", access.message);
    }

    const { id } = await params;
    const body = await request.json();
    const expectedVersion = Number.parseInt(String(body.version), 10);

    if (!Number.isInteger(expectedVersion)) {
      return badRequest("versionは必須です。");
    }

    const updates: Record<string, unknown> = {
      version: expectedVersion + 1,
    };

    if (typeof body.itemName === "string") updates.item_name = body.itemName.trim();
    if (typeof body.unit === "string") updates.unit = body.unit.trim();
    if (typeof body.note === "string") updates.note = body.note.trim();
    if (body.unitPrice !== undefined) updates.unit_price = toNumber(body.unitPrice, 0);
    if (body.quantity !== undefined) updates.quantity = toNumber(body.quantity, 1);
    if (body.taxRate !== undefined) updates.tax_rate = toNumber(body.taxRate, 10);
    if (body.lineNo !== undefined)
      updates.line_no = Number.parseInt(String(body.lineNo), 10);

    if (body.taxAmount !== undefined) {
      updates.tax_amount = toNumber(body.taxAmount, 0);
    } else if (
      updates.unit_price !== undefined ||
      updates.quantity !== undefined ||
      updates.tax_rate !== undefined
    ) {
      const unitPrice = toNumber(updates.unit_price ?? body.currentUnitPrice ?? 0, 0);
      const quantity = toNumber(updates.quantity ?? body.currentQuantity ?? 1, 1);
      const taxRate = toNumber(updates.tax_rate ?? body.currentTaxRate ?? 10, 10);
      updates.tax_amount = computeLineTaxAmount(unitPrice, quantity, taxRate);
    }

    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("estimate_lines")
      .update(updates)
      .eq("id", id)
      .eq("version", expectedVersion)
      .select("*");

    if (error) {
      return serverError("見積明細の更新に失敗しました。", error.message);
    }

    if (!data || data.length === 0) {
      return conflict("見積明細が更新済みです。再読込してから更新してください。");
    }

    await recalculateEstimateTotals(data[0].estimate_id);
    return NextResponse.json({ ok: true, data: data[0] }, { status: 200 });
  } catch (error) {
    const details = error instanceof Error ? error.message : "Unknown error";
    return serverError("見積明細の更新に失敗しました。", details);
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const access = await ensureMenuAccess(_request, "estimateLines", 3);
    if (!access.ok) {
      if (access.status === 401) return unauthorized(access.message ?? "Unauthorized");
      if (access.status === 403) return forbidden(access.message ?? "Forbidden");
      return serverError("権限チェックに失敗しました。", access.message);
    }

    const { id } = await params;
    const supabase = createSupabaseAdminClient();

    const { data: currentRow, error: findError } = await supabase
      .from("estimate_lines")
      .select("id, estimate_id")
      .eq("id", id)
      .single();

    if (findError || !currentRow) {
      return serverError("見積明細の削除対象が見つかりません。", findError?.message);
    }

    const { error } = await supabase.from("estimate_lines").delete().eq("id", id);
    if (error) {
      return serverError("見積明細の削除に失敗しました。", error.message);
    }

    await recalculateEstimateTotals(currentRow.estimate_id);
    return NextResponse.json({ ok: true, data: { id } }, { status: 200 });
  } catch (error) {
    const details = error instanceof Error ? error.message : "Unknown error";
    return serverError("見積明細の削除に失敗しました。", details);
  }
}
