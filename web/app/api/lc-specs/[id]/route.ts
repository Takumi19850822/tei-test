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
    const access = await ensureMenuAccess(request, "lcSpecs", 2);
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
    if (typeof body.deliveryMethod === "string")
      updates.delivery_method = body.deliveryMethod.trim();
    if (typeof body.specification === "string")
      updates.specification = body.specification.trim();
    if (typeof body.printSurface === "string")
      updates.print_surface = body.printSurface.trim();
    if (typeof body.printBack === "string")
      updates.print_back = body.printBack.trim();
    if (typeof body.memo === "string") updates.memo = body.memo.trim();
    if (body.suppliedMaterials !== undefined)
      updates.supplied_materials = body.suppliedMaterials ?? {};
    if (body.arrangedMaterials !== undefined)
      updates.arranged_materials = body.arrangedMaterials ?? {};

    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("lc_order_specs")
      .update(updates)
      .eq("id", id)
      .eq("version", expectedVersion)
      .select("*");
    if (error) return serverError("LC仕様の更新に失敗しました。", error.message);
    if (!data || data.length === 0) {
      return conflict("LC仕様が更新済みです。再読込してから更新してください。");
    }
    return NextResponse.json({ ok: true, data: data[0] }, { status: 200 });
  } catch (error) {
    const details = error instanceof Error ? error.message : "Unknown error";
    return serverError("LC仕様の更新に失敗しました。", details);
  }
}
