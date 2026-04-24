# DC Parking Enforcement Explorer

**Ticket Patterns: Spatiotemporal Modeling and Equity Analysis of Parking Enforcement in Washington, D.C.**

Georgia Institute of Technology | CSE 6242 Data and Visual Analytics  
Arun Polumbaum, Gabriel Castaneda, Katherine Morton, Meghan Peters, Samuel Roffman, Sara Jacob

---

## Overview

This project provides an interactive web application for exploring parking citation risk and enforcement equity across Washington, D.C.'s eight wards. The tool combines:

- **1,027,421 parking citations** from DC Open Data (January–December 2025)
- **Bayesian probabilistic risk modeling** with beta-binomial empirical Bayes for recurrence scoring across 24,160 blocks and 336 time slots
- **Census demographics** (income, poverty, vehicle ownership, race) aggregated by ward
- **Interactive spatiotemporal filtering** by violation type, time of day, season, and day of week
- **Equity analysis** examining correlations between enforcement intensity and socioeconomic factors

## Features

### For Residents
- **Address Search**: Enter your address to get a personalized enforcement risk grade (A–F) for your block
- **Dynamic Risk Map**: Interactive choropleth map showing ward-level enforcement risk
- **Temporal Filtering**: See how risk changes by time of day, day of week, and season
- **Violation-Specific Risk**: Filter by specific violation types (meter violations, no parking, street cleaning, etc.)

### For Policymakers & Analysts
- **Equity Analysis**: Scatter plots examining citation patterns vs. median income, poverty rate, and demographic composition
- **Per-Capita Normalization**: Toggle to view citations per 1,000 residents to account for population differences
- **Correlation Metrics**: Pearson correlation coefficients showing strength of relationships
- **Detailed Ward Profiles**: View top violations, hourly/monthly patterns, and riskiest blocks by ward

## Project Structure

```
├── data/                          # Data processing scripts
│   ├── generate_ward_filter_data.py   # Generate UI data files
│   ├── compute_ward_acs.py            # Aggregate census data by ward
│   ├── concat_dc_data.py              # Merge monthly citation files
│   ├── dc_data/                       # Raw parking violation CSVs (12 months)
│   └── acs_data/                      # Census demographic data
├── data_collection/               # Data collection scripts
│   ├── acs_collection.py              # Census API data collection
│   └── shapefile.py                   # Geospatial boundary processing
├── eda/                           # Exploratory data analysis
│   └── dc_parking_enforcement_eda.ipynb
├── visualization/                 # Geospatial visualization assets
│   ├── Wards_from_2022.geojson        # DC ward boundaries
│   └── Zip_Codes.geojson              # ZIP code boundaries
├── ui/                            # React web application (see ui/README.md)
│   ├── src/
│   │   ├── components/                # React components
│   │   └── data/                      # Pre-computed JSON data files
│   └── UI_DOCUMENTATION.md            # Detailed UI documentation
└── main.py                        # Streamlit alternative interface (requires DVA-Data)
```

## Quick Start

### Running the Interactive Dashboard (Recommended)

```bash
cd ui
npm install
npm run dev
```

The application will open at `http://localhost:5173`. No backend server required – all data is pre-computed and bundled as static JSON files.

### Running the Streamlit App (Alternative)

**Note**: The Streamlit app requires the `DVA-Data` folder with Bayesian model outputs (`feature_data.parquet`). This folder is not included in the repository.

```bash
pip install streamlit pandas numpy
streamlit run main.py
```

### Regenerating Data Files

If you need to regenerate the UI data files (requires the `DVA-Data` folder):

```bash
cd data
python generate_ward_filter_data.py
```

This will overwrite:
- `ui/src/data/wardFilterData.json` (2.8 MB) — Ward-level aggregated statistics
- `ui/src/data/blockLookup.json` (2.1 MB) — Block-level risk scores for address search

## Data Sources

