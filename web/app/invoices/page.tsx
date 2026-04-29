"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { ScreenToolbar } from "@/app/_components/screen-toolbar";
import { ListPaginationBar } from "@/app/_components/list-pagination-bar";
import { useAppContext } from "@/app/_components/app-context";
import { clientApi } from "@/lib/client-api";
import { rowMatchesSearch } from "@/lib/list-search";
import { useListPagination } from "@/hooks/useListPagination";

type OrderRow = { id: string; order_title: string; amount_incl_tax: number };
type Invoice = {
  id: string;
  order_id: string;
  invoice_date: string;
  due_date: string | null;
  total_amount: number;
  version: number;
};

function InvoicesPageInner() {
  const { loginId } = useAppContext();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [orderId, setOrderId] = useState("");
  const [rows, setRows] = useState<Invoice[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [error, setError] = useState("");
  const [listQuery, setListQuery] = useState("");

  const filteredRows = useMemo(
    () =>
      rows.filter((row) =>
        rowMatchesSearch(
          [
            row.invoice_date,
            row.due_date ?? "",
            String(row.total_amount),
            String(row.version),
          ],
          listQuery,
        ),
      ),
    [rows, listQuery],
  );
  const listResetKey = `${orderId}\n${listQuery}`;
  const {
    pageItems: pageRows,
    page,
    totalPages,
    total,
    rangeStart,
    rangeEnd,
    setPage,
  } = useListPagination(filteredRows, listResetKey);

  const selected = useMemo(
    () => rows.find((row) => row.id === selectedId) ?? null,
    [rows, selectedId],
  );

  const orderIdFromUrl = searchParams.get("orderId");

  async function loadOrders() {
    const data = await clientApi("/api/orders");
    setOrders(data);
    setOrderId((prev) => {
      if (orderIdFromUrl && data.some((o) => o.id === orderIdFromUrl)) {
        return orderIdFromUrl;
      }
      if (prev && data.some((o) => o.id === prev)) return prev;
      return data[0]?.id ?? "";
    });
  }

  async function loadInvoices(selectedOrderId: string) {
    if (!selectedOrderId) return setRows([]);
    const data = await clientApi(`/api/invoices?orderId=${selectedOrderId}`);
    setRows(data);
    if (selectedId && !data.some((row) => row.id === selectedId)) {
      setSelectedId("");
    }
  }

  useEffect(() => {
    void loadOrders().catch((e) => setError(e instanceof Error ? e.message : "読込失敗"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loginId, orderIdFromUrl]);

  useEffect(() => {
    void loadInvoices(orderId).catch((e) => setError(e instanceof Error ? e.message : "読込失敗"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, loginId]);

  function onOrderChange(nextId: string) {
    setOrderId(nextId);
    const params = new URLSearchParams(searchParams.toString());
    if (nextId) params.set("orderId", nextId);
    else params.delete("orderId");
    const q = params.toString();
    router.replace(q ? `${pathname}?${q}` : pathname);
  }

  return (
    <section className="screen">
      <div className="screen-head">
        <h2 className="screen-title">請求</h2>
        {!selected ? (
          <ScreenToolbar searchValue={listQuery} onSearchChange={setListQuery} />
        ) : null}
      </div>
      {error ? <div className="error-box">{error}</div> : null}
      <div className="screen-controls">
        <select
          value={orderId}
          onChange={(e) => {
            onOrderChange(e.target.value);
          }}
        >
          <option value="">受注を選択</option>
          {orders.map((row) => (
            <option key={row.id} value={row.id}>
              {row.order_title}
            </option>
          ))}
        </select>
        <Link
          className="btn btn-positive"
          href={orderId ? `/invoices/new?orderId=${orderId}` : "/invoices/new"}
        >
          新規追加
        </Link>
      </div>
      {selected ? (
        <div className="detail-panel">
          <div className="create-bar">
            <button className="btn btn-detail" onClick={() => setSelectedId("")}>
              一覧へ戻る
            </button>
          </div>
          <h3>詳細</h3>
          <div className="detail-form">
            <label>
              請求日
              <input value={selected.invoice_date} readOnly />
            </label>
            <label>
              入金期日
              <input value={selected.due_date ?? "-"} readOnly />
            </label>
            <label>
              請求額
              <input value={selected.total_amount.toLocaleString()} readOnly />
            </label>
          </div>
        </div>
      ) : (
        <div className="list-panel">
          <table className="spec-table spec-table--list">
            <thead>
              <tr>
                <th className="col-actions">操作</th>
                <th>請求日</th>
                <th>入金期日</th>
                <th>請求額</th>
                <th>版</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map((row) => (
                <tr key={row.id}>
                  <td className="table-actions-cell">
                    <div className="table-actions">
                      <button type="button" className="btn btn-detail btn-sm" onClick={() => setSelectedId(row.id)}>
                        詳細
                      </button>
                    </div>
                  </td>
                  <td>{row.invoice_date}</td>
                  <td>{row.due_date ?? "-"}</td>
                  <td>{row.total_amount.toLocaleString()}</td>
                  <td>{row.version}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <ListPaginationBar
            page={page}
            totalPages={totalPages}
            totalCount={total}
            rangeStart={rangeStart}
            rangeEnd={rangeEnd}
            setPage={setPage}
          />
        </div>
      )}
    </section>
  );
}

export default function InvoicesPage() {
  return (
    <Suspense fallback={<section className="screen"><p>読込中...</p></section>}>
      <InvoicesPageInner />
    </Suspense>
  );
}
