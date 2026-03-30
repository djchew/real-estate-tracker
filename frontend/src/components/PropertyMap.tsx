"use client";

import { useEffect, useRef, useState } from "react";
import { Property } from "@/lib/api";
import { fmt$, capitalize } from "@/lib/utils";

interface GeoProperty extends Property {
  lat: number;
  lng: number;
}

interface Props {
  properties: Property[];
}

// Geocode an address using OpenStreetMap Nominatim (free, no API key)
async function geocode(property: Property): Promise<GeoProperty | null> {
  const q = encodeURIComponent(
    `${property.address}, ${property.city}, ${property.state} ${property.zip}`
  );
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1`,
      { headers: { "Accept-Language": "en" } }
    );
    const data = await res.json();
    if (data.length === 0) return null;
    return { ...property, lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  } catch {
    return null;
  }
}

export default function PropertyMap({ properties }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [geoProps, setGeoProps] = useState<GeoProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const mapInstanceRef = useRef<unknown>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      // Geocode all properties sequentially to respect Nominatim rate limits
      const results: GeoProperty[] = [];
      for (const p of properties) {
        if (cancelled) break;
        const geo = await geocode(p);
        if (geo) results.push(geo);
        // Nominatim requires 1 req/sec
        await new Promise((r) => setTimeout(r, 1100));
      }
      if (!cancelled) {
        setGeoProps(results);
        setLoading(false);
      }
    }
    if (properties.length > 0) {
      load();
    } else {
      setLoading(false);
    }
    return () => { cancelled = true; };
  }, [properties]);

  useEffect(() => {
    if (loading || geoProps.length === 0 || !mapRef.current) return;
    if (mapInstanceRef.current) return; // already initialised

    // Dynamically import Leaflet to avoid SSR issues
    import("leaflet").then((L) => {
      // Fix default icon path for Next.js
      delete (L.Icon.Default.prototype as Record<string, unknown>)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      if (!mapRef.current) return;
      const map = L.map(mapRef.current);
      mapInstanceRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      const bounds = L.latLngBounds([]);
      for (const p of geoProps) {
        const marker = L.marker([p.lat, p.lng]).addTo(map);
        const equity =
          (p.current_value ?? 0) > 0
            ? `<br/><span style="color:#10b981;font-weight:600">${fmt$(p.current_value ?? 0)} value</span>`
            : "";
        marker.bindPopup(`
          <div style="min-width:160px">
            <strong style="font-size:14px">${p.name}</strong><br/>
            <span style="color:#6b7280;font-size:12px">${p.address}<br/>${p.city}, ${p.state}</span><br/>
            <span style="font-size:12px;color:#6366f1">${capitalize(p.property_type)} · ${capitalize(p.status)}</span>
            ${equity}
          </div>
        `);
        bounds.extend([p.lat, p.lng]);
      }

      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
      }
    });

    return () => {
      if (mapInstanceRef.current) {
        (mapInstanceRef.current as { remove: () => void }).remove();
        mapInstanceRef.current = null;
      }
    };
  }, [loading, geoProps]);

  return (
    <div className="relative">
      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-gray-50 rounded-xl">
          <div className="text-center">
            <div className="h-6 w-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-sm text-gray-500">Geocoding addresses…</p>
          </div>
        </div>
      )}
      <div
        ref={mapRef}
        className="h-80 w-full rounded-xl border border-gray-200 z-0"
        style={{ minHeight: 320 }}
      />
      {!loading && geoProps.length === 0 && properties.length > 0 && (
        <p className="text-xs text-gray-400 mt-2 text-center">
          Could not geocode any addresses. Check that your addresses are complete.
        </p>
      )}
    </div>
  );
}
