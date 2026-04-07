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
FEATURE_PARQUET = ROOT / "DVA-Data" / "output_files" / "feature_data.parquet"
OUT = ROOT / "ui" / "src" / "data" / "wardFilterData.json"
BLOCK_OUT = ROOT / "ui" / "src" / "data" / "blockLookup.json"

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

# Map Bayesian model time labels to UI time labels
BAYES_TIME_MAP = {
    "00:00-02:00": "12am-2am", "02:00-04:00": "2am-4am",
    "04:00-06:00": "4am-6am",  "06:00-08:00": "6am-8am",
    "08:00-10:00": "8am-10am", "10:00-12:00": "10am-12pm",
    "12:00-14:00": "12pm-2pm", "14:00-16:00": "2pm-4pm",
    "16:00-18:00": "4pm-6pm",  "18:00-20:00": "6pm-8pm",
    "20:00-22:00": "8pm-10pm", "22:00-00:00": "10pm-12am",
}
BAYES_DAY_MAP = {
    "Monday": "Mon", "Tuesday": "Tue", "Wednesday": "Wed",
    "Thursday": "Thu", "Friday": "Fri", "Saturday": "Sat", "Sunday": "Sun",
}


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

    # Hourly distribution per ward (broken down by filter dimensions)
    hourly = (
        joined.groupby(["WARD", "hour"])
        .agg(count=("violation", "size"))
        .reset_index()
    )

    # Filtered hourly: ward × hour × timeBand × season × dayOfWeek
    filtered_hourly = (
        joined.groupby(["WARD", "hour", "violGroup", "season", "dayOfWeek"])
        .agg(count=("violation", "size"))
        .reset_index()
    )

    # Monthly distribution per ward
    monthly = (
        joined.groupby(["WARD", "month"])
        .agg(count=("violation", "size"))
        .reset_index()
    )

    # Ward-level ACS data (computed by compute_ward_acs.py)
    WARD_ACS = {
        1: {"medianIncome": 134120, "povertyRate": 0.124, "vehicleOwnership": 0.55,
            "blackShare": 0.38, "whiteShare": 0.35, "hispanicShare": 0.14, "asianShare": 0.05, "population": 92000},
        2: {"medianIncome": 123951, "povertyRate": 0.124, "vehicleOwnership": 0.52,
            "blackShare": 0.17, "whiteShare": 0.56, "hispanicShare": 0.10, "asianShare": 0.08, "population": 88000},
        3: {"medianIncome": 158655, "povertyRate": 0.078, "vehicleOwnership": 0.77,
            "blackShare": 0.05, "whiteShare": 0.76, "hispanicShare": 0.06, "asianShare": 0.07, "population": 85000},
        4: {"medianIncome": 129880, "povertyRate": 0.104, "vehicleOwnership": 0.78,
            "blackShare": 0.47, "whiteShare": 0.26, "hispanicShare": 0.18, "asianShare": 0.04, "population": 86000},
        5: {"medianIncome": 112534, "povertyRate": 0.141, "vehicleOwnership": 0.70,
            "blackShare": 0.62, "whiteShare": 0.18, "hispanicShare": 0.11, "asianShare": 0.04, "population": 84000},
        6: {"medianIncome": 133055, "povertyRate": 0.121, "vehicleOwnership": 0.63,
            "blackShare": 0.28, "whiteShare": 0.47, "hispanicShare": 0.08, "asianShare": 0.08, "population": 91000},
        7: {"medianIncome": 70140,  "povertyRate": 0.245, "vehicleOwnership": 0.63,
            "blackShare": 0.90, "whiteShare": 0.03, "hispanicShare": 0.04, "asianShare": 0.01, "population": 82000},
        8: {"medianIncome": 63069,  "povertyRate": 0.274, "vehicleOwnership": 0.59,
            "blackShare": 0.92, "whiteShare": 0.02, "hispanicShare": 0.03, "asianShare": 0.01, "population": 83000},
    }

    result = {
        "violationTypes": ["All Types"] + sorted(top_violations) + ["OTHER"],
        "timeRanges": ["All Hours"] + TIME_BANDS,
        "seasons": ["All Seasons"] + SEASONS,
        "daysOfWeek": ["All Days"] + DAY_NAMES,
        "wards": {},
    }

    # ---- Load Bayesian posterior scores and assign blocks to wards ----
    print("\nLoading Bayesian posterior scores...")
    bayes_df = pd.read_parquet(FEATURE_PARQUET, columns=[
        "location_block", "day_of_week", "time_band_label", "season",
        "posterior_recurrence_score", "enforcement_grade",
        "total_tickets", "LATITUDE", "LONGITUDE",
    ])
    print(f"  Bayesian rows: {len(bayes_df)}")

    # Spatial join UNIQUE blocks to wards (much faster than 8M rows)
    print("  Spatial-joining unique blocks to wards...")
    block_coords = (
        bayes_df.groupby("location_block")[["LATITUDE", "LONGITUDE"]]
        .first()
        .reset_index()
    )
    block_gdf = gpd.GeoDataFrame(
        block_coords,
        geometry=gpd.points_from_xy(block_coords["LONGITUDE"], block_coords["LATITUDE"]),
        crs="EPSG:4326",
    )
    block_wards = gpd.sjoin(block_gdf, wards_gdf, how="left", predicate="within")
    block_wards = block_wards.dropna(subset=["WARD"])
    block_wards["WARD"] = block_wards["WARD"].astype(int)
    block_ward_map = block_wards.set_index("location_block")["WARD"].to_dict()
    print(f"  Blocks assigned to wards: {len(block_ward_map)} / {block_coords.shape[0]}")

    # Merge ward assignments into full Bayesian dataframe
    bayes_df["WARD"] = bayes_df["location_block"].map(block_ward_map)
    bayes_df = bayes_df.dropna(subset=["WARD"])
    bayes_df["WARD"] = bayes_df["WARD"].astype(int)

    # Map day and time band labels to UI format
    bayes_df["tb_ui"] = bayes_df["time_band_label"].map(BAYES_TIME_MAP)
    bayes_df["dow_ui"] = bayes_df["day_of_week"].map(BAYES_DAY_MAP)

    # Aggregate: per ward × timeBand × season × dayOfWeek
    # Use ticket-weighted mean posterior score (blocks with more tickets matter more)
    bayes_df["weight"] = bayes_df["total_tickets"].clip(lower=1)
    bayes_df["weighted_score"] = (
        bayes_df["posterior_recurrence_score"] * bayes_df["weight"]
    )

    bayes_ward_agg = (
        bayes_df.groupby(["WARD", "tb_ui", "season", "dow_ui"])
        .agg(
            score_sum=("weighted_score", "sum"),
            weight_sum=("weight", "sum"),
            n_blocks=("location_block", "nunique"),
        )
        .reset_index()
    )
    bayes_ward_agg["bayesScore"] = bayes_ward_agg["score_sum"] / bayes_ward_agg["weight_sum"]

    # Build a lookup: (ward, timeBand, season, day) → bayesScore
    bayes_lookup = {}
    for _, row in bayes_ward_agg.iterrows():
        key = (int(row["WARD"]), row["tb_ui"], row["season"], row["dow_ui"])
        bayes_lookup[key] = float(row["bayesScore"])

    # Ward-level overall posterior scores
    bayes_ward_overall = (
        bayes_df.groupby("WARD")
        .agg(
            score_sum=("weighted_score", "sum"),
            weight_sum=("weight", "sum"),
        )
    )
    bayes_ward_overall["bayesScore"] = bayes_ward_overall["score_sum"] / bayes_ward_overall["weight_sum"]
    print("  Ward-level Bayesian scores:")
    for w in range(1, 9):
        if w in bayes_ward_overall.index:
            print(f"    Ward {w}: {bayes_ward_overall.loc[w, 'bayesScore']:.6f}")
    print()

    for ward_num in range(1, 9):
        ward_agg = agg[agg["WARD"] == ward_num]
        ward_hourly = hourly[hourly["WARD"] == ward_num]

        # Build sparse breakdown dict: "viol|time|season|day" -> {count, fineTotal, bayesScore}
        breakdown = {}
        for _, row in ward_agg.iterrows():
            key = f"{row['violGroup']}|{row['timeBand']}|{row['season']}|{row['dayOfWeek']}"
            # Look up the Bayesian score for this ward × time × season × day
            bkey = (ward_num, row["timeBand"], row["season"], row["dayOfWeek"])
            bs = bayes_lookup.get(bkey, 0.0)
            breakdown[key] = {
                "c": int(row["count"]),
                "f": round(float(row["fineTotal"]), 2),
                "b": round(bs, 8),
            }

        total_citations = int(ward_agg["count"].sum())
        total_fines = round(float(ward_agg["fineTotal"].sum()), 2)

        ward_viol_counts = ward_agg.groupby("violGroup")["count"].sum()
        top_viol = ward_viol_counts.idxmax() if len(ward_viol_counts) > 0 else ""

        avg_fine = round(total_fines / total_citations, 2) if total_citations > 0 else 0

        hourly_dist = {}
        for _, row in ward_hourly.iterrows():
            hourly_dist[int(row["hour"])] = int(row["count"])

        # Filtered hourly: keyed by "violation|season|dayOfWeek" -> {hour: count}
        ward_fh = filtered_hourly[filtered_hourly["WARD"] == ward_num]
        hourly_breakdown = {}
        for _, row in ward_fh.iterrows():
            key = f"{row['violGroup']}|{row['season']}|{row['dayOfWeek']}"
            if key not in hourly_breakdown:
                hourly_breakdown[key] = {}
            hourly_breakdown[key][int(row["hour"])] = int(row["count"])

        # Monthly distribution
        ward_monthly = monthly[monthly["WARD"] == ward_num]
        monthly_dist = {}
        for _, row in ward_monthly.iterrows():
            monthly_dist[int(row["month"])] = int(row["count"])

        # Top riskiest blocks in this ward
        ward_blocks = bayes_df[bayes_df["WARD"] == ward_num]
        if len(ward_blocks) > 0:
            block_scores = (
                ward_blocks.groupby("location_block")
                .agg(
                    score=pd.NamedAgg(column="posterior_recurrence_score", aggfunc="mean"),
                    tickets=pd.NamedAgg(column="total_tickets", aggfunc="sum"),
                    lat=pd.NamedAgg(column="LATITUDE", aggfunc="first"),
                    lng=pd.NamedAgg(column="LONGITUDE", aggfunc="first"),
                )
                .sort_values("score", ascending=False)
                .head(10)
            )
            top_blocks = [
                {
                    "block": idx,
                    "score": round(float(r["score"]), 6),
                    "tickets": int(r["tickets"]),
                    "lat": round(float(r["lat"]), 5),
                    "lng": round(float(r["lng"]), 5),
                }
                for idx, r in block_scores.iterrows()
            ]
        else:
            top_blocks = []

        acs = WARD_ACS.get(ward_num, {})

        ward_bayes = float(bayes_ward_overall.loc[ward_num, "bayesScore"]) if ward_num in bayes_ward_overall.index else 0.0

        result["wards"][str(ward_num)] = {
            "citations": total_citations,
            "fineRevenue": total_fines,
            "avgFine": avg_fine,
            "topViolation": top_viol,
            "bayesScore": round(ward_bayes, 8),
            "medianIncome": acs.get("medianIncome", 0),
            "povertyRate": acs.get("povertyRate", 0),
            "vehicleOwnership": acs.get("vehicleOwnership", 0),
            "population": acs.get("population", 0),
            "blackShare": acs.get("blackShare", 0),
            "whiteShare": acs.get("whiteShare", 0),
            "hispanicShare": acs.get("hispanicShare", 0),
            "asianShare": acs.get("asianShare", 0),
            "breakdown": breakdown,
            "hourly": hourly_dist,
            "hourlyBreakdown": hourly_breakdown,
            "monthly": monthly_dist,
            "topBlocks": top_blocks,
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

    # Write block-level lookup for address search
    print(f"\nGenerating block lookup for address search...")
    block_lookup = {}
    for _, row in block_wards.iterrows():
        blk = row["location_block"]
        w = int(row["WARD"])
        lat = round(float(row["LATITUDE"]), 5)
        lng = round(float(row["LONGITUDE"]), 5)
        block_lookup[blk] = {"w": w, "lat": lat, "lng": lng}

    # Add per-block grade summary (overall grade + worst grade across conditions)
    block_grade_agg = (
        bayes_df.groupby("location_block")
        .agg(
            mean_score=pd.NamedAgg(column="posterior_recurrence_score", aggfunc="mean"),
            max_score=pd.NamedAgg(column="posterior_recurrence_score", aggfunc="max"),
            total_tickets=pd.NamedAgg(column="total_tickets", aggfunc="sum"),
        )
    )
    grade_map = {(0, 0.002): "A", (0.002, 0.005): "B", (0.005, 0.01): "C", (0.01, 0.02): "D"}
    def score_to_grade(s):
        if s < 0.002: return "A"
        if s < 0.005: return "B"
        if s < 0.01: return "C"
        if s < 0.02: return "D"
        return "F"

    for blk, row in block_grade_agg.iterrows():
        if blk in block_lookup:
            block_lookup[blk]["g"] = score_to_grade(row["mean_score"])
            block_lookup[blk]["s"] = round(float(row["mean_score"]), 6)
            block_lookup[blk]["t"] = int(row["total_tickets"])

    print(f"Writing {BLOCK_OUT}...")
    with open(BLOCK_OUT, "w") as f:
        json.dump(block_lookup, f, separators=(",", ":"))
    block_size = os.path.getsize(BLOCK_OUT)
    print(f"Block lookup: {len(block_lookup)} blocks, {block_size / 1024:.0f} KB")


if __name__ == "__main__":
    main()
