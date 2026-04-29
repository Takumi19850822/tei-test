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
    const access = await ensureMenuAccess(request, "customerContacts", 1);
    if (!access.ok) {
      if (access.status === 401) return unauthorized(access.message ?? "Unauthorized");
      if (access.status === 403) return forbidden(access.message ?? "Forbidden");
      return serverError("権限チェックに失敗しました。", access.message);
    }
    const { searchParams } = new URL(request.url);
    const branchId = String(searchParams.get("customerBranchId") ?? "").trim();
    if (!branchId) return badRequest("customerBranchIdは必須です。");
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("customer_contacts")
      .select("*")
      .eq("customer_branch_id", branchId)
      .order("created_at", { ascending: false });
    if (error) return serverError("顧客担当者の取得に失敗しました。", error.message);
    return NextResponse.json({ ok: true, data: data ?? [] }, { status: 200 });
  } catch (error) {
    const details = error instanceof Error ? error.message : "Unknown error";
    return serverError("顧客担当者の取得に失敗しました。", details);
  }
}

export async function POST(request: Request) {
  try {
    const access = await ensureMenuAccess(request, "customerContacts", 2);
    if (!access.ok) {
      if (access.status === 401) return unauthorized(access.message ?? "Unauthorized");
      if (access.status === 403) return forbidden(access.message ?? "Forbidden");
      return serverError("権限チェックに失敗しました。", access.message);
    }
    const body = await request.json();
    const branchId = String(body.customerBranchId ?? "").trim();
    if (!branchId) return badRequest("customerBranchIdは必須です。");
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("customer_contacts")
      .insert({
        customer_branch_id: branchId,
        company_name: String(body.companyName ?? "").trim() || null,
        position_name: String(body.positionName ?? "").trim() || null,
        phone: String(body.phone ?? "").trim() || null,
        email: String(body.email ?? "").trim() || null,
      })
      .select("*")
      .single();
    if (error) return serverError("顧客担当者の作成に失敗しました。", error.message);
    return NextResponse.json({ ok: true, data }, { status: 201 });
  } catch (error) {
    const details = error instanceof Error ? error.message : "Unknown error";
    return serverError("顧客担当者の作成に失敗しました。", details);
  }
}
