"""
Generate ward-level data aggregated by violation type, 2-hour time band,
season, and day of week for the UI filter system.
Outputs ui/src/data/wardFilterData.json.
"""

import json
import os
from pathlib import Path
import pandas as pd
import geopandas as gpd

ROOT = Path(__file__).resolve().parent.parent
DC_DATA = ROOT / "data" / "dc_data"
WARD_GEO = ROOT / "visualization" / "Wards_from_2022.geojson"
OUT = ROOT / "ui" / "src" / "data" / "wardFilterData.json"

TIME_BANDS = [
    "12am-2am", "2am-4am", "4am-6am", "6am-8am", "8am-10am", "10am-12pm",
    "12pm-2pm", "2pm-4pm", "4pm-6pm", "6pm-8pm", "8pm-10pm", "10pm-12am",
]

SEASONS = ["Winter", "Spring", "Summer", "Fall"]
SEASON_MAP = {12: "Winter", 1: "Winter", 2: "Winter",
              3: "Spring", 4: "Spring", 5: "Spring",
              6: "Summer", 7: "Summer", 8: "Summer",
              9: "Fall", 10: "Fall", 11: "Fall"}

DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]


def parse_issue_time(t):
    """Parse HHMM military time string to hour (0-23)."""
    try:
        t = str(t).strip()
        if not t or t == "nan":
            return None
        t = int(float(t))
        return t // 100
    except (ValueError, TypeError):
        return None


def time_band(hour):
    if hour is None:
        return None
    idx = hour // 2
    if 0 <= idx < 12:
        return TIME_BANDS[idx]
    return None


