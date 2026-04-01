import { getProperty, getMortgages, getTenants, getIncome, getExpenses } from "@/lib/api";
import { fmt$, fmtDate, fmtPct, capitalize } from "@/lib/utils";
import PrintButton from "@/components/PrintButton";

export default async function PropertyReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [property, mortgages, tenants, income, expenses] = await Promise.all([
    getProperty(id),
    getMortgages(id),
    getTenants(id),
    getIncome(id),
    getExpenses(id),
  ]);

  const totalDebt = mortgages.reduce((s, m) => s + m.current_balance, 0);
  const equity = (property.current_value ?? 0) - totalDebt;
  const activeTenants = tenants.filter((t) => t.status === "active");
  const monthlyRent = activeTenants.reduce((s, t) => s + t.rent_amount, 0);
  const totalIncome = income.reduce((s, r) => s + r.amount, 0);
  const totalExpenses = expenses.reduce((s, r) => s + r.amount, 0);
  const noi = totalIncome - totalExpenses;

  const today = new Date().toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="max-w-3xl mx-auto p-8 bg-white min-h-screen print:p-0">
      {/* Print button — hidden when printing */}
      <div className="flex justify-between items-center mb-8 print:hidden">
        <a href={`/properties/${id}`} className="text-sm text-amber-600 hover:underline">← Back to property</a>
        <PrintButton />
      </div>

      {/* Report header */}
      <div className="border-b-2 border-stone-800 pb-4 mb-6">
        <h1 className="text-2xl font-bold text-stone-900">{property.name}</h1>
        <p className="text-stone-500 mt-1">{property.address}, {property.city}, {property.state} {property.zip}</p>
        <p className="text-xs text-stone-400 mt-2">Property Report · Generated {today}</p>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: "Current Value", value: property.current_value != null ? fmt$(property.current_value) : "—" },
          { label: "Total Equity", value: property.current_value != null ? fmt$(equity) : "—" },
          { label: "Monthly Rent", value: monthlyRent > 0 ? fmt$(monthlyRent) : "—" },
        ].map((m) => (
          <div key={m.label} className="bg-stone-50 rounded-xl p-4 border border-stone-100">
            <p className="text-xs text-stone-400 font-medium">{m.label}</p>
            <p className="text-xl font-bold text-stone-800 mt-1">{m.value}</p>
          </div>
        ))}
      </div>

      {/* Property details */}
      <section className="mb-8">
        <h2 className="text-sm font-semibold text-stone-500 uppercase tracking-wide mb-3">Property Details</h2>
        <div className="grid grid-cols-3 gap-3 text-sm">
          {[
            ["Type", capitalize(property.property_type)],
            ["Status", capitalize(property.status)],
            property.bedrooms != null ? ["Bedrooms", property.bedrooms] : null,
            property.bathrooms != null ? ["Bathrooms", property.bathrooms] : null,
            property.square_feet != null ? ["Size", `${property.square_feet.toLocaleString()} sqft`] : null,
            property.year_built != null ? ["Year Built", property.year_built] : null,
            property.purchase_price != null ? ["Purchase Price", fmt$(property.purchase_price)] : null,
            property.purchase_date ? ["Purchase Date", fmtDate(property.purchase_date)] : null,
          ].filter(Boolean).map(([label, value]) => (
            <div key={String(label)}>
              <p className="text-stone-400 text-xs">{label}</p>
              <p className="font-medium text-stone-800">{value}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Mortgages */}
      {mortgages.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-stone-500 uppercase tracking-wide mb-3">Mortgages</h2>
          <table className="w-full text-sm border border-stone-200 rounded-xl overflow-hidden">
            <thead className="bg-stone-50 text-stone-500">
              <tr>{["Lender", "Balance", "Rate", "Monthly", "Term"].map((h) => (
                <th key={h} className="text-left px-4 py-2 text-xs font-semibold">{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {mortgages.map((m) => (
                <tr key={m.id} className="border-t border-stone-100">
                  <td className="px-4 py-2">{m.lender}</td>
                  <td className="px-4 py-2">{fmt$(m.current_balance)}</td>
                  <td className="px-4 py-2">{fmtPct(m.interest_rate)}</td>
                  <td className="px-4 py-2">{fmt$(m.monthly_payment)}</td>
                  <td className="px-4 py-2">{m.term_months / 12} yrs</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {/* Tenants */}
      {tenants.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-stone-500 uppercase tracking-wide mb-3">Tenants</h2>
          <table className="w-full text-sm border border-stone-200 rounded-xl overflow-hidden">
            <thead className="bg-stone-50 text-stone-500">
              <tr>{["Tenant", "Unit", "Rent/mo", "Lease Start", "Lease End", "Status"].map((h) => (
                <th key={h} className="text-left px-4 py-2 text-xs font-semibold">{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {tenants.map((t) => (
                <tr key={t.id} className="border-t border-stone-100">
                  <td className="px-4 py-2">{t.first_name} {t.last_name}</td>
                  <td className="px-4 py-2">{t.unit ?? "—"}</td>
                  <td className="px-4 py-2">{fmt$(t.rent_amount)}</td>
                  <td className="px-4 py-2">{fmtDate(t.lease_start)}</td>
                  <td className="px-4 py-2">{t.lease_end ? fmtDate(t.lease_end) : "—"}</td>
                  <td className="px-4 py-2">{capitalize(t.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {/* P&L Summary */}
      <section className="mb-8">
        <h2 className="text-sm font-semibold text-stone-500 uppercase tracking-wide mb-3">P&amp;L Summary (All Time)</h2>
        <div className="border border-stone-200 rounded-xl overflow-hidden text-sm">
          <div className="flex justify-between px-4 py-3 border-b border-stone-100">
            <span className="text-stone-500">Total Income</span>
            <span className="font-semibold text-emerald-700">{fmt$(totalIncome)}</span>
          </div>
          <div className="flex justify-between px-4 py-3 border-b border-stone-100">
            <span className="text-stone-500">Total Expenses</span>
            <span className="font-semibold text-rose-700">{fmt$(totalExpenses)}</span>
          </div>
          <div className="flex justify-between px-4 py-3 bg-stone-50">
            <span className="font-semibold text-stone-700">Net Operating Income</span>
            <span className={`font-bold ${noi >= 0 ? "text-emerald-700" : "text-red-700"}`}>{fmt$(noi)}</span>
          </div>
        </div>
      </section>

      {/* Income records */}
      {income.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-stone-500 uppercase tracking-wide mb-3">Income Records</h2>
          <table className="w-full text-sm border border-stone-200 rounded-xl overflow-hidden">
            <thead className="bg-stone-50 text-stone-500">
              <tr>{["Date", "Category", "Description", "Amount"].map((h) => (
                <th key={h} className="text-left px-4 py-2 text-xs font-semibold">{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {income.map((r) => (
                <tr key={r.id} className="border-t border-stone-100">
                  <td className="px-4 py-2">{fmtDate(r.date)}</td>
                  <td className="px-4 py-2">{capitalize(r.category)}</td>
                  <td className="px-4 py-2 text-stone-500">{r.description ?? "—"}</td>
                  <td className="px-4 py-2 text-emerald-700 font-medium">{fmt$(r.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {/* Expense records */}
      {expenses.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-stone-500 uppercase tracking-wide mb-3">Expense Records</h2>
          <table className="w-full text-sm border border-stone-200 rounded-xl overflow-hidden">
            <thead className="bg-stone-50 text-stone-500">
              <tr>{["Date", "Category", "Vendor", "Description", "Amount"].map((h) => (
                <th key={h} className="text-left px-4 py-2 text-xs font-semibold">{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {expenses.map((r) => (
                <tr key={r.id} className="border-t border-stone-100">
                  <td className="px-4 py-2">{fmtDate(r.date)}</td>
                  <td className="px-4 py-2">{capitalize(r.category)}</td>
                  <td className="px-4 py-2 text-stone-500">{r.vendor ?? "—"}</td>
                  <td className="px-4 py-2 text-stone-500">{r.description ?? "—"}</td>
                  <td className="px-4 py-2 text-rose-700 font-medium">{fmt$(r.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}
