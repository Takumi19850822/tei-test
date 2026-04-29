"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { applyCustomerPick, CaseCustomerRow } from "@/app/_components/case-customer-fields";
import { ListPaginationBar } from "@/app/_components/list-pagination-bar";
import { useAppContext } from "@/app/_components/app-context";
import { clientApi } from "@/lib/client-api";
import { useListPagination } from "@/hooks/useListPagination";
import { normalizeCaseStatus } from "@/lib/case-status";

type CaseRow = {
  id: string;
  case_name: string;
  customer_name: string;
  customer_id: string | null;
  status: string;
  memo: string | null;
  version: number;
  sales_user_id: string | null;
  customer_branch_id: string | null;
  customer_contact_id: string | null;
  case_type_id: string | null;
};

type UserOption = {
  id: string;
  user_name: string;
  login_id: string;
  is_active: boolean;
};

type CaseTypeRow = { id: string; type_name: string };

type EstimateRow = {
  id: string;
  estimate_subject: string;
  estimate_date: string;
  total_amount: number;
  version: number;
};

type SmallOrderRow = {
  id: string;
  item_name: string | null;
  order_date: string | null;
  final_billing_amount: number;
  version: number;
};

type OrderRow = {
  id: string;
  order_title: string;
  order_date: string;
  amount_incl_tax: number;
  version: number;
};

type TabKey = "estimate" | "small" | "order" | "spec";

