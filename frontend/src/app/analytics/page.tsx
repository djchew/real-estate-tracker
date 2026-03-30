import { getCashFlow, getProperties } from "@/lib/api";
import { fmt$ } from "@/lib/utils";
import CashFlowChart from "@/components/CashFlowChart";

export default async function AnalyticsPage() {
  const [cashFlowData, properties] = await Promise.all([getCashFlow(), getProperties()]);

  // Build per-property summary
  const byProperty: Record<
    string,
    { name: string; income: number; expenses: number; cashFlow: number }
  > = {};
  for (const row of cashFlowData) {
    if (!byProperty[row.property_id]) {
      byProperty[row.property_id] = {
        name: row.property_name,
        income: 0,
        expenses: 0,
        cashFlow: 0,
      };
    }
    byProperty[row.property_id].income += row.total_income;
    byProperty[row.property_id].expenses += row.total_expenses;
    byProperty[row.property_id].cashFlow += row.cash_flow;
  }

  const propertySummaries = Object.values(byProperty);
  const totalIncome = propertySummaries.reduce((s, p) => s + p.income, 0);
  const totalExpenses = propertySummaries.reduce((s, p) => s + p.expenses, 0);
  const totalCashFlow = totalIncome - totalExpenses;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="text-sm text-gray-500 mt-1">All-time financials across your portfolio</p>
      </div>

      {/* Portfolio totals */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Income", value: fmt$(totalIncome), color: "text-emerald-600" },
          { label: "Total Expenses", value: fmt$(totalExpenses), color: "text-rose-600" },
          {
            label: "Net Cash Flow",
            value: fmt$(totalCashFlow),
            color: totalCashFlow >= 0 ? "text-emerald-600" : "text-red-600",
          },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-xs text-gray-400 font-medium">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Monthly cash flow chart */}
      {cashFlowData.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Monthly Cash Flow</h2>
          <CashFlowChart data={cashFlowData} />
        </div>
      )}

      {/* Per-property breakdown */}
      {propertySummaries.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-700">By Property</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {propertySummaries.map((p) => (
              <div key={p.name} className="px-5 py-4 grid grid-cols-4 gap-4 text-sm">
                <div className="font-medium text-gray-800">{p.name}</div>
                <div className="text-emerald-600 font-medium">{fmt$(p.income)} income</div>
                <div className="text-rose-600 font-medium">{fmt$(p.expenses)} expenses</div>
                <div
                  className={`font-bold text-right ${
                    p.cashFlow >= 0 ? "text-emerald-600" : "text-red-600"
                  }`}
                >
                  {fmt$(p.cashFlow)} net
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {cashFlowData.length === 0 && (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center">
          <p className="text-gray-400 text-sm">No financial data yet. Add income and expenses to your properties to see analytics.</p>
        </div>
      )}
    </div>
  );
}
