"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAppContext } from "@/app/_components/app-context";

const USER_NAME_KEY = "tei_user_name";

export default function LoginPage() {
  const { setLoginId } = useAppContext();
  const router = useRouter();
  const [input, setInput] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit() {
    const loginId = input.trim();
    if (!loginId) {
      setError("ログインIDを入力してください。");
      return;
    }
    if (!password) {
      setError("パスワードを入力してください。");
      return;
    }
    setPending(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ loginId, password }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.message ?? json.details ?? "ログインに失敗しました");
      }
      const id = json.data.loginId as string;
      const name = String(json.data.userName ?? "");
      if (typeof window !== "undefined" && name) {
        localStorage.setItem(USER_NAME_KEY, name);
      }
      setLoginId(id);
      router.replace("/cases");
    } catch (e) {
      setError(e instanceof Error ? e.message : "ログインに失敗しました");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="screen login-screen">
      <h2 className="screen-title">ログイン</h2>
      {error ? <div className="error-box">{error}</div> : null}
      <div className="login-card">
        <label className="login-field">
          ログインID
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void submit();
            }}
            autoComplete="username"
            placeholder="ログインID"
          />
        </label>
        <label className="login-field">
          パスワード
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void submit();
            }}
            autoComplete="current-password"
          />
        </label>
        <button type="button" className="btn btn-positive login-submit" disabled={pending} onClick={() => void submit()}>
          {pending ? "確認中…" : "ログイン"}
        </button>
      </div>
    </section>
  );
}
