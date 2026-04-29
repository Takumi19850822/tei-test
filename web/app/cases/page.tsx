"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ScreenToolbar } from "@/app/_components/screen-toolbar";
import { useAppContext } from "@/app/_components/app-context";
import { clientApi } from "@/lib/client-api";
import { rowMatchesSearch } from "@/lib/list-search";

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
  const [listQuery, setListQuery] = useState("");
  const [error, setError] = useState("");

  const filteredRows = useMemo(
    () =>
      rows.filter((row) =>
        rowMatchesSearch(
          [row.case_name, row.customer_name, row.status, String(row.version)],
          listQuery,
        ),
      ),
    [rows, listQuery],
  );

  async function load() {
    const data = await clientApi<CaseRow[]>(loginId, "/api/cases");
    setRows(data);
  }

  useEffect(() => {
    void load().catch((e) => setError(e instanceof Error ? e.message : "読込失敗"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loginId]);

  return (
    <section className="screen">
      <div className="screen-head">
        <h2 className="screen-title">案件管理</h2>
        <ScreenToolbar searchValue={listQuery} onSearchChange={setListQuery}>
          <Link href="/cases/new" className="btn btn-positive" style={{ display: "inline-block" }}>
            新規作成
          </Link>
        </ScreenToolbar>
      </div>
      {error ? <div className="error-box">{error}</div> : null}

      <div className="list-panel">
        <table className="spec-table">
          <thead>
            <tr>
              <th>案件名</th>
              <th>顧客</th>
              <th>状態</th>
              <th>版</th>
              <th>詳細</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((row) => (
              <tr key={row.id}>
                <td>{row.case_name}</td>
                <td>{row.customer_name}</td>
                <td>{row.status}</td>
                <td>{row.version}</td>
                <td>
                  <Link className="btn btn-detail" href={`/cases/${row.id}`}>
                    詳細
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
