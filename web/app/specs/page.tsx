"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useState } from "react";
import { useAppContext } from "@/app/_components/app-context";
import { clientApi } from "@/lib/client-api";

type OrderRow = { id: string; order_title: string };
type DiecutSpec = {
  id: string;
  mold_no: string | null;
  machine_name: string | null;
  paper_name: string | null;
  version: number;
};
type LcSpec = {
  id: string;
  delivery_method: string | null;
  specification: string | null;
  print_surface: string | null;
  version: number;
};

export default function SpecsPage() {
  const { loginId } = useAppContext();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [orderId, setOrderId] = useState("");
  const [diecuts, setDiecuts] = useState<DiecutSpec[]>([]);
  const [lcs, setLcs] = useState<LcSpec[]>([]);
  const [diecutMoldNo, setDiecutMoldNo] = useState("");
  const [diecutMachine, setDiecutMachine] = useState("");
  const [lcMethod, setLcMethod] = useState("");
  const [lcSpec, setLcSpec] = useState("");
  const [error, setError] = useState("");

  async function loadOrders() {
    const data = await clientApi<OrderRow[]>(loginId, "/api/orders");
    setOrders(data);
    if (!orderId && data[0]) setOrderId(data[0].id);
  }

  async function loadSpecs(selectedOrderId: string) {
    if (!selectedOrderId) {
      setDiecuts([]);
      setLcs([]);
      return;
    }
    const [diecutData, lcData] = await Promise.all([
      clientApi<DiecutSpec[]>(loginId, `/api/diecut-specs?orderId=${selectedOrderId}`),
      clientApi<LcSpec[]>(loginId, `/api/lc-specs?orderId=${selectedOrderId}`),
    ]);
    setDiecuts(diecutData);
    setLcs(lcData);
  }

  useEffect(() => {
    void loadOrders().catch((e) => setError(e instanceof Error ? e.message : "読込失敗"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loginId]);

  useEffect(() => {
    void loadSpecs(orderId).catch((e) => setError(e instanceof Error ? e.message : "読込失敗"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, loginId]);

  async function createDiecut() {
    if (!orderId) return;
    await clientApi(loginId, "/api/diecut-specs", {
      method: "POST",
      body: JSON.stringify({ orderId, moldNo: diecutMoldNo, machineName: diecutMachine }),
    });
    setDiecutMoldNo("");
    setDiecutMachine("");
    await loadSpecs(orderId);
  }

  async function createLc() {
    if (!orderId) return;
    await clientApi(loginId, "/api/lc-specs", {
      method: "POST",
      body: JSON.stringify({ orderId, deliveryMethod: lcMethod, specification: lcSpec }),
    });
    setLcMethod("");
    setLcSpec("");
    await loadSpecs(orderId);
  }

  return (
    <section className="screen">
      <h2 className="screen-title">抜き型/LC仕様</h2>
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
      </div>

      <div className="grid-two">
        <div className="panel">
          <h3>抜き型仕様</h3>
          <div className="create-bar">
            <input placeholder="型No" value={diecutMoldNo} onChange={(e) => setDiecutMoldNo(e.target.value)} />
            <input placeholder="機種" value={diecutMachine} onChange={(e) => setDiecutMachine(e.target.value)} />
            <button className="btn btn-positive" onClick={() => void createDiecut()}>
              追加
            </button>
          </div>
          <table className="spec-table">
            <thead><tr><th>型No</th><th>機種</th><th>用紙</th><th>版</th></tr></thead>
            <tbody>
              {diecuts.map((row) => (
                <tr key={row.id}>
                  <td>{row.mold_no ?? "-"}</td>
                  <td>{row.machine_name ?? "-"}</td>
                  <td>{row.paper_name ?? "-"}</td>
                  <td>{row.version}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="panel">
          <h3>LC仕様</h3>
          <div className="create-bar">
            <input placeholder="納品方法" value={lcMethod} onChange={(e) => setLcMethod(e.target.value)} />
            <input placeholder="仕様" value={lcSpec} onChange={(e) => setLcSpec(e.target.value)} />
            <button className="btn btn-positive" onClick={() => void createLc()}>
              追加
            </button>
          </div>
          <table className="spec-table">
            <thead><tr><th>納品方法</th><th>仕様</th><th>表面印刷</th><th>版</th></tr></thead>
            <tbody>
              {lcs.map((row) => (
                <tr key={row.id}>
                  <td>{row.delivery_method ?? "-"}</td>
                  <td>{row.specification ?? "-"}</td>
                  <td>{row.print_surface ?? "-"}</td>
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
