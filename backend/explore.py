import json

import httpx

from app.config import settings

URL = "https://api.eia.gov/v2/electricity/electric-power-operational-data/data/"

params = {
    "api_key": settings.EIA_API_KEY,
    "frequency": "annual",
    "data[0]": "generation",
    "facets[location][]": "WA",
    "facets[sectorid][]": "98",
    "start": "2023",
    "end": "2023",
    "length": 50,
}

response = httpx.get(URL, params=params, timeout=30)
print("STATUS:", response.status_code)

payload = response.json()
print(json.dumps(payload, indent=2)[:3000])
codes = [(d["fueltypeid"], d["fuelTypeDescription"], d["generation"]) for d in payload["response"]["data"]]
for code, desc, gen in sorted(codes):
    print(f"{code:6} {gen:>14}  {desc}")

FUEL_ALLOWLIST = {
    "COW": "coal",
    "NGO": "natural gas",
    "PET": "petroleum",
    "NUC": "nuclear",
    "HYC": "hydro",
    "WND": "wind",
    "SUN": "solar",
    "GEO": "geothermal",
    "BIO": "biomass",
    "HPS": "pumped storage",
    "OTH": "other",
}

ALLOW = {"COW", "NGO", "PET", "NUC", "HYC", "WND", "SUN", "GEO", "BIO", "HPS", "OTH"}

rows = payload["response"]["data"]
total = next(float(d["generation"]) for d in rows if d["fueltypeid"] == "ALL")
summed = sum(float(d["generation"]) for d in rows if d["fueltypeid"] in ALLOW)

print(f"ALL:    {total:,.2f}")
print(f"SUMMED: {summed:,.2f}")
print(f"DIFF:   {total - summed:,.5f}")