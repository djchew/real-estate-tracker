import { fmt$, fmtDate, capitalize } from "@/lib/utils";
import Link from "next/link";
import { Wrench, Plus } from "lucide-react";
import AddMaintenanceButton from "@/components/AddMaintenanceButton";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

async function getMaintenance() {
  const res = await fetch(`${BASE}/maintenance`, { cache: "no-store" });
  if (!res.ok) return [];
  return res.json();
}

async function getProperties() {
  const res = await fetch(`${BASE}/properties`, { cache: "no-store" });
  if (!res.ok) return [];
  return res.json();
}

const priorityColors: Record<string, string> = {
  low:    "bg-stone-100 text-stone-600",
  medium: "bg-blue-100 text-blue-700",
  high:   "bg-amber-100 text-amber-700",
  urgent: "bg-red-100 text-red-700",
};

const statusColors: Record<string, string> = {
  open:        "bg-amber-100 text-amber-700",
  in_progress: "bg-blue-100 text-blue-700",
  completed:   "bg-emerald-100 text-emerald-700",
  cancelled:   "bg-stone-100 text-stone-500",
};

export default async function MaintenancePage() {
  const [requests, properties] = await Promise.all([getMaintenance(), getProperties()]);

  const open = requests.filter((r: any) => r.status === "open" || r.status === "in_progress");
  const closed = requests.filter((r: any) => r.status === "completed" || r.status === "cancelled");

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-800">Maintenance</h1>
          <p className="text-sm text-stone-400 mt-1">{open.length} open · {closed.length} resolved</p>
        </div>
        <AddMaintenanceButton properties={properties} />
      </div>

      {requests.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-stone-200 p-12 text-center">
          <Wrench className="h-10 w-10 text-stone-200 mx-auto mb-3" />
          <p className="text-stone-400 font-medium">No maintenance requests yet</p>
          <p className="text-sm text-stone-400 mt-1">Log repairs and maintenance jobs here.</p>
        </div>
      ) : (
        <>
          {open.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-stone-500 uppercase tracking-wide mb-3">Open</h2>
              <div className="space-y-3">
                {open.map((r: any) => (
                  <MaintenanceCard key={r.id} r={r} priorityColors={priorityColors} statusColors={statusColors} properties={properties} />
                ))}
              </div>
            </section>
          )}
          {closed.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-stone-500 uppercase tracking-wide mb-3">Resolved</h2>
              <div className="space-y-3">
                {closed.map((r: any) => (
                  <MaintenanceCard key={r.id} r={r} priorityColors={priorityColors} statusColors={statusColors} properties={properties} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}

function MaintenanceCard({ r, priorityColors, statusColors, properties }: any) {
  return (
    <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5 flex items-start gap-4">
      <div className="mt-1 p-2 bg-amber-50 rounded-xl shrink-0">
        <Wrench className="h-4 w-4 text-amber-600" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="font-semibold text-stone-800">{r.title}</h3>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${priorityColors[r.priority]}`}>
            {capitalize(r.priority)}
          </span>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColors[r.status]}`}>
            {capitalize(r.status)}
          </span>
        </div>
        <p className="text-xs text-stone-400 mt-1">
          {r.properties?.name ?? "—"} · {capitalize(r.category)} · Reported {fmtDate(r.reported_date)}
          {r.vendor ? ` · ${r.vendor}` : ""}
          {r.cost != null ? ` · ${fmt$(r.cost)}` : ""}
        </p>
        {r.notes && <p className="text-sm text-stone-500 mt-2">{r.notes}</p>}
      </div>
    </div>
  );
}
