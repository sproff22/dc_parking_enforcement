import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from data.acs_data.acs_api_key import ACS_API_KEY
import pandas as pd
import requests

YEAR = 2024
base = f"https://api.census.gov/data/{YEAR}/acs/acs5"

# Starter pack ACS vars (ZIP/ZCTA level) - NO group() calls (API only allows one group)
vars_ = [
    "NAME",

    # baseline
    "B01001_001E",  # total population
    "B19013_001E",  # median household income

    # poverty (rate)
    "B17001_001E",  # poverty universe
    "B17001_002E",  # below poverty

    # inequality
    "B19083_001E",  # Gini index

    # housing
    "B25003_001E",  # tenure universe
    "B25003_003E",  # renter-occupied
    "B25064_001E",  # median gross rent

    # age
    "B01002_001E",  # median age

    # race (counts -> shares)
    "B02001_001E",  # race universe
    "B02001_002E",  # White alone
    "B02001_003E",  # Black or African American alone
    "B02001_004E",  # American Indian and Alaska Native alone
    "B02001_005E",  # Asian alone

    # Hispanic/Latino (counts -> share)
    "B03003_001E",  # hispanic universe
    "B03003_003E",  # Hispanic or Latino

    # commute mode (shares)
    "B08301_001E",  # commute universe (workers 16+)
    "B08301_003E",  # drove alone
    "B08301_004E",  # carpooled
    "B08301_010E",  # public transportation (excluding taxicab)
    "B08301_019E",  # worked from home

    # employment status (unemployment rate)
    "B23025_004E",  # civilian labor force
    "B23025_005E",  # unemployed

    # vehicle availability (simple no-vehicle share)
    "B08201_001E",  # households
    "B08201_002E",  # households: no vehicle available
]

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

    # Skip “no content” / empty responses
    if r.status_code == 204 or not r.text.strip():
        print(f"Skipping {z}: no content (status {r.status_code})")
        continue

    r.raise_for_status()
    data = r.json()

    if not data or len(data) < 2:
        print(f"Skipping {z}: unexpected payload shape")
        continue

    rows.append(dict(zip(data[0], data[1])))

df = pd.DataFrame(rows)

# friendlier names
rename_map = {
    "B01001_001E": "population",
    "B19013_001E": "median_household_income",

    "B17001_001E": "poverty_universe",
    "B17001_002E": "below_poverty",

    "B19083_001E": "gini_index",

    "B25003_001E": "tenure_universe",
    "B25003_003E": "renter_occupied",
    "B25064_001E": "median_gross_rent",

    "B01002_001E": "median_age",

    "B02001_001E": "race_universe",
    "B02001_002E": "race_white",
    "B02001_003E": "race_black",
    "B02001_004E": "race_aian",
    "B02001_005E": "race_asian",

    "B03003_001E": "hispanic_universe",
    "B03003_003E": "hispanic",

    "B08301_001E": "commute_universe",
    "B08301_003E": "commute_drove_alone",
    "B08301_004E": "commute_carpool",
    "B08301_010E": "commute_public_transit",
    "B08301_019E": "commute_worked_from_home",

    "B23025_004E": "labor_force",
    "B23025_005E": "unemployed",

    "B08201_001E": "households",
    "B08201_002E": "households_no_vehicle",
}
df = df.rename(columns=rename_map)

# numeric conversion
numeric_cols = [c for c in df.columns if c not in ["NAME", "zip code tabulation area"]]
for c in numeric_cols:
    df[c] = pd.to_numeric(df[c], errors="coerce")

def safe_div(n, d):
    return (n / d).where(d.notna() & (d != 0))

# derived features
df["poverty_rate"] = safe_div(df["below_poverty"], df["poverty_universe"])
df["unemployment_rate"] = safe_div(df["unemployed"], df["labor_force"])
df["renter_share"] = safe_div(df["renter_occupied"], df["tenure_universe"])
df["no_vehicle_share"] = safe_div(df["households_no_vehicle"], df["households"])

for c in ["race_white", "race_black", "race_aian", "race_asian"]:
    df[f"{c}_share"] = safe_div(df[c], df["race_universe"])

df["hispanic_share"] = safe_div(df["hispanic"], df["hispanic_universe"])

df["drive_alone_share"] = safe_div(df["commute_drove_alone"], df["commute_universe"])
df["public_transit_share"] = safe_div(df["commute_public_transit"], df["commute_universe"])
df["worked_from_home_share"] = safe_div(df["commute_worked_from_home"], df["commute_universe"])

cols_to_show = [
    "NAME",
    "population",
    "median_household_income",
    "poverty_rate",
    "unemployment_rate",
    "renter_share",
    "no_vehicle_share",
    "median_gross_rent",
    "gini_index",
    "median_age",
    "hispanic_share",
    "public_transit_share",
    "drive_alone_share",
    "worked_from_home_share",
]
cols_to_show = [c for c in cols_to_show if c in df.columns]

print(df[cols_to_show].sort_values("population", ascending=False).head(10))

df.to_csv(ROOT / "data" / "acs_data" / "dc_acs_data.csv", index=False)