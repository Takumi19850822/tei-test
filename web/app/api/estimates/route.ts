import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase";
import { badRequest, serverError, toNumber } from "@/lib/api";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const caseId = searchParams.get("caseId");
    const supabase = createSupabaseAdminClient();

    let query = supabase
      .from("estimates")
      .select("*")
      .order("created_at", { ascending: false });

    if (caseId) {
      query = query.eq("case_id", caseId);
    }

    const { data, error } = await query;

    if (error) {
      return serverError("見積一覧の取得に失敗しました。", error.message);
    }

    return NextResponse.json({ ok: true, data: data ?? [] }, { status: 200 });
  } catch (error) {
    const details = error instanceof Error ? error.message : "Unknown error";
    return serverError("見積一覧の取得に失敗しました。", details);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const caseId = String(body.caseId ?? "").trim();
    const subject = String(body.estimateSubject ?? "").trim();
    const estimateDate = String(body.estimateDate ?? "").trim();
    const status = String(body.status ?? "draft").trim();
    const note = String(body.note ?? "").trim();
    const subtotal = toNumber(body.subtotal, 0);
    const taxAmount = toNumber(body.taxAmount, 0);
    const totalAmount = toNumber(body.totalAmount, subtotal + taxAmount);

    if (!caseId || !subject) {
      return badRequest("案件IDと見積件名は必須です。");
    }

    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("estimates")
      .insert({
        case_id: caseId,
        estimate_subject: subject,
        estimate_date: estimateDate || new Date().toISOString().slice(0, 10),
        status,
        subtotal,
        tax_amount: taxAmount,
        total_amount: totalAmount,
        note: note || null,
      })
      .select("*")
      .single();

    if (error) {
      return serverError("見積の作成に失敗しました。", error.message);
    }

    return NextResponse.json({ ok: true, data }, { status: 201 });
  } catch (error) {
    const details = error instanceof Error ? error.message : "Unknown error";
    return serverError("見積の作成に失敗しました。", details);
  }
}
