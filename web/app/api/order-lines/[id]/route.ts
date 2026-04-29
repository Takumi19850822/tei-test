import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase";
import { badRequest, conflict, serverError, toNumber } from "@/lib/api";
import { computeLineTaxAmount, computeParentTotals } from "@/lib/totals";

type Params = {
  params: Promise<{ id: string }>;
};

async function recalculateOrderTotals(orderId: string) {
  const supabase = createSupabaseAdminClient();
  const { data: lines, error: lineError } = await supabase
    .from("order_lines")
    .select("unit_price, quantity, tax_amount")
    .eq("order_id", orderId);

  if (lineError) {
    throw new Error(lineError.message);
  }

  const totals = computeParentTotals(lines ?? []);
  const { error: updateError } = await supabase
    .from("orders")
    .update({
      amount_excl_tax: totals.subtotal,
      amount_incl_tax: totals.totalAmount,
    })
    .eq("id", orderId);

  if (updateError) {
    throw new Error(updateError.message);
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
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
      .from("order_lines")
      .update(updates)
      .eq("id", id)
      .eq("version", expectedVersion)
      .select("*");

    if (error) {
      return serverError("受注明細の更新に失敗しました。", error.message);
    }

    if (!data || data.length === 0) {
      return conflict("受注明細が更新済みです。再読込してから更新してください。");
    }

    await recalculateOrderTotals(data[0].order_id);
    return NextResponse.json({ ok: true, data: data[0] }, { status: 200 });
  } catch (error) {
    const details = error instanceof Error ? error.message : "Unknown error";
    return serverError("受注明細の更新に失敗しました。", details);
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const supabase = createSupabaseAdminClient();

    const { data: currentRow, error: findError } = await supabase
      .from("order_lines")
      .select("id, order_id")
      .eq("id", id)
      .single();

    if (findError || !currentRow) {
      return serverError("受注明細の削除対象が見つかりません。", findError?.message);
    }

    const { error } = await supabase.from("order_lines").delete().eq("id", id);
    if (error) {
      return serverError("受注明細の削除に失敗しました。", error.message);
    }

    await recalculateOrderTotals(currentRow.order_id);
    return NextResponse.json({ ok: true, data: { id } }, { status: 200 });
  } catch (error) {
    const details = error instanceof Error ? error.message : "Unknown error";
    return serverError("受注明細の削除に失敗しました。", details);
  }
}
