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
    const access = await ensureMenuAccess(request, "taxRates", 1);
    if (!access.ok) {
      if (access.status === 401) return unauthorized(access.message ?? "Unauthorized");
      if (access.status === 403) return forbidden(access.message ?? "Forbidden");
      return serverError("権限チェックに失敗しました。", access.message);
    }

    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("tax_rates")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) return serverError("税率一覧の取得に失敗しました。", error.message);
    return NextResponse.json({ ok: true, data: data ?? [] }, { status: 200 });
  } catch (error) {
    const details = error instanceof Error ? error.message : "Unknown error";
    return serverError("税率一覧の取得に失敗しました。", details);
  }
}

export async function POST(request: Request) {
  try {
    const access = await ensureMenuAccess(request, "taxRates", 2);
    if (!access.ok) {
      if (access.status === 401) return unauthorized(access.message ?? "Unauthorized");
      if (access.status === 403) return forbidden(access.message ?? "Forbidden");
      return serverError("権限チェックに失敗しました。", access.message);
    }

    const body = await request.json();
    const taxName = String(body.taxName ?? "").trim();
    const rate = toNumber(body.rate, 0);
    const roundingMethod = Number.parseInt(String(body.roundingMethod ?? 2), 10);
    const taxationType = String(body.taxationType ?? "taxable").trim();
    const active = body.active !== false;
    if (!taxName) return badRequest("taxNameは必須です。");

    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("tax_rates")
      .insert({
        tax_name: taxName,
        rate,
        rounding_method: Number.isInteger(roundingMethod) ? roundingMethod : 2,
        taxation_type: taxationType,
        active,
      })
      .select("*")
      .single();
    if (error) return serverError("税率作成に失敗しました。", error.message);
    return NextResponse.json({ ok: true, data }, { status: 201 });
  } catch (error) {
    const details = error instanceof Error ? error.message : "Unknown error";
    return serverError("税率作成に失敗しました。", details);
  }
}
