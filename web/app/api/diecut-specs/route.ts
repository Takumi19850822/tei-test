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
    const access = await ensureMenuAccess(request, "diecutSpecs", 1);
    if (!access.ok) {
      if (access.status === 401) return unauthorized(access.message ?? "Unauthorized");
      if (access.status === 403) return forbidden(access.message ?? "Forbidden");
      return serverError("権限チェックに失敗しました。", access.message);
    }

    const { searchParams } = new URL(request.url);
    const orderId = String(searchParams.get("orderId") ?? "").trim();
    if (!orderId) return badRequest("orderIdは必須です。");

    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("diecut_order_specs")
      .select("*")
      .eq("order_id", orderId)
      .order("created_at", { ascending: false });

    if (error) return serverError("抜き型仕様の取得に失敗しました。", error.message);
    return NextResponse.json({ ok: true, data: data ?? [] }, { status: 200 });
  } catch (error) {
    const details = error instanceof Error ? error.message : "Unknown error";
    return serverError("抜き型仕様の取得に失敗しました。", details);
  }
}

export async function POST(request: Request) {
  try {
    const access = await ensureMenuAccess(request, "diecutSpecs", 2);
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
      .from("diecut_order_specs")
      .insert({
        order_id: orderId,
        mold_no: String(body.moldNo ?? "").trim() || null,
        deposit_items: body.depositItems ?? {},
        machine_name: String(body.machineName ?? "").trim() || null,
        paper_name: String(body.paperName ?? "").trim() || null,
        paper_size: String(body.paperSize ?? "").trim() || null,
        surface_processing: String(body.surfaceProcessing ?? "").trim() || null,
        mold_jaw: String(body.moldJaw ?? "").trim() || null,
        mold_adjustment_value: String(body.moldAdjustmentValue ?? "").trim() || null,
        nick_1: String(body.nick1 ?? "").trim() || null,
        nick_2: String(body.nick2 ?? "").trim() || null,
        process_name_1: String(body.processName1 ?? "").trim() || null,
        process_name_2: String(body.processName2 ?? "").trim() || null,
        process_name_3: String(body.processName3 ?? "").trim() || null,
        process_name_4: String(body.processName4 ?? "").trim() || null,
        process_name_5: String(body.processName5 ?? "").trim() || null,
        process_name_6: String(body.processName6 ?? "").trim() || null,
        process_notes: body.processNotes ?? {},
      })
      .select("*")
      .single();
    if (error) return serverError("抜き型仕様の作成に失敗しました。", error.message);
    return NextResponse.json({ ok: true, data }, { status: 201 });
  } catch (error) {
    const details = error instanceof Error ? error.message : "Unknown error";
    return serverError("抜き型仕様の作成に失敗しました。", details);
  }
}
