"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ScreenToolbar } from "@/app/_components/screen-toolbar";
import { useAppContext } from "@/app/_components/app-context";
import { clientApi } from "@/lib/client-api";
import { rowMatchesSearch } from "@/lib/list-search";

type StaffRow = {
  id: string;
  login_id: string;
  user_name: string;
  group_id: string | null;
  email: string | null;
  phone: string | null;
  is_active: boolean;
  version: number;
  created_at?: string;
};

type UserGroupRow = {
  id: string;
  group_name: string;
  version: number;
};

export default function StaffPage() {
  const { loginId } = useAppContext();
  const [rows, setRows] = useState<StaffRow[]>([]);
  const [groups, setGroups] = useState<UserGroupRow[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [listQuery, setListQuery] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");

  const filteredRows = useMemo(
    () =>
      rows.filter((row) =>
        rowMatchesSearch(
          [
            row.user_name,
            row.login_id,
            row.email ?? "",
            row.phone ?? "",
            row.is_active ? "有効" : "無効",
            String(row.version),
          ],
          listQuery,
        ),
      ),
    [rows, listQuery],
  );

  const selected = useMemo(
    () => rows.find((row) => row.id === selectedId) ?? null,
    [rows, selectedId],
  );

  async function loadAll() {
    const [staffData, groupData] = await Promise.all([
      clientApi<StaffRow[]>(loginId, "/api/staff"),
      clientApi<UserGroupRow[]>(loginId, "/api/user-groups"),
    ]);
    setRows(staffData);
    setGroups(groupData);
    if (selectedId && !staffData.some((row) => row.id === selectedId)) {
      setSelectedId("");
    }
  }

  useEffect(() => {
    void loadAll().catch((e) => setError(e instanceof Error ? e.message : "読込失敗"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loginId]);

  async function saveRow() {
    if (!selected) return;
    const payload: Record<string, unknown> = {
      loginId: selected.login_id,
      userName: selected.user_name,
      groupId: selected.group_id ?? "",
      email: selected.email ?? "",
      phone: selected.phone ?? "",
      isActive: selected.is_active,
      version: selected.version,
    };
    if (newPassword.trim()) {
      payload.newPassword = newPassword.trim();
    }
    const updated = await clientApi<StaffRow>(loginId, `/api/staff/${selected.id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
    setRows((prev) => prev.map((row) => (row.id === updated.id ? updated : row)));
    setNewPassword("");
  }

  function patchSelected(patch: Partial<StaffRow>) {
    setRows((prev) =>
      prev.map((row) => (row.id === selectedId ? { ...row, ...patch } : row)),
    );
  }

  return (
    <section className="screen">
      <div className="screen-head">
        <h2 className="screen-title">社員管理</h2>
        {!selected ? (
          <ScreenToolbar searchValue={listQuery} onSearchChange={setListQuery}>
            <Link href="/staff/new" className="btn btn-positive">
              新規作成
            </Link>
          </ScreenToolbar>
        ) : null}
      </div>
      {error ? <div className="error-box">{error}</div> : null}
      <p className="screen-note">
        ログインは ID とパスワードが必要です。社員の新規では初期パスワードの入力が必須です。
      </p>
      {selected ? (
        <div className="detail-panel">
          <div className="create-bar">
            <button className="btn btn-detail" onClick={() => setSelectedId("")}>
              一覧へ戻る
            </button>
          </div>
          <h3>社員詳細</h3>
          <div className="detail-form">
            <label>
              ログインID
              <input
                value={selected.login_id}
                onChange={(e) => patchSelected({ login_id: e.target.value })}
              />
            </label>
            <label>
              氏名
              <input
                value={selected.user_name}
                onChange={(e) => patchSelected({ user_name: e.target.value })}
              />
            </label>
            <label>
              所属グループ
              <select
                value={selected.group_id ?? ""}
                onChange={(e) =>
                  patchSelected({
                    group_id: e.target.value ? e.target.value : null,
                  })
                }
              >
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
              <input
                value={selected.email ?? ""}
                onChange={(e) => patchSelected({ email: e.target.value || null })}
              />
            </label>
            <label>
              電話
              <input
                value={selected.phone ?? ""}
                onChange={(e) => patchSelected({ phone: e.target.value || null })}
              />
            </label>
            <label>
              有効
              <input
                type="checkbox"
                checked={selected.is_active}
                onChange={(e) => patchSelected({ is_active: e.target.checked })}
              />
            </label>
            <label>
              新パスワード（変更する場合のみ入力）
              <input
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </label>
            <button className="btn btn-positive" onClick={() => void saveRow()}>
              保存
            </button>
          </div>
        </div>
      ) : (
        <div className="list-panel">
          <table className="spec-table">
            <thead>
              <tr>
                <th>氏名</th>
                <th>ログインID</th>
                <th>有効</th>
                <th>版</th>
                <th>詳細</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row) => (
                <tr key={row.id}>
                  <td>{row.user_name}</td>
                  <td>{row.login_id}</td>
                  <td>{row.is_active ? "有効" : "無効"}</td>
                  <td>{row.version}</td>
                  <td>
                    <button className="btn btn-detail" onClick={() => setSelectedId(row.id)}>
                      詳細
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
