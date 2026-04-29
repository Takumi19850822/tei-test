"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAppContext } from "@/app/_components/app-context";
import { clientApi } from "@/lib/client-api";

export default function NewTaxRatePage() {
  const { loginId } = useAppContext();
  const router = useRouter();
  const [taxName, setTaxName] = useState("");
  const [rate, setRate] = useState("10");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (!taxName.trim()) return;
    setSaving(true);
    setError("");
    try {
      await clientApi(loginId, "/api/tax-rates", {
        method: "POST",
        body: JSON.stringify({
          taxName: taxName.trim(),
          rate,
          roundingMethod: 2,
          taxationType: "taxable",
        }),
      });
      router.push("/masters");
    } catch (e) {
      setError(e instanceof Error ? e.message : "作成失敗");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="screen">
      <h2 className="screen-title">マスタ管理　税率　新規作成</h2>
      {error ? <div className="error-box">{error}</div> : null}
      <div className="create-bar">
        <Link href="/masters" className="btn btn-detail">
          一覧へ戻る
        </Link>
      </div>
      <div className="detail-form">
        <label>
          税率名
          <input value={taxName} onChange={(e) => setTaxName(e.target.value)} />
        </label>
        <label>
          税率（%）
          <input value={rate} onChange={(e) => setRate(e.target.value)} />
        </label>
        <button type="button" className="btn btn-positive" disabled={saving} onClick={() => void submit()}>
          保存
        </button>
      </div>
    </section>
  );
}
