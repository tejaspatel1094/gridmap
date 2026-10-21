# PLAN.md — Build Plan

**Status: COMPLETE.** All eight milestones built, committed and pushed.
See `README.md` for setup and `SPEC.md` for what this is and why.

---

## What was built

A three-tier web application showing US electricity generation by state and
fuel type, 2015–2024, sourced from the EIA Open Data API.

| Layer | Technology | Runs on |
|-------|-----------|---------|
| Frontend | React 19, TypeScript, Vite, Recharts, react-simple-maps | `:5173` |
| Backend | FastAPI, SQLAlchemy 2, Alembic, Python 3.15 | `:8000` |
| Database | PostgreSQL 16 in Docker | `:5432` |

Repo: `github.com/tejaspatel1094/gridmap`
Local: `/Users/tejaspatel/Development/gridmap`

---

## How to run it

```bash
# 1. Database — background; survives closing the terminal
cd ~/Development/gridmap && docker compose up -d

# 2. API — `source` required in EVERY new terminal
cd ~/Development/gridmap/backend
source .venv/bin/activate
uvicorn app.main:app --reload

# 3. Frontend
cd ~/Development/gridmap/frontend && npm run dev
```

UI: http://localhost:5173 — API docs: http://localhost:8000/docs

### Common commands

```bash
# Inspect the database
docker compose exec db psql -U gridmap -d gridmap        # \dt, \d generation, \q
docker compose exec db psql -U gridmap -d gridmap -c "SELECT COUNT(*) FROM generation;"

# Reload data (idempotent — safe to re-run)
cd backend && source .venv/bin/activate && python -m app.ingest

# Full reset
docker compose down -v        # -v deletes the volume and all data
docker compose up -d
cd backend && alembic upgrade head && python -m app.ingest

# Port 8000 stuck
kill -9 $(lsof -t -i :8000)

# Stale Vite cache (blank page, phantom import errors)
cd frontend && rm -rf node_modules/.vite && npm run dev
```

---

## Milestones

| # | Milestone | Status |
|---|-----------|--------|
| 0 | Prerequisites — API key, Node, Python, Docker, repo | ✅ |
| 1 | Skeleton running end to end | ✅ |
| 2 | Database schema and migrations | ✅ |
| 3 | EIA data ingest | ✅ |
| 4 | API endpoints | ✅ |
| 5 | State totals table | ✅ |
| 6 | Fuel breakdown with chart | ✅ |
| 7 | Choropleth map | ✅ (shading unresolved) |
| 8 | Polish and documentation | ✅ |

All eight user stories (US-1 to US-8) from `SPEC.md` are satisfied, with the
exception noted below.

---

## Known issues

**Map shading does not render.** Every state fills with the `NO_DATA` color.
Selection, hover, click-through and geography all work correctly, so the map
is functional as an interface — only the colour scale is broken.

What has been ruled out:
- `code` resolves correctly (clicking Utah selects Utah)
- `hsl()` colours render (the legend gradient displays)
- The TopoJSON loads (112K, geography draws correctly)
- `react-simple-maps` supports React 19 (checked peerDependencies)

**The one unverified link is whether `states` contains data inside the
component.** Start there:

```tsx
export function StateMap({ states, selected, onSelect }: Props) {
  console.log('STATES:', states.length, states[0])
```

If it logs `0`, the map renders before the API responds and `App.tsx` needs a
guard. If it logs `51` with an object, compare the key format against what
`codeFor()` returns.

**Not optimised for mobile widths.**

---

## The fuel code findings — DO NOT LOSE THIS

The most valuable output of this project, and the part that is not obvious
from reading the code.

EIA returns ~30 fuel codes per state, nested three levels deep. Summing them
naively roughly **triples** the real total, consistently and plausibly, in a
way that looks correct until checked against an independent figure.

Verified against Colorado 2023:

```
ALL  57297.55904                    grand total — EXCLUDE
├── FOS  35885.67218   fossil       aggregate — EXCLUDE
│   ├── COW  18787.61670   all coal        ✅ USE
│   ├── NGO  17050.44877   gas & other     ✅ USE
│   └── PET     47.60671   petroleum       ✅ USE
├── REN  21406.92186   renewable    aggregate — EXCLUDE
│   ├── HYC   1583.01193   hydro           ✅ USE
│   ├── WND  16088.97200   wind            ✅ USE
│   ├── SUN   3601.42993   solar           ✅ USE
│   └── BIO    133.50800   biomass         ✅ USE
├── HPS     25.01000   pumped storage      ✅ USE
└── OTH    -20.04500   other               ✅ USE
```

Leaves sum to exactly `ALL`. Plus `NUC` and `GEO`, which Colorado lacks.

