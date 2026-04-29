"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ScreenToolbar } from "@/app/_components/screen-toolbar";
import { useAppContext } from "@/app/_components/app-context";
import { clientApi } from "@/lib/client-api";
import { rowMatchesSearch } from "@/lib/list-search";

type DeliveryDestination = {
  id: string;
  destination_name: string;
  postal_code: string | null;
  prefecture: string | null;
  city: string | null;
  address_line: string | null;
  phone: string | null;
  email: string | null;
  version: number;
};

export default function DeliveryDestinationsPage() {
  const { loginId } = useAppContext();
  const [rows, setRows] = useState<DeliveryDestination[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [listQuery, setListQuery] = useState("");
  const [error, setError] = useState("");

  const selected = useMemo(
    () => rows.find((row) => row.id === selectedId) ?? null,
    [rows, selectedId],
  );

  const filteredRows = useMemo(
    () =>
      rows.filter((row) =>
        rowMatchesSearch(
          [
            row.destination_name,
            row.city ?? "",
            row.prefecture ?? "",
            row.phone ?? "",
            String(row.version),
          ],
          listQuery,
        ),
      ),
    [rows, listQuery],
  );

  async function loadRows() {
    const data = await clientApi<DeliveryDestination[]>(loginId, "/api/delivery-destinations");
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
    const updated = await clientApi<DeliveryDestination>(
      loginId,
      `/api/delivery-destinations/${selected.id}`,
      {
        method: "PATCH",
        body: JSON.stringify({
          destinationName: selected.destination_name,
          postalCode: selected.postal_code,
          prefecture: selected.prefecture,
          city: selected.city,
          addressLine: selected.address_line,
          phone: selected.phone,
          email: selected.email,
          version: selected.version,
        }),
      },
    );
    setRows((prev) => prev.map((row) => (row.id === updated.id ? updated : row)));
  }

  function patchSelected(patch: Partial<DeliveryDestination>) {
    setRows((prev) =>
      prev.map((row) => (row.id === selectedId ? { ...row, ...patch } : row)),
    );
  }

  return (
    <section className="screen">
      <div className="screen-head">
        <h2 className="screen-title">納品先管理</h2>
        {!selected ? (
          <ScreenToolbar searchValue={listQuery} onSearchChange={setListQuery}>
            <Link href="/delivery-destinations/new" className="btn btn-positive">
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
          <h3>詳細</h3>
          <div className="detail-form">
            <label>
              納品先名
              <input
                value={selected.destination_name}
                onChange={(e) => patchSelected({ destination_name: e.target.value })}
              />
            </label>
            <label>
              郵便番号
              <input
                value={selected.postal_code ?? ""}
                onChange={(e) => patchSelected({ postal_code: e.target.value })}
              />
            </label>
            <label>
              都道府県
              <input
                value={selected.prefecture ?? ""}
                onChange={(e) => patchSelected({ prefecture: e.target.value })}
              />
            </label>
            <label>
              市区町村
              <input
                value={selected.city ?? ""}
                onChange={(e) => patchSelected({ city: e.target.value })}
              />
            </label>
            <label>
              住所
              <input
                value={selected.address_line ?? ""}
                onChange={(e) => patchSelected({ address_line: e.target.value })}
              />
            </label>
            <label>
              電話
              <input
                value={selected.phone ?? ""}
                onChange={(e) => patchSelected({ phone: e.target.value })}
              />
            </label>
            <label>
              メール
              <input
                value={selected.email ?? ""}
                onChange={(e) => patchSelected({ email: e.target.value })}
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
            <thead><tr><th>納品先名</th><th>市区町村</th><th>電話</th><th>版</th><th>詳細</th></tr></thead>
            <tbody>
              {filteredRows.map((row) => (
                <tr key={row.id}>
                  <td>{row.destination_name}</td>
                  <td>{row.city ?? "-"}</td>
                  <td>{row.phone ?? "-"}</td>
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
