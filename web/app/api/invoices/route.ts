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
    const access = await ensureMenuAccess(request, "invoices", 1);
    if (!access.ok) {
      if (access.status === 401) return unauthorized(access.message ?? "Unauthorized");
      if (access.status === 403) return forbidden(access.message ?? "Forbidden");
      return serverError("権限チェックに失敗しました。", access.message);
    }
    const { searchParams } = new URL(request.url);
    const orderId = String(searchParams.get("orderId") ?? "").trim();
    const supabase = createSupabaseAdminClient();
    let query = supabase
      .from("invoices")
      .select("*")
      .order("created_at", { ascending: false });
    if (orderId) query = query.eq("order_id", orderId);
    const { data, error } = await query;
    if (error) return serverError("請求の取得に失敗しました。", error.message);
    return NextResponse.json({ ok: true, data: data ?? [] }, { status: 200 });
  } catch (error) {
    const details = error instanceof Error ? error.message : "Unknown error";
    return serverError("請求の取得に失敗しました。", details);
  }
}

export async function POST(request: Request) {
  try {
    const access = await ensureMenuAccess(request, "invoices", 2);
    if (!access.ok) {
      if (access.status === 401) return unauthorized(access.message ?? "Unauthorized");
      if (access.status === 403) return forbidden(access.message ?? "Forbidden");
      return serverError("権限チェックに失敗しました。", access.message);
    }
    const body = await request.json();
    const orderId = String(body.orderId ?? "").trim();
    if (!orderId) return badRequest("orderIdは必須です。");
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("invoices")
      .insert({
        order_id: orderId,
        invoice_date: String(body.invoiceDate ?? "").trim() || new Date().toISOString().slice(0, 10),
        due_date: String(body.dueDate ?? "").trim() || null,
        total_amount: toNumber(body.totalAmount, 0),
      })
      .select("*")
      .single();
    if (error) return serverError("請求の作成に失敗しました。", error.message);
    return NextResponse.json({ ok: true, data }, { status: 201 });
  } catch (error) {
    const details = error instanceof Error ? error.message : "Unknown error";
    return serverError("請求の作成に失敗しました。", details);
  }
}
