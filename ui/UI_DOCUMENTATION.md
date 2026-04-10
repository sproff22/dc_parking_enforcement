# DC Parking Enforcement Explorer — UI Documentation

**Ticket Patterns: Spatiotemporal Modeling and Equity Analysis of Parking Enforcement in Washington, D.C.**
Team #103 | CSE 6242 Data and Visual Analytics
Arun Polumbaum, Gabriel Castaneda, Katherine Morton, Meghan Peters, Samuel Roffman, Sara Jacob

---

## Table of Contents

1. [Overview](#1-overview)
2. [How It Maps to Project Requirements](#2-how-it-maps-to-project-requirements)
3. [Technology Stack](#3-technology-stack)
4. [Architecture & Data Flow](#4-architecture--data-flow)
5. [Data Pipeline](#5-data-pipeline)
6. [Component Reference](#6-component-reference)
   - [App.jsx — Root Layout & State](#61-appjsx--root-layout--state)
   - [Sidebar.jsx — Filter Controls](#62-sidebarjsx--filter-controls)
   - [WardMap.jsx — Interactive Choropleth Map](#63-wardmapjsx--interactive-choropleth-map)
   - [StatCards.jsx — Summary Statistics](#64-statcardsjsx--summary-statistics)
   - [BottomCharts.jsx — Analytical Charts](#65-bottomchartsjsx--analytical-charts)
   - [EquityPanel.jsx — Equity Scatter Plots](#66-equitypaneljsx--equity-scatter-plots)
   - [DetailPanel.jsx — Ward Detail Sidebar](#67-detailpaneljsx--ward-detail-sidebar)
   - [AddressSearch.jsx — Address Risk Lookup](#68-addresssearchjsx--address-risk-lookup)
   - [Legend.jsx — Color Legend & Grade Scale](#69-legendjsx--color-legend--grade-scale)
   - [Chip.jsx — Active Filter Chips](#610-chipjsx--active-filter-chips)
7. [Data Layer (mockdata.js)](#7-data-layer-mockdatajs)
8. [Utility Modules](#8-utility-modules)
9. [How to Run](#9-how-to-run)
10. [File Structure](#10-file-structure)

---

## 1. Overview

The **DC Parking Enforcement Explorer** is a single-page interactive web application that allows users to explore parking citation risk and enforcement equity across Washington, D.C.'s eight wards. The tool serves two audiences:

- **Residents** can search their address to see a personalized enforcement risk grade (A–F), filter by time of day, season, day of week, and violation type, and understand when and where tickets are most likely.
- **Policymakers and analysts** can explore whether enforcement intensity correlates with neighborhood income, poverty, or racial demographics through built-in equity scatter plots with Pearson correlation coefficients.

The application is entirely client-side — no backend server is required. All data is pre-computed by the Python data pipeline and bundled as static JSON files, making it deployable to any static hosting service.

---

## 2. How It Maps to Project Requirements

The UI directly implements the goals articulated in the project proposal and progress report. Below is a mapping of each stated objective to its concrete implementation in the tool.

### 2.1 Individual Risk Prediction

> *"We aim to develop a probabilistic, user-facing tool for estimating parking enforcement risk based on location and time."* — Section 6, Progress Report

**Implementation:**

| Requirement | UI Feature | Component |
|---|---|---|
| Probabilistic risk by location | Ward-level choropleth map colored by Bayesian recurrence score | `WardMap.jsx` |
| Risk by time of day (2-hour bands) | Time of Day filter (12 bands: 12am–2am through 10pm–12am) | `Sidebar.jsx` → "Time of Day" dropdown |
| Risk by day of week | Day of Week filter (Mon–Sun) | `Sidebar.jsx` → "Day of Week" dropdown |
| Risk by season | Season filter (Winter, Spring, Summer, Fall) | `Sidebar.jsx` → "Season" dropdown |
| A–F grading system | Enforcement grade displayed on map popups, detail panel, and address search results | `DetailPanel.jsx`, `AddressSearch.jsx`, `Legend.jsx` |
| Personalized address lookup | Address search with geocoding → ward mapping → block-level grade | `AddressSearch.jsx` |

When a user searches an address, the tool:
1. Geocodes the address to lat/lng using the Nominatim OpenStreetMap API
2. Determines which DC ward contains the point using a ray-casting point-in-polygon algorithm against the Wards_from_2022.geojson boundaries
3. Finds the nearest enforcement block (~0.3 mile radius) from a pre-computed lookup of 24,094 blocks
4. Displays the block's A–F enforcement grade, ticket count, and Bayesian recurrence score

### 2.2 Spatiotemporal Exploration

> *"The idea is to have the model deployed as an interactive map where users can enter a location, date, and parking time window to see their estimated risk."* — Section 4, Progress Report

**Implementation:**

The filter system allows users to slice data across four spatiotemporal dimensions simultaneously:

- **Violation Type** — 26 violation types from DC open data (e.g., "FAIL TO DISPLAY A VALID MULTISPACE METER RECEIPT", "NO PARKING", "OVERTIME")
- **Time of Day** — 12 two-hour bands matching the Bayesian model's granularity
- **Season** — Winter (Dec–Feb), Spring (Mar–May), Summer (Jun–Aug), Fall (Sep–Nov)
- **Day of Week** — Individual days (Mon through Sun)

All charts, statistics, and map colors update immediately when filters change. The `useMemo` hook in `App.jsx` ensures that `getFilteredStats()` recomputes only when filters change, traversing the pre-computed breakdown data keyed as `"violation|timeBand|season|dayOfWeek"` to aggregate citations, fines, and Bayesian posterior scores.

### 2.3 Equity Analysis

> *"We aim to examine whether enforcement intensity varies across neighborhoods with different socioeconomic characteristics."* — Section 4, Progress Report

**Implementation:**

The **Equity Analysis** tab (`EquityPanel.jsx`) presents three scatter plots:

| Plot | X-Axis | Y-Axis | Source |
|---|---|---|---|
| Citations vs. Median Income | ACS B19013 median household income | Total citations (or per 1k residents) | Census + DC Data |
| Citations vs. Poverty Rate | ACS B17001 poverty rate | Total citations (or per 1k residents) | Census + DC Data |
| Citations vs. % People of Color | ACS demographic data (1 - white share) | Total citations (or per 1k residents) | Census + DC Data |

Each plot shows:
- One dot per ward, colored by enforcement risk score
- A **Pearson correlation coefficient (r)** computed in real-time as filters change
- A **per-capita toggle** that normalizes citations to "per 1,000 residents", controlling for ward population size
- An explicit disclaimer: *"Descriptive only — does not control for confounding factors (enforcement density, commercial activity, parking supply)."*

This directly addresses References [1], [2], [3], and [17] from the literature survey which document enforcement disparities in lower-income and minority neighborhoods.

### 2.4 Empirical Bayes Model Integration

> *"We apply a beta-binomial empirical Bayes approach to produce a posterior recurrence score."* — Section 4, Progress Report

**Implementation:**

The model's output is integrated into the UI at multiple levels:

1. **Ward-level scores**: Each ward's Bayesian posterior score is computed as a ticket-weighted average of the underlying block × time × season × day scores from `feature_data.parquet`. Scores are normalized to 0–95% under the current filter context so that the highest-scoring ward tops out at ~95%.

2. **Block-level scores**: The `blockLookup.json` file contains the mean posterior recurrence score for each of 24,094 blocks, enabling the address search to return block-specific risk.

3. **A–F grading**: Posterior scores map to letter grades: A (0–10%), B (10–25%), C (25–50%), D (50–75%), F (75%+). The grade is displayed in the detail panel, map popups, legend, and address search results.

4. **Provenance labeling**: The detail panel explicitly states "Empirical Bayes posterior (beta-binomial)" beneath the grade, maintaining transparency about the methodology.

### 2.5 Interactive Visualization (CriPAV-Inspired)

> *"Garcia-Zanabria (2021) presents CriPAV, a street-level crime visualization tool whose choropleth and point map design informs our UI."* — Section 3, Progress Report

**Implementation:**

The map interface follows visualization best practices from the literature:

- **Choropleth map** with ward boundaries from DC Open Data (Wards_from_2022.geojson)
- **Three color layers** switchable via radio buttons: Risk Score, Median Income, Poverty Rate
- **Hover popups** showing ward number, grade, citations, income, poverty, and top violation
- **Click-to-select** with animated zoom to selected ward
- **Zip code boundary overlay** (toggleable dashed lines from DC zip code GeoJSON)
- **Search pin marker** (red SVG pin) placed at geocoded addresses
- **Light/dark theme** with CARTO basemap tiles switching between `light_all` and `dark_all`

---

## 3. Technology Stack

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| Framework | React | 18.3 | Component-based UI |
| Bundler | Vite | 5.4 | Development server and production builds |
| Charts | Recharts | 2.12 | Bar charts, line charts, scatter plots |
| Map | Leaflet | 1.9.4 (CDN) | Interactive choropleth map |
| Basemap | CARTO | — | Light/dark tile layers |
| Geocoding | Nominatim (OSM) | — | Address → lat/lng conversion |
| Data pipeline | Python (pandas, geopandas) | — | Pre-computes JSON data from raw CSV and Parquet |

No backend server is needed. The app is fully static and can be deployed by serving the `dist/` folder after running `vite build`.

---

## 4. Architecture & Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        Python Data Pipeline                      │
│                                                                   │
│  12 Monthly CSVs ──┐                                              │
│  (DC Open Data)    ├──► concat_dc_data.py ──► Spatial join ──┐   │
│                    │    (clean, parse)       (to wards)       │   │
│                    │                                          │   │
│  feature_data ─────┤                                          ├──►│
│  .parquet          │    generate_ward_                        │   │
│  (Bayesian model)  ├──► filter_data.py ──────────────────────►│   │
│                    │                                          │   │
│  dc_acs_data.csv ──┘    (ACS demographics)                   │   │
│                                                               │   │
│  Outputs:  wardFilterData.json (2.8 MB)                       │   │
│            blockLookup.json    (2.1 MB)                       │   │
└───────────────────────────────────────┬───────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────┐
│                    React Frontend (Vite)                          │
│                                                                   │
│  wardFilterData.json ──► mockdata.js ──► getFilteredStats()      │
│                                     ──► getHourlyCitations()     │
│                                     ──► getMonthlyCitations()    │
│                                     ──► getTopViolations()       │
│                                     ──► getTopBlocks()           │
│                                                                   │
│  App.jsx (state: filters, selected, isDark, showZips)            │
│    ├── Sidebar.jsx (filter dropdowns, address search)            │
│    ├── StatCards.jsx (5 KPI cards)                               │
│    ├── WardMap.jsx (Leaflet choropleth)                          │
│    ├── Legend.jsx (color scale + A-F popup)                      │
│    ├── BottomCharts.jsx (4 charts) / EquityPanel.jsx (scatter)  │
│    └── DetailPanel.jsx (per-ward drill-down)                     │
│                                                                   │
│  blockLookup.json ──► AddressSearch.jsx (lazy-loaded on search)  │
└─────────────────────────────────────────────────────────────────┘
```

### State Management

All application state lives in `App.jsx` using React `useState` hooks. There is no external state library (Redux, Zustand, etc.) — the application is small enough that prop-drilling is manageable.

| State Variable | Type | Purpose |
|---|---|---|
| `filters` | Object | All active filter selections (ward, violation, timeRange, season, dayOfWeek, colorMode, minRisk) |
| `selected` | Number \| null | Currently selected ward number (click on map or sidebar) |
| `isDark` | Boolean | Dark mode toggle (persisted in localStorage) |
| `showZips` | Boolean | Whether zip code boundary overlay is visible |
| `bottomTab` | String | "charts" or "equity" — which bottom panel is active |
| `searchPin` | Object \| null | `{ lat, lng }` of the most recent address search result |
| `resetKey` | Number | Incremented on "Reset Filters" to clear child component state |

The `filteredStats` object is derived via `useMemo` from the `filters` state, recomputing only when any filter changes. It is an object keyed by ward number (1–8), where each ward contains:

```javascript
{
  citations: 12345,          // Total citations matching current filters
  riskScore: 0.72,           // Normalized Bayesian posterior (0–0.95)
  rawBayesScore: 0.0034,     // Un-normalized posterior
  medianIncome: 89000,       // ACS B19013
  povertyRate: 0.12,         // ACS B17001
  vehicleOwnership: 0.65,    // ACS B08201
  population: 85000,         // Approximate ward population
  whiteShare: 0.38,          // % White (ACS)
  blackShare: 0.48,          // % Black/African American (ACS, for reference)
  hispanicShare: 0.08,       // % Hispanic/Latino (ACS, for reference)
  asianShare: 0.04,          // % Asian (ACS, for reference)
  // Note: Equity analysis uses pocShare = 1 - whiteShare
  fineRevenue: 2450000,      // Total fine revenue ($)
  avgFine: 198,              // Average fine per citation
  topViolation: "NO PARKING" // Most common violation type
}
```

---

## 5. Data Pipeline

The data pipeline (`data/generate_ward_filter_data.py`) transforms raw data into two JSON files consumed by the UI.

### Input Data

| Source | File | Description |
|---|---|---|
| DC Open Data | `data/dc_data/Parking_Violations_*.csv` (12 monthly files) | 1,027,421 raw parking citations with columns: LOCATION, VIOLATION_DESCRIPTION, ISSUE_DATE, ISSUE_TIME, FINE_AMOUNT, LATITUDE, LONGITUDE |
| Bayesian Model Output | `DVA-Data/output_files/feature_data.parquet` | 8,117,760 rows (24,160 blocks × 336 time slots) with `posterior_recurrence_score` from beta-binomial empirical Bayes |
| Census | `data/acs_data/dc_acs_data.csv` | ACS demographics (income, poverty, vehicle ownership, race) by ZCTA, area-weighted to wards |
| Boundaries | `visualization/Wards_from_2022.geojson` | DC ward boundaries (8 polygons) |

### Processing Steps

1. **Load and concatenate** 12 monthly CSVs into a single DataFrame
2. **Parse** ISSUE_TIME (HHMM → hour → 2-hour band), ISSUE_DATE (→ day of week, → month, → season)
3. **Spatial join** each citation's lat/lng into a ward using geopandas point-in-polygon against ward boundaries; 994,294 of 1,027,421 tickets successfully mapped
4. **Build breakdown** dictionary keyed as `"VIOLATION|TIME_BAND|SEASON|DAY"` with citation count (`c`), fine sum (`f`), and mean Bayesian posterior (`b`) from `feature_data.parquet`
5. **Build hourly breakdown** keyed as `"VIOLATION|SEASON|DAY"` → `{hour: count}` for filter-aware hourly charts
6. **Build monthly counts** per ward
7. **Score blocks** from `feature_data.parquet` — mean posterior per block, top 10 per ward, assign A–F grades
8. **Merge ACS** demographics (income, poverty, vehicle ownership, race shares, population)
9. **Output** `wardFilterData.json` (2,805 KB) and `blockLookup.json` (2,114 KB)

### wardFilterData.json Structure

```json
{
  "violationTypes": ["All Types", "FAIL TO DISPLAY...", ...],
  "timeRanges": ["All Hours", "12am-2am", ...],
  "seasons": ["All Seasons", "Winter", "Spring", "Summer", "Fall"],
  "daysOfWeek": ["All Days", "Mon", "Tue", ...],
  "wards": {
    "1": {
      "citations": 130000,
      "fineRevenue": 25000000,
      "avgFine": 192,
      "topViolation": "FAIL TO DISPLAY...",
      "medianIncome": 98000,
      "povertyRate": 0.11,
      "vehicleOwnership": 0.62,
      "population": 87000,
      "whiteShare": 0.50,
      "blackShare": 0.33,  // for reference only
      "hispanicShare": 0.12,  // for reference only
      "asianShare": 0.03,  // for reference only
      "breakdown": {
        "NO PARKING|8am-10am|Spring|Mon": { "c": 45, "f": 6750, "b": 0.0021 },
        ...
      },
      "hourly": { "0": 1200, "1": 890, ... "23": 2100 },
      "hourlyBreakdown": {
        "NO PARKING|Spring|Mon": { "8": 23, "9": 22, ... },
        ...
      },
      "monthly": { "1": 11000, "2": 10500, ... "12": 12000 },
      "topBlocks": [
        { "block": "1400 BLOCK OF K ST NW", "tickets": 2340, "score": 0.034, "grade": "F" },
        ...
      ]
    },
    "2": { ... },
    ...
    "8": { ... }
  }
}
```

### blockLookup.json Structure

```json
{
  "1400 BLOCK OF K ST NW": {
    "ward": 2,
    "lat": 38.9025,
    "lng": -77.0325,
    "g": "F",
    "s": 0.034,
    "t": 2340
  },
  ...
}
```

24,094 blocks total. This file is **lazy-loaded** via dynamic `import()` only when the user first searches an address, keeping initial bundle size down. It code-splits into a separate chunk (~246 KB gzipped).

---

## 6. Component Reference

### 6.1 App.jsx — Root Layout & State

The root component manages all global state and renders the three-column layout:

```
┌──────────┬─────────────────────────────────────┬────────────┐
│          │  Filter Chips   |   StatCards (5)    │            │
│          ├─────────────────────────────────────┤            │
│ Sidebar  │                                     │  Detail    │
│ (220px)  │          WardMap (Leaflet)           │  Panel     │
│          │                                     │  (230px)   │
│ Filters  ├─────────────────────────────────────┤            │
│ Address  │  Legend  |  Charts/Equity toggle     │            │
│ Search   │  BottomCharts (4) or EquityPanel (3) │            │
└──────────┴─────────────────────────────────────┴────────────┘
```

Key behaviors:
- **Filter changes** propagate through `filteredStats` (memoized) to all child components
- **Ward selection** can happen by clicking the map, selecting from the sidebar dropdown, or searching an address
- **Theme preference** is persisted in `localStorage` under key `"dva103-dark"`
- **Reset Filters** clears all filters, deselects the ward, removes the search pin, and increments `resetKey` to clear the address search input

### 6.2 Sidebar.jsx — Filter Controls

A 220px fixed-width left sidebar containing:

1. **Title bar** — "DC Parking / Enforcement Explorer CSE 6242"
2. **Dark Mode toggle** — Animated slide switch
3. **Address Search** — Rendered as a child `<AddressSearch />` passed via React children
4. **Ward** — Dropdown: All Wards, Ward 1–8
5. **Violation Type** — Dropdown with 26 violation types from DC data
6. **Time of Day** — 12 two-hour bands (12am–2am through 10pm–12am)
7. **Season** — Winter, Spring, Summer, Fall
8. **Day of Week** — Mon through Sun
9. **Map Color Layer** — Radio buttons: Risk Score | Median Income (ACS) | Poverty Rate (ACS)
10. **Min Risk Threshold** — Slider (0%–90%) that dims wards below the threshold on the map
11. **Reset Filters** button

Each filter fires `onChange(key, value)` which updates the parent's `filters` state in `App.jsx`.

### 6.3 WardMap.jsx — Interactive Choropleth Map

The map is rendered using **Leaflet 1.9.4** loaded dynamically (CSS and JS injected into the DOM on first mount).

**Map layers:**

| Layer | Source | Behavior |
|---|---|---|
| CARTO tile layer | `basemaps.cartocdn.com` | Switches between `light_all` and `dark_all` with theme |
| Ward GeoJSON | `wardBoundaries.js` (from Wards_from_2022.geojson) | Fills with risk/income/poverty color, click to select |
| Zip code GeoJSON | `zipBoundaries.json` | Dashed overlay, toggleable checkbox |
| Search pin | SVG marker | Red pin at geocoded address location |

**Interactions:**

- **Hover** → Bold border + popup with ward stats (grade, citations, income, poverty, top violation)
- **Click** → Selects ward (or deselects if already selected), zooms to ward bounds
- **Color mode** → Map fill colors switch between risk score, median income, or poverty rate scales
- **Min risk slider** → Wards below threshold are dimmed to 30% opacity

**Performance notes:**
- Uses `useRef` for Leaflet map, layers, and tile layer instances (not React state, to avoid re-renders)
- Stats and color mode stored in refs to avoid stale closures in Leaflet event handlers
- Cleanup function removes map on component unmount to prevent memory leaks

### 6.4 StatCards.jsx — Summary Statistics

Five KPI cards displayed in a horizontal grid above the map:

| Card | Value | Source |
|---|---|---|
| Total Citations | Formatted count | Sum of `filteredStats[w].citations` for active wards |
| Fine Revenue | `$X.XXM` | Sum of `filteredStats[w].fineRevenue` |
| Recurrence Risk | `XX%` (colored by risk) | Average `riskScore` across active wards |
| Avg Median Income | `$XXk` | Average `medianIncome` across active wards |
| Avg Poverty Rate | `XX.X%` | Average `povertyRate` across active wards |

Cards update in real time as filters change. The risk card is color-coded using the same scale as the map (green for low, red for high).

### 6.5 BottomCharts.jsx — Analytical Charts

Four charts in a horizontal grid (switchable with the Equity Analysis tab):

**1. Citations by Ward** — Vertical bar chart, one bar per ward, colored by risk score. Useful for comparing enforcement volume across wards.

**2. Citations by Hour** — Vertical bar chart showing the 24-hour citation distribution (labeled 12a, 1a, ... 11p). **Filter-aware**: when violation, season, or day of week filters are active, uses the `hourlyBreakdown` data keyed by `"violation|season|day"` → `{hour: count}`. Shows a "(filtered)" subtitle when filters are active.

**3. Monthly Trend (2025)** — Line chart showing citations by month (Jan–Dec). Shows temporal patterns and seasonal variation.

**4. Top Violation Types** — Horizontal bar chart showing the 5 most common violation types. **Filter-aware**: respects all active filters (violation, time, season, day). Uses a custom `TruncatedTick` component to prevent label overlap by truncating long violation names.

### 6.6 EquityPanel.jsx — Equity Scatter Plots

Three scatter plots accessible via the "Equity Analysis" tab:

1. **Citations vs. Median Income** — Examines whether wealthier wards receive more or fewer citations
2. **Citations vs. Poverty Rate** — Tests for potential targeting of high-poverty areas
3. **Citations vs. % People of Color** — Examines demographic bias (calculated as 1 - white population share)

Each plot shows one dot per ward (colored by risk score) with:
- **Fixed X-axis scales** with `type="number"` to prevent auto-scaling distortion — ensures points are positioned by absolute values, not relative scaling
- **Pearson r** correlation coefficient computed in real-time
- **Ward count (n)** for transparency
- **Per-capita toggle** — Checkbox "Per 1k residents" normalizes the Y-axis from raw citation count to citations per 1,000 ward residents, controlling for population differences
- **Custom tooltips** showing ward name, raw + per-capita citations, income, poverty, % POC, and risk score

The equity panel includes a disclaimer emphasizing that correlations are descriptive, not causal: *"Descriptive only — does not control for confounding factors (enforcement density, commercial activity, parking supply)."*

**Pearson r implementation**: The `pearsonR(xs, ys)` function computes the Pearson correlation coefficient directly:

$$r = \frac{\sum_{i=1}^{n}(x_i - \bar{x})(y_i - \bar{y})}{\sqrt{\sum_{i=1}^{n}(x_i - \bar{x})^2 \cdot \sum_{i=1}^{n}(y_i - \bar{y})^2}}$$

Requires at least 3 data points; returns null otherwise.

### 6.7 DetailPanel.jsx — Ward Detail Sidebar

A 230px right sidebar that appears when a ward is selected. Contains:

1. **Ward header** with close button
2. **Enforcement Grade card** — Large A–F letter with color, risk label ("Very High", "High", etc.), percentage score, and methodology note ("Empirical Bayes posterior (beta-binomial)")
3. **Citation Data section** — Total citations, fine revenue, average fine, top violation (all from filtered data)
4. **Low sample warning** — Yellow alert box when filtered citations fall below 30, warning that results may be unreliable
5. **ACS Demographics section** — Median income, poverty rate, vehicle ownership rate (from Census ACS tables B19013, B17001, B08201)
6. **Citations vs. city average** — Progress bar comparing the ward's citations to the city max
7. **Highest-Risk Blocks** — Top 5 blocks by mean Bayesian posterior score, showing block name, ticket count, and score percentage, color-coded by risk grade thresholds
8. **ACS table references** — Footer noting source tables

### 6.8 AddressSearch.jsx — Address Risk Lookup

Embedded in the sidebar, this component allows users to type a street address and get a personalized enforcement risk assessment.

**Geocoding flow:**

1. User types an address (e.g., "1600 Pennsylvania Ave") and presses Enter or clicks "Go"
2. If the input doesn't already contain "DC" or "Washington", the component appends ", Washington, DC"
3. The Nominatim OpenStreetMap API is called with a User-Agent header identifying our project
4. HTTP errors are checked (`res.ok`) and displayed to the user
5. The returned lat/lng is tested against each ward polygon using a ray-casting algorithm
6. On the first search, `blockLookup.json` (24,094 blocks, ~2.1 MB) is lazy-loaded via dynamic `import()`
7. The nearest block within ~0.3 miles is found by Euclidean distance
8. A result card displays the block's enforcement grade (large colored letter), block name, ticket count, and Bayesian score

**Point-in-polygon algorithm**: Uses ray-casting — for each polygon ring, counts how many edges a horizontal ray from the test point crosses. An odd count means inside. Handles both `Polygon` and `MultiPolygon` geometry types correctly.

### 6.9 Legend.jsx — Color Legend & Grade Scale

Displays the color scale for the currently active map layer (Risk Score, Income, or Poverty). Includes an expandable "A-F Scale" popup that explains:

- **A** — Low risk, rarely ticketed (green)
- **B** — Below average enforcement (yellow-green)
- **C** — Moderate enforcement (yellow)
- **D** — Above average enforcement (orange)
- **F** — High risk, frequently ticketed (red)

Also notes that grades reflect the current filter context and are based on the empirical Bayes beta-binomial model.

### 6.10 Chip.jsx — Active Filter Chips

Small colored pills displayed above the stat cards to show which filters are active. Each chip has a color variant (blue, purple, green, teal, orange, gray) with separate light/dark mode palettes defined in `theme.js`.

---

## 7. Data Layer (mockdata.js)

**Note**: Despite the legacy filename, `mockdata.js` contains production data processing logic and serves real data from `wardFilterData.json` (1M+ parking citations). The module manages data access and filtering for the entire application.

The `mockdata.js` module imports `wardFilterData.json` and exports the following:

| Export | Type | Description |
|---|---|---|
| `VIOLATION_TYPES` | String[] | 27 violation type labels (including "All Types") |
| `TIME_RANGES` | String[] | 13 time ranges (including "All Hours") |
| `SEASONS` | String[] | 5 seasons (including "All Seasons") |
| `DAYS_OF_WEEK` | String[] | 8 day labels (including "All Days") |
| `DEFAULT_FILTERS` | Object | Default filter state for initialization |
| `getFilteredStats(filters)` | Function | Core function: iterates all breakdown keys, applies filter predicates, aggregates citations/fines/Bayesian scores, normalizes risk to 0–95% |
| `WARD_STATS` | Object | Pre-computed unfiltered stats (equivalent to `getFilteredStats(DEFAULT_FILTERS)`) |
| `getHourlyCitations(wardList, filters)` | Function | Returns 24-element array of `{hour, n}` objects. Uses `hourlyBreakdown` when filters are active, otherwise uses `hourly` totals |
| `getMonthlyCitations(wardList)` | Function | Returns 12-element array of `{month, n}` objects from `monthly` data |
| `getTopBlocks(wardList)` | Function | Returns top 10 highest-risk blocks across selected wards, sorted by score |
| `getTopViolations(wardList, filteredStats, filters)` | Function | Returns top 5 violation types by count, filtered by all active dimensions |

### Risk Score Normalization

The `getFilteredStats` function normalizes Bayesian posterior scores so the highest-scoring ward under the current filter context always maps to ~95%. This prevents the issue where all wards might show very low absolute scores (the raw posteriors are typically 0.001–0.01), which would make the A–F grading uninformative.

```javascript
// In getFilteredStats():
const filteredMax = Math.max(...Object.values(stats).map(s => s.rawBayesScore));
for (const s of Object.values(stats)) {
  s.riskScore = filteredMax > 0 ? (s.rawBayesScore / filteredMax) * 0.95 : 0;
}
```

---

## 8. Utility Modules

### colors.js

| Function | Input | Output | Usage |
|---|---|---|---|
| `riskHex(score)` | 0–1 | Hex color | Map fill, stat cards, progress bars |
| `riskLabel(score)` | 0–1 | "Very Low" to "Very High" | Detail panel, stat cards |
| `riskGrade(score)` | 0–1 | "A" to "F" | Map popup, detail panel, legend |
| `gradeHex(grade)` | "A"–"F" | Hex color | Grade display coloring |
| `incomeHex(income)` | Dollar amount | Purple scale hex | Map income layer |
| `povertyHex(poverty)` | 0–1 ratio | Green-to-red hex | Map poverty layer |
| `wardColor(stats, wardNum, mode)` | Stats object, ward, mode | Hex color | Map fill per mode |

### theme.js

Defines complete light and dark theme objects with ~20 color tokens each (background, text variants, borders, cards, map, popups, overlays) plus chip color palettes.

### formatters.js

| Function | Example Input | Example Output |
|---|---|---|
| `fmt(n)` | 123456 | "123,456" |
| `pct(n)` | 0.125 | "12.5%" |
| `usdK(n)` | 89000 | "$89k" |
| `usdM(n)` | 2500000 | "$2.50M" |

---

## 9. How to Run

### Prerequisites
- Node.js >= 18
- npm

### Development

```bash
cd ui
npm install
npm run dev
```

Opens the development server (usually at `http://localhost:5173`).

### Production Build

```bash
cd ui
npm run build
```

Outputs static files to `ui/dist/`. Serve with any static file server:

```bash
npm run preview
```

### Regenerating Data

If the underlying CSV data or model output changes, regenerate the JSON files:

```bash
# From project root, with Python venv activated:
python data/generate_ward_filter_data.py
```

This overwrites `ui/src/data/wardFilterData.json` and `ui/src/data/blockLookup.json`.

---

## 10. File Structure

```
ui/
├── index.html                          # Entry HTML (Leaflet loaded dynamically)
├── package.json                        # Dependencies: react, react-dom, recharts
├── vite.config.js                      # Vite + React plugin config
├── src/
│   ├── main.jsx                        # React root mount
│   ├── App.jsx                         # Root component, state management, layout
│   ├── components/
│   │   ├── AddressSearch.jsx           # Geocoding + block risk lookup
│   │   ├── BottomCharts.jsx            # 4-chart grid (ward, hourly, monthly, violations)
│   │   ├── Chip.jsx                    # Active filter pill
│   │   ├── DetailPanel.jsx             # Per-ward drill-down sidebar
│   │   ├── EquityPanel.jsx             # 3 equity scatter plots with Pearson r
│   │   ├── Legend.jsx                  # Color scale + A-F grade info popup
│   │   ├── Sidebar.jsx                 # Filter controls (7 dimensions)
│   │   ├── StatCards.jsx               # 5 KPI summary cards
│   │   └── WardMap.jsx                 # Leaflet choropleth map
│   ├── data/
│   │   ├── mockdata.js                 # Data access layer and filter logic
│   │   ├── wardFilterData.json         # Pre-computed ward data (2.8 MB)
│   │   ├── blockLookup.json            # Block-level risk lookup (2.1 MB, lazy-loaded)
│   │   ├── wardBoundaries.js           # DC ward GeoJSON (920 KB)
│   │   └── zipBoundaries.json          # DC zip code GeoJSON
│   └── utils/
│       ├── colors.js                   # Color scales and legend data
│       ├── formatters.js               # Number/currency/percent formatters
│       └── theme.js                    # Light/dark theme definitions
└── dist/                               # Production build output
    ├── index.html
    └── assets/
        ├── index-*.js                  # Main bundle (~1.1 MB gzip)
        └── blockLookup-*.js            # Lazy chunk (~246 KB gzip)
```
