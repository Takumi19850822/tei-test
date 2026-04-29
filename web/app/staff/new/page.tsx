"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppContext } from "@/app/_components/app-context";
import { clientApi } from "@/lib/client-api";

type UserGroupRow = {
  id: string;
  group_name: string;
  version: number;
};

export default function NewStaffPage() {
  const { loginId } = useAppContext();
  const router = useRouter();
  const [groups, setGroups] = useState<UserGroupRow[]>([]);
  const [loginIdField, setLoginIdField] = useState("");
  const [userName, setUserName] = useState("");
  const [groupId, setGroupId] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [initialPassword, setInitialPassword] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void clientApi("/api/user-groups")
      .then(setGroups)
      .catch((e) => setError(e instanceof Error ? e.message : "グループ読込失敗"));
  }, [loginId]);

  async function submit() {
    if (!loginIdField.trim() || !userName.trim() || !initialPassword.trim()) return;
    setSaving(true);
    setError("");
    try {
      await clientApi("/api/staff", {
        method: "POST",
        body: JSON.stringify({
          loginId: loginIdField.trim(),
          userName: userName.trim(),
          groupId: groupId.trim() || undefined,
          email: email.trim(),
          phone: phone.trim(),
          isActive,
          initialPassword: initialPassword.trim(),
        }),
      });
      router.push("/staff");
    } catch (e) {
      setError(e instanceof Error ? e.message : "作成失敗");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="screen">
      <h2 className="screen-title">社員管理　新規作成</h2>
      {error ? <div className="error-box">{error}</div> : null}
      <div className="create-bar">
        <Link href="/staff" className="btn btn-detail">
          一覧へ戻る
        </Link>
      </div>
      <div className="detail-form">
        <label>
          ログインID
          <input value={loginIdField} onChange={(e) => setLoginIdField(e.target.value)} />
        </label>
        <label>
          氏名
          <input value={userName} onChange={(e) => setUserName(e.target.value)} />
        </label>
        <label>
          所属グループ
          <select value={groupId} onChange={(e) => setGroupId(e.target.value)}>
            <option value="">（未設定）</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.group_name}
              </option>
            ))}
          </select>
        </label>
        <label>
          メール
          <input value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label>
          電話
          <input value={phone} onChange={(e) => setPhone(e.target.value)} />
        </label>
        <label>
          初期パスワード（必須・ログイン時に使用）
          <input
            type="password"
            autoComplete="new-password"
            value={initialPassword}
            onChange={(e) => setInitialPassword(e.target.value)}
          />
        </label>
        <label>
          有効
          <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
        </label>
        <button type="button" className="btn btn-positive" disabled={saving} onClick={() => void submit()}>
          保存
        </button>
      </div>
    </section>
  );
}
