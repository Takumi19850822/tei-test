"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useMemo, useState } from "react";
import { useAppContext } from "@/app/_components/app-context";
import { clientApi } from "@/lib/client-api";

type CaseRow = {
  id: string;
  case_name: string;
  customer_name: string;
  status: string;
  memo: string | null;
  version: number;
};

export default function CasesPage() {
  const { loginId } = useAppContext();
  const [rows, setRows] = useState<CaseRow[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [newCaseName, setNewCaseName] = useState("");
  const [newCustomerName, setNewCustomerName] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const selected = useMemo(
    () => rows.find((row) => row.id === selectedId) ?? null,
    [rows, selectedId],
  );

  async function load() {
    const data = await clientApi<CaseRow[]>(loginId, "/api/cases");
    setRows(data);
    if (data.length > 0 && !selectedId) setSelectedId(data[0].id);
    if (selectedId && !data.some((row) => row.id === selectedId)) {
      setSelectedId(data[0]?.id ?? "");
    }
  }

  useEffect(() => {
    void load().catch((e) => setError(e instanceof Error ? e.message : "読込失敗"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loginId]);

  async function createCase() {
    if (!newCaseName.trim() || !newCustomerName.trim()) return;
    setSaving(true);
    setError("");
    try {
      await clientApi(loginId, "/api/cases", {
        method: "POST",
        body: JSON.stringify({
          caseName: newCaseName,
          customerName: newCustomerName,
          status: "draft",
          memo: "",
        }),
      });
      setNewCaseName("");
      setNewCustomerName("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "作成失敗");
    } finally {
      setSaving(false);
    }
  }

  async function saveDetail() {
    if (!selected) return;
    setSaving(true);
    setError("");
    try {
      const updated = await clientApi<CaseRow>(loginId, `/api/cases/${selected.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          caseName: selected.case_name,
          customerName: selected.customer_name,
          status: selected.status,
          memo: selected.memo ?? "",
          version: selected.version,
        }),
      });
      setRows((prev) => prev.map((row) => (row.id === updated.id ? updated : row)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "更新失敗");
    } finally {
      setSaving(false);
    }
  }

  function patchSelected(patch: Partial<CaseRow>) {
    setRows((prev) =>
      prev.map((row) => (row.id === selectedId ? { ...row, ...patch } : row)),
    );
  }

  return (
    <section className="screen">
      <h2 className="screen-title">案件管理</h2>
      {error ? <div className="error-box">{error}</div> : null}

      <div className="create-bar">
        <input
          placeholder="案件名"
          value={newCaseName}
          onChange={(e) => setNewCaseName(e.target.value)}
        />
        <input
          placeholder="顧客名"
          value={newCustomerName}
          onChange={(e) => setNewCustomerName(e.target.value)}
        />
        <button className="btn btn-positive" disabled={saving} onClick={() => void createCase()}>
          新規作成
        </button>
      </div>

      <div className="list-detail">
        <div className="list-panel">
          <table className="spec-table">
            <thead>
              <tr>
                <th>案件名</th>
                <th>顧客</th>
                <th>状態</th>
                <th>版</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.id}
                  className={row.id === selectedId ? "active-row" : ""}
                  onClick={() => setSelectedId(row.id)}
                >
                  <td>{row.case_name}</td>
                  <td>{row.customer_name}</td>
                  <td>{row.status}</td>
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
                案件名
                <input
                  value={selected.case_name}
                  onChange={(e) => patchSelected({ case_name: e.target.value })}
                />
              </label>
              <label>
                顧客名
                <input
                  value={selected.customer_name}
                  onChange={(e) => patchSelected({ customer_name: e.target.value })}
                />
              </label>
              <label>
                状態
                <select
                  value={selected.status}
                  onChange={(e) => patchSelected({ status: e.target.value })}
                >
                  <option value="draft">draft</option>
                  <option value="in_progress">in_progress</option>
                  <option value="done">done</option>
                </select>
              </label>
              <label>
                メモ
                <textarea
                  value={selected.memo ?? ""}
                  onChange={(e) => patchSelected({ memo: e.target.value })}
                />
              </label>
              <button className="btn btn-positive" disabled={saving} onClick={() => void saveDetail()}>
                保存
              </button>
            </div>
          ) : (
            <p>一覧から選択してください。</p>
          )}
        </div>
      </div>
    </section>
  );
}
