"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useState } from "react";
import { useAppContext } from "@/app/_components/app-context";
import { clientApi } from "@/lib/client-api";

type OrderRow = { id: string; order_title: string; amount_incl_tax: number };
type Invoice = {
  id: string;
  order_id: string;
  invoice_date: string;
  due_date: string | null;
  total_amount: number;
  version: number;
};

export default function InvoicesPage() {
  const { loginId } = useAppContext();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [orderId, setOrderId] = useState("");
  const [rows, setRows] = useState<Invoice[]>([]);
  const [dueDate, setDueDate] = useState("");
  const [amount, setAmount] = useState("0");
  const [error, setError] = useState("");

  async function loadOrders() {
    const data = await clientApi<OrderRow[]>(loginId, "/api/orders");
    setOrders(data);
    if (!orderId && data[0]) {
      setOrderId(data[0].id);
      setAmount(String(data[0].amount_incl_tax));
    }
  }

  async function loadInvoices(selectedOrderId: string) {
    if (!selectedOrderId) return setRows([]);
    const data = await clientApi<Invoice[]>(loginId, `/api/invoices?orderId=${selectedOrderId}`);
    setRows(data);
  }

  useEffect(() => {
    void loadOrders().catch((e) => setError(e instanceof Error ? e.message : "読込失敗"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loginId]);

  useEffect(() => {
    void loadInvoices(orderId).catch((e) => setError(e instanceof Error ? e.message : "読込失敗"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, loginId]);

  async function createInvoice() {
    if (!orderId) return;
    await clientApi(loginId, "/api/invoices", {
      method: "POST",
      body: JSON.stringify({
        orderId,
        dueDate: dueDate || null,
        totalAmount: amount,
      }),
    });
    await loadInvoices(orderId);
  }

  return (
    <section className="screen">
      <h2 className="screen-title">請求</h2>
      {error ? <div className="error-box">{error}</div> : null}
      <div className="create-bar">
        <select value={orderId} onChange={(e) => setOrderId(e.target.value)}>
          <option value="">受注を選択</option>
          {orders.map((row) => (
            <option key={row.id} value={row.id}>
              {row.order_title}
            </option>
          ))}
        </select>
        <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        <input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="請求額" />
        <button className="btn btn-positive" onClick={() => void createInvoice()}>
          新規作成
        </button>
      </div>
      <div className="list-detail">
        <div className="list-panel" style={{ width: "100%" }}>
          <table className="spec-table">
            <thead><tr><th>請求日</th><th>入金期日</th><th>請求額</th><th>版</th></tr></thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>{row.invoice_date}</td>
                  <td>{row.due_date ?? "-"}</td>
                  <td>{row.total_amount.toLocaleString()}</td>
                  <td>{row.version}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
