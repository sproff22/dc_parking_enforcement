DC PARKING ENFORCEMENT EXPLORER
Ticket Patterns: Spatiotemporal Modeling and Equity Analysis of Parking Enforcement in Washington, D.C.

Team #103 | CSE 6242 Data and Visual Analytics
Arun Polumbaum, Gabriel Castaneda, Katherine Morton, Meghan Peters, Samuel Roffman, Sara Jacob

================================================================================
DESCRIPTION
================================================================================

This project provides an interactive web application for exploring parking 
citation risk and enforcement equity across Washington, D.C.'s eight wards.

The tool combines:
- 1,027,421 raw parking citation records from DC Open Data (January–December 2025), of which 994,294 spatially matched citations were used
  in the final analysis
- Empirical Bayes beta-binomial risk modeling for recurrence scoring across 24,160 blocks and 336 time slots
- Census demographics (income, poverty, vehicle ownership, race) aggregated 
  by ward
- Interactive spatiotemporal filtering by violation type, time of day, season, 
  and day of week
- Equity analysis examining correlations between enforcement intensity and 
  socioeconomic factors

KEY FEATURES:

For Residents:
- Address Search: Enter your address to get a personalized enforcement risk 
  grade (A-F) for your block  
- Dynamic Risk Map: Interactive choropleth map showing ward-level enforcement 
  risk
- Temporal Filtering: See how risk changes by time of day (2-hour bands), day 
  of week, and season
- Violation-Specific Risk: Filter by specific violation types (meter 
  violations, no parking, street cleaning, etc.)

For Policymakers & Analysts:
- Equity Analysis: Scatter plots examining citation patterns vs. median income, 
  poverty rate, and demographic composition (People of Color)
- Per-Capita Normalization: Toggle to view citations per 1,000 residents to 
  account for population differences
- Correlation Metrics: Pearson correlation coefficients showing strength of 
  relationships
- Detailed Ward Profiles: View top violations, hourly/monthly patterns, and 
  riskiest blocks by ward

TECHNICAL APPROACH:

The application uses a beta-binomial empirical Bayes approach to produce 
posterior recurrence scores for each block across different temporal contexts 
(336 time slots = 12 time bands x 4 seasons x 7 days). The UI is entirely 
client-side with no backend required - all data is pre-computed and bundled as 
static JSON files (wardFilterData.json: 2.8 MB; blockLookup.json: 2.1 MB).

DATA SOURCES:
- DC Open Data: 1,027,421 raw parking citation records (Jan-Dec 2025) of which 994,294 used in final analysis
- DVA-Data/feature_data.parquet: Bayesian model output (8,117,760 rows)
- US Census Bureau: ACS 5-year estimates (demographics) for 8 wards
- DC Open Data: Ward boundaries (2022 redistricting)

================================================================================
INSTALLATION
================================================================================

