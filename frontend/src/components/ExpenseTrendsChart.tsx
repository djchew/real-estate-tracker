"use client";

import { ExpenseTrendRow } from "@/lib/api";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const COLORS = [
  "#10b981", // emerald
  "#f59e0b", // amber
  "#ef4444", // red
  "#3b82f6", // blue
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#f97316", // orange
];

export default function ExpenseTrendsChart({ rows }: { rows: ExpenseTrendRow[] }) {
  if (!rows || rows.length === 0) return null;

  // Get unique months (sorted)
  const months = Array.from(new Set(rows.map((r) => r.month))).sort();

  // Get unique categories
  const categories = Array.from(new Set(rows.map((r) => r.category))).sort();

  // Build chart data: { month, [category]: amount }
  const chartData = months.map((month) => {
    const monthData: Record<string, number> = { month };

    for (const category of categories) {
      const row = rows.find((r) => r.month === month && r.category === category);
      monthData[category] = row ? row.total_amount : 0;
    }

    return monthData;
  });

  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart
        data={chartData}
        margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 12, fill: "#6b7280" }}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 12, fill: "#6b7280" }}
          tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
          tickLine={false}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
          }}
          formatter={(value) =>
            new Intl.NumberFormat("en-AU", {
              style: "currency",
              currency: "AUD",
              minimumFractionDigits: 0,
            }).format(value as number)
          }
        />
        <Legend
          wrapperStyle={{ paddingTop: "16px" }}
          iconType="square"
        />
        {categories.map((category, idx) => (
          <Bar
            key={category}
            dataKey={category}
            stackId="a"
            fill={COLORS[idx % COLORS.length]}
            name={category}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
