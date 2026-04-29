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

type Params = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, { params }: Params) {
  try {
    const access = await ensureMenuAccess(request, "cases", 1);
    if (!access.ok) {
      if (access.status === 401) return unauthorized(access.message ?? "Unauthorized");
      if (access.status === 403) return forbidden(access.message ?? "Forbidden");
      return serverError("権限チェックに失敗しました。", access.message);
    }

    const { id } = await params;
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase.from("cases").select("*").eq("id", id).maybeSingle();

    if (error) {
      return serverError("案件の取得に失敗しました。", error.message);
    }
    if (!data) {
      return NextResponse.json(
        { ok: false, message: "案件が見つかりません。", details: "Not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    const details = error instanceof Error ? error.message : "Unknown error";
    return serverError("案件の取得に失敗しました。", details);
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const access = await ensureMenuAccess(request, "cases", 2);
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

    if (typeof body.caseName === "string") updates.case_name = body.caseName.trim();
    if (typeof body.customerName === "string")
      updates.customer_name = body.customerName.trim();
    if (typeof body.status === "string") updates.status = body.status.trim();
    if (typeof body.memo === "string") updates.memo = body.memo.trim();

    const uuidOrNull = (v: unknown) => {
      const s = String(v ?? "").trim();
      return s || null;
    };
    if (body.salesUserId !== undefined) {
      updates.sales_user_id = uuidOrNull(body.salesUserId);
    }
    if (body.caseTypeId !== undefined) {
      updates.case_type_id = uuidOrNull(body.caseTypeId);
    }
    if (body.customerBranchId !== undefined) {
      updates.customer_branch_id = uuidOrNull(body.customerBranchId);
    }
    if (body.customerContactId !== undefined) {
      updates.customer_contact_id = uuidOrNull(body.customerContactId);
    }
    if (body.customerId !== undefined) {
      updates.customer_id = uuidOrNull(body.customerId);
    }

    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("cases")
      .update(updates)
      .eq("id", id)
      .eq("version", expectedVersion)
      .select("*");

    if (error) {
      return serverError("案件の更新に失敗しました。", error.message);
    }

    if (!data || data.length === 0) {
      return conflict("案件が更新済みです。再読込してから更新してください。");
    }

    return NextResponse.json({ ok: true, data: data[0] }, { status: 200 });
  } catch (error) {
    const details = error instanceof Error ? error.message : "Unknown error";
    return serverError("案件の更新に失敗しました。", details);
  }
}