PREREQUISITES:
- Node.js 16+ and npm (download from https://nodejs.org/)
- Modern web browser (Chrome, Firefox, Safari, or Edge)

INSTALLATION STEPS:

1. Navigate to the ui directory:
   cd ui

2. Install dependencies:
   npm install

   This will install:
   - React 18
   - Recharts 2 (for charts)
   - Vite 5 (build tool and dev server)

   Installation typically takes 30-60 seconds depending on your internet 
   connection.

NOTES:
- The DVA-Data folder is NOT required to run the user interface. It is only 
  needed if you want to regenerate the data files from scratch.
- All required data files (wardFilterData.json, blockLookup.json) are already 
  included in ui/src/data/
- The core dashboard runs fully client-side using precomputed local JSON files. No backend server, database, or API keys are required.
- An internet connection is required only for the address search feature, which uses OpenStreetMap Nominatim for geocoding.

================================================================================
EXECUTION  
================================================================================

RUNNING THE APPLICATION:

1. From the ui directory, start the development server:
   npm run dev

2. The application will start at http://localhost:5173

3. Open your web browser and navigate to http://localhost:5173

4. The dashboard will load automatically. You should see:
   - Interactive ward map in the center
   - Filter controls on the left sidebar
   - Summary statistics cards at the top
   - Charts and equity analysis tabs at the bottom

USING THE APPLICATION:

Main Dashboard:
- Click on any ward on the map to view detailed statistics
- Use the dropdown filters to slice data by:
  * Violation Type (27 types including "All Types")
  * Time of Day (12 two-hour bands: 12am-2am through 10pm-12am)
  * Season (Winter, Spring, Summer, Fall)
  * Day of Week (Mon-Sun)
- All charts and statistics update instantly when filters change

Address Search:
- Click the "Address Search" tab
- Enter any DC address (e.g., "1600 Pennsylvania Ave NW")
- Press Enter or click "Go"
- View your block's enforcement grade (A-F), risk score, and ticket count

Equity Analysis:
- Click the "Equity Analysis" tab
- View three scatter plots:
  1. Citations vs. Median Income  
  2. Citations vs. Poverty Rate
  3. Citations vs. % People of Color
- Toggle "Per 1k residents" checkbox to normalize by population
- Pearson correlation coefficients (r) are computed dynamically

STOPPING THE APPLICATION:
- Press Ctrl+C in the terminal where the dev server is running

PRODUCTION BUILD (Optional):
To build a production-ready static site:

1. From the ui directory:
   npm run build

2. This creates an optimized build in ui/dist/

3. To preview the production build:
   npm run preview

4. The dist/ folder can be deployed to any static hosting service (Netlify, 
   Vercel, GitHub Pages, AWS S3, etc.)

ALTERNATIVE: STREAMLIT APP (NOT RECOMMENDED):
A Streamlit alternative interface is available in main.py but requires the 
DVA-Data folder which is not included. We recommend using the React UI instead.

To run the Streamlit app (if you have DVA-Data):
1. pip install streamlit pandas numpy
2. streamlit run main.py

================================================================================
TROUBLESHOOTING
================================================================================

If the application doesn't start:
- Ensure Node.js 16+ is installed: node --version
- Delete node_modules and package-lock.json, then run npm install again
- Check that port 5173 is not already in use

If you see "Cannot find module" errors:
- Make sure you ran npm install from the ui/ directory (not the project root)

If charts don't display:
- Hard refresh the page (Ctrl+Shift+R or Cmd+Shift+R)
- Clear browser cache
- Try a different browser

For address search issues:
- Ensure you have internet connection (geocoding uses OpenStreetMap Nominatim)
- Include "DC" or "Washington" in your address for better results
- The search only works for addresses within DC's 8 wards

================================================================================
PROJECT STRUCTURE
================================================================================

CSE6242---DVA-Group-103--main/
├── README.txt                     # This file
├── data/                          # Data processing scripts
│   ├── generate_ward_filter_data.py   # Generates UI data files
│   ├── compute_ward_acs.py            # Aggregates census data by ward  
│   ├── concat_dc_data.py              # Merges monthly citation files
│   ├── dc_data/                       # Raw parking violation CSVs (12 months)
│   └── acs_data/                      # Census demographic data
├── ui/                            # React web application
│   ├── src/
│   │   ├── components/            # React components
│   │   │   ├── WardMap.jsx        # Interactive map
│   │   │   ├── AddressSearch.jsx  # Address lookup
│   │   │   ├── EquityPanel.jsx    # Equity scatter plots
│   │   │   ├── Sidebar.jsx        # Filter controls
│   │   │   └── ...               
│   │   └── data/                  # Pre-computed JSON data files
│   │       ├── wardFilterData.json    # Ward statistics (2.8 MB)
│   │       └── blockLookup.json       # Block risk scores (2.1 MB)
│   ├── package.json               # Dependencies
│   ├── vite.config.js             # Build configuration
│   ├── README.md                  # UI-specific README
│   └── UI_DOCUMENTATION.md        # Detailed component docs (34 pages)
├── visualization/                 # Geospatial assets
│   ├── Wards_from_2022.geojson    # DC ward boundaries
│   └── Zip_Codes.geojson          # ZIP code boundaries
└── main.py                        # Streamlit alternative (requires DVA-Data)

================================================================================
DEPENDENCIES
================================================================================

UI (React/Vite):
- React 18.3.1
- Recharts 2.12.7  
- Vite 5.4.11
- @vitejs/plugin-react 4.3.4

The UI runs standalone with precomputed data after installation. No backend services or external databases are required. 
An internet connection is only needed for address search geocoding.

Data Processing (only if regenerating data):
- Python 3.8+
- pandas, numpy, geopandas
- PyPDF2 (for PDF extraction)

================================================================================
ADDITIONAL DOCUMENTATION
================================================================================

For detailed technical documentation, see:
- ui/README.md - UI-specific setup and features
- ui/UI_DOCUMENTATION.md - Comprehensive component reference (34 pages),
  architecture diagrams, data pipeline description, and implementation details

For exploratory data analysis:
- eda/dc_parking_enforcement_eda.ipynb - Jupyter notebook with visualizations
  and statistical analysis of the raw parking citation data

================================================================================
KEY FINDINGS
================================================================================

Based on the equity analysis in the dashboard:

- Citations are concentrated in commercial/downtown wards (Ward 2: 435K 
  citations; Ward 6: 187K citations)
- Weak correlation with poverty - highest citation counts are in moderate-
  poverty wards, not the highest-poverty wards
- No strong ward-level evidence of demographic targeting in this descriptive analysis;
  enforcement patterns appear more related to commercial activity and parking supply than to race or income
- Ward 7-8 paradox: Highest poverty (24-27%) and highest POC populations 
  (97-98%) have among the lowest citation counts (36-39K)

These patterns suggest enforcement is driven more by factors like:
- Commercial density and parking demand
- Enforcement resource allocation  
- Parking supply constraints
- Meter vs. residential permit zones

Rather than systematic targeting of low-income or predominantly POC 
neighborhoods.

================================================================================
LICENSE & CONTRIBUTORS
================================================================================

This project was developed as part of coursework for CSE 6242 at Georgia Tech.

Team Members:
- Arun Polumbaum
- Gabriel Castaneda
- Katherine Morton
- Meghan Peters  
- Samuel Roffman
- Sara Jacob

All team members contributed equally to this project across proposal, progress, 
and final deliverables.

================================================================================
