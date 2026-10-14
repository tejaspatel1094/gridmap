# PLAN.md — Build Plan

> Read `SPEC.md` first. This file is the ordered list of steps.
>
> **How to use this file:** do one milestone at a time. Each milestone ends with
> a working app and a git commit. Do not start the next milestone until the
> checkboxes in the current one are ticked.

---

## Current state

**Last updated:** October 2026
**Milestones complete:** 0, 1
**Next up:** Milestone 2 — database schema and migrations

### Where things live

| Thing | Location |
|-------|----------|
| Project root | `/Users/tejaspatel/Development/gridmap` |
| GitHub repo | `github.com/tejaspatel1094/gridmap` |
| Backend | `backend/` — venv at `backend/.venv` |
| Frontend | `frontend/` |
| Database | Postgres 16 in Docker, `localhost:5432` |

### How to start the app

Three terminals, all three required:

```bash
# 1. Database (runs in background, survives terminal close)
cd ~/Development/gridmap
docker compose up -d

# 2. API — the `source` line is required in EVERY new terminal
cd ~/Development/gridmap/backend
source .venv/bin/activate
uvicorn app.main:app --reload

# 3. Frontend
cd ~/Development/gridmap/frontend
npm run dev
```

Then open http://localhost:5173

### Decisions made during the build that differ from the original plan

- **Python 3.15**, not 3.11. The system Python was 3.9 (end of life), so the venv
  was rebuilt on Homebrew's 3.15. Note that pinned versions in `requirements.txt`
  had to be regenerated — `psycopg-binary` had no wheel for 3.15 at the old pin.
  **Rule learned: pin within a Python version, regenerate when changing versions.**
- **Node 26** via Homebrew.
- **ESLint** chosen over Oxlint during Vite scaffolding — more common, so
  error messages are searchable.
- **Docker kept** rather than falling back to SQLite. Docker Desktop was
  available after all.
- **Separate repo**, not nested inside VisualMap. An early attempt at nesting
  created a gitlink (mode 160000) that pushed a pointer instead of the files.

---

## Milestone 0 — Prerequisites ✅ COMPLETE

- [x] EIA API key registered and stored in `.env`
- [x] Node 26 installed (`brew install node`)
- [x] Python 3.15 installed (`brew install python@3.15`)
- [x] Docker Desktop installed and running
- [x] GitHub repo `gridmap` created

---

## Milestone 1 — Skeleton that runs end to end ✅ COMPLETE

**Goal:** a browser page displaying a value fetched from the API, which got it
from Postgres. Achieved — the page shows `api: ok` / `db: ok`.

- [x] `git init`, `.gitignore` covering `.env`, `.venv/`, `node_modules/`, `dist/`
- [x] `SPEC.md`, `PLAN.md`, `CLAUDE.md` committed
- [x] `docker-compose.yml` with Postgres 16, named volume `pgdata`, port 5432
- [x] `docker compose up -d` — verified with
      `docker compose exec db psql -U gridmap -d gridmap -c "SELECT version();"`
- [x] `backend/.venv` created, packages installed, `requirements.txt` frozen
- [x] `app/config.py` — pydantic-settings reading `../.env`
- [x] `app/db.py` — SQLAlchemy engine, `SessionLocal`, `get_db` dependency
- [x] `app/main.py` — FastAPI app, CORS middleware, `GET /api/health`
- [x] `frontend/` scaffolded with Vite + React + TypeScript
- [x] Vite dev proxy forwarding `/api` to `localhost:8000`
- [x] `App.tsx` fetching `/api/health` with loading and error states
- [x] Verified: browser shows `api: ok`, `db: ok`; uvicorn logs `200 OK`

**Committed:** `feat: end-to-end skeleton with health check`

### Problems hit and how they were solved

Keep these — they will recur.

| Symptom | Cause | Fix |
|---------|-------|-----|
| `command not found: uvicorn` / `pip` / `python` | venv not activated in a new terminal | `source .venv/bin/activate` — check for `(.venv)` in the prompt |
| `(.venv)` present but tool still missing | venv active but empty after `rm -rf .venv` | `pip install -r requirements.txt` |
| Claude Code "no file tools" | Corporate managed settings denying all tools + filesystem sandbox | Not self-fixable; built manually instead |
| Files invisible to tooling | Filenames saved as `# SPEC.md` with a literal `#` prefix | `mv "# SPEC.md" SPEC.md` — quotes required, `#` starts a comment in bash |
| `create mode 160000 gridmap` | `git init` inside an existing repo created a gitlink | `git rm --cached gridmap`, move folder out, init separately |
| `Address already in use` | Old uvicorn still holding port 8000 | `kill -9 $(lsof -t -i :8000)` |
| `No module named 'app'` | `app/` folder and `__init__.py` not created yet | Create the folder with an empty `__init__.py` |
| `Attribute "app" not found` | `main.py` existed but was empty | Paste the contents in |
| `No matching distribution psycopg-binary==3.2.13` | Pinned version had no wheel for Python 3.15 | Reinstall unpinned, re-freeze |