| Source | Description | Records |
|--------|-------------|---------|
| [DC Open Data](https://opendata.dc.gov/) | Parking violations (Jan–Dec 2025) | 1,027,421 citations |
| DVA-Data/feature_data.parquet | Bayesian model output (posterior recurrence scores) | 8,117,760 rows (24,160 blocks × 336 time slots) |
| [US Census Bureau](https://www.census.gov/data/developers/data-sets/acs-5year.html) | ACS 5-year estimates (demographics) | 8 wards |
| [DC Open Data](https://opendata.dc.gov/) | Ward boundaries (2022 redistricting) | 8 polygons |

## Dependencies

### UI (React/Vite)
The UI runs standalone with pre-computed data. No external dependencies for viewing.

### Data Processing
- Python 3.8+
- pandas, numpy, geopandas
- Census API key (for data collection only)

### DVA-Data Folder
Required only for:
- Regenerating `wardFilterData.json` and `blockLookup.json`
- Running the Streamlit app (`main.py`)

**Not required** for running the React UI, which uses pre-generated data files.

## Methodology

**Intuition.** Most supervised classification methods require both positive and negative examples to train
on. The problem with parking enforcement data is that we only observe citation events; we don’t observe
all the instances where someone parked without getting a ticket. This makes standard approaches like
logistic regression a poor fit. Instead, we treat enforcement as a sparse stochastic process and estimate
recurrence rates for each location-condition combination, using empirical Bayes to smooth out extreme
values and produce risk scores that are stable and interpretable. Our work makes two main contributions:
on the modeling side, an empirical Bayes beta-binomial grading system designed for sparse, positive-only
citation data at the block-condition level, and on the visualization side, a fully client-side interactive
dashboard that combines personalized risk lookup with ward-level equity exploration in a single interface
with no backend server required.

**Data Collection and Processing.** We aggregated 12 months of parking citation records (January
through December 2025) from DC Open Data, which gave us 994,294 geocoded citations totaling $60.7M
in fines across 21 violation types. Each record includes the violation description, issue time, issue date,
fine amount, and GPS coordinates. We supplemented this with American Community Survey (ACS)
5-year estimates to obtain ward-level demographic data including median household income (ranging
from $63K to $159K), poverty rate (7.8% to 27.4%), vehicle ownership, and racial composition. Ward
boundaries were taken from the 2022 redistricting GeoJSON covering all 8 wards. Citations were then
spatially joined to wards using GeoPandas point-in-polygon operations and grouped into 12 two-hour
time bands, 4 seasons, and 7 days of the week.

**Empirical Bayes Model.** Each observation unit is defined as a unique combination of street block,
day of week, two-hour time band, and season. For each unit, we calculate a raw recurrence rate
representing how often at least one citation occurred during a given time interval. Because many
block-condition combinations have very few observations, sparsity is a real challenge, and we address it
using a beta-binomial empirical Bayes approach. The global distribution of raw rates serves as the prior,
and each block-condition's observed rate is pulled toward that global baseline. Blocks with less data get
pulled more strongly, which prevents sparse combinations from producing extreme and unreliable scores,
while blocks with a lot of data retain their signal. We also scale scores by the overall enforcement
intensity at each block so that high-volume locations are meaningfully distinguished from quieter ones.
The final posterior scores are mapped to a letter grade system: A for less than 0.2% recurrence, B for 0.2
to 0.5%, C for 0.5 to 1%, D for 1 to 2%, and F for anything above 2%. The full model output is a Parquet
file with 8,117,760 rows spanning 24,160 unique blocks and 336 condition combinations (12 time bands
× 4 seasons × 7 days).

**Data Pipeline.** The pipeline converts raw citation and demographic data into the static files used by
the interface. First, `concat_dc_data.py` merges the 12 monthly CSVs into one dataset. Next,
`compute_ward_acs.py` aggregates ZIP-level ACS data to the ward level using area-weighted spatial
overlap. The main processing script, `generate_ward_filter_data.py`, performs spatial joins, loads the
Bayesian model output, and builds a breakdown by violation, time band, season, and day of week for each
ward. The final outputs are `wardFilterData.json`, which contains ward-level breakdowns, distributions,
top blocks, and ACS demographics, and `blockLookup.json`, which stores coordinates, mean grade, score,
and total tickets for 24,094 blocks.

**Interactive Visualization.** The UI is a single-page React 18 application built with Vite 5 that runs
entirely in the browser using precomputed static JSON. A Leaflet choropleth map displays DC’s 8 wards
by risk score, median income, or poverty rate, with hover popups and click-to-zoom interaction. A sidebar
allows filtering by ward, violation type, time of day, season, day of week, and minimum risk threshold.
Users can also search by address using OpenStreetMap’s Nominatim API, which assigns the result to a
ward and returns the nearest block’s A to F risk grade. Additional charts show citations by ward, hourly
distribution, monthly trends, and top violation types, while a detailed panel displays ward-level
enforcement statistics and top-risk blocks. The interface also includes an equity panel with ward-level
scatter plots and a raw/per-capita toggle, along with a dark/light theme option stored in localStorage.


## Key Findings

Based on the equity analysis in the dashboard:

- **Citations are concentrated in commercial/downtown wards** (Ward 2: 435K citations; Ward 6: 187K citations)
- **Weak correlation with poverty** — highest citation counts are in moderate-poverty wards, not the highest-poverty wards
- **No strong evidence of demographic targeting** — enforcement patterns appear more related to commercial activity and parking supply than to race or income
- **Ward 7-8 paradox**: Highest poverty (24-27%) and highest POC populations (97-98%) have among the lowest citation counts (36-39K)

These patterns suggest enforcement is driven more by factors like:
- Commercial density and parking demand
- Enforcement resource allocation
- Parking supply constraints
- Meter vs. residential permit zones

Rather than systematic targeting of low-income or predominantly POC neighborhoods.

## License

This project was developed as part of coursework for CSE 6242 at Georgia Tech.

## Contributors

- Arun Polumbaum
- Gabriel Castaneda  
- Katherine Morton
- Meghan Peters
- Samuel Roffman
- Sara Jacob
