"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";

const CATEGORIES = ["plumbing","electrical","hvac","appliance","structural","pest","landscaping","cleaning","other"];
const PRIORITIES = ["low","medium","high","urgent"];

export default function AddMaintenanceButton({ properties }: { properties: { id: string; name: string }[] }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const [form, setForm] = useState({
    property_id: properties[0]?.id ?? "",
    title: "",
    category: "other",
    priority: "medium",
    status: "open",
    reported_date: new Date().toISOString().split("T")[0],
    cost: "",
    vendor: "",
    notes: "",
  });

  function set(k: string, v: string) { setForm((f) => ({ ...f, [k]: v })); }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const payload: Record<string, unknown> = { ...form };
    if (!payload.cost) delete payload.cost; else payload.cost = Number(payload.cost);
    if (!payload.vendor) delete payload.vendor;
    if (!payload.notes) delete payload.notes;

    await fetch("http://localhost:8000/api/maintenance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setLoading(false);
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold rounded-xl transition-colors"
      >
        <Plus className="h-4 w-4" />
        Log Request
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-stone-800">New Maintenance Request</h2>
              <button onClick={() => setOpen(false)}><X className="h-5 w-5 text-stone-400" /></button>
            </div>
            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-stone-500">Property</label>
                <select value={form.property_id} onChange={(e) => set("property_id", e.target.value)}
                  className="mt-1 w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400">
                  {properties.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-stone-500">Title</label>
                <input required value={form.title} onChange={(e) => set("title", e.target.value)}
                  placeholder="e.g. Leaking tap in bathroom"
                  className="mt-1 w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-stone-500">Category</label>
                  <select value={form.category} onChange={(e) => set("category", e.target.value)}
                    className="mt-1 w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400">
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-stone-500">Priority</label>
                  <select value={form.priority} onChange={(e) => set("priority", e.target.value)}
                    className="mt-1 w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400">
                    {PRIORITIES.map((p) => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-stone-500">Reported Date</label>
                  <input type="date" value={form.reported_date} onChange={(e) => set("reported_date", e.target.value)}
                    className="mt-1 w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
                </div>
                <div>
                  <label className="text-xs font-medium text-stone-500">Cost (AUD)</label>
                  <input type="number" min="0" step="0.01" value={form.cost} onChange={(e) => set("cost", e.target.value)}
                    placeholder="0.00"
                    className="mt-1 w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-stone-500">Vendor / Tradesperson</label>
                <input value={form.vendor} onChange={(e) => set("vendor", e.target.value)}
                  placeholder="e.g. Smith Plumbing"
                  className="mt-1 w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
              </div>
              <div>
                <label className="text-xs font-medium text-stone-500">Notes</label>
                <textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={2}
                  className="mt-1 w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none" />
              </div>
              <button type="submit" disabled={loading}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-xl text-sm transition-colors disabled:opacity-50">
                {loading ? "Saving…" : "Log Request"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
