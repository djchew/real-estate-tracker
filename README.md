# RealTrack — Property Portfolio Manager

A modern property management app for Australian landlords with 2–10 investment properties. Track properties, tenants, finances, maintenance, analytics, and investment opportunities all in one place.

## Features

- **Dashboard** — Portfolio overview with map, lease expiry alerts, monthly cash flow, key metrics
- **Properties** — Full CRUD with address autocomplete, details, and per-property P&L reports (printable PDF)
- **Tenants** — Lease tracking with expiry alerts (within 60 days)
- **Financials** — Income & expense records with monthly cash flow chart
- **Analytics** — Cap rate, cash-on-cash return, NOI per property, AUD tax CSV export (July–June FY)
- **Maintenance** — Log repairs with priority, cost, vendor, and status tracking
- **Watchlist** — Track properties being considered with realestate.com.au / domain.com.au link previews
- **Demo Mode** — One-click sample data seeding

## Tech Stack

**Frontend**
- Next.js 16 (App Router, Turbopack)
- TypeScript
- Tailwind CSS v4
- Leaflet + react-leaflet (interactive map)
- Recharts (cash flow chart)
- Nominatim (address autocomplete)

**Backend**
- FastAPI (Python)
- Supabase (PostgreSQL)
- Uvicorn

## Getting Started

### Prerequisites
- Node.js 18+
- Python 3.10+
- Supabase account (free tier is fine)

### Setup

1. **Clone the repo**
```bash
git clone https://github.com/yourusername/realtrack-web.git
cd realtrack-web
```

2. **Set up environment variables**

Backend (`backend/.env`):
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
```

Frontend (`frontend/.env.local`):
```
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

3. **Install dependencies**
```bash
npm install
cd backend && pip install -r requirements.txt && cd ..
```

4. **Set up Supabase**

Run the schema in your Supabase SQL Editor:
```sql
-- Copy contents of backend/database/schema.sql and run it
```

5. **Start the app**
```bash
npm run dev
```

Both the API (port 8000) and frontend (port 3000) will start automatically. The browser opens to `http://localhost:3000`.

## Usage

### First Time Setup
The app shows an onboarding flow on first launch. Either:
- **Add your own properties** — follow the 4-step guide
- **Load demo data** — see a fully populated portfolio with two sample Australian properties

### Key Pages
- `/` — Dashboard
- `/properties` — All properties
- `/properties/[id]` — Property details
- `/properties/[id]/report` — Printable PDF report
- `/analytics` — Investment metrics & tax CSV export
- `/tenants` — All tenants
- `/maintenance` — Maintenance requests
- `/watchlist` — Properties being considered
- `/events` — Upcoming events & reminders
- `/landing` — Public marketing page

### Tax Export
On the Analytics page, select a financial year (July–June) and click **Export CSV** to download income & expenses for your accountant.

### Print Reports
Visit any property's **Report** page and use your browser's Print function to save as PDF.

## Architecture

The app uses Route Groups (`(app)` and `(marketing)`) to separate the main dashboard from the public landing page.

**Key files:**
- `frontend/src/app/(app)/` — Main app pages (dashboard, properties, etc.)
- `frontend/src/app/(marketing)/` — Landing page
- `backend/routers/` — API endpoints (properties, tenants, financials, analytics, etc.)
- `backend/database/schema.sql` — Full PostgreSQL schema

## Shortcuts

A desktop shortcut launcher is available (Windows only). Double-click to start the app without opening a terminal.

## Future Roadmap

- [ ] Multi-user authentication (Supabase Auth)
- [ ] SQLite + Electron desktop app packaging
- [ ] Mobile app (React Native)
- [ ] Integration with accounting software (Xero, MYOB)
- [ ] Tenant portal (submit maintenance requests, view lease)

## License

MIT

## Author

Built for Australian property investors.
