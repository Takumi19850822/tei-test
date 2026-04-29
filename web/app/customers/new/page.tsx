"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { clientApi } from "@/lib/client-api";

export default function NewCustomerPage() {
  const router = useRouter();
  const [organizationName, setOrganizationName] = useState("");
  const [branchDepartmentName, setBranchDepartmentName] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactPositionName, setContactPositionName] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (!organizationName.trim()) return;
    if (!branchDepartmentName.trim() || !contactName.trim()) return;
    setSaving(true);
    setError("");
    try {
      await clientApi("/api/customers", {
        method: "POST",
        body: JSON.stringify({
          organizationName: organizationName.trim(),
          branchDepartmentName: branchDepartmentName.trim(),
          contactName: contactName.trim(),
          contactPositionName: contactPositionName.trim() || undefined,
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
          団体名に加え、<strong>拠点の部署名</strong>と<strong>担当者名</strong>を最低1件ずつ登録します（案件の部署・担当プルダウン用の運用前提）。
        </p>
        <label>
          会社名（団体名）
          <input value={organizationName} onChange={(e) => setOrganizationName(e.target.value)} />
        </label>
        <label>
          拠点の部署名
          <input
            value={branchDepartmentName}
            onChange={(e) => setBranchDepartmentName(e.target.value)}
            placeholder="必須"
          />
        </label>
        <label>
          担当者名
          <input
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
            placeholder="必須（顧客担当者の表示名）"
          />
        </label>
        <label>
          役職（任意）
          <input value={contactPositionName} onChange={(e) => setContactPositionName(e.target.value)} />
        </label>
        <button
          type="button"
          className="btn btn-positive"
          disabled={
            saving ||
            !organizationName.trim() ||
            !branchDepartmentName.trim() ||
            !contactName.trim()
          }
          onClick={() => void submit()}
        >
          保存
        </button>
      </div>
    </section>
  );
}
