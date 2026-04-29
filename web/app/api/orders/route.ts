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
    const access = await ensureMenuAccess(request, "orders", 1);
    if (!access.ok) {
      if (access.status === 401) return unauthorized(access.message ?? "Unauthorized");
      if (access.status === 403) return forbidden(access.message ?? "Forbidden");
      return serverError("権限チェックに失敗しました。", access.message);
    }

    const { searchParams } = new URL(request.url);
    const caseId = searchParams.get("caseId");
    const supabase = createSupabaseAdminClient();

    let query = supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (caseId) {
      query = query.eq("case_id", caseId);
    }

    const { data, error } = await query;

    if (error) {
      return serverError("受注一覧の取得に失敗しました。", error.message);
    }

    return NextResponse.json({ ok: true, data: data ?? [] }, { status: 200 });
  } catch (error) {
    const details = error instanceof Error ? error.message : "Unknown error";
    return serverError("受注一覧の取得に失敗しました。", details);
  }
}

export async function POST(request: Request) {
  try {
    const access = await ensureMenuAccess(request, "orders", 2);
    if (!access.ok) {
      if (access.status === 401) return unauthorized(access.message ?? "Unauthorized");
      if (access.status === 403) return forbidden(access.message ?? "Forbidden");
      return serverError("権限チェックに失敗しました。", access.message);
    }

    const body = await request.json();
    const caseId = String(body.caseId ?? "").trim();
    const estimateId =
      typeof body.estimateId === "string" ? body.estimateId.trim() : "";
    const orderTitle = String(body.orderTitle ?? "").trim();
    const orderDate = String(body.orderDate ?? "").trim();
    const status = String(body.status ?? "draft").trim();
    const note = String(body.note ?? "").trim();
    const amountExclTax = toNumber(body.amountExclTax, 0);
    const amountInclTax = toNumber(body.amountInclTax, amountExclTax);

    if (!caseId || !orderTitle) {
      return badRequest("案件IDと受注件名は必須です。");
    }

    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("orders")
      .insert({
        case_id: caseId,
        estimate_id: estimateId || null,
        order_title: orderTitle,
        order_date: orderDate || new Date().toISOString().slice(0, 10),
        status,
        amount_excl_tax: amountExclTax,
        amount_incl_tax: amountInclTax,
        note: note || null,
      })
      .select("*")
      .single();

    if (error) {
      return serverError("受注の作成に失敗しました。", error.message);
    }

    return NextResponse.json({ ok: true, data }, { status: 201 });
  } catch (error) {
    const details = error instanceof Error ? error.message : "Unknown error";
    return serverError("受注の作成に失敗しました。", details);
  }
}
