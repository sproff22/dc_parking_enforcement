import { riskHex, riskLabel, riskGrade, gradeHex } from "../utils/colors";
import { fmt, pct, usdK, usdM } from "../utils/formatters";

export default function DetailPanel({ ward, onClose, theme, filteredStats }) {
  if (!ward) {
    return (
      <div style={{ width:210, background:theme.cardBg, borderLeft:`1px solid ${theme.border}`, display:"flex", alignItems:"center", justifyContent:"center", padding:16, flexShrink:0 }}>
        <p style={{ color:theme.textDimmed, fontSize:11, textAlign:"center" }}>Click a ward on the map to see details</p>
      </div>
    );
  }

  const s  = filteredStats[ward];
  const rc = riskHex(s.riskScore);
  const allCitations = Object.values(filteredStats).map(w => w.citations);
  const cityAvg = Math.round(allCitations.reduce((a, b) => a + b, 0) / allCitations.length);
  const maxCitations = Math.max(...allCitations);

  return (
    <div style={{ width:210, background:theme.cardBg, borderLeft:`1px solid ${theme.border}`, display:"flex", flexDirection:"column", padding:14, gap:11, overflowY:"auto", flexShrink:0 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
        <div>
          <div style={{ fontWeight:700, color:theme.text, fontSize:14 }}>Ward {ward}</div>
          <div style={{ fontSize:10, color:theme.textMuted }}>Jan–Dec 2025</div>
        </div>
        <button onClick={onClose} style={{ background:"none", border:"none", color:theme.textMuted, fontSize:20, cursor:"pointer", lineHeight:1 }}>x</button>
      </div>

      <div style={{ background:rc+"1a", border:`1px solid ${rc}44`, borderRadius:10, padding:10, textAlign:"center" }}>
        <div style={{ fontSize:10, color:theme.textMuted }}>Enforcement Grade</div>
        <div style={{ fontSize:48, fontWeight:800, color:gradeHex(riskGrade(s.riskScore)), lineHeight:1.1 }}>{riskGrade(s.riskScore)}</div>
        <div style={{ fontSize:11, color:rc, marginTop:2 }}>{riskLabel(s.riskScore)}</div>
        <div style={{ fontSize:10, color:theme.textMuted, marginTop:4 }}>{(s.riskScore*100).toFixed(0)}% enforcement intensity</div>
        <div style={{ fontSize:8, color:theme.textDimmed, marginTop:2, fontStyle:"italic" }}>Relative to current filter context</div>
      </div>

      <Section title="Citation Data (DC CSV)" theme={theme}>
        {[
          ["Total Citations", fmt(s.citations)],
          ["Fine Revenue",    usdM(s.fineRevenue)],
          ["Avg Fine",        `$${s.avgFine}`],
          ["Top Violation",   s.topViolation],
        ].map(([k, v]) => <Row key={k} k={k} v={v} theme={theme} />)}
      </Section>

      {s.citations < 30 && (
        <div style={{ background:"#fbbf2422", border:"1px solid #fbbf2466", borderRadius:6, padding:"6px 8px", fontSize:10, color:"#f59e0b", display:"flex", alignItems:"center", gap:5 }}>
          <span style={{ fontSize:14 }}>&#9888;</span>
          <span>Low sample size (n={fmt(s.citations)}). Results may be unreliable with current filters.</span>
        </div>
      )}

      <Section title="ACS Demographics" theme={theme}>
        {[
          ["Median Income",      usdK(s.medianIncome)],
          ["Poverty Rate",       pct(s.povertyRate)],
          ["Vehicle Ownership",  pct(s.vehicleOwnership)],
        ].map(([k, v]) => <Row key={k} k={k} v={v} theme={theme} />)}
      </Section>

      <div>
        <div style={{ fontSize:10, color:theme.textMuted, marginBottom:4 }}>Citations vs. city avg ({fmt(cityAvg)})</div>
        <div style={{ height:6, background:theme.border, borderRadius:99, overflow:"hidden" }}>
          <div style={{ height:"100%", borderRadius:99, width:`${Math.min((s.citations/maxCitations)*100,100)}%`, background:rc, transition:"width 0.4s" }} />
        </div>
      </div>

      <div style={{ fontSize:10, color:theme.border, marginTop:"auto" }}>ACS tables: B19013  B17001  B08201</div>
    </div>
  );
}

function Section({ title, children, theme }) {
  return (
    <div>
      <div style={{ fontSize:9, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.07em", color:theme.textDimmed, marginBottom:5 }}>{title}</div>
      <div style={{ display:"flex", flexDirection:"column", gap:5 }}>{children}</div>
    </div>
  );
}

function Row({ k, v, theme }) {
  return (
    <div style={{ display:"flex", justifyContent:"space-between", borderBottom:`1px solid ${theme.sectionDivider}`, paddingBottom:4, fontSize:11 }}>
      <span style={{ color:theme.textMuted }}>{k}</span>
      <span style={{ color:theme.text, fontWeight:500 }}>{v}</span>
    </div>
  );
}
