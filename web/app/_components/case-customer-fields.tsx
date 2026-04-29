"use client";

import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { clientApi } from "@/lib/client-api";

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

/** 案件フォーム：顧客名のマスタ検索入力 */
export function CaseCustomerNameField({
  value,
  onChange,
  onPick,
  onSearchingChange,
}: {
  value: string;
  onChange: (v: string) => void;
  onPick: (c: CustomerHit) => void;
  /** 候補一覧の上の注釈行に「検索中…」を出すため */
  onSearchingChange?: (searching: boolean) => void;
}) {
  const listboxId = useId();
  const [hits, setHits] = useState<CustomerHit[]>([]);
  const hitsRef = useRef<CustomerHit[]>([]);
  const [open, setOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const activeIdxRef = useRef(-1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    hitsRef.current = hits;
  }, [hits]);
  useEffect(() => {
    activeIdxRef.current = activeIdx;
  }, [activeIdx]);

  const pickAt = useCallback(
    (i: number) => {
      const h = hitsRef.current;
      const c = h[i];
      if (!c) return;
      onPick(c);
      setOpen(false);
      setHits([]);
      setActiveIdx(-1);
    },
    [onPick],
  );

  const runSearch = useCallback(async (q: string) => {
    const t = q.trim();
    if (t.length < 1) {
      setHits([]);
      setOpen(false);
      setActiveIdx(-1);
      return;
    }
    setSearching(true);
    try {
      const data = (await clientApi(
        `/api/customers/search?q=${encodeURIComponent(t)}`,
      )) as CustomerHit[];
      const next = Array.isArray(data) ? data : [];
      setHits(next);
      setActiveIdx(next.length > 0 ? 0 : -1);
      setOpen(true);
    } catch {
      setHits([]);
      setActiveIdx(-1);
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

  useEffect(() => {
    onSearchingChange?.(searching);
  }, [searching, onSearchingChange]);

  return (
    <div ref={wrapRef} className="customer-search-wrap">
      <input
        value={value}
        role="combobox"
        aria-expanded={open && hits.length > 0}
        aria-controls={listboxId}
        aria-autocomplete="list"
        aria-activedescendant={
          open && hits.length > 0 && activeIdx >= 0
            ? `case-cust-opt-${activeIdx}`
            : undefined
        }
        onChange={(e) => {
          onChange(e.target.value);
          if (debounceRef.current) clearTimeout(debounceRef.current);
          debounceRef.current = setTimeout(() => void runSearch(e.target.value), 280);
        }}
        onFocus={() => {
          if (value.trim().length > 0) void runSearch(value);
        }}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            if (open) {
              e.preventDefault();
              setOpen(false);
              setHits([]);
              setActiveIdx(-1);
            }
            return;
          }
          if (!open || hits.length === 0) return;
          const n = hitsRef.current.length;
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setActiveIdx((i) => {
              const cur = i < 0 ? -1 : i;
              return Math.min(n - 1, cur + 1);
            });
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActiveIdx((i) => Math.max(0, i < 0 ? 0 : i - 1));
          } else if (e.key === "Enter") {
            e.preventDefault();
            const i = activeIdxRef.current;
            const idx = i >= 0 && i < n ? i : 0;
            pickAt(idx);
          }
        }}
        placeholder="団体名・部署で検索"
        autoComplete="off"
      />
      {open && hits.length > 0 ? (
        <ul
          id={listboxId}
          className="customer-search-dropdown"
          role="listbox"
          aria-label="顧客候補"
        >
          {hits.map((c, idx) => (
            <li key={c.id} role="presentation">
              <button
                id={`case-cust-opt-${idx}`}
                type="button"
                role="option"
                aria-selected={activeIdx === idx}
                className={activeIdx === idx ? "is-active" : undefined}
                onMouseEnter={() => setActiveIdx(idx)}
                onClick={() => pickAt(idx)}
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

function disabledSelectHint(text: string): ReactNode {
  return (
    <select className="case-select-disabled" disabled value="">
      <option value="">{text}</option>
    </select>
  );
}

/** 顧客名・拠点・担当者を1行に並べる（案件フォーム専用） */
export function CaseCustomerRow({
  customerName,
  onCustomerNameChange,
  onCustomerPick,
  customerId,
  branchId,
  contactId,
  onBranchChange,
  onContactChange,
}: {
  customerName: string;
  onCustomerNameChange: (v: string) => void;
  onCustomerPick: (c: CustomerHit) => void;
  customerId: string | null;
  branchId: string | null;
  contactId: string | null;
  onBranchChange: (v: string | null) => void;
  onContactChange: (v: string | null) => void;
}) {
  const [branches, setBranches] = useState<BranchRow[]>([]);
  const [contacts, setContacts] = useState<ContactRow[]>([]);
  const [customerNameSearching, setCustomerNameSearching] = useState(false);
  const onBranchChangeRef = useRef(onBranchChange);
  const onContactChangeRef = useRef(onContactChange);
  useEffect(() => {
    onBranchChangeRef.current = onBranchChange;
    onContactChangeRef.current = onContactChange;
  });

  useEffect(() => {
    if (!customerId) {
      queueMicrotask(() => setBranches([]));
      return;
    }
    const ac = new AbortController();
    void (async () => {
      try {
        const b = (await clientApi(`/api/customer-branches?customerId=${customerId}`)) as BranchRow[];
        if (ac.signal.aborted) return;
        setBranches(Array.isArray(b) ? b : []);
      } catch {
        if (!ac.signal.aborted) setBranches([]);
      }
    })();
    return () => ac.abort();
  }, [customerId]);

  useEffect(() => {
    if (!branchId) {
      queueMicrotask(() => setContacts([]));
      return;
    }
    const ac = new AbortController();
    void (async () => {
      try {
        const c = (await clientApi(
          `/api/customer-contacts?customerBranchId=${branchId}`,
        )) as ContactRow[];
        if (ac.signal.aborted) return;
        setContacts(Array.isArray(c) ? c : []);
      } catch {
        if (!ac.signal.aborted) setContacts([]);
      }
    })();
    return () => ac.abort();
  }, [branchId]);

  useEffect(() => {
    if (!customerId || branches.length !== 1) return;
    const only = branches[0]!;
    if (branchId === only.id) return;
    onBranchChangeRef.current(only.id);
  }, [customerId, branches, branchId]);

  useEffect(() => {
    if (!branchId || contacts.length !== 1) return;
    const only = contacts[0]!;
    if (contactId === only.id) return;
    onContactChangeRef.current(only.id);
  }, [branchId, contacts, contactId]);

  let branchCell: ReactNode;
  let contactCell: ReactNode;

  if (!customerId) {
    branchCell = (
      <label className="case-field-std">
        部署
        {disabledSelectHint("顧客名をマスタから選択してください")}
      </label>
    );
    contactCell = (
      <label className="case-field-std">
        顧客担当者名
        {disabledSelectHint("顧客名をマスタから選択してください")}
      </label>
    );
  } else if (branches.length === 0) {
    branchCell = (
      <label className="case-field-std">
        部署
        {disabledSelectHint("拠点が未登録です。顧客マスタで拠点を追加してください")}
      </label>
    );
    contactCell = (
      <label className="case-field-std">
        顧客担当者名
        {disabledSelectHint("部署を選択できるようにしてから選んでください")}
      </label>
    );
  } else {
    branchCell = (
      <label className="case-field-std">
        部署
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
    );
    contactCell = (
      <label className="case-field-std">
        顧客担当者名
        <select
          value={contactId ?? ""}
          onChange={(e) => onContactChange(e.target.value.trim() || null)}
          disabled={!branchId}
        >
          <option value="">（未選択）</option>
          {contacts.map((c) => (
            <option key={c.id} value={c.id}>
              {[c.company_name, c.position_name].filter(Boolean).join(" · ") ||
                `${c.id.slice(0, 8)}…`}
            </option>
          ))}
        </select>
      </label>
    );
  }

  return (
    <div className="case-customer-block">
      <p className="case-customer-hint-banner" aria-live="polite">
        {customerNameSearching
          ? "検索中…"
          : "候補から顧客を選ぶと、顧客マスタに登録された部署・担当者をプルダウンで選べます。（新規顧客は拠点の部署名と担当者名が必須です）"}
      </p>
      <div className="case-form-row3 case-form-row3--customer-line">
        <label className="case-field-std">
          顧客名
          <CaseCustomerNameField
            value={customerName}
            onChange={onCustomerNameChange}
            onPick={onCustomerPick}
            onSearchingChange={setCustomerNameSearching}
          />
        </label>
        {branchCell}
        {contactCell}
      </div>
    </div>
  );
}

export function applyCustomerPick(
  c: CustomerHit,
): { customerName: string; customerId: string } {
  return {
    customerName: String(c.organization_name ?? "").trim(),
    customerId: c.id,
  };
}
