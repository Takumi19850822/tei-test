"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAppContext } from "@/app/_components/app-context";
import { clientApi } from "@/lib/client-api";

export default function NewDeliveryDestinationPage() {
  const { loginId } = useAppContext();
  const router = useRouter();
  const [form, setForm] = useState({
    destinationName: "",
    postalCode: "",
    prefecture: "",
    city: "",
    addressLine: "",
    phone: "",
    email: "",
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (!form.destinationName.trim()) return;
    setSaving(true);
    setError("");
    try {
      await clientApi(loginId, "/api/delivery-destinations", {
        method: "POST",
        body: JSON.stringify({
          destinationName: form.destinationName.trim(),
          postalCode: form.postalCode,
          prefecture: form.prefecture,
          city: form.city,
          addressLine: form.addressLine,
          phone: form.phone,
          email: form.email,
        }),
      });
      router.push("/delivery-destinations");
    } catch (e) {
      setError(e instanceof Error ? e.message : "作成失敗");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="screen">
      <h2 className="screen-title">納品先管理　新規作成</h2>
      {error ? <div className="error-box">{error}</div> : null}
      <div className="create-bar">
        <Link href="/delivery-destinations" className="btn btn-detail">
          一覧へ戻る
        </Link>
      </div>
      <div className="detail-form">
        <label>
          納品先名
          <input
            value={form.destinationName}
            onChange={(e) => setForm((p) => ({ ...p, destinationName: e.target.value }))}
          />
        </label>
        <label>
          郵便番号
          <input
            value={form.postalCode}
            onChange={(e) => setForm((p) => ({ ...p, postalCode: e.target.value }))}
          />
        </label>
        <label>
          都道府県
          <input
            value={form.prefecture}
            onChange={(e) => setForm((p) => ({ ...p, prefecture: e.target.value }))}
          />
        </label>
        <label>
          市区町村
          <input value={form.city} onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))} />
        </label>
        <label>
          住所
          <input
            value={form.addressLine}
            onChange={(e) => setForm((p) => ({ ...p, addressLine: e.target.value }))}
          />
        </label>
        <label>
          電話
          <input value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} />
        </label>
        <label>
          メール
          <input value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} />
        </label>
        <button type="button" className="btn btn-positive" disabled={saving} onClick={() => void submit()}>
          保存
        </button>
      </div>
    </section>
  );
}
