# DC Parking Enforcement Explorer — UI

React dashboard for CSE 6242 Team 103.

## Features

- Interactive ward-level map of DC with citation data
- Multiple visualization layers (risk score, income, poverty)
- Light/dark mode toggle for accessibility
- Responsive charts and stat cards
- Real-time filtering (ward, violation type, time of day, risk threshold)

## Structure

```
ui/
  index.html                  # Entry HTML file
  vite.config.js              # Vite configuration
  package.json                # Dependencies and scripts
  src/
    main.jsx                  # React entry point
    App.jsx                   # Root component, holds all filter state + theme
    components/
      Sidebar.jsx             # Filter controls (ward, violation, time, light/dark toggle)
      StatCards.jsx           # Summary metric cards across top
      WardMap.jsx             # Leaflet map with DC ward polygons
      Legend.jsx              # Color scale legend below map
      BottomCharts.jsx        # Three bar charts (citations, hourly, income)
      DetailPanel.jsx         # Right-side panel shown on ward click
      Chip.jsx                # Filter tag pill component
    data/
      wardBoundaries.js       # Embedded GeoJSON for DC ward polygons
      mockData.js             # Mock aggregated stats (replace with real pipeline output)
    utils/
      colors.js               # Color scale functions (risk, income, poverty)
      formatters.js           # Number formatters (fmt, pct, usdK, usdM)
      theme.js                # Light/dark mode theme definitions
```

## Swapping in Real Data

When the data pipeline is ready, only `src/data/mockData.js` needs to change.
Replace `WARD_STATS` with your aggregated DataFrame exported to JSON:

```python
# In your pipeline notebook:
ward_summary.to_json("ui/src/data/wardStats.json", orient="index")
```

Then update the import in mockData.js to load from that file.

## Running Locally

```bash
npm install
npm run dev
```

Requires Node 18+. All dependencies: React, recharts, Leaflet (loaded via CDN).
