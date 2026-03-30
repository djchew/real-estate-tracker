"use client";

import { useState } from "react";
import { Tenant, createTenant, updateTenant, deleteTenant } from "@/lib/api";
import { fmt$, fmtDate, capitalize } from "@/lib/utils";
import { Plus, Trash2, Users, Pencil } from "lucide-react";

interface Props {
  propertyId: string;
  initialTenants: Tenant[];
}

const blank = {
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  unit: "",
  rent_amount: "",
  lease_start: "",
  lease_end: "",
  status: "active",
  security_deposit: "",
  notes: "",
};

const statusColors: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-700",
  past: "bg-gray-100 text-gray-500",
  prospective: "bg-blue-100 text-blue-700",
};

export default function TenantsPanel({ propertyId, initialTenants }: Props) {
  const [tenants, setTenants] = useState(initialTenants);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState(blank);
  const [saving, setSaving] = useState(false);

  function set(k: keyof typeof form, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function startEdit(t: Tenant) {
    setEditing(t.id);
    setForm({
      first_name: t.first_name,
      last_name: t.last_name,
      email: t.email ?? "",
      phone: t.phone ?? "",
      unit: t.unit ?? "",
      rent_amount: t.rent_amount.toString(),
      lease_start: t.lease_start,
      lease_end: t.lease_end ?? "",
      status: t.status,
      security_deposit: t.security_deposit?.toString() ?? "",
      notes: t.notes ?? "",
    });
    setAdding(false);
  }

  function buildPayload() {
    const data: Record<string, unknown> = {
      property_id: propertyId,
      first_name: form.first_name,
      last_name: form.last_name,
      rent_amount: parseFloat(form.rent_amount),
      lease_start: form.lease_start,
      status: form.status,
    };
    if (form.email) data.email = form.email;
    if (form.phone) data.phone = form.phone;
    if (form.unit) data.unit = form.unit;
    if (form.lease_end) data.lease_end = form.lease_end;
    if (form.security_deposit) data.security_deposit = parseFloat(form.security_deposit);
    if (form.notes) data.notes = form.notes;
    return data;
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const created = await createTenant(buildPayload());
      setTenants((t) => [...t, created]);
      setAdding(false);
      setForm(blank);
    } finally {
      setSaving(false);
    }
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    try {
      const updated = await updateTenant(editing, buildPayload());
      setTenants((ts) => ts.map((t) => (t.id === editing ? updated : t)));
      setEditing(null);
      setForm(blank);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    await deleteTenant(id);
    setTenants((ts) => ts.filter((t) => t.id !== id));
  }

  const showForm = adding || editing !== null;

  return (
    <div className="bg-white rounded-2xl border border-stone-100 shadow-sm">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-gray-400" />
          <h2 className="text-sm font-semibold text-gray-700">Tenants</h2>
        </div>
        <button
          onClick={() => { setAdding((v) => !v); setEditing(null); setForm(blank); }}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-600 hover:text-amber-700"
        >
          <Plus className="h-3.5 w-3.5" />
          Add
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={editing ? handleEdit : handleAdd}
          className="p-5 border-b border-gray-100 grid grid-cols-2 sm:grid-cols-3 gap-3"
        >
          {[
            { label: "First Name", key: "first_name", required: true },
            { label: "Last Name", key: "last_name", required: true },
            { label: "Email", key: "email", type: "email" },
            { label: "Phone", key: "phone" },
            { label: "Unit", key: "unit", placeholder: "e.g. Unit 2A" },
            { label: "Monthly Rent", key: "rent_amount", type: "number", required: true },
            { label: "Security Deposit", key: "security_deposit", type: "number" },
            { label: "Lease Start", key: "lease_start", type: "date", required: true },
            { label: "Lease End", key: "lease_end", type: "date" },
          ].map(({ label: lbl, key, type, required, placeholder }) => (
            <div key={key}>
              <label className="block text-xs font-medium text-gray-500 mb-1">{lbl}</label>
              <input
                type={type ?? "text"}
                required={required}
                placeholder={placeholder}
                step={type === "number" ? "any" : undefined}
                value={form[key as keyof typeof form]}
                onChange={(e) => set(key as keyof typeof form, e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          ))}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
            <select
              value={form.status}
              onChange={(e) => set("status", e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              {["active", "past", "prospective"].map((s) => (
                <option key={s} value={s}>{capitalize(s)}</option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-3 flex gap-2">
            <button type="submit" disabled={saving} className="px-4 py-1.5 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 disabled:opacity-50">
              {saving ? "Saving…" : editing ? "Update" : "Add Tenant"}
            </button>
            <button type="button" onClick={() => { setAdding(false); setEditing(null); setForm(blank); }} className="px-3 py-1.5 border border-gray-300 text-gray-600 text-sm rounded-lg hover:bg-gray-50">
              Cancel
            </button>
          </div>
        </form>
      )}

      {tenants.length === 0 && !showForm ? (
        <p className="px-5 py-4 text-sm text-gray-400">No tenants recorded.</p>
      ) : (
        <ul className="divide-y divide-gray-50">
          {tenants.map((t) => (
            <li key={t.id} className="px-5 py-4 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-sm text-gray-800">
                    {t.first_name} {t.last_name}
                    {t.unit && <span className="text-gray-400"> · {t.unit}</span>}
                  </p>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${statusColors[t.status] ?? ""}`}>
                    {capitalize(t.status)}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-0.5">
                  {t.email}{t.email && t.phone && " · "}{t.phone}
                </p>
                <p className="text-xs text-gray-400">
                  Lease: {fmtDate(t.lease_start)}{t.lease_end ? ` → ${fmtDate(t.lease_end)}` : " (month-to-month)"}
                </p>
              </div>
              <div className="flex items-center gap-4 shrink-0">
                <div className="text-right">
                  <p className="text-xs text-gray-400">Rent</p>
                  <p className="font-semibold text-sm">{fmt$(t.rent_amount)}/mo</p>
                </div>
                <button onClick={() => startEdit(t)} className="text-gray-300 hover:text-amber-500 transition-colors">
                  <Pencil className="h-4 w-4" />
                </button>
                <button onClick={() => handleDelete(t.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
