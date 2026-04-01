"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Building2,
  TrendingUp,
  Users,
  CalendarClock,
  Wrench,
  Eye,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/properties", label: "Properties", icon: Building2 },
  { href: "/analytics", label: "Analytics", icon: TrendingUp },
  { href: "/tenants", label: "Tenants", icon: Users },
  { href: "/events", label: "Events", icon: CalendarClock },
  { href: "/maintenance", label: "Maintenance", icon: Wrench },
  { href: "/watchlist", label: "Watchlist", icon: Eye },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const links = nav.map(({ href, label, icon: Icon }) => {
    const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
    return (
      <Link
        key={href}
        href={href}
        onClick={() => setOpen(false)}
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
          active
            ? "bg-amber-100 text-amber-800 shadow-sm"
            : "text-stone-500 hover:bg-stone-200/60 hover:text-stone-800"
        )}
      >
        <Icon className={cn("h-4 w-4 shrink-0", active ? "text-amber-600" : "text-stone-400")} />
        {label}
      </Link>
    );
  });

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setOpen(true)}
        className="fixed top-4 left-4 z-40 md:hidden p-2 bg-white rounded-lg shadow-sm border border-stone-200"
      >
        <Menu className="h-5 w-5 text-stone-600" />
      </button>

      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/20 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed md:static inset-y-0 left-0 z-50 w-56 shrink-0 flex flex-col",
          "bg-stone-100 border-r border-stone-200 transition-transform duration-200",
          open ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <div className="flex items-center justify-between px-5 py-5 border-b border-stone-200">
          <div>
            <span className="text-lg font-bold text-stone-800 tracking-tight">RealTrack</span>
            <p className="text-xs text-stone-400 mt-0.5">Property Manager</p>
          </div>
          <button onClick={() => setOpen(false)} className="md:hidden text-stone-400 hover:text-stone-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">{links}</nav>

        <div className="px-4 py-4 border-t border-stone-200">
          <p className="text-xs text-stone-400 text-center">Real Estate Tracker</p>
        </div>
      </aside>
    </>
  );
}
