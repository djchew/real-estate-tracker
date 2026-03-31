const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || res.statusText);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

// ── Properties ──────────────────────────────────────────────
export const getProperties = () => request<Property[]>("/properties");
export const getProperty = (id: string) => request<Property>(`/properties/${id}`);
export const createProperty = (data: Partial<Property>) =>
  request<Property>("/properties", { method: "POST", body: JSON.stringify(data) });
export const updateProperty = (id: string, data: Partial<Property>) =>
  request<Property>(`/properties/${id}`, { method: "PUT", body: JSON.stringify(data) });
export const deleteProperty = (id: string) =>
  request<void>(`/properties/${id}`, { method: "DELETE" });

// ── Mortgages ────────────────────────────────────────────────
export const getMortgages = (propertyId: string) =>
  request<Mortgage[]>(`/properties/${propertyId}/mortgages`);
export const createMortgage = (data: Partial<Mortgage>) =>
  request<Mortgage>("/mortgages", { method: "POST", body: JSON.stringify(data) });
export const updateMortgage = (id: string, data: Partial<Mortgage>) =>
  request<Mortgage>(`/mortgages/${id}`, { method: "PUT", body: JSON.stringify(data) });
export const deleteMortgage = (id: string) =>
  request<void>(`/mortgages/${id}`, { method: "DELETE" });

// ── Tenants ──────────────────────────────────────────────────
export const getTenants = (propertyId: string) =>
  request<Tenant[]>(`/properties/${propertyId}/tenants`);
export const createTenant = (data: Partial<Tenant>) =>
  request<Tenant>("/tenants", { method: "POST", body: JSON.stringify(data) });
export const updateTenant = (id: string, data: Partial<Tenant>) =>
  request<Tenant>(`/tenants/${id}`, { method: "PUT", body: JSON.stringify(data) });
export const deleteTenant = (id: string) =>
  request<void>(`/tenants/${id}`, { method: "DELETE" });

// ── Income ───────────────────────────────────────────────────
export const getIncome = (propertyId: string, month?: string) =>
  request<IncomeRecord[]>(
    `/properties/${propertyId}/income${month ? `?month=${month}` : ""}`
  );
export const createIncome = (data: Partial<IncomeRecord>) =>
  request<IncomeRecord>("/income", { method: "POST", body: JSON.stringify(data) });
export const deleteIncome = (id: string) =>
  request<void>(`/income/${id}`, { method: "DELETE" });

// ── Expenses ─────────────────────────────────────────────────
export const getExpenses = (propertyId: string, month?: string) =>
  request<ExpenseRecord[]>(
    `/properties/${propertyId}/expenses${month ? `?month=${month}` : ""}`
  );
export const createExpense = (data: Partial<ExpenseRecord>) =>
  request<ExpenseRecord>("/expenses", { method: "POST", body: JSON.stringify(data) });
export const deleteExpense = (id: string) =>
  request<void>(`/expenses/${id}`, { method: "DELETE" });

// ── Events ───────────────────────────────────────────────────
export const getEvents = (upcoming?: number) =>
  request<Event[]>(`/events${upcoming ? `?upcoming=${upcoming}` : ""}`);
export const createEvent = (data: Partial<Event>) =>
  request<Event>("/events", { method: "POST", body: JSON.stringify(data) });
export const updateEvent = (id: string, data: Partial<Event>) =>
  request<Event>(`/events/${id}`, { method: "PUT", body: JSON.stringify(data) });
export const deleteEvent = (id: string) =>
  request<void>(`/events/${id}`, { method: "DELETE" });

// ── Summary ──────────────────────────────────────────────────
export const getSummary = () => request<Summary>("/summary");
export const getCashFlow = () => request<CashFlowRow[]>("/summary/cash-flow");
export const getAnalyticsData = () => request<{ mortgages: Mortgage[]; tenants: Tenant[] }>("/summary/analytics");

// ── Types ────────────────────────────────────────────────────
export interface Property {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  property_type: string;
  status: string;
  purchase_price?: number;
  current_value?: number;
  purchase_date?: string;
  bedrooms?: number;
  bathrooms?: number;
  square_feet?: number;
  year_built?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Mortgage {
  id: string;
  property_id: string;
  lender: string;
  loan_type: string;
  original_amount: number;
  current_balance: number;
  interest_rate: number;
  monthly_payment: number;
  start_date: string;
  term_months: number;
  is_primary: boolean;
  notes?: string;
}

export interface Tenant {
  id: string;
  property_id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  unit?: string;
  rent_amount: number;
  lease_start: string;
  lease_end?: string;
  status: string;
  security_deposit?: number;
  notes?: string;
}

export interface IncomeRecord {
  id: string;
  property_id: string;
  tenant_id?: string;
  category: string;
  amount: number;
  date: string;
  month: string;
  description?: string;
  tenants?: { first_name: string; last_name: string };
}

export interface ExpenseRecord {
  id: string;
  property_id: string;
  category: string;
  amount: number;
  date: string;
  month: string;
  vendor?: string;
  description?: string;
  is_recurring: boolean;
}

export interface Event {
  id: string;
  property_id?: string;
  title: string;
  category: string;
  due_date: string;
  status: string;
  notes?: string;
  properties?: { name: string; address: string };
}

export interface ExpiringLease {
  id: string;
  first_name: string;
  last_name: string;
  lease_end: string;
  rent_amount: number;
  unit?: string;
  properties?: { id: string; name: string };
}

export interface Summary {
  portfolio_value: number;
  total_equity: number;
  total_debt: number;
  total_monthly_mortgage: number;
  active_properties: number;
  current_month: string;
  monthly_income: number;
  monthly_expenses: number;
  monthly_cash_flow: number;
  upcoming_events: Event[];
  expiring_leases: ExpiringLease[];
}

export interface CashFlowRow {
  property_id: string;
  property_name: string;
  address: string;
  month: string;
  total_income: number;
  total_expenses: number;
  cash_flow: number;
}
