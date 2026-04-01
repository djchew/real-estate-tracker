import PropertyForm from "@/components/PropertyForm";

export default function NewPropertyPage() {
  return (
    <div className="p-6 max-w-2xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Add Property</h1>
        <p className="text-sm text-gray-500 mt-1">Fill in the details for your new property.</p>
      </div>
      <PropertyForm />
    </div>
  );
}
