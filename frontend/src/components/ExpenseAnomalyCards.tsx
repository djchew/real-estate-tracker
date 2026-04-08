"use client";

import { ExpenseTrendRow } from "@/lib/api";
import { fmt$ } from "@/lib/utils";

function capitalize(str: string): string {
  return str
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default function ExpenseAnomalyCards({
  anomalies,
}: {
  anomalies: ExpenseTrendRow[];
}) {
  if (!anomalies || anomalies.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-3">
      {anomalies.map((anomaly, idx) => {
        const percentAbove =
          anomaly.rolling_avg
            ? Math.round(((anomaly.total_amount / anomaly.rolling_avg) - 1) * 100)
            : 0;

        return (
          <div
            key={`${anomaly.property_id}-${anomaly.month}-${anomaly.category}-${idx}`}
            className="border-l-4 border-amber-400 bg-amber-50 rounded-lg p-3 flex-1 min-w-64"
          >
            <div className="flex justify-between items-baseline mb-2">
              <p className="text-sm font-semibold text-stone-800">
                {anomaly.property_name} — {capitalize(anomaly.category)}
              </p>
              <p className="text-xs font-bold text-amber-700">+{percentAbove}%</p>
            </div>
            <p className="text-xs text-stone-600 mb-2">{anomaly.month}</p>
            <div className="flex justify-between text-xs text-stone-700">
              <span>Actual: <span className="font-semibold">{fmt$(anomaly.total_amount)}</span></span>
              <span>Avg: <span className="font-semibold">{fmt$(anomaly.rolling_avg || 0)}</span></span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
