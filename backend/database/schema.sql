-- ============================================================
-- Real Estate Tracker - Supabase Schema
-- Run this in the Supabase SQL Editor to create all tables
-- ============================================================

-- Enable UUID extension (already enabled in Supabase by default)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- ============================================================
-- DROP EXISTING OBJECTS (safe to re-run)
-- ============================================================
DROP VIEW IF EXISTS v_portfolio_summary;
DROP VIEW IF EXISTS v_monthly_cash_flow;
DROP TABLE IF EXISTS watchlist            CASCADE;
DROP TABLE IF EXISTS maintenance_requests CASCADE;
DROP TABLE IF EXISTS events          CASCADE;
DROP TABLE IF EXISTS expense_records CASCADE;
DROP TABLE IF EXISTS income_records  CASCADE;
DROP TABLE IF EXISTS tenants         CASCADE;
DROP TABLE IF EXISTS mortgages       CASCADE;
DROP TABLE IF EXISTS properties      CASCADE;
DROP FUNCTION IF EXISTS update_updated_at CASCADE;


-- ============================================================
-- PROPERTIES
-- ============================================================
CREATE TABLE properties (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            TEXT NOT NULL,                          -- e.g. "Main St Duplex"
    address         TEXT NOT NULL,
    city            TEXT NOT NULL,
    state           TEXT NOT NULL,
    zip             TEXT NOT NULL,
    property_type   TEXT NOT NULL CHECK (property_type IN (
                        'single_family', 'multi_family', 'condo',
                        'townhouse', 'commercial', 'land', 'other'
                    )),
    status          TEXT NOT NULL DEFAULT 'active' CHECK (status IN (
                        'active', 'vacant', 'for_sale', 'sold'
                    )),
    purchase_price  NUMERIC(14, 2),
    current_value   NUMERIC(14, 2),
    purchase_date   DATE,
    bedrooms        SMALLINT,
    bathrooms       NUMERIC(3, 1),
    square_feet     INTEGER,
    year_built      SMALLINT,
    notes           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- MORTGAGES
-- ============================================================
CREATE TABLE mortgages (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id         UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    lender              TEXT NOT NULL,
    loan_type           TEXT NOT NULL DEFAULT 'conventional' CHECK (loan_type IN (
                            'conventional', 'fha', 'va', 'usda', 'jumbo',
                            'adjustable', 'interest_only', 'other'
                        )),
    original_amount     NUMERIC(14, 2) NOT NULL,
    current_balance     NUMERIC(14, 2) NOT NULL,
    interest_rate       NUMERIC(6, 4) NOT NULL,             -- e.g. 0.0675 for 6.75%
    monthly_payment     NUMERIC(10, 2) NOT NULL,
    start_date          DATE NOT NULL,
    term_months         INTEGER NOT NULL,                   -- e.g. 360 for 30-year
    is_primary          BOOLEAN NOT NULL DEFAULT TRUE,      -- primary vs HELOC/2nd
    notes               TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- TENANTS
-- ============================================================
CREATE TABLE tenants (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id     UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    first_name      TEXT NOT NULL,
    last_name       TEXT NOT NULL,
    email           TEXT,
    phone           TEXT,
    unit            TEXT,                                   -- e.g. "Unit 2A" for multi-family
    rent_amount     NUMERIC(10, 2) NOT NULL,
    lease_start     DATE NOT NULL,
    lease_end       DATE,
    status          TEXT NOT NULL DEFAULT 'active' CHECK (status IN (
                        'active', 'past', 'prospective'
                    )),
    security_deposit NUMERIC(10, 2),
    notes           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- INCOME RECORDS
-- ============================================================
CREATE TABLE income_records (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id     UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    tenant_id       UUID REFERENCES tenants(id) ON DELETE SET NULL,
    category        TEXT NOT NULL CHECK (category IN (
                        'rent', 'late_fee', 'parking', 'laundry',
                        'storage', 'pet_fee', 'other'
                    )),
    amount          NUMERIC(10, 2) NOT NULL,
    date            DATE NOT NULL,
    month           TEXT NOT NULL,                         -- format: "YYYY-MM" for easy filtering
    description     TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- EXPENSE RECORDS
-- ============================================================
CREATE TABLE expense_records (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id     UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    category        TEXT NOT NULL CHECK (category IN (
                        'mortgage', 'property_tax', 'insurance', 'hoa',
                        'repair', 'maintenance', 'management_fee',
                        'utilities', 'landscaping', 'cleaning',
                        'legal', 'accounting', 'advertising', 'other'
                    )),
    amount          NUMERIC(10, 2) NOT NULL,
    date            DATE NOT NULL,
    month           TEXT NOT NULL,                         -- format: "YYYY-MM" for easy filtering
    vendor          TEXT,
    description     TEXT,
    is_recurring    BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- WATCHLIST (properties being considered for purchase)
-- ============================================================
CREATE TABLE watchlist (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    listing_url     TEXT,
    address         TEXT NOT NULL,
    suburb          TEXT,
    state           TEXT,
    asking_price    NUMERIC(14, 2),
    bedrooms        SMALLINT,
    bathrooms       NUMERIC(3, 1),
    parking         SMALLINT,
    land_size       INTEGER,                               -- sqm
    property_type   TEXT CHECK (property_type IN (
                        'house', 'unit', 'townhouse', 'land', 'commercial', 'other'
                    )),
    status          TEXT NOT NULL DEFAULT 'watching' CHECK (status IN (
                        'watching', 'inspected', 'offered', 'passed', 'purchased'
                    )),
    notes           TEXT,
    og_title        TEXT,                                  -- cached from listing URL
    og_image        TEXT,
    og_description  TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_watchlist_updated_at
    BEFORE UPDATE ON watchlist
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ============================================================
-- MAINTENANCE REQUESTS
-- ============================================================
CREATE TABLE maintenance_requests (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id     UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    title           TEXT NOT NULL,
    category        TEXT NOT NULL CHECK (category IN (
                        'plumbing', 'electrical', 'hvac', 'appliance',
                        'structural', 'pest', 'landscaping', 'cleaning', 'other'
                    )),
    priority        TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN (
                        'low', 'medium', 'high', 'urgent'
                    )),
    status          TEXT NOT NULL DEFAULT 'open' CHECK (status IN (
                        'open', 'in_progress', 'completed', 'cancelled'
                    )),
    reported_date   DATE NOT NULL DEFAULT CURRENT_DATE,
    completed_date  DATE,
    cost            NUMERIC(10, 2),
    vendor          TEXT,
    notes           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_maintenance_property_id ON maintenance_requests(property_id);
CREATE INDEX idx_maintenance_status      ON maintenance_requests(status);

CREATE TRIGGER trg_maintenance_updated_at
    BEFORE UPDATE ON maintenance_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ============================================================
-- EVENTS / REMINDERS
-- ============================================================
CREATE TABLE events (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id     UUID REFERENCES properties(id) ON DELETE CASCADE,
    title           TEXT NOT NULL,
    category        TEXT NOT NULL CHECK (category IN (
                        'maintenance', 'inspection', 'lease_renewal',
                        'insurance_renewal', 'tax_deadline', 'mortgage_payment',
                        'tenant_move_in', 'tenant_move_out', 'other'
                    )),
    due_date        DATE NOT NULL,
    status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
                        'pending', 'completed', 'cancelled'
                    )),
    notes           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- UPDATED_AT TRIGGER (auto-update on every table that has it)
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_properties_updated_at
    BEFORE UPDATE ON properties
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_mortgages_updated_at
    BEFORE UPDATE ON mortgages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_tenants_updated_at
    BEFORE UPDATE ON tenants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_events_updated_at
    BEFORE UPDATE ON events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_mortgages_property_id     ON mortgages(property_id);
CREATE INDEX idx_tenants_property_id       ON tenants(property_id);
CREATE INDEX idx_income_property_id        ON income_records(property_id);
CREATE INDEX idx_income_month              ON income_records(month);
CREATE INDEX idx_expenses_property_id      ON expense_records(property_id);
CREATE INDEX idx_expenses_month            ON expense_records(month);
CREATE INDEX idx_events_due_date           ON events(due_date);
CREATE INDEX idx_events_property_id        ON events(property_id);


-- ============================================================
-- ANALYTICS VIEW: monthly cash flow per property
-- ============================================================
CREATE OR REPLACE VIEW v_monthly_cash_flow AS
SELECT
    p.id            AS property_id,
    p.name          AS property_name,
    p.address,
    m.month,
    COALESCE(m.total_income, 0)   AS total_income,
    COALESCE(x.total_expenses, 0) AS total_expenses,
    COALESCE(m.total_income, 0) - COALESCE(x.total_expenses, 0) AS cash_flow
FROM properties p
LEFT JOIN (
    SELECT property_id, month, SUM(amount) AS total_income
    FROM income_records
    GROUP BY property_id, month
) m ON m.property_id = p.id
LEFT JOIN (
    SELECT property_id, month, SUM(amount) AS total_expenses
    FROM expense_records
    GROUP BY property_id, month
) x ON x.property_id = p.id AND x.month = m.month
WHERE m.month IS NOT NULL;


-- ============================================================
-- ANALYTICS VIEW: portfolio summary
-- ============================================================
CREATE OR REPLACE VIEW v_portfolio_summary AS
SELECT
    COUNT(*)                                        AS active_properties,
    SUM(current_value)                              AS portfolio_value,
    SUM(current_value) - SUM(COALESCE(mg.total_debt, 0)) AS total_equity,
    SUM(COALESCE(mg.total_debt, 0))                 AS total_debt,
    SUM(COALESCE(mg.total_monthly_payment, 0))      AS total_monthly_mortgage
FROM properties p
LEFT JOIN (
    SELECT
        property_id,
        SUM(current_balance)  AS total_debt,
        SUM(monthly_payment)  AS total_monthly_payment
    FROM mortgages
    GROUP BY property_id
) mg ON mg.property_id = p.id
WHERE p.status = 'active';
