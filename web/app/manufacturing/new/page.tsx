"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useAppContext } from "@/app/_components/app-context";
import { clientApi } from "@/lib/client-api";

type OrderRow = { id: string; order_title: string; case_id: string };

function NewManufacturingInner() {
  const { loginId } = useAppContext();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [orderId, setOrderId] = useState("");
  const [moldNo, setMoldNo] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const data = await clientApi("/api/orders");
        setOrders(data);
        const q = searchParams.get("orderId");
        if (q && data.some((o) => o.id === q)) {
          setOrderId(q);
        } else if (data[0]) {
          setOrderId(data[0].id);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "読込失敗");
      }
    })();
  }, [loginId, searchParams]);

  async function submit() {
    if (!orderId) return;
    setSaving(true);
    setError("");
    try {
      await clientApi("/api/manufacturing-jobs", {
        method: "POST",
        body: JSON.stringify({ orderId, moldNo: moldNo.trim() }),
      });
      router.push(orderId ? `/manufacturing?orderId=${orderId}` : "/manufacturing");
    } catch (e) {
      setError(e instanceof Error ? e.message : "作成失敗");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="screen">
      <h2 className="screen-title">型工務　新規作成</h2>
      {error ? <div className="error-box">{error}</div> : null}
      <div className="create-bar">
        <Link href={orderId ? `/manufacturing?orderId=${orderId}` : "/manufacturing"} className="btn btn-detail">
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
        <label>
          型No（任意）
          <input value={moldNo} onChange={(e) => setMoldNo(e.target.value)} />
        </label>
        <button type="button" className="btn btn-positive" disabled={saving} onClick={() => void submit()}>
          保存
        </button>
      </div>
    </section>
  );
}

export default function NewManufacturingPage() {
  return (
    <Suspense fallback={<section className="screen"><p>読込中...</p></section>}>
      <NewManufacturingInner />
    </Suspense>
  );
}
