import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase";
import {
  badRequest,
  conflict,
  forbidden,
  serverError,
  unauthorized,
} from "@/lib/api";
import { ensureMenuAccess } from "@/lib/authz";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  try {
    const access = await ensureMenuAccess(request, "customerBranches", 2);
    if (!access.ok) {
      if (access.status === 401) return unauthorized(access.message ?? "Unauthorized");
      if (access.status === 403) return forbidden(access.message ?? "Forbidden");
      return serverError("権限チェックに失敗しました。", access.message);
    }

    const { id } = await params;
    const body = await request.json();
    const expectedVersion = Number.parseInt(String(body.version), 10);
    if (!Number.isInteger(expectedVersion)) return badRequest("versionは必須です。");

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

    const updates: Record<string, unknown> = {
      version: expectedVersion + 1,
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
    };

    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("customer_branches")
      .update(updates)
      .eq("id", id)
      .eq("version", expectedVersion)
      .select("*");
    if (error) return serverError("顧客拠点の更新に失敗しました。", error.message);
    if (!data || data.length === 0) {
      return conflict("顧客拠点が更新済みです。再読込してから更新してください。");
    }
    return NextResponse.json({ ok: true, data: data[0] }, { status: 200 });
  } catch (error) {
    const details = error instanceof Error ? error.message : "Unknown error";
    return serverError("顧客拠点の更新に失敗しました。", details);
  }
}
