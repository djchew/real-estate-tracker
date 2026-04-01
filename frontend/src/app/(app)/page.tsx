import { getSummary, getProperties } from "@/lib/api";
import { fmt$, fmtDate, capitalize } from "@/lib/utils";
import { Building2, TrendingUp, DollarSign, CreditCard, CalendarClock, AlertTriangle, Plus, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import PropertyMapLazy from "@/components/PropertyMapLazy";
import { LoadDemoButton, ClearDemoButton } from "@/components/DemoButton";

export default async function DashboardPage() {
  const [summary, properties] = await Promise.all([getSummary(), getProperties()]);

  const stats = [
    {
      label: "Portfolio Value",
      value: fmt$(summary.portfolio_value),
      icon: Building2,
      color: "text-amber-700",
      bg: "bg-amber-50",
      border: "border-amber-100",
    },
    {
      label: "Total Equity",
      value: fmt$(summary.total_equity),
      icon: TrendingUp,
      color: "text-emerald-700",
      bg: "bg-emerald-50",
      border: "border-emerald-100",
    },
    {
      label: "Monthly Cash Flow",
      value: fmt$(summary.monthly_cash_flow),
      icon: DollarSign,
      color: summary.monthly_cash_flow >= 0 ? "text-emerald-700" : "text-red-700",
      bg: summary.monthly_cash_flow >= 0 ? "bg-emerald-50" : "bg-red-50",
      border: summary.monthly_cash_flow >= 0 ? "border-emerald-100" : "border-red-100",
    },
    {
      label: "Total Debt",
      value: fmt$(summary.total_debt),
      icon: CreditCard,
      color: "text-rose-700",
      bg: "bg-rose-50",
      border: "border-rose-100",
    },
  ];

  // Show onboarding if no properties yet
  if (properties.length === 0) {
    const steps = [
      { num: 1, title: "Add your first property", desc: "Enter your property's address, type, and value.", href: "/properties/new", cta: "Add Property" },
      { num: 2, title: "Add a tenant", desc: "Record who's renting and their lease details.", href: "/tenants", cta: "Add Tenant" },
      { num: 3, title: "Record income & expenses", desc: "Track rent payments and costs for each property.", href: "/properties", cta: "Go to Properties" },
      { num: 4, title: "View your analytics", desc: "See cap rate, cash-on-cash return, and NOI.", href: "/analytics", cta: "View Analytics" },
    ];
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="text-center mb-10">
          <div className="inline-flex p-4 bg-amber-50 rounded-2xl mb-4">
            <Building2 className="h-10 w-10 text-amber-500" />
          </div>
          <h1 className="text-2xl font-bold text-stone-800">Welcome to RealTrack</h1>
          <p className="text-stone-400 mt-2">Follow these steps to set up your portfolio.</p>
          <div className="mt-4 flex items-center justify-center gap-3">
            <LoadDemoButton />
          </div>
          <p className="text-xs text-stone-400 mt-2">Or add your own data using the steps below</p>
        </div>
        <div className="space-y-4">
          {steps.map((step) => (
            <div key={step.num} className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5 flex items-center gap-5">
              <div className="w-9 h-9 rounded-full bg-amber-100 text-amber-700 font-bold text-sm flex items-center justify-center shrink-0">
                {step.num}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-stone-800">{step.title}</p>
                <p className="text-sm text-stone-400 mt-0.5">{step.desc}</p>
              </div>
              <Link
                href={step.href}
                className="shrink-0 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold rounded-xl transition-colors"
              >
                {step.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-800">Dashboard</h1>
          <p className="text-sm text-stone-400 mt-0.5">
            {summary.active_properties} active {summary.active_properties === 1 ? "property" : "properties"} · {summary.current_month}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ClearDemoButton />
          <Link
            href="/properties/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold rounded-xl shadow-sm transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Property
          </Link>
        </div>
      </div>

      {/* Hero Map */}
      <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
          <div>
            <h2 className="text-sm font-semibold text-stone-700">Your Properties</h2>
            <p className="text-xs text-stone-400 mt-0.5">Click a pin to view details</p>
          </div>
          <Link href="/properties" className="text-xs text-amber-600 hover:text-amber-700 font-medium">
            View all →
          </Link>
        </div>
        {properties.length > 0 ? (
          <PropertyMapLazy properties={properties} height={420} />
        ) : (
          <div className="h-64 flex flex-col items-center justify-center bg-stone-50">
            <Building2 className="h-10 w-10 text-stone-200 mb-3" />
            <p className="text-stone-400 text-sm font-medium">No properties yet</p>
            <Link href="/properties/new" className="mt-3 text-xs text-amber-600 hover:underline font-medium">
              Add your first property →
            </Link>
          </div>
        )}
      </div>

      {/* Lease expiry alert */}
      {summary.expiring_leases.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <h2 className="text-sm font-semibold text-amber-800">
              {summary.expiring_leases.length} lease{summary.expiring_leases.length > 1 ? "s" : ""} expiring within 60 days
            </h2>
          </div>
          <div className="space-y-2">
            {summary.expiring_leases.map((l) => (
              <div key={l.id} className="flex items-center justify-between text-sm">
                <span className="text-amber-800 font-medium">
                  {l.first_name} {l.last_name}
                  {l.unit ? ` · ${l.unit}` : ""}
                </span>
                <div className="flex items-center gap-3">
                  {l.properties && (
                    <Link href={`/properties/${l.properties.id}`} className="text-amber-600 hover:underline text-xs">
                      {l.properties.name}
                    </Link>
                  )}
                  <span className="text-amber-700 font-semibold">Expires {fmtDate(l.lease_end)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className={`bg-white rounded-2xl border ${s.border} shadow-sm p-5`}>
            <div className={`inline-flex p-2 rounded-xl ${s.bg} mb-3`}>
              <s.icon className={`h-5 w-5 ${s.color}`} />
            </div>
            <p className="text-xs text-stone-400 font-medium">{s.label}</p>
            <p className={`text-xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* This month + Events */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-stone-700 mb-4">This Month</h2>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-stone-400">Income</span>
              <span className="font-semibold text-emerald-600">{fmt$(summary.monthly_income)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-stone-400">Expenses</span>
              <span className="font-semibold text-rose-600">{fmt$(summary.monthly_expenses)}</span>
            </div>
            <div className="border-t border-stone-100 pt-3 flex justify-between text-sm">
              <span className="font-semibold text-stone-700">Net Cash Flow</span>
              <span className={`font-bold text-base ${summary.monthly_cash_flow >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                {fmt$(summary.monthly_cash_flow)}
              </span>
            </div>
            <div className="flex justify-between text-sm pt-1">
              <span className="text-stone-400">Monthly Mortgage</span>
              <span className="font-medium text-stone-600">{fmt$(summary.total_monthly_mortgage)}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-stone-700">Upcoming Events</h2>
            <Link href="/events" className="text-xs text-amber-600 hover:text-amber-700 font-medium">
              View all →
            </Link>
          </div>
          {summary.upcoming_events.length === 0 ? (
            <div className="text-center py-4">
              <CalendarClock className="h-8 w-8 text-stone-200 mx-auto mb-2" />
              <p className="text-sm text-stone-400">No upcoming events.</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {summary.upcoming_events.map((e) => (
                <li key={e.id} className="flex items-start gap-3">
                  <div className="mt-0.5 h-2 w-2 rounded-full bg-amber-400 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-stone-800 truncate">{e.title}</p>
                    <p className="text-xs text-stone-400">
                      {fmtDate(e.due_date)} · {capitalize(e.category)}
                      {e.properties ? ` · ${e.properties.name}` : ""}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
