import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from data.acs_data.acs_api_key import ACS_API_KEY
import pandas as pd
import requests

YEAR = 2024

vars_ = ["NAME", "B01001_001E", "B19013_001E"]  # name, population, median HH income
base = f"https://api.census.gov/data/{YEAR}/acs/acs5"

# DC ZIPs (ZCTAs)
dc_zips = [
    "20001", "20002", "20003", "20004", "20005", "20006", "20007", "20008", "20009", "20010",
    "20011", "20012", "20015", "20016", "20017", "20018", "20019", "20020", "20024", "20032",
    "20036", "20037"
]

rows = []
for z in dc_zips:
    params = {
        "get": ",".join(vars_),
        "for": f"zip code tabulation area:{z}",
        "key": ACS_API_KEY,
    }

    r = requests.get(base, params=params, timeout=30)

    print("ZIP:", z)
    print("STATUS:", r.status_code)
    print("CONTENT-TYPE:", r.headers.get("Content-Type"))
    print("TEXT (first 300 chars):", r.text[:300])

    # Skip “no content” / empty responses (prevents JSONDecodeError)
    if r.status_code == 204 or not r.text.strip():
        print(f"Skipping {z}: no content (status {r.status_code})")
        continue

    r.raise_for_status()
    data = r.json()

    # Defensive: handle unexpected payloads
    if not data or len(data) < 2:
        print(f"Skipping {z}: unexpected payload shape")
        continue

    rows.append(dict(zip(data[0], data[1])))

df = pd.DataFrame(rows)

# friendlier column names
df = df.rename(
    columns={
        "B01001_001E": "population",
        "B19013_001E": "median_household_income",
    }
)

df["population"] = pd.to_numeric(df["population"], errors="coerce")
df["median_household_income"] = pd.to_numeric(df["median_household_income"], errors="coerce")

print(df.sort_values("population", ascending=False).head())