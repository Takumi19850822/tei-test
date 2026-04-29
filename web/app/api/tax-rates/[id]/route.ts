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
    const access = await ensureMenuAccess(request, "taxRates", 2);
    if (!access.ok) {
      if (access.status === 401) return unauthorized(access.message ?? "Unauthorized");
      if (access.status === 403) return forbidden(access.message ?? "Forbidden");
      return serverError("権限チェックに失敗しました。", access.message);
    }

    const body = await request.json();
    const expectedVersion = Number.parseInt(String(body.version), 10);
    if (!Number.isInteger(expectedVersion)) return badRequest("versionは必須です。");

    const taxName = String(body.taxName ?? "").trim();
    if (!taxName) return badRequest("taxNameは必須です。");

    const updates = {
      tax_name: taxName,
      rate: toNumber(body.rate, 0),
      rounding_method: Number.parseInt(String(body.roundingMethod ?? 2), 10),
      taxation_type: String(body.taxationType ?? "taxable").trim(),
      active: body.active !== false,
      version: expectedVersion + 1,
    };

    const { id } = await params;
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("tax_rates")
      .update(updates)
      .eq("id", id)
      .eq("version", expectedVersion)
      .select("*");
    if (error) return serverError("税率更新に失敗しました。", error.message);
    if (!data || data.length === 0) {
      return conflict("税率が更新済みです。再読込してから更新してください。");
    }
    return NextResponse.json({ ok: true, data: data[0] }, { status: 200 });
  } catch (error) {
    const details = error instanceof Error ? error.message : "Unknown error";
    return serverError("税率更新に失敗しました。", details);
  }
}
