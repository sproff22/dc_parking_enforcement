import { useState } from "react";
import Sidebar      from "./components/Sidebar";
import StatCards    from "./components/StatCards";
import WardMap      from "./components/WardMap";
import Legend       from "./components/Legend";
import BottomCharts from "./components/BottomCharts";
import DetailPanel  from "./components/DetailPanel";
import Chip         from "./components/Chip";
import { DEFAULT_FILTERS } from "./data/mockData";
import { themes } from "./utils/theme";

export default function App() {
  const [filters,  setFilters]  = useState(DEFAULT_FILTERS);
  const [selected, setSelected] = useState(null);
  const [isDark, setIsDark] = useState(false);
  
  const theme = isDark ? themes.dark : themes.light;

  const onChange = (key, val) => setFilters(prev => ({ ...prev, [key]: val }));
  const onReset  = () => { setFilters(DEFAULT_FILTERS); setSelected(null); };

  const activeWards = filters.ward ? [filters.ward] : [1,2,3,4,5,6,7,8];

  const handleWardClick = (wn) => {
    const next = selected === wn ? null : wn;
    setSelected(next);
    onChange("ward", next);
  };

  return (
    <div style={{ display:"flex", height:"100vh", width:"100vw", overflow:"hidden", background:theme.bg, color:theme.text, fontSize:13, fontFamily:"system-ui,sans-serif" }}>
      <Sidebar filters={filters} onChange={onChange} onReset={onReset} theme={theme} isDark={isDark} onToggleTheme={() => setIsDark(!isDark)} />

      <div style={{ flex:1, display:"flex", flexDirection:"column", padding:12, gap:9, overflow:"hidden", minWidth:0 }}>

        {/* Active filter chips */}
        <div style={{ display:"flex", gap:6, flexWrap:"wrap", alignItems:"center" }}>
          <span style={{ fontSize:10, color:theme.textMuted }}>{activeWards.length} ward{activeWards.length > 1 ? "s" : ""}</span>
          {filters.ward                              && <Chip label={`Ward ${filters.ward}`} theme={theme} isDark={isDark} />}
          {filters.violation !== "All Types"         && <Chip label={filters.violation} color="blue" theme={theme} isDark={isDark} />}
          {filters.timeRange !== "All Hours"         && <Chip label={filters.timeRange} color="purple" theme={theme} isDark={isDark} />}
          {filters.colorMode !== "risk"              && <Chip label={filters.colorMode === "income" ? "Income layer" : "Poverty layer"} color="orange" theme={theme} isDark={isDark} />}
          {filters.minRisk > 0                       && <Chip label={`Risk >= ${(filters.minRisk*100).toFixed(0)}%`} theme={theme} isDark={isDark} />}
        </div>

        <StatCards wards={activeWards} theme={theme} />

        <div style={{ flex:1, display:"flex", gap:9, minHeight:0 }}>
          <div style={{ flex:1, display:"flex", flexDirection:"column", gap:8, minHeight:0, minWidth:0 }}>
            <WardMap
              activeWard={filters.ward}
              onWardClick={handleWardClick}
              colorMode={filters.colorMode}
              minRisk={filters.minRisk}
              theme={theme}
            />
            <Legend mode={filters.colorMode} theme={theme} />
            <BottomCharts wards={activeWards} theme={theme} />
          </div>
          <DetailPanel
            ward={selected}
            onClose={() => { setSelected(null); onChange("ward", null); }}
            theme={theme}
          />
        </div>
      </div>
    </div>
  );
}
