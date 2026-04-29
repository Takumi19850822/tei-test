"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode, useEffect, useRef, useState } from "react";
import { AppContext } from "@/app/_components/app-context";

const MENU_ITEMS = [
  { href: "/cases", label: "案件管理" },
  { href: "/customers", label: "顧客管理" },
  { href: "/estimates", label: "見積" },
  { href: "/orders", label: "受注" },
  { href: "/small-orders", label: "小口受注" },
  { href: "/manufacturing", label: "型工務" },
  { href: "/specs", label: "抜き型/LC仕様" },
  { href: "/invoices", label: "請求" },
  { href: "/masters", label: "マスタ管理" },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(true);
  const [loginId, setLoginId] = useState("owner");
  const lastFRef = useRef<number>(0);

  useEffect(() => {
    const saved = localStorage.getItem("tei_login_id");
    if (saved) setLoginId(saved);
  }, []);

  useEffect(() => {
    localStorage.setItem("tei_login_id", loginId);
  }, [loginId]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key.toLowerCase() !== "f") return;
      const now = Date.now();
      if (now - lastFRef.current < 500) {
        setMenuOpen((prev) => !prev);
      }
      lastFRef.current = now;
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

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
                className={`menu-link ${pathname === item.href ? "active" : ""}`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>
        <div className="content-wrap">
          <header className="topbar">
            <div className="topbar-title">本番レビュー環境</div>
            <label className="login-control">
              login_id
              <input
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                placeholder="owner"
              />
            </label>
          </header>
          <main className="page-container">{children}</main>
        </div>
      </div>
    </AppContext.Provider>
  );
}
