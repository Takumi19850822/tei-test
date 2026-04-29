import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase";
import {
  badRequest,
  forbidden,
  serverError,
  unauthorized,
} from "@/lib/api";
import { ensureMenuAccess } from "@/lib/authz";

export async function GET(request: Request) {
  try {
    const access = await ensureMenuAccess(request, "customerBranches", 1);
    if (!access.ok) {
      if (access.status === 401) return unauthorized(access.message ?? "Unauthorized");
      if (access.status === 403) return forbidden(access.message ?? "Forbidden");
      return serverError("権限チェックに失敗しました。", access.message);
    }
    const { searchParams } = new URL(request.url);
    const customerId = String(searchParams.get("customerId") ?? "").trim();
    if (!customerId) return badRequest("customerIdは必須です。");
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("customer_branches")
      .select("*")
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false });
    if (error) return serverError("顧客拠点の取得に失敗しました。", error.message);
    return NextResponse.json({ ok: true, data: data ?? [] }, { status: 200 });
  } catch (error) {
    const details = error instanceof Error ? error.message : "Unknown error";
    return serverError("顧客拠点の取得に失敗しました。", details);
  }
}

export async function POST(request: Request) {
  try {
    const access = await ensureMenuAccess(request, "customerBranches", 2);
    if (!access.ok) {
      if (access.status === 401) return unauthorized(access.message ?? "Unauthorized");
      if (access.status === 403) return forbidden(access.message ?? "Forbidden");
      return serverError("権限チェックに失敗しました。", access.message);
    }
    const body = await request.json();
    const customerId = String(body.customerId ?? "").trim();
    if (!customerId) return badRequest("customerIdは必須です。");
    const supabase = createSupabaseAdminClient();
    const closingRaw = body.closingDay;
    const paymentRaw = body.paymentDay;
    const closingDay =
      closingRaw === null || closingRaw === undefined || closingRaw === ""
        ? null
        : Number.parseInt(String(closingRaw), 10);
    const paymentDay =
      paymentRaw === null || paymentRaw === undefined || paymentRaw === ""
        ? null
        : Number.parseInt(String(paymentRaw), 10);

    const { data, error } = await supabase
      .from("customer_branches")
      .insert({
        customer_id: customerId,
        department_name: String(body.departmentName ?? "").trim() || null,
        postal_code: String(body.postalCode ?? "").trim() || null,
        prefecture: String(body.prefecture ?? "").trim() || null,
        city: String(body.city ?? "").trim() || null,
        address_line: String(body.addressLine ?? "").trim() || null,
        phone: String(body.phone ?? "").trim() || null,
        email: String(body.email ?? "").trim() || null,
        yayoi_code: String(body.yayoiCode ?? "").trim() || null,
        closing_day: Number.isInteger(closingDay) ? closingDay : null,
        payment_day: Number.isInteger(paymentDay) ? paymentDay : null,
        other_code: String(body.otherCode ?? "").trim() || null,
      })
      .select("*")
      .single();
    if (error) return serverError("顧客拠点の作成に失敗しました。", error.message);
    return NextResponse.json({ ok: true, data }, { status: 201 });
  } catch (error) {
    const details = error instanceof Error ? error.message : "Unknown error";
    return serverError("顧客拠点の作成に失敗しました。", details);
  }
}
