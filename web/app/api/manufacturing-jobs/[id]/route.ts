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
    const access = await ensureMenuAccess(request, "manufacturingJobs", 2);
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
    if (typeof body.note === "string") updates.note = body.note.trim();
    if (typeof body.moldNo === "string") updates.mold_no = body.moldNo.trim();
    if (typeof body.canDeliver === "boolean") updates.can_deliver = body.canDeliver;
    if (typeof body.deliveryDate === "string") updates.delivery_date = body.deliveryDate;
    if (typeof body.deliveryTime === "string") updates.delivery_time = body.deliveryTime;
    if (typeof body.laserDone === "boolean") updates.laser_done = body.laserDone;
    if (typeof body.moldingDone === "boolean") updates.molding_done = body.moldingDone;
    if (typeof body.inspectionDone === "boolean")
      updates.inspection_done = body.inspectionDone;
    if (typeof body.rubberPasteDone === "boolean")
      updates.rubber_paste_done = body.rubberPasteDone;
    if (typeof body.rubberInspectionDone === "boolean")
      updates.rubber_inspection_done = body.rubberInspectionDone;

    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("manufacturing_jobs")
      .update(updates)
      .eq("id", id)
      .eq("version", expectedVersion)
      .select("*");
    if (error) return serverError("型工務の更新に失敗しました。", error.message);
    if (!data || data.length === 0) {
      return conflict("型工務が更新済みです。再読込してから更新してください。");
    }
    return NextResponse.json({ ok: true, data: data[0] }, { status: 200 });
  } catch (error) {
    const details = error instanceof Error ? error.message : "Unknown error";
    return serverError("型工務の更新に失敗しました。", details);
  }
}
