"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type CaseRow = { id: string; case_name: string; customer_name: string; status: string; version: number };
type EstimateRow = { id: string; case_id: string; estimate_subject: string; estimate_date: string; status: string; subtotal: number; tax_amount: number; total_amount: number; version: number };
type OrderRow = { id: string; case_id: string; estimate_id: string | null; order_title: string; order_date: string; status: string; amount_excl_tax: number; amount_incl_tax: number; version: number };
type EstimateLine = { id: string; line_no: number; item_name: string; unit_price: number; quantity: number; tax_amount: number; version: number };
type OrderLine = { id: string; line_no: number; item_name: string; unit_price: number; quantity: number; tax_amount: number; version: number };
type Job = { id: string; order_id: string; mold_no: string | null; can_deliver: boolean; laser_done: boolean; molding_done: boolean; inspection_done: boolean; version: number };
type DiecutSpec = { id: string; order_id: string; mold_no: string | null; machine_name: string | null; paper_name: string | null; paper_size: string | null; version: number };
type LcSpec = { id: string; order_id: string; delivery_method: string | null; specification: string | null; print_surface: string | null; print_back: string | null; version: number };

async function api<T>(url: string, loginId: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", "x-login-id": loginId, ...(init?.headers ?? {}) },
  });
  const json = await response.json();
  if (!response.ok || !json.ok) throw new Error(json.details ?? json.message ?? "API error");
  return json.data as T;
}

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(true);
  const [loginId, setLoginId] = useState("owner");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [cases, setCases] = useState<CaseRow[]>([]);
  const [estimates, setEstimates] = useState<EstimateRow[]>([]);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [estimateLines, setEstimateLines] = useState<EstimateLine[]>([]);
  const [orderLines, setOrderLines] = useState<OrderLine[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [diecutSpecs, setDiecutSpecs] = useState<DiecutSpec[]>([]);
  const [lcSpecs, setLcSpecs] = useState<LcSpec[]>([]);
  const [caseId, setCaseId] = useState("");
  const [estimateId, setEstimateId] = useState("");
  const [orderId, setOrderId] = useState("");
  const [caseName, setCaseName] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [estimateSubject, setEstimateSubject] = useState("");
  const [orderTitle, setOrderTitle] = useState("");
  const [lineItemName, setLineItemName] = useState("");
  const [lineUnitPrice, setLineUnitPrice] = useState("0");
  const [lineQuantity, setLineQuantity] = useState("1");
  const [jobMoldNo, setJobMoldNo] = useState("");
  const [diecutMoldNo, setDiecutMoldNo] = useState("");
  const [diecutMachine, setDiecutMachine] = useState("");
  const [lcDeliveryMethod, setLcDeliveryMethod] = useState("");
  const [lcSpecText, setLcSpecText] = useState("");
  const lastFRef = useRef<number>(0);

  const selectedEstimate = useMemo(
    () => estimates.find((e) => e.id === estimateId),
    [estimates, estimateId],
  );
  const selectedOrder = useMemo(() => orders.find((o) => o.id === orderId), [orders, orderId]);

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

  async function loadCases() {
    const data = await api<CaseRow[]>("/api/cases", loginId);
    setCases(data);
    if (!caseId && data[0]) setCaseId(data[0].id);
    if (caseId && !data.find((x) => x.id === caseId)) setCaseId(data[0]?.id ?? "");
  }

  async function loadEstimates(selectedCaseId: string) {
    if (!selectedCaseId) return setEstimates([]);
    const data = await api<EstimateRow[]>(`/api/estimates?caseId=${selectedCaseId}`, loginId);
    setEstimates(data);
    if (!estimateId && data[0]) setEstimateId(data[0].id);
    if (estimateId && !data.find((x) => x.id === estimateId)) setEstimateId(data[0]?.id ?? "");
  }

  async function loadOrders(selectedCaseId: string) {
    if (!selectedCaseId) return setOrders([]);
    const data = await api<OrderRow[]>(`/api/orders?caseId=${selectedCaseId}`, loginId);
    setOrders(data);
    if (!orderId && data[0]) setOrderId(data[0].id);
    if (orderId && !data.find((x) => x.id === orderId)) setOrderId(data[0]?.id ?? "");
  }

  async function loadEstimateLines(selectedEstimateId: string) {
    if (!selectedEstimateId) return setEstimateLines([]);
    const data = await api<EstimateLine[]>(
      `/api/estimate-lines?estimateId=${selectedEstimateId}`,
      loginId,
    );
    setEstimateLines(data);
  }

  async function loadOrderLines(selectedOrderId: string) {
    if (!selectedOrderId) return setOrderLines([]);
    const data = await api<OrderLine[]>(`/api/order-lines?orderId=${selectedOrderId}`, loginId);
    setOrderLines(data);
  }

  async function loadJobs(selectedOrderId: string) {
    if (!selectedOrderId) return setJobs([]);
    const data = await api<Job[]>(`/api/manufacturing-jobs?orderId=${selectedOrderId}`, loginId);
    setJobs(data);
  }

  async function loadSpecs(selectedOrderId: string) {
    if (!selectedOrderId) {
      setDiecutSpecs([]);
      setLcSpecs([]);
      return;
    }
    const [diecuts, lcs] = await Promise.all([
      api<DiecutSpec[]>(`/api/diecut-specs?orderId=${selectedOrderId}`, loginId),
      api<LcSpec[]>(`/api/lc-specs?orderId=${selectedOrderId}`, loginId),
    ]);
    setDiecutSpecs(diecuts);
    setLcSpecs(lcs);
  }

  async function reloadAll() {
    setBusy(true);
    setError("");
    try {
      await loadCases();
      await loadEstimates(caseId);
      await loadOrders(caseId);
      await loadEstimateLines(estimateId);
      await loadOrderLines(orderId);
      await loadJobs(orderId);
      await loadSpecs(orderId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "読込に失敗しました。");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    void reloadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loginId]);

  useEffect(() => {
    void loadEstimates(caseId);
    void loadOrders(caseId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseId, loginId]);

  useEffect(() => {
    void loadEstimateLines(estimateId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estimateId, loginId]);

  useEffect(() => {
    void loadOrderLines(orderId);
    void loadJobs(orderId);
    void loadSpecs(orderId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, loginId]);

  async function createCase() {
    try {
      await api("/api/cases", loginId, {
        method: "POST",
        body: JSON.stringify({ caseName, customerName, status: "draft" }),
      });
      setCaseName("");
      setCustomerName("");
      await loadCases();
    } catch (e) {
      setError(e instanceof Error ? e.message : "案件作成に失敗しました。");
    }
  }

  async function createEstimate() {
    if (!caseId) return;
    try {
      await api("/api/estimates", loginId, {
        method: "POST",
        body: JSON.stringify({
          caseId,
          estimateSubject,
          estimateDate: new Date().toISOString().slice(0, 10),
          subtotal: 0,
          taxAmount: 0,
          totalAmount: 0,
        }),
      });
      setEstimateSubject("");
      await loadEstimates(caseId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "見積作成に失敗しました。");
    }
  }

  async function createOrder() {
    if (!caseId) return;
    try {
      await api("/api/orders", loginId, {
        method: "POST",
        body: JSON.stringify({
          caseId,
          estimateId: estimateId || null,
          orderTitle,
          orderDate: new Date().toISOString().slice(0, 10),
          amountExclTax: 0,
          amountInclTax: 0,
        }),
      });
      setOrderTitle("");
      await loadOrders(caseId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "受注作成に失敗しました。");
    }
  }

  async function addEstimateLine() {
    if (!estimateId) return;
    try {
      await api("/api/estimate-lines", loginId, {
        method: "POST",
        body: JSON.stringify({
          estimateId,
          lineNo: estimateLines.length + 1,
          itemName: lineItemName,
          unitPrice: lineUnitPrice,
          quantity: lineQuantity,
          taxRate: 10,
        }),
      });
      setLineItemName("");
      await loadEstimateLines(estimateId);
      await loadEstimates(caseId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "見積明細追加に失敗しました。");
    }
  }

  async function addOrderLine() {
    if (!orderId) return;
    try {
      await api("/api/order-lines", loginId, {
        method: "POST",
        body: JSON.stringify({
          orderId,
          lineNo: orderLines.length + 1,
          itemName: lineItemName,
          unitPrice: lineUnitPrice,
          quantity: lineQuantity,
          taxRate: 10,
        }),
      });
      setLineItemName("");
      await loadOrderLines(orderId);
      await loadOrders(caseId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "受注明細追加に失敗しました。");
    }
  }

  async function createJob() {
    if (!orderId) return;
    try {
      await api("/api/manufacturing-jobs", loginId, {
        method: "POST",
        body: JSON.stringify({ orderId, moldNo: jobMoldNo }),
      });
      setJobMoldNo("");
      await loadJobs(orderId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "型工務作成に失敗しました。");
    }
  }

  async function createDiecutSpec() {
    if (!orderId) return;
    try {
      await api("/api/diecut-specs", loginId, {
        method: "POST",
        body: JSON.stringify({
          orderId,
          moldNo: diecutMoldNo,
          machineName: diecutMachine,
        }),
      });
      setDiecutMoldNo("");
      setDiecutMachine("");
      await loadSpecs(orderId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "抜き型仕様作成に失敗しました。");
    }
  }

  async function createLcSpec() {
    if (!orderId) return;
    try {
      await api("/api/lc-specs", loginId, {
        method: "POST",
        body: JSON.stringify({
          orderId,
          deliveryMethod: lcDeliveryMethod,
          specification: lcSpecText,
        }),
      });
      setLcDeliveryMethod("");
      setLcSpecText("");
      await loadSpecs(orderId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "LC仕様作成に失敗しました。");
    }
  }

  return (
    <div className="app-shell">
      <aside className={`left-menu ${menuOpen ? "open" : "closed"}`}>
        <h2>メニュー</h2>
        <div className="menu-tip">Fキーを素早く2回で開閉</div>
        <a href="#cases">案件</a>
        <a href="#estimates">見積</a>
        <a href="#orders">受注</a>
        <a href="#manufacturing">型工務</a>
        <a href="#specs">抜き型/LC仕様</a>
      </aside>
      <main className="main-content">
        <header className="page-header">
          <h2>業務システム 本番相当レビュー</h2>
          <div className="login-box">
            <span>login_id</span>
            <input value={loginId} onChange={(e) => setLoginId(e.target.value)} />
            <button className="btn btn-positive" onClick={() => void reloadAll()} disabled={busy}>
              再読込
            </button>
          </div>
        </header>
        {error ? <div className="error-box">{error}</div> : null}

        <section id="cases" className="panel">
          <h2>案件</h2>
          <div className="form-row">
            <input placeholder="案件名" value={caseName} onChange={(e) => setCaseName(e.target.value)} />
            <input placeholder="顧客名" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
            <button className="btn btn-positive" onClick={() => void createCase()} disabled={busy}>
              新規案件
            </button>
          </div>
          <table className="spec-table">
            <thead>
              <tr>
                <th>案件名</th><th>顧客</th><th>状態</th><th>版</th>
              </tr>
            </thead>
            <tbody>
              {cases.map((row) => (
                <tr key={row.id} onClick={() => setCaseId(row.id)} className={row.id === caseId ? "active-row" : ""}>
                  <td>{row.case_name}</td><td>{row.customer_name}</td><td>{row.status}</td><td>{row.version}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section id="estimates" className="panel">
          <h2>見積</h2>
          <div className="form-row">
            <input placeholder="見積件名" value={estimateSubject} onChange={(e) => setEstimateSubject(e.target.value)} />
            <button className="btn btn-positive" onClick={() => void createEstimate()} disabled={!caseId || busy}>
              新規見積
            </button>
          </div>
          <table className="spec-table">
            <thead><tr><th>見積件名</th><th>日付</th><th>税込</th><th>版</th></tr></thead>
            <tbody>
              {estimates.map((row) => (
                <tr key={row.id} onClick={() => setEstimateId(row.id)} className={row.id === estimateId ? "active-row" : ""}>
                  <td>{row.estimate_subject}</td><td>{row.estimate_date}</td><td>{row.total_amount.toLocaleString()}</td><td>{row.version}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="form-row">
            <input placeholder="品名" value={lineItemName} onChange={(e) => setLineItemName(e.target.value)} />
            <input placeholder="単価" value={lineUnitPrice} onChange={(e) => setLineUnitPrice(e.target.value)} />
            <input placeholder="数量" value={lineQuantity} onChange={(e) => setLineQuantity(e.target.value)} />
            <button className="btn btn-positive" onClick={() => void addEstimateLine()} disabled={!estimateId || busy}>
              明細追加
            </button>
          </div>
          <table className="spec-table">
            <thead><tr><th>No</th><th>品名</th><th>単価</th><th>数量</th><th>税額</th></tr></thead>
            <tbody>
              {estimateLines.map((row) => (
                <tr key={row.id}>
                  <td>{row.line_no}</td><td>{row.item_name}</td><td>{row.unit_price}</td><td>{row.quantity}</td><td>{row.tax_amount}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="total-box">
            合計: 税抜 {selectedEstimate?.subtotal?.toLocaleString() ?? 0} / 税額 {selectedEstimate?.tax_amount?.toLocaleString() ?? 0} / 税込 {selectedEstimate?.total_amount?.toLocaleString() ?? 0}
          </div>
        </section>

        <section id="orders" className="panel">
          <h2>受注</h2>
          <div className="form-row">
            <input placeholder="受注件名" value={orderTitle} onChange={(e) => setOrderTitle(e.target.value)} />
            <button className="btn btn-positive" onClick={() => void createOrder()} disabled={!caseId || busy}>
              新規受注
            </button>
          </div>
          <table className="spec-table">
            <thead><tr><th>受注件名</th><th>日付</th><th>税込</th><th>版</th></tr></thead>
            <tbody>
              {orders.map((row) => (
                <tr key={row.id} onClick={() => setOrderId(row.id)} className={row.id === orderId ? "active-row" : ""}>
                  <td>{row.order_title}</td><td>{row.order_date}</td><td>{row.amount_incl_tax.toLocaleString()}</td><td>{row.version}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="form-row">
            <input placeholder="品名" value={lineItemName} onChange={(e) => setLineItemName(e.target.value)} />
            <input placeholder="単価" value={lineUnitPrice} onChange={(e) => setLineUnitPrice(e.target.value)} />
            <input placeholder="数量" value={lineQuantity} onChange={(e) => setLineQuantity(e.target.value)} />
            <button className="btn btn-positive" onClick={() => void addOrderLine()} disabled={!orderId || busy}>
              受注明細追加
            </button>
          </div>
          <table className="spec-table">
            <thead><tr><th>No</th><th>品名</th><th>単価</th><th>数量</th><th>税額</th></tr></thead>
            <tbody>
              {orderLines.map((row) => (
                <tr key={row.id}>
                  <td>{row.line_no}</td><td>{row.item_name}</td><td>{row.unit_price}</td><td>{row.quantity}</td><td>{row.tax_amount}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="total-box">
            合計: 税抜 {selectedOrder?.amount_excl_tax?.toLocaleString() ?? 0} / 税込 {selectedOrder?.amount_incl_tax?.toLocaleString() ?? 0}
          </div>
        </section>

        <section id="manufacturing" className="panel">
          <h2>型工務</h2>
          <div className="form-row">
            <input placeholder="型No" value={jobMoldNo} onChange={(e) => setJobMoldNo(e.target.value)} />
            <button className="btn btn-positive" onClick={() => void createJob()} disabled={!orderId || busy}>
              工務追加
            </button>
          </div>
          <table className="spec-table">
            <thead><tr><th>型No</th><th>レーザー</th><th>型製作</th><th>検査</th><th>納品可</th><th>版</th></tr></thead>
            <tbody>
              {jobs.map((row) => (
                <tr key={row.id}>
                  <td>{row.mold_no ?? "-"}</td><td>{row.laser_done ? "完" : "未"}</td><td>{row.molding_done ? "完" : "未"}</td><td>{row.inspection_done ? "完" : "未"}</td><td>{row.can_deliver ? "可" : "不可"}</td><td>{row.version}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section id="specs" className="panel">
          <h2>抜き型/LC仕様</h2>
          <div className="grid-two">
            <div>
              <h3>抜き型仕様</h3>
              <div className="form-row">
                <input placeholder="型No" value={diecutMoldNo} onChange={(e) => setDiecutMoldNo(e.target.value)} />
                <input placeholder="機種" value={diecutMachine} onChange={(e) => setDiecutMachine(e.target.value)} />
                <button className="btn btn-positive" onClick={() => void createDiecutSpec()} disabled={!orderId || busy}>
                  追加
                </button>
              </div>
              <table className="spec-table">
                <thead><tr><th>型No</th><th>機種</th><th>用紙</th><th>版</th></tr></thead>
                <tbody>
                  {diecutSpecs.map((row) => (
                    <tr key={row.id}>
                      <td>{row.mold_no ?? "-"}</td><td>{row.machine_name ?? "-"}</td><td>{row.paper_name ?? "-"}</td><td>{row.version}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div>
              <h3>LC仕様</h3>
              <div className="form-row">
                <input placeholder="納品方法" value={lcDeliveryMethod} onChange={(e) => setLcDeliveryMethod(e.target.value)} />
                <input placeholder="仕様" value={lcSpecText} onChange={(e) => setLcSpecText(e.target.value)} />
                <button className="btn btn-positive" onClick={() => void createLcSpec()} disabled={!orderId || busy}>
                  追加
                </button>
              </div>
              <table className="spec-table">
                <thead><tr><th>納品方法</th><th>仕様</th><th>表面印刷</th><th>版</th></tr></thead>
                <tbody>
                  {lcSpecs.map((row) => (
                    <tr key={row.id}>
                      <td>{row.delivery_method ?? "-"}</td><td>{row.specification ?? "-"}</td><td>{row.print_surface ?? "-"}</td><td>{row.version}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
