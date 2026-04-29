import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase";
import { badRequest, forbidden, serverError, unauthorized } from "@/lib/api";
import { ensureMenuAccess } from "@/lib/authz";

export async function GET(request: Request) {
  try {
    const access = await ensureMenuAccess(request, "cases", 1);
    if (!access.ok) {
      if (access.status === 401) return unauthorized(access.message ?? "Unauthorized");
      if (access.status === 403) return forbidden(access.message ?? "Forbidden");
      return serverError("権限チェックに失敗しました。", access.message);
    }

    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("cases")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return serverError("案件一覧の取得に失敗しました。", error.message);
    }

    return NextResponse.json({ ok: true, data: data ?? [] }, { status: 200 });
  } catch (error) {
    const details = error instanceof Error ? error.message : "Unknown error";
    return serverError("案件一覧の取得に失敗しました。", details);
  }
}

export async function POST(request: Request) {
  try {
    const access = await ensureMenuAccess(request, "cases", 2);
    if (!access.ok) {
      if (access.status === 401) return unauthorized(access.message ?? "Unauthorized");
      if (access.status === 403) return forbidden(access.message ?? "Forbidden");
      return serverError("権限チェックに失敗しました。", access.message);
    }

    const body = await request.json();
    const caseName = String(body.caseName ?? "").trim();
    const customerName = String(body.customerName ?? "").trim();
    const status = String(body.status ?? "draft").trim();
    const memo = String(body.memo ?? "").trim();

    if (!caseName || !customerName) {
      return badRequest("案件名と顧客名は必須です。");
    }

    const uuidOrNull = (v: unknown) => {
      const s = String(v ?? "").trim();
      return s || null;
    };

    const salesFromBody = uuidOrNull(body.salesUserId);
    const sales_user_id = salesFromBody ?? access.actorUserId ?? null;

    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("cases")
      .insert({
        case_name: caseName,
        customer_name: customerName,
        status,
        memo: memo || null,
        sales_user_id,
        case_type_id: uuidOrNull(body.caseTypeId),
        customer_branch_id: uuidOrNull(body.customerBranchId),
        customer_contact_id: uuidOrNull(body.customerContactId),
        customer_id: uuidOrNull(body.customerId),
      })
      .select("*")
      .single();

    if (error) {
      return serverError("案件の作成に失敗しました。", error.message);
    }

    return NextResponse.json({ ok: true, data }, { status: 201 });
  } catch (error) {
    const details = error instanceof Error ? error.message : "Unknown error";
    return serverError("案件の作成に失敗しました。", details);
  }
}
