"""
Compute ward-level ACS demographics by area-weighting zip-level ACS data.
Outputs the values to embed in generate_ward_filter_data.py.
"""
import geopandas as gpd
import pandas as pd
import json

# Load ward and zip polygons
wards = gpd.read_file("visualization/Wards_from_2022.geojson")[["WARD", "geometry"]]
wards["WARD"] = wards["WARD"].astype(int)
wards = wards.to_crs(epsg=4326)

zips = gpd.read_file("visualization/Zip_Codes.geojson")
zip_col = "ZIPCODE" if "ZIPCODE" in zips.columns else zips.columns[0]
zips = zips[[zip_col, "geometry"]].rename(columns={zip_col: "ZIPCODE"})
zips = zips.to_crs(epsg=4326)

# Load ACS data
acs = pd.read_csv("data/acs_data/dc_acs_data.csv")
acs["ZIPCODE"] = acs["zip code tabulation area"].astype(str)

# Build zip-to-ward weights by area overlap
weights = []
for _, w in wards.iterrows():
    ward_num = w["WARD"]
    for _, z in zips.iterrows():
        inter = w.geometry.intersection(z.geometry)
        if not inter.is_empty:
            frac = inter.area / z.geometry.area
            if frac > 0.01:
                weights.append({
                    "WARD": ward_num,
                    "ZIPCODE": z["ZIPCODE"],
                    "weight": frac,
                })

wdf = pd.DataFrame(weights)
wdf["ZIPCODE"] = wdf["ZIPCODE"].astype(str)
acs["ZIPCODE"] = acs["ZIPCODE"].astype(str)
wdf = wdf.merge(acs[["ZIPCODE", "median_household_income", "poverty_rate",
                       "no_vehicle_share", "population"]], on="ZIPCODE", how="left")

# Drop zips not in ACS
wdf = wdf.dropna(subset=["median_household_income"])

# Population-weighted average per ward
result = {}
for ward_num in range(1, 9):
    w = wdf[wdf["WARD"] == ward_num].copy()
    if w.empty:
        print(f"Ward {ward_num}: no data")
        continue
    # weight = area_fraction * population
    w["pw"] = w["weight"] * w["population"]
    total_pw = w["pw"].sum()
    income = (w["median_household_income"] * w["pw"]).sum() / total_pw
    poverty = (w["poverty_rate"] * w["pw"]).sum() / total_pw
    vehicle_own = 1.0 - (w["no_vehicle_share"] * w["pw"]).sum() / total_pw
    result[ward_num] = {
        "medianIncome": round(income),
        "povertyRate": round(poverty, 3),
        "vehicleOwnership": round(vehicle_own, 2),
    }
    print(f"Ward {ward_num}: income=${income:,.0f}  poverty={poverty:.1%}  vehicleOwn={vehicle_own:.0%}")

print("\nPython dict for generate_ward_filter_data.py:")
print(json.dumps(result, indent=2))
