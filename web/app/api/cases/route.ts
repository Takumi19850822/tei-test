import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase";
import { badRequest, serverError } from "@/lib/api";

export async function GET() {
  try {
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
    const body = await request.json();
    const caseName = String(body.caseName ?? "").trim();
    const customerName = String(body.customerName ?? "").trim();
    const status = String(body.status ?? "draft").trim();
    const memo = String(body.memo ?? "").trim();

    if (!caseName || !customerName) {
      return badRequest("案件名と顧客名は必須です。");
    }

    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("cases")
      .insert({
        case_name: caseName,
        customer_name: customerName,
        status,
        memo: memo || null,
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
