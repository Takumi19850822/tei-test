"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { clientApi } from "@/lib/client-api";

export default function NewCustomerPage() {
  const router = useRouter();
  const [organizationName, setOrganizationName] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (!organizationName.trim()) return;
    setSaving(true);
    setError("");
    try {
      await clientApi("/api/customers", {
        method: "POST",
        body: JSON.stringify({
          organizationName: organizationName.trim(),
        }),
      });
      router.push("/customers");
    } catch (e) {
      setError(e instanceof Error ? e.message : "作成失敗");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="screen">
      <h2 className="screen-title">顧客管理　新規作成</h2>
      {error ? <div className="error-box">{error}</div> : null}
      <div className="create-bar">
        <Link href="/customers" className="btn btn-detail">
          一覧へ戻る
        </Link>
      </div>
      <div className="detail-form">
        <p className="detail-summary">
          会社名のみ登録します。顧客部署は「拠点」タブから拠点を追加するときに入力してください。
        </p>
        <label>
          会社名（団体名）
          <input value={organizationName} onChange={(e) => setOrganizationName(e.target.value)} />
        </label>
        <button type="button" className="btn btn-positive" disabled={saving} onClick={() => void submit()}>
          保存
        </button>
      </div>
    </section>
  );
}
