import { getSummary } from "@/lib/api";
import { fmt$, fmtDate, capitalize } from "@/lib/utils";
import { Building2, TrendingUp, DollarSign, CreditCard, CalendarClock } from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
  const summary = await getSummary();

  const stats = [
    {
      label: "Portfolio Value",
      value: fmt$(summary.portfolio_value),
      icon: Building2,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
    },
    {
      label: "Total Equity",
      value: fmt$(summary.total_equity),
      icon: TrendingUp,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      label: "Monthly Cash Flow",
      value: fmt$(summary.monthly_cash_flow),
      icon: DollarSign,
      color: summary.monthly_cash_flow >= 0 ? "text-emerald-600" : "text-red-600",
      bg: summary.monthly_cash_flow >= 0 ? "bg-emerald-50" : "bg-red-50",
    },
    {
      label: "Total Debt",
      value: fmt$(summary.total_debt),
      icon: CreditCard,
      color: "text-rose-600",
      bg: "bg-rose-50",
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">
          {summary.active_properties} active{" "}
          {summary.active_properties === 1 ? "property" : "properties"} &bull;{" "}
          {summary.current_month}
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className={`inline-flex p-2 rounded-lg ${s.bg} mb-3`}>
              <s.icon className={`h-5 w-5 ${s.color}`} />
            </div>
            <p className="text-xs text-gray-500 font-medium">{s.label}</p>
            <p className={`text-xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* This month breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">This Month</h2>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Income</span>
              <span className="font-medium text-emerald-600">{fmt$(summary.monthly_income)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Expenses</span>
              <span className="font-medium text-rose-600">{fmt$(summary.monthly_expenses)}</span>
            </div>
            <div className="border-t border-gray-100 pt-3 flex justify-between text-sm">
              <span className="font-medium text-gray-700">Net Cash Flow</span>
              <span
                className={`font-bold ${
                  summary.monthly_cash_flow >= 0 ? "text-emerald-600" : "text-red-600"
                }`}
              >
                {fmt$(summary.monthly_cash_flow)}
              </span>
            </div>
          </div>
        </div>

        {/* Upcoming events */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-700">Upcoming Events</h2>
            <Link href="/events" className="text-xs text-indigo-600 hover:underline">
              View all
            </Link>
          </div>
          {summary.upcoming_events.length === 0 ? (
            <p className="text-sm text-gray-400">No upcoming events.</p>
          ) : (
            <ul className="space-y-3">
              {summary.upcoming_events.map((e) => (
                <li key={e.id} className="flex items-start gap-3">
                  <CalendarClock className="h-4 w-4 text-indigo-400 mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{e.title}</p>
                    <p className="text-xs text-gray-400">
                      {fmtDate(e.due_date)} &bull; {capitalize(e.category)}
                      {e.properties ? ` · ${e.properties.name}` : ""}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Quick links */}
      <div className="flex gap-3">
        <Link
          href="/properties/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Building2 className="h-4 w-4" />
          Add Property
        </Link>
        <Link
          href="/events"
          className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
        >
          <CalendarClock className="h-4 w-4" />
          Add Event
        </Link>
      </div>
    </div>
  );
}
