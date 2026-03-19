import pandas as pd
import numpy as np
import streamlit as st
from datetime import datetime, date, time, timedelta

st.set_page_config(page_title="DC Parking Risk", layout="wide")

GRADE_ORDER = {
    "A": 5,
    "B": 4,
    "C": 3,
    "D": 2,
    "F": 1
}


@st.cache_data
def load_feature_data(csv_path: str) -> pd.DataFrame:
    df = pd.read_csv(csv_path)

    required_cols = [
        "location_block",
        "day_of_week",
        "time_band_label",
        "season",
        "raw_recurrence_rate",
        "posterior_recurrence_score",
        "clean_location_block",
        "enforcement_grade",
    ]

    missing = [c for c in required_cols if c not in df.columns]
    if missing:
        raise ValueError(f"Missing required columns in feature_data.csv: {missing}")

    df["day_of_week"] = df["day_of_week"].astype(str).str.strip()
    df["season"] = df["season"].astype(str).str.strip()
    df["time_band_label"] = df["time_band_label"].astype(str).str.strip()
    df["clean_location_block"] = df["clean_location_block"].astype(str).str.strip()
    df["enforcement_grade"] = df["enforcement_grade"].astype(str).str.strip().str.upper()

    df["raw_recurrence_rate"] = pd.to_numeric(df["raw_recurrence_rate"], errors="coerce")
    df["posterior_recurrence_score"] = pd.to_numeric(df["posterior_recurrence_score"], errors="coerce")

    df = df.dropna(subset=["clean_location_block"])
    return df


def get_season(dt: date) -> str:
    month = dt.month
    if month in [12, 1, 2]:
        return "Winter"
    elif month in [3, 4, 5]:
        return "Spring"
    elif month in [6, 7, 8]:
        return "Summer"
    return "Fall"


def get_day_of_week_and_season(parking_date: date) -> tuple[str, str]:
    return parking_date.strftime("%A"), get_season(parking_date)


def time_to_minutes(t: time) -> int:
    return t.hour * 60 + t.minute


def build_time_band_labels() -> list[dict]:
    bands = []
    for start_hour in range(0, 24, 2):
        end_hour = start_hour + 2

        # handle the last band in a way that can match either 22:00-24:00 or 22:00-00:00
        if end_hour == 24:
            display_label = "22:00-24:00"
        else:
            display_label = f"{start_hour:02d}:00-{end_hour:02d}:00"

        bands.append({
            "display_label": display_label,
            "start_min": start_hour * 60,
            "end_min": end_hour * 60
        })
    return bands


def normalize_band_label(label: str) -> str:
    label = str(label).strip()
    if label == "22:00-00:00":
        return "22:00-24:00"
    return label


def get_overlapping_time_bands(start_time_val: time, end_time_val: time) -> list[str]:
    start_min = time_to_minutes(start_time_val)
    end_min = time_to_minutes(end_time_val)

    if end_min <= start_min:
        raise ValueError("End time must be after start time within the same day.")

    overlapping = []
    for band in build_time_band_labels():
        overlaps = (start_min < band["end_min"]) and (end_min > band["start_min"])
        if overlaps:
            overlapping.append(band["display_label"])

    return overlapping


def worst_grade(grades: list[str]) -> str | None:
    valid_grades = [g for g in grades if g in GRADE_ORDER]
    if not valid_grades:
        return None
    return min(valid_grades, key=lambda g: GRADE_ORDER[g])


def summarize_grade_distribution(grades: list[str]) -> dict:
    return pd.Series(grades).value_counts(dropna=False).to_dict()


def evaluate_parking_risk(
    df: pd.DataFrame,
    clean_block: str,
    parking_date: date,
    start_time_val: time,
    end_time_val: time
) -> dict:
    day_of_week, season = get_day_of_week_and_season(parking_date)
    overlapping_bands = get_overlapping_time_bands(start_time_val, end_time_val)

    working_df = df.copy()
    working_df["normalized_time_band_label"] = working_df["time_band_label"].apply(normalize_band_label)

    subset = working_df[
        (working_df["clean_location_block"] == clean_block) &
        (working_df["day_of_week"] == day_of_week) &
        (working_df["season"] == season) &
        (working_df["normalized_time_band_label"].isin(overlapping_bands))
    ].copy()

    if subset.empty:
        return {
            "mapped_clean_location_block": clean_block,
            "parking_date": parking_date.isoformat(),
            "day_of_week": day_of_week,
            "season": season,
            "start_time": start_time_val.strftime("%H:%M"),
            "end_time": end_time_val.strftime("%H:%M"),
            "overlapping_time_bands": overlapping_bands,
            "message": "No matching records found for that block/day/season/time combination."
        }

    subset["grade_rank"] = subset["enforcement_grade"].map(GRADE_ORDER)

    worst_overall_grade = worst_grade(subset["enforcement_grade"].tolist())

    worst_time_row = subset.sort_values(
        by=["posterior_recurrence_score", "grade_rank"],
        ascending=[False, True]
    ).iloc[0]

    return {
        "mapped_clean_location_block": clean_block,
        "parking_date": parking_date.isoformat(),
        "day_of_week": day_of_week,
        "season": season,
        "start_time": start_time_val.strftime("%H:%M"),
        "end_time": end_time_val.strftime("%H:%M"),
        "overlapping_time_bands": overlapping_bands,
        "lowest_grade_possible_over_period": worst_overall_grade,
        "raw_recurrence_rate_by_period": (
            subset[["normalized_time_band_label", "raw_recurrence_rate"]]
            .rename(columns={"normalized_time_band_label": "time_band_label"})
            .sort_values("time_band_label")
            .to_dict(orient="records")
        ),
        "posterior_recurrence_score_by_period": (
            subset[["normalized_time_band_label", "posterior_recurrence_score"]]
            .rename(columns={"normalized_time_band_label": "time_band_label"})
            .sort_values("time_band_label")
            .to_dict(orient="records")
        ),
        "grade_by_period": (
            subset[["normalized_time_band_label", "enforcement_grade"]]
            .rename(columns={"normalized_time_band_label": "time_band_label"})
            .sort_values("time_band_label")
            .to_dict(orient="records")
        ),
        "average_raw_recurrence_rate_over_period": float(subset["raw_recurrence_rate"].mean()),
        "max_raw_recurrence_rate_over_period": float(subset["raw_recurrence_rate"].max()),
        "average_posterior_recurrence_score_over_period": float(subset["posterior_recurrence_score"].mean()),
        "max_posterior_recurrence_score_over_period": float(subset["posterior_recurrence_score"].max()),
        "worst_time_band_to_park": normalize_band_label(worst_time_row["time_band_label"]),
        "worst_time_band_posterior_recurrence_score": float(worst_time_row["posterior_recurrence_score"]),
        "worst_time_band_grade": worst_time_row["enforcement_grade"],
        "grade_distribution_over_period": summarize_grade_distribution(subset["enforcement_grade"].tolist())
    }


