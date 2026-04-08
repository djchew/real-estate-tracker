"use client";

import { Property, Mortgage } from "@/lib/api";
import { fmt$ } from "@/lib/utils";

export default function MortgageBreakdownPanel({
  properties,
  mortgages,
}: {
  properties: Property[];
  mortgages: Mortgage[];
}) {
  // Calculate per-property and portfolio totals
  interface MortgageStats {
    totalPayment: number;
    totalInterest: number;
    totalPrincipal: number;
  }

  const propertyStats: Record<string, MortgageStats> = {};
  let portfolioPayment = 0;
  let portfolioInterest = 0;
  let portfolioPrincipal = 0;

  for (const mortgage of mortgages) {
    const monthlyInterestRate = mortgage.interest_rate / 12;
    const monthlyInterest = mortgage.current_balance * monthlyInterestRate;
    const monthlyPrincipal = mortgage.monthly_payment - monthlyInterest;

    if (!propertyStats[mortgage.property_id]) {
      propertyStats[mortgage.property_id] = {
        totalPayment: 0,
        totalInterest: 0,
        totalPrincipal: 0,
      };
    }

    propertyStats[mortgage.property_id].totalPayment += mortgage.monthly_payment;
    propertyStats[mortgage.property_id].totalInterest += monthlyInterest;
    propertyStats[mortgage.property_id].totalPrincipal += monthlyPrincipal;

    portfolioPayment += mortgage.monthly_payment;
    portfolioInterest += monthlyInterest;
    portfolioPrincipal += monthlyPrincipal;
  }

  // Filter properties with mortgages
  const propertiesWithMortgages = properties.filter((p) => propertyStats[p.id]);

  return (
    <div className="space-y-6">
      {/* Portfolio Totals */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Monthly Payment", value: fmt$(portfolioPayment), color: "text-stone-700" },
          { label: "Toward Principal", value: fmt$(portfolioPrincipal), color: "text-emerald-700" },
          { label: "Toward Interest", value: fmt$(portfolioInterest), color: "text-amber-700" },
        ].map((stat) => (
          <div key={stat.label} className="bg-stone-50 rounded-xl border border-stone-100 p-4">
            <p className="text-xs text-stone-400 font-medium">{stat.label}</p>
            <p className={`text-lg font-bold mt-1 ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Per-Property Breakdown */}
      {propertiesWithMortgages.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-stone-600 uppercase tracking-wide">Monthly Breakdown by Property</h3>
          {propertiesWithMortgages.map((prop) => {
            const stats = propertyStats[prop.id]!;
            const principalPercent = (stats.totalPrincipal / stats.totalPayment) * 100;
            const interestPercent = (stats.totalInterest / stats.totalPayment) * 100;

            return (
              <div key={prop.id} className="space-y-2">
                <div className="flex justify-between items-baseline">
                  <p className="font-medium text-sm text-stone-800">{prop.name}</p>
                  <p className="text-xs text-stone-500">{fmt$(stats.totalPayment)}/mo</p>
                </div>

                {/* Horizontal stacked bar */}
                <div className="flex h-6 rounded-full overflow-hidden bg-stone-100">
                  <div
                    className="bg-emerald-500"
                    style={{ width: `${principalPercent}%` }}
                    title={`Principal: ${fmt$(stats.totalPrincipal)}`}
                  />
                  <div
                    className="bg-amber-500"
                    style={{ width: `${interestPercent}%` }}
                    title={`Interest: ${fmt$(stats.totalInterest)}`}
                  />
                </div>

                {/* Labels */}
                <div className="flex justify-between text-xs text-stone-600">
                  <span>Principal: {fmt$(stats.totalPrincipal)}</span>
                  <span>Interest: {fmt$(stats.totalInterest)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {propertiesWithMortgages.length === 0 && (
        <p className="text-xs text-stone-400 italic">No mortgages recorded</p>
      )}
    </div>
  );
}
