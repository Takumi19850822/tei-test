"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { ScreenToolbar } from "@/app/_components/screen-toolbar";
import { useAppContext } from "@/app/_components/app-context";
import { clientApi } from "@/lib/client-api";
import { rowMatchesSearch } from "@/lib/list-search";

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

function ManufacturingPageInner() {
  const { loginId } = useAppContext();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const orderIdFromUrl = searchParams.get("orderId");
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [orderId, setOrderId] = useState("");
  const [rows, setRows] = useState<JobRow[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [error, setError] = useState("");
  const [listQuery, setListQuery] = useState("");

  const filteredRows = useMemo(
    () =>
      rows.filter((row) =>
        rowMatchesSearch(
          [
            row.mold_no ?? "",
            row.laser_done ? "完" : "未",
            row.molding_done ? "完" : "未",
            String(row.version),
          ],
          listQuery,
        ),
      ),
    [rows, listQuery],
  );

  const selected = useMemo(
    () => rows.find((row) => row.id === selectedId) ?? null,
    [rows, selectedId],
  );

  async function loadOrders() {
    const data = await clientApi<OrderRow[]>(loginId, "/api/orders");
    setOrders(data);
    setOrderId((prev) => {
      if (orderIdFromUrl && data.some((o) => o.id === orderIdFromUrl)) {
        return orderIdFromUrl;
      }
      if (prev && data.some((o) => o.id === prev)) return prev;
      return data[0]?.id ?? "";
    });
  }

  async function loadJobs(selectedOrderId: string) {
    if (!selectedOrderId) return setRows([]);
    const data = await clientApi<JobRow[]>(
      loginId,
      `/api/manufacturing-jobs?orderId=${selectedOrderId}`,
    );
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
    void loadJobs(orderId).catch((e) => setError(e instanceof Error ? e.message : "読込失敗"));
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
      <div className="screen-head">
        <h2 className="screen-title">型工務</h2>
        {!selected ? (
          <ScreenToolbar searchValue={listQuery} onSearchChange={setListQuery} />
        ) : null}
      </div>
      {error ? <div className="error-box">{error}</div> : null}
      <div className="screen-controls">
        <select value={orderId} onChange={(e) => onOrderChange(e.target.value)}>
          <option value="">受注を選択</option>
          {orders.map((row) => (
            <option key={row.id} value={row.id}>
              {row.order_title}
            </option>
          ))}
        </select>
        <Link
          className="btn btn-positive"
          href={orderId ? `/manufacturing/new?orderId=${orderId}` : "/manufacturing/new"}
        >
          新規作成
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
        </div>
      ) : (
        <div className="list-panel">
          <table className="spec-table">
            <thead><tr><th>型No</th><th>レーザー</th><th>型製作</th><th>検査</th><th>納品可</th><th>版</th><th>詳細</th></tr></thead>
            <tbody>
              {filteredRows.map((row) => (
                <tr key={row.id}>
                  <td>{row.mold_no ?? "-"}</td>
                  <td>{row.laser_done ? "完" : "未"}</td>
                  <td>{row.molding_done ? "完" : "未"}</td>
                  <td>{row.inspection_done ? "完" : "未"}</td>
                  <td>{row.can_deliver ? "可" : "不可"}</td>
                  <td>{row.version}</td>
                  <td>
                    <button className="btn btn-detail" onClick={() => setSelectedId(row.id)}>
                      詳細
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default function ManufacturingPage() {
  return (
    <Suspense fallback={<section className="screen"><p>読込中...</p></section>}>
      <ManufacturingPageInner />
    </Suspense>
  );
}
