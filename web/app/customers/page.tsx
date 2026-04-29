"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ScreenToolbar } from "@/app/_components/screen-toolbar";
import { ListPaginationBar } from "@/app/_components/list-pagination-bar";
import { useAppContext } from "@/app/_components/app-context";
import { clientApi } from "@/lib/client-api";
import { rowMatchesSearch } from "@/lib/list-search";
import { useListPagination } from "@/hooks/useListPagination";

type Customer = {
  id: string;
  organization_name: string;
  department_name: string | null;
  is_active: boolean;
  version: number;
};
type Branch = {
  id: string;
  customer_id: string;
  department_name: string | null;
  postal_code: string | null;
  prefecture: string | null;
  city: string | null;
  address_line: string | null;
  phone: string | null;
  email: string | null;
  yayoi_code: string | null;
  closing_day: number | null;
  payment_day: number | null;
  other_code: string | null;
  version: number;
};
type Contact = {
  id: string;
  customer_branch_id: string;
  company_name: string | null;
  position_name: string | null;
  phone: string | null;
  email: string | null;
  version: number;
};
type BillingInfo = {
  id: string;
  billing_name: string;
  billing_contact_name: string | null;
  postal_code: string | null;
  prefecture: string | null;
  city: string | null;
  address_line: string | null;
  phone: string | null;
  email: string | null;
  version: number;
};
type DeliveryDestination = {
  id: string;
  destination_name: string;
  postal_code: string | null;
  prefecture: string | null;
  city: string | null;
  address_line: string | null;
  phone: string | null;
  email: string | null;
  version: number;
};

type CustomerTabKey = "basic" | "branches" | "contacts" | "billing" | "destinations";

