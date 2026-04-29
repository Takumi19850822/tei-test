"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useAppContext } from "@/app/_components/app-context";
import { clientApi } from "@/lib/client-api";

type CaseRow = { id: string; case_name: string };

function NewOrderInner() {
  const { loginId } = useAppContext();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [cases, setCases] = useState<CaseRow[]>([]);
  const [caseId, setCaseId] = useState("");
  const [title, setTitle] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const data = await clientApi<CaseRow[]>(loginId, "/api/cases");
        setCases(data);
        const q = searchParams.get("caseId");
        if (q && data.some((c) => c.id === q)) {
          setCaseId(q);
        } else if (data[0]) {
          setCaseId(data[0].id);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "読込失敗");
      }
    })();
  }, [loginId, searchParams]);

  async function submit() {
    if (!caseId || !title.trim()) return;
    setSaving(true);
    setError("");
    try {
      await clientApi(loginId, "/api/orders", {
        method: "POST",
        body: JSON.stringify({
          caseId,
          orderTitle: title.trim(),
          orderDate: new Date().toISOString().slice(0, 10),
          amountExclTax: 0,
          amountInclTax: 0,
        }),
      });
      router.push(`/orders?caseId=${caseId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "作成失敗");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="screen">
      <h2 className="screen-title">受注　新規作成</h2>
      {error ? <div className="error-box">{error}</div> : null}
      <div className="create-bar">
        <Link href={caseId ? `/orders?caseId=${caseId}` : "/orders"} className="btn btn-detail">
          一覧へ戻る
        </Link>
      </div>
      <div className="detail-form">
        <label>
          案件
          <select value={caseId} onChange={(e) => setCaseId(e.target.value)}>
            <option value="">案件を選択</option>
            {cases.map((row) => (
              <option key={row.id} value={row.id}>
                {row.case_name}
              </option>
            ))}
          </select>
        </label>
        <label>
          受注件名
          <input value={title} onChange={(e) => setTitle(e.target.value)} />
        </label>
        <button type="button" className="btn btn-positive" disabled={saving} onClick={() => void submit()}>
          保存
        </button>
      </div>
    </section>
  );
}

export default function NewOrderPage() {
  return (
    <Suspense fallback={<section className="screen"><p>読込中...</p></section>}>
      <NewOrderInner />
    </Suspense>
  );
}
