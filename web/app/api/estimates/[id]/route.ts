import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase";
import { badRequest, conflict, serverError, toNumber } from "@/lib/api";

type Params = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const body = await request.json();
    const expectedVersion = Number.parseInt(String(body.version), 10);

    if (!Number.isInteger(expectedVersion)) {
      return badRequest("versionは必須です。");
    }

    const updates: Record<string, unknown> = {
      version: expectedVersion + 1,
    };

    if (typeof body.estimateSubject === "string")
      updates.estimate_subject = body.estimateSubject.trim();
    if (typeof body.estimateDate === "string")
      updates.estimate_date = body.estimateDate.trim();
    if (typeof body.status === "string") updates.status = body.status.trim();
    if (typeof body.note === "string") updates.note = body.note.trim();
    if (body.subtotal !== undefined) updates.subtotal = toNumber(body.subtotal, 0);
    if (body.taxAmount !== undefined) updates.tax_amount = toNumber(body.taxAmount, 0);
    if (body.totalAmount !== undefined)
      updates.total_amount = toNumber(body.totalAmount, 0);

    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("estimates")
      .update(updates)
      .eq("id", id)
      .eq("version", expectedVersion)
      .select("*");

    if (error) {
      return serverError("見積の更新に失敗しました。", error.message);
    }

    if (!data || data.length === 0) {
      return conflict("見積が更新済みです。再読込してから更新してください。");
    }

    return NextResponse.json({ ok: true, data: data[0] }, { status: 200 });
  } catch (error) {
    const details = error instanceof Error ? error.message : "Unknown error";
    return serverError("見積の更新に失敗しました。", details);
  }
}
