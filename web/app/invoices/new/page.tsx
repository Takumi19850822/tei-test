"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useAppContext } from "@/app/_components/app-context";
import { clientApi } from "@/lib/client-api";

type OrderRow = { id: string; order_title: string; amount_incl_tax: number };

function NewInvoiceInner() {
  const { loginId } = useAppContext();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [orderId, setOrderId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [amount, setAmount] = useState("0");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const data = await clientApi<OrderRow[]>(loginId, "/api/orders");
        setOrders(data);
        const q = searchParams.get("orderId");
        if (q && data.some((o) => o.id === q)) {
          setOrderId(q);
          const o = data.find((row) => row.id === q);
          if (o) setAmount(String(o.amount_incl_tax));
        } else if (data[0]) {
          setOrderId(data[0].id);
          setAmount(String(data[0].amount_incl_tax));
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "読込失敗");
      }
    })();
  }, [loginId, searchParams]);

  function applyOrder(nextId: string) {
    setOrderId(nextId);
    const o = orders.find((row) => row.id === nextId);
    if (o) setAmount(String(o.amount_incl_tax));
  }

  async function submit() {
    if (!orderId) return;
    setSaving(true);
    setError("");
    try {
      await clientApi(loginId, "/api/invoices", {
        method: "POST",
        body: JSON.stringify({
          orderId,
          dueDate: dueDate || null,
          totalAmount: amount,
        }),
      });
      router.push(orderId ? `/invoices?orderId=${orderId}` : "/invoices");
    } catch (e) {
      setError(e instanceof Error ? e.message : "作成失敗");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="screen">
      <h2 className="screen-title">請求　新規作成</h2>
      {error ? <div className="error-box">{error}</div> : null}
      <div className="create-bar">
        <Link href={orderId ? `/invoices?orderId=${orderId}` : "/invoices"} className="btn btn-detail">
          一覧へ戻る
        </Link>
      </div>
      <div className="detail-form">
        <label>
          受注
          <select
            value={orderId}
            onChange={(e) => {
              applyOrder(e.target.value);
            }}
          >
            <option value="">受注を選択</option>
            {orders.map((row) => (
              <option key={row.id} value={row.id}>
                {row.order_title}
              </option>
            ))}
          </select>
        </label>
        <label>
          入金期日
          <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </label>
        <label>
          請求額
          <input value={amount} onChange={(e) => setAmount(e.target.value)} />
        </label>
        <button type="button" className="btn btn-positive" disabled={saving} onClick={() => void submit()}>
          保存
        </button>
      </div>
    </section>
  );
}

export default function NewInvoicePage() {
  return (
    <Suspense fallback={<section className="screen"><p>読込中...</p></section>}>
      <NewInvoiceInner />
    </Suspense>
  );
}
