"use client";

import { useState } from "react";
import {
  IncomeRecord,
  ExpenseRecord,
  createIncome,
  deleteIncome,
  createExpense,
  deleteExpense,
} from "@/lib/api";
import { fmt$, fmtDate, capitalize } from "@/lib/utils";
import { Plus, Trash2, DollarSign, TrendingDown, TrendingUp } from "lucide-react";

interface Props {
  propertyId: string;
  initialIncome: IncomeRecord[];
  initialExpenses: ExpenseRecord[];
}

const INCOME_CATEGORIES = ["rent", "late_fee", "parking", "laundry", "storage", "pet_fee", "other"];
const EXPENSE_CATEGORIES = [
  "mortgage", "property_tax", "insurance", "hoa", "repair", "maintenance",
  "management_fee", "utilities", "landscaping", "cleaning",
  "legal", "accounting", "advertising", "other",
];

export default function FinancialsPanel({ propertyId, initialIncome, initialExpenses }: Props) {
  const [tab, setTab] = useState<"income" | "expenses">("income");
  const [income, setIncome] = useState(initialIncome);
  const [expenses, setExpenses] = useState(initialExpenses);
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);

  const [incomeForm, setIncomeForm] = useState({
    category: "rent",
    amount: "",
    date: "",
    description: "",
  });
  const [expenseForm, setExpenseForm] = useState({
    category: "mortgage",
    amount: "",
    date: "",
    vendor: "",
    description: "",
    is_recurring: false,
  });

  const totalIncome = income.reduce((s, r) => s + r.amount, 0);
  const totalExpenses = expenses.reduce((s, r) => s + r.amount, 0);
  const cashFlow = totalIncome - totalExpenses;

  async function handleAddIncome(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const created = await createIncome({
        property_id: propertyId,
        category: incomeForm.category,
        amount: parseFloat(incomeForm.amount),
        date: incomeForm.date,
        description: incomeForm.description || undefined,
      });
      setIncome((r) => [created, ...r]);
      setAdding(false);
      setIncomeForm({ category: "rent", amount: "", date: "", description: "" });
    } finally {
      setSaving(false);
    }
  }

  async function handleAddExpense(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const created = await createExpense({
        property_id: propertyId,
        category: expenseForm.category,
        amount: parseFloat(expenseForm.amount),
        date: expenseForm.date,
        vendor: expenseForm.vendor || undefined,
        description: expenseForm.description || undefined,
        is_recurring: expenseForm.is_recurring,
      });
      setExpenses((r) => [created, ...r]);
      setAdding(false);
      setExpenseForm({ category: "mortgage", amount: "", date: "", vendor: "", description: "", is_recurring: false });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-stone-100 shadow-sm">
      <div className="px-5 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-gray-400" />
            <h2 className="text-sm font-semibold text-gray-700">Financials</h2>
          </div>
          <button
            onClick={() => setAdding((v) => !v)}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-600 hover:text-amber-700"
          >
            <Plus className="h-3.5 w-3.5" />
            Add
          </button>
        </div>

        {/* Summary row */}
        <div className="flex gap-6 text-sm">
          <div className="flex items-center gap-1.5">
            <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
            <span className="text-gray-500">Income</span>
            <span className="font-semibold text-emerald-600">{fmt$(totalIncome)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <TrendingDown className="h-3.5 w-3.5 text-rose-500" />
            <span className="text-gray-500">Expenses</span>
            <span className="font-semibold text-rose-600">{fmt$(totalExpenses)}</span>
          </div>
          <div className="flex items-center gap-1.5 ml-auto">
            <span className="text-gray-500">Net</span>
            <span className={`font-bold ${cashFlow >= 0 ? "text-emerald-600" : "text-red-600"}`}>
              {fmt$(cashFlow)}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-100">
        {(["income", "expenses"] as const).map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); setAdding(false); }}
            className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === t
                ? "border-amber-600 text-amber-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {capitalize(t)} ({t === "income" ? income.length : expenses.length})
          </button>
        ))}
      </div>

      {/* Add form */}
      {adding && tab === "income" && (
        <form onSubmit={handleAddIncome} className="p-4 border-b border-gray-100 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Category</label>
            <select
              value={incomeForm.category}
              onChange={(e) => setIncomeForm((f) => ({ ...f, category: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              {INCOME_CATEGORIES.map((c) => <option key={c} value={c}>{capitalize(c)}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Amount</label>
            <input type="number" required step="any" min="0" value={incomeForm.amount}
              onChange={(e) => setIncomeForm((f) => ({ ...f, amount: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Date</label>
            <input type="date" required value={incomeForm.date}
              onChange={(e) => setIncomeForm((f) => ({ ...f, date: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Description</label>
            <input type="text" value={incomeForm.description}
              onChange={(e) => setIncomeForm((f) => ({ ...f, description: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
          </div>
          <div className="sm:col-span-4 flex gap-2">
            <button type="submit" disabled={saving} className="px-4 py-1.5 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 disabled:opacity-50">
              {saving ? "Saving…" : "Add Income"}
            </button>
            <button type="button" onClick={() => setAdding(false)} className="px-3 py-1.5 border border-gray-300 text-gray-600 text-sm rounded-lg hover:bg-gray-50">Cancel</button>
          </div>
        </form>
      )}

      {adding && tab === "expenses" && (
        <form onSubmit={handleAddExpense} className="p-4 border-b border-gray-100 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Category</label>
            <select
              value={expenseForm.category}
              onChange={(e) => setExpenseForm((f) => ({ ...f, category: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              {EXPENSE_CATEGORIES.map((c) => <option key={c} value={c}>{capitalize(c)}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Amount</label>
            <input type="number" required step="any" min="0" value={expenseForm.amount}
              onChange={(e) => setExpenseForm((f) => ({ ...f, amount: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Date</label>
            <input type="date" required value={expenseForm.date}
              onChange={(e) => setExpenseForm((f) => ({ ...f, date: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Vendor</label>
            <input type="text" value={expenseForm.vendor}
              onChange={(e) => setExpenseForm((f) => ({ ...f, vendor: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-gray-500 mb-1">Description</label>
            <input type="text" value={expenseForm.description}
              onChange={(e) => setExpenseForm((f) => ({ ...f, description: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
          </div>
          <div className="sm:col-span-4 flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
              <input type="checkbox" checked={expenseForm.is_recurring}
                onChange={(e) => setExpenseForm((f) => ({ ...f, is_recurring: e.target.checked }))}
                className="rounded" />
              Recurring expense
            </label>
            <button type="submit" disabled={saving} className="ml-auto px-4 py-1.5 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 disabled:opacity-50">
              {saving ? "Saving…" : "Add Expense"}
            </button>
            <button type="button" onClick={() => setAdding(false)} className="px-3 py-1.5 border border-gray-300 text-gray-600 text-sm rounded-lg hover:bg-gray-50">Cancel</button>
          </div>
        </form>
      )}

      {/* Records list */}
      {tab === "income" && (
        income.length === 0 && !adding ? (
          <p className="px-5 py-4 text-sm text-gray-400">No income records.</p>
        ) : (
          <ul className="divide-y divide-gray-50">
            {income.map((r) => (
              <li key={r.id} className="px-5 py-3 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-800">{capitalize(r.category)}</p>
                  <p className="text-xs text-gray-400">
                    {fmtDate(r.date)}{r.description ? ` · ${r.description}` : ""}
                    {r.tenants ? ` · ${r.tenants.first_name} ${r.tenants.last_name}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <span className="font-semibold text-sm text-emerald-600">{fmt$(r.amount)}</span>
                  <button onClick={() => deleteIncome(r.id).then(() => setIncome((x) => x.filter((i) => i.id !== r.id)))}
                    className="text-gray-300 hover:text-red-500 transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )
      )}

      {tab === "expenses" && (
        expenses.length === 0 && !adding ? (
          <p className="px-5 py-4 text-sm text-gray-400">No expense records.</p>
        ) : (
          <ul className="divide-y divide-gray-50">
            {expenses.map((r) => (
              <li key={r.id} className="px-5 py-3 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-800">{capitalize(r.category)}</p>
                    {r.is_recurring && (
                      <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">Recurring</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400">
                    {fmtDate(r.date)}{r.vendor ? ` · ${r.vendor}` : ""}{r.description ? ` · ${r.description}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <span className="font-semibold text-sm text-rose-600">{fmt$(r.amount)}</span>
                  <button onClick={() => deleteExpense(r.id).then(() => setExpenses((x) => x.filter((i) => i.id !== r.id)))}
                    className="text-gray-300 hover:text-red-500 transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )
      )}
    </div>
  );
}
