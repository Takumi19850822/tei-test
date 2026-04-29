"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useAppContext } from "@/app/_components/app-context";
import { clientApi } from "@/lib/client-api";

type OrderRow = { id: string; order_title: string; case_id: string };

function NewSpecInner() {
  const { loginId } = useAppContext();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [orderId, setOrderId] = useState("");
  const [diecutMold, setDiecutMold] = useState("");
  const [diecutMachine, setDiecutMachine] = useState("");
  const [lcMethod, setLcMethod] = useState("");
  const [lcSpec, setLcSpec] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const caseIdFilter = searchParams.get("caseId");

  useEffect(() => {
    void (async () => {
      try {
        const url = caseIdFilter ? `/api/orders?caseId=${caseIdFilter}` : "/api/orders";
        const data = await clientApi<OrderRow[]>(loginId, url);
        setOrders(data);
        const q = searchParams.get("orderId");
        if (q && data.some((o) => o.id === q)) {
          setOrderId(q);
        } else if (data[0]) {
          setOrderId(data[0].id);
        } else {
          setOrderId("");
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "読込失敗");
      }
    })();
  }, [loginId, searchParams, caseIdFilter]);

  async function createDiecut() {
    if (!orderId) return;
    setSaving(true);
    setError("");
    try {
      await clientApi(loginId, "/api/diecut-specs", {
        method: "POST",
        body: JSON.stringify({
          orderId,
          moldNo: diecutMold.trim(),
          machineName: diecutMachine.trim(),
        }),
      });
      router.push(`/specs?orderId=${orderId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "作成失敗");
    } finally {
      setSaving(false);
    }
  }

  async function createLc() {
    if (!orderId) return;
    setSaving(true);
    setError("");
    try {
      await clientApi(loginId, "/api/lc-specs", {
        method: "POST",
        body: JSON.stringify({
          orderId,
          deliveryMethod: lcMethod.trim(),
          specification: lcSpec.trim(),
        }),
      });
      router.push(`/specs?orderId=${orderId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "作成失敗");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="screen">
      <h2 className="screen-title">抜き型/LC仕様　新規作成</h2>
      {caseIdFilter ? (
        <p className="detail-summary">案件で受注を絞り込み中（caseId: {caseIdFilter}）</p>
      ) : null}
      {error ? <div className="error-box">{error}</div> : null}
      <div className="create-bar">
        <Link
          href={orderId ? `/specs?orderId=${orderId}` : "/specs"}
          className="btn btn-detail"
        >
          一覧へ戻る
        </Link>
      </div>
      <div className="detail-form">
        <label>
          受注
          <select value={orderId} onChange={(e) => setOrderId(e.target.value)}>
            <option value="">受注を選択</option>
            {orders.map((row) => (
              <option key={row.id} value={row.id}>
                {row.order_title}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid-two" style={{ marginTop: 16 }}>
        <div className="panel">
          <h3>抜き型仕様を登録</h3>
          <div className="detail-form">
            <label>
              型No
              <input value={diecutMold} onChange={(e) => setDiecutMold(e.target.value)} />
            </label>
            <label>
              機種
              <input value={diecutMachine} onChange={(e) => setDiecutMachine(e.target.value)} />
            </label>
            <button
              type="button"
              className="btn btn-positive"
              disabled={saving || !orderId}
              onClick={() => void createDiecut()}
            >
              抜き型を保存
            </button>
          </div>
        </div>
        <div className="panel">
          <h3>LC仕様を登録</h3>
          <div className="detail-form">
            <label>
              納品方法
              <input value={lcMethod} onChange={(e) => setLcMethod(e.target.value)} />
            </label>
            <label>
              仕様
              <input value={lcSpec} onChange={(e) => setLcSpec(e.target.value)} />
            </label>
            <button
              type="button"
              className="btn btn-positive"
              disabled={saving || !orderId}
              onClick={() => void createLc()}
            >
              LCを保存
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function NewSpecPage() {
  return (
    <Suspense fallback={<section className="screen"><p>読込中...</p></section>}>
      <NewSpecInner />
    </Suspense>
  );
}
