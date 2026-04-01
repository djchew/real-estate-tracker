"use client";

import { useState } from "react";
import { Download } from "lucide-react";

export default function TaxExportButton() {
  const currentFY = new Date().getMonth() >= 6
    ? new Date().getFullYear() + 1
    : new Date().getFullYear();

  const years = Array.from({ length: 5 }, (_, i) => currentFY - i);
  const [fy, setFy] = useState(currentFY);
  const [loading, setLoading] = useState(false);

  async function download() {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:8000/api/summary/tax-export?fy=${fy}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `tax_summary_FY${fy}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <select
        value={fy}
        onChange={(e) => setFy(Number(e.target.value))}
        className="text-sm border border-stone-200 rounded-lg px-3 py-2 bg-white text-stone-700 focus:outline-none focus:ring-2 focus:ring-amber-400"
      >
        {years.map((y) => (
          <option key={y} value={y}>FY{y - 1}–{y}</option>
        ))}
      </select>
      <button
        onClick={download}
        disabled={loading}
        className="inline-flex items-center gap-2 px-4 py-2 bg-stone-800 hover:bg-stone-900 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
      >
        <Download className="h-4 w-4" />
        {loading ? "Exporting…" : "Export CSV"}
      </button>
    </div>
  );
}
