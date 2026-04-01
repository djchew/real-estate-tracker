import { getProperty } from "@/lib/api";
import PropertyForm from "@/components/PropertyForm";
import Link from "next/link";

export default async function EditPropertyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const property = await getProperty(id);

  return (
    <div className="p-6 max-w-2xl space-y-5">
      <div>
        <div className="flex items-center gap-2 text-sm text-gray-400 mb-1">
          <Link href="/properties" className="hover:text-indigo-600">Properties</Link>
          <span>/</span>
          <Link href={`/properties/${id}`} className="hover:text-indigo-600">{property.name}</Link>
          <span>/</span>
          <span className="text-gray-600">Edit</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Edit Property</h1>
      </div>
      <PropertyForm property={property} />
    </div>
  );
}
