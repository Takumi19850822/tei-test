export const LIST_PAGE_SIZE = 50;

export type ListPaginationSlice<T> = {
  pageItems: T[];
  total: number;
  totalPages: number;
  page: number;
  rangeStart: number;
  rangeEnd: number;
};

export function paginateList<T>(
  items: readonly T[],
  page: number,
  pageSize: number = LIST_PAGE_SIZE,
): ListPaginationSlice<T> {
  const total = items.length;
  const totalPages = total === 0 ? 1 : Math.ceil(total / pageSize);
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;
  const pageItems = items.slice(start, start + pageSize);
  return {
    pageItems,
    total,
    totalPages,
    page: safePage,
    rangeStart: total === 0 ? 0 : start + 1,
    rangeEnd: Math.min(start + pageSize, total),
  };
}
