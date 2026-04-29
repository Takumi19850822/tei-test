"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ScreenToolbar } from "@/app/_components/screen-toolbar";
import { useAppContext } from "@/app/_components/app-context";
import { clientApi } from "@/lib/client-api";
import { rowMatchesSearch } from "@/lib/list-search";

type TaxRate = {
  id: string;
  tax_name: string;
  rate: number;
  rounding_method: number;
  taxation_type: string;
  active: boolean;
  version: number;
};

export default function MastersPage() {
  const { loginId } = useAppContext();
  const [rows, setRows] = useState<TaxRate[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [listQuery, setListQuery] = useState("");
  const [error, setError] = useState("");

  const filteredRows = useMemo(
    () =>
      rows.filter((row) =>
        rowMatchesSearch(
          [
            row.tax_name,
            String(row.rate),
            row.taxation_type,
            row.active ? "有効" : "無効",
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

  async function loadRows() {
    const data = await clientApi<TaxRate[]>(loginId, "/api/tax-rates");
    setRows(data);
    if (selectedId && !data.some((row) => row.id === selectedId)) {
      setSelectedId("");
    }
  }

  useEffect(() => {
    void loadRows().catch((e) => setError(e instanceof Error ? e.message : "読込失敗"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loginId]);

  async function saveRow() {
    if (!selected) return;
    const updated = await clientApi<TaxRate>(loginId, `/api/tax-rates/${selected.id}`, {
      method: "PATCH",
      body: JSON.stringify({
        taxName: selected.tax_name,
        rate: selected.rate,
        roundingMethod: selected.rounding_method,
        taxationType: selected.taxation_type,
        active: selected.active,
        version: selected.version,
      }),
    });
    setRows((prev) => prev.map((row) => (row.id === updated.id ? updated : row)));
  }

  function patchSelected(patch: Partial<TaxRate>) {
    setRows((prev) =>
      prev.map((row) => (row.id === selectedId ? { ...row, ...patch } : row)),
    );
  }

  return (
    <section className="screen">
      <div className="screen-head">
        <h2 className="screen-title">マスタ管理</h2>
        {!selected ? (
          <ScreenToolbar searchValue={listQuery} onSearchChange={setListQuery}>
            <Link href="/masters/new" className="btn btn-positive">
              新規作成
            </Link>
          </ScreenToolbar>
        ) : null}
      </div>
      {error ? <div className="error-box">{error}</div> : null}
      {selected ? (
        <div className="detail-panel">
          <div className="create-bar">
            <button className="btn btn-detail" onClick={() => setSelectedId("")}>
              一覧へ戻る
            </button>
          </div>
          <h3>税率詳細</h3>
          <div className="detail-form">
            <label>
              税率名
              <input
                value={selected.tax_name}
                onChange={(e) => patchSelected({ tax_name: e.target.value })}
              />
            </label>
            <label>
              税率(%)
              <input
                value={selected.rate}
                onChange={(e) => patchSelected({ rate: Number(e.target.value) })}
              />
            </label>
            <label>
              端数処理
              <select
                value={selected.rounding_method}
                onChange={(e) =>
                  patchSelected({ rounding_method: Number.parseInt(e.target.value, 10) })
                }
              >
                <option value={2}>四捨五入</option>
                <option value={1}>切り上げ</option>
                <option value={0}>切り下げ</option>
              </select>
            </label>
            <label>
              課税区分
              <select
                value={selected.taxation_type}
                onChange={(e) => patchSelected({ taxation_type: e.target.value })}
              >
                <option value="taxable">課税</option>
                <option value="non_taxable">非課税</option>
                <option value="tax_exempt">免税</option>
                <option value="out_of_scope">不課税</option>
              </select>
            </label>
            <label>
              有効
              <input
                type="checkbox"
                checked={selected.active}
                onChange={(e) => patchSelected({ active: e.target.checked })}
              />
            </label>
            <button className="btn btn-positive" onClick={() => void saveRow()}>
              保存
            </button>
          </div>
        </div>
      ) : (
        <div className="list-panel">
          <table className="spec-table">
            <thead><tr><th>税率名</th><th>税率</th><th>課税区分</th><th>有効</th><th>版</th><th>詳細</th></tr></thead>
            <tbody>
              {filteredRows.map((row) => (
                <tr key={row.id}>
                  <td>{row.tax_name}</td>
                  <td>{row.rate}%</td>
                  <td>{row.taxation_type}</td>
                  <td>{row.active ? "有効" : "無効"}</td>
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
