"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
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

  useEffect(() => {
    void (async () => {
      try {
        const [u, t] = await Promise.all([
          clientApi<UserOption[]>(loginId, "/api/users"),
          clientApi<CaseTypeRow[]>(loginId, "/api/case-types"),
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
        const row = await clientApi<CaseRow>(loginId, `/api/cases/${memoizedCaseId}`);
        setCaseRow(row);
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
          const data = await clientApi<EstimateRow[]>(
            loginId,
            `/api/estimates?caseId=${memoizedCaseId}`,
          );
          setEstimates(data);
        } else if (tab === "small") {
          const data = await clientApi<SmallOrderRow[]>(
            loginId,
            `/api/small-orders?caseId=${memoizedCaseId}`,
          );
          setSmallOrders(data);
        } else if (tab === "order") {
          const data = await clientApi<OrderRow[]>(
            loginId,
            `/api/orders?caseId=${memoizedCaseId}`,
          );
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
      const updated = await clientApi<CaseRow>(loginId, `/api/cases/${caseRow.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          caseName: caseRow.case_name,
          customerName: caseRow.customer_name,
          status: caseRow.status,
          memo: caseRow.memo ?? "",
          salesUserId: caseRow.sales_user_id ?? "",
          caseTypeId: caseRow.case_type_id ?? "",
          customerBranchId: caseRow.customer_branch_id ?? "",
          customerContactId: caseRow.customer_contact_id ?? "",
          version: caseRow.version,
        }),
      });
      setCaseRow(updated);
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
          <div className="detail-form">
            <label>
              案件名
              <input
                value={caseRow.case_name}
                onChange={(e) => setCaseRow({ ...caseRow, case_name: e.target.value })}
              />
            </label>
            <label>
              顧客名
              <input
                value={caseRow.customer_name}
                onChange={(e) => setCaseRow({ ...caseRow, customer_name: e.target.value })}
              />
            </label>
            <label>
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
            <label>
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
            <label>
              顧客拠点ID（customer_branches.id）
              <input
                value={caseRow.customer_branch_id ?? ""}
                onChange={(e) =>
                  setCaseRow({
                    ...caseRow,
                    customer_branch_id: e.target.value.trim() || null,
                  })
                }
                placeholder="UUID"
              />
            </label>
            <label>
              顧客担当者ID（customer_contacts.id）
              <input
                value={caseRow.customer_contact_id ?? ""}
                onChange={(e) =>
                  setCaseRow({
                    ...caseRow,
                    customer_contact_id: e.target.value.trim() || null,
                  })
                }
                placeholder="UUID"
              />
            </label>
            <label>
              状態
              <select
                value={caseRow.status}
                onChange={(e) => setCaseRow({ ...caseRow, status: e.target.value })}
              >
                <option value="draft">draft</option>
                <option value="in_progress">in_progress</option>
                <option value="done">done</option>
              </select>
            </label>
            <label>
              メモ
              <textarea
                value={caseRow.memo ?? ""}
                onChange={(e) => setCaseRow({ ...caseRow, memo: e.target.value })}
              />
            </label>
            <button className="btn btn-positive" disabled={saving} onClick={() => void saveCase()}>
              保存
            </button>
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
        <div className="sub-block" style={{ marginTop: 12 }}>
          <div className="tab-panel-toolbar">
            <Link className="btn btn-detail" href={`/estimates?caseId=${memoizedCaseId}`}>
              一覧・編集
            </Link>
            <Link className="btn btn-positive" href={`/estimates/new?caseId=${memoizedCaseId}`}>
              新規作成
            </Link>
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
              {estimates.map((row) => (
                <tr key={row.id}>
                  <td>{row.estimate_subject}</td>
                  <td>{row.estimate_date}</td>
                  <td>{Number(row.total_amount).toLocaleString()}</td>
                  <td>{row.version}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {tab === "small" ? (
        <div className="sub-block" style={{ marginTop: 12 }}>
          <div className="tab-panel-toolbar">
            <Link className="btn btn-detail" href={`/small-orders?caseId=${memoizedCaseId}`}>
              一覧・編集
            </Link>
            <Link className="btn btn-positive" href={`/small-orders/new?caseId=${memoizedCaseId}`}>
              新規作成
            </Link>
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
              {smallOrders.map((row) => (
                <tr key={row.id}>
                  <td>{row.order_date ?? "-"}</td>
                  <td>{row.item_name ?? "-"}</td>
                  <td>{Number(row.final_billing_amount ?? 0).toLocaleString()}</td>
                  <td>{row.version}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {tab === "order" ? (
        <div className="sub-block" style={{ marginTop: 12 }}>
          <div className="tab-panel-toolbar">
            <Link className="btn btn-detail" href={`/orders?caseId=${memoizedCaseId}`}>
              一覧・編集
            </Link>
            <Link className="btn btn-positive" href={`/orders/new?caseId=${memoizedCaseId}`}>
              新規作成
            </Link>
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
              {orders.map((row) => (
                <tr key={row.id}>
                  <td>{row.order_title}</td>
                  <td>{row.order_date}</td>
                  <td>{Number(row.amount_incl_tax).toLocaleString()}</td>
                  <td>{row.version}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {tab === "spec" ? (
        <div className="sub-block" style={{ marginTop: 12 }}>
          <p>この案件の受注に紐づく抜き型・LC仕様の一覧・編集、または新規登録は次の画面へ。</p>
          <div className="tab-panel-toolbar">
            <Link className="btn btn-detail" href={`/specs?caseId=${memoizedCaseId}`}>
              一覧・編集
            </Link>
            <Link className="btn btn-positive" href={`/specs/new?caseId=${memoizedCaseId}`}>
              新規作成
            </Link>
          </div>
        </div>
      ) : null}
    </section>
  );
}
