from pathlib import Path
import pandas as pd

dc_dir = Path("dc_data")
csv_files = sorted(dc_dir.glob("*.csv"))

if not csv_files:
    raise FileNotFoundError(f"No CSV files found in: {dc_dir.resolve()}")

DROP_COL = "VIOLATION_TYPE_DESC"

# Read all CSVs, drop the column everywhere, then verify schemas match
dfs = []
base_cols = None
mismatches = []

for fp in csv_files:
    df = pd.read_csv(fp)

    # Drop the problematic column from all files (ignore if missing)
    df = df.drop(columns=[DROP_COL], errors="ignore")

    cols = list(df.columns)
    if base_cols is None:
        base_cols = cols
    else:
        missing = sorted(set(base_cols) - set(cols))
        extra = sorted(set(cols) - set(base_cols))
        same_set_diff_order = (set(cols) == set(base_cols) and cols != base_cols)

        if missing or extra:
            mismatches.append(
                {
                    "file": str(fp),
                    "missing_cols": missing,
                    "extra_cols": extra,
                    "same_set_diff_order": same_set_diff_order,
                }
            )

        # If same set but different order, reorder to match base_cols
        if same_set_diff_order:
            df = df[base_cols]

    dfs.append(df)

if mismatches:
    print("Column mismatches found (no concat performed):")
    for m in mismatches:
        print(f"\n- {m['file']}")
        if m["missing_cols"]:
            print("  Missing:", m["missing_cols"])
        if m["extra_cols"]:
            print("  Extra:  ", m["extra_cols"])
        if m["same_set_diff_order"]:
            print("  Note: same columns but different order")
    raise ValueError("Fix mismatched columns before concatenating.")

# Concatenate
all_df = pd.concat(dfs, ignore_index=True)

# Parse + sort by ISSUE_DATE ascending
if "ISSUE_DATE" not in all_df.columns:
    raise KeyError("ISSUE_DATE column not found in the concatenated dataframe.")

all_df["ISSUE_DATE"] = pd.to_datetime(all_df["ISSUE_DATE"], errors="coerce")
all_df = all_df.sort_values("ISSUE_DATE", ascending=True, na_position="last").reset_index(drop=True)

# load ticket_zcta_lookup.csv and merge to add ZCTA column to all_df
lookup_path = Path("ticket_zcta_lookup.csv")
if not lookup_path.exists():
    raise FileNotFoundError(f"Missing {lookup_path.resolve()} (generate it first)")

zip_lookup_df = pd.read_csv(lookup_path, dtype={"ZCTA": "string"})

# Ensure OBJECTID exists in both
if "OBJECTID" not in all_df.columns:
    raise KeyError("OBJECTID not found in all_df; can't merge ZCTA lookup.")
if "OBJECTID" not in zip_lookup_df.columns:
    raise KeyError("OBJECTID not found in ticket_zcta_lookup.csv; can't merge ZCTA lookup.")
if "ZCTA" not in zip_lookup_df.columns:
    raise KeyError("ZCTA not found in ticket_zcta_lookup.csv; can't merge ZCTA lookup.")

# Make OBJECTID numeric
all_df["OBJECTID"] = pd.to_numeric(all_df["OBJECTID"], errors="coerce")
zip_lookup_df["OBJECTID"] = pd.to_numeric(zip_lookup_df["OBJECTID"], errors="coerce")

zip_lookup_df = (
    zip_lookup_df.dropna(subset=["OBJECTID"])
    .drop_duplicates(subset=["OBJECTID"])
    [["OBJECTID", "ZCTA"]]
)

# Merge
all_df = all_df.merge(zip_lookup_df, on="OBJECTID", how="left")

print("ZCTA nulls after merge:", int(all_df["ZCTA"].isna().sum()))

# Save output
out_path = "dc_parking_data.csv"
all_df.to_csv(out_path, index=False)

print(f"Concatenated {len(csv_files)} files -> {out_path} ({len(all_df):,} rows)")