export default function CustomersPage() {
  const { loginId } = useAppContext();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [billingInfos, setBillingInfos] = useState<BillingInfo[]>([]);
  const [destinations, setDestinations] = useState<DeliveryDestination[]>([]);
  const [customerId, setCustomerId] = useState("");
  const [branchId, setBranchId] = useState("");
  const [customerTab, setCustomerTab] = useState<CustomerTabKey>("basic");
  const [basicEditing, setBasicEditing] = useState(false);

  const [showNewBranchForm, setShowNewBranchForm] = useState(false);
  const [branchViewId, setBranchViewId] = useState<string | null>(null);
  const [branchEditId, setBranchEditId] = useState<string | null>(null);

  const [showNewContactForm, setShowNewContactForm] = useState(false);
  const [contactViewId, setContactViewId] = useState<string | null>(null);
  const [contactEditId, setContactEditId] = useState<string | null>(null);

  const [showNewBillingForm, setShowNewBillingForm] = useState(false);
  const [billingViewId, setBillingViewId] = useState<string | null>(null);
  const [billingEditId, setBillingEditId] = useState<string | null>(null);

  const [showNewDestinationForm, setShowNewDestinationForm] = useState(false);
  const [destinationViewId, setDestinationViewId] = useState<string | null>(null);
  const [destinationEditId, setDestinationEditId] = useState<string | null>(null);

  const [newBranch, setNewBranch] = useState({
    departmentName: "",
    postalCode: "",
    prefecture: "",
    city: "",
    addressLine: "",
    phone: "",
    email: "",
    yayoiCode: "",
    closingDay: "",
    paymentDay: "",
    otherCode: "",
  });
  const [newContact, setNewContact] = useState({
    companyName: "",
    positionName: "",
    phone: "",
    email: "",
  });
  const [newBilling, setNewBilling] = useState({
    billingName: "",
    billingContactName: "",
    postalCode: "",
    prefecture: "",
    city: "",
    addressLine: "",
    phone: "",
    email: "",
  });
  const [newDestination, setNewDestination] = useState({
    name: "",
    postalCode: "",
    prefecture: "",
    city: "",
    addressLine: "",
    phone: "",
    email: "",
  });
  const [error, setError] = useState("");
  const [listQuery, setListQuery] = useState("");

  const filteredCustomers = useMemo(
    () =>
      customers.filter((row) =>
        rowMatchesSearch(
          [
            row.organization_name,
            row.department_name ?? "",
            row.is_active ? "有効" : "無効",
            String(row.version),
          ],
          listQuery,
        ),
      ),
    [customers, listQuery],
  );
  const {
    pageItems: customerPageRows,
    page: customerPage,
    totalPages: customerTotalPages,
    total: customerTotal,
    rangeStart: customerRangeStart,
    rangeEnd: customerRangeEnd,
    setPage: setCustomerPage,
  } = useListPagination(filteredCustomers, listQuery);
  const {
    pageItems: branchPageRows,
    page: branchPage,
    totalPages: branchTotalPages,
    total: branchTotal,
    rangeStart: branchRangeStart,
    rangeEnd: branchRangeEnd,
    setPage: setBranchPage,
  } = useListPagination(branches, `${customerId}-branches`);
  const {
    pageItems: contactPageRows,
    page: contactPage,
    totalPages: contactTotalPages,
    total: contactTotal,
    rangeStart: contactRangeStart,
    rangeEnd: contactRangeEnd,
    setPage: setContactPage,
  } = useListPagination(contacts, `${customerId}-${branchId}-contacts`);
  const {
    pageItems: billingPageRows,
    page: billingPage,
    totalPages: billingTotalPages,
    total: billingListTotal,
    rangeStart: billingRangeStart,
    rangeEnd: billingRangeEnd,
    setPage: setBillingListPage,
  } = useListPagination(billingInfos, `${customerId}-billing`);
  const {
    pageItems: destinationPageRows,
    page: destinationPage,
    totalPages: destinationTotalPages,
    total: destinationListTotal,
    rangeStart: destinationRangeStart,
    rangeEnd: destinationRangeEnd,
    setPage: setDestinationListPage,
  } = useListPagination(destinations, `${customerId}-destinations`);

  const resetTabPanels = useCallback(() => {
    setShowNewBranchForm(false);
    setBranchViewId(null);
    setBranchEditId(null);
    setShowNewContactForm(false);
    setContactViewId(null);
    setContactEditId(null);
    setShowNewBillingForm(false);
    setBillingViewId(null);
    setBillingEditId(null);
    setShowNewDestinationForm(false);
    setDestinationViewId(null);
    setDestinationEditId(null);
  }, []);

  function openCustomerDetail(id: string, opts?: { basicEditing?: boolean }) {
    resetTabPanels();
    setBranchId("");
    setCustomerId(id);
    setCustomerTab("basic");
    setBasicEditing(opts?.basicEditing ?? false);
  }

  const selectedCustomer = useMemo(
    () => customers.find((row) => row.id === customerId) ?? null,
    [customers, customerId],
  );
  const selectedBranch = useMemo(
    () => branches.find((row) => row.id === branchEditId) ?? null,
    [branches, branchEditId],
  );
  const viewingBranch = useMemo(
    () => (branchViewId ? branches.find((row) => row.id === branchViewId) ?? null : null),
    [branches, branchViewId],
  );
  const selectedContact = useMemo(
    () => contacts.find((row) => row.id === contactEditId) ?? null,
    [contacts, contactEditId],
  );
  const viewingContact = useMemo(
    () => (contactViewId ? contacts.find((row) => row.id === contactViewId) ?? null : null),
    [contacts, contactViewId],
  );
  const selectedBilling = useMemo(
    () => billingInfos.find((row) => row.id === billingEditId) ?? null,
    [billingInfos, billingEditId],
  );
  const viewingBilling = useMemo(
    () => (billingViewId ? billingInfos.find((row) => row.id === billingViewId) ?? null : null),
    [billingInfos, billingViewId],
  );
  const selectedDestination = useMemo(
    () => destinations.find((row) => row.id === destinationEditId) ?? null,
    [destinations, destinationEditId],
  );
  const viewingDestination = useMemo(
    () =>
      destinationViewId ? destinations.find((row) => row.id === destinationViewId) ?? null : null,
    [destinations, destinationViewId],
  );

  async function loadCustomers() {
    const data = await clientApi("/api/customers");
    setCustomers(data);
    if (customerId && !data.some((row) => row.id === customerId)) {
      setCustomerId("");
      setBranchId("");
    }
  }

  async function loadBranches(selectedCustomerId: string) {
    if (!selectedCustomerId) return setBranches([]);
    const data = await clientApi(`/api/customer-branches?customerId=${selectedCustomerId}`,
    );
    setBranches(data);
    setBranchId("");
  }

  async function loadContacts(selectedBranchId: string) {
    if (!selectedBranchId) return setContacts([]);
    const data = await clientApi(`/api/customer-contacts?customerBranchId=${selectedBranchId}`,
    );
    setContacts(data);
  }

  async function loadBillingInfos(selectedCustomerId: string) {
    if (!selectedCustomerId) return setBillingInfos([]);
    const data = await clientApi(`/api/billing-infos?customerId=${selectedCustomerId}`,
    );
    setBillingInfos(data);
  }

  async function loadDestinations() {
    const data = await clientApi("/api/delivery-destinations");
    setDestinations(data);
  }

  useEffect(() => {
    resetTabPanels();
  }, [customerTab, resetTabPanels]);

  useEffect(() => {
    void loadCustomers().catch((e) => setError(e instanceof Error ? e.message : "読込失敗"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loginId]);

  useEffect(() => {
    void loadBranches(customerId).catch((e) => setError(e instanceof Error ? e.message : "拠点読込失敗"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerId, loginId]);

  useEffect(() => {
    void loadContacts(branchId).catch((e) => setError(e instanceof Error ? e.message : "担当者読込失敗"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branchId, loginId]);

  useEffect(() => {
    setContactEditId(null);
    setContactViewId(null);
    setShowNewContactForm(false);
  }, [branchId]);

  useEffect(() => {
    void loadBillingInfos(customerId).catch((e) =>
      setError(e instanceof Error ? e.message : "請求情報読込失敗"),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerId, loginId]);

  useEffect(() => {
    void loadDestinations().catch((e) => setError(e instanceof Error ? e.message : "納品先読込失敗"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loginId]);

  async function saveCustomer() {
    if (!selectedCustomer) return;
    const updated = await clientApi(`/api/customers/${selectedCustomer.id}`, {
      method: "PATCH",
      body: JSON.stringify({
        organizationName: selectedCustomer.organization_name,
        isActive: selectedCustomer.is_active,
        version: selectedCustomer.version,
      }),
    });
    setCustomers((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    setBasicEditing(false);
  }

  async function createBranch() {
    if (!customerId) return;
    await clientApi("/api/customer-branches", {
      method: "POST",
      body: JSON.stringify({
        customerId,
        departmentName: newBranch.departmentName,
        postalCode: newBranch.postalCode,
        prefecture: newBranch.prefecture,
        city: newBranch.city,
        addressLine: newBranch.addressLine,
        phone: newBranch.phone,
        email: newBranch.email,
        yayoiCode: newBranch.yayoiCode,
        closingDay: newBranch.closingDay,
        paymentDay: newBranch.paymentDay,
        otherCode: newBranch.otherCode,
      }),
    });
    setNewBranch({
      departmentName: "",
      postalCode: "",
      prefecture: "",
      city: "",
      addressLine: "",
      phone: "",
      email: "",
      yayoiCode: "",
      closingDay: "",
      paymentDay: "",
      otherCode: "",
    });
    setShowNewBranchForm(false);
    await loadBranches(customerId);
  }

  async function saveBranch() {
    if (!selectedBranch) return;
    const updated = await clientApi(`/api/customer-branches/${selectedBranch.id}`, {
      method: "PATCH",
      body: JSON.stringify({
        version: selectedBranch.version,
        departmentName: selectedBranch.department_name ?? "",
        postalCode: selectedBranch.postal_code ?? "",
        prefecture: selectedBranch.prefecture ?? "",
        city: selectedBranch.city ?? "",
        addressLine: selectedBranch.address_line ?? "",
        phone: selectedBranch.phone ?? "",
        email: selectedBranch.email ?? "",
        yayoiCode: selectedBranch.yayoi_code ?? "",
        closingDay: selectedBranch.closing_day ?? "",
        paymentDay: selectedBranch.payment_day ?? "",
        otherCode: selectedBranch.other_code ?? "",
      }),
    });
    setBranches((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
    setBranchEditId(null);
  }

  function patchBranch(editId: string, patch: Partial<Branch>) {
    setBranches((prev) => prev.map((b) => (b.id === editId ? { ...b, ...patch } : b)));
  }

  async function createContact() {
    if (!branchId) return;
    await clientApi("/api/customer-contacts", {
      method: "POST",
      body: JSON.stringify({
        customerBranchId: branchId,
        companyName: newContact.companyName,
        positionName: newContact.positionName,
        phone: newContact.phone,
        email: newContact.email,
      }),
    });
    setNewContact({ companyName: "", positionName: "", phone: "", email: "" });
    setShowNewContactForm(false);
    await loadContacts(branchId);
  }

  async function saveContact() {
    if (!selectedContact) return;
    const updated = await clientApi(`/api/customer-contacts/${selectedContact.id}`, {
      method: "PATCH",
      body: JSON.stringify({
        version: selectedContact.version,
        companyName: selectedContact.company_name ?? "",
        positionName: selectedContact.position_name ?? "",
        phone: selectedContact.phone ?? "",
        email: selectedContact.email ?? "",
      }),
    });
    setContacts((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    setContactEditId(null);
  }

  function patchContact(editId: string, patch: Partial<Contact>) {
    setContacts((prev) => prev.map((c) => (c.id === editId ? { ...c, ...patch } : c)));
  }

  async function createBilling() {
    if (!customerId || !newBilling.billingName.trim()) return;
    await clientApi("/api/billing-infos", {
      method: "POST",
      body: JSON.stringify({
        customerId,
        billingName: newBilling.billingName,
        billingContactName: newBilling.billingContactName,
        postalCode: newBilling.postalCode,
        prefecture: newBilling.prefecture,
        city: newBilling.city,
        addressLine: newBilling.addressLine,
        phone: newBilling.phone,
        email: newBilling.email,
      }),
    });
    setNewBilling({
      billingName: "",
      billingContactName: "",
      postalCode: "",
      prefecture: "",
      city: "",
      addressLine: "",
      phone: "",
      email: "",
    });
    setShowNewBillingForm(false);
    await loadBillingInfos(customerId);
  }

  async function saveBilling() {
    if (!selectedBilling) return;
    const updated = await clientApi(`/api/billing-infos/${selectedBilling.id}`,
      {
        method: "PATCH",
        body: JSON.stringify({
          version: selectedBilling.version,
          billingName: selectedBilling.billing_name,
          billingContactName: selectedBilling.billing_contact_name ?? "",
          postalCode: selectedBilling.postal_code ?? "",
          prefecture: selectedBilling.prefecture ?? "",
          city: selectedBilling.city ?? "",
          addressLine: selectedBilling.address_line ?? "",
          phone: selectedBilling.phone ?? "",
          email: selectedBilling.email ?? "",
        }),
      },
    );
    setBillingInfos((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
    setBillingEditId(null);
  }

  function patchBilling(editId: string, patch: Partial<BillingInfo>) {
    setBillingInfos((prev) => prev.map((b) => (b.id === editId ? { ...b, ...patch } : b)));
  }

  async function createDestination() {
    if (!newDestination.name.trim()) return;
    await clientApi("/api/delivery-destinations", {
      method: "POST",
      body: JSON.stringify({
        destinationName: newDestination.name,
        postalCode: newDestination.postalCode,
        prefecture: newDestination.prefecture,
        city: newDestination.city,
        addressLine: newDestination.addressLine,
        phone: newDestination.phone,
        email: newDestination.email,
      }),
    });
    setNewDestination({
      name: "",
      postalCode: "",
      prefecture: "",
      city: "",
      addressLine: "",
      phone: "",
      email: "",
    });
    setShowNewDestinationForm(false);
    await loadDestinations();
  }

  async function saveDestination() {
    if (!selectedDestination) return;
    const updated = await clientApi(`/api/delivery-destinations/${selectedDestination.id}`, {
      method: "PATCH",
      body: JSON.stringify({
        version: selectedDestination.version,
        destinationName: selectedDestination.destination_name,
        postalCode: selectedDestination.postal_code ?? "",
        prefecture: selectedDestination.prefecture ?? "",
        city: selectedDestination.city ?? "",
        addressLine: selectedDestination.address_line ?? "",
        phone: selectedDestination.phone ?? "",
        email: selectedDestination.email ?? "",
      }),
    });
    setDestinations((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
    setDestinationEditId(null);
  }

  function patchDestination(editId: string, patch: Partial<DeliveryDestination>) {
    setDestinations((prev) => prev.map((d) => (d.id === editId ? { ...d, ...patch } : d)));
  }

  return (
    <section className="screen">
      <div className="screen-head">
        <h2 className="screen-title">顧客管理</h2>
        {!selectedCustomer ? (
          <ScreenToolbar searchValue={listQuery} onSearchChange={setListQuery}>
            <Link href="/customers/new" className="btn btn-positive">
              新規追加
            </Link>
          </ScreenToolbar>
        ) : null}
      </div>
      {error ? <div className="error-box">{error}</div> : null}

      {selectedCustomer ? (
        <>
          <div className="create-bar">
            <button
              className="btn btn-detail"
              type="button"
              onClick={() => {
                resetTabPanels();
                setBasicEditing(false);
                setCustomerId("");
                setBranchId("");
              }}
            >
              一覧へ戻る
            </button>
          </div>
          <p className="detail-summary">{selectedCustomer.organization_name}</p>
          <div className="tab-strip" role="tablist" aria-label="顧客詳細の区分">
            <button
              type="button"
              role="tab"
              aria-selected={customerTab === "basic"}
              onClick={() => setCustomerTab("basic")}
            >
              基本
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={customerTab === "branches"}
              onClick={() => setCustomerTab("branches")}
            >
              拠点
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={customerTab === "contacts"}
              onClick={() => setCustomerTab("contacts")}
            >
              担当者
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={customerTab === "billing"}
              onClick={() => setCustomerTab("billing")}
            >
              請求
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={customerTab === "destinations"}
              onClick={() => setCustomerTab("destinations")}
            >
              納品先
            </button>
          </div>

          {customerTab === "basic" ? (
            <div className="sub-block">
              {!basicEditing ? (
                <div className="detail-readonly-block">
                  <p>
                    <strong>会社名</strong> {selectedCustomer.organization_name}
                  </p>
                  <p>
                    <strong>有効</strong> {selectedCustomer.is_active ? "はい" : "いいえ"}
                  </p>
                  <button
                    type="button"
                    className="btn btn-detail"
                    onClick={() => setBasicEditing(true)}
                  >
                    編集
                  </button>
                </div>
              ) : (
                <div className="detail-form">
                  <label>
                    会社名（団体名）
                    <input
                      value={selectedCustomer.organization_name}
                      onChange={(e) =>
                        setCustomers((prev) =>
                          prev.map((c) =>
                            c.id === customerId ? { ...c, organization_name: e.target.value } : c,
                          ),
                        )
                      }
                    />
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      checked={selectedCustomer.is_active}
                      onChange={(e) =>
                        setCustomers((prev) =>
                          prev.map((c) =>
                            c.id === customerId ? { ...c, is_active: e.target.checked } : c,
                          ),
                        )
                      }
                    />
                    有効
                  </label>
                  <div className="form-actions-row">
                    <button className="btn btn-positive" type="button" onClick={() => void saveCustomer()}>
                      保存
                    </button>
                    <button
                      type="button"
                      className="btn btn-detail"
                      onClick={() => {
                        setBasicEditing(false);
                        void loadCustomers().catch((e) =>
                          setError(e instanceof Error ? e.message : "読込失敗"),
                        );
                      }}
                    >
                      キャンセル
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : null}

          {customerTab === "branches" ? (
          <div className="sub-block">
            <div className="tab-panel-toolbar tab-panel-toolbar--end">
              <button
                type="button"
                className="btn btn-positive"
                onClick={() => {
                  setShowNewBranchForm(true);
                  setBranchViewId(null);
                  setBranchEditId(null);
                }}
              >
                新規追加
              </button>
            </div>
            {showNewBranchForm ? (
            <div className="detail-form">
              <p>拠点の新規登録</p>
              <label>
                顧客部署名（任意）
                <input
                  value={newBranch.departmentName}
                  onChange={(e) => setNewBranch((p) => ({ ...p, departmentName: e.target.value }))}
                />
              </label>
              <label>
                郵便番号
                <input
                  value={newBranch.postalCode}
                  onChange={(e) => setNewBranch((p) => ({ ...p, postalCode: e.target.value }))}
                />
              </label>
              <label>
                都道府県
                <input
                  value={newBranch.prefecture}
                  onChange={(e) => setNewBranch((p) => ({ ...p, prefecture: e.target.value }))}
                />
              </label>
              <label>
                市区町村
                <input
                  value={newBranch.city}
                  onChange={(e) => setNewBranch((p) => ({ ...p, city: e.target.value }))}
                />
              </label>
              <label>
                以下住所
                <input
                  value={newBranch.addressLine}
                  onChange={(e) => setNewBranch((p) => ({ ...p, addressLine: e.target.value }))}
                />
              </label>
              <label>
                代表電話
                <input
                  value={newBranch.phone}
                  onChange={(e) => setNewBranch((p) => ({ ...p, phone: e.target.value }))}
                />
              </label>
              <label>
                代表メール
                <input
                  value={newBranch.email}
                  onChange={(e) => setNewBranch((p) => ({ ...p, email: e.target.value }))}
                />
              </label>
              <label>
                弥生販売コード
                <input
                  value={newBranch.yayoiCode}
                  onChange={(e) => setNewBranch((p) => ({ ...p, yayoiCode: e.target.value }))}
                />
              </label>
              <label>
                締日
                <input
                  type="number"
                  value={newBranch.closingDay}
                  onChange={(e) => setNewBranch((p) => ({ ...p, closingDay: e.target.value }))}
                />
              </label>
              <label>
                支払日
                <input
                  type="number"
                  value={newBranch.paymentDay}
                  onChange={(e) => setNewBranch((p) => ({ ...p, paymentDay: e.target.value }))}
                />
              </label>
              <label>
                他コード
                <input
                  value={newBranch.otherCode}
                  onChange={(e) => setNewBranch((p) => ({ ...p, otherCode: e.target.value }))}
                />
              </label>
              <div className="form-actions-row">
                <button className="btn btn-positive" type="button" onClick={() => void createBranch()}>
                  登録
                </button>
                <button
                  type="button"
                  className="btn btn-detail"
                  onClick={() => setShowNewBranchForm(false)}
                >
                  閉じる
                </button>
              </div>
            </div>
            ) : null}
            <table className="spec-table spec-table--list">
              <thead>
                <tr>
                  <th className="col-actions">操作</th>
                  <th>部署</th>
                  <th>都道府県</th>
                  <th>市区町村</th>
                  <th>住所</th>
                  <th>版</th>
                </tr>
              </thead>
              <tbody>
                {branchPageRows.map((row) => (
                  <tr key={row.id}>
                    <td className="table-actions-cell">
                      <div className="table-actions">
                        <button
                          type="button"
                          className="btn btn-detail btn-sm"
                          onClick={() => {
                            setBranchViewId(row.id);
                            setBranchEditId(null);
                            setShowNewBranchForm(false);
                          }}
                        >
                          詳細
                        </button>
                        <button
                          type="button"
                          className="btn btn-detail btn-sm"
                          onClick={() => {
                            setBranchEditId(row.id);
                            setBranchViewId(null);
                            setShowNewBranchForm(false);
                          }}
                        >
                          編集
                        </button>
                      </div>
                    </td>
                    <td>{row.department_name ?? "-"}</td>
                    <td>{row.prefecture ?? "-"}</td>
                    <td>{row.city ?? "-"}</td>
                    <td>{row.address_line ?? "-"}</td>
                    <td>{row.version}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <ListPaginationBar
              page={branchPage}
              totalPages={branchTotalPages}
              totalCount={branchTotal}
              rangeStart={branchRangeStart}
              rangeEnd={branchRangeEnd}
              setPage={setBranchPage}
            />
            {viewingBranch ? (
              <div className="detail-readonly-block" style={{ marginTop: 12 }}>
                <p>
                  <strong>顧客部署名</strong> {viewingBranch.department_name ?? "—"}
                </p>
                <p>
                  <strong>住所</strong>{" "}
                  {[viewingBranch.prefecture, viewingBranch.city, viewingBranch.address_line]
                    .filter(Boolean)
                    .join(" ") || "—"}
                </p>
                <p>
                  <strong>電話</strong> {viewingBranch.phone ?? "—"}
                </p>
                <p>
                  <strong>メール</strong> {viewingBranch.email ?? "—"}
                </p>
                <p>
                  <strong>版</strong> {viewingBranch.version}
                </p>
                <button type="button" className="btn btn-detail" onClick={() => setBranchViewId(null)}>
                  閉じる
                </button>
              </div>
            ) : null}
            {selectedBranch ? (
              <div className="detail-form" style={{ marginTop: 8 }}>
                <p>拠点の編集</p>
                <label>
                  顧客部署名（任意）
                  <input
                    value={selectedBranch.department_name ?? ""}
                    onChange={(e) =>
                      patchBranch(selectedBranch.id, { department_name: e.target.value || null })
                    }
                  />
                </label>
                <label>
                  郵便番号
                  <input
                    value={selectedBranch.postal_code ?? ""}
                    onChange={(e) => patchBranch(selectedBranch.id, { postal_code: e.target.value })}
                  />
                </label>
                <label>
                  都道府県
                  <input
                    value={selectedBranch.prefecture ?? ""}
                    onChange={(e) => patchBranch(selectedBranch.id, { prefecture: e.target.value })}
                  />
                </label>
                <label>
                  市区町村
                  <input
                    value={selectedBranch.city ?? ""}
                    onChange={(e) => patchBranch(selectedBranch.id, { city: e.target.value })}
                  />
                </label>
                <label>
                  以下住所
                  <input
                    value={selectedBranch.address_line ?? ""}
                    onChange={(e) => patchBranch(selectedBranch.id, { address_line: e.target.value })}
                  />
                </label>
                <label>
                  代表電話
                  <input
                    value={selectedBranch.phone ?? ""}
                    onChange={(e) => patchBranch(selectedBranch.id, { phone: e.target.value })}
                  />
                </label>
                <label>
                  代表メール
                  <input
                    value={selectedBranch.email ?? ""}
                    onChange={(e) => patchBranch(selectedBranch.id, { email: e.target.value })}
                  />
                </label>
                <label>
                  弥生販売コード
                  <input
                    value={selectedBranch.yayoi_code ?? ""}
                    onChange={(e) => patchBranch(selectedBranch.id, { yayoi_code: e.target.value })}
                  />
                </label>
                <label>
                  締日
                  <input
                    type="number"
                    value={selectedBranch.closing_day ?? ""}
                    onChange={(e) =>
                      patchBranch(selectedBranch.id, {
                        closing_day: e.target.value === "" ? null : Number(e.target.value),
                      })
                    }
                  />
                </label>
                <label>
                  支払日
                  <input
                    type="number"
                    value={selectedBranch.payment_day ?? ""}
                    onChange={(e) =>
                      patchBranch(selectedBranch.id, {
                        payment_day: e.target.value === "" ? null : Number(e.target.value),
                      })
                    }
                  />
                </label>
                <label>
                  他コード
                  <input
                    value={selectedBranch.other_code ?? ""}
                    onChange={(e) => patchBranch(selectedBranch.id, { other_code: e.target.value })}
                  />
                </label>
                <div className="form-actions-row">
                  <button className="btn btn-positive" type="button" onClick={() => void saveBranch()}>
                    保存
                  </button>
                  <button
                    type="button"
                    className="btn btn-detail"
                    onClick={() => {
                      setBranchEditId(null);
                      void loadBranches(customerId).catch((e) =>
                        setError(e instanceof Error ? e.message : "拠点読込失敗"),
                      );
                    }}
                  >
                    キャンセル
                  </button>
                </div>
              </div>
            ) : null}
          </div>
          ) : null}

          {customerTab === "contacts" ? (
          <div className="sub-block">
            <div className="customer-select-field">
              <label className="customer-select-field__label" htmlFor="customer-branch-for-contacts">
                担当者を表示する拠点
              </label>
              <div className="customer-select-field__wrap">
                <select
                  id="customer-branch-for-contacts"
                  className="customer-select-field__control"
                  value={branchId}
                  onChange={(e) => setBranchId(e.target.value)}
                  disabled={branches.length === 0}
                  aria-label="担当者一覧を表示する顧客拠点を選択"
                >
                  <option value="">▼ 拠点を選択してください</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {[b.department_name, b.city, b.prefecture].filter(Boolean).join(" / ") ||
                        `${b.id.slice(0, 8)}…`}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {!branchId ? (
              <p className="detail-summary">
                拠点を選択してください。拠点がない場合は「拠点」タブで登録してください。
              </p>
            ) : null}
            <div className="tab-panel-toolbar tab-panel-toolbar--end">
              <button
                type="button"
                className="btn btn-positive"
                disabled={!branchId}
                onClick={() => {
                  setShowNewContactForm(true);
                  setContactViewId(null);
                  setContactEditId(null);
                }}
              >
                新規追加
              </button>
            </div>
            {branchId && showNewContactForm ? (
            <div className="detail-form">
              <p>担当者の新規登録</p>
              <label>
                担当者名
                <input
                  value={newContact.companyName}
                  onChange={(e) => setNewContact((p) => ({ ...p, companyName: e.target.value }))}
                />
              </label>
              <label>
                役職
                <input
                  value={newContact.positionName}
                  onChange={(e) => setNewContact((p) => ({ ...p, positionName: e.target.value }))}
                />
              </label>
              <label>
                電話
                <input
                  value={newContact.phone}
                  onChange={(e) => setNewContact((p) => ({ ...p, phone: e.target.value }))}
                />
              </label>
              <label>
                メール
                <input
                  value={newContact.email}
                  onChange={(e) => setNewContact((p) => ({ ...p, email: e.target.value }))}
                />
              </label>
              <div className="form-actions-row">
                <button className="btn btn-positive" type="button" onClick={() => void createContact()}>
                  登録
                </button>
                <button
                  type="button"
                  className="btn btn-detail"
                  onClick={() => setShowNewContactForm(false)}
                >
                  閉じる
                </button>
              </div>
            </div>
            ) : null}
            {branchId ? (
            <>
            <table className="spec-table spec-table--list">
              <thead>
                <tr>
                  <th className="col-actions">操作</th>
                  <th>担当者名</th>
                  <th>役職</th>
                  <th>電話</th>
                  <th>メール</th>
                </tr>
              </thead>
              <tbody>
                {contactPageRows.map((row) => (
                  <tr key={row.id}>
                    <td className="table-actions-cell">
                      <div className="table-actions">
                        <button
                          type="button"
                          className="btn btn-detail btn-sm"
                          onClick={() => {
                            setContactViewId(row.id);
                            setContactEditId(null);
                            setShowNewContactForm(false);
                          }}
                        >
                          詳細
                        </button>
                        <button
                          type="button"
                          className="btn btn-detail btn-sm"
                          onClick={() => {
                            setContactEditId(row.id);
                            setContactViewId(null);
                            setShowNewContactForm(false);
                          }}
                        >
                          編集
                        </button>
                      </div>
                    </td>
                    <td>{row.company_name ?? "-"}</td>
                    <td>{row.position_name ?? "-"}</td>
                    <td>{row.phone ?? "-"}</td>
                    <td>{row.email ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <ListPaginationBar
              page={contactPage}
              totalPages={contactTotalPages}
              totalCount={contactTotal}
              rangeStart={contactRangeStart}
              rangeEnd={contactRangeEnd}
              setPage={setContactPage}
            />
            </>
            ) : null}
            {viewingContact ? (
              <div className="detail-readonly-block" style={{ marginTop: 12 }}>
                <p>
                  <strong>担当者名</strong> {viewingContact.company_name ?? "—"}
                </p>
                <p>
                  <strong>役職</strong> {viewingContact.position_name ?? "—"}
                </p>
                <p>
                  <strong>電話</strong> {viewingContact.phone ?? "—"}
                </p>
                <p>
                  <strong>メール</strong> {viewingContact.email ?? "—"}
                </p>
                <button type="button" className="btn btn-detail" onClick={() => setContactViewId(null)}>
                  閉じる
                </button>
              </div>
            ) : null}
            {selectedContact ? (
              <div className="detail-form" style={{ marginTop: 8 }}>
                <p>担当者の編集</p>
                <label>
                  担当者名
                  <input
                    value={selectedContact.company_name ?? ""}
                    onChange={(e) =>
                      patchContact(selectedContact.id, { company_name: e.target.value })
                    }
                  />
                </label>
                <label>
                  役職
                  <input
                    value={selectedContact.position_name ?? ""}
                    onChange={(e) =>
                      patchContact(selectedContact.id, { position_name: e.target.value })
                    }
                  />
                </label>
                <label>
                  電話
                  <input
                    value={selectedContact.phone ?? ""}
                    onChange={(e) => patchContact(selectedContact.id, { phone: e.target.value })}
                  />
                </label>
                <label>
                  メール
                  <input
                    value={selectedContact.email ?? ""}
                    onChange={(e) => patchContact(selectedContact.id, { email: e.target.value })}
                  />
                </label>
                <div className="form-actions-row">
                  <button className="btn btn-positive" type="button" onClick={() => void saveContact()}>
                    保存
                  </button>
                  <button
                    type="button"
                    className="btn btn-detail"
                    onClick={() => {
                      setContactEditId(null);
                      void loadContacts(branchId).catch((e) =>
                        setError(e instanceof Error ? e.message : "担当者読込失敗"),
                      );
                    }}
                  >
                    キャンセル
                  </button>
                </div>
              </div>
            ) : null}
          </div>
          ) : null}

          {customerTab === "billing" ? (
          <div className="sub-block">
            <div className="tab-panel-toolbar tab-panel-toolbar--end">
              <button
                type="button"
                className="btn btn-positive"
                onClick={() => {
                  setShowNewBillingForm(true);
                  setBillingViewId(null);
                  setBillingEditId(null);
                }}
              >
                新規追加
              </button>
            </div>
            {showNewBillingForm ? (
            <div className="detail-form">
              <p>請求先の新規登録</p>
              <label>
                請求宛名
                <input
                  value={newBilling.billingName}
                  onChange={(e) => setNewBilling((p) => ({ ...p, billingName: e.target.value }))}
                />
              </label>
              <label>
                請求先担当者名
                <input
                  value={newBilling.billingContactName}
                  onChange={(e) =>
                    setNewBilling((p) => ({ ...p, billingContactName: e.target.value }))
                  }
                />
              </label>
              <label>
                郵便番号
                <input
                  value={newBilling.postalCode}
                  onChange={(e) => setNewBilling((p) => ({ ...p, postalCode: e.target.value }))}
                />
              </label>
              <label>
                都道府県
                <input
                  value={newBilling.prefecture}
                  onChange={(e) => setNewBilling((p) => ({ ...p, prefecture: e.target.value }))}
                />
              </label>
              <label>
                市区町村
                <input
                  value={newBilling.city}
                  onChange={(e) => setNewBilling((p) => ({ ...p, city: e.target.value }))}
                />
              </label>
              <label>
                以下住所
                <input
                  value={newBilling.addressLine}
                  onChange={(e) => setNewBilling((p) => ({ ...p, addressLine: e.target.value }))}
                />
              </label>
              <label>
                請求先電話
                <input
                  value={newBilling.phone}
                  onChange={(e) => setNewBilling((p) => ({ ...p, phone: e.target.value }))}
                />
              </label>
              <label>
                請求先メール
                <input
                  value={newBilling.email}
                  onChange={(e) => setNewBilling((p) => ({ ...p, email: e.target.value }))}
                />
              </label>
              <div className="form-actions-row">
                <button className="btn btn-positive" type="button" onClick={() => void createBilling()}>
                  登録
                </button>
                <button
                  type="button"
                  className="btn btn-detail"
                  onClick={() => setShowNewBillingForm(false)}
                >
                  閉じる
                </button>
              </div>
            </div>
            ) : null}
            <table className="spec-table spec-table--list">
              <thead>
                <tr>
                  <th className="col-actions">操作</th>
                  <th>請求宛名</th>
                  <th>請求担当</th>
                  <th>市区町村</th>
                  <th>版</th>
                </tr>
              </thead>
              <tbody>
                {billingPageRows.map((row) => (
                  <tr key={row.id}>
                    <td className="table-actions-cell">
                      <div className="table-actions">
                        <button
                          type="button"
                          className="btn btn-detail btn-sm"
                          onClick={() => {
                            setBillingViewId(row.id);
                            setBillingEditId(null);
                            setShowNewBillingForm(false);
                          }}
                        >
                          詳細
                        </button>
                        <button
                          type="button"
                          className="btn btn-detail btn-sm"
                          onClick={() => {
                            setBillingEditId(row.id);
                            setBillingViewId(null);
                            setShowNewBillingForm(false);
                          }}
                        >
                          編集
                        </button>
                      </div>
                    </td>
                    <td>{row.billing_name}</td>
                    <td>{row.billing_contact_name ?? "-"}</td>
                    <td>{row.city ?? "-"}</td>
                    <td>{row.version}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <ListPaginationBar
              page={billingPage}
              totalPages={billingTotalPages}
              totalCount={billingListTotal}
              rangeStart={billingRangeStart}
              rangeEnd={billingRangeEnd}
              setPage={setBillingListPage}
            />
            {viewingBilling ? (
              <div className="detail-readonly-block" style={{ marginTop: 12 }}>
                <p>
                  <strong>請求宛名</strong> {viewingBilling.billing_name}
                </p>
                <p>
                  <strong>請求先担当者名</strong> {viewingBilling.billing_contact_name ?? "—"}
                </p>
                <p>
                  <strong>住所</strong>{" "}
                  {[viewingBilling.postal_code, viewingBilling.prefecture, viewingBilling.city, viewingBilling.address_line]
                    .filter(Boolean)
                    .join(" ") || "—"}
                </p>
                <p>
                  <strong>電話</strong> {viewingBilling.phone ?? "—"}
                </p>
                <p>
                  <strong>メール</strong> {viewingBilling.email ?? "—"}
                </p>
                <p>
                  <strong>版</strong> {viewingBilling.version}
                </p>
                <button type="button" className="btn btn-detail" onClick={() => setBillingViewId(null)}>
                  閉じる
                </button>
              </div>
            ) : null}
            {selectedBilling ? (
              <div className="detail-form" style={{ marginTop: 8 }}>
                <p>請求先の編集</p>
                <label>
                  請求宛名
                  <input
                    value={selectedBilling.billing_name}
                    onChange={(e) =>
                      patchBilling(selectedBilling.id, { billing_name: e.target.value })
                    }
                  />
                </label>
                <label>
                  請求先担当者名
                  <input
                    value={selectedBilling.billing_contact_name ?? ""}
                    onChange={(e) =>
                      patchBilling(selectedBilling.id, { billing_contact_name: e.target.value })
                    }
                  />
                </label>
                <label>
                  郵便番号
                  <input
                    value={selectedBilling.postal_code ?? ""}
                    onChange={(e) => patchBilling(selectedBilling.id, { postal_code: e.target.value })}
                  />
                </label>
                <label>
                  都道府県
                  <input
                    value={selectedBilling.prefecture ?? ""}
                    onChange={(e) => patchBilling(selectedBilling.id, { prefecture: e.target.value })}
                  />
                </label>
                <label>
                  市区町村
                  <input
                    value={selectedBilling.city ?? ""}
                    onChange={(e) => patchBilling(selectedBilling.id, { city: e.target.value })}
                  />
                </label>
                <label>
                  以下住所
                  <input
                    value={selectedBilling.address_line ?? ""}
                    onChange={(e) =>
                      patchBilling(selectedBilling.id, { address_line: e.target.value })
                    }
                  />
                </label>
                <label>
                  請求先電話
                  <input
                    value={selectedBilling.phone ?? ""}
                    onChange={(e) => patchBilling(selectedBilling.id, { phone: e.target.value })}
                  />
                </label>
                <label>
                  請求先メール
                  <input
                    value={selectedBilling.email ?? ""}
                    onChange={(e) => patchBilling(selectedBilling.id, { email: e.target.value })}
                  />
                </label>
                <div className="form-actions-row">
                  <button className="btn btn-positive" type="button" onClick={() => void saveBilling()}>
                    保存
                  </button>
                  <button
                    type="button"
                    className="btn btn-detail"
                    onClick={() => {
                      setBillingEditId(null);
                      void loadBillingInfos(customerId).catch((e) =>
                        setError(e instanceof Error ? e.message : "請求情報読込失敗"),
                      );
                    }}
                  >
                    キャンセル
                  </button>
                </div>
              </div>
            ) : null}
          </div>
          ) : null}

          {customerTab === "destinations" ? (
          <>
          <p className="detail-summary">
            納品先マスタは全件共通です（「納品先管理」と同じ一覧）。
          </p>
          <div className="sub-block">
            <div className="tab-panel-toolbar tab-panel-toolbar--end">
              <button
                type="button"
                className="btn btn-positive"
                onClick={() => {
                  setShowNewDestinationForm(true);
                  setDestinationViewId(null);
                  setDestinationEditId(null);
                }}
              >
                新規追加
              </button>
            </div>
            {showNewDestinationForm ? (
            <div className="detail-form">
              <p>納品先の新規登録</p>
              <label>
                納品先名
                <input
                  value={newDestination.name}
                  onChange={(e) => setNewDestination((p) => ({ ...p, name: e.target.value }))}
                />
              </label>
              <label>
                郵便番号
                <input
                  value={newDestination.postalCode}
                  onChange={(e) => setNewDestination((p) => ({ ...p, postalCode: e.target.value }))}
                />
              </label>
              <label>
                都道府県
                <input
                  value={newDestination.prefecture}
                  onChange={(e) => setNewDestination((p) => ({ ...p, prefecture: e.target.value }))}
                />
              </label>
              <label>
                市区町村
                <input
                  value={newDestination.city}
                  onChange={(e) => setNewDestination((p) => ({ ...p, city: e.target.value }))}
                />
              </label>
              <label>
                以下住所
                <input
                  value={newDestination.addressLine}
                  onChange={(e) => setNewDestination((p) => ({ ...p, addressLine: e.target.value }))}
                />
              </label>
              <label>
                納品先電話
                <input
                  value={newDestination.phone}
                  onChange={(e) => setNewDestination((p) => ({ ...p, phone: e.target.value }))}
                />
              </label>
              <label>
                納品先メール
                <input
                  value={newDestination.email}
                  onChange={(e) => setNewDestination((p) => ({ ...p, email: e.target.value }))}
                />
              </label>
              <div className="form-actions-row">
                <button
                  className="btn btn-positive"
                  type="button"
                  onClick={() => void createDestination()}
                >
                  登録
                </button>
                <button
                  type="button"
                  className="btn btn-detail"
                  onClick={() => setShowNewDestinationForm(false)}
                >
                  閉じる
                </button>
              </div>
            </div>
            ) : null}
            <table className="spec-table spec-table--list">
              <thead>
                <tr>
                  <th className="col-actions">操作</th>
                  <th>納品先名</th>
                  <th>市区町村</th>
                  <th>電話</th>
                  <th>版</th>
                </tr>
              </thead>
              <tbody>
                {destinationPageRows.map((row) => (
                  <tr key={row.id}>
                    <td className="table-actions-cell">
                      <div className="table-actions">
                        <button
                          type="button"
                          className="btn btn-detail btn-sm"
                          onClick={() => {
                            setDestinationViewId(row.id);
                            setDestinationEditId(null);
                            setShowNewDestinationForm(false);
                          }}
                        >
                          詳細
                        </button>
                        <button
                          type="button"
                          className="btn btn-detail btn-sm"
                          onClick={() => {
                            setDestinationEditId(row.id);
                            setDestinationViewId(null);
                            setShowNewDestinationForm(false);
                          }}
                        >
                          編集
                        </button>
                      </div>
                    </td>
                    <td>{row.destination_name}</td>
                    <td>{row.city ?? "-"}</td>
                    <td>{row.phone ?? "-"}</td>
                    <td>{row.version}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <ListPaginationBar
              page={destinationPage}
              totalPages={destinationTotalPages}
              totalCount={destinationListTotal}
              rangeStart={destinationRangeStart}
              rangeEnd={destinationRangeEnd}
              setPage={setDestinationListPage}
            />
            {viewingDestination ? (
              <div className="detail-readonly-block" style={{ marginTop: 12 }}>
                <p>
                  <strong>納品先名</strong> {viewingDestination.destination_name}
                </p>
                <p>
                  <strong>住所</strong>{" "}
                  {[
                    viewingDestination.postal_code,
                    viewingDestination.prefecture,
                    viewingDestination.city,
                    viewingDestination.address_line,
                  ]
                    .filter(Boolean)
                    .join(" ") || "—"}
                </p>
                <p>
                  <strong>電話</strong> {viewingDestination.phone ?? "—"}
                </p>
                <p>
                  <strong>メール</strong> {viewingDestination.email ?? "—"}
                </p>
                <p>
                  <strong>版</strong> {viewingDestination.version}
                </p>
                <button type="button" className="btn btn-detail" onClick={() => setDestinationViewId(null)}>
                  閉じる
                </button>
              </div>
            ) : null}
            {selectedDestination ? (
              <div className="detail-form" style={{ marginTop: 8 }}>
                <p>納品先の編集</p>
                <label>
                  納品先名
                  <input
                    value={selectedDestination.destination_name}
                    onChange={(e) =>
                      patchDestination(selectedDestination.id, {
                        destination_name: e.target.value,
                      })
                    }
                  />
                </label>
                <label>
                  郵便番号
                  <input
                    value={selectedDestination.postal_code ?? ""}
                    onChange={(e) =>
                      patchDestination(selectedDestination.id, { postal_code: e.target.value })
                    }
                  />
                </label>
                <label>
                  都道府県
                  <input
                    value={selectedDestination.prefecture ?? ""}
                    onChange={(e) =>
                      patchDestination(selectedDestination.id, { prefecture: e.target.value })
                    }
                  />
                </label>
                <label>
                  市区町村
                  <input
                    value={selectedDestination.city ?? ""}
                    onChange={(e) => patchDestination(selectedDestination.id, { city: e.target.value })}
                  />
                </label>
                <label>
                  以下住所
                  <input
                    value={selectedDestination.address_line ?? ""}
                    onChange={(e) =>
                      patchDestination(selectedDestination.id, { address_line: e.target.value })
                    }
                  />
                </label>
                <label>
                  納品先電話
                  <input
                    value={selectedDestination.phone ?? ""}
                    onChange={(e) => patchDestination(selectedDestination.id, { phone: e.target.value })}
                  />
                </label>
                <label>
                  納品先メール
                  <input
                    value={selectedDestination.email ?? ""}
                    onChange={(e) => patchDestination(selectedDestination.id, { email: e.target.value })}
                  />
                </label>
                <div className="form-actions-row">
                  <button className="btn btn-positive" type="button" onClick={() => void saveDestination()}>
                    保存
                  </button>
                  <button
                    type="button"
                    className="btn btn-detail"
                    onClick={() => {
                      setDestinationEditId(null);
                      void loadDestinations().catch((e) =>
                        setError(e instanceof Error ? e.message : "納品先読込失敗"),
                      );
                    }}
                  >
                    キャンセル
                  </button>
                </div>
              </div>
            ) : null}
          </div>
          </>
          ) : null}
        </>
      ) : (
        <div className="list-panel">
          <table className="spec-table spec-table--list">
            <thead>
              <tr>
                <th className="col-actions">操作</th>
                <th>会社名</th>
                <th>有効</th>
                <th>版</th>
              </tr>
            </thead>
            <tbody>
              {customerPageRows.map((row) => (
                <tr key={row.id}>
                  <td className="table-actions-cell">
                    <div className="table-actions">
                      <button
                        type="button"
                        className="btn btn-detail btn-sm"
                        onClick={() => openCustomerDetail(row.id, { basicEditing: false })}
                      >
                        詳細
                      </button>
                      <button
                        type="button"
                        className="btn btn-detail btn-sm"
                        onClick={() => openCustomerDetail(row.id, { basicEditing: true })}
                      >
                        編集
                      </button>
                    </div>
                  </td>
                  <td>{row.organization_name}</td>
                  <td>{row.is_active ? "有効" : "無効"}</td>
                  <td>{row.version}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <ListPaginationBar
            page={customerPage}
            totalPages={customerTotalPages}
            totalCount={customerTotal}
            rangeStart={customerRangeStart}
            rangeEnd={customerRangeEnd}
            setPage={setCustomerPage}
          />
        </div>
      )}
    </section>
  );
}
