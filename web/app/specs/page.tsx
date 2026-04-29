"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ScreenToolbar } from "@/app/_components/screen-toolbar";
import { useAppContext } from "@/app/_components/app-context";
import { clientApi } from "@/lib/client-api";
import { rowMatchesSearch } from "@/lib/list-search";

function jsonPretty(v: unknown): string {
  try {
    return JSON.stringify(v ?? {}, null, 2);
  } catch {
    return "{}";
  }
}

function parseJsonObject(text: string): Record<string, unknown> {
  try {
    const v = JSON.parse(text || "{}");
    return typeof v === "object" && v !== null && !Array.isArray(v)
      ? (v as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}

type OrderRow = { id: string; order_title: string; case_id: string };

type DiecutSpec = {
  id: string;
  order_id: string;
  mold_no: string | null;
  deposit_items: unknown;
  machine_name: string | null;
  paper_name: string | null;
  paper_size: string | null;
  surface_processing: string | null;
  mold_jaw: string | null;
  mold_adjustment_value: string | null;
  nick_1: string | null;
  nick_2: string | null;
  process_name_1: string | null;
  process_name_2: string | null;
  process_name_3: string | null;
  process_name_4: string | null;
  process_name_5: string | null;
  process_name_6: string | null;
  process_notes: unknown;
  version: number;
};

type LcSpec = {
  id: string;
  order_id: string;
  delivery_destination_id: string | null;
  delivery_method: string | null;
  data_note: string | null;
  specification: string | null;
  supplied_materials: unknown;
  arranged_materials: unknown;
  print_surface: string | null;
  print_back: string | null;
  varnish: string | null;
  plate: string | null;
  pp: string | null;
  wpp: string | null;
  lamination: string | null;
  memo: string | null;
  image_url: string | null;
  version: number;
};

function SpecsPageInner() {
  const { loginId } = useAppContext();
  const searchParams = useSearchParams();
  const caseIdFromUrl = searchParams.get("caseId");
  const orderIdFromUrl = searchParams.get("orderId");
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [orderId, setOrderId] = useState("");
  const [diecuts, setDiecuts] = useState<DiecutSpec[]>([]);
  const [lcs, setLcs] = useState<LcSpec[]>([]);
  const [selectedDiecutId, setSelectedDiecutId] = useState("");
  const [selectedLcId, setSelectedLcId] = useState("");
  const [depositItemsJson, setDepositItemsJson] = useState("{}");
  const [processNotesJson, setProcessNotesJson] = useState("{}");
  const [suppliedJson, setSuppliedJson] = useState("{}");
  const [arrangedJson, setArrangedJson] = useState("{}");
  const [error, setError] = useState("");
  const [listQuery, setListQuery] = useState("");

  const filteredDiecuts = useMemo(
    () =>
      diecuts.filter((row) =>
        rowMatchesSearch(
          [
            row.mold_no ?? "",
            row.machine_name ?? "",
            row.paper_name ?? "",
            String(row.version),
          ],
          listQuery,
        ),
      ),
    [diecuts, listQuery],
  );

  const filteredLcs = useMemo(
    () =>
      lcs.filter((row) =>
        rowMatchesSearch(
          [
            row.delivery_method ?? "",
            row.specification ?? "",
            row.print_surface ?? "",
            String(row.version),
          ],
          listQuery,
        ),
      ),
    [lcs, listQuery],
  );

  const selectedDiecut = useMemo(
    () => diecuts.find((d) => d.id === selectedDiecutId) ?? null,
    [diecuts, selectedDiecutId],
  );
  const selectedLc = useMemo(
    () => lcs.find((d) => d.id === selectedLcId) ?? null,
    [lcs, selectedLcId],
  );

  async function loadOrders() {
    const url = caseIdFromUrl
      ? `/api/orders?caseId=${caseIdFromUrl}`
      : "/api/orders";
    const data = await clientApi<OrderRow[]>(loginId, url);
    setOrders(data);
    setOrderId((prev) => {
      if (orderIdFromUrl && data.some((o) => o.id === orderIdFromUrl)) {
        return orderIdFromUrl;
      }
      if (prev && data.some((o) => o.id === prev)) return prev;
      return data[0]?.id ?? "";
    });
  }

  async function loadSpecs(selectedOrderId: string) {
    if (!selectedOrderId) {
      setDiecuts([]);
      setLcs([]);
      return;
    }
    const [diecutData, lcData] = await Promise.all([
      clientApi<DiecutSpec[]>(loginId, `/api/diecut-specs?orderId=${selectedOrderId}`),
      clientApi<LcSpec[]>(loginId, `/api/lc-specs?orderId=${selectedOrderId}`),
    ]);
    setDiecuts(diecutData);
    setLcs(lcData);
    setSelectedDiecutId("");
    setSelectedLcId("");
  }

  useEffect(() => {
    void loadOrders().catch((e) => setError(e instanceof Error ? e.message : "読込失敗"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loginId, caseIdFromUrl, orderIdFromUrl]);

  useEffect(() => {
    void loadSpecs(orderId).catch((e) => setError(e instanceof Error ? e.message : "読込失敗"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, loginId]);

  useEffect(() => {
    if (selectedDiecut) {
      setDepositItemsJson(jsonPretty(selectedDiecut.deposit_items));
      setProcessNotesJson(jsonPretty(selectedDiecut.process_notes));
    } else {
      setDepositItemsJson("{}");
      setProcessNotesJson("{}");
    }
  }, [selectedDiecut]);

  useEffect(() => {
    if (selectedLc) {
      setSuppliedJson(jsonPretty(selectedLc.supplied_materials));
      setArrangedJson(jsonPretty(selectedLc.arranged_materials));
    } else {
      setSuppliedJson("{}");
      setArrangedJson("{}");
    }
  }, [selectedLc]);

  async function saveDiecut() {
    if (!selectedDiecut) return;
    await clientApi(loginId, `/api/diecut-specs/${selectedDiecut.id}`, {
      method: "PATCH",
      body: JSON.stringify({
        version: selectedDiecut.version,
        moldNo: selectedDiecut.mold_no ?? "",
        depositItems: parseJsonObject(depositItemsJson),
        machineName: selectedDiecut.machine_name ?? "",
        paperName: selectedDiecut.paper_name ?? "",
        paperSize: selectedDiecut.paper_size ?? "",
        surfaceProcessing: selectedDiecut.surface_processing ?? "",
        moldJaw: selectedDiecut.mold_jaw ?? "",
        moldAdjustmentValue: selectedDiecut.mold_adjustment_value ?? "",
        nick1: selectedDiecut.nick_1 ?? "",
        nick2: selectedDiecut.nick_2 ?? "",
        processName1: selectedDiecut.process_name_1 ?? "",
        processName2: selectedDiecut.process_name_2 ?? "",
        processName3: selectedDiecut.process_name_3 ?? "",
        processName4: selectedDiecut.process_name_4 ?? "",
        processName5: selectedDiecut.process_name_5 ?? "",
        processName6: selectedDiecut.process_name_6 ?? "",
        processNotes: parseJsonObject(processNotesJson),
      }),
    });
    await loadSpecs(orderId);
  }

  async function saveLc() {
    if (!selectedLc) return;
    await clientApi(loginId, `/api/lc-specs/${selectedLc.id}`, {
      method: "PATCH",
      body: JSON.stringify({
        version: selectedLc.version,
        deliveryDestinationId: selectedLc.delivery_destination_id ?? "",
        deliveryMethod: selectedLc.delivery_method ?? "",
        dataNote: selectedLc.data_note ?? "",
        specification: selectedLc.specification ?? "",
        printSurface: selectedLc.print_surface ?? "",
        printBack: selectedLc.print_back ?? "",
        varnish: selectedLc.varnish ?? "",
        plate: selectedLc.plate ?? "",
        pp: selectedLc.pp ?? "",
        wpp: selectedLc.wpp ?? "",
        lamination: selectedLc.lamination ?? "",
        memo: selectedLc.memo ?? "",
        imageUrl: selectedLc.image_url ?? "",
        suppliedMaterials: parseJsonObject(suppliedJson),
        arrangedMaterials: parseJsonObject(arrangedJson),
      }),
    });
    await loadSpecs(orderId);
  }

  function patchDiecut(patch: Partial<DiecutSpec>) {
    setDiecuts((prev) =>
      prev.map((row) => (row.id === selectedDiecutId ? { ...row, ...patch } : row)),
    );
  }

  function patchLc(patch: Partial<LcSpec>) {
    setLcs((prev) => prev.map((row) => (row.id === selectedLcId ? { ...row, ...patch } : row)));
  }

  return (
    <section className="screen">
      <div className="screen-head">
        <h2 className="screen-title">抜き型/LC仕様</h2>
        <ScreenToolbar searchValue={listQuery} onSearchChange={setListQuery} />
      </div>
      {caseIdFromUrl ? (
        <p className="detail-summary">案件で絞り込み中（caseId: {caseIdFromUrl}）</p>
      ) : null}
      {error ? <div className="error-box">{error}</div> : null}
      <div className="screen-controls">
        <select value={orderId} onChange={(e) => setOrderId(e.target.value)}>
          <option value="">受注を選択</option>
          {orders.map((row) => (
            <option key={row.id} value={row.id}>
              {row.order_title}
            </option>
          ))}
        </select>
        <Link
          className="btn btn-positive"
          href={
            orderId
              ? `/specs/new?orderId=${orderId}${caseIdFromUrl ? `&caseId=${caseIdFromUrl}` : ""}`
              : `/specs/new${caseIdFromUrl ? `?caseId=${caseIdFromUrl}` : ""}`
          }
        >
          新規作成
        </Link>
      </div>

      <div className="grid-two">
        <div className="panel">
          <h3>抜き型仕様</h3>
          <table className="spec-table">
            <thead>
              <tr>
                <th>型No</th>
                <th>機種</th>
                <th>用紙</th>
                <th>版</th>
                <th>選択</th>
              </tr>
            </thead>
            <tbody>
              {filteredDiecuts.map((row) => (
                <tr key={row.id}>
                  <td>{row.mold_no ?? "-"}</td>
                  <td>{row.machine_name ?? "-"}</td>
                  <td>{row.paper_name ?? "-"}</td>
                  <td>{row.version}</td>
                  <td>
                    <button
                      type="button"
                      className="btn btn-detail"
                      onClick={() => setSelectedDiecutId(row.id)}
                    >
                      編集
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {selectedDiecut ? (
            <div className="detail-form" style={{ marginTop: 12 }}>
              <label>
                型No
                <input
                  value={selectedDiecut.mold_no ?? ""}
                  onChange={(e) => patchDiecut({ mold_no: e.target.value })}
                />
              </label>
              <label>
                機種
                <input
                  value={selectedDiecut.machine_name ?? ""}
                  onChange={(e) => patchDiecut({ machine_name: e.target.value })}
                />
              </label>
              <label>
                用紙名
                <input
                  value={selectedDiecut.paper_name ?? ""}
                  onChange={(e) => patchDiecut({ paper_name: e.target.value })}
                />
              </label>
              <label>
                用紙サイズ
                <input
                  value={selectedDiecut.paper_size ?? ""}
                  onChange={(e) => patchDiecut({ paper_size: e.target.value })}
                />
              </label>
              <label>
                表面加工
                <input
                  value={selectedDiecut.surface_processing ?? ""}
                  onChange={(e) => patchDiecut({ surface_processing: e.target.value })}
                />
              </label>
              <label>
                金型ジョー
                <input
                  value={selectedDiecut.mold_jaw ?? ""}
                  onChange={(e) => patchDiecut({ mold_jaw: e.target.value })}
                />
              </label>
              <label>
                型調整値
                <input
                  value={selectedDiecut.mold_adjustment_value ?? ""}
                  onChange={(e) => patchDiecut({ mold_adjustment_value: e.target.value })}
                />
              </label>
              <label>
                ニック1
                <input
                  value={selectedDiecut.nick_1 ?? ""}
                  onChange={(e) => patchDiecut({ nick_1: e.target.value })}
                />
              </label>
              <label>
                ニック2
                <input
                  value={selectedDiecut.nick_2 ?? ""}
                  onChange={(e) => patchDiecut({ nick_2: e.target.value })}
                />
              </label>
              <label>
                工程名1
                <input
                  value={selectedDiecut.process_name_1 ?? ""}
                  onChange={(e) => patchDiecut({ process_name_1: e.target.value })}
                />
              </label>
              <label>
                工程名2
                <input
                  value={selectedDiecut.process_name_2 ?? ""}
                  onChange={(e) => patchDiecut({ process_name_2: e.target.value })}
                />
              </label>
              <label>
                工程名3
                <input
                  value={selectedDiecut.process_name_3 ?? ""}
                  onChange={(e) => patchDiecut({ process_name_3: e.target.value })}
                />
              </label>
              <label>
                工程名4
                <input
                  value={selectedDiecut.process_name_4 ?? ""}
                  onChange={(e) => patchDiecut({ process_name_4: e.target.value })}
                />
              </label>
              <label>
                工程名5
                <input
                  value={selectedDiecut.process_name_5 ?? ""}
                  onChange={(e) => patchDiecut({ process_name_5: e.target.value })}
                />
              </label>
              <label>
                工程名6
                <input
                  value={selectedDiecut.process_name_6 ?? ""}
                  onChange={(e) => patchDiecut({ process_name_6: e.target.value })}
                />
              </label>
              <label>
                預かり品（JSON）
                <textarea
                  rows={4}
                  value={depositItemsJson}
                  onChange={(e) => setDepositItemsJson(e.target.value)}
                />
              </label>
              <label>
                工程メモ（JSON）
                <textarea
                  rows={4}
                  value={processNotesJson}
                  onChange={(e) => setProcessNotesJson(e.target.value)}
                />
              </label>
              <button type="button" className="btn btn-positive" onClick={() => void saveDiecut()}>
                抜き型仕様を保存
              </button>
            </div>
          ) : null}
        </div>

        <div className="panel">
          <h3>LC仕様</h3>
          <table className="spec-table">
            <thead>
              <tr>
                <th>納品方法</th>
                <th>仕様</th>
                <th>表面印刷</th>
                <th>版</th>
                <th>選択</th>
              </tr>
            </thead>
            <tbody>
              {filteredLcs.map((row) => (
                <tr key={row.id}>
                  <td>{row.delivery_method ?? "-"}</td>
                  <td>{row.specification ?? "-"}</td>
                  <td>{row.print_surface ?? "-"}</td>
                  <td>{row.version}</td>
                  <td>
                    <button
                      type="button"
                      className="btn btn-detail"
                      onClick={() => setSelectedLcId(row.id)}
                    >
                      編集
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {selectedLc ? (
            <div className="detail-form" style={{ marginTop: 12 }}>
              <label>
                納品先ID
                <input
                  value={selectedLc.delivery_destination_id ?? ""}
                  onChange={(e) =>
                    patchLc({ delivery_destination_id: e.target.value || null })
                  }
                />
              </label>
              <label>
                納品方法
                <input
                  value={selectedLc.delivery_method ?? ""}
                  onChange={(e) => patchLc({ delivery_method: e.target.value })}
                />
              </label>
              <label>
                データ備考
                <input
                  value={selectedLc.data_note ?? ""}
                  onChange={(e) => patchLc({ data_note: e.target.value })}
                />
              </label>
              <label>
                仕様
                <input
                  value={selectedLc.specification ?? ""}
                  onChange={(e) => patchLc({ specification: e.target.value })}
                />
              </label>
              <label>
                表面印刷
                <input
                  value={selectedLc.print_surface ?? ""}
                  onChange={(e) => patchLc({ print_surface: e.target.value })}
                />
              </label>
              <label>
                裏面印刷
                <input
                  value={selectedLc.print_back ?? ""}
                  onChange={(e) => patchLc({ print_back: e.target.value })}
                />
              </label>
              <label>
                ニス
                <input
                  value={selectedLc.varnish ?? ""}
                  onChange={(e) => patchLc({ varnish: e.target.value })}
                />
              </label>
              <label>
                版
                <input
                  value={selectedLc.plate ?? ""}
                  onChange={(e) => patchLc({ plate: e.target.value })}
                />
              </label>
              <label>
                PP
                <input
                  value={selectedLc.pp ?? ""}
                  onChange={(e) => patchLc({ pp: e.target.value })}
                />
              </label>
              <label>
                WPP
                <input
                  value={selectedLc.wpp ?? ""}
                  onChange={(e) => patchLc({ wpp: e.target.value })}
                />
              </label>
              <label>
                ラミ
                <input
                  value={selectedLc.lamination ?? ""}
                  onChange={(e) => patchLc({ lamination: e.target.value })}
                />
              </label>
              <label>
                メモ
                <textarea
                  value={selectedLc.memo ?? ""}
                  onChange={(e) => patchLc({ memo: e.target.value })}
                />
              </label>
              <label>
                画像URL
                <input
                  value={selectedLc.image_url ?? ""}
                  onChange={(e) => patchLc({ image_url: e.target.value })}
                />
              </label>
              <label>
                支給材（JSON）
                <textarea
                  rows={4}
                  value={suppliedJson}
                  onChange={(e) => setSuppliedJson(e.target.value)}
                />
              </label>
              <label>
                手配材（JSON）
                <textarea
                  rows={4}
                  value={arrangedJson}
                  onChange={(e) => setArrangedJson(e.target.value)}
                />
              </label>
              <button type="button" className="btn btn-positive" onClick={() => void saveLc()}>
                LC仕様を保存
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

export default function SpecsPage() {
  return (
    <Suspense fallback={<section className="screen"><p>読込中...</p></section>}>
      <SpecsPageInner />
    </Suspense>
  );
}
