"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createProperty, updateProperty, Property } from "@/lib/api";

const PROPERTY_TYPES = [
  "single_family",
  "multi_family",
  "condo",
  "townhouse",
  "commercial",
  "land",
  "other",
];
const STATUSES = ["active", "vacant", "for_sale", "sold"];

function label(s: string) {
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

interface Props {
  property?: Property;
}

export default function PropertyForm({ property }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: property?.name ?? "",
    address: property?.address ?? "",
    city: property?.city ?? "",
    state: property?.state ?? "",
    zip: property?.zip ?? "",
    property_type: property?.property_type ?? "single_family",
    status: property?.status ?? "active",
    purchase_price: property?.purchase_price?.toString() ?? "",
    current_value: property?.current_value?.toString() ?? "",
    purchase_date: property?.purchase_date ?? "",
    bedrooms: property?.bedrooms?.toString() ?? "",
    bathrooms: property?.bathrooms?.toString() ?? "",
    square_feet: property?.square_feet?.toString() ?? "",
    year_built: property?.year_built?.toString() ?? "",
    notes: property?.notes ?? "",
  });

  function set(field: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const data: Record<string, unknown> = {
        name: form.name,
        address: form.address,
        city: form.city,
        state: form.state,
        zip: form.zip,
        property_type: form.property_type,
        status: form.status,
      };
      if (form.purchase_price) data.purchase_price = parseFloat(form.purchase_price);
      if (form.current_value) data.current_value = parseFloat(form.current_value);
      if (form.purchase_date) data.purchase_date = form.purchase_date;
      if (form.bedrooms) data.bedrooms = parseInt(form.bedrooms);
      if (form.bathrooms) data.bathrooms = parseFloat(form.bathrooms);
      if (form.square_feet) data.square_feet = parseInt(form.square_feet);
      if (form.year_built) data.year_built = parseInt(form.year_built);
      if (form.notes) data.notes = form.notes;

      if (property) {
        await updateProperty(property.id, data);
        router.push(`/properties/${property.id}`);
      } else {
        const created = await createProperty(data);
        router.push(`/properties/${created.id}`);
      }
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      <section className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5 space-y-4">
        <h2 className="text-sm font-semibold text-gray-700">Basic Info</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-gray-600 mb-1">Property Name *</label>
            <input
              required
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder='e.g. "Oak Street Duplex"'
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Type *</label>
            <select
              value={form.property_type}
              onChange={(e) => set("property_type", e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              {PROPERTY_TYPES.map((t) => (
                <option key={t} value={t}>{label(t)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Status *</label>
            <select
              value={form.status}
              onChange={(e) => set("status", e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>{label(s)}</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5 space-y-4">
        <h2 className="text-sm font-semibold text-gray-700">Address</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-gray-600 mb-1">Street Address *</label>
            <input
              required
              value={form.address}
              onChange={(e) => set("address", e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">City *</label>
            <input
              required
              value={form.city}
              onChange={(e) => set("city", e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">State *</label>
              <input
                required
                value={form.state}
                onChange={(e) => set("state", e.target.value)}
                maxLength={2}
                placeholder="TX"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">ZIP *</label>
              <input
                required
                value={form.zip}
                onChange={(e) => set("zip", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5 space-y-4">
        <h2 className="text-sm font-semibold text-gray-700">Financials</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Purchase Price</label>
            <input
              type="number"
              min="0"
              step="any"
              value={form.purchase_price}
              onChange={(e) => set("purchase_price", e.target.value)}
              placeholder="0.00"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Current Value</label>
            <input
              type="number"
              min="0"
              step="any"
              value={form.current_value}
              onChange={(e) => set("current_value", e.target.value)}
              placeholder="0.00"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Purchase Date</label>
            <input
              type="date"
              value={form.purchase_date}
              onChange={(e) => set("purchase_date", e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>
      </section>

      <section className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5 space-y-4">
        <h2 className="text-sm font-semibold text-gray-700">Details</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Bedrooms</label>
            <input
              type="number"
              min="0"
              value={form.bedrooms}
              onChange={(e) => set("bedrooms", e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Bathrooms</label>
            <input
              type="number"
              min="0"
              step="0.5"
              value={form.bathrooms}
              onChange={(e) => set("bathrooms", e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Sq Ft</label>
            <input
              type="number"
              min="0"
              value={form.square_feet}
              onChange={(e) => set("square_feet", e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Year Built</label>
            <input
              type="number"
              min="1800"
              max="2100"
              value={form.year_built}
              onChange={(e) => set("year_built", e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
          <textarea
            rows={3}
            value={form.notes}
            onChange={(e) => set("notes", e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
          />
        </div>
      </section>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="px-5 py-2 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 disabled:opacity-50 transition-colors"
        >
          {saving ? "Saving…" : property ? "Save Changes" : "Create Property"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