export default function CaseDetailPage() {
  const params = useParams();
  const caseId = String(params.caseId ?? "");
  const { loginId } = useAppContext();
  const [caseRow, setCaseRow] = useState<CaseRow | null>(null);
  const [tab, setTab] = useState<TabKey>("estimate");
  const [estimates, setEstimates] = useState<EstimateRow[]>([]);
  const [smallOrders, setSmallOrders] = useState<SmallOrderRow[]>([]);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [caseTypes, setCaseTypes] = useState<CaseTypeRow[]>([]);

  const memoizedCaseId = useMemo(() => caseId, [caseId]);
  const {
    pageItems: estimatePageRows,
    page: estimatePage,
    totalPages: estimateTotalPages,
    total: estimateTotal,
    rangeStart: estimateRangeStart,
    rangeEnd: estimateRangeEnd,
    setPage: setEstimatePage,
  } = useListPagination(estimates, `${memoizedCaseId}-estimates`);
  const {
    pageItems: smallOrderPageRows,
    page: smallOrderPage,
    totalPages: smallOrderTotalPages,
    total: smallOrderTotal,
    rangeStart: smallOrderRangeStart,
    rangeEnd: smallOrderRangeEnd,
    setPage: setSmallOrderPage,
  } = useListPagination(smallOrders, `${memoizedCaseId}-small-orders`);
  const {
    pageItems: orderPageRows,
    page: caseOrderPage,
    totalPages: caseOrderTotalPages,
    total: caseOrderTotal,
    rangeStart: caseOrderRangeStart,
    rangeEnd: caseOrderRangeEnd,
    setPage: setCaseOrderPage,
  } = useListPagination(orders, `${memoizedCaseId}-orders`);

  useEffect(() => {
    void (async () => {
      try {
        const [u, t] = await Promise.all([
          clientApi("/api/users"),
          clientApi("/api/case-types"),
        ]);
        setUsers(u);
        setCaseTypes(t);
      } catch {
        setUsers([]);
        setCaseTypes([]);
      }
    })();
  }, [loginId]);

  useEffect(() => {
    if (!memoizedCaseId) return;
    void (async () => {
      try {
        const row = await clientApi(`/api/cases/${memoizedCaseId}`);
        setCaseRow({
          ...row,
          status: normalizeCaseStatus(String(row.status ?? "draft")),
        });
      } catch (e) {
        setError(e instanceof Error ? e.message : "案件の取得に失敗しました");
      }
    })();
  }, [loginId, memoizedCaseId]);

  useEffect(() => {
    if (!memoizedCaseId || !caseRow) return;
    void (async () => {
      try {
        if (tab === "estimate") {
          const data = await clientApi(
            `/api/estimates?caseId=${memoizedCaseId}`,
          );
          setEstimates(data);
        } else if (tab === "small") {
          const data = await clientApi(
            `/api/small-orders?caseId=${memoizedCaseId}`,
          );
          setSmallOrders(data);
        } else if (tab === "order") {
          const data = await clientApi(`/api/orders?caseId=${memoizedCaseId}`);
          setOrders(data);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "一覧の取得に失敗しました");
      }
    })();
  }, [tab, loginId, memoizedCaseId, caseRow]);

  async function saveCase() {
    if (!caseRow) return;
    setSaving(true);
    setError("");
    try {
      const updated = await clientApi(`/api/cases/${caseRow.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          caseName: caseRow.case_name,
          customerName: caseRow.customer_name,
          status: caseRow.status,
          memo: caseRow.memo ?? "",
          salesUserId: caseRow.sales_user_id ?? "",
          caseTypeId: caseRow.case_type_id ?? "",
          customerId: caseRow.customer_id ?? "",
          customerBranchId: caseRow.customer_branch_id ?? "",
          customerContactId: caseRow.customer_contact_id ?? "",
          version: caseRow.version,
        }),
      });
      setCaseRow({
        ...updated,
        status: normalizeCaseStatus(String(updated.status ?? "draft")),
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "更新失敗");
    } finally {
      setSaving(false);
    }
  }

  if (!memoizedCaseId) {
    return (
      <section className="screen">
        <p>案件IDが不正です。</p>
      </section>
    );
  }

  return (
    <section className="screen">
      <h2 className="screen-title">案件管理　詳細画面</h2>
      {error ? <div className="error-box">{error}</div> : null}

      <div className="tab-panel-toolbar">
        <Link href="/cases" className="btn btn-detail">
          一覧へ戻る
        </Link>
      </div>

      {caseRow ? (
        <div className="detail-panel">
          <h3>案件基本情報</h3>
          <div className="detail-form detail-form--case">
            <label className="case-field-full">
              案件名
              <input
                value={caseRow.case_name}
                onChange={(e) => setCaseRow({ ...caseRow, case_name: e.target.value })}
              />
            </label>
            <div className="case-form-row3 case-form-row3--case-meta">
              <label className="case-field-std">
                営業担当
                <select
                  value={caseRow.sales_user_id ?? ""}
                  onChange={(e) =>
                    setCaseRow({
                      ...caseRow,
                      sales_user_id: e.target.value || null,
                    })
                  }
                >
                  <option value="">（未設定）</option>
                  {users
                    .filter((u) => u.is_active)
                    .map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.user_name}（{u.login_id}）
                      </option>
                    ))}
                </select>
              </label>
              <label className="case-field-std">
                案件種別
                <select
                  value={caseRow.case_type_id ?? ""}
                  onChange={(e) =>
                    setCaseRow({
                      ...caseRow,
                      case_type_id: e.target.value || null,
                    })
                  }
                >
                  <option value="">（未設定）</option>
                  {caseTypes.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.type_name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="case-field-std">
                状態
                <select
                  value={caseRow.status}
                  onChange={(e) => setCaseRow({ ...caseRow, status: e.target.value })}
                >
                  <option value="draft">下書き</option>
                  <option value="active">アクティブ</option>
                  <option value="closed">終了</option>
                </select>
              </label>
            </div>
            <CaseCustomerRow
              key={`${caseRow.id}-${caseRow.customer_id ?? "none"}`}
              customerName={caseRow.customer_name}
              onCustomerNameChange={(v) =>
                setCaseRow((prev) => {
                  if (!prev) return prev;
                  return {
                    ...prev,
                    customer_name: v,
                    ...(v.trim() === ""
                      ? {
                          customer_id: null,
                          customer_branch_id: null,
                          customer_contact_id: null,
                        }
                      : {}),
                  };
                })
              }
              onCustomerPick={(c) => {
                const p = applyCustomerPick(c);
                setCaseRow((prev) => {
                  if (!prev) return prev;
                  return {
                    ...prev,
                    customer_name: p.customerName,
                    customer_id: p.customerId,
                    customer_branch_id: null,
                    customer_contact_id: null,
                  };
                });
              }}
              customerId={caseRow.customer_id}
              branchId={caseRow.customer_branch_id}
              contactId={caseRow.customer_contact_id}
              onBranchChange={(v) =>
                setCaseRow((prev) => {
                  if (!prev) return prev;
                  return {
                    ...prev,
                    customer_branch_id: v,
                    customer_contact_id: null,
                  };
                })
              }
              onContactChange={(v) =>
                setCaseRow((prev) => (prev ? { ...prev, customer_contact_id: v } : prev))
              }
            />
            <label className="case-field-std">
              メモ
              <textarea
                value={caseRow.memo ?? ""}
                onChange={(e) => setCaseRow({ ...caseRow, memo: e.target.value })}
              />
            </label>
            <div className="case-form-save-row">
              <button type="button" className="btn btn-positive" disabled={saving} onClick={() => void saveCase()}>
                保存
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="tab-strip" role="tablist" aria-label="案件関連の区分">
        <button
          type="button"
          role="tab"
          aria-selected={tab === "estimate"}
          onClick={() => setTab("estimate")}
        >
          見積
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "small"}
          onClick={() => setTab("small")}
        >
          小口受注
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "order"}
          onClick={() => setTab("order")}
        >
          受注
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "spec"}
          onClick={() => setTab("spec")}
        >
          受注表（抜き型/LC）
        </button>
      </div>

      {tab === "estimate" ? (
        <div className="sub-block">
          <div className="tab-panel-toolbar">
            <div className="tab-panel-toolbar__lead">
              <Link className="btn btn-detail" href={`/estimates?caseId=${memoizedCaseId}`}>
                一覧・編集
              </Link>
            </div>
            <div className="tab-panel-toolbar__end">
              <Link className="btn btn-positive" href={`/estimates/new?caseId=${memoizedCaseId}`}>
                新規追加
              </Link>
            </div>
          </div>
          <table className="spec-table">
            <thead>
              <tr>
                <th>件名</th>
                <th>日付</th>
                <th>税込</th>
                <th>版</th>
              </tr>
            </thead>
            <tbody>
              {estimatePageRows.map((row) => (
                <tr key={row.id}>
                  <td>{row.estimate_subject}</td>
                  <td>{row.estimate_date}</td>
                  <td>{Number(row.total_amount).toLocaleString()}</td>
                  <td>{row.version}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <ListPaginationBar
            page={estimatePage}
            totalPages={estimateTotalPages}
            totalCount={estimateTotal}
            rangeStart={estimateRangeStart}
            rangeEnd={estimateRangeEnd}
            setPage={setEstimatePage}
          />
        </div>
      ) : null}

      {tab === "small" ? (
        <div className="sub-block">
          <div className="tab-panel-toolbar">
            <div className="tab-panel-toolbar__lead">
              <Link className="btn btn-detail" href={`/small-orders?caseId=${memoizedCaseId}`}>
                一覧・編集
              </Link>
            </div>
            <div className="tab-panel-toolbar__end">
              <Link className="btn btn-positive" href={`/small-orders/new?caseId=${memoizedCaseId}`}>
                新規追加
              </Link>
            </div>
          </div>
          <table className="spec-table">
            <thead>
              <tr>
                <th>受注日</th>
                <th>品名</th>
                <th>実質請求額</th>
                <th>版</th>
              </tr>
            </thead>
            <tbody>
              {smallOrderPageRows.map((row) => (
                <tr key={row.id}>
                  <td>{row.order_date ?? "-"}</td>
                  <td>{row.item_name ?? "-"}</td>
                  <td>{Number(row.final_billing_amount ?? 0).toLocaleString()}</td>
                  <td>{row.version}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <ListPaginationBar
            page={smallOrderPage}
            totalPages={smallOrderTotalPages}
            totalCount={smallOrderTotal}
            rangeStart={smallOrderRangeStart}
            rangeEnd={smallOrderRangeEnd}
            setPage={setSmallOrderPage}
          />
        </div>
      ) : null}

      {tab === "order" ? (
        <div className="sub-block">
          <div className="tab-panel-toolbar">
            <div className="tab-panel-toolbar__lead">
              <Link className="btn btn-detail" href={`/orders?caseId=${memoizedCaseId}`}>
                一覧・編集
              </Link>
            </div>
            <div className="tab-panel-toolbar__end">
              <Link className="btn btn-positive" href={`/orders/new?caseId=${memoizedCaseId}`}>
                新規追加
              </Link>
            </div>
          </div>
          <table className="spec-table">
            <thead>
              <tr>
                <th>件名</th>
                <th>日付</th>
                <th>税込</th>
                <th>版</th>
              </tr>
            </thead>
            <tbody>
              {orderPageRows.map((row) => (
                <tr key={row.id}>
                  <td>{row.order_title}</td>
                  <td>{row.order_date}</td>
                  <td>{Number(row.amount_incl_tax).toLocaleString()}</td>
                  <td>{row.version}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <ListPaginationBar
            page={caseOrderPage}
            totalPages={caseOrderTotalPages}
            totalCount={caseOrderTotal}
            rangeStart={caseOrderRangeStart}
            rangeEnd={caseOrderRangeEnd}
            setPage={setCaseOrderPage}
          />
        </div>
      ) : null}

      {tab === "spec" ? (
        <div className="sub-block">
          <div className="tab-panel-toolbar">
            <div className="tab-panel-toolbar__lead">
              <Link className="btn btn-detail" href={`/specs?caseId=${memoizedCaseId}`}>
                一覧・編集
              </Link>
            </div>
            <div className="tab-panel-toolbar__end">
              <Link className="btn btn-positive" href={`/specs/new?caseId=${memoizedCaseId}`}>
                新規追加
              </Link>
            </div>
          </div>
          <p className="screen-note">
            この案件の受注に紐づく抜き型・LC仕様の一覧・編集、または新規登録は次の画面へ。
          </p>
        </div>
      ) : null}
    </section>
  );
}
