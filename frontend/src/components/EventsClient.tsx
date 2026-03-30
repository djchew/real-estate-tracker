"use client";

import { useState } from "react";
import { Event, Property, createEvent, updateEvent, deleteEvent } from "@/lib/api";
import { fmtDate, capitalize, cn } from "@/lib/utils";
import { Plus, Trash2, Check, CalendarClock } from "lucide-react";

interface Props {
  initialEvents: Event[];
  properties: Property[];
}

const CATEGORIES = [
  "maintenance", "inspection", "lease_renewal", "insurance_renewal",
  "tax_deadline", "mortgage_payment", "tenant_move_in", "tenant_move_out", "other",
];

const statusColors: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  completed: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-gray-100 text-gray-500",
};

const blank = {
  title: "",
  category: "maintenance",
  due_date: "",
  property_id: "",
  notes: "",
};

export default function EventsClient({ initialEvents, properties }: Props) {
  const [events, setEvents] = useState(initialEvents);
  const [adding, setAdding] = useState(false);
  const [filter, setFilter] = useState<"all" | "pending" | "completed">("pending");
  const [form, setForm] = useState(blank);
  const [saving, setSaving] = useState(false);

  function set(k: keyof typeof form, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        title: form.title,
        category: form.category,
        due_date: form.due_date,
      };
      if (form.property_id) payload.property_id = form.property_id;
      if (form.notes) payload.notes = form.notes;
      const created = await createEvent(payload);
      setEvents((ev) => [...ev, created]);
      setAdding(false);
      setForm(blank);
    } finally {
      setSaving(false);
    }
  }

  async function markComplete(id: string) {
    const updated = await updateEvent(id, { status: "completed" });
    setEvents((ev) => ev.map((e) => (e.id === id ? updated : e)));
  }

  async function handleDelete(id: string) {
    await deleteEvent(id);
    setEvents((ev) => ev.filter((e) => e.id !== id));
  }

  const filtered = events.filter((e) =>
    filter === "all" ? true : e.status === filter
  );

  // Group by due date proximity
  const today = new Date().toISOString().slice(0, 10);
  const overdue = filtered.filter((e) => e.status === "pending" && e.due_date < today);
  const upcoming = filtered.filter((e) => e.status !== "pending" || e.due_date >= today);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
          {(["pending", "all", "completed"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-3 py-1 text-sm font-medium rounded-md transition-colors",
                filter === f ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
              )}
            >
              {capitalize(f)}
            </button>
          ))}
        </div>
        <button
          onClick={() => setAdding((v) => !v)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Event
        </button>
      </div>

      {/* Add form */}
      {adding && (
        <form onSubmit={handleAdd} className="bg-white rounded-xl border border-gray-200 p-5 grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-gray-500 mb-1">Title *</label>
            <input
              required
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="e.g. HVAC inspection"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Due Date *</label>
            <input
              type="date"
              required
              value={form.due_date}
              onChange={(e) => set("due_date", e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Category</label>
            <select
              value={form.category}
              onChange={(e) => set("category", e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              {CATEGORIES.map((c) => <option key={c} value={c}>{capitalize(c)}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Property (optional)</label>
            <select
              value={form.property_id}
              onChange={(e) => set("property_id", e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="">— None —</option>
              {properties.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Notes</label>
            <input
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <div className="sm:col-span-3 flex gap-2">
            <button type="submit" disabled={saving} className="px-4 py-2 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 disabled:opacity-50">
              {saving ? "Saving…" : "Add Event"}
            </button>
            <button type="button" onClick={() => { setAdding(false); setForm(blank); }} className="px-3 py-2 border border-gray-300 text-gray-600 text-sm rounded-lg hover:bg-gray-50">
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Overdue */}
      {overdue.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-red-200">
            <h2 className="text-sm font-semibold text-red-700">Overdue ({overdue.length})</h2>
          </div>
          <EventList events={overdue} onComplete={markComplete} onDelete={handleDelete} />
        </div>
      )}

      {/* Upcoming / All */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700">
            {filter === "pending" ? "Upcoming" : capitalize(filter)} ({upcoming.length})
          </h2>
        </div>
        {upcoming.length === 0 ? (
          <div className="px-5 py-8 text-center">
            <CalendarClock className="h-8 w-8 text-gray-200 mx-auto mb-2" />
            <p className="text-sm text-gray-400">No events here.</p>
          </div>
        ) : (
          <EventList events={upcoming} onComplete={markComplete} onDelete={handleDelete} />
        )}
      </div>
    </div>
  );
}

function EventList({
  events,
  onComplete,
  onDelete,
}: {
  events: Event[];
  onComplete: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <ul className="divide-y divide-gray-50">
      {events.map((e) => (
        <li key={e.id} className="px-5 py-4 flex items-center justify-between gap-4">
          <div className="min-w-0 flex items-start gap-3">
            <CalendarClock className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-gray-800">{e.title}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {fmtDate(e.due_date)} · {capitalize(e.category)}
                {e.properties ? ` · ${e.properties.name}` : ""}
              </p>
              {e.notes && <p className="text-xs text-gray-400 mt-0.5 italic">{e.notes}</p>}
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColors[e.status] ?? ""}`}>
              {capitalize(e.status)}
            </span>
            {e.status === "pending" && (
              <button
                onClick={() => onComplete(e.id)}
                title="Mark complete"
                className="text-gray-300 hover:text-emerald-500 transition-colors"
              >
                <Check className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={() => onDelete(e.id)}
              className="text-gray-300 hover:text-red-500 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
