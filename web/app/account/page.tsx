"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAppContext } from "@/app/_components/app-context";
import { clientApi } from "@/lib/client-api";

type MeRow = {
  login_id: string;
  user_name: string;
  version: number;
};

export default function AccountPage() {
  const { loginId, setLoginId } = useAppContext();
  const [row, setRow] = useState<MeRow | null>(null);
  const [editUserName, setEditUserName] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newLoginId, setNewLoginId] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void clientApi("/api/auth/me")
      .then((data) => {
        setRow(data);
        setEditUserName(data.user_name);
        setNewLoginId(data.login_id);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "読込失敗"));
  }, [loginId]);

  async function save() {
    if (!row) return;
    const wantPw = newPassword.trim().length > 0;
    const wantId = newLoginId.trim() !== row.login_id;
    const wantName = editUserName.trim() !== row.user_name;
    if (!wantPw && !wantId && !wantName) {
      setError("氏名・ログインID・パスワードのいずれかを変更してください。");
      return;
    }
    if (!editUserName.trim()) {
      setError("氏名は空にできません。");
      return;
    }
    if (!currentPassword) {
      setError("現在のパスワードを入力してください。");
      return;
    }
    setSaving(true);
    setError("");
    setDone("");
    try {
      const payload: Record<string, unknown> = {
        currentPassword,
        version: row.version,
        userName: editUserName.trim(),
      };
      if (wantPw) payload.newPassword = newPassword.trim();
      if (wantId) payload.newLoginId = newLoginId.trim();

      const updated = await clientApi("/api/auth/me", {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      setRow(updated);
      setEditUserName(updated.user_name);
      setNewLoginId(updated.login_id);
      setNewPassword("");
      setCurrentPassword("");
      if (typeof window !== "undefined") {
        localStorage.setItem("tei_user_name", updated.user_name);
      }
      if (updated.login_id !== loginId) {
        setLoginId(updated.login_id);
      }
      setDone("保存しました。");
    } catch (e) {
      setError(e instanceof Error ? e.message : "保存に失敗しました");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="screen">
      <h2 className="screen-title">アカウント設定</h2>
      <p className="screen-note">
        <strong>氏名・ログインID・パスワード</strong>の変更はここで行えます（変更には現在のパスワードが必要です）。
        他の社員の登録・権限は「社員管理」から行います。
      </p>
      <div className="create-bar">
        <Link href="/cases" className="btn btn-detail">
          案件一覧へ
        </Link>
      </div>
      {error ? <div className="error-box">{error}</div> : null}
      {done ? <div className="detail-summary">{done}</div> : null}
      {row ? (
        <div className="detail-panel">
          <div className="detail-form">
            <label>
              氏名
              <input
                value={editUserName}
                onChange={(e) => setEditUserName(e.target.value)}
                autoComplete="name"
              />
            </label>
            <label>
              現在のログインID（参照）
              <input value={row.login_id} readOnly />
            </label>
            <label>
              新しいログインID（変えない場合はそのまま）
              <input
                value={newLoginId}
                onChange={(e) => setNewLoginId(e.target.value)}
                autoComplete="username"
              />
            </label>
            <label>
              現在のパスワード（必須）
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                autoComplete="current-password"
              />
            </label>
            <label>
              新しいパスワード（変えない場合は空欄）
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
              />
            </label>
            <button type="button" className="btn btn-positive" disabled={saving} onClick={() => void save()}>
              {saving ? "保存中…" : "保存"}
            </button>
          </div>
        </div>
      ) : !error ? (
        <p>読込中…</p>
      ) : null}
    </section>
  );
}
