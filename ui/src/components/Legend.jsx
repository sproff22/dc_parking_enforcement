import { useState } from "react";
import { LEGEND_ITEMS, LEGEND_LABELS } from "../utils/colors";

const GRADE_INFO = [
  ["A", "#4ade80", "Low risk — rarely ticketed"],
  ["B", "#a3e635", "Below average enforcement"],
  ["C", "#fde047", "Moderate enforcement"],
  ["D", "#fb923c", "Above average enforcement"],
  ["F", "#ef4444", "High risk — frequently ticketed"],
];

export default function Legend({ mode, theme }) {
  const items = LEGEND_ITEMS[mode] ?? LEGEND_ITEMS.risk;
  const label = LEGEND_LABELS[mode] ?? LEGEND_LABELS.risk;
  const [showGrades, setShowGrades] = useState(false);

  return (
    <div style={{ position:"relative" }}>
      <div style={{ display:"flex", alignItems:"center", gap:10, fontSize:11, color:theme.textMuted, flexWrap:"wrap" }}>
        <span style={{ color:theme.textMuted, fontWeight:600 }}>{label}:</span>
        {items.map(([hex, lbl]) => (
          <span key={lbl} style={{ display:"flex", alignItems:"center", gap:5 }}>
            <span style={{ width:11, height:11, borderRadius:3, background:hex, display:"inline-block" }} />
            {lbl}
          </span>
        ))}
        <button
          onClick={() => setShowGrades(!showGrades)}
          style={{ background:"none", border:`1px solid ${theme.border}`, borderRadius:4, color:theme.textMuted, fontSize:10, padding:"2px 6px", cursor:"pointer", marginLeft:4 }}
          title="Enforcement Grade Scale (A-F)"
        >
          A-F Scale {showGrades ? "▾" : "▸"}
        </button>
      </div>
      {showGrades && (
        <div style={{ position:"absolute", top:"100%", right:0, marginTop:6, background:theme.cardBg, border:`1px solid ${theme.border}`, borderRadius:8, padding:"10px 14px", boxShadow:"0 4px 16px rgba(0,0,0,0.12)", zIndex:1000, minWidth:240 }}>
          <div style={{ fontSize:10, fontWeight:700, color:theme.text, marginBottom:6 }}>Enforcement Grade Scale</div>
          <div style={{ fontSize:9, color:theme.textMuted, marginBottom:8 }}>Based on relative enforcement intensity (citation frequency normalized across wards). Grades reflect the current filter context. Grade E is not used (standard academic scale).</div>
          {GRADE_INFO.map(([grade, color, desc]) => (
            <div key={grade} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
              <span style={{ width:22, height:18, borderRadius:4, background:color, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700, fontSize:11, color:"#000" }}>{grade}</span>
              <span style={{ fontSize:10, color:theme.textMuted }}>{desc}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
