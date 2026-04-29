"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect, useRef, useState } from "react";
import { AppContext } from "@/app/_components/app-context";

const USER_NAME_KEY = "tei_user_name";

const MENU_ITEMS = [
  { href: "/cases", label: "案件管理" },
  { href: "/customers", label: "顧客管理" },
  { href: "/delivery-destinations", label: "納品先管理" },
  { href: "/estimates", label: "見積" },
  { href: "/orders", label: "受注" },
  { href: "/small-orders", label: "小口受注" },
  { href: "/manufacturing", label: "型工務" },
  { href: "/specs", label: "抜き型/LC仕様" },
  { href: "/invoices", label: "請求" },
  { href: "/masters", label: "マスタ管理" },
  { href: "/staff", label: "社員管理" },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(true);
  const [loginId, setLoginIdState] = useState("");
  const [userName, setUserName] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const lastFRef = useRef<number>(0);

  function setLoginId(value: string) {
    setLoginIdState(value);
    if (typeof window !== "undefined") {
      if (value.trim()) {
        localStorage.setItem("tei_login_id", value.trim());
      } else {
        localStorage.removeItem("tei_login_id");
        localStorage.removeItem(USER_NAME_KEY);
      }
    }
  }

  useEffect(() => {
    const saved = localStorage.getItem("tei_login_id") ?? "";
    const savedName = localStorage.getItem(USER_NAME_KEY) ?? "";
    setLoginIdState(saved);
    setUserName(savedName);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated || !loginId.trim()) {
      setUserName("");
      return;
    }
    setUserName(localStorage.getItem(USER_NAME_KEY) ?? "");
  }, [hydrated, loginId]);

  useEffect(() => {
    if (!hydrated) return;
    if (!loginId.trim() && pathname !== "/login") {
      router.replace("/login");
    }
  }, [hydrated, loginId, pathname, router]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const key = event.key;
      if (typeof key !== "string" || key.toLowerCase() !== "f") return;
      const now = Date.now();
      if (now - lastFRef.current < 500) {
        setMenuOpen((prev) => !prev);
      }
      lastFRef.current = now;
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  if (!hydrated) {
    return (
      <AppContext.Provider value={{ loginId: "", setLoginId }}>
        <div className="shell shell--hydrating">
          <p className="shell-hydrating-msg">読込中…</p>
        </div>
      </AppContext.Provider>
    );
  }

  const onLoginPage = pathname === "/login";

  if (onLoginPage) {
    return (
      <AppContext.Provider value={{ loginId, setLoginId }}>
        <div className="shell shell--login-only">
          <main className="page-container page-container--login">{children}</main>
        </div>
      </AppContext.Provider>
    );
  }

  return (
    <AppContext.Provider value={{ loginId, setLoginId }}>
      <div className="shell">
        <aside className={`sidebar ${menuOpen ? "open" : "closed"}`}>
          <h1 className="sidebar-title">テイ製作所</h1>
          <p className="sidebar-tip">Fキー2回でメニュー開閉</p>
          <nav className="menu">
            {MENU_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`menu-link ${pathname === item.href || pathname.startsWith(`${item.href}/`) ? "active" : ""}`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>
        <div className="content-wrap">
          <header className="topbar">
            <div className="topbar-title">本番レビュー環境</div>
            <div className="topbar-user">
              <Link href="/account" className="topbar-login-link">
                アカウント設定
              </Link>
              <span className="topbar-user-text" title={loginId}>
                {userName ? (
                  <>
                    {userName}
                    <span className="topbar-user-id">（{loginId}）</span>
                  </>
                ) : (
                  <span>{loginId}</span>
                )}
              </span>
              <Link
                href="/login"
                className="topbar-login-link"
                onClick={(e) => {
                  e.preventDefault();
                  void fetch("/api/auth/logout", { method: "POST", credentials: "include" }).finally(() => {
                    setLoginId("");
                    window.location.href = "/login";
                  });
                }}
              >
                ログアウト
              </Link>
            </div>
          </header>
          <main className="page-container">{children}</main>
        </div>
      </div>
    </AppContext.Provider>
  );
}
