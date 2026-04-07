import { riskHex, riskLabel } from "../utils/colors";
import { fmt, pct, usdK, usdM } from "../utils/formatters";

export default function StatCards({ wards, theme, filteredStats }) {
  const stats = wards.map(w => filteredStats[w]).filter(Boolean);
  const tot  = stats.reduce((s, d) => s + d.citations,   0);
  const rev  = stats.reduce((s, d) => s + d.fineRevenue, 0);
  const risk = stats.length ? stats.reduce((s, d) => s + d.riskScore,    0) / stats.length : 0;
  const inc  = stats.length ? Math.round(stats.reduce((s, d) => s + d.medianIncome, 0) / stats.length) : 0;
  const pov  = stats.length ? stats.reduce((s, d) => s + d.povertyRate,  0) / stats.length : 0;

  const cards = [
    { lbl:"Total Citations",   val:fmt(tot),                     sub:"Jan–Dec 2025 (filtered)" },
    { lbl:"Fine Revenue",      val:usdM(rev),                    sub:"from FINE_AMOUNT field" },
    { lbl:"Enforcement Index", val:`${(risk*100).toFixed(0)}%`,  sub:riskLabel(risk), c:riskHex(risk) },
    { lbl:"Avg Median Income", val:usdK(inc),                    sub:"ACS table B19013" },
    { lbl:"Avg Poverty Rate",  val:pct(pov),                     sub:"ACS table B17001" },
  ];

  return (
    <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:8 }}>
      {cards.map(({ lbl, val, sub, c }) => (
        <div key={lbl} style={{ background:theme.cardBg, border:`1px solid ${theme.border}`, borderRadius:10, padding:"10px 12px" }}>
          <div style={{ fontSize:10, color:theme.textMuted }}>{lbl}</div>
          <div style={{ fontSize:21, fontWeight:700, color:c ?? theme.text, marginTop:2 }}>{val}</div>
          <div style={{ fontSize:10, color:c ?? theme.textDimmed, marginTop:2 }}>{sub}</div>
        </div>
      ))}
    </div>
  );
}
