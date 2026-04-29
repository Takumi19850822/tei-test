/** 案件の顧客表示名（一覧・マスタ選択と揃える） */
export function formatCustomerLabel(
  organizationName: string,
  departmentName: string | null | undefined,
): string {
  const o = String(organizationName ?? "").trim();
  const d = departmentName != null ? String(departmentName).trim() : "";
  if (!o) return d || "";
  return d ? `${o} / ${d}` : o;
}
