import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase";
import { badRequest, conflict, serverError } from "@/lib/api";

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

    if (typeof body.caseName === "string") updates.case_name = body.caseName.trim();
    if (typeof body.customerName === "string")
      updates.customer_name = body.customerName.trim();
    if (typeof body.status === "string") updates.status = body.status.trim();
    if (typeof body.memo === "string") updates.memo = body.memo.trim();

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
