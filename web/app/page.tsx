"use client";

import { useEffect, useMemo, useState } from "react";

type CaseRow = {
  id: string;
  case_name: string;
  customer_name: string;
  status: string;
  memo: string | null;
  version: number;
};

type EstimateRow = {
  id: string;
  case_id: string;
  estimate_subject: string;
  estimate_date: string;
  status: string;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  note: string | null;
  version: number;
};

type OrderRow = {
  id: string;
  case_id: string;
  estimate_id: string | null;
  order_title: string;
  order_date: string;
  status: string;
  amount_excl_tax: number;
  amount_incl_tax: number;
  note: string | null;
  version: number;
};

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const json = await response.json();
  if (!response.ok || !json.ok) {
    throw new Error(json.details ?? json.message ?? "API error");
  }

  return json.data as T;
}

export default function Home() {
  const [cases, setCases] = useState<CaseRow[]>([]);
  const [estimates, setEstimates] = useState<EstimateRow[]>([]);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<string>("");
  const [selectedEstimateId, setSelectedEstimateId] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [busy, setBusy] = useState(false);

  const [caseForm, setCaseForm] = useState({
    caseName: "",
    customerName: "",
    status: "draft",
    memo: "",
  });
  const [estimateForm, setEstimateForm] = useState({
    estimateSubject: "",
    estimateDate: new Date().toISOString().slice(0, 10),
    status: "draft",
    subtotal: "0",
    taxAmount: "0",
    totalAmount: "0",
    note: "",
  });
  const [orderForm, setOrderForm] = useState({
    orderTitle: "",
    orderDate: new Date().toISOString().slice(0, 10),
    status: "draft",
    amountExclTax: "0",
    amountInclTax: "0",
    note: "",
  });

  const selectedCase = useMemo(
    () => cases.find((item) => item.id === selectedCaseId) ?? null,
    [cases, selectedCaseId],
  );

  async function loadCases() {
    const data = await api<CaseRow[]>("/api/cases");
    setCases(data);
    if (!selectedCaseId && data.length > 0) {
      setSelectedCaseId(data[0].id);
    }
  }

  async function loadEstimates(caseId: string) {
    if (!caseId) {
      setEstimates([]);
      return;
    }
    const data = await api<EstimateRow[]>(`/api/estimates?caseId=${caseId}`);
    setEstimates(data);
    if (!selectedEstimateId && data.length > 0) {
      setSelectedEstimateId(data[0].id);
    }
  }

  async function loadOrders(caseId: string) {
    if (!caseId) {
      setOrders([]);
      return;
    }
    const data = await api<OrderRow[]>(`/api/orders?caseId=${caseId}`);
    setOrders(data);
  }

  async function refreshAll(caseId: string) {
    await Promise.all([loadCases(), loadEstimates(caseId), loadOrders(caseId)]);
  }

  useEffect(() => {
    setBusy(true);
    refreshAll(selectedCaseId)
      .catch((e) => setError(e instanceof Error ? e.message : "読込に失敗しました。"))
      .finally(() => setBusy(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadEstimates(selectedCaseId).catch((e) =>
      setError(e instanceof Error ? e.message : "見積の読込に失敗しました。"),
    );
    loadOrders(selectedCaseId).catch((e) =>
      setError(e instanceof Error ? e.message : "受注の読込に失敗しました。"),
    );
  }, [selectedCaseId]);

  async function onCreateCase() {
    try {
      setBusy(true);
      await api<CaseRow>("/api/cases", {
        method: "POST",
        body: JSON.stringify(caseForm),
      });
      setCaseForm({ caseName: "", customerName: "", status: "draft", memo: "" });
      await loadCases();
    } catch (e) {
      setError(e instanceof Error ? e.message : "案件作成に失敗しました。");
    } finally {
      setBusy(false);
    }
  }

  async function onCreateEstimate() {
    if (!selectedCaseId) return;
    try {
      setBusy(true);
      await api<EstimateRow>("/api/estimates", {
        method: "POST",
        body: JSON.stringify({
          ...estimateForm,
          caseId: selectedCaseId,
        }),
      });
      setEstimateForm((prev) => ({ ...prev, estimateSubject: "", note: "" }));
      await loadEstimates(selectedCaseId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "見積作成に失敗しました。");
    } finally {
      setBusy(false);
    }
  }

  async function onCreateOrder() {
    if (!selectedCaseId) return;
    try {
      setBusy(true);
      await api<OrderRow>("/api/orders", {
        method: "POST",
        body: JSON.stringify({
          ...orderForm,
          caseId: selectedCaseId,
          estimateId: selectedEstimateId || null,
        }),
      });
      setOrderForm((prev) => ({ ...prev, orderTitle: "", note: "" }));
      await loadOrders(selectedCaseId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "受注作成に失敗しました。");
    } finally {
      setBusy(false);
    }
  }

  async function moveCaseStatus(row: CaseRow) {
    const nextStatus = row.status === "draft" ? "in_progress" : "done";
    try {
      const data = await api<CaseRow>(`/api/cases/${row.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          status: nextStatus,
          version: row.version,
        }),
      });
      setCases((prev) => prev.map((item) => (item.id === data.id ? data : item)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "案件更新に失敗しました。");
    }
  }

  async function moveEstimateStatus(row: EstimateRow) {
    const nextStatus = row.status === "draft" ? "in_progress" : "approved";
    try {
      const data = await api<EstimateRow>(`/api/estimates/${row.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          status: nextStatus,
          version: row.version,
        }),
      });
      setEstimates((prev) => prev.map((item) => (item.id === data.id ? data : item)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "見積更新に失敗しました。");
    }
  }

  async function moveOrderStatus(row: OrderRow) {
    const nextStatus = row.status === "draft" ? "ordered" : "invoiced";
    try {
      const data = await api<OrderRow>(`/api/orders/${row.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          status: nextStatus,
          version: row.version,
        }),
      });
      setOrders((prev) => prev.map((item) => (item.id === data.id ? data : item)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "受注更新に失敗しました。");
    }
  }

  return (
    <main className="mx-auto w-full max-w-7xl p-6 text-sm text-slate-900">
      <h1 className="mb-4 text-2xl font-bold">案件管理 本番相当PoC</h1>
      <p className="mb-6 text-slate-600">
        案件 → 見積 → 受注の主幹フローをレビューできる最小実装です。
      </p>

      {error ? (
        <div className="mb-4 rounded border border-red-300 bg-red-50 px-3 py-2 text-red-700">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="rounded border bg-white p-4">
          <h2 className="mb-3 text-lg font-semibold">案件</h2>
          <div className="mb-3 grid gap-2">
            <input
              className="rounded border px-2 py-1"
              placeholder="案件名"
              value={caseForm.caseName}
              onChange={(e) =>
                setCaseForm((prev) => ({ ...prev, caseName: e.target.value }))
              }
            />
            <input
              className="rounded border px-2 py-1"
              placeholder="顧客名"
              value={caseForm.customerName}
              onChange={(e) =>
                setCaseForm((prev) => ({ ...prev, customerName: e.target.value }))
              }
            />
            <button
              className="rounded bg-blue-700 px-3 py-1 text-white disabled:opacity-50"
              onClick={onCreateCase}
              disabled={busy}
            >
              案件を作成
            </button>
          </div>
          <div className="space-y-2">
            {cases.map((row) => (
              <button
                key={row.id}
                className={`w-full rounded border p-2 text-left ${
                  selectedCaseId === row.id ? "border-blue-600 bg-blue-50" : ""
                }`}
                onClick={() => setSelectedCaseId(row.id)}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{row.case_name}</span>
                  <span className="text-xs text-slate-500">v{row.version}</span>
                </div>
                <div className="text-xs text-slate-600">{row.customer_name}</div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="rounded bg-slate-100 px-2 py-0.5 text-xs">
                    {row.status}
                  </span>
                  <span
                    className="text-xs text-blue-700 underline"
                    onClick={(e) => {
                      e.stopPropagation();
                      void moveCaseStatus(row);
                    }}
                  >
                    状態更新
                  </span>
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className="rounded border bg-white p-4">
          <h2 className="mb-3 text-lg font-semibold">見積</h2>
          <p className="mb-2 text-xs text-slate-600">
            対象案件: {selectedCase ? selectedCase.case_name : "未選択"}
          </p>
          <div className="mb-3 grid gap-2">
            <input
              className="rounded border px-2 py-1"
              placeholder="見積件名"
              value={estimateForm.estimateSubject}
              onChange={(e) =>
                setEstimateForm((prev) => ({
                  ...prev,
                  estimateSubject: e.target.value,
                }))
              }
            />
            <input
              className="rounded border px-2 py-1"
              type="date"
              value={estimateForm.estimateDate}
              onChange={(e) =>
                setEstimateForm((prev) => ({ ...prev, estimateDate: e.target.value }))
              }
            />
            <div className="grid grid-cols-3 gap-2">
              <input
                className="rounded border px-2 py-1"
                type="number"
                placeholder="税抜"
                value={estimateForm.subtotal}
                onChange={(e) =>
                  setEstimateForm((prev) => ({ ...prev, subtotal: e.target.value }))
                }
              />
              <input
                className="rounded border px-2 py-1"
                type="number"
                placeholder="税額"
                value={estimateForm.taxAmount}
                onChange={(e) =>
                  setEstimateForm((prev) => ({ ...prev, taxAmount: e.target.value }))
                }
              />
              <input
                className="rounded border px-2 py-1"
                type="number"
                placeholder="税込"
                value={estimateForm.totalAmount}
                onChange={(e) =>
                  setEstimateForm((prev) => ({ ...prev, totalAmount: e.target.value }))
                }
              />
            </div>
            <button
              className="rounded bg-green-700 px-3 py-1 text-white disabled:opacity-50"
              onClick={onCreateEstimate}
              disabled={busy || !selectedCaseId}
            >
              見積を作成
            </button>
          </div>
          <div className="space-y-2">
            {estimates.map((row) => (
              <button
                key={row.id}
                className={`w-full rounded border p-2 text-left ${
                  selectedEstimateId === row.id ? "border-green-600 bg-green-50" : ""
                }`}
                onClick={() => setSelectedEstimateId(row.id)}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{row.estimate_subject}</span>
                  <span className="text-xs text-slate-500">v{row.version}</span>
                </div>
                <div className="text-xs text-slate-600">
                  {row.estimate_date} / 税込 {Number(row.total_amount).toLocaleString()}
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="rounded bg-slate-100 px-2 py-0.5 text-xs">
                    {row.status}
                  </span>
                  <span
                    className="text-xs text-blue-700 underline"
                    onClick={(e) => {
                      e.stopPropagation();
                      void moveEstimateStatus(row);
                    }}
                  >
                    状態更新
                  </span>
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className="rounded border bg-white p-4">
          <h2 className="mb-3 text-lg font-semibold">受注</h2>
          <p className="mb-2 text-xs text-slate-600">
            紐付見積: {selectedEstimateId ? "選択済み" : "未選択"}
          </p>
          <div className="mb-3 grid gap-2">
            <input
              className="rounded border px-2 py-1"
              placeholder="受注件名"
              value={orderForm.orderTitle}
              onChange={(e) =>
                setOrderForm((prev) => ({ ...prev, orderTitle: e.target.value }))
              }
            />
            <input
              className="rounded border px-2 py-1"
              type="date"
              value={orderForm.orderDate}
              onChange={(e) =>
                setOrderForm((prev) => ({ ...prev, orderDate: e.target.value }))
              }
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                className="rounded border px-2 py-1"
                type="number"
                placeholder="税抜"
                value={orderForm.amountExclTax}
                onChange={(e) =>
                  setOrderForm((prev) => ({ ...prev, amountExclTax: e.target.value }))
                }
              />
              <input
                className="rounded border px-2 py-1"
                type="number"
                placeholder="税込"
                value={orderForm.amountInclTax}
                onChange={(e) =>
                  setOrderForm((prev) => ({ ...prev, amountInclTax: e.target.value }))
                }
              />
            </div>
            <button
              className="rounded bg-purple-700 px-3 py-1 text-white disabled:opacity-50"
              onClick={onCreateOrder}
              disabled={busy || !selectedCaseId}
            >
              受注を作成
            </button>
          </div>
          <div className="space-y-2">
            {orders.map((row) => (
              <div key={row.id} className="rounded border p-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{row.order_title}</span>
                  <span className="text-xs text-slate-500">v{row.version}</span>
                </div>
                <div className="text-xs text-slate-600">
                  {row.order_date} / 税込{" "}
                  {Number(row.amount_incl_tax).toLocaleString()}
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="rounded bg-slate-100 px-2 py-0.5 text-xs">
                    {row.status}
                  </span>
                  <button
                    className="text-xs text-blue-700 underline"
                    onClick={() => void moveOrderStatus(row)}
                  >
                    状態更新
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