---

## Milestone 2 — Schema and migrations ⬅ NEXT

- [ ] `app/models.py` — `State` and `Generation` tables per SPEC §4,
      including `UNIQUE (state_code, year, fuel_code)`
- [ ] `alembic init alembic`, point it at `DATABASE_URL` from config
- [ ] Autogenerate the first migration, **read it before applying**
- [ ] `alembic upgrade head`
- [ ] Confirm both tables exist in Postgres
- [ ] Test the reset path: `alembic downgrade base` then `upgrade head`

**Verify:** tables exist; migration runs cleanly from an empty database.

**Commit:** `feat: database schema and initial migration`

---

## Milestone 3 — Ingest EIA data

The riskiest milestone. Budget real time for it.

- [ ] Seed `states` with 50 states + DC + US
- [ ] Define the fuel allow-list as an explicit constant:
      `COW` coal, `NG` gas, `NUC` nuclear, `HYC` hydro, `WND` wind, `SUN` solar,
      `PEL`/`PC` petroleum, `GEO` geothermal, `WWW`/`WAS` biomass, `OTH` other.
      **Verify these against the live API before trusting them.**
- [ ] `app/ingest.py`:
      - fetch one state, one year, print raw JSON first
      - page through with `offset`/`length`
      - upsert on the unique constraint
      - sleep between requests
      - log progress per state
- [ ] Run for one state/year and **check the numbers against eia.gov by hand**
- [ ] Full ingest: all states, 2015 to latest
- [ ] Run twice, confirm row count unchanged (idempotent)

**Verify:** thousands of rows; spot-check matches EIA's website.

**Commit:** `feat: EIA ingest script with idempotent upsert`

---

## Milestone 4 — API endpoints

- [ ] `app/schemas.py` — Pydantic models for the three responses in SPEC §6
- [ ] `GET /api/years`
- [ ] `GET /api/states?year=`
- [ ] `GET /api/generation?year=&state=`
- [ ] Error cases: unknown state → 404, missing year → 400, empty year → 200 with empty list
- [ ] Exercise every endpoint at `/docs`

**Verify:** percentages for any one state sum to ~100.

**Commit:** `feat: generation API endpoints`

---

## Milestone 5 — Table view (US-1, US-7, US-8)

Table before map: wrong numbers are obvious in a table, invisible in a map.

- [ ] `src/types.ts` mirroring the API responses
- [ ] `src/api.ts` — all fetch calls in one file
- [ ] `YearPicker.tsx` — dropdown from `/api/years`, defaults to `latest`
- [ ] `StateTable.tsx` — sortable by name and total
- [ ] Visible loading and error states

**Verify:** year changes update the table; killing the backend shows an error, not a white page.

**Commit:** `feat: state totals table with year picker`

---

## Milestone 6 — Fuel breakdown (US-3, US-4, US-5, US-6)

- [ ] Selected-state state in `App.tsx`, `null` = national view
- [ ] Row click selects; "Back to US" clears
- [ ] `FuelBreakdown.tsx` — fuel, generation, percent
- [ ] Recharts bar chart
- [ ] Fixed color per fuel, defined once and shared
- [ ] Handle negative values (pumped storage)

**Verify:** Texas gas-heavy, Washington hydro-heavy, Vermont almost no fossil.
If those look wrong, the ingest is wrong — go back to Milestone 3.

**Commit:** `feat: fuel type breakdown with chart`

---

## Milestone 7 — Map (US-2, US-3)

- [ ] `npm i react-simple-maps`, add us-atlas TopoJSON
- [ ] Shade states by total generation
- [ ] Click to select — same handler as the table
- [ ] Hover tooltip, selected-state highlight, legend

**Verify:** Texas darkest; map and table clicks behave identically.

**Commit:** `feat: choropleth map of state generation`

---

## Milestone 8 — Polish and document

- [ ] `README.md` written for a stranger
- [ ] Thousands separators, units, EIA attribution footer
- [ ] Not broken at tablet width
- [ ] Fresh-clone test following only the README

**Commit:** `docs: setup instructions and final polish`

---

## Working rules

**One milestone per session.** Start by pointing at `SPEC.md`, `PLAN.md`, and the
milestone number.

**Commit at every milestone boundary**, with the app working. A milestone that
doesn't run doesn't get committed to `main`.

**Read the code before accepting it.** If you can't explain a file, ask before
moving on. Code you can't read is code you can't debug.

**Read tracebacks from the bottom up.** The last line is the actual error;
everything above it is usually library internals.

**Check the prompt for `(.venv)`** before running anything Python.
