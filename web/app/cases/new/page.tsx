"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAppContext } from "@/app/_components/app-context";
import { clientApi } from "@/lib/client-api";

type UserOption = {
  id: string;
  user_name: string;
  login_id: string;
  is_active: boolean;
};

type CaseTypeRow = { id: string; type_name: string };

type CaseRow = { id: string };

export default function NewCasePage() {
  const { loginId } = useAppContext();
  const router = useRouter();
  const [caseName, setCaseName] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [salesUserId, setSalesUserId] = useState("");
  const [caseTypeId, setCaseTypeId] = useState("");
  const [customerBranchId, setCustomerBranchId] = useState("");
  const [customerContactId, setCustomerContactId] = useState("");
  const [users, setUsers] = useState<UserOption[]>([]);
  const [caseTypes, setCaseTypes] = useState<CaseTypeRow[]>([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

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

  async function submit() {
    if (!caseName.trim() || !customerName.trim()) return;
    setSaving(true);
    setError("");
    try {
      const created = await clientApi<CaseRow>(loginId, "/api/cases", {
        method: "POST",
        body: JSON.stringify({
          caseName: caseName,
          customerName: customerName,
          status: "draft",
          memo: "",
          salesUserId: salesUserId || undefined,
          caseTypeId: caseTypeId || undefined,
          customerBranchId: customerBranchId.trim() || undefined,
          customerContactId: customerContactId.trim() || undefined,
        }),
      });
      router.push(`/cases/${created.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "作成失敗");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="screen">
      <h2 className="screen-title">案件管理　新規作成</h2>
      {error ? <div className="error-box">{error}</div> : null}
      <div className="create-bar">
        <Link href="/cases" className="btn btn-detail">
          一覧へ戻る
        </Link>
      </div>
      <div className="detail-form">
        <label>
          案件名
          <input value={caseName} onChange={(e) => setCaseName(e.target.value)} />
        </label>
        <label>
          顧客名
          <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
        </label>
        <label>
          営業担当
          <select value={salesUserId} onChange={(e) => setSalesUserId(e.target.value)}>
            <option value="">（ログインユーザを既定にする）</option>
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
          <select value={caseTypeId} onChange={(e) => setCaseTypeId(e.target.value)}>
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
            value={customerBranchId}
            onChange={(e) => setCustomerBranchId(e.target.value)}
            placeholder="UUID（任意）"
          />
        </label>
        <label>
          顧客担当者ID（customer_contacts.id）
          <input
            value={customerContactId}
            onChange={(e) => setCustomerContactId(e.target.value)}
            placeholder="UUID（任意）"
          />
        </label>
        <button className="btn btn-positive" disabled={saving} onClick={() => void submit()}>
          保存
        </button>
      </div>
    </section>
  );
}
