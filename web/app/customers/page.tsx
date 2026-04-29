"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ScreenToolbar } from "@/app/_components/screen-toolbar";
import { useAppContext } from "@/app/_components/app-context";
import { clientApi } from "@/lib/client-api";
import { rowMatchesSearch } from "@/lib/list-search";

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
  const [contactId, setContactId] = useState("");
  const [billingId, setBillingId] = useState("");
  const [customerTab, setCustomerTab] = useState<CustomerTabKey>("basic");

  const [newBranch, setNewBranch] = useState({
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

  const selectedCustomer = useMemo(
    () => customers.find((row) => row.id === customerId) ?? null,
    [customers, customerId],
  );
  const selectedBranch = useMemo(
    () => branches.find((row) => row.id === branchId) ?? null,
    [branches, branchId],
  );
  const selectedContact = useMemo(
    () => contacts.find((row) => row.id === contactId) ?? null,
    [contacts, contactId],
  );
  const selectedBilling = useMemo(
    () => billingInfos.find((row) => row.id === billingId) ?? null,
    [billingInfos, billingId],
  );

  async function loadCustomers() {
    const data = await clientApi<Customer[]>(loginId, "/api/customers");
    setCustomers(data);
    if (customerId && !data.some((row) => row.id === customerId)) {
      setCustomerId("");
      setBranchId("");
    }
  }

  async function loadBranches(selectedCustomerId: string) {
    if (!selectedCustomerId) return setBranches([]);
    const data = await clientApi<Branch[]>(
      loginId,
      `/api/customer-branches?customerId=${selectedCustomerId}`,
    );
    setBranches(data);
    if (data[0]) setBranchId(data[0].id);
    else setBranchId("");
  }

  async function loadContacts(selectedBranchId: string) {
    if (!selectedBranchId) return setContacts([]);
    const data = await clientApi<Contact[]>(
      loginId,
      `/api/customer-contacts?customerBranchId=${selectedBranchId}`,
    );
    setContacts(data);
    setContactId("");
  }

  async function loadBillingInfos(selectedCustomerId: string) {
    if (!selectedCustomerId) return setBillingInfos([]);
    const data = await clientApi<BillingInfo[]>(
      loginId,
      `/api/billing-infos?customerId=${selectedCustomerId}`,
    );
    setBillingInfos(data);
    setBillingId("");
  }

  async function loadDestinations() {
    const data = await clientApi<DeliveryDestination[]>(loginId, "/api/delivery-destinations");
    setDestinations(data);
  }

  useEffect(() => {
    setCustomerTab("basic");
  }, [customerId]);

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
    const updated = await clientApi<Customer>(loginId, `/api/customers/${selectedCustomer.id}`, {
      method: "PATCH",
      body: JSON.stringify({
        organizationName: selectedCustomer.organization_name,
        departmentName: selectedCustomer.department_name ?? "",
        isActive: selectedCustomer.is_active,
        version: selectedCustomer.version,
      }),
    });
    setCustomers((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
  }

  async function createBranch() {
    if (!customerId) return;
    await clientApi(loginId, "/api/customer-branches", {
      method: "POST",
      body: JSON.stringify({
        customerId,
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
    await loadBranches(customerId);
  }

  async function saveBranch() {
    if (!selectedBranch) return;
    const updated = await clientApi<Branch>(loginId, `/api/customer-branches/${selectedBranch.id}`, {
      method: "PATCH",
      body: JSON.stringify({
        version: selectedBranch.version,
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
  }

  function patchBranch(patch: Partial<Branch>) {
    setBranches((prev) => prev.map((b) => (b.id === branchId ? { ...b, ...patch } : b)));
  }

  async function createContact() {
    if (!branchId) return;
    await clientApi(loginId, "/api/customer-contacts", {
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
    await loadContacts(branchId);
  }

  async function saveContact() {
    if (!selectedContact) return;
    const updated = await clientApi<Contact>(loginId, `/api/customer-contacts/${selectedContact.id}`, {
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
  }

  function patchContact(patch: Partial<Contact>) {
    setContacts((prev) => prev.map((c) => (c.id === contactId ? { ...c, ...patch } : c)));
  }

  async function createBilling() {
    if (!customerId || !newBilling.billingName.trim()) return;
    await clientApi(loginId, "/api/billing-infos", {
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
    await loadBillingInfos(customerId);
  }

  async function saveBilling() {
    if (!selectedBilling) return;
    const updated = await clientApi<BillingInfo>(
      loginId,
      `/api/billing-infos/${selectedBilling.id}`,
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
  }

  function patchBilling(patch: Partial<BillingInfo>) {
    setBillingInfos((prev) => prev.map((b) => (b.id === billingId ? { ...b, ...patch } : b)));
  }

  async function createDestination() {
    if (!newDestination.name.trim()) return;
    await clientApi(loginId, "/api/delivery-destinations", {
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
    await loadDestinations();
  }

  return (
    <section className="screen">
      <div className="screen-head">
        <h2 className="screen-title">顧客管理</h2>
        {!selectedCustomer ? (
          <ScreenToolbar searchValue={listQuery} onSearchChange={setListQuery}>
            <Link href="/customers/new" className="btn btn-positive">
              新規作成
            </Link>
          </ScreenToolbar>
        ) : null}
      </div>
      {error ? <div className="error-box">{error}</div> : null}

      {selectedCustomer ? (
        <>
          <div className="tab-panel-toolbar">
            <button
              className="btn btn-detail"
              type="button"
              onClick={() => {
                setCustomerId("");
                setBranchId("");
              }}
            >
              一覧へ戻る
            </button>
          </div>
          <p className="detail-summary">
            {selectedCustomer.organization_name}
            {selectedCustomer.department_name
              ? `（${selectedCustomer.department_name}）`
              : ""}
          </p>
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
          <div className="detail-form">
            <label>
              顧客団体名
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
              顧客部署名
              <input
                value={selectedCustomer.department_name ?? ""}
                onChange={(e) =>
                  setCustomers((prev) =>
                    prev.map((c) =>
                      c.id === customerId ? { ...c, department_name: e.target.value } : c,
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
            <button className="btn btn-positive" type="button" onClick={() => void saveCustomer()}>
              顧客ヘッダ保存
            </button>
          </div>
          ) : null}

          {customerTab === "branches" ? (
          <div className="sub-block">
            <div className="detail-form">
              <p>新規拠点</p>
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
              <button className="btn btn-positive" type="button" onClick={() => void createBranch()}>
                拠点追加
              </button>
            </div>
            <table className="spec-table">
              <thead>
                <tr>
                  <th>都道府県</th>
                  <th>市区町村</th>
                  <th>住所</th>
                  <th>版</th>
                </tr>
              </thead>
              <tbody>
                {branches.map((row) => (
                  <tr
                    key={row.id}
                    className={row.id === branchId ? "active-row" : ""}
                    onClick={() => setBranchId(row.id)}
                  >
                    <td>{row.prefecture ?? "-"}</td>
                    <td>{row.city ?? "-"}</td>
                    <td>{row.address_line ?? "-"}</td>
                    <td>{row.version}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {selectedBranch ? (
              <div className="detail-form" style={{ marginTop: 8 }}>
                <p>選択中の拠点を編集</p>
                <label>
                  郵便番号
                  <input
                    value={selectedBranch.postal_code ?? ""}
                    onChange={(e) => patchBranch({ postal_code: e.target.value })}
                  />
                </label>
                <label>
                  都道府県
                  <input
                    value={selectedBranch.prefecture ?? ""}
                    onChange={(e) => patchBranch({ prefecture: e.target.value })}
                  />
                </label>
                <label>
                  市区町村
                  <input
                    value={selectedBranch.city ?? ""}
                    onChange={(e) => patchBranch({ city: e.target.value })}
                  />
                </label>
                <label>
                  以下住所
                  <input
                    value={selectedBranch.address_line ?? ""}
                    onChange={(e) => patchBranch({ address_line: e.target.value })}
                  />
                </label>
                <label>
                  代表電話
                  <input
                    value={selectedBranch.phone ?? ""}
                    onChange={(e) => patchBranch({ phone: e.target.value })}
                  />
                </label>
                <label>
                  代表メール
                  <input
                    value={selectedBranch.email ?? ""}
                    onChange={(e) => patchBranch({ email: e.target.value })}
                  />
                </label>
                <label>
                  弥生販売コード
                  <input
                    value={selectedBranch.yayoi_code ?? ""}
                    onChange={(e) => patchBranch({ yayoi_code: e.target.value })}
                  />
                </label>
                <label>
                  締日
                  <input
                    type="number"
                    value={selectedBranch.closing_day ?? ""}
                    onChange={(e) =>
                      patchBranch({
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
                      patchBranch({
                        payment_day: e.target.value === "" ? null : Number(e.target.value),
                      })
                    }
                  />
                </label>
                <label>
                  他コード
                  <input
                    value={selectedBranch.other_code ?? ""}
                    onChange={(e) => patchBranch({ other_code: e.target.value })}
                  />
                </label>
                <button className="btn btn-positive" type="button" onClick={() => void saveBranch()}>
                  拠点保存
                </button>
              </div>
            ) : null}
          </div>
          ) : null}

          {customerTab === "contacts" ? (
          <div className="sub-block">
            {!branchId ? (
              <p className="detail-summary">
                担当者は拠点に紐づきます。拠点が未登録の場合は「拠点」タブから追加してください。登録済みの場合は「拠点」タブで行を選択してからここで編集してください。
              </p>
            ) : null}
            <div className="detail-form">
              <p>新規担当者</p>
              <label>
                会社名
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
              <button className="btn btn-positive" type="button" onClick={() => void createContact()}>
                担当者追加
              </button>
            </div>
            <table className="spec-table">
              <thead>
                <tr>
                  <th>会社名</th>
                  <th>役職</th>
                  <th>電話</th>
                  <th>メール</th>
                  <th>選択</th>
                </tr>
              </thead>
              <tbody>
                {contacts.map((row) => (
                  <tr key={row.id} className={row.id === contactId ? "active-row" : ""}>
                    <td>{row.company_name ?? "-"}</td>
                    <td>{row.position_name ?? "-"}</td>
                    <td>{row.phone ?? "-"}</td>
                    <td>{row.email ?? "-"}</td>
                    <td>
                      <button type="button" className="btn btn-detail" onClick={() => setContactId(row.id)}>
                        編集
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {selectedContact ? (
              <div className="detail-form" style={{ marginTop: 8 }}>
                <label>
                  会社名
                  <input
                    value={selectedContact.company_name ?? ""}
                    onChange={(e) => patchContact({ company_name: e.target.value })}
                  />
                </label>
                <label>
                  役職
                  <input
                    value={selectedContact.position_name ?? ""}
                    onChange={(e) => patchContact({ position_name: e.target.value })}
                  />
                </label>
                <label>
                  電話
                  <input
                    value={selectedContact.phone ?? ""}
                    onChange={(e) => patchContact({ phone: e.target.value })}
                  />
                </label>
                <label>
                  メール
                  <input
                    value={selectedContact.email ?? ""}
                    onChange={(e) => patchContact({ email: e.target.value })}
                  />
                </label>
                <button className="btn btn-positive" type="button" onClick={() => void saveContact()}>
                  担当者保存
                </button>
              </div>
            ) : null}
          </div>
          ) : null}

          {customerTab === "billing" ? (
          <div className="sub-block">
            <div className="detail-form">
              <p>新規請求先</p>
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
              <button className="btn btn-positive" type="button" onClick={() => void createBilling()}>
                請求情報追加
              </button>
            </div>
            <table className="spec-table">
              <thead>
                <tr>
                  <th>請求宛名</th>
                  <th>請求担当</th>
                  <th>市区町村</th>
                  <th>版</th>
                  <th>選択</th>
                </tr>
              </thead>
              <tbody>
                {billingInfos.map((row) => (
                  <tr key={row.id} className={row.id === billingId ? "active-row" : ""}>
                    <td>{row.billing_name}</td>
                    <td>{row.billing_contact_name ?? "-"}</td>
                    <td>{row.city ?? "-"}</td>
                    <td>{row.version}</td>
                    <td>
                      <button type="button" className="btn btn-detail" onClick={() => setBillingId(row.id)}>
                        編集
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {selectedBilling ? (
              <div className="detail-form" style={{ marginTop: 8 }}>
                <label>
                  請求宛名
                  <input
                    value={selectedBilling.billing_name}
                    onChange={(e) => patchBilling({ billing_name: e.target.value })}
                  />
                </label>
                <label>
                  請求先担当者名
                  <input
                    value={selectedBilling.billing_contact_name ?? ""}
                    onChange={(e) => patchBilling({ billing_contact_name: e.target.value })}
                  />
                </label>
                <label>
                  郵便番号
                  <input
                    value={selectedBilling.postal_code ?? ""}
                    onChange={(e) => patchBilling({ postal_code: e.target.value })}
                  />
                </label>
                <label>
                  都道府県
                  <input
                    value={selectedBilling.prefecture ?? ""}
                    onChange={(e) => patchBilling({ prefecture: e.target.value })}
                  />
                </label>
                <label>
                  市区町村
                  <input
                    value={selectedBilling.city ?? ""}
                    onChange={(e) => patchBilling({ city: e.target.value })}
                  />
                </label>
                <label>
                  以下住所
                  <input
                    value={selectedBilling.address_line ?? ""}
                    onChange={(e) => patchBilling({ address_line: e.target.value })}
                  />
                </label>
                <label>
                  請求先電話
                  <input
                    value={selectedBilling.phone ?? ""}
                    onChange={(e) => patchBilling({ phone: e.target.value })}
                  />
                </label>
                <label>
                  請求先メール
                  <input
                    value={selectedBilling.email ?? ""}
                    onChange={(e) => patchBilling({ email: e.target.value })}
                  />
                </label>
                <button className="btn btn-positive" type="button" onClick={() => void saveBilling()}>
                  請求情報保存
                </button>
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
            <div className="detail-form">
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
              <button
                className="btn btn-positive"
                type="button"
                onClick={() => void createDestination()}
              >
                納品先追加
              </button>
            </div>
            <table className="spec-table">
              <thead>
                <tr>
                  <th>納品先名</th>
                  <th>市区町村</th>
                  <th>電話</th>
                  <th>版</th>
                </tr>
              </thead>
              <tbody>
                {destinations.map((row) => (
                  <tr key={row.id}>
                    <td>{row.destination_name}</td>
                    <td>{row.city ?? "-"}</td>
                    <td>{row.phone ?? "-"}</td>
                    <td>{row.version}</td>
                  </tr>
              ))}
            </tbody>
          </table>
          </div>
          </>
          ) : null}
        </>
      ) : (
        <div className="list-panel">
          <table className="spec-table">
            <thead>
              <tr>
                <th>団体名</th>
                <th>部署</th>
                <th>有効</th>
                <th>版</th>
                <th>詳細</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map((row) => (
                <tr key={row.id}>
                  <td>{row.organization_name}</td>
                  <td>{row.department_name ?? "-"}</td>
                  <td>{row.is_active ? "有効" : "無効"}</td>
                  <td>{row.version}</td>
                  <td>
                    <button className="btn btn-detail" onClick={() => setCustomerId(row.id)}>
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
