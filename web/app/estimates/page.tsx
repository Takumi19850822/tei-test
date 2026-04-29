"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useMemo, useState } from "react";
import { useAppContext } from "@/app/_components/app-context";
import { clientApi } from "@/lib/client-api";

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
  tax_amount: number;
  version: number;
};

type CaseRow = { id: string; case_name: string };

export default function EstimatesPage() {
  const { loginId } = useAppContext();
  const [cases, setCases] = useState<CaseRow[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState("");
  const [rows, setRows] = useState<Estimate[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [lines, setLines] = useState<EstimateLine[]>([]);
  const [newSubject, setNewSubject] = useState("");
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
    if (!selectedCaseId && data[0]) setSelectedCaseId(data[0].id);
  }

  async function loadEstimates(caseId: string) {
    if (!caseId) return setRows([]);
    const data = await clientApi<Estimate[]>(loginId, `/api/estimates?caseId=${caseId}`);
    setRows(data);
    if (!selectedId && data[0]) setSelectedId(data[0].id);
    if (selectedId && !data.some((row) => row.id === selectedId)) {
      setSelectedId(data[0]?.id ?? "");
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
    void loadCases().catch((e) => setError(e instanceof Error ? e.message : "読込失敗"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loginId]);

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

  async function createEstimate() {
    if (!selectedCaseId || !newSubject.trim()) return;
    await clientApi(loginId, "/api/estimates", {
      method: "POST",
      body: JSON.stringify({
        caseId: selectedCaseId,
        estimateSubject: newSubject,
        estimateDate: new Date().toISOString().slice(0, 10),
        subtotal: 0,
        taxAmount: 0,
        totalAmount: 0,
      }),
    });
    setNewSubject("");
    await loadEstimates(selectedCaseId);
  }

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
        taxRate: 10,
      }),
    });
    setLineName("");
    await Promise.all([loadLines(selectedId), loadEstimates(selectedCaseId)]);
  }

  return (
    <section className="screen">
      <h2 className="screen-title">見積</h2>
      {error ? <div className="error-box">{error}</div> : null}
      <div className="create-bar">
        <select value={selectedCaseId} onChange={(e) => setSelectedCaseId(e.target.value)}>
          <option value="">案件を選択</option>
          {cases.map((row) => (
            <option key={row.id} value={row.id}>
              {row.case_name}
            </option>
          ))}
        </select>
        <input
          placeholder="見積件名"
          value={newSubject}
          onChange={(e) => setNewSubject(e.target.value)}
        />
        <button className="btn btn-positive" onClick={() => void createEstimate()}>
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
                  <td>{row.estimate_subject}</td>
                  <td>{row.estimate_date}</td>
                  <td>{row.total_amount.toLocaleString()}</td>
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
                税抜 {selected.subtotal.toLocaleString()} / 税額 {selected.tax_amount.toLocaleString()} / 税込 {selected.total_amount.toLocaleString()}
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
            <p>一覧から見積を選択してください。</p>
          )}
        </div>
      </div>
    </section>
  );
}