def main():
    # Load ward polygons
    print("Loading ward polygons...")
    wards_gdf = gpd.read_file(WARD_GEO)
    wards_gdf = wards_gdf[["WARD", "geometry"]].copy()
    wards_gdf["WARD"] = wards_gdf["WARD"].astype(int)
    wards_gdf = wards_gdf.set_crs(epsg=4326, allow_override=True)

    # Read all parking CSVs
    print("Reading parking violation CSVs...")
    csvs = sorted(DC_DATA.glob("*.csv"))
    dfs = []
    for csv_path in csvs:
        df = pd.read_csv(csv_path, usecols=[
            "VIOLATION_PROC_DESC", "ISSUE_TIME", "ISSUE_DATE", "FINE_AMOUNT",
            "LATITUDE", "LONGITUDE"
        ], dtype={"ISSUE_TIME": str})
        dfs.append(df)
        print(f"  {csv_path.name}: {len(df)} rows")

    all_df = pd.concat(dfs, ignore_index=True)
    print(f"Total rows: {len(all_df)}")

    # Drop rows without coordinates
    all_df = all_df.dropna(subset=["LATITUDE", "LONGITUDE"])
    print(f"Rows with coordinates: {len(all_df)}")

    # Parse time → 2-hour band
    all_df["hour"] = all_df["ISSUE_TIME"].apply(parse_issue_time)
    all_df["timeBand"] = all_df["hour"].apply(time_band)

    # Parse date → season and day of week
    all_df["date"] = pd.to_datetime(all_df["ISSUE_DATE"], errors="coerce")
    all_df["month"] = all_df["date"].dt.month
    all_df["season"] = all_df["month"].map(SEASON_MAP)
    all_df["dayOfWeek"] = all_df["date"].dt.dayofweek.map(
        {i: d for i, d in enumerate(DAY_NAMES)}
    )

    # Clean violation descriptions
    all_df["violation"] = all_df["VIOLATION_PROC_DESC"].fillna("").str.strip()
    all_df = all_df[all_df["violation"] != ""]

    # Parse fine
    all_df["fine"] = pd.to_numeric(all_df["FINE_AMOUNT"], errors="coerce").fillna(0)

    # Spatial join to assign wards
    print("Assigning wards via spatial join...")
    geometry = gpd.points_from_xy(all_df["LONGITUDE"], all_df["LATITUDE"])
    tickets_gdf = gpd.GeoDataFrame(all_df, geometry=geometry, crs="EPSG:4326")

    joined = gpd.sjoin(tickets_gdf, wards_gdf, how="left", predicate="within")
    joined = joined.dropna(subset=["WARD"])
    joined["WARD"] = joined["WARD"].astype(int)
    print(f"Tickets assigned to wards: {len(joined)}")

    # Get top violation types (top 20 by count, plus "OTHER")
    viol_counts = joined["violation"].value_counts()
    top_violations = list(viol_counts.head(20).index)
    print(f"\nTop 20 violation types:")
    for v in top_violations:
        print(f"  {viol_counts[v]:>7}  {v}")

    joined["violGroup"] = joined["violation"].apply(
        lambda v: v if v in top_violations else "OTHER"
    )

    # Drop rows missing any dimension (small fraction)
    joined = joined.dropna(subset=["timeBand", "season", "dayOfWeek"])
    print(f"\nRows with all dimensions: {len(joined)}")

    # Aggregate: ward × violation × timeBand × season × dayOfWeek
    print("Aggregating (4D breakdown)...")
    agg = (
        joined.groupby(["WARD", "violGroup", "timeBand", "season", "dayOfWeek"])
        .agg(count=("violation", "size"), fineTotal=("fine", "sum"))
        .reset_index()
    )
    print(f"  Total breakdown entries: {len(agg)}")

    # Hourly distribution per ward
    hourly = (
        joined.groupby(["WARD", "hour"])
        .agg(count=("violation", "size"))
        .reset_index()
    )

    # Ward-level ACS data (computed by compute_ward_acs.py)
    WARD_ACS = {
        1: {"medianIncome": 134120, "povertyRate": 0.124, "vehicleOwnership": 0.55,
            "blackShare": 0.38, "whiteShare": 0.35, "hispanicShare": 0.14, "asianShare": 0.05},
        2: {"medianIncome": 123951, "povertyRate": 0.124, "vehicleOwnership": 0.52,
            "blackShare": 0.17, "whiteShare": 0.56, "hispanicShare": 0.10, "asianShare": 0.08},
        3: {"medianIncome": 158655, "povertyRate": 0.078, "vehicleOwnership": 0.77,
            "blackShare": 0.05, "whiteShare": 0.76, "hispanicShare": 0.06, "asianShare": 0.07},
        4: {"medianIncome": 129880, "povertyRate": 0.104, "vehicleOwnership": 0.78,
            "blackShare": 0.47, "whiteShare": 0.26, "hispanicShare": 0.18, "asianShare": 0.04},
        5: {"medianIncome": 112534, "povertyRate": 0.141, "vehicleOwnership": 0.70,
            "blackShare": 0.62, "whiteShare": 0.18, "hispanicShare": 0.11, "asianShare": 0.04},
        6: {"medianIncome": 133055, "povertyRate": 0.121, "vehicleOwnership": 0.63,
            "blackShare": 0.28, "whiteShare": 0.47, "hispanicShare": 0.08, "asianShare": 0.08},
        7: {"medianIncome": 70140,  "povertyRate": 0.245, "vehicleOwnership": 0.63,
            "blackShare": 0.90, "whiteShare": 0.03, "hispanicShare": 0.04, "asianShare": 0.01},
        8: {"medianIncome": 63069,  "povertyRate": 0.274, "vehicleOwnership": 0.59,
            "blackShare": 0.92, "whiteShare": 0.02, "hispanicShare": 0.03, "asianShare": 0.01},
    }

    result = {
        "violationTypes": ["All Types"] + sorted(top_violations) + ["OTHER"],
        "timeRanges": ["All Hours"] + TIME_BANDS,
        "seasons": ["All Seasons"] + SEASONS,
        "daysOfWeek": ["All Days"] + DAY_NAMES,
        "wards": {},
    }

    for ward_num in range(1, 9):
        ward_agg = agg[agg["WARD"] == ward_num]
        ward_hourly = hourly[hourly["WARD"] == ward_num]

        # Build sparse breakdown dict: "viol|time|season|day" -> {count, fineTotal}
        breakdown = {}
        for _, row in ward_agg.iterrows():
            key = f"{row['violGroup']}|{row['timeBand']}|{row['season']}|{row['dayOfWeek']}"
            breakdown[key] = {
                "c": int(row["count"]),
                "f": round(float(row["fineTotal"]), 2),
            }

        total_citations = int(ward_agg["count"].sum())
        total_fines = round(float(ward_agg["fineTotal"].sum()), 2)

        ward_viol_counts = ward_agg.groupby("violGroup")["count"].sum()
        top_viol = ward_viol_counts.idxmax() if len(ward_viol_counts) > 0 else ""

        avg_fine = round(total_fines / total_citations, 2) if total_citations > 0 else 0

        hourly_dist = {}
        for _, row in ward_hourly.iterrows():
            hourly_dist[int(row["hour"])] = int(row["count"])

        acs = WARD_ACS.get(ward_num, {})

        result["wards"][str(ward_num)] = {
            "citations": total_citations,
            "fineRevenue": total_fines,
            "avgFine": avg_fine,
            "topViolation": top_viol,
            "medianIncome": acs.get("medianIncome", 0),
            "povertyRate": acs.get("povertyRate", 0),
            "vehicleOwnership": acs.get("vehicleOwnership", 0),
            "blackShare": acs.get("blackShare", 0),
            "whiteShare": acs.get("whiteShare", 0),
            "hispanicShare": acs.get("hispanicShare", 0),
            "asianShare": acs.get("asianShare", 0),
            "breakdown": breakdown,
            "hourly": hourly_dist,
        }

    # Write output
    print(f"\nWriting {OUT}...")
    with open(OUT, "w") as f:
        json.dump(result, f, separators=(",", ":"))

    file_size = os.path.getsize(OUT)
    print(f"Done! File size: {file_size / 1024:.0f} KB")
    print(f"Violation types: {len(result['violationTypes'])}")
    print(f"Wards: {len(result['wards'])}")
    total_keys = sum(len(w["breakdown"]) for w in result["wards"].values())
    print(f"Total breakdown entries: {total_keys}")


if __name__ == "__main__":
    main()