**The `AOR` trap.** `AOR` ("all renewables") and `REN` ("renewable") differ by
exactly `HYC`. In Washington, `AOR` = 8,313 while `REN` = 69,759 — the 61,445
gap is conventional hydro. Picking the wrong parent silently ruins every
hydro-heavy state.

**Duplicate pairs.** `BIS`/`BIT`, `COL`/`COW`, `NG`/`NGO`, `PEL`/`PET`,
`SUN`/`SPV`, `WND`/`WNT` return identical values where a state has only one
subtype, then diverge elsewhere. Always take the aggregate of the pair.

**Absent ≠ zero-is-an-error.** Colorado returns no `NUC` or `GEO` rows at all
because it has neither. Treat absence as zero, not as a failure.

**Negative generation is real.** Washington's `HPS` is −3.002. Pumped storage
consumes more than it produces. Charts and percentage maths must survive it.

### Verification queries

Run these after any change to the ingest or allow-list:

```sql
-- Must return 0. Any aggregate code here means double counting.
SELECT COUNT(*) FROM generation WHERE fuel_code IN ('ALL','REN','FOS','AOR');

-- Must equal 57297.55904
SELECT SUM(generation) FROM generation WHERE state_code='CO' AND year=2023;
```

---

## Possible next steps

From the v2 list in `SPEC.md`, roughly in order of value:

- **Fix the map shading** — the only incomplete item in the original spec
- **Filter the map by a single fuel** — "show me solar across the US" makes the
  regional story visible in a way the current view does not
- **Time series for one state** across all ten years — the data is already
  loaded, only the query and chart are missing
- **Compare two states side by side**
- **CSV export**
- **Deploy it** — built laptop-first but containerised, so moving to a free
  tier (Vercel + Render + Neon) is config rather than a rewrite. Teaches
  production environment variables, build-vs-dev differences, and real CORS
  instead of the dev proxy.

---

## Problems hit during the build

Nearly every one was environmental rather than conceptual — filenames, paths,
activation state, ports, version pins. That ratio is normal and does not
improve much with experience; you just recognise the symptoms faster.

| Symptom | Cause | Fix |
|---------|-------|-----|
| `command not found: uvicorn` / `pip` / `python` | venv not activated in a new terminal | `source .venv/bin/activate` — check for `(.venv)` in the prompt |
| `(.venv)` present but tool still missing | venv active but empty after `rm -rf .venv` | `pip install -r requirements.txt` |
| Claude Code "no file tools" | Corporate managed settings denying all tools plus a filesystem sandbox | Not self-fixable; built manually instead |
| Files invisible to tooling | Filenames saved as `# SPEC.md` | `mv "# SPEC.md" SPEC.md` — quotes required; `#` starts a comment in bash |
| `create mode 160000 gridmap` | `git init` inside an existing repo created a gitlink | `git rm --cached`, move the folder out, init separately |
| `Address already in use` | Old uvicorn holding port 8000 | `kill -9 $(lsof -t -i :8000)` |
| `No module named 'app'` | `app/` and `__init__.py` not created yet | Create the folder with an empty `__init__.py` |
| `Attribute "app" not found` | `main.py` existed but was empty | Paste the contents in |
| `No matching distribution psycopg-binary==3.2.13` | Pinned version had no wheel for Python 3.15 | Reinstall unpinned, re-freeze |
| New endpoints missing from `/docs` | Router defined but never registered | `app.include_router(router)` in `main.py` |
| `does not provide an export named 'StateMap'` | Stale Vite module cache | `rm -rf node_modules/.vite`, restart, hard refresh |
| Blank page | JavaScript error, visible only in the browser console | Cmd+Option+J, read the FIRST red line |

---

## Lessons worth carrying forward

**"Done" means the output was correct, not that the command finished.** This
caused three separate problems here: a GitHub push that sent a pointer instead
of files, markdown files that never moved, and a venv that was active but
empty. Each time the command succeeded and the result was wrong. Check
`git status` before committing. Look at the GitHub page after pushing. Read the
response body, not the status code.

**Verify against an independently known number.** The entire ingest was
validated by computing one state's total from EIA's own `ALL` row and checking
the database matched to five decimal places. Find that anchor before building
anything on top of data.

**Test a rule against examples unlike the one you derived it from.** The fuel
allow-list fit Colorado perfectly because it came from Colorado. Washington
(hydro-heavy) and Illinois (nuclear-heavy) were the real tests.

**Read tracebacks from the bottom up.** The last line is the error; everything
above is usually library internals. The same applies to Vite's overlay — the
file, line and message at the top are all that matter.

**When you cannot find a bug, remove the most recent change.** Narrowing the
search beats guessing, especially when the error message is unhelpful.

**Build the thing that exposes your mistakes first.** The table came before the
map deliberately: wrong numbers are obvious in a table and invisible in a
choropleth, which renders bad data as an attractive gradient.