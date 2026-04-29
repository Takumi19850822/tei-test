/** 一覧の簡易テキスト検索（部分一致・大文字小文字無視） */
export function normalizeSearchQuery(q: string): string {
  return q.trim().toLowerCase();
}

export function rowMatchesSearch(parts: string[], query: string): boolean {
  const n = normalizeSearchQuery(query);
  if (!n) return true;
  return parts.some((p) => p.toLowerCase().includes(n));
}
