"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { clientApi } from "@/lib/client-api";
import { formatCustomerLabel } from "@/lib/customer-label";

type CustomerHit = {
  id: string;
  organization_name: string;
  department_name: string | null;
};

type BranchRow = {
  id: string;
  department_name: string | null;
  prefecture: string | null;
  city: string | null;
  address_line: string | null;
};

type ContactRow = {
  id: string;
  company_name: string | null;
  position_name: string | null;
};

export type CaseCustomerPick = CustomerHit;

/** 案件フォーム3列目：顧客名のマスタ検索入力 */
export function CaseCustomerNameField({
  value,
  onChange,
  onPick,
  linkedCustomerId,
}: {
  value: string;
  onChange: (v: string) => void;
  onPick: (c: CustomerHit) => void;
  linkedCustomerId: string | null;
}) {
  const [hits, setHits] = useState<CustomerHit[]>([]);
  const [open, setOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const wrapRef = useRef<HTMLDivElement>(null);

  const runSearch = useCallback(async (q: string) => {
    const t = q.trim();
    if (t.length < 1) {
      setHits([]);
      setOpen(false);
      return;
    }
    setSearching(true);
    try {
      const data = (await clientApi(
        `/api/customers/search?q=${encodeURIComponent(t)}`,
      )) as CustomerHit[];
      setHits(Array.isArray(data) ? data : []);
      setOpen(true);
    } catch {
      setHits([]);
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    function onDocDown(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocDown);
    return () => document.removeEventListener("mousedown", onDocDown);
  }, []);

  return (
    <div ref={wrapRef} className="customer-search-wrap">
      <input
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          if (debounceRef.current) clearTimeout(debounceRef.current);
          debounceRef.current = setTimeout(() => void runSearch(e.target.value), 280);
        }}
        onFocus={() => {
          if (value.trim().length > 0) void runSearch(value);
        }}
        placeholder="団体名・部署で検索"
        autoComplete="off"
      />
      {linkedCustomerId ? (
        <p className="customer-search-hint">顧客マスタと紐付け済み</p>
      ) : (
        <p className="customer-search-hint">{searching ? "検索中…" : "候補から選択すると拠点・担当をプルダウンで選べます。"}</p>
      )}
      {open && hits.length > 0 ? (
        <ul className="customer-search-dropdown" role="listbox">
          {hits.map((c) => (
            <li key={c.id} role="option">
              <button
                type="button"
                onClick={() => {
                  onPick(c);
                  setOpen(false);
                  setHits([]);
                }}
              >
                <span className="org">{c.organization_name}</span>
                {c.department_name ? (
                  <span className="dept"> / {c.department_name}</span>
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function branchLabel(b: BranchRow): string {
  const dept = b.department_name?.trim();
  const parts = [b.prefecture, b.city, b.address_line].filter(Boolean);
  const addr = parts.length ? parts.join(" ") : `${b.id.slice(0, 8)}…`;
  return dept ? `${dept} / ${addr}` : addr;
}

/** 拠点・担当（マスタ選択時はプルダウン、未紐付け時はUUIDテキスト） */
export function CaseCustomerRelations({
  customerId,
  branchId,
  contactId,
  onBranchChange,
  onContactChange,
}: {
  customerId: string | null;
  branchId: string | null;
  contactId: string | null;
  onBranchChange: (v: string | null) => void;
  onContactChange: (v: string | null) => void;
}) {
  const [branches, setBranches] = useState<BranchRow[]>([]);
  const [contacts, setContacts] = useState<ContactRow[]>([]);
  const [manualUuid, setManualUuid] = useState(false);

  useEffect(() => {
    if (!customerId) {
      setBranches([]);
      setManualUuid(false);
    }
  }, [customerId]);

  useEffect(() => {
    if (!customerId) {
      setBranches([]);
      return;
    }
    void (async () => {
      try {
        const b = (await clientApi(`/api/customer-branches?customerId=${customerId}`)) as BranchRow[];
        setBranches(Array.isArray(b) ? b : []);
      } catch {
        setBranches([]);
      }
    })();
  }, [customerId]);

  useEffect(() => {
    if (!branchId) {
      setContacts([]);
      return;
    }
    void (async () => {
      try {
        const c = (await clientApi(`/api/customer-contacts?customerBranchId=${branchId}`)) as ContactRow[];
        setContacts(Array.isArray(c) ? c : []);
      } catch {
        setContacts([]);
      }
    })();
  }, [branchId]);

  if (!customerId) {
    return (
      <>
        <label className="case-field-std">
          顧客拠点ID（customer_branches.id）
          <input
            value={branchId ?? ""}
            onChange={(e) => onBranchChange(e.target.value.trim() || null)}
            placeholder="UUID（任意・マスタ未選択時）"
          />
        </label>
        <label className="case-field-std">
          顧客担当者ID（customer_contacts.id）
          <input
            value={contactId ?? ""}
            onChange={(e) => onContactChange(e.target.value.trim() || null)}
            placeholder="UUID（任意・マスタ未選択時）"
          />
        </label>
      </>
    );
  }

  if (manualUuid) {
    return (
      <>
        <label className="case-field-std">
          顧客拠点ID（customer_branches.id）
          <input
            value={branchId ?? ""}
            onChange={(e) => onBranchChange(e.target.value.trim() || null)}
            placeholder="UUID"
          />
        </label>
        <label className="case-field-std">
          顧客担当者ID（customer_contacts.id）
          <input
            value={contactId ?? ""}
            onChange={(e) => onContactChange(e.target.value.trim() || null)}
            placeholder="UUID"
          />
        </label>
        <button type="button" className="btn btn-detail btn-sm" onClick={() => setManualUuid(false)}>
          プルダウン選択に戻す
        </button>
      </>
    );
  }

  return (
    <>
      <label className="case-field-std">
        顧客拠点
        <select
          value={branchId ?? ""}
          onChange={(e) => {
            const v = e.target.value.trim() || null;
            onBranchChange(v);
            onContactChange(null);
          }}
        >
          <option value="">（未選択）</option>
          {branches.map((b) => (
            <option key={b.id} value={b.id}>
              {branchLabel(b)}
            </option>
          ))}
        </select>
      </label>
      <label className="case-field-std">
        顧客担当者
        <select
          value={contactId ?? ""}
          onChange={(e) => onContactChange(e.target.value.trim() || null)}
          disabled={!branchId}
        >
          <option value="">（未選択）</option>
          {contacts.map((c) => (
            <option key={c.id} value={c.id}>
              {[c.company_name, c.position_name].filter(Boolean).join(" · ") || `${c.id.slice(0, 8)}…`}
            </option>
          ))}
        </select>
      </label>
      <div className="case-field-std" style={{ alignItems: "start" }}>
        <span style={{ paddingTop: 6 }} />
        <button type="button" className="btn btn-detail btn-sm" onClick={() => setManualUuid(true)}>
          拠点・担当をUUIDで直接入力する
        </button>
      </div>
    </>
  );
}

export function applyCustomerPick(
  c: CustomerHit,
): { customerName: string; customerId: string } {
  return {
    customerName: formatCustomerLabel(c.organization_name, c.department_name),
    customerId: c.id,
  };
}
