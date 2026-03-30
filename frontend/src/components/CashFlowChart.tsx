"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { CashFlowRow } from "@/lib/api";

export default function CashFlowChart({ data }: { data: CashFlowRow[] }) {
  const byMonth: Record<string, { month: string; income: number; expenses: number }> = {};
  for (const row of data) {
    if (!byMonth[row.month]) {
      byMonth[row.month] = { month: row.month, income: 0, expenses: 0 };
    }
    byMonth[row.month].income += row.total_income;
    byMonth[row.month].expenses += row.total_expenses;
  }

  const chartData = Object.values(byMonth)
    .sort((a, b) => a.month.localeCompare(b.month))
    .slice(-12);

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={chartData} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
        <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#a8a29e" }} />
        <YAxis tick={{ fontSize: 11, fill: "#a8a29e" }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
        <Tooltip
          contentStyle={{ borderRadius: 12, border: "1px solid #e7e5e4", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
          formatter={(value: number) =>
            new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value)
          }
        />
        <Legend wrapperStyle={{ fontSize: 12, color: "#78716c" }} />
        <Bar dataKey="income" name="Income" fill="#f59e0b" radius={[4, 4, 0, 0]} />
        <Bar dataKey="expenses" name="Expenses" fill="#fca5a5" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
