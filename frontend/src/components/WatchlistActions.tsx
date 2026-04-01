"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, RefreshCw, ChevronDown } from "lucide-react";

const STATUSES = ["watching","inspected","offered","passed","purchased"];

export default function WatchlistActions({ id, currentStatus }: { id: string; currentStatus: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function updateStatus(status: string) {
    setLoading(true);
    await fetch(`http://localhost:8000/api/watchlist/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setLoading(false);
    router.refresh();
  }

  async function refreshPreview() {
    setLoading(true);
    await fetch(`http://localhost:8000/api/watchlist/${id}/refresh-preview`, { method: "POST" });
    setLoading(false);
    router.refresh();
  }

  async function remove() {
    if (!confirm("Remove from watchlist?")) return;
    setLoading(true);
    await fetch(`http://localhost:8000/api/watchlist/${id}`, { method: "DELETE" });
    setLoading(false);
    router.refresh();
  }

  return (
    <div className="flex items-center gap-2">
      <select
        value={currentStatus}
        onChange={(e) => updateStatus(e.target.value)}
        disabled={loading}
        className="text-xs border border-stone-200 rounded-lg px-2 py-1 bg-white text-stone-600 focus:outline-none focus:ring-2 focus:ring-amber-400 disabled:opacity-50"
      >
        {STATUSES.map((s) => (
          <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
        ))}
      </select>
      <button
        onClick={refreshPreview}
        disabled={loading}
        title="Refresh listing preview"
        className="p-1.5 text-stone-400 hover:text-amber-600 transition-colors disabled:opacity-50"
      >
        <RefreshCw className="h-3.5 w-3.5" />
      </button>
      <button
        onClick={remove}
        disabled={loading}
        title="Remove"
        className="p-1.5 text-stone-400 hover:text-red-500 transition-colors disabled:opacity-50"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
