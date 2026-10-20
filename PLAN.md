# GridMap

A web app showing US electricity generation by state and fuel type, using data
from the EIA Open Data API.

Pick a year, see every state's total generation as a table and a shaded map,
click a state to see its mix of coal, gas, nuclear, wind, solar, hydro and more
as numbers and a chart.

Data source: [EIA Form EIA-923](https://www.eia.gov/opendata/), utility-scale
electric power sector only. Figures are annual and lag the current year by
roughly one to two years.

---

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript, Vite, Recharts, react-simple-maps |
| Backend | FastAPI, SQLAlchemy 2, Alembic, Python 3.15 |
| Database | PostgreSQL 16 (Docker) |
| Data | EIA Open Data API v2 |

No authentication — all data is public and identical for every visitor.

---

## Prerequisites

- **Docker Desktop**, running
- **Python 3.11+** (built on 3.15)
- **Node 20+** (built on 26)
- **An EIA API key** — free, 30 seconds:
  https://www.eia.gov/opendata/register.php

---

## Setup from a fresh clone

### 1. Clone and configure

```bash
git clone https://github.com/tejaspatel1094/gridmap.git
cd gridmap
cp .env.example .env
```

Open `.env` and replace `your_key_here` with your EIA API key. This file is
gitignored and must never be committed.

### 2. Start the database

```bash
docker compose up -d
docker compose ps
```

`gridmap-db` should show as running. Verify it accepts connections:

```bash
docker compose exec db psql -U gridmap -d gridmap -c "SELECT version();"
```

### 3. Set up the backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Confirm the venv is active — your prompt should start with `(.venv)`.

### 4. Create the schema

```bash
alembic upgrade head
```

Verify:

```bash
cd ..
docker compose exec db psql -U gridmap -d gridmap -c "\dt"
```

You should see `states`, `generation` and `alembic_version`.

### 5. Load the data

```bash
cd backend
source .venv/bin/activate      # if not already active
python -m app.ingest
```

Takes a few minutes — 52 requests to EIA with a pause between each. It prints
a line per state and a row total at the end.

Safe to re-run: the upsert is idempotent, so running it twice refreshes the
data rather than duplicating it.

### 6. Set up the frontend

```bash
cd ../frontend
npm install
```

---

## Running the app

Three processes, three terminals. All three must be running.

```bash
# Terminal 1 — database (background; survives closing the terminal)
cd gridmap
docker compose up -d
```

```bash
# Terminal 2 — API
cd gridmap/backend
source .venv/bin/activate
uvicorn app.main:app --reload
```

```bash
# Terminal 3 — frontend
cd gridmap/frontend
npm run dev
```

Then open **http://localhost:5173**

Interactive API docs are at **http://localhost:8000/docs**

---

## Project layout

```
gridmap/
├── docker-compose.yml      Postgres 16
├── .env                    secrets — NOT committed
├── .env.example            template — committed
├── SPEC.md                 what this is and why
├── PLAN.md                 build history and remaining work
├── CLAUDE.md               conventions
├── backend/
│   ├── requirements.txt
│   ├── alembic/versions/   migrations
│   └── app/
│       ├── config.py       env var loading
│       ├── db.py           engine and session
│       ├── models.py       SQLAlchemy tables
│       ├── schemas.py      Pydantic response models
│       ├── routes.py       the API endpoints
│       ├── states_data.py  state list + fuel allow-list
│       └── ingest.py       EIA → Postgres
└── frontend/
    ├── public/
    │   └── states-10m.json US boundaries (TopoJSON)
    └── src/
        ├── api.ts          all fetch calls
        ├── types.ts        mirrors the backend schemas
        ├── fuelColors.ts   one color per fuel, shared
        └── components/
            ├── YearPicker.tsx
            ├── StateMap.tsx
            ├── StateTable.tsx
            └── FuelBreakdown.tsx
```

---

## API

```
GET /api/health
  → { "api": "ok", "db": "ok" }

GET /api/years
  → { "years": [2015, ..., 2024], "latest": 2024 }

GET /api/states?year=2023
  → { "year", "units", "states": [{ "code", "name", "total" }, ...] }

GET /api/generation?year=2023&state=CO
  → { "year", "state", "name", "units", "total",
      "fuels": [{ "code", "name", "generation", "percent" }, ...] }
```

`state` defaults to `US` (the national aggregate) when omitted.

---

## Important: EIA fuel codes

EIA returns roughly 30 fuel codes per state, nested three levels deep. Summing
them naively roughly triples the real total. Only these eleven
non-overlapping codes are stored:

`COW` coal · `NGO` natural gas · `PET` petroleum · `NUC` nuclear ·
`HYC` hydro · `WND` wind · `SUN` solar · `GEO` geothermal · `BIO` biomass ·
`HPS` pumped storage · `OTH` other

Everything else is skipped by the allow-list in `app/states_data.py`.

Two traps worth knowing:

- **`AOR` vs `REN`** — "all renewables" versus "renewable" differ by exactly
  conventional hydro. In Washington that gap is 61,445 GWh.
- **Negative generation is real.** Pumped storage can consume more than it
  produces. Charts must handle it.

Verify any change to the allow-list by summing the stored fuels for one state
and comparing against EIA's own `ALL` row. The difference must be zero.

```sql
-- Must return 0 rows
SELECT COUNT(*) FROM generation WHERE fuel_code IN ('ALL','REN','FOS','AOR');

-- Colorado 2023 must equal 57297.55904
SELECT SUM(generation) FROM generation WHERE state_code='CO' AND year=2023;
```

---

## Troubleshooting

**`command not found: uvicorn` / `pip` / `python`**
The virtual environment isn't active. Run `source .venv/bin/activate` from
`backend/`. Your prompt should show `(.venv)`. This is required in every new
terminal.

**`Address already in use` on port 8000**
An old server is still running: `kill -9 $(lsof -t -i :8000)`

**`connection refused` on port 5432**
Postgres isn't running: `docker compose up -d`

**Blank page in the browser**
Open the console (Cmd+Option+J) — a JavaScript error will be there. A stale
Vite cache can also cause it: `rm -rf node_modules/.vite` then `npm run dev`.

**Totals look roughly double**
An aggregate fuel code slipped into the database. Run the verification query
above, then re-check the allow-list.

---

## Known issues

- Map shading renders all states the same color; selection and hover work.
- Not optimised for mobile widths.

---

## Development notes

Reload data at any time (safe, idempotent):

```bash
cd backend && source .venv/bin/activate && python -m app.ingest
```

Reset the database entirely:

```bash
docker compose down -v        # -v deletes the volume and all data
docker compose up -d
cd backend && alembic upgrade head && python -m app.ingest
```

Inspect the database:

```bash
docker compose exec db psql -U gridmap -d gridmap   # \dt to list, \q to quit
```