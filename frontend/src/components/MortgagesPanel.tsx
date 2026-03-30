"use client";

import { useState } from "react";
import { Mortgage, createMortgage, deleteMortgage } from "@/lib/api";
import { fmt$, fmtPct, fmtDate } from "@/lib/utils";
import { Plus, Trash2, CreditCard } from "lucide-react";

interface Props {
  propertyId: string;
  initialMortgages: Mortgage[];
}

const LOAN_TYPES = [
  "conventional", "fha", "va", "usda", "jumbo", "adjustable", "interest_only", "other",
];

function label(s: string) {
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

const blank = {
  lender: "",
  loan_type: "conventional",
  original_amount: "",
  current_balance: "",
  interest_rate: "",
  monthly_payment: "",
  start_date: "",
  term_months: "360",
  is_primary: true,
};

export default function MortgagesPanel({ propertyId, initialMortgages }: Props) {
  const [mortgages, setMortgages] = useState(initialMortgages);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(blank);
  const [saving, setSaving] = useState(false);

  function set(k: keyof typeof form, v: string | boolean) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const created = await createMortgage({
        property_id: propertyId,
        lender: form.lender,
        loan_type: form.loan_type,
        original_amount: parseFloat(form.original_amount as string),
        current_balance: parseFloat(form.current_balance as string),
        interest_rate: parseFloat(form.interest_rate as string) / 100,
        monthly_payment: parseFloat(form.monthly_payment as string),
        start_date: form.start_date,
        term_months: parseInt(form.term_months as string),
        is_primary: form.is_primary as boolean,
      });
      setMortgages((m) => [...m, created]);
      setAdding(false);
      setForm(blank);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    await deleteMortgage(id);
    setMortgages((m) => m.filter((x) => x.id !== id));
  }

  return (
    <div className="bg-white rounded-2xl border border-stone-100 shadow-sm">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-gray-400" />
          <h2 className="text-sm font-semibold text-gray-700">Mortgages</h2>
        </div>
        <button
          onClick={() => setAdding((v) => !v)}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-600 hover:text-amber-700"
        >
          <Plus className="h-3.5 w-3.5" />
          Add
        </button>
      </div>

      {adding && (
        <form onSubmit={handleAdd} className="p-5 border-b border-gray-100 grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { label: "Lender", key: "lender", type: "text", required: true },
            { label: "Original Amount", key: "original_amount", type: "number", required: true },
            { label: "Current Balance", key: "current_balance", type: "number", required: true },
            { label: "Interest Rate (%)", key: "interest_rate", type: "number", required: true, step: "0.001" },
            { label: "Monthly Payment", key: "monthly_payment", type: "number", required: true },
            { label: "Start Date", key: "start_date", type: "date", required: true },
            { label: "Term (months)", key: "term_months", type: "number", required: true },
          ].map(({ label: lbl, key, type, required, step }) => (
            <div key={key}>
              <label className="block text-xs font-medium text-gray-500 mb-1">{lbl}</label>
              <input
                type={type}
                required={required}
                step={step ?? (type === "number" ? "any" : undefined)}
                value={form[key as keyof typeof form] as string}
                onChange={(e) => set(key as keyof typeof form, e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          ))}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Loan Type</label>
            <select
              value={form.loan_type}
              onChange={(e) => set("loan_type", e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              {LOAN_TYPES.map((t) => <option key={t} value={t}>{label(t)}</option>)}
            </select>
          </div>
          <div className="sm:col-span-3 flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_primary as boolean}
                onChange={(e) => set("is_primary", e.target.checked)}
                className="rounded"
              />
              Primary mortgage
            </label>
            <button type="submit" disabled={saving} className="ml-auto px-4 py-1.5 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 disabled:opacity-50">
              {saving ? "Saving…" : "Save"}
            </button>
            <button type="button" onClick={() => { setAdding(false); setForm(blank); }} className="px-3 py-1.5 border border-gray-300 text-gray-600 text-sm rounded-lg hover:bg-gray-50">
              Cancel
            </button>
          </div>
        </form>
      )}

      {mortgages.length === 0 && !adding ? (
        <p className="px-5 py-4 text-sm text-gray-400">No mortgages recorded.</p>
      ) : (
        <ul className="divide-y divide-gray-50">
          {mortgages.map((m) => (
            <li key={m.id} className="px-5 py-4 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-sm text-gray-800">{m.lender}</p>
                  {m.is_primary && (
                    <span className="text-xs bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded">Primary</span>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-0.5">
                  {label(m.loan_type)} · {fmtPct(m.interest_rate)} · {m.term_months / 12}yr · Started {fmtDate(m.start_date)}
                </p>
              </div>
              <div className="flex items-center gap-6 shrink-0 text-sm">
                <div className="text-right">
                  <p className="text-xs text-gray-400">Balance</p>
                  <p className="font-semibold">{fmt$(m.current_balance)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400">Monthly</p>
                  <p className="font-semibold">{fmt$(m.monthly_payment)}</p>
                </div>
                <button onClick={() => handleDelete(m.id)} className="text-gray-300 hover:text-red-500 transition-colors">
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
