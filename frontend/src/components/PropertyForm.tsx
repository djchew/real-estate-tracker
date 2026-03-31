"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createProperty, updateProperty, Property } from "@/lib/api";
import { MapPin } from "lucide-react";

const PROPERTY_TYPES = [
  "single_family", "multi_family", "condo",
  "townhouse", "commercial", "land", "other",
];
const STATUSES = ["active", "vacant", "for_sale", "sold"];

function label(s: string) {
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

interface Suggestion {
  display_name: string;
  address: {
    house_number?: string;
    road?: string;
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    postcode?: string;
  };
}

const inputClass = "w-full border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white";

export default function PropertyForm({ property }: { property?: Property }) {
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

  // Address autocomplete state
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [addressQuery, setAddressQuery] = useState(property?.address ?? "");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  function set(field: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Debounced Nominatim search
  function handleAddressInput(value: string) {
    setAddressQuery(value);
    set("address", value);
    setSuggestions([]);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.length < 5) { setShowSuggestions(false); return; }

    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(value)}&format=json&addressdetails=1&limit=5&countrycodes=au`,
          { headers: { "Accept-Language": "en" } }
        );
        const data: Suggestion[] = await res.json();
        setSuggestions(data);
        setShowSuggestions(data.length > 0);
      } catch {
        // silently fail — user can still type manually
      }
    }, 500);
  }

  function selectSuggestion(s: Suggestion) {
    const { house_number, road, city, town, village, state, postcode } = s.address;
    const street = [house_number, road].filter(Boolean).join(" ");
    const resolvedCity = city ?? town ?? village ?? "";
    const resolvedState = state ?? "";
    const resolvedZip = postcode?.split("-")[0] ?? "";

    setAddressQuery(street);
    setForm((f) => ({
      ...f,
      address: street,
      city: resolvedCity,
      state: resolvedState.length > 2
        ? resolvedState // Nominatim sometimes returns full state name
        : resolvedState,
      zip: resolvedZip,
    }));
    setSuggestions([]);
    setShowSuggestions(false);
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
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      {/* Basic Info */}
      <section className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5 space-y-4">
        <h2 className="text-sm font-semibold text-stone-700">Basic Info</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-stone-500 mb-1">Property Name *</label>
            <input
              required
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder='e.g. "Oak Street Duplex"'
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-500 mb-1">Type *</label>
            <select value={form.property_type} onChange={(e) => set("property_type", e.target.value)} className={inputClass}>
              {PROPERTY_TYPES.map((t) => <option key={t} value={t}>{label(t)}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-500 mb-1">Status *</label>
            <select value={form.status} onChange={(e) => set("status", e.target.value)} className={inputClass}>
              {STATUSES.map((s) => <option key={s} value={s}>{label(s)}</option>)}
            </select>
          </div>
        </div>
      </section>

      {/* Address with autocomplete */}
      <section className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5 space-y-4">
        <h2 className="text-sm font-semibold text-stone-700">Address</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          {/* Street address with dropdown */}
          <div className="sm:col-span-2" ref={wrapperRef}>
            <label className="block text-xs font-medium text-stone-500 mb-1">Street Address *</label>
            <div className="relative">
              <input
                required
                value={addressQuery}
                onChange={(e) => handleAddressInput(e.target.value)}
                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                placeholder="Start typing an address…"
                autoComplete="off"
                className={inputClass}
              />
              {showSuggestions && (
                <ul className="absolute z-50 mt-1 w-full bg-white border border-stone-200 rounded-xl shadow-lg overflow-hidden">
                  {suggestions.map((s, i) => (
                    <li
                      key={i}
                      onMouseDown={() => selectSuggestion(s)}
                      className="flex items-start gap-2 px-3 py-2.5 text-sm hover:bg-amber-50 cursor-pointer border-b border-stone-50 last:border-0"
                    >
                      <MapPin className="h-3.5 w-3.5 text-amber-400 mt-0.5 shrink-0" />
                      <span className="text-stone-700 leading-tight">{s.display_name}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-500 mb-1">City *</label>
            <input required value={form.city} onChange={(e) => set("city", e.target.value)} className={inputClass} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-stone-500 mb-1">State *</label>
              <input required value={form.state} onChange={(e) => set("state", e.target.value)} maxLength={2} placeholder="TX" className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-500 mb-1">ZIP *</label>
              <input required value={form.zip} onChange={(e) => set("zip", e.target.value)} className={inputClass} />
            </div>
          </div>
        </div>
      </section>

      {/* Financials */}
      <section className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5 space-y-4">
        <h2 className="text-sm font-semibold text-stone-700">Financials</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: "Purchase Price", key: "purchase_price", placeholder: "0.00" },
            { label: "Current Value", key: "current_value", placeholder: "0.00" },
          ].map(({ label: lbl, key, placeholder }) => (
            <div key={key}>
              <label className="block text-xs font-medium text-stone-500 mb-1">{lbl}</label>
              <input type="number" min="0" step="any" value={form[key as keyof typeof form]} onChange={(e) => set(key as keyof typeof form, e.target.value)} placeholder={placeholder} className={inputClass} />
            </div>
          ))}
          <div>
            <label className="block text-xs font-medium text-stone-500 mb-1">Purchase Date</label>
            <input type="date" value={form.purchase_date} onChange={(e) => set("purchase_date", e.target.value)} className={inputClass} />
          </div>
        </div>
      </section>

      {/* Details */}
      <section className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5 space-y-4">
        <h2 className="text-sm font-semibold text-stone-700">Details</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Bedrooms", key: "bedrooms", step: "1", min: "0" },
            { label: "Bathrooms", key: "bathrooms", step: "0.5", min: "0" },
            { label: "Sq Ft", key: "square_feet", step: "1", min: "0" },
            { label: "Year Built", key: "year_built", step: "1", min: "1800" },
          ].map(({ label: lbl, key, step, min }) => (
            <div key={key}>
              <label className="block text-xs font-medium text-stone-500 mb-1">{lbl}</label>
              <input type="number" step={step} min={min} value={form[key as keyof typeof form]} onChange={(e) => set(key as keyof typeof form, e.target.value)} className={inputClass} />
            </div>
          ))}
        </div>
        <div>
          <label className="block text-xs font-medium text-stone-500 mb-1">Notes</label>
          <textarea rows={3} value={form.notes} onChange={(e) => set("notes", e.target.value)} className={`${inputClass} resize-none`} />
        </div>
      </section>

      <div className="flex items-center gap-3">
        <button type="submit" disabled={saving} className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold rounded-xl shadow-sm disabled:opacity-50 transition-colors">
          {saving ? "Saving…" : property ? "Save Changes" : "Create Property"}
        </button>
        <button type="button" onClick={() => router.back()} className="px-4 py-2 border border-stone-200 text-stone-600 text-sm font-medium rounded-xl hover:bg-stone-50 transition-colors">
          Cancel
        </button>
      </div>
    </form>
  );
}
