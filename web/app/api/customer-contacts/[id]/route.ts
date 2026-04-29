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
    const access = await ensureMenuAccess(request, "customerContacts", 2);
    if (!access.ok) {
      if (access.status === 401) return unauthorized(access.message ?? "Unauthorized");
      if (access.status === 403) return forbidden(access.message ?? "Forbidden");
      return serverError("権限チェックに失敗しました。", access.message);
    }

    const { id } = await params;
    const body = await request.json();
    const expectedVersion = Number.parseInt(String(body.version), 10);
    if (!Number.isInteger(expectedVersion)) return badRequest("versionは必須です。");

    const updates = {
      version: expectedVersion + 1,
      company_name: String(body.companyName ?? "").trim() || null,
      position_name: String(body.positionName ?? "").trim() || null,
      phone: String(body.phone ?? "").trim() || null,
      email: String(body.email ?? "").trim() || null,
    };

    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("customer_contacts")
      .update(updates)
      .eq("id", id)
      .eq("version", expectedVersion)
      .select("*");
    if (error) return serverError("顧客担当者の更新に失敗しました。", error.message);
    if (!data || data.length === 0) {
      return conflict("顧客担当者が更新済みです。再読込してから更新してください。");
    }
    return NextResponse.json({ ok: true, data: data[0] }, { status: 200 });
  } catch (error) {
    const details = error instanceof Error ? error.message : "Unknown error";
    return serverError("顧客担当者の更新に失敗しました。", details);
  }
}
