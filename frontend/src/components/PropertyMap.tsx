"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Property } from "@/lib/api";
import { fmt$ } from "@/lib/utils";

interface GeoProperty extends Property {
  lat: number;
  lng: number;
}

interface Props {
  properties: Property[];
  height?: number;
}

const CACHE_KEY = "rtrack_geocache";
const CACHE_TTL = 30 * 24 * 60 * 60 * 1000; // 30 days

function readCache(): Record<string, { lat: number; lng: number; ts: number }> {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) ?? "{}");
  } catch {
    return {};
  }
}

function getCached(id: string) {
  const cache = readCache();
  const entry = cache[id];
  if (!entry || Date.now() - entry.ts > CACHE_TTL) return null;
  return { lat: entry.lat, lng: entry.lng };
}

function saveCache(id: string, lat: number, lng: number) {
  const cache = readCache();
  cache[id] = { lat, lng, ts: Date.now() };
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {}
}

async function geocode(property: Property): Promise<{ lat: number; lng: number } | null> {
  const cached = getCached(property.id);
  if (cached) return cached;

  const q = encodeURIComponent(
    `${property.address}, ${property.city}, ${property.state} ${property.zip}`
  );
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1`,
      { headers: { "Accept-Language": "en" } }
    );
    const data = await res.json();
    if (!data.length) return null;
    const lat = parseFloat(data[0].lat);
    const lng = parseFloat(data[0].lon);
    saveCache(property.id, lat, lng);
    return { lat, lng };
  } catch {
    return null;
  }
}

export default function PropertyMap({ properties, height = 320 }: Props) {
  const router = useRouter();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<unknown>(null);
  const [geoProps, setGeoProps] = useState<GeoProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [geocoded, setGeocoded] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const results: GeoProperty[] = [];

      // First pass: load from cache instantly
      for (const p of properties) {
        const cached = getCached(p.id);
        if (cached) results.push({ ...p, ...cached });
      }
      if (results.length > 0 && !cancelled) {
        setGeoProps(results);
        setLoading(false);
      }

      // Second pass: fetch uncached ones
      const uncached = properties.filter((p) => !getCached(p.id));
      for (let i = 0; i < uncached.length; i++) {
        if (cancelled) break;
        const p = uncached[i];
        const geo = await geocode(p);
        if (geo && !cancelled) {
          results.push({ ...p, ...geo });
          setGeoProps([...results]);
          setGeocoded(i + 1);
          setLoading(false);
        }
        if (i < uncached.length - 1) {
          await new Promise((r) => setTimeout(r, 1100)); // Nominatim rate limit
        }
      }
      if (!cancelled) setLoading(false);
    }

    if (properties.length > 0) {
      load();
    } else {
      setLoading(false);
    }
    return () => {
      cancelled = true;
    };
  }, [properties]);

  useEffect(() => {
    if (geoProps.length === 0 || !mapRef.current) return;

    const initMap = async () => {
      const L = (await import("leaflet")).default;

      if (mapInstanceRef.current) {
        // Update markers on existing map
        return;
      }

      delete (L.Icon.Default.prototype as Record<string, unknown>)._getIconUrl;

      const map = L.map(mapRef.current!, { zoomControl: true });
      mapInstanceRef.current = map;

      // Warm CartoDB Voyager tiles
      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
        {
          attribution:
            '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> © <a href="https://carto.com/">CARTO</a>',
          maxZoom: 19,
        }
      ).addTo(map);

      const bounds = L.latLngBounds([]);

      for (const p of geoProps) {
        // Custom warm marker
        const icon = L.divIcon({
          className: "",
          html: `
            <div style="
              background: #d97706;
              color: white;
              border-radius: 9999px 9999px 9999px 0;
              transform: rotate(-45deg);
              width: 32px; height: 32px;
              display: flex; align-items: center; justify-content: center;
              box-shadow: 0 2px 8px rgba(0,0,0,0.25);
              border: 2px solid white;
            ">
              <div style="transform: rotate(45deg); font-size: 14px;">🏠</div>
            </div>`,
          iconSize: [32, 32],
          iconAnchor: [8, 32],
          popupAnchor: [8, -36],
        });

        const marker = L.marker([p.lat, p.lng], { icon }).addTo(map);

        const valueHtml =
          p.current_value != null
            ? `<div style="color:#059669;font-weight:700;font-size:15px;margin-top:4px">${fmt$(p.current_value)}</div>`
            : "";

        marker.bindPopup(
          `<div style="min-width:180px;font-family:sans-serif;padding:2px">
            <div style="font-weight:700;font-size:14px;color:#1c1917">${p.name}</div>
            <div style="color:#78716c;font-size:12px;margin-top:2px">${p.address}<br/>${p.city}, ${p.state}</div>
            ${valueHtml}
            <a href="/properties/${p.id}" style="
              display:inline-block;margin-top:8px;padding:4px 12px;
              background:#d97706;color:white;border-radius:6px;
              font-size:12px;font-weight:600;text-decoration:none
            ">View Property →</a>
          </div>`,
          { maxWidth: 220 }
        );

        bounds.extend([p.lat, p.lng]);
      }

      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [48, 48], maxZoom: 14 });
      }
    };

    initMap();

    return () => {
      if (mapInstanceRef.current) {
        (mapInstanceRef.current as { remove: () => void }).remove();
        mapInstanceRef.current = null;
      }
    };
  }, [geoProps, router]);

  const uncachedCount = properties.filter((p) => !getCached(p.id)).length;

  return (
    <div className="relative rounded-2xl overflow-hidden" style={{ height }}>
      {loading && geoProps.length === 0 && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-stone-100">
          <div className="text-center">
            <div className="h-6 w-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-sm text-stone-500">Loading map…</p>
          </div>
        </div>
      )}

      {/* Geocoding progress badge */}
      {!loading && uncachedCount > 0 && geocoded < uncachedCount && (
        <div className="absolute top-3 right-3 z-10 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-1.5 text-xs text-stone-600 shadow-sm border border-stone-100">
          Geocoding {geocoded}/{uncachedCount}…
        </div>
      )}

      <div ref={mapRef} className="h-full w-full" />

      {!loading && geoProps.length === 0 && properties.length > 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-stone-100">
          <p className="text-sm text-stone-400">Could not geocode addresses.</p>
        </div>
      )}
    </div>
  );
}
