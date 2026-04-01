import { getCashFlow, getProperties, getAnalyticsData } from "@/lib/api";
import { fmt$, fmtPct } from "@/lib/utils";
import CashFlowChart from "@/components/CashFlowChart";
import TaxExportButton from "@/components/TaxExportButton";

export default async function AnalyticsPage() {
  const [cashFlowData, properties, analyticsData] = await Promise.all([
    getCashFlow(), getProperties(), getAnalyticsData(),
  ]);

  const allMortgages = analyticsData.mortgages;
  const allTenants = analyticsData.tenants;

  // Group by property id
  const mortgageArrays = properties.map((p) => allMortgages.filter((m) => m.property_id === p.id));
  const tenantArrays = properties.map((p) => allTenants.filter((t) => t.property_id === p.id));

  // All-time totals per property
  const byProperty: Record<string, {
    id: string; name: string;
    income: number; expenses: number; cashFlow: number;
  }> = {};
  for (const row of cashFlowData) {
    if (!byProperty[row.property_id]) {
      byProperty[row.property_id] = { id: row.property_id, name: row.property_name, income: 0, expenses: 0, cashFlow: 0 };
    }
    byProperty[row.property_id].income += row.total_income;
    byProperty[row.property_id].expenses += row.total_expenses;
    byProperty[row.property_id].cashFlow += row.cash_flow;
  }

  const totalIncome = Object.values(byProperty).reduce((s, p) => s + p.income, 0);
  const totalExpenses = Object.values(byProperty).reduce((s, p) => s + p.expenses, 0);

  // Per-property investment metrics
  const propertyMetrics = properties.map((p, i) => {
    const mortgages = mortgageArrays[i];
    const tenants = tenantArrays[i];
    const cashData = byProperty[p.id];

    const totalDebt = mortgages.reduce((s, m) => s + m.current_balance, 0);
    const monthlyMortgage = mortgages.reduce((s, m) => s + m.monthly_payment, 0);
    const monthlyRent = tenants.filter((t) => t.status === "active").reduce((s, t) => s + t.rent_amount, 0);

    // Annualise from cash flow history (use last 12 months if available)
    const annualIncome = (cashData?.income ?? monthlyRent * 12);
    // NOI excludes mortgage payments (operating expenses only)
    const annualOpEx = (cashData?.expenses ?? 0) - monthlyMortgage * 12;
    const noi = annualIncome - Math.max(0, annualOpEx);

    // Cap Rate = NOI / Current Value
    const capRate = p.current_value && p.current_value > 0 ? noi / p.current_value : null;

    // Cash invested = purchase price - original loan amount
    const originalLoan = mortgages.reduce((s, m) => s + m.original_amount, 0);
    const cashInvested = p.purchase_price ? p.purchase_price - originalLoan : null;

    // Cash-on-Cash = Annual Cash Flow / Cash Invested
    const annualCashFlow = cashData?.cashFlow ?? 0;
    const coc = cashInvested && cashInvested > 0 ? annualCashFlow / cashInvested : null;

    const equity = (p.current_value ?? 0) - totalDebt;

    return { property: p, totalDebt, equity, noi, capRate, coc, annualIncome, annualCashFlow, cashData };
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-800">Analytics</h1>
          <p className="text-sm text-stone-400 mt-1">Portfolio performance across all properties</p>
        </div>
        <TaxExportButton />
      </div>

      {/* Portfolio totals */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Income", value: fmt$(totalIncome), color: "text-emerald-700" },
          { label: "Total Expenses", value: fmt$(totalExpenses), color: "text-rose-700" },
          {
            label: "Net Cash Flow",
            value: fmt$(totalIncome - totalExpenses),
            color: (totalIncome - totalExpenses) >= 0 ? "text-emerald-700" : "text-red-700",
          },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5">
            <p className="text-xs text-stone-400 font-medium">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Monthly cash flow chart */}
      {cashFlowData.length > 0 && (
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-stone-700 mb-4">Monthly Cash Flow (last 12 months)</h2>
          <CashFlowChart data={cashFlowData} />
        </div>
      )}

      {/* Per-property investment metrics */}
      {propertyMetrics.length > 0 && (
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-stone-100">
            <h2 className="text-sm font-semibold text-stone-700">Investment Metrics by Property</h2>
            <p className="text-xs text-stone-400 mt-0.5">Based on all-time recorded financials</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-stone-50 border-b border-stone-100">
                <tr>
                  {["Property", "Value", "Equity", "NOI", "Cap Rate", "Cash-on-Cash", "Annual CF"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-stone-500 uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50">
                {propertyMetrics.map(({ property: p, equity, noi, capRate, coc, annualCashFlow }) => (
                  <tr key={p.id} className="hover:bg-stone-50/50 transition-colors">
                    <td className="px-4 py-4 font-medium text-stone-800">
                      <a href={`/properties/${p.id}`} className="hover:text-amber-600 transition-colors">
                        {p.name}
                      </a>
                    </td>
                    <td className="px-4 py-4 text-stone-600">
                      {p.current_value != null ? fmt$(p.current_value) : "—"}
                    </td>
                    <td className={`px-4 py-4 font-medium ${equity >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                      {p.current_value != null ? fmt$(equity) : "—"}
                    </td>
                    <td className="px-4 py-4 text-stone-600">{fmt$(noi)}</td>
                    <td className="px-4 py-4">
                      {capRate != null ? (
                        <span className={`font-semibold ${capRate >= 0.06 ? "text-emerald-600" : capRate >= 0.04 ? "text-amber-600" : "text-red-500"}`}>
                          {fmtPct(capRate)}
                        </span>
                      ) : "—"}
                    </td>
                    <td className="px-4 py-4">
                      {coc != null ? (
                        <span className={`font-semibold ${coc >= 0.08 ? "text-emerald-600" : coc >= 0.05 ? "text-amber-600" : "text-red-500"}`}>
                          {fmtPct(coc)}
                        </span>
                      ) : "—"}
                    </td>
                    <td className={`px-4 py-4 font-semibold ${annualCashFlow >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                      {fmt$(annualCashFlow)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3 bg-stone-50 border-t border-stone-100">
            <p className="text-xs text-stone-400">
              <span className="text-emerald-600 font-medium">Green</span> Cap Rate ≥ 6% · Cash-on-Cash ≥ 8% &nbsp;
              <span className="text-amber-600 font-medium">Amber</span> Cap Rate 4–6% · CoC 5–8% &nbsp;
              <span className="text-red-500 font-medium">Red</span> Below thresholds
            </p>
          </div>
        </div>
      )}

      {cashFlowData.length === 0 && (
        <div className="bg-white rounded-2xl border border-dashed border-stone-200 p-12 text-center">
          <p className="text-stone-400 text-sm">No financial data yet. Add income and expenses to your properties to see analytics.</p>
        </div>
      )}
    </div>
  );
}
