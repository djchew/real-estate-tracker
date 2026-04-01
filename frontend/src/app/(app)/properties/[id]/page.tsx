import {
  getProperty,
  getMortgages,
  getTenants,
  getIncome,
  getExpenses,
} from "@/lib/api";
import { fmt$, fmtDate, fmtPct, capitalize } from "@/lib/utils";
import Link from "next/link";
import { Pencil, Building2, MapPin, FileText } from "lucide-react";
import FinancialsPanel from "@/components/FinancialsPanel";
import TenantsPanel from "@/components/TenantsPanel";
import MortgagesPanel from "@/components/MortgagesPanel";
import DeletePropertyButton from "@/components/DeletePropertyButton";

export default async function PropertyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [property, mortgages, tenants, income, expenses] = await Promise.all([
    getProperty(id),
    getMortgages(id),
    getTenants(id),
    getIncome(id),
    getExpenses(id),
  ]);

  const equity =
    (property.current_value ?? 0) -
    mortgages.reduce((s, m) => s + m.current_balance, 0);

  const activeTenants = tenants.filter((t) => t.status === "active");
  const monthlyRent = activeTenants.reduce((s, t) => s + t.rent_amount, 0);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-1">
            <Link href="/properties" className="hover:text-amber-600">Properties</Link>
            <span>/</span>
            <span className="text-gray-600">{property.name}</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{property.name}</h1>
          <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {property.address}, {property.city}, {property.state} {property.zip}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/properties/${id}/report`}
            className="inline-flex items-center gap-2 px-3 py-2 border border-stone-200 text-stone-600 text-sm font-medium rounded-lg hover:bg-stone-50 transition-colors"
          >
            <FileText className="h-4 w-4" />
            Report
          </Link>
          <Link
            href={`/properties/${id}/edit`}
            className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Pencil className="h-4 w-4" />
            Edit
          </Link>
          <DeletePropertyButton id={id} />
        </div>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Current Value", value: property.current_value != null ? fmt$(property.current_value) : "—" },
          { label: "Equity", value: property.current_value != null ? fmt$(equity) : "—" },
          { label: "Monthly Rent", value: monthlyRent > 0 ? fmt$(monthlyRent) : "—" },
          { label: "Active Tenants", value: activeTenants.length.toString() },
        ].map((m) => (
          <div key={m.label} className="bg-white rounded-2xl border border-stone-100 shadow-sm p-4">
            <p className="text-xs text-gray-400 font-medium">{m.label}</p>
            <p className="text-xl font-bold text-gray-800 mt-1">{m.value}</p>
          </div>
        ))}
      </div>

      {/* Property details */}
      <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
        <div>
          <p className="text-xs text-gray-400">Type</p>
          <p className="font-medium mt-0.5">{capitalize(property.property_type)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400">Status</p>
          <p className="font-medium mt-0.5">{capitalize(property.status)}</p>
        </div>
        {property.bedrooms != null && (
          <div>
            <p className="text-xs text-gray-400">Bedrooms</p>
            <p className="font-medium mt-0.5">{property.bedrooms}</p>
          </div>
        )}
        {property.bathrooms != null && (
          <div>
            <p className="text-xs text-gray-400">Bathrooms</p>
            <p className="font-medium mt-0.5">{property.bathrooms}</p>
          </div>
        )}
        {property.square_feet != null && (
          <div>
            <p className="text-xs text-gray-400">Sq Ft</p>
            <p className="font-medium mt-0.5">{property.square_feet.toLocaleString()}</p>
          </div>
        )}
        {property.year_built != null && (
          <div>
            <p className="text-xs text-gray-400">Year Built</p>
            <p className="font-medium mt-0.5">{property.year_built}</p>
          </div>
        )}
        {property.purchase_price != null && (
          <div>
            <p className="text-xs text-gray-400">Purchase Price</p>
            <p className="font-medium mt-0.5">{fmt$(property.purchase_price)}</p>
          </div>
        )}
        {property.purchase_date && (
          <div>
            <p className="text-xs text-gray-400">Purchase Date</p>
            <p className="font-medium mt-0.5">{fmtDate(property.purchase_date)}</p>
          </div>
        )}
      </div>

      {property.notes && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
          {property.notes}
        </div>
      )}

      {/* Mortgages */}
      <MortgagesPanel propertyId={id} initialMortgages={mortgages} />

      {/* Tenants */}
      <TenantsPanel propertyId={id} initialTenants={tenants} />

      {/* Income & Expenses */}
      <FinancialsPanel
        propertyId={id}
        initialIncome={income}
        initialExpenses={expenses}
      />
    </div>
  );
}
