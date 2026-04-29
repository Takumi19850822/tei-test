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
    const access = await ensureMenuAccess(request, "lcSpecs", 1);
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
      .from("lc_order_specs")
      .select("*")
      .eq("order_id", orderId)
      .order("created_at", { ascending: false });

    if (error) return serverError("LC仕様の取得に失敗しました。", error.message);
    return NextResponse.json({ ok: true, data: data ?? [] }, { status: 200 });
  } catch (error) {
    const details = error instanceof Error ? error.message : "Unknown error";
    return serverError("LC仕様の取得に失敗しました。", details);
  }
}

export async function POST(request: Request) {
  try {
    const access = await ensureMenuAccess(request, "lcSpecs", 2);
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
      .from("lc_order_specs")
      .insert({
        order_id: orderId,
        delivery_destination_id: body.deliveryDestinationId ?? null,
        delivery_method: String(body.deliveryMethod ?? "").trim() || null,
        data_note: String(body.dataNote ?? "").trim() || null,
        specification: String(body.specification ?? "").trim() || null,
        supplied_materials: body.suppliedMaterials ?? {},
        arranged_materials: body.arrangedMaterials ?? {},
        print_surface: String(body.printSurface ?? "").trim() || null,
        print_back: String(body.printBack ?? "").trim() || null,
        varnish: String(body.varnish ?? "").trim() || null,
        plate: String(body.plate ?? "").trim() || null,
        pp: String(body.pp ?? "").trim() || null,
        wpp: String(body.wpp ?? "").trim() || null,
        lamination: String(body.lamination ?? "").trim() || null,
        memo: String(body.memo ?? "").trim() || null,
        image_url: String(body.imageUrl ?? "").trim() || null,
      })
      .select("*")
      .single();
    if (error) return serverError("LC仕様の作成に失敗しました。", error.message);
    return NextResponse.json({ ok: true, data }, { status: 201 });
  } catch (error) {
    const details = error instanceof Error ? error.message : "Unknown error";
    return serverError("LC仕様の作成に失敗しました。", details);
  }
}
