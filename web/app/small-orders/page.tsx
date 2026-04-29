"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ScreenToolbar } from "@/app/_components/screen-toolbar";
import { ListPaginationBar } from "@/app/_components/list-pagination-bar";
import { useAppContext } from "@/app/_components/app-context";
import { clientApi } from "@/lib/client-api";
import { rowMatchesSearch } from "@/lib/list-search";
import { useListPagination } from "@/hooks/useListPagination";

type CaseRow = { id: string; case_name: string };
type SmallOrder = {
  id: string;
  case_id: string;
  estimate_id: string | null;
  assignee_user_id: string | null;
  order_date: string | null;
  item_name: string | null;
  delivery_date: string | null;
  delivery_slot: string | null;
  delivery_note: string | null;
  customer_branch_id: string | null;
  base_fee: number;
  planned_billing_amount: number;
  actual_billing_amount: number;
  planned_human_rate_amount: number;
  actual_human_rate_amount: number;
  planned_profit_amount: number;
  actual_profit_amount: number;
  final_billing_amount: number;
  final_profit_amount: number;
  order_category: string | null;
  order_type: string | null;
  version: number;
};

type SmallOrderLine = {
  id: string;
  small_order_id: string;
  template_id: string | null;
  line_no: number;
  detail_name: string;
  planned_hours: number;
  actual_hours: number;
  planned_amount: number;
  actual_amount: number;
  version: number;
};

