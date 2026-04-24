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
