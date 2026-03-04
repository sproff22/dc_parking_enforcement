import { LEGEND_ITEMS, LEGEND_LABELS } from "../utils/colors";

export default function Legend({ mode, theme }) {
  const items = LEGEND_ITEMS[mode] ?? LEGEND_ITEMS.risk;
  const label = LEGEND_LABELS[mode] ?? LEGEND_LABELS.risk;

  return (
    <div style={{ display:"flex", alignItems:"center", gap:10, fontSize:11, color:theme.textMuted, flexWrap:"wrap" }}>
      <span style={{ color:theme.textMuted, fontWeight:600 }}>{label}:</span>
      {items.map(([hex, lbl]) => (
        <span key={lbl} style={{ display:"flex", alignItems:"center", gap:5 }}>
          <span style={{ width:11, height:11, borderRadius:3, background:hex, display:"inline-block" }} />
          {lbl}
        </span>
      ))}
    </div>
  );
}
