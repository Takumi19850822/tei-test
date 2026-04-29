"use client";

import { useEffect, useMemo, useState } from "react";
import { LIST_PAGE_SIZE, paginateList } from "@/lib/list-pagination";

export function useListPagination<T>(items: readonly T[], resetKey: string) {
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [resetKey]);

  useEffect(() => {
    const totalPages = items.length === 0 ? 1 : Math.ceil(items.length / LIST_PAGE_SIZE);
    setPage((p) => Math.min(p, totalPages));
  }, [items.length]);

  const { pageItems, total, totalPages, page: safePage, rangeStart, rangeEnd } = useMemo(
    () => paginateList(items, page, LIST_PAGE_SIZE),
    [items, page],
  );

  return {
    pageItems,
    total,
    totalPages,
    page: safePage,
    rangeStart,
    rangeEnd,
    setPage,
  };
}
