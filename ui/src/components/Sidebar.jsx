import { VIOLATION_TYPES, TIME_RANGES } from "../data/mockData";

export default function Sidebar({ filters, onChange, onReset, theme, isDark, onToggleTheme }) {
  const selS = {
    width: "100%", background: theme.inputBg, border: `1px solid ${theme.border}`,
    borderRadius: 4, padding: "5px 8px", fontSize: 12, color: theme.text, outline: "none",
  };
  
  return (
    <aside style={{ width:195, background:theme.sidebarBg, color:theme.text, display:"flex", flexDirection:"column", padding:14, gap:16, borderRight:`1px solid ${theme.border}`, overflowY:"auto", flexShrink:0 }}>
      <div>
        <div style={{ fontWeight:700, fontSize:14, color:theme.text }}>DC Parking</div>
        <div style={{ fontSize:10, color:theme.textMuted, marginTop:2 }}>Enforcement Explorer  CSE 6242</div>
      </div>
      
      {/* Theme Toggle */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"8px 0", borderTop:`1px solid ${theme.border}`, borderBottom:`1px solid ${theme.border}` }}>
        <span style={{ fontSize:11, color:theme.textMuted }}>Dark Mode</span>
        <button 
          onClick={onToggleTheme}
          style={{ 
            width:42, height:22, borderRadius:11, border:"none", cursor:"pointer",
            background: isDark ? "#3b82f6" : "#cbd5e1",
            position:"relative", transition:"background 0.2s"
          }}
        >
          <div style={{ 
            width:16, height:16, borderRadius:"50%", background:"white",
            position:"absolute", top:3, left: isDark ? 23 : 3,
            transition:"left 0.2s", boxShadow:"0 1px 3px rgba(0,0,0,0.3)"
          }} />
        </button>
      </div>

      <FilterSection label="Ward" theme={theme}>
        <select style={selS} value={filters.ward ?? ""} onChange={e => onChange("ward", e.target.value === "" ? null : parseInt(e.target.value))}>
          <option value="">All Wards</option>
          {[1,2,3,4,5,6,7,8].map(w => <option key={w} value={w}>Ward {w}</option>)}
        </select>
      </FilterSection>

      <FilterSection label="Violation Type" theme={theme}>
        <select style={selS} value={filters.violation} onChange={e => onChange("violation", e.target.value)}>
          {VIOLATION_TYPES.map(v => <option key={v}>{v}</option>)}
        </select>
      </FilterSection>

      <FilterSection label="Time of Day" theme={theme}>
        {TIME_RANGES.map(t => (
          <label key={t} style={{ display:"flex", alignItems:"center", gap:7, fontSize:12, cursor:"pointer", padding:"1px 0" }}>
            <input type="radio" name="time" checked={filters.timeRange === t}
              onChange={() => onChange("timeRange", t)} style={{ accentColor:"#3b82f6" }} />
            {t}
          </label>
        ))}
      </FilterSection>

      <FilterSection label="Map Color Layer" theme={theme}>
        {[["risk","Risk Score"],["income","Median Income (ACS)"],["poverty","Poverty Rate (ACS)"]].map(([val, lbl]) => (
          <label key={val} style={{ display:"flex", alignItems:"center", gap:7, fontSize:12, cursor:"pointer", padding:"1px 0" }}>
            <input type="radio" name="color" checked={filters.colorMode === val}
              onChange={() => onChange("colorMode", val)} style={{ accentColor:"#3b82f6" }} />
            {lbl}
          </label>
        ))}
      </FilterSection>

      <FilterSection label={`Min Risk Threshold: ${(filters.minRisk * 100).toFixed(0)}%`} theme={theme}>
        <input type="range" min="0" max="0.9" step="0.05" value={filters.minRisk}
          onChange={e => onChange("minRisk", parseFloat(e.target.value))}
          style={{ width:"100%", accentColor:"#3b82f6" }} />
        <div style={{ display:"flex", justifyContent:"space-between", fontSize:9, color:theme.textDimmed }}>
          <span>0%</span><span>90%</span>
        </div>
      </FilterSection>

      <div style={{ marginTop:"auto" }}>
        <button onClick={onReset} style={{ width:"100%", background:"transparent", border:`1px solid ${theme.border}`, color:theme.textMuted, padding:"6px 0", borderRadius:6, cursor:"pointer", fontSize:12 }}>
          Reset Filters
        </button>
      </div>
    </aside>
  );
}

function FilterSection({ label, children, theme }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
      <div style={{ fontSize:9, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.07em", color:theme.textDimmed }}>{label}</div>
      {children}
    </div>
  );
}
