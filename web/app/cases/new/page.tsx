"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { applyCustomerPick, CaseCustomerRow } from "@/app/_components/case-customer-fields";
import { useAppContext } from "@/app/_components/app-context";
import { clientApi } from "@/lib/client-api";

type UserOption = {
  id: string;
  user_name: string;
  login_id: string;
  is_active: boolean;
};

type CaseTypeRow = { id: string; type_name: string };

export default function NewCasePage() {
  const { loginId } = useAppContext();
  const router = useRouter();
  const [caseName, setCaseName] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [salesUserId, setSalesUserId] = useState("");
  const [caseTypeId, setCaseTypeId] = useState("");
  const [status, setStatus] = useState("draft");
  const [customerBranchId, setCustomerBranchId] = useState<string | null>(null);
  const [customerContactId, setCustomerContactId] = useState<string | null>(null);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [caseTypes, setCaseTypes] = useState<CaseTypeRow[]>([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const [u, t] = await Promise.all([
          clientApi("/api/users"),
          clientApi("/api/case-types"),
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
      const created = (await clientApi("/api/cases", {
        method: "POST",
        body: JSON.stringify({
          caseName: caseName,
          customerName: customerName,
          status,
          memo: "",
          salesUserId: salesUserId || undefined,
          caseTypeId: caseTypeId || undefined,
          customerId: customerId || undefined,
          customerBranchId: customerBranchId?.trim() || undefined,
          customerContactId: customerContactId?.trim() || undefined,
        }),
      })) as { id: string };
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
      <div className="detail-form detail-form--case">
        <label className="case-field-full">
          案件名
          <input value={caseName} onChange={(e) => setCaseName(e.target.value)} />
        </label>
        <div className="case-form-row3 case-form-row3--case-meta">
          <label className="case-field-std">
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
          <label className="case-field-std">
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
          <label className="case-field-std">
            状態
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="draft">下書き</option>
              <option value="active">アクティブ</option>
              <option value="closed">終了</option>
            </select>
          </label>
        </div>
        <CaseCustomerRow
          customerName={customerName}
          onCustomerNameChange={(v) => {
            setCustomerName(v);
            if (v.trim() === "") {
              setCustomerId(null);
              setCustomerBranchId(null);
              setCustomerContactId(null);
            }
          }}
          onCustomerPick={(c) => {
            const p = applyCustomerPick(c);
            setCustomerName(p.customerName);
            setCustomerId(p.customerId);
            setCustomerBranchId(null);
            setCustomerContactId(null);
          }}
          customerId={customerId}
          branchId={customerBranchId}
          contactId={customerContactId}
          onBranchChange={(v) => {
            setCustomerBranchId(v);
            setCustomerContactId(null);
          }}
          onContactChange={setCustomerContactId}
        />
        <div className="case-form-save-row">
          <button type="button" className="btn btn-positive" disabled={saving} onClick={() => void submit()}>
            保存
          </button>
        </div>
      </div>
    </section>
  );
}
