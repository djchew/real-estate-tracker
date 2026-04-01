import { fmt$, capitalize } from "@/lib/utils";
import { Eye, ExternalLink, BedDouble, Bath, Car, Maximize2 } from "lucide-react";
import AddWatchlistButton from "@/components/AddWatchlistButton";
import WatchlistActions from "@/components/WatchlistActions";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

async function getWatchlist() {
  const res = await fetch(`${BASE}/watchlist`, { cache: "no-store" });
  if (!res.ok) return [];
  return res.json();
}

const statusColors: Record<string, string> = {
  watching:  "bg-blue-100 text-blue-700",
  inspected: "bg-amber-100 text-amber-700",
  offered:   "bg-purple-100 text-purple-700",
  passed:    "bg-stone-100 text-stone-500",
  purchased: "bg-emerald-100 text-emerald-700",
};

const siteIcon: Record<string, string> = {
  "realestate.com.au": "🏠",
  "domain.com.au":     "🏡",
};

function getSiteName(url: string): string {
  try {
    const host = new URL(url).hostname.replace("www.", "");
    return host;
  } catch {
    return url;
  }
}

export default async function WatchlistPage() {
  const items = await getWatchlist();

  const active = items.filter((i: any) => !["passed", "purchased"].includes(i.status));
  const archived = items.filter((i: any) => ["passed", "purchased"].includes(i.status));

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-800">Watchlist</h1>
          <p className="text-sm text-stone-400 mt-1">Properties you&apos;re considering buying</p>
        </div>
        <AddWatchlistButton />
      </div>

      {items.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-stone-200 p-12 text-center">
          <Eye className="h-10 w-10 text-stone-200 mx-auto mb-3" />
          <p className="text-stone-400 font-medium">No properties on your watchlist</p>
          <p className="text-sm text-stone-400 mt-1">Paste a realestate.com.au or domain.com.au link to get started.</p>
        </div>
      ) : (
        <>
          {active.length > 0 && (
            <section className="space-y-4">
              {active.map((item: any) => (
                <WatchlistCard key={item.id} item={item} statusColors={statusColors} siteIcon={siteIcon} getSiteName={getSiteName} />
              ))}
            </section>
          )}

          {archived.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-stone-400 uppercase tracking-wide mb-3">Archived</h2>
              <div className="space-y-4 opacity-60">
                {archived.map((item: any) => (
                  <WatchlistCard key={item.id} item={item} statusColors={statusColors} siteIcon={siteIcon} getSiteName={getSiteName} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}

function WatchlistCard({ item, statusColors, siteIcon, getSiteName }: any) {
  const siteName = item.listing_url ? getSiteName(item.listing_url) : null;
  const icon = siteName ? (siteIcon[siteName] ?? "🔗") : null;

  return (
    <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
      <div className="flex flex-col sm:flex-row">
        {/* OG image */}
        {item.og_image && (
          <div className="sm:w-56 h-40 sm:h-auto shrink-0 bg-stone-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.og_image} alt="" className="w-full h-full object-cover" />
          </div>
        )}

        <div className="flex-1 p-5 min-w-0">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-stone-800 truncate">
                  {item.og_title ?? item.address}
                </h3>
                <span className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${statusColors[item.status]}`}>
                  {capitalize(item.status)}
                </span>
              </div>
              <p className="text-sm text-stone-400 mt-0.5">
                {item.address}{item.suburb ? `, ${item.suburb}` : ""}{item.state ? ` ${item.state}` : ""}
              </p>
            </div>
            {item.asking_price && (
              <p className="text-lg font-bold text-amber-600 shrink-0">{fmt$(item.asking_price)}</p>
            )}
          </div>

          {/* Property specs */}
          <div className="flex items-center gap-4 mt-3 text-xs text-stone-500 flex-wrap">
            {item.property_type && <span className="font-medium">{capitalize(item.property_type)}</span>}
            {item.bedrooms != null && <span className="flex items-center gap-1"><BedDouble className="h-3 w-3" />{item.bedrooms} bd</span>}
            {item.bathrooms != null && <span className="flex items-center gap-1"><Bath className="h-3 w-3" />{item.bathrooms} ba</span>}
            {item.parking != null && <span className="flex items-center gap-1"><Car className="h-3 w-3" />{item.parking} park</span>}
            {item.land_size != null && <span className="flex items-center gap-1"><Maximize2 className="h-3 w-3" />{item.land_size.toLocaleString()} m²</span>}
          </div>

          {item.og_description && (
            <p className="text-xs text-stone-400 mt-2 line-clamp-2">{item.og_description}</p>
          )}
          {item.notes && (
            <p className="text-sm text-stone-600 mt-2 bg-amber-50 rounded-lg px-3 py-2">{item.notes}</p>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-stone-100">
            <div className="flex items-center gap-3">
              {item.listing_url && (
                <a
                  href={item.listing_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-600 hover:text-amber-700"
                >
                  <ExternalLink className="h-3 w-3" />
                  {icon} View on {siteName}
                </a>
              )}
            </div>
            <WatchlistActions id={item.id} currentStatus={item.status} />
          </div>
        </div>
      </div>
    </div>
  );
}
