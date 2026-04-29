"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useAppContext } from "@/app/_components/app-context";
import { clientApi } from "@/lib/client-api";

type CaseRow = { id: string; case_name: string };

function NewSmallOrderInner() {
  const { loginId } = useAppContext();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [cases, setCases] = useState<CaseRow[]>([]);
  const [caseId, setCaseId] = useState("");
  const [itemName, setItemName] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const data = await clientApi("/api/cases");
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
    if (!caseId || !itemName.trim()) return;
    setSaving(true);
    setError("");
    try {
      await clientApi("/api/small-orders", {
        method: "POST",
        body: JSON.stringify({ caseId, itemName: itemName.trim() }),
      });
      router.push(`/small-orders?caseId=${caseId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "作成失敗");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="screen">
      <h2 className="screen-title">小口受注　新規作成</h2>
      {error ? <div className="error-box">{error}</div> : null}
      <div className="create-bar">
        <Link href={caseId ? `/small-orders?caseId=${caseId}` : "/small-orders"} className="btn btn-detail">
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
          品名
          <input value={itemName} onChange={(e) => setItemName(e.target.value)} />
        </label>
        <button type="button" className="btn btn-positive" disabled={saving} onClick={() => void submit()}>
          保存
        </button>
      </div>
    </section>
  );
}

export default function NewSmallOrderPage() {
  return (
    <Suspense fallback={<section className="screen"><p>読込中...</p></section>}>
      <NewSmallOrderInner />
    </Suspense>
  );
}
