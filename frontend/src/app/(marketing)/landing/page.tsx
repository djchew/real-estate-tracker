import Link from "next/link";
import { Building2, TrendingUp, FileText, Wrench, Download, MapPin, CheckCircle2 } from "lucide-react";

const features = [
  {
    icon: Building2,
    title: "Property Portfolio",
    desc: "Track all your properties in one place — values, equity, mortgage balances, and status at a glance.",
  },
  {
    icon: TrendingUp,
    title: "Investment Analytics",
    desc: "Automatically calculate cap rate, cash-on-cash return, and NOI for every property.",
  },
  {
    icon: FileText,
    title: "P&L Reports",
    desc: "Generate a full income & expense report for any property and print or save it as a PDF.",
  },
  {
    icon: Download,
    title: "Tax Export",
    desc: "Export your financials by Australian financial year (July–June) as a CSV for your accountant.",
  },
  {
    icon: Wrench,
    title: "Maintenance Tracker",
    desc: "Log repairs and maintenance requests per property, with status tracking and cost records.",
  },
  {
    icon: MapPin,
    title: "Interactive Map",
    desc: "See all your properties on a map with key details — click any pin to navigate to the property.",
  },
];

const benefits = [
  "Built for Australian property investors",
  "Tracks 2–10 rental properties",
  "No spreadsheets required",
  "Financial year CSV export for your accountant",
  "Lease expiry alerts so you never miss a renewal",
  "Works on desktop and mobile",
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-stone-50">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-stone-200 bg-white">
        <div>
          <span className="text-xl font-bold text-stone-800 tracking-tight">RealTrack</span>
          <span className="ml-2 text-xs text-stone-400 font-medium">by RealTrack AU</span>
        </div>
        <Link
          href="/"
          className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold rounded-xl transition-colors"
        >
          Open App →
        </Link>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-8 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-100 text-amber-700 text-xs font-semibold rounded-full mb-6">
          Built for Australian property investors
        </div>
        <h1 className="text-5xl font-extrabold text-stone-900 leading-tight mb-6">
          Manage your rental properties<br />
          <span className="text-amber-500">without the spreadsheet chaos</span>
        </h1>
        <p className="text-xl text-stone-500 max-w-2xl mx-auto mb-10">
          RealTrack is a simple, powerful property manager for landlords with 2–10 properties.
          Track finances, tenants, maintenance, and investment performance — all in one place.
        </p>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Link
            href="/"
            className="px-8 py-3.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-2xl text-lg transition-colors shadow-sm"
          >
            Get Started Free →
          </Link>
          <Link
            href="/?demo=1"
            className="px-8 py-3.5 border border-stone-300 text-stone-700 font-semibold rounded-2xl text-lg hover:bg-stone-100 transition-colors"
          >
            View Demo
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-8 pb-20">
        <h2 className="text-2xl font-bold text-stone-800 text-center mb-10">Everything you need to manage your portfolio</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => (
            <div key={f.title} className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6">
              <div className="inline-flex p-2.5 bg-amber-50 rounded-xl mb-4">
                <f.icon className="h-5 w-5 text-amber-600" />
              </div>
              <h3 className="font-semibold text-stone-800 mb-2">{f.title}</h3>
              <p className="text-sm text-stone-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Benefits */}
      <section className="bg-amber-50 border-y border-amber-100 py-16">
        <div className="max-w-3xl mx-auto px-8">
          <h2 className="text-2xl font-bold text-stone-800 text-center mb-8">Why landlords choose RealTrack</h2>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {benefits.map((b) => (
              <li key={b} className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-amber-500 shrink-0" />
                <span className="text-stone-700">{b}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-2xl mx-auto px-8 py-20 text-center">
        <h2 className="text-3xl font-bold text-stone-800 mb-4">Ready to take control of your portfolio?</h2>
        <p className="text-stone-500 mb-8">Start tracking your properties today. No credit card required.</p>
        <Link
          href="/"
          className="px-10 py-4 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-2xl text-lg transition-colors shadow-sm"
        >
          Start for Free →
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-stone-200 py-6 text-center text-sm text-stone-400">
        © {new Date().getFullYear()} RealTrack. Built for Australian property investors.
      </footer>
    </div>
  );
}
