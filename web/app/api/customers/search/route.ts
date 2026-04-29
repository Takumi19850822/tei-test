import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase";
import { forbidden, serverError, unauthorized } from "@/lib/api";
import { ensureMenuAccess } from "@/lib/authz";

function sanitizeIlikeToken(raw: string): string {
  return raw
    .trim()
    .slice(0, 120)
    .replace(/\\/g, "")
    .replace(/%/g, "")
    .replace(/,/g, "")
    .replace(/[()]/g, "");
}

/** 顧客名の部分一致検索（案件フォームのオートコンプリート用） */
export async function GET(request: Request) {
  try {
    const access = await ensureMenuAccess(request, "customers", 1);
    if (!access.ok) {
      if (access.status === 401) return unauthorized(access.message ?? "Unauthorized");
      if (access.status === 403) return forbidden(access.message ?? "Forbidden");
      return serverError("権限チェックに失敗しました。", access.message);
    }

    const { searchParams } = new URL(request.url);
    const q = String(searchParams.get("q") ?? "").trim();
    if (q.length < 1) {
      return NextResponse.json({ ok: true, data: [] }, { status: 200 });
    }

    const token = sanitizeIlikeToken(q);
    if (!token) {
      return NextResponse.json({ ok: true, data: [] }, { status: 200 });
    }

    const pattern = `%${token}%`;
    const supabase = createSupabaseAdminClient();

    const { data: byOrg, error: errOrg } = await supabase
      .from("customers")
      .select("id, organization_name, department_name")
      .eq("is_active", true)
      .ilike("organization_name", pattern)
      .order("organization_name", { ascending: true })
      .limit(30);

    if (errOrg) {
      return serverError("顧客検索に失敗しました。", errOrg.message);
    }

    const { data: byDept, error: errDept } = await supabase
      .from("customers")
      .select("id, organization_name, department_name")
      .eq("is_active", true)
      .ilike("department_name", pattern)
      .order("organization_name", { ascending: true })
      .limit(30);

    if (errDept) {
      return serverError("顧客検索に失敗しました。", errDept.message);
    }

    const merged = new Map<
      string,
      { id: string; organization_name: string; department_name: string | null }
    >();
    function addHit(hit: {
      id: string;
      organization_name: string;
      department_name: string | null;
    }) {
      const deptKey = hit.department_name?.trim() ?? "";
      const key = `${hit.id}\0${deptKey}`;
      if (merged.has(key)) return;
      merged.set(key, hit);
    }

    for (const r of byOrg ?? []) {
      addHit(r);
    }
    for (const r of byDept ?? []) {
      addHit(r);
    }

    const { data: byBranchDept, error: errBr } = await supabase
      .from("customer_branches")
      .select("customer_id, department_name")
      .ilike("department_name", pattern)
      .limit(40);

    if (errBr) {
      return serverError("顧客検索に失敗しました。", errBr.message);
    }

    const branchCustIds = [...new Set((byBranchDept ?? []).map((b) => b.customer_id))];
    if (branchCustIds.length > 0) {
      const { data: branchCustomers, error: errBc } = await supabase
        .from("customers")
        .select("id, organization_name, department_name")
        .in("id", branchCustIds)
        .eq("is_active", true);

      if (errBc) {
        return serverError("顧客検索に失敗しました。", errBc.message);
      }

      const custById = new Map((branchCustomers ?? []).map((c) => [c.id, c]));
      for (const b of byBranchDept ?? []) {
        const c = custById.get(b.customer_id);
        if (!c) continue;
        addHit({
          id: c.id,
          organization_name: c.organization_name,
          department_name: b.department_name,
        });
      }
    }

    const list = [...merged.values()].sort((a, b) => {
      const o = a.organization_name.localeCompare(b.organization_name, "ja");
      if (o !== 0) return o;
      const da = a.department_name?.trim() ?? "";
      const db = b.department_name?.trim() ?? "";
      return da.localeCompare(db, "ja");
    });

    const seenIds = new Set<string>();
    const unique: { id: string; organization_name: string; department_name: string | null }[] = [];
    for (const row of list) {
      if (seenIds.has(row.id)) continue;
      seenIds.add(row.id);
      unique.push(row);
      if (unique.length >= 30) break;
    }

    const ids = unique.map((u) => u.id);
    if (ids.length === 0) {
      return NextResponse.json({ ok: true, data: [] }, { status: 200 });
    }

    const { data: branchRows, error: errBrAgg } = await supabase
      .from("customer_branches")
      .select("customer_id, department_name")
      .in("customer_id", ids);

    if (errBrAgg) {
      return serverError("顧客検索に失敗しました。", errBrAgg.message);
    }

    const branchAgg = new Map<string, { count: number; dept: string | null }>();
    for (const r of branchRows ?? []) {
      const cid = String(r.customer_id);
      const prev = branchAgg.get(cid);
      const d = r.department_name != null ? String(r.department_name).trim() || null : null;
      if (!prev) {
        branchAgg.set(cid, { count: 1, dept: d });
      } else {
        prev.count += 1;
        prev.dept = null;
      }
    }

    const enriched = unique.map((u) => {
      const a = branchAgg.get(u.id);
      const deptOnlyWhenSingle =
        a?.count === 1 ? (a.dept && a.dept.length > 0 ? a.dept : null) : null;
      return {
        id: u.id,
        organization_name: u.organization_name,
        department_name: deptOnlyWhenSingle,
      };
    });

    return NextResponse.json({ ok: true, data: enriched }, { status: 200 });
  } catch (error) {
    const details = error instanceof Error ? error.message : "Unknown error";
    return serverError("顧客検索に失敗しました。", details);
  }
}
