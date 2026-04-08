"use client";

import { ForecastRow, CashFlowRow } from "@/lib/api";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";

export default function ForecastChart({
  forecastRows,
  cashFlowData,
}: {
  forecastRows: ForecastRow[];
  cashFlowData: CashFlowRow[];
}) {
  if (!forecastRows || forecastRows.length === 0) return null;

  // Aggregate last 3 months of actual cash flow (sum across properties per month)
  interface MonthAggregate {
    month: string;
    actual_income?: number;
    actual_expenses?: number;
    actual_cf?: number;
  }

  const monthlyActuals: Record<string, MonthAggregate> = {};

  for (const row of cashFlowData) {
    if (!monthlyActuals[row.month]) {
      monthlyActuals[row.month] = { month: row.month };
    }
    monthlyActuals[row.month].actual_income =
      (monthlyActuals[row.month].actual_income || 0) + row.total_income;
    monthlyActuals[row.month].actual_expenses =
      (monthlyActuals[row.month].actual_expenses || 0) + row.total_expenses;
    monthlyActuals[row.month].actual_cf =
      (monthlyActuals[row.month].actual_cf || 0) + row.cash_flow;
  }

  // Get sorted months from actuals
  const sortedActualMonths = Object.keys(monthlyActuals).sort();
  const last3Months = sortedActualMonths.slice(-3);

  // Build merged data: last 3 actuals + 12 forecasts
  interface ChartPoint {
    month: string;
    actual_cf?: number;
    projected_cf?: number;
    is_forecast?: boolean;
  }

  const chartData: ChartPoint[] = [];

  // Add last 3 actual months
  for (const month of last3Months) {
    chartData.push({
      month,
      actual_cf: monthlyActuals[month].actual_cf,
      is_forecast: false,
    });
  }

  // Add forecast months
  for (const forecast of forecastRows) {
    chartData.push({
      month: forecast.month,
      projected_cf: forecast.projected_cash_flow,
      is_forecast: true,
    });
  }

  // Find divider month (first forecast month)
  const dividerMonth = forecastRows.length > 0 ? forecastRows[0].month : null;

  return (
    <ResponsiveContainer width="100%" height={320}>
      <LineChart
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
        <Legend wrapperStyle={{ paddingTop: "16px" }} />

        {/* Actual cash flow line (solid emerald) */}
        <Line
          dataKey="actual_cf"
          stroke="#10b981"
          strokeWidth={2}
          dot={false}
          name="Actual"
          connectNulls={false}
        />

        {/* Projected cash flow line (dashed amber) */}
        <Line
          dataKey="projected_cf"
          stroke="#f59e0b"
          strokeWidth={2}
          strokeDasharray="5 5"
          dot={false}
          name="Projected"
        />

        {/* Reference line at forecast boundary */}
        {dividerMonth && (
          <ReferenceLine
            x={dividerMonth}
            stroke="#d1d5db"
            strokeDasharray="4 4"
            label={{
              value: "Forecast Begins",
              fill: "#9ca3af",
              fontSize: 11,
              position: "insideTop",
              offset: -8,
            }}
          />
        )}
      </LineChart>
    </ResponsiveContainer>
  );
}
