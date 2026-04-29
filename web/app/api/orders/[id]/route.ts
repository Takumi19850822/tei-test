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

type Params = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, { params }: Params) {
  try {
    const access = await ensureMenuAccess(request, "orders", 2);
    if (!access.ok) {
      if (access.status === 401) return unauthorized(access.message ?? "Unauthorized");
      if (access.status === 403) return forbidden(access.message ?? "Forbidden");
      return serverError("権限チェックに失敗しました。", access.message);
    }

    const { id } = await params;
    const body = await request.json();
    const expectedVersion = Number.parseInt(String(body.version), 10);

    if (!Number.isInteger(expectedVersion)) {
      return badRequest("versionは必須です。");
    }

    const updates: Record<string, unknown> = {
      version: expectedVersion + 1,
    };

    if (typeof body.orderTitle === "string")
      updates.order_title = body.orderTitle.trim();
    if (typeof body.orderDate === "string")
      updates.order_date = body.orderDate.trim();
    if (typeof body.status === "string") updates.status = body.status.trim();
    if (typeof body.note === "string") updates.note = body.note.trim();
    if (body.amountExclTax !== undefined)
      updates.amount_excl_tax = toNumber(body.amountExclTax, 0);
    if (body.amountInclTax !== undefined)
      updates.amount_incl_tax = toNumber(body.amountInclTax, 0);

    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("orders")
      .update(updates)
      .eq("id", id)
      .eq("version", expectedVersion)
      .select("*");

    if (error) {
      return serverError("受注の更新に失敗しました。", error.message);
    }

    if (!data || data.length === 0) {
      return conflict("受注が更新済みです。再読込してから更新してください。");
    }

    return NextResponse.json({ ok: true, data: data[0] }, { status: 200 });
  } catch (error) {
    const details = error instanceof Error ? error.message : "Unknown error";
    return serverError("受注の更新に失敗しました。", details);
  }
}
