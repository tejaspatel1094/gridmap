import time

import httpx
from sqlalchemy.dialects.postgresql import insert

from app.config import settings
from app.db import SessionLocal
from app.models import Generation, State
from app.states_data import FUEL_ALLOWLIST, STATES

URL = "https://api.eia.gov/v2/electricity/electric-power-operational-data/data/"
START_YEAR = 2015
END_YEAR = 2024


def seed_states(db):
    rows = [{"code": c, "name": n, "is_national": False} for c, n in STATES]
    rows.append({"code": "US", "name": "United States", "is_national": True})

    stmt = insert(State).values(rows)
    stmt = stmt.on_conflict_do_update(
        index_elements=["code"],
        set_={"name": stmt.excluded.name},
    )
    db.execute(stmt)
    db.commit()
    print(f"Seeded {len(rows)} states")


def fetch_state(code):
    params = {
        "api_key": settings.EIA_API_KEY,
        "frequency": "annual",
        "data[0]": "generation",
        "facets[location][]": code,
        "facets[sectorid][]": "98",
        "start": str(START_YEAR),
        "end": str(END_YEAR),
        "length": 5000,
    }
    response = httpx.get(URL, params=params, timeout=60)
    response.raise_for_status()
    return response.json()["response"]["data"]


def ingest_state(db, code):
    rows = fetch_state(code)

    records = []
    for row in rows:
        fuel = row["fueltypeid"]
        if fuel not in FUEL_ALLOWLIST:
            continue
        if row["generation"] is None:
            continue
        records.append({
            "state_code": code,
            "year": int(row["period"]),
            "fuel_code": fuel,
            "fuel_name": FUEL_ALLOWLIST[fuel],
            "generation": float(row["generation"]),
            "units": row["generation-units"],
        })

    if not records:
        print(f"{code}: no rows")
        return 0

    stmt = insert(Generation).values(records)
    stmt = stmt.on_conflict_do_update(
        index_elements=["state_code", "year", "fuel_code"],
        set_={
            "generation": stmt.excluded.generation,
            "fuel_name": stmt.excluded.fuel_name,
            "units": stmt.excluded.units,
        },
    )
    db.execute(stmt)
    db.commit()
    print(f"{code}: {len(records)} rows")
    return len(records)


def main():
    db = SessionLocal()
    try:
        seed_states(db)
        total = 0
        codes = [c for c, _ in STATES] + ["US"]
        for code in codes:
            total += ingest_state(db, code)
            time.sleep(0.3)
        print(f"\nTotal: {total} rows")
    finally:
        db.close()


if __name__ == "__main__":
    main()