st.title("DC Parking Risk App")

csv_path = "eda/output_files/grade_data.csv"

try:
    df = load_feature_data(csv_path)
except Exception as e:
    st.error(f"Could not load feature data: {e}")
    st.stop()

clean_blocks = sorted(df["clean_location_block"].dropna().unique().tolist())

st.subheader("Parking Inputs")

col1, col2 = st.columns(2)

with col1:
    selected_block = st.selectbox(
        "Clean Location Block",
        options=clean_blocks,
        index=None,
        placeholder="Start typing to search blocks..."
    )

    parking_date = st.date_input(
        "Parking Date",
        value=date.today()
    )

with col2:
    start_time_val = st.time_input(
        "Start Time",
        value=time(9, 0),
        step=timedelta(minutes=30)
    )

    end_time_val = st.time_input(
        "End Time",
        value=time(11, 0),
        step=timedelta(minutes=30)
    )

run_clicked = st.button("Evaluate Parking Risk", type="primary")

if run_clicked:
    if selected_block is None:
        st.error("Please select a clean location block.")
        st.stop()

    try:
        result = evaluate_parking_risk(
            df=df,
            clean_block=selected_block,
            parking_date=parking_date,
            start_time_val=start_time_val,
            end_time_val=end_time_val
        )
    except Exception as e:
        st.error(str(e))
        st.stop()

    st.subheader("Results")

    meta_col1, meta_col2, meta_col3 = st.columns(3)
    with meta_col1:
        st.metric("Lowest Grade Over Period", result.get("lowest_grade_possible_over_period", "N/A"))
    with meta_col2:
        st.metric("Worst Time Band", result.get("worst_time_band_to_park", "N/A"))
    with meta_col3:
        st.metric("Worst Time Band Grade", result.get("worst_time_band_grade", "N/A"))

    st.write(f"**Block:** {result['mapped_clean_location_block']}")
    st.write(f"**Date:** {result['parking_date']}")
    st.write(f"**Day of Week:** {result['day_of_week']}")
    st.write(f"**Season:** {result['season']}")
    st.write(f"**Parking Window:** {result['start_time']} to {result['end_time']}")
    st.write(f"**Overlapping Time Bands:** {', '.join(result['overlapping_time_bands'])}")

    if "message" in result:
        st.warning(result["message"])
    else:
        summary_col1, summary_col2, summary_col3, summary_col4 = st.columns(4)
        with summary_col1:
            st.metric("Avg Raw Recurrence", f"{result['average_raw_recurrence_rate_over_period']:.6f}")
        with summary_col2:
            st.metric("Max Raw Recurrence", f"{result['max_raw_recurrence_rate_over_period']:.6f}")
        with summary_col3:
            st.metric("Avg Posterior Score", f"{result['average_posterior_recurrence_score_over_period']:.6f}")
        with summary_col4:
            st.metric("Max Posterior Score", f"{result['max_posterior_recurrence_score_over_period']:.6f}")

        period_df = (
            pd.DataFrame(result["raw_recurrence_rate_by_period"])
            .merge(
                pd.DataFrame(result["posterior_recurrence_score_by_period"]),
                on="time_band_label",
                how="outer"
            )
            .merge(
                pd.DataFrame(result["grade_by_period"]),
                on="time_band_label",
                how="outer"
            )
            .sort_values("time_band_label")
            .reset_index(drop=True)
        )

        st.subheader("Period Details")
        st.dataframe(period_df, use_container_width=True)

        grade_dist_df = pd.DataFrame(
            list(result["grade_distribution_over_period"].items()),
            columns=["grade", "count"]
        ).sort_values("grade")

        st.subheader("Grade Distribution")
        st.dataframe(grade_dist_df, use_container_width=True)