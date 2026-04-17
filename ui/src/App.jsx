import { useState, useMemo, useEffect, useCallback } from "react";
import Sidebar      from "./components/Sidebar";
import StatCards    from "./components/StatCards";
import WardMap      from "./components/WardMap";
import Legend       from "./components/Legend";
import BottomCharts from "./components/BottomCharts";
import EquityPanel  from "./components/EquityPanel";
import DetailPanel  from "./components/DetailPanel";
import Chip         from "./components/Chip";
import AddressSearch from "./components/AddressSearch";
import { DEFAULT_FILTERS, getFilteredStats } from "./data/mockData";
import { themes } from "./utils/theme";

export default function App() {
  const [filters,  setFilters]  = useState(DEFAULT_FILTERS);
  const [selected, setSelected] = useState(null);
  const [isDark, setIsDark] = useState(false);
  const [showZips, setShowZips] = useState(false);
  const [bottomTab, setBottomTab] = useState("charts");
  const [searchPin, setSearchPin] = useState(null);
  const [resetKey, setResetKey] = useState(0);
  
  const theme = isDark ? themes.dark : themes.light;

  // Persist theme preference
  useEffect(() => {
    const saved = localStorage.getItem("dva103-dark");
    if (saved !== null) setIsDark(JSON.parse(saved));
  }, []);
  useEffect(() => { localStorage.setItem("dva103-dark", JSON.stringify(isDark)); }, [isDark]);

  const filteredStats = useMemo(
    () => getFilteredStats(filters),
    [filters]
  );

  const onChange = useCallback((key, val) => {
    setFilters(prev => ({ ...prev, [key]: val }));
    if (key === "ward") setSelected(val);
  }, []);
  const onReset  = () => { setFilters(DEFAULT_FILTERS); setSelected(null); setSearchPin(null); setResetKey(k => k + 1); };


  const activeWards = filters.ward ? [filters.ward] : [1,2,3,4,5,6,7,8];

  const handleWardClick = (wn) => {
    const next = selected === wn ? null : wn;
    setSelected(next);
    onChange("ward", next);
  };

  return (
    <div style={{ display:"flex", height:"100vh", width:"100vw", overflow:"hidden", background:theme.bg, color:theme.text, fontSize:13, fontFamily:"system-ui,sans-serif" }}>
      <Sidebar filters={filters} onChange={onChange} onReset={onReset} theme={theme} isDark={isDark} onToggleTheme={() => setIsDark(!isDark)}>
        <AddressSearch onResult={({ ward, lat, lng }) => { handleWardClick(ward); setSearchPin({ lat, lng }); }} theme={theme} resetKey={resetKey} />
      </Sidebar>

      <div style={{ flex:1, display:"flex", flexDirection:"column", padding:12, gap:9, overflow:"hidden", minWidth:0 }}>

        {/* Active filter chips */}
        <div style={{ display:"flex", gap:6, flexWrap:"wrap", alignItems:"center" }}>
          <span style={{ fontSize:10, color:theme.textMuted }}>{activeWards.length} ward{activeWards.length > 1 ? "s" : ""}</span>
          {filters.ward                              && <Chip label={`Ward ${filters.ward}`} theme={theme} isDark={isDark} />}
          {filters.violation !== "All Types"         && <Chip label={filters.violation} color="blue" theme={theme} isDark={isDark} />}
          {filters.timeRange !== "All Hours"         && <Chip label={filters.timeRange} color="purple" theme={theme} isDark={isDark} />}
          {filters.season !== "All Seasons"           && <Chip label={filters.season} color="green" theme={theme} isDark={isDark} />}
          {filters.dayOfWeek !== "All Days"            && <Chip label={filters.dayOfWeek} color="teal" theme={theme} isDark={isDark} />}
          {filters.colorMode !== "risk"              && <Chip label={filters.colorMode === "income" ? "Income layer" : "Poverty layer"} color="orange" theme={theme} isDark={isDark} />}
          {filters.minRisk > 0                       && <Chip label={`Risk >= ${(filters.minRisk*100).toFixed(0)}%`} theme={theme} isDark={isDark} />}
        </div>

        <StatCards wards={activeWards} theme={theme} filteredStats={filteredStats} />

        <div style={{ flex:1, display:"flex", gap:9, minHeight:0 }}>
          <div style={{ flex:1, display:"flex", flexDirection:"column", gap:8, minHeight:0, minWidth:0 }}>
            <WardMap
              activeWard={filters.ward}
              onWardClick={handleWardClick}
              colorMode={filters.colorMode}
              minRisk={filters.minRisk}
              theme={theme}
              showZips={showZips}
              filteredStats={filteredStats}
              searchPin={searchPin}
            />
            <Legend mode={filters.colorMode} theme={theme} />
            <div style={{ display:"flex", gap:6, alignItems:"center" }}>
              <button onClick={() => setBottomTab("charts")} style={{ background: bottomTab==="charts" ? theme.text+"18" : "transparent", border:`1px solid ${theme.border}`, borderRadius:5, padding:"3px 10px", fontSize:10, color:theme.textMuted, cursor:"pointer", fontWeight: bottomTab==="charts" ? 600 : 400 }}>Charts</button>
              <button onClick={() => setBottomTab("equity")} style={{ background: bottomTab==="equity" ? theme.text+"18" : "transparent", border:`1px solid ${theme.border}`, borderRadius:5, padding:"3px 10px", fontSize:10, color:theme.textMuted, cursor:"pointer", fontWeight: bottomTab==="equity" ? 600 : 400 }}>Equity Analysis</button>
              <div style={{ flex:1 }} />
              <label style={{ display:"flex", alignItems:"center", gap:5, fontSize:10, color:theme.textMuted, cursor:"pointer" }}>
                <input type="checkbox" checked={showZips} onChange={e => setShowZips(e.target.checked)} style={{ accentColor:"#3b82f6" }} />
                Zip code boundaries
              </label>
            </div>
            {bottomTab === "charts" ? (
              <BottomCharts wards={activeWards} theme={theme} filteredStats={filteredStats} filters={filters} />
            ) : (
              <EquityPanel wards={activeWards} theme={theme} filteredStats={filteredStats} />
            )}
          </div>
          <DetailPanel
            ward={selected}
            onClose={() => { setSelected(null); onChange("ward", null); setSearchPin(null); }}
            theme={theme}
            filteredStats={filteredStats}
          />
        </div>
      </div>
    </div>
  );
}
