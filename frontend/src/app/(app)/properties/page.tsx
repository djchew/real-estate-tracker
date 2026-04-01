import { getProperties } from "@/lib/api";
import { fmt$, capitalize } from "@/lib/utils";
import Link from "next/link";
import { Building2, Plus, MapPin, BedDouble, Bath } from "lucide-react";
import PropertyMapLazy from "@/components/PropertyMapLazy";

const statusColors: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-700",
  vacant: "bg-amber-100 text-amber-700",
  for_sale: "bg-blue-100 text-blue-700",
  sold: "bg-gray-100 text-gray-500",
};

export default async function PropertiesPage() {
  const properties = await getProperties();

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Properties</h1>
          <p className="text-sm text-gray-500 mt-1">{properties.length} total</p>
        </div>
        <Link
          href="/properties/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Property
        </Link>
      </div>

      {/* Interactive map */}
      {properties.length > 0 && (
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Property Locations</h2>
          <PropertyMapLazy properties={properties} />
        </div>
      )}

      {properties.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center">
          <Building2 className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No properties yet</p>
          <p className="text-sm text-gray-400 mt-1">Add your first property to get started.</p>
          <Link
            href="/properties/new"
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Property
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {properties.map((p) => (
            <Link
              key={p.id}
              href={`/properties/${p.id}`}
              className="group bg-white rounded-2xl border border-stone-100 shadow-sm p-5 hover:border-amber-300 hover:shadow-sm transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h2 className="font-semibold text-gray-900 group-hover:text-amber-600 transition-colors">
                    {p.name}
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {p.address}, {p.city}, {p.state}
                  </p>
                </div>
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    statusColors[p.status] ?? "bg-gray-100 text-gray-500"
                  }`}
                >
                  {capitalize(p.status)}
                </span>
              </div>

              <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                {p.bedrooms != null && (
                  <span className="flex items-center gap-1">
                    <BedDouble className="h-3 w-3" />
                    {p.bedrooms} bd
                  </span>
                )}
                {p.bathrooms != null && (
                  <span className="flex items-center gap-1">
                    <Bath className="h-3 w-3" />
                    {p.bathrooms} ba
                  </span>
                )}
                {p.square_feet != null && (
                  <span>{p.square_feet.toLocaleString()} sqft</span>
                )}
                <span className="ml-auto text-gray-400">{capitalize(p.property_type)}</span>
              </div>

              <div className="border-t border-gray-100 pt-3 flex justify-between text-sm">
                <div>
                  <p className="text-xs text-gray-400">Current Value</p>
                  <p className="font-semibold text-gray-800">
                    {p.current_value != null ? fmt$(p.current_value) : "—"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400">Purchase Price</p>
                  <p className="font-medium text-gray-600">
                    {p.purchase_price != null ? fmt$(p.purchase_price) : "—"}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
