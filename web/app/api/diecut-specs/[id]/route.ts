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
    const access = await ensureMenuAccess(request, "diecutSpecs", 2);
    if (!access.ok) {
      if (access.status === 401) return unauthorized(access.message ?? "Unauthorized");
      if (access.status === 403) return forbidden(access.message ?? "Forbidden");
      return serverError("権限チェックに失敗しました。", access.message);
    }

    const { id } = await params;
    const body = await request.json();
    const expectedVersion = Number.parseInt(String(body.version), 10);
    if (!Number.isInteger(expectedVersion)) return badRequest("versionは必須です。");

    const updates: Record<string, unknown> = { version: expectedVersion + 1 };
    if (typeof body.moldNo === "string") updates.mold_no = body.moldNo.trim();
    if (body.depositItems !== undefined) updates.deposit_items = body.depositItems ?? {};
    if (typeof body.machineName === "string")
      updates.machine_name = body.machineName.trim();
    if (typeof body.paperName === "string") updates.paper_name = body.paperName.trim();
    if (typeof body.paperSize === "string") updates.paper_size = body.paperSize.trim();
    if (typeof body.surfaceProcessing === "string")
      updates.surface_processing = body.surfaceProcessing.trim();
    if (typeof body.moldJaw === "string") updates.mold_jaw = body.moldJaw.trim();
    if (typeof body.moldAdjustmentValue === "string")
      updates.mold_adjustment_value = body.moldAdjustmentValue.trim();
    if (typeof body.nick1 === "string") updates.nick_1 = body.nick1.trim();
    if (typeof body.nick2 === "string") updates.nick_2 = body.nick2.trim();
    if (typeof body.processName1 === "string")
      updates.process_name_1 = body.processName1.trim();
    if (typeof body.processName2 === "string")
      updates.process_name_2 = body.processName2.trim();
    if (typeof body.processName3 === "string")
      updates.process_name_3 = body.processName3.trim();
    if (typeof body.processName4 === "string")
      updates.process_name_4 = body.processName4.trim();
    if (typeof body.processName5 === "string")
      updates.process_name_5 = body.processName5.trim();
    if (typeof body.processName6 === "string")
      updates.process_name_6 = body.processName6.trim();
    if (body.processNotes !== undefined) updates.process_notes = body.processNotes ?? {};

    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("diecut_order_specs")
      .update(updates)
      .eq("id", id)
      .eq("version", expectedVersion)
      .select("*");
    if (error) return serverError("抜き型仕様の更新に失敗しました。", error.message);
    if (!data || data.length === 0) {
      return conflict("抜き型仕様が更新済みです。再読込してから更新してください。");
    }
    return NextResponse.json({ ok: true, data: data[0] }, { status: 200 });
  } catch (error) {
    const details = error instanceof Error ? error.message : "Unknown error";
    return serverError("抜き型仕様の更新に失敗しました。", details);
  }
}
