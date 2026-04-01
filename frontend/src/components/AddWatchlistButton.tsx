"use client";

import { useState, useRef, useEffect } from "react";
import { Plus, X, Link2, MapPin } from "lucide-react";
import { useRouter } from "next/navigation";

interface Suggestion {
  display_name: string;
  address: {
    house_number?: string;
    road?: string;
    suburb?: string;
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    postcode?: string;
  };
}

const TYPES = ["house","unit","townhouse","land","commercial","other"];
const STATUSES = ["watching","inspected","offered","passed","purchased"];
const AUS_STATES = ["ACT","NSW","NT","QLD","SA","TAS","VIC","WA"];

export default function AddWatchlistButton() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [addressQuery, setAddressQuery] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const empty = {
    listing_url: "", address: "", suburb: "", state: "VIC",
    asking_price: "", bedrooms: "", bathrooms: "", parking: "",
    land_size: "", property_type: "house", status: "watching", notes: "",
  };
  const [form, setForm] = useState(empty);

  function set(k: string, v: string) { setForm((f) => ({ ...f, [k]: v })); }

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
      } catch { /* silently fail */ }
    }, 500);
  }

  function selectSuggestion(s: Suggestion) {
    const { house_number, road, suburb, city, town, village, state, postcode } = s.address;
    const street = [house_number, road].filter(Boolean).join(" ");
    const resolvedSuburb = suburb ?? city ?? town ?? village ?? "";
    const stateAbbr: Record<string, string> = {
      "New South Wales": "NSW", "Victoria": "VIC", "Queensland": "QLD",
      "Western Australia": "WA", "South Australia": "SA", "Tasmania": "TAS",
      "Australian Capital Territory": "ACT", "Northern Territory": "NT",
    };
    setForm((f) => ({
      ...f,
      address: street,
      suburb: resolvedSuburb,
      state: stateAbbr[state ?? ""] ?? state ?? f.state,
    }));
    setAddressQuery(street);
    setSuggestions([]);
    setShowSuggestions(false);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const payload: Record<string, unknown> = { ...form };
    ["asking_price","bedrooms","bathrooms","parking","land_size"].forEach((k) => {
      if (!payload[k]) delete payload[k];
      else payload[k] = Number(payload[k]);
    });
    ["listing_url","suburb","state","notes"].forEach((k) => { if (!payload[k]) delete payload[k]; });

    await fetch("http://localhost:8000/api/watchlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setLoading(false);
    setOpen(false);
    setForm(empty);
    setAddressQuery("");
    router.refresh();
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold rounded-xl transition-colors"
      >
        <Plus className="h-4 w-4" />
        Add Listing
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 my-4">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-stone-800">Add to Watchlist</h2>
              <button onClick={() => setOpen(false)}><X className="h-5 w-5 text-stone-400" /></button>
            </div>

            <form onSubmit={submit} className="space-y-4">
              {/* Listing URL */}
              <div>
                <label className="text-xs font-medium text-stone-500">Listing URL (realestate.com.au / domain.com.au)</label>
                <div className="mt-1 flex gap-2">
                  <input
                    value={form.listing_url}
                    onChange={(e) => set("listing_url", e.target.value)}
                    placeholder="https://www.realestate.com.au/property/..."
                    className="flex-1 border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
                <p className="text-xs text-stone-400 mt-1 flex items-center gap-1">
                  <Link2 className="h-3 w-3" />
                  Paste the full URL — we&apos;ll fetch the listing preview automatically when you save.
                </p>
              </div>

              {/* Address with autocomplete */}
              <div ref={wrapperRef} className="relative">
                <label className="text-xs font-medium text-stone-500">Address <span className="text-red-400">*</span></label>
                <input
                  required
                  value={addressQuery}
                  onChange={(e) => handleAddressInput(e.target.value)}
                  onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                  placeholder="Start typing an address…"
                  autoComplete="off"
                  className="mt-1 w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
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
                        <span className="text-stone-700 line-clamp-2">{s.display_name}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-stone-500">Suburb</label>
                  <input value={form.suburb} onChange={(e) => set("suburb", e.target.value)}
                    placeholder="e.g. Bondi Beach"
                    className="mt-1 w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
                </div>
                <div>
                  <label className="text-xs font-medium text-stone-500">State</label>
                  <select value={form.state} onChange={(e) => set("state", e.target.value)}
                    className="mt-1 w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400">
                    {AUS_STATES.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-stone-500">Asking Price (AUD)</label>
                  <input type="number" min="0" value={form.asking_price} onChange={(e) => set("asking_price", e.target.value)}
                    placeholder="850000"
                    className="mt-1 w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
                </div>
                <div>
                  <label className="text-xs font-medium text-stone-500">Type</label>
                  <select value={form.property_type} onChange={(e) => set("property_type", e.target.value)}
                    className="mt-1 w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400">
                    {TYPES.map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: "Beds", key: "bedrooms", placeholder: "3" },
                  { label: "Baths", key: "bathrooms", placeholder: "2" },
                  { label: "Parking", key: "parking", placeholder: "1" },
                  { label: "Land (m²)", key: "land_size", placeholder: "450" },
                ].map(({ label, key, placeholder }) => (
                  <div key={key}>
                    <label className="text-xs font-medium text-stone-500">{label}</label>
                    <input type="number" min="0" value={(form as any)[key]} onChange={(e) => set(key, e.target.value)}
                      placeholder={placeholder}
                      className="mt-1 w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
                  </div>
                ))}
              </div>

              <div>
                <label className="text-xs font-medium text-stone-500">Status</label>
                <select value={form.status} onChange={(e) => set("status", e.target.value)}
                  className="mt-1 w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400">
                  {STATUSES.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-stone-500">Notes</label>
                <textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={2}
                  placeholder="e.g. Great street, needs kitchen update, close to schools"
                  className="mt-1 w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none" />
              </div>

              <button type="submit" disabled={loading}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-xl text-sm transition-colors disabled:opacity-50">
                {loading ? "Saving…" : "Add to Watchlist"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
