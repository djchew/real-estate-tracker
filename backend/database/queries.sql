-- RealTrack — Sample queries for testing and data exploration
-- Run these in the Supabase SQL Editor to keep your project active
-- and test the schema

-- ============================================================
-- PORTFOLIO SUMMARY (Dashboard stats)
-- ============================================================

SELECT
  COUNT(*) as total_properties,
  SUM(current_value) as portfolio_value,
  SUM(current_value) - SUM(COALESCE(mg.total_debt, 0)) as total_equity,
  SUM(COALESCE(mg.total_debt, 0)) as total_debt,
  SUM(COALESCE(mg.total_monthly_payment, 0)) as total_monthly_mortgage
FROM properties p
LEFT JOIN (
  SELECT property_id, SUM(current_balance) as total_debt, SUM(monthly_payment) as total_monthly_payment
  FROM mortgages
  GROUP BY property_id
) mg ON mg.property_id = p.id
WHERE p.status = 'active';


-- ============================================================
-- PROPERTIES WITH TENANT COUNT
-- ============================================================

SELECT
  p.id,
  p.name,
  p.address,
  p.city,
  p.state,
  p.current_value,
  COUNT(CASE WHEN t.status = 'active' THEN 1 END) as active_tenants,
  SUM(CASE WHEN t.status = 'active' THEN t.rent_amount ELSE 0 END) as total_monthly_rent
FROM properties p
LEFT JOIN tenants t ON t.property_id = p.id
WHERE p.status = 'active'
GROUP BY p.id, p.name, p.address, p.city, p.state, p.current_value
ORDER BY p.name;


-- ============================================================
-- LEASES EXPIRING WITHIN 60 DAYS
-- ============================================================

SELECT
  t.id,
  t.first_name,
  t.last_name,
  t.lease_end,
  t.rent_amount,
  p.name as property_name,
  (t.lease_end - CURRENT_DATE)::int as days_until_expiry
FROM tenants t
JOIN properties p ON p.id = t.property_id
WHERE t.status = 'active'
  AND t.lease_end IS NOT NULL
  AND t.lease_end >= CURRENT_DATE
  AND t.lease_end <= CURRENT_DATE + INTERVAL '60 days'
ORDER BY t.lease_end ASC;


-- ============================================================
-- MONTHLY CASH FLOW BY PROPERTY (Last 12 months)
-- ============================================================

SELECT
  p.id,
  p.name,
  m.month,
  COALESCE(inc.total_income, 0) as total_income,
  COALESCE(exp.total_expenses, 0) as total_expenses,
  COALESCE(inc.total_income, 0) - COALESCE(exp.total_expenses, 0) as net_cash_flow
FROM properties p
CROSS JOIN (
  SELECT DISTINCT TO_CHAR(date, 'YYYY-MM') as month
  FROM income_records
  WHERE date >= CURRENT_DATE - INTERVAL '12 months'
  UNION
  SELECT DISTINCT TO_CHAR(date, 'YYYY-MM') as month
  FROM expense_records
  WHERE date >= CURRENT_DATE - INTERVAL '12 months'
) m
LEFT JOIN (
  SELECT property_id, TO_CHAR(date, 'YYYY-MM') as month, SUM(amount) as total_income
  FROM income_records
  WHERE date >= CURRENT_DATE - INTERVAL '12 months'
  GROUP BY property_id, TO_CHAR(date, 'YYYY-MM')
) inc ON inc.property_id = p.id AND inc.month = m.month
LEFT JOIN (
  SELECT property_id, TO_CHAR(date, 'YYYY-MM') as month, SUM(amount) as total_expenses
  FROM expense_records
  WHERE date >= CURRENT_DATE - INTERVAL '12 months'
  GROUP BY property_id, TO_CHAR(date, 'YYYY-MM')
) exp ON exp.property_id = p.id AND exp.month = m.month
WHERE p.status = 'active'
ORDER BY p.name, m.month DESC;


-- ============================================================
-- MAINTENANCE REQUESTS BY PRIORITY
-- ============================================================

SELECT
  mr.id,
  mr.title,
  mr.priority,
  mr.status,
  mr.reported_date,
  mr.cost,
  p.name as property_name,
  CASE
    WHEN mr.status = 'open' THEN 'urgent'
    WHEN mr.status = 'in_progress' THEN 'in-progress'
    WHEN mr.status = 'completed' THEN 'done'
    ELSE 'other'
  END as workflow_state
FROM maintenance_requests mr
JOIN properties p ON p.id = mr.property_id
WHERE mr.status IN ('open', 'in_progress')
ORDER BY
  CASE mr.priority WHEN 'urgent' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 ELSE 4 END,
  mr.reported_date ASC;


-- ============================================================
-- TOTAL MAINTENANCE COSTS BY PROPERTY
-- ============================================================

