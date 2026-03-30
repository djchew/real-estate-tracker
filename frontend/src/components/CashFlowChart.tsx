"use client";

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
import { CashFlowRow } from "@/lib/api";

interface Props {
  data: CashFlowRow[];
}

export default function CashFlowChart({ data }: Props) {
  // Aggregate by month across all properties
  const byMonth: Record<string, { month: string; income: number; expenses: number; cashFlow: number }> = {};
  for (const row of data) {
    if (!byMonth[row.month]) {
      byMonth[row.month] = { month: row.month, income: 0, expenses: 0, cashFlow: 0 };
    }
    byMonth[row.month].income += row.total_income;
    byMonth[row.month].expenses += row.total_expenses;
    byMonth[row.month].cashFlow += row.cash_flow;
  }

  const chartData = Object.values(byMonth)
    .sort((a, b) => a.month.localeCompare(b.month))
    .slice(-12); // last 12 months

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={chartData} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="month" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
        <Tooltip
          formatter={(value: number) =>
            new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value)
          }
        />
        <Legend />
        <Bar dataKey="income" name="Income" fill="#10b981" radius={[3, 3, 0, 0]} />
        <Bar dataKey="expenses" name="Expenses" fill="#f43f5e" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