function SmallOrdersPageInner() {
  const { loginId } = useAppContext();
  const searchParams = useSearchParams();
  const [cases, setCases] = useState<CaseRow[]>([]);
  const [caseId, setCaseId] = useState("");
  const [rows, setRows] = useState<SmallOrder[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [lines, setLines] = useState<SmallOrderLine[]>([]);
  const [lineDetailName, setLineDetailName] = useState("");
  const [error, setError] = useState("");
  const [listQuery, setListQuery] = useState("");

  const filteredRows = useMemo(
    () =>
      rows.filter((row) =>
        rowMatchesSearch(
          [
            row.item_name ?? "",
            row.order_date ?? "",
            row.order_category ?? "",
            row.order_type ?? "",
            String(row.final_billing_amount ?? ""),
            String(row.version),
          ],
          listQuery,
        ),
      ),
    [rows, listQuery],
  );
  const listResetKey = `${caseId}\n${listQuery}`;
  const {
    pageItems: pageRows,
    page,
    totalPages,
    total,
    rangeStart,
    rangeEnd,
    setPage,
  } = useListPagination(filteredRows, listResetKey);
  const {
    pageItems: linePageRows,
    page: linePage,
    totalPages: lineTotalPages,
    total: lineTotal,
    rangeStart: lineRangeStart,
    rangeEnd: lineRangeEnd,
    setPage: setLinePage,
  } = useListPagination(lines, selectedId || "small-order-lines");

  const selected = useMemo(
    () => rows.find((row) => row.id === selectedId) ?? null,
    [rows, selectedId],
  );

  async function loadLinesForOrder(smallOrderId: string) {
    if (!smallOrderId) return setLines([]);
    const data = await clientApi(`/api/small-order-lines?smallOrderId=${smallOrderId}`,
    );
    setLines(data);
  }

  useEffect(() => {
    void (async () => {
      try {
        const data = await clientApi("/api/cases");
        setCases(data);
        const q = searchParams.get("caseId");
        if (q && data.some((c) => c.id === q)) {
          setCaseId(q);
        } else if (data[0]) {
          setCaseId((prev) => prev || data[0].id);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "読込失敗");
      }
    })();
  }, [loginId, searchParams]);

  async function loadRows(selectedCaseId: string) {
    if (!selectedCaseId) return setRows([]);
    const data = await clientApi(`/api/small-orders?caseId=${selectedCaseId}`,
    );
    setRows(data);
    if (selectedId && !data.some((row) => row.id === selectedId)) {
      setSelectedId("");
    }
  }

  useEffect(() => {
    void loadRows(caseId).catch((e) => setError(e instanceof Error ? e.message : "読込失敗"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseId, loginId]);

  useEffect(() => {
    if (!selectedId) {
      setLines([]);
      return;
    }
    void loadLinesForOrder(selectedId).catch((e) =>
      setError(e instanceof Error ? e.message : "明細読込失敗"),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, loginId]);

  async function saveRow() {
    if (!selected) return;
    const updated = await clientApi(`/api/small-orders/${selected.id}`, {
      method: "PATCH",
      body: JSON.stringify({
        orderDate: selected.order_date,
        itemName: selected.item_name,
        estimateId: selected.estimate_id ?? "",
        assigneeUserId: selected.assignee_user_id ?? "",
        customerBranchId: selected.customer_branch_id ?? "",
        deliveryDate: selected.delivery_date,
        deliverySlot: selected.delivery_slot,
        deliveryNote: selected.delivery_note,
        baseFee: selected.base_fee,
        plannedBillingAmount: selected.planned_billing_amount,
        actualBillingAmount: selected.actual_billing_amount,
        plannedHumanRateAmount: selected.planned_human_rate_amount,
        actualHumanRateAmount: selected.actual_human_rate_amount,
        plannedProfitAmount: selected.planned_profit_amount,
        actualProfitAmount: selected.actual_profit_amount,
        finalBillingAmount: selected.final_billing_amount,
        finalProfitAmount: selected.final_profit_amount,
        orderCategory: selected.order_category,
        orderType: selected.order_type,
        version: selected.version,
      }),
    });
    setRows((prev) => prev.map((row) => (row.id === updated.id ? updated : row)));
  }

  function patchSelected(patch: Partial<SmallOrder>) {
    setRows((prev) =>
      prev.map((row) => (row.id === selectedId ? { ...row, ...patch } : row)),
    );
  }

  function patchLine(id: string, patch: Partial<SmallOrderLine>) {
    setLines((prev) => prev.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  }

  async function addLine() {
    if (!selected || !lineDetailName.trim()) return;
    await clientApi("/api/small-order-lines", {
      method: "POST",
      body: JSON.stringify({
        smallOrderId: selected.id,
        detailName: lineDetailName,
      }),
    });
    setLineDetailName("");
    await loadLinesForOrder(selected.id);
  }

  async function saveLine(line: SmallOrderLine) {
    await clientApi(`/api/small-order-lines/${line.id}`, {
      method: "PATCH",
      body: JSON.stringify({
        detailName: line.detail_name,
        plannedHours: line.planned_hours,
        actualHours: line.actual_hours,
        plannedAmount: line.planned_amount,
        actualAmount: line.actual_amount,
        version: line.version,
      }),
    });
    await loadLinesForOrder(selected!.id);
  }

  return (
    <section className="screen">
      <div className="screen-head">
        <h2 className="screen-title">小口受注</h2>
        {!selected ? (
          <ScreenToolbar searchValue={listQuery} onSearchChange={setListQuery} />
        ) : null}
      </div>
      {error ? <div className="error-box">{error}</div> : null}
      <div className="screen-controls">
        <select value={caseId} onChange={(e) => setCaseId(e.target.value)}>
          <option value="">案件を選択</option>
          {cases.map((row) => (
            <option key={row.id} value={row.id}>
              {row.case_name}
            </option>
          ))}
        </select>
        <Link
          className="btn btn-positive"
          href={caseId ? `/small-orders/new?caseId=${caseId}` : "/small-orders/new"}
        >
          新規追加
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
              見積ID
              <input
                value={selected.estimate_id ?? ""}
                onChange={(e) => patchSelected({ estimate_id: e.target.value || null })}
              />
            </label>
            <label>
              担当ユーザID
              <input
                value={selected.assignee_user_id ?? ""}
                onChange={(e) => patchSelected({ assignee_user_id: e.target.value || null })}
              />
            </label>
            <label>
              顧客拠点ID
              <input
                value={selected.customer_branch_id ?? ""}
                onChange={(e) => patchSelected({ customer_branch_id: e.target.value || null })}
              />
            </label>
            <label>
              受注日
              <input
                type="date"
                value={selected.order_date ?? ""}
                onChange={(e) => patchSelected({ order_date: e.target.value })}
              />
            </label>
            <label>
              品名
              <input
                value={selected.item_name ?? ""}
                onChange={(e) => patchSelected({ item_name: e.target.value })}
              />
            </label>
            <label>
              納品日
              <input
                type="date"
                value={selected.delivery_date ?? ""}
                onChange={(e) => patchSelected({ delivery_date: e.target.value })}
              />
            </label>
            <label>
              納品時間帯
              <input
                value={selected.delivery_slot ?? ""}
                onChange={(e) => patchSelected({ delivery_slot: e.target.value })}
              />
            </label>
            <label>
              納品備考
              <input
                value={selected.delivery_note ?? ""}
                onChange={(e) => patchSelected({ delivery_note: e.target.value })}
              />
            </label>
            <label>
              受注分類
              <input
                value={selected.order_category ?? ""}
                onChange={(e) => patchSelected({ order_category: e.target.value })}
              />
            </label>
            <label>
              受注種別
              <input
                value={selected.order_type ?? ""}
                onChange={(e) => patchSelected({ order_type: e.target.value })}
              />
            </label>
            <label>
              基本料金
              <input
                type="number"
                value={selected.base_fee}
                onChange={(e) => patchSelected({ base_fee: Number(e.target.value) })}
              />
            </label>
            <label>
              予定請求額
              <input
                type="number"
                value={selected.planned_billing_amount}
                onChange={(e) => patchSelected({ planned_billing_amount: Number(e.target.value) })}
              />
            </label>
            <label>
              実績請求額
              <input
                type="number"
                value={selected.actual_billing_amount}
                onChange={(e) => patchSelected({ actual_billing_amount: Number(e.target.value) })}
              />
            </label>
            <label>
              予定人工費
              <input
                type="number"
                value={selected.planned_human_rate_amount}
                onChange={(e) =>
                  patchSelected({ planned_human_rate_amount: Number(e.target.value) })
                }
              />
            </label>
            <label>
              実績人工費
              <input
                type="number"
                value={selected.actual_human_rate_amount}
                onChange={(e) =>
                  patchSelected({ actual_human_rate_amount: Number(e.target.value) })
                }
              />
            </label>
            <label>
              予定粗利
              <input
                type="number"
                value={selected.planned_profit_amount}
                onChange={(e) => patchSelected({ planned_profit_amount: Number(e.target.value) })}
              />
            </label>
            <label>
              実績粗利
              <input
                type="number"
                value={selected.actual_profit_amount}
                onChange={(e) => patchSelected({ actual_profit_amount: Number(e.target.value) })}
              />
            </label>
            <label>
              実質請求額
              <input
                type="number"
                value={selected.final_billing_amount}
                onChange={(e) =>
                  patchSelected({ final_billing_amount: Number(e.target.value) })
                }
              />
            </label>
            <label>
              最終粗利
              <input
                type="number"
                value={selected.final_profit_amount}
                onChange={(e) => patchSelected({ final_profit_amount: Number(e.target.value) })}
              />
            </label>
            <button className="btn btn-positive" onClick={() => void saveRow()}>
              ヘッダ保存
            </button>
          </div>

          <div className="sub-block">
            <h4>明細</h4>
            <div className="create-bar">
              <input
                placeholder="明細名"
                value={lineDetailName}
                onChange={(e) => setLineDetailName(e.target.value)}
              />
              <button className="btn btn-positive" type="button" onClick={() => void addLine()}>
                明細追加
              </button>
            </div>
            <table className="spec-table spec-table--list">
              <thead>
                <tr>
                  <th>操作</th>
                  <th>No</th>
                  <th>明細名</th>
                  <th>予定時間</th>
                  <th>実績時間</th>
                  <th>予定金額</th>
                  <th>実績金額</th>
                  <th>版</th>
                </tr>
              </thead>
              <tbody>
                {linePageRows.map((line) => (
                  <tr key={line.id}>
                    <td>
                      <button
                        type="button"
                        className="btn btn-positive btn-sm"
                        onClick={() => void saveLine(line)}
                      >
                        保存
                      </button>
                    </td>
                    <td>{line.line_no}</td>
                    <td>
                      <input
                        value={line.detail_name}
                        onChange={(e) => patchLine(line.id, { detail_name: e.target.value })}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        value={line.planned_hours}
                        onChange={(e) =>
                          patchLine(line.id, { planned_hours: Number(e.target.value) })
                        }
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        value={line.actual_hours}
                        onChange={(e) =>
                          patchLine(line.id, { actual_hours: Number(e.target.value) })
                        }
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        value={line.planned_amount}
                        onChange={(e) =>
                          patchLine(line.id, { planned_amount: Number(e.target.value) })
                        }
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        value={line.actual_amount}
                        onChange={(e) =>
                          patchLine(line.id, { actual_amount: Number(e.target.value) })
                        }
                      />
                    </td>
                    <td>{line.version}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <ListPaginationBar
              page={linePage}
              totalPages={lineTotalPages}
              totalCount={lineTotal}
              rangeStart={lineRangeStart}
              rangeEnd={lineRangeEnd}
              setPage={setLinePage}
            />
          </div>
        </div>
      ) : (
        <div className="list-panel">
          <table className="spec-table spec-table--list">
            <thead><tr><th className="col-actions">操作</th><th>受注日</th><th>品名</th><th>実質請求額</th><th>版</th></tr></thead>
            <tbody>
              {pageRows.map((row) => (
                <tr key={row.id}>
                  <td className="table-actions-cell">
                    <div className="table-actions">
                      <button type="button" className="btn btn-detail btn-sm" onClick={() => setSelectedId(row.id)}>
                        詳細
                      </button>
                    </div>
                  </td>
                  <td>{row.order_date ?? "-"}</td>
                  <td>{row.item_name ?? "-"}</td>
                  <td>{Number(row.final_billing_amount ?? 0).toLocaleString()}</td>
                  <td>{row.version}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <ListPaginationBar
            page={page}
            totalPages={totalPages}
            totalCount={total}
            rangeStart={rangeStart}
            rangeEnd={rangeEnd}
            setPage={setPage}
          />
        </div>
      )}
    </section>
  );
}

export default function SmallOrdersPage() {
  return (
    <Suspense fallback={<section className="screen"><p>読込中...</p></section>}>
      <SmallOrdersPageInner />
    </Suspense>
  );
}