SELECT
  p.name,
  COUNT(mr.id) as total_requests,
  COUNT(CASE WHEN mr.status = 'completed' THEN 1 END) as completed,
  SUM(CASE WHEN mr.cost IS NOT NULL THEN mr.cost ELSE 0 END) as total_spent
FROM properties p
LEFT JOIN maintenance_requests mr ON mr.property_id = p.id
WHERE p.status = 'active'
GROUP BY p.id, p.name
ORDER BY total_spent DESC;


-- ============================================================
-- UPCOMING EVENTS (Next 30 days)
-- ============================================================

SELECT
  e.id,
  e.title,
  e.category,
  e.due_date,
  e.status,
  p.name as property_name,
  (e.due_date - CURRENT_DATE)::int as days_until_due
FROM events e
LEFT JOIN properties p ON p.id = e.property_id
WHERE e.due_date >= CURRENT_DATE
  AND e.due_date <= CURRENT_DATE + INTERVAL '30 days'
  AND e.status = 'pending'
ORDER BY e.due_date ASC;


-- ============================================================
-- MORTGAGE SUMMARY BY PROPERTY
-- ============================================================

SELECT
  p.name,
  p.current_value,
  SUM(m.current_balance) as total_debt,
  p.current_value - SUM(m.current_balance) as equity,
  ROUND((p.current_value - SUM(m.current_balance)) / NULLIF(p.current_value, 0) * 100, 1) as equity_percentage,
  SUM(m.monthly_payment) as total_monthly_payment,
  COUNT(m.id) as mortgage_count
FROM properties p
LEFT JOIN mortgages m ON m.property_id = p.id
WHERE p.status = 'active'
GROUP BY p.id, p.name, p.current_value
ORDER BY equity_percentage DESC;


-- ============================================================
-- WATCHLIST SUMMARY
-- ============================================================

SELECT
  COUNT(*) as total_watching,
  COUNT(CASE WHEN status = 'inspected' THEN 1 END) as inspected,
  COUNT(CASE WHEN status = 'offered' THEN 1 END) as offered,
  COUNT(CASE WHEN status = 'watching' THEN 1 END) as actively_watching
FROM watchlist
WHERE status != 'purchased';


-- ============================================================
-- RECENT ACTIVITY (Created/Updated in last 7 days)
-- ============================================================

(
  SELECT 'property' as type, name as item, updated_at FROM properties WHERE updated_at >= CURRENT_DATE - INTERVAL '7 days'
)
UNION
(
  SELECT 'tenant' as type, CONCAT(first_name, ' ', last_name) as item, updated_at FROM tenants WHERE updated_at >= CURRENT_DATE - INTERVAL '7 days'
)
UNION
(
  SELECT 'mortgage' as type, lender as item, updated_at FROM mortgages WHERE updated_at >= CURRENT_DATE - INTERVAL '7 days'
)
UNION
(
  SELECT 'maintenance' as type, title as item, updated_at FROM maintenance_requests WHERE updated_at >= CURRENT_DATE - INTERVAL '7 days'
)
ORDER BY updated_at DESC;


-- ============================================================
-- INCOME vs EXPENSES BY CATEGORY (Current month)
-- ============================================================

SELECT
  EXTRACT(YEAR FROM CURRENT_DATE)::int as year,
  EXTRACT(MONTH FROM CURRENT_DATE)::int as month,
  'Income' as type,
  category,
  SUM(amount) as total
FROM income_records
WHERE TO_CHAR(date, 'YYYY-MM') = TO_CHAR(CURRENT_DATE, 'YYYY-MM')
GROUP BY EXTRACT(YEAR FROM CURRENT_DATE), EXTRACT(MONTH FROM CURRENT_DATE), category

UNION ALL

SELECT
  EXTRACT(YEAR FROM CURRENT_DATE)::int as year,
  EXTRACT(MONTH FROM CURRENT_DATE)::int as month,
  'Expense' as type,
  category,
  SUM(amount) as total
FROM expense_records
WHERE TO_CHAR(date, 'YYYY-MM') = TO_CHAR(CURRENT_DATE, 'YYYY-MM')
GROUP BY EXTRACT(YEAR FROM CURRENT_DATE), EXTRACT(MONTH FROM CURRENT_DATE), category
ORDER BY type, total DESC;


-- ============================================================
-- TENANT STATUS OVERVIEW
-- ============================================================

SELECT
  COUNT(*) as total_tenants,
  COUNT(CASE WHEN status = 'active' THEN 1 END) as active,
  COUNT(CASE WHEN status = 'past' THEN 1 END) as past,
  COUNT(CASE WHEN status = 'prospective' THEN 1 END) as prospective,
  SUM(CASE WHEN status = 'active' THEN rent_amount ELSE 0 END) as total_monthly_rent
FROM tenants;
