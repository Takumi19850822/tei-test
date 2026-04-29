"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useMemo, useState } from "react";
import { useAppContext } from "@/app/_components/app-context";
import { clientApi } from "@/lib/client-api";

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
  prefecture: string | null;
  city: string | null;
  address_line: string | null;
  version: number;
};
type Contact = {
  id: string;
  customer_branch_id: string;
  company_name: string | null;
  position_name: string | null;
  phone: string | null;
};
type BillingInfo = {
  id: string;
  billing_name: string;
  billing_contact_name: string | null;
  version: number;
};
type DeliveryDestination = {
  id: string;
  destination_name: string;
  city: string | null;
  version: number;
};

export default function CustomersPage() {
  const { loginId } = useAppContext();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [billingInfos, setBillingInfos] = useState<BillingInfo[]>([]);
  const [destinations, setDestinations] = useState<DeliveryDestination[]>([]);
  const [customerId, setCustomerId] = useState("");
  const [branchId, setBranchId] = useState("");
  const [newCustomer, setNewCustomer] = useState("");
  const [newBranchCity, setNewBranchCity] = useState("");
  const [newContactCompany, setNewContactCompany] = useState("");
  const [newBillingName, setNewBillingName] = useState("");
  const [newDestinationName, setNewDestinationName] = useState("");
  const [error, setError] = useState("");

  const selectedCustomer = useMemo(
    () => customers.find((row) => row.id === customerId) ?? null,
    [customers, customerId],
  );

  async function loadCustomers() {
    const data = await clientApi<Customer[]>(loginId, "/api/customers");
    setCustomers(data);
    if (data[0] && !customerId) setCustomerId(data[0].id);
  }

  async function loadBranches(selectedCustomerId: string) {
    if (!selectedCustomerId) return setBranches([]);
    const data = await clientApi<Branch[]>(
      loginId,
      `/api/customer-branches?customerId=${selectedCustomerId}`,
    );
    setBranches(data);
    if (data[0] && !branchId) setBranchId(data[0].id);
  }

  async function loadContacts(selectedBranchId: string) {
    if (!selectedBranchId) return setContacts([]);
    const data = await clientApi<Contact[]>(
      loginId,
      `/api/customer-contacts?customerBranchId=${selectedBranchId}`,
    );
    setContacts(data);
  }

  async function loadBillingInfos(selectedCustomerId: string) {
    if (!selectedCustomerId) return setBillingInfos([]);
    const data = await clientApi<BillingInfo[]>(
      loginId,
      `/api/billing-infos?customerId=${selectedCustomerId}`,
    );
    setBillingInfos(data);
  }

  async function loadDestinations() {
    const data = await clientApi<DeliveryDestination[]>(loginId, "/api/delivery-destinations");
    setDestinations(data);
  }

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

  async function createCustomer() {
    if (!newCustomer.trim()) return;
    await clientApi(loginId, "/api/customers", {
      method: "POST",
      body: JSON.stringify({ organizationName: newCustomer }),
    });
    setNewCustomer("");
    await loadCustomers();
  }

  async function createBranch() {
    if (!customerId || !newBranchCity.trim()) return;
    await clientApi(loginId, "/api/customer-branches", {
      method: "POST",
      body: JSON.stringify({ customerId, city: newBranchCity }),
    });
    setNewBranchCity("");
    await loadBranches(customerId);
  }

  async function createContact() {
    if (!branchId || !newContactCompany.trim()) return;
    await clientApi(loginId, "/api/customer-contacts", {
      method: "POST",
      body: JSON.stringify({ customerBranchId: branchId, companyName: newContactCompany }),
    });
    setNewContactCompany("");
    await loadContacts(branchId);
  }

  async function createBilling() {
    if (!customerId || !newBillingName.trim()) return;
    await clientApi(loginId, "/api/billing-infos", {
      method: "POST",
      body: JSON.stringify({ customerId, billingName: newBillingName }),
    });
    setNewBillingName("");
    await loadBillingInfos(customerId);
  }

  async function createDestination() {
    if (!newDestinationName.trim()) return;
    await clientApi(loginId, "/api/delivery-destinations", {
      method: "POST",
      body: JSON.stringify({ destinationName: newDestinationName }),
    });
    setNewDestinationName("");
    await loadDestinations();
  }

  return (
    <section className="screen">
      <h2 className="screen-title">顧客管理</h2>
      {error ? <div className="error-box">{error}</div> : null}

      <div className="list-detail">
        <div className="list-panel">
          <div className="create-bar">
            <input
              placeholder="顧客団体名"
              value={newCustomer}
              onChange={(e) => setNewCustomer(e.target.value)}
            />
            <button className="btn btn-positive" onClick={() => void createCustomer()}>
              新規作成
            </button>
          </div>
          <table className="spec-table">
            <thead><tr><th>団体名</th><th>部署</th><th>有効</th><th>版</th></tr></thead>
            <tbody>
              {customers.map((row) => (
                <tr
                  key={row.id}
                  className={row.id === customerId ? "active-row" : ""}
                  onClick={() => setCustomerId(row.id)}
                >
                  <td>{row.organization_name}</td>
                  <td>{row.department_name ?? "-"}</td>
                  <td>{row.is_active ? "有効" : "無効"}</td>
                  <td>{row.version}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="detail-panel">
          <h3>詳細</h3>
          {selectedCustomer ? (
            <>
              <p className="detail-title">{selectedCustomer.organization_name}</p>
              <div className="sub-block">
                <h4>拠点一覧</h4>
                <div className="create-bar">
                  <input
                    placeholder="市区町村"
                    value={newBranchCity}
                    onChange={(e) => setNewBranchCity(e.target.value)}
                  />
                  <button className="btn btn-positive" onClick={() => void createBranch()}>
                    拠点追加
                  </button>
                </div>
                <table className="spec-table">
                  <thead><tr><th>都道府県</th><th>市区町村</th><th>住所</th><th>版</th></tr></thead>
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
              </div>

              <div className="sub-block">
                <h4>担当者一覧</h4>
                <div className="create-bar">
                  <input
                    placeholder="会社名"
                    value={newContactCompany}
                    onChange={(e) => setNewContactCompany(e.target.value)}
                  />
                  <button className="btn btn-positive" onClick={() => void createContact()}>
                    担当者追加
                  </button>
                </div>
                <table className="spec-table">
                  <thead><tr><th>会社名</th><th>役職</th><th>電話</th></tr></thead>
                  <tbody>
                    {contacts.map((row) => (
                      <tr key={row.id}>
                        <td>{row.company_name ?? "-"}</td>
                        <td>{row.position_name ?? "-"}</td>
                        <td>{row.phone ?? "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="sub-block">
                <h4>請求情報</h4>
                <div className="create-bar">
                  <input
                    placeholder="請求宛名"
                    value={newBillingName}
                    onChange={(e) => setNewBillingName(e.target.value)}
                  />
                  <button className="btn btn-positive" onClick={() => void createBilling()}>
                    請求情報追加
                  </button>
                </div>
                <table className="spec-table">
                  <thead><tr><th>請求宛名</th><th>請求担当</th><th>版</th></tr></thead>
                  <tbody>
                    {billingInfos.map((row) => (
                      <tr key={row.id}>
                        <td>{row.billing_name}</td>
                        <td>{row.billing_contact_name ?? "-"}</td>
                        <td>{row.version}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="sub-block">
                <h4>納品先</h4>
                <div className="create-bar">
                  <input
                    placeholder="納品先名"
                    value={newDestinationName}
                    onChange={(e) => setNewDestinationName(e.target.value)}
                  />
                  <button className="btn btn-positive" onClick={() => void createDestination()}>
                    納品先追加
                  </button>
                </div>
                <table className="spec-table">
                  <thead><tr><th>納品先名</th><th>市区町村</th><th>版</th></tr></thead>
                  <tbody>
                    {destinations.map((row) => (
                      <tr key={row.id}>
                        <td>{row.destination_name}</td>
                        <td>{row.city ?? "-"}</td>
                        <td>{row.version}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <p>一覧から顧客を選択してください。</p>
          )}
        </div>
      </div>
    </section>
  );
}
