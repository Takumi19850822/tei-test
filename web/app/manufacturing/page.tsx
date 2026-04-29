"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useMemo, useState } from "react";
import { useAppContext } from "@/app/_components/app-context";
import { clientApi } from "@/lib/client-api";

type OrderRow = { id: string; order_title: string; case_id: string };
type JobRow = {
  id: string;
  order_id: string;
  mold_no: string | null;
  laser_done: boolean;
  molding_done: boolean;
  inspection_done: boolean;
  can_deliver: boolean;
  version: number;
};

export default function ManufacturingPage() {
  const { loginId } = useAppContext();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [orderId, setOrderId] = useState("");
  const [rows, setRows] = useState<JobRow[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [newMoldNo, setNewMoldNo] = useState("");
  const [error, setError] = useState("");

  const selected = useMemo(
    () => rows.find((row) => row.id === selectedId) ?? null,
    [rows, selectedId],
  );

  async function loadOrders() {
    const data = await clientApi<OrderRow[]>(loginId, "/api/orders");
    setOrders(data);
    if (!orderId && data[0]) setOrderId(data[0].id);
  }

  async function loadJobs(selectedOrderId: string) {
    if (!selectedOrderId) return setRows([]);
    const data = await clientApi<JobRow[]>(
      loginId,
      `/api/manufacturing-jobs?orderId=${selectedOrderId}`,
    );
    setRows(data);
    if (!selectedId && data[0]) setSelectedId(data[0].id);
  }

  useEffect(() => {
    void loadOrders().catch((e) => setError(e instanceof Error ? e.message : "読込失敗"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loginId]);

  useEffect(() => {
    void loadJobs(orderId).catch((e) => setError(e instanceof Error ? e.message : "読込失敗"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, loginId]);

  async function createJob() {
    if (!orderId) return;
    await clientApi(loginId, "/api/manufacturing-jobs", {
      method: "POST",
      body: JSON.stringify({ orderId, moldNo: newMoldNo }),
    });
    setNewMoldNo("");
    await loadJobs(orderId);
  }

  async function updateFlags(patch: {
    laserDone?: boolean;
    moldingDone?: boolean;
    inspectionDone?: boolean;
    canDeliver?: boolean;
  }) {
    if (!selected) return;
    const updated = await clientApi<JobRow>(loginId, `/api/manufacturing-jobs/${selected.id}`, {
      method: "PATCH",
      body: JSON.stringify({
        ...patch,
        version: selected.version,
      }),
    });
    setRows((prev) => prev.map((row) => (row.id === updated.id ? updated : row)));
  }

  return (
    <section className="screen">
      <h2 className="screen-title">型工務</h2>
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
        <input placeholder="型No" value={newMoldNo} onChange={(e) => setNewMoldNo(e.target.value)} />
        <button className="btn btn-positive" onClick={() => void createJob()}>
          新規作成
        </button>
      </div>

      <div className="list-detail">
        <div className="list-panel">
          <table className="spec-table">
            <thead><tr><th>型No</th><th>レーザー</th><th>型製作</th><th>検査</th><th>納品可</th><th>版</th></tr></thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className={row.id === selectedId ? "active-row" : ""} onClick={() => setSelectedId(row.id)}>
                  <td>{row.mold_no ?? "-"}</td>
                  <td>{row.laser_done ? "完" : "未"}</td>
                  <td>{row.molding_done ? "完" : "未"}</td>
                  <td>{row.inspection_done ? "完" : "未"}</td>
                  <td>{row.can_deliver ? "可" : "不可"}</td>
                  <td>{row.version}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="detail-panel">
          <h3>詳細</h3>
          {selected ? (
            <div className="detail-form">
              <label>
                レーザー
                <input
                  type="checkbox"
                  checked={selected.laser_done}
                  onChange={(e) => void updateFlags({ laserDone: e.target.checked })}
                />
              </label>
              <label>
                型製作
                <input
                  type="checkbox"
                  checked={selected.molding_done}
                  onChange={(e) => void updateFlags({ moldingDone: e.target.checked })}
                />
              </label>
              <label>
                検査
                <input
                  type="checkbox"
                  checked={selected.inspection_done}
                  onChange={(e) => void updateFlags({ inspectionDone: e.target.checked })}
                />
              </label>
              <label>
                納品可
                <input
                  type="checkbox"
                  checked={selected.can_deliver}
                  onChange={(e) => void updateFlags({ canDeliver: e.target.checked })}
                />
              </label>
            </div>
          ) : (
            <p>一覧から工務データを選択してください。</p>
          )}
        </div>
      </div>
    </section>
  );
}
