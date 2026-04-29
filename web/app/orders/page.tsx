"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ScreenToolbar } from "@/app/_components/screen-toolbar";
import { ListPaginationBar } from "@/app/_components/list-pagination-bar";
import { useAppContext } from "@/app/_components/app-context";
import { clientApi } from "@/lib/client-api";
import { rowMatchesSearch } from "@/lib/list-search";
import { useListPagination } from "@/hooks/useListPagination";

type CaseRow = { id: string; case_name: string };
type OrderRow = {
  id: string;
  case_id: string;
  order_title: string;
  order_date: string;
  status: string;
  amount_excl_tax: number;
  amount_incl_tax: number;
  version: number;
};
type OrderLine = {
  id: string;
  line_no: number;
  item_name: string;
  unit_price: number;
  quantity: number;
  unit: string | null;
  tax_amount: number;
};

function OrdersPageInner() {
  const { loginId } = useAppContext();
  const searchParams = useSearchParams();
  const [cases, setCases] = useState<CaseRow[]>([]);
  const [caseId, setCaseId] = useState("");
  const [rows, setRows] = useState<OrderRow[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [lines, setLines] = useState<OrderLine[]>([]);
  const [lineName, setLineName] = useState("");
  const [linePrice, setLinePrice] = useState("0");
  const [lineQty, setLineQty] = useState("1");
  const [lineUnit, setLineUnit] = useState("式");
  const [error, setError] = useState("");
  const [listQuery, setListQuery] = useState("");

  const filteredRows = useMemo(
    () =>
      rows.filter((row) =>
        rowMatchesSearch(
          [
            row.order_title,
            row.order_date,
            row.status,
            String(row.amount_incl_tax),
            String(row.version),
          ],
          listQuery,
        ),
      ),
    [rows, listQuery],
  );
  const listResetKey = `${caseId}\n${listQuery}`;
  const {
    pageItems: pageRows,
    page,
    totalPages,
    total,
    rangeStart,
    rangeEnd,
    setPage,
  } = useListPagination(filteredRows, listResetKey);
  const {
    pageItems: linePageRows,
    page: linePage,
    totalPages: lineTotalPages,
    total: lineTotal,
    rangeStart: lineRangeStart,
    rangeEnd: lineRangeEnd,
    setPage: setLinePage,
  } = useListPagination(lines, selectedId || "order-lines");

  const selected = useMemo(
    () => rows.find((row) => row.id === selectedId) ?? null,
    [rows, selectedId],
  );

  async function loadOrders(selectedCaseId: string) {
    if (!selectedCaseId) return setRows([]);
    const data = await clientApi(`/api/orders?caseId=${selectedCaseId}`);
    setRows(data);
    if (selectedId && !data.some((row) => row.id === selectedId)) {
      setSelectedId("");
    }
  }

  async function loadLines(orderId: string) {
    if (!orderId) return setLines([]);
    const data = await clientApi(`/api/order-lines?orderId=${orderId}`);
    setLines(data);
  }

  useEffect(() => {
    void (async () => {
      try {
        const data = await clientApi("/api/cases");
        setCases(data);
        const q = searchParams.get("caseId");
        if (q && data.some((c) => c.id === q)) {
          setCaseId(q);
        } else if (data[0]) {
          setCaseId((prev) => prev || data[0].id);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "読込失敗");
      }
    })();
  }, [loginId, searchParams]);

  useEffect(() => {
    void loadOrders(caseId).catch((e) => setError(e instanceof Error ? e.message : "読込失敗"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseId, loginId]);

  useEffect(() => {
    void loadLines(selectedId).catch((e) => setError(e instanceof Error ? e.message : "読込失敗"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, loginId]);

  async function createLine() {
    if (!selectedId || !lineName.trim()) return;
    await clientApi("/api/order-lines", {
      method: "POST",
      body: JSON.stringify({
        orderId: selectedId,
        lineNo: lines.length ? Math.max(...lines.map((l) => l.line_no)) + 1 : 1,
        itemName: lineName,
        unitPrice: linePrice,
        quantity: lineQty,
        unit: lineUnit,
        taxRate: 10,
      }),
    });
    setLineName("");
    await Promise.all([loadLines(selectedId), loadOrders(caseId)]);
  }

  return (
    <section className="screen">
      <div className="screen-head">
        <h2 className="screen-title">受注</h2>
        {!selected ? (
          <ScreenToolbar searchValue={listQuery} onSearchChange={setListQuery} />
        ) : null}
      </div>
      {error ? <div className="error-box">{error}</div> : null}
      <div className="screen-controls">
        <select value={caseId} onChange={(e) => setCaseId(e.target.value)}>
          <option value="">案件を選択</option>
          {cases.map((row) => (
            <option key={row.id} value={row.id}>
              {row.case_name}
            </option>
          ))}
        </select>
        <Link
          className="btn btn-positive"
          href={caseId ? `/orders/new?caseId=${caseId}` : "/orders/new"}
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
          <div className="detail-summary">
            税抜 {selected.amount_excl_tax.toLocaleString()} / 税込 {selected.amount_incl_tax.toLocaleString()}
          </div>
          <div className="create-bar">
            <input placeholder="品名" value={lineName} onChange={(e) => setLineName(e.target.value)} />
            <input placeholder="単価" value={linePrice} onChange={(e) => setLinePrice(e.target.value)} />
            <input placeholder="数量" value={lineQty} onChange={(e) => setLineQty(e.target.value)} />
            <input placeholder="単位" value={lineUnit} onChange={(e) => setLineUnit(e.target.value)} />
            <button className="btn btn-positive" onClick={() => void createLine()}>
              明細追加
            </button>
          </div>
          <table className="spec-table">
            <thead><tr><th>No</th><th>品名</th><th>単価</th><th>数量</th><th>単位</th><th>税額</th></tr></thead>
            <tbody>
              {linePageRows.map((line) => (
                <tr key={line.id}>
                  <td>{line.line_no}</td>
                  <td>{line.item_name}</td>
                  <td>{line.unit_price}</td>
                  <td>{line.quantity}</td>
                  <td>{line.unit ?? "-"}</td>
                  <td>{line.tax_amount}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <ListPaginationBar
            page={linePage}
            totalPages={lineTotalPages}
            totalCount={lineTotal}
            rangeStart={lineRangeStart}
            rangeEnd={lineRangeEnd}
            setPage={setLinePage}
          />
        </div>
      ) : (
        <div className="list-panel">
          <table className="spec-table spec-table--list">
            <thead><tr><th className="col-actions">操作</th><th>件名</th><th>日付</th><th>税込</th><th>版</th></tr></thead>
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
                  <td>{row.order_title}</td>
                  <td>{row.order_date}</td>
                  <td>{row.amount_incl_tax.toLocaleString()}</td>
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

export default function OrdersPage() {
  return (
    <Suspense fallback={<section className="screen"><p>読込中...</p></section>}>
      <OrdersPageInner />
    </Suspense>
  );
}
