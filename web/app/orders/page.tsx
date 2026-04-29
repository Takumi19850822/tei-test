"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useMemo, useState } from "react";
import { useAppContext } from "@/app/_components/app-context";
import { clientApi } from "@/lib/client-api";

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
  tax_amount: number;
};

export default function OrdersPage() {
  const { loginId } = useAppContext();
  const [cases, setCases] = useState<CaseRow[]>([]);
  const [caseId, setCaseId] = useState("");
  const [rows, setRows] = useState<OrderRow[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [lines, setLines] = useState<OrderLine[]>([]);
  const [title, setTitle] = useState("");
  const [lineName, setLineName] = useState("");
  const [linePrice, setLinePrice] = useState("0");
  const [lineQty, setLineQty] = useState("1");
  const [error, setError] = useState("");

  const selected = useMemo(
    () => rows.find((row) => row.id === selectedId) ?? null,
    [rows, selectedId],
  );

  async function loadCases() {
    const data = await clientApi<CaseRow[]>(loginId, "/api/cases");
    setCases(data);
    if (!caseId && data[0]) setCaseId(data[0].id);
  }

  async function loadOrders(selectedCaseId: string) {
    if (!selectedCaseId) return setRows([]);
    const data = await clientApi<OrderRow[]>(loginId, `/api/orders?caseId=${selectedCaseId}`);
    setRows(data);
    if (!selectedId && data[0]) setSelectedId(data[0].id);
    if (selectedId && !data.some((row) => row.id === selectedId)) {
      setSelectedId(data[0]?.id ?? "");
    }
  }

  async function loadLines(orderId: string) {
    if (!orderId) return setLines([]);
    const data = await clientApi<OrderLine[]>(loginId, `/api/order-lines?orderId=${orderId}`);
    setLines(data);
  }

  useEffect(() => {
    void loadCases().catch((e) => setError(e instanceof Error ? e.message : "読込失敗"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loginId]);

  useEffect(() => {
    void loadOrders(caseId).catch((e) => setError(e instanceof Error ? e.message : "読込失敗"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseId, loginId]);

  useEffect(() => {
    void loadLines(selectedId).catch((e) => setError(e instanceof Error ? e.message : "読込失敗"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, loginId]);

  async function createOrder() {
    if (!caseId || !title.trim()) return;
    await clientApi(loginId, "/api/orders", {
      method: "POST",
      body: JSON.stringify({
        caseId,
        orderTitle: title,
        orderDate: new Date().toISOString().slice(0, 10),
        amountExclTax: 0,
        amountInclTax: 0,
      }),
    });
    setTitle("");
    await loadOrders(caseId);
  }

  async function createLine() {
    if (!selectedId || !lineName.trim()) return;
    await clientApi(loginId, "/api/order-lines", {
      method: "POST",
      body: JSON.stringify({
        orderId: selectedId,
        lineNo: lines.length + 1,
        itemName: lineName,
        unitPrice: linePrice,
        quantity: lineQty,
        taxRate: 10,
      }),
    });
    setLineName("");
    await Promise.all([loadLines(selectedId), loadOrders(caseId)]);
  }

  return (
    <section className="screen">
      <h2 className="screen-title">受注</h2>
      {error ? <div className="error-box">{error}</div> : null}
      <div className="create-bar">
        <select value={caseId} onChange={(e) => setCaseId(e.target.value)}>
          <option value="">案件を選択</option>
          {cases.map((row) => (
            <option key={row.id} value={row.id}>
              {row.case_name}
            </option>
          ))}
        </select>
        <input placeholder="受注件名" value={title} onChange={(e) => setTitle(e.target.value)} />
        <button className="btn btn-positive" onClick={() => void createOrder()}>
          新規作成
        </button>
      </div>
      <div className="list-detail">
        <div className="list-panel">
          <table className="spec-table">
            <thead><tr><th>件名</th><th>日付</th><th>税込</th><th>版</th></tr></thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className={row.id === selectedId ? "active-row" : ""} onClick={() => setSelectedId(row.id)}>
                  <td>{row.order_title}</td>
                  <td>{row.order_date}</td>
                  <td>{row.amount_incl_tax.toLocaleString()}</td>
                  <td>{row.version}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="detail-panel">
          <h3>詳細</h3>
          {selected ? (
            <>
              <div className="detail-summary">
                税抜 {selected.amount_excl_tax.toLocaleString()} / 税込 {selected.amount_incl_tax.toLocaleString()}
              </div>
              <div className="create-bar">
                <input placeholder="品名" value={lineName} onChange={(e) => setLineName(e.target.value)} />
                <input placeholder="単価" value={linePrice} onChange={(e) => setLinePrice(e.target.value)} />
                <input placeholder="数量" value={lineQty} onChange={(e) => setLineQty(e.target.value)} />
                <button className="btn btn-positive" onClick={() => void createLine()}>
                  明細追加
                </button>
              </div>
              <table className="spec-table">
                <thead><tr><th>No</th><th>品名</th><th>単価</th><th>数量</th><th>税額</th></tr></thead>
                <tbody>
                  {lines.map((line) => (
                    <tr key={line.id}>
                      <td>{line.line_no}</td>
                      <td>{line.item_name}</td>
                      <td>{line.unit_price}</td>
                      <td>{line.quantity}</td>
                      <td>{line.tax_amount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          ) : (
            <p>一覧から受注を選択してください。</p>
          )}
        </div>
      </div>
    </section>
  );
}
