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
    const access = await ensureMenuAccess(request, "customers", 1);
    if (!access.ok) {
      if (access.status === 401) return unauthorized(access.message ?? "Unauthorized");
      if (access.status === 403) return forbidden(access.message ?? "Forbidden");
      return serverError("権限チェックに失敗しました。", access.message);
    }
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) return serverError("顧客一覧の取得に失敗しました。", error.message);
    return NextResponse.json({ ok: true, data: data ?? [] }, { status: 200 });
  } catch (error) {
    const details = error instanceof Error ? error.message : "Unknown error";
    return serverError("顧客一覧の取得に失敗しました。", details);
  }
}

export async function POST(request: Request) {
  try {
    const access = await ensureMenuAccess(request, "customers", 2);
    if (!access.ok) {
      if (access.status === 401) return unauthorized(access.message ?? "Unauthorized");
      if (access.status === 403) return forbidden(access.message ?? "Forbidden");
      return serverError("権限チェックに失敗しました。", access.message);
    }
    const body = await request.json();
    const organizationName = String(body.organizationName ?? "").trim();
    if (!organizationName) return badRequest("顧客団体名は必須です。");

    const branchDepartmentName = String(body.branchDepartmentName ?? "").trim();
    const contactName = String(body.contactName ?? "").trim();
    if (!branchDepartmentName) {
      return badRequest("拠点の部署名は必須です。");
    }
    if (!contactName) {
      return badRequest("担当者名は必須です。");
    }

    const supabase = createSupabaseAdminClient();
    const { data: customer, error: custErr } = await supabase
      .from("customers")
      .insert({
        organization_name: organizationName,
        department_name: String(body.departmentName ?? "").trim() || null,
        is_active: body.isActive !== false,
      })
      .select("*")
      .single();
    if (custErr) return serverError("顧客作成に失敗しました。", custErr.message);

    const customerId = customer!.id as string;

    const { data: branch, error: brErr } = await supabase
      .from("customer_branches")
      .insert({
        customer_id: customerId,
        department_name: branchDepartmentName,
      })
      .select("*")
      .single();

    if (brErr) {
      await supabase.from("customers").delete().eq("id", customerId);
      return serverError("顧客拠点の作成に失敗しました。", brErr.message);
    }

    const branchId = branch!.id as string;

    const { error: coErr } = await supabase.from("customer_contacts").insert({
      customer_branch_id: branchId,
      company_name: contactName,
      position_name: String(body.contactPositionName ?? "").trim() || null,
    });

    if (coErr) {
      await supabase.from("customer_branches").delete().eq("id", branchId);
      await supabase.from("customers").delete().eq("id", customerId);
      return serverError("顧客担当者の作成に失敗しました。", coErr.message);
    }

    return NextResponse.json({ ok: true, data: customer }, { status: 201 });
  } catch (error) {
    const details = error instanceof Error ? error.message : "Unknown error";
    return serverError("顧客作成に失敗しました。", details);
  }
}
