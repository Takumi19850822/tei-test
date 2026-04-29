"use client";

import { LIST_PAGE_SIZE } from "@/lib/list-pagination";

type Props = {
  page: number;
  totalPages: number;
  totalCount: number;
  rangeStart: number;
  rangeEnd: number;
  setPage: (page: number) => void;
};

export function ListPaginationBar({
  page,
  totalPages,
  totalCount,
  rangeStart,
  rangeEnd,
  setPage,
}: Props) {
  if (totalCount === 0) {
    return (
      <div className="list-pagination">
        <span className="list-pagination-info">0 件</span>
      </div>
    );
  }
  return (
    <div className="list-pagination">
      <span className="list-pagination-info">
        {rangeStart}–{rangeEnd} / {totalCount} 件（{LIST_PAGE_SIZE}件表示）
      </span>
      <div className="list-pagination-nav">
        <button
          type="button"
          className="btn btn-detail btn-sm"
          disabled={page <= 1}
          onClick={() => setPage(page - 1)}
        >
          前へ
        </button>
        <span className="list-pagination-page">
          {page} / {totalPages}
        </span>
        <button
          type="button"
          className="btn btn-detail btn-sm"
          disabled={page >= totalPages}
          onClick={() => setPage(page + 1)}
        >
          次へ
        </button>
      </div>
    </div>
  );
}
