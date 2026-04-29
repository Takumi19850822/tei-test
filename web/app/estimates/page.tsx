"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ScreenToolbar } from "@/app/_components/screen-toolbar";
import { useAppContext } from "@/app/_components/app-context";
import { clientApi } from "@/lib/client-api";
import { rowMatchesSearch } from "@/lib/list-search";

type Estimate = {
  id: string;
  estimate_subject: string;
  estimate_date: string;
  status: string;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  case_id: string;
  version: number;
};

type EstimateLine = {
  id: string;
  line_no: number;
  item_name: string;
  unit_price: number;
  quantity: number;
  unit: string | null;
  tax_amount: number;
  version: number;
};

type CaseRow = { id: string; case_name: string };

function EstimatesPageInner() {
  const { loginId } = useAppContext();
  const searchParams = useSearchParams();
  const [cases, setCases] = useState<CaseRow[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState("");
  const [rows, setRows] = useState<Estimate[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [lines, setLines] = useState<EstimateLine[]>([]);
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
            row.estimate_subject,
            row.estimate_date,
            row.status,
            String(row.total_amount),
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

  async function loadEstimates(caseId: string) {
    if (!caseId) return setRows([]);
    const data = await clientApi<Estimate[]>(loginId, `/api/estimates?caseId=${caseId}`);
    setRows(data);
    if (selectedId && !data.some((row) => row.id === selectedId)) {
      setSelectedId("");
    }
  }

  async function loadLines(estimateId: string) {
    if (!estimateId) return setLines([]);
    const data = await clientApi<EstimateLine[]>(
      loginId,
      `/api/estimate-lines?estimateId=${estimateId}`,
    );
    setLines(data);
  }

  useEffect(() => {
    void (async () => {
      try {
        const data = await clientApi<CaseRow[]>(loginId, "/api/cases");
        setCases(data);
        const q = searchParams.get("caseId");
        if (q && data.some((c) => c.id === q)) {
          setSelectedCaseId(q);
        } else if (data[0]) {
          setSelectedCaseId((prev) => prev || data[0].id);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "読込失敗");
      }
    })();
  }, [loginId, searchParams]);

  useEffect(() => {
    void loadEstimates(selectedCaseId).catch((e) =>
      setError(e instanceof Error ? e.message : "読込失敗"),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCaseId, loginId]);

  useEffect(() => {
    void loadLines(selectedId).catch((e) => setError(e instanceof Error ? e.message : "読込失敗"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, loginId]);

  async function createLine() {
    if (!selectedId || !lineName.trim()) return;
    await clientApi(loginId, "/api/estimate-lines", {
      method: "POST",
      body: JSON.stringify({
        estimateId: selectedId,
        lineNo: lines.length + 1,
        itemName: lineName,
        unitPrice: linePrice,
        quantity: lineQty,
        unit: lineUnit,
        taxRate: 10,
      }),
    });
    setLineName("");
    await Promise.all([loadLines(selectedId), loadEstimates(selectedCaseId)]);
  }

  return (
    <section className="screen">
      <div className="screen-head">
        <h2 className="screen-title">見積</h2>
        {!selected ? (
          <ScreenToolbar searchValue={listQuery} onSearchChange={setListQuery} />
        ) : null}
      </div>
      {error ? <div className="error-box">{error}</div> : null}
      <div className="screen-controls">
        <select value={selectedCaseId} onChange={(e) => setSelectedCaseId(e.target.value)}>
          <option value="">案件を選択</option>
          {cases.map((row) => (
            <option key={row.id} value={row.id}>
              {row.case_name}
            </option>
          ))}
        </select>
        <Link
          className="btn btn-positive"
          href={
            selectedCaseId
              ? `/estimates/new?caseId=${selectedCaseId}`
              : "/estimates/new"
          }
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
          <div className="detail-summary">
            税抜 {selected.subtotal.toLocaleString()} / 税額 {selected.tax_amount.toLocaleString()} / 税込 {selected.total_amount.toLocaleString()}
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
              {lines.map((line) => (
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
        </div>
      ) : (
        <div className="list-panel">
          <table className="spec-table">
            <thead><tr><th>件名</th><th>日付</th><th>税込</th><th>版</th><th>詳細</th></tr></thead>
            <tbody>
              {filteredRows.map((row) => (
                <tr key={row.id}>
                  <td>{row.estimate_subject}</td>
                  <td>{row.estimate_date}</td>
                  <td>{row.total_amount.toLocaleString()}</td>
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

export default function EstimatesPage() {
  return (
    <Suspense fallback={<section className="screen"><p>読込中...</p></section>}>
      <EstimatesPageInner />
    </Suspense>
  );
}
