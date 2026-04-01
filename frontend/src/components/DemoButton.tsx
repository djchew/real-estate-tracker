"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Trash2 } from "lucide-react";

export function LoadDemoButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function load() {
    setLoading(true);
    await fetch("http://localhost:8000/api/demo/seed", { method: "POST" });
    setLoading(false);
    router.refresh();
  }

  return (
    <button
      onClick={load}
      disabled={loading}
      className="inline-flex items-center gap-2 px-5 py-2.5 border border-stone-300 text-stone-700 text-sm font-semibold rounded-xl hover:bg-stone-100 transition-colors disabled:opacity-50"
    >
      <Sparkles className="h-4 w-4 text-amber-500" />
      {loading ? "Loading demo…" : "Load demo data"}
    </button>
  );
}

export function ClearDemoButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function clear() {
    if (!confirm("This will delete ALL data. Are you sure?")) return;
    setLoading(true);
    await fetch("http://localhost:8000/api/demo/clear", { method: "DELETE" });
    setLoading(false);
    router.refresh();
  }

  return (
    <button
      onClick={clear}
      disabled={loading}
      className="inline-flex items-center gap-2 px-3 py-1.5 text-xs text-stone-400 hover:text-red-600 transition-colors disabled:opacity-50"
    >
      <Trash2 className="h-3 w-3" />
      {loading ? "Clearing…" : "Clear all data"}
    </button>
  );
}
