import { getProperties, getTenants } from "@/lib/api";
import { fmt$, fmtDate, capitalize } from "@/lib/utils";
import Link from "next/link";
import { Users } from "lucide-react";

const statusColors: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-700",
  past: "bg-gray-100 text-gray-500",
  prospective: "bg-blue-100 text-blue-700",
};

export default async function TenantsPage() {
  const properties = await getProperties();

  // Fetch tenants for all properties in parallel
  const tenantArrays = await Promise.all(properties.map((p) => getTenants(p.id)));
  const tenantsWithProp = tenantArrays.flatMap((tenants, i) =>
    tenants.map((t) => ({ ...t, propertyName: properties[i].name, propertyId: properties[i].id }))
  );

  const active = tenantsWithProp.filter((t) => t.status === "active");
  const others = tenantsWithProp.filter((t) => t.status !== "active");

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tenants</h1>
        <p className="text-sm text-gray-500 mt-1">
          {active.length} active across {properties.length} {properties.length === 1 ? "property" : "properties"}
        </p>
      </div>

      {tenantsWithProp.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center">
          <Users className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No tenants yet</p>
          <p className="text-sm text-gray-400 mt-1">Add tenants from a property page.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {["Tenant", "Property", "Unit", "Rent", "Lease", "Status"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {[...active, ...others].map((t) => (
                <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-800">
                    {t.first_name} {t.last_name}
                    {t.email && <div className="text-xs text-gray-400">{t.email}</div>}
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/properties/${t.propertyId}`} className="text-amber-600 hover:underline">
                      {t.propertyName}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{t.unit ?? "—"}</td>
                  <td className="px-4 py-3 font-medium">{fmt$(t.rent_amount)}/mo</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {fmtDate(t.lease_start)}
                    {t.lease_end ? <> → {fmtDate(t.lease_end)}</> : " (MTM)"}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColors[t.status] ?? ""}`}>
                      {capitalize(t.status)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
