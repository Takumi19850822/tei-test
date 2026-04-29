import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase";
import { badRequest, serverError, toNumber } from "@/lib/api";
import { computeLineTaxAmount, computeParentTotals } from "@/lib/totals";

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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = String(searchParams.get("orderId") ?? "").trim();
    if (!orderId) {
      return badRequest("orderIdは必須です。");
    }

    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("order_lines")
      .select("*")
      .eq("order_id", orderId)
      .order("line_no", { ascending: true });

    if (error) {
      return serverError("受注明細の取得に失敗しました。", error.message);
    }

    return NextResponse.json({ ok: true, data: data ?? [] }, { status: 200 });
  } catch (error) {
    const details = error instanceof Error ? error.message : "Unknown error";
    return serverError("受注明細の取得に失敗しました。", details);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const orderId = String(body.orderId ?? "").trim();
    const itemName = String(body.itemName ?? "").trim();
    const lineNo = Number.parseInt(String(body.lineNo), 10);
    const unitPrice = toNumber(body.unitPrice, 0);
    const quantity = toNumber(body.quantity, 1);
    const taxRate = toNumber(body.taxRate, 10);
    const note = String(body.note ?? "").trim();

    if (!orderId || !itemName || !Number.isInteger(lineNo)) {
      return badRequest("orderId, lineNo, itemNameは必須です。");
    }

    const taxAmount =
      body.taxAmount !== undefined
        ? toNumber(body.taxAmount, 0)
        : computeLineTaxAmount(unitPrice, quantity, taxRate);

    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("order_lines")
      .insert({
        order_id: orderId,
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
      return serverError("受注明細の作成に失敗しました。", error.message);
    }

    await recalculateOrderTotals(orderId);
    return NextResponse.json({ ok: true, data }, { status: 201 });
  } catch (error) {
    const details = error instanceof Error ? error.message : "Unknown error";
    return serverError("受注明細の作成に失敗しました。", details);
  }
}
