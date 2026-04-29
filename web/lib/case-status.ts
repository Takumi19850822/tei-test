/** DB / API の案件状態を画面表記に揃える */
export function normalizeCaseStatus(status: string): string {
  if (status === "in_progress") return "active";
  if (status === "done") return "closed";
  return status;
}

export function caseStatusLabel(status: string): string {
  const n = normalizeCaseStatus(status);
  if (n === "draft") return "下書き";
  if (n === "active") return "アクティブ";
  if (n === "closed") return "終了";
  return status;
}
