import { useState } from "react";
import { ScatterChart, Scatter, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts";
import { riskHex } from "../utils/colors";
import { usdK, pct } from "../utils/formatters";

const ALL_WARDS = [1,2,3,4,5,6,7,8];

function pearsonR(xs, ys) {
  const n = xs.length;
  if (n < 3) return null;
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0, dx2 = 0, dy2 = 0;
  for (let i = 0; i < n; i++) {
    const dx = xs[i] - mx, dy = ys[i] - my;
    num += dx * dy; dx2 += dx * dx; dy2 += dy * dy;
  }
  const den = Math.sqrt(dx2 * dy2);
  return den === 0 ? 0 : num / den;
}

export default function EquityPanel({ theme, wards, filteredStats }) {
  const [perCapita, setPerCapita] = useState(false);
  const active = wards && wards.length ? wards : ALL_WARDS;

  const data = active.map(w => {
    const s = filteredStats[w];
    if (!s) return null;
    const pop = s.population || 1;
    const citVal = perCapita ? (s.citations / pop) * 1000 : s.citations;
    // Calculate People of Color share (1 - white share)
    const pocShare = 1 - (s.whiteShare || 0);
    return {
      ward: `W${w}`,
      citations: citVal,
      rawCitations: s.citations,
      population: pop,
      income: s.medianIncome,
      poverty: s.povertyRate,
      pocShare: pocShare,
      risk: s.riskScore,
    };
  }).filter(Boolean);

  const citLabel = perCapita ? "Citations per 1k residents" : "Citations";
  const rIncome = pearsonR(data.map(d => d.income), data.map(d => d.citations));
  const rPoverty = pearsonR(data.map(d => d.poverty), data.map(d => d.citations));
  const rPOC = pearsonR(data.map(d => d.pocShare), data.map(d => d.citations));

  // Debug: log data to see if variables are different
  console.log('Equity Panel Data:');
  console.table(data.map(d => ({
    ward: d.ward,
    citations: Math.round(d.citations),
    income: d.income,
    poverty: (d.poverty * 100).toFixed(1) + '%',
    pocShare: (d.pocShare * 100).toFixed(1) + '%'
  })));

  const ttStyle = { background:theme.cardBg, border:`1px solid ${theme.border}`, fontSize:11, color:theme.text, borderRadius:6 };

  const CustomTooltip = ({ active: a, payload }) => {
    if (!a || !payload?.length) return null;
    const d = payload[0].payload;
    return (
      <div style={{ ...ttStyle, padding:"8px 10px" }}>
        <div style={{ fontWeight:700, marginBottom:2 }}>{d.ward}</div>
        <div>{citLabel}: {perCapita ? d.citations.toFixed(1) : d.citations.toLocaleString()}</div>
        {perCapita && <div>Raw citations: {d.rawCitations.toLocaleString()}</div>}
        <div>Income: {usdK(d.income)}</div>
        <div>Poverty: {pct(d.poverty)}</div>
        <div>Risk: {(d.risk * 100).toFixed(0)}%</div>
        {d.pocShare != null && <div>% POC: {(d.pocShare * 100).toFixed(0)}%</div>}
      </div>
    );
  };

  const yTickFmt = perCapita
    ? (v => v.toFixed(0))
    : (v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v);

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ fontSize:9, color:theme.textDimmed, fontStyle:"italic" }}>Descriptive only — does not control for confounding factors (enforcement density, commercial activity, parking supply).</div>
        <label style={{ display:"flex", alignItems:"center", gap:5, fontSize:10, color:theme.textMuted, cursor:"pointer", flexShrink:0, marginLeft:12 }}>
          <input type="checkbox" checked={perCapita} onChange={e => setPerCapita(e.target.checked)} style={{ accentColor:"#3b82f6" }} />
          Per 1k residents
        </label>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8 }}>
      <ChartBox title={`${citLabel} vs. Median Income`} subtitle={`r = ${rIncome !== null ? rIncome.toFixed(2) : 'N/A'} · n = ${data.length} wards`} theme={theme}>
        <ResponsiveContainer width="100%" height={135}>
          <ScatterChart margin={{ top:8,right:12,left:-10,bottom:2 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={theme.border} />
            <XAxis type="number" dataKey="income" name="Income" tick={{ fontSize:9, fill:theme.textMuted }}
              tickFormatter={v => `$${(v/1000).toFixed(0)}k`}
              domain={[50000, 170000]} allowDataOverflow={false} />
            <YAxis type="number" dataKey="citations" name={citLabel} tick={{ fontSize:9, fill:theme.textMuted }}
              tickFormatter={yTickFmt} allowDataOverflow={false} />
            <Tooltip content={<CustomTooltip />} />
            <Scatter data={data} fill="#3b82f6">
              {data.map((d, i) => <Cell key={i} fill={riskHex(d.risk)} />)}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </ChartBox>

      <ChartBox title={`${citLabel} vs. Poverty Rate`} subtitle={`r = ${rPoverty !== null ? rPoverty.toFixed(2) : 'N/A'} · n = ${data.length} wards`} theme={theme}>
        <ResponsiveContainer width="100%" height={135}>
          <ScatterChart margin={{ top:8,right:12,left:-10,bottom:2 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={theme.border} />
            <XAxis type="number" dataKey="poverty" name="Poverty" tick={{ fontSize:9, fill:theme.textMuted }}
              tickFormatter={v => `${(v*100).toFixed(0)}%`}
              domain={[0, 0.3]} allowDataOverflow={false} />
            <YAxis type="number" dataKey="citations" name={citLabel} tick={{ fontSize:9, fill:theme.textMuted }}
              tickFormatter={yTickFmt} allowDataOverflow={false} />
            <Tooltip content={<CustomTooltip />} />
            <Scatter data={data} fill="#3b82f6">
              {data.map((d, i) => <Cell key={i} fill={riskHex(d.risk)} />)}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </ChartBox>

      <ChartBox title={`${citLabel} vs. % People of Color`} subtitle={`r = ${rPOC !== null ? rPOC.toFixed(2) : 'N/A'} · n = ${data.length} wards`} theme={theme}>
        <ResponsiveContainer width="100%" height={135}>
          <ScatterChart margin={{ top:8,right:12,left:-10,bottom:2 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={theme.border} />
            <XAxis type="number" dataKey="pocShare" name="% POC" tick={{ fontSize:9, fill:theme.textMuted }}
              tickFormatter={v => `${(v*100).toFixed(0)}%`}
              domain={[0, 1]} allowDataOverflow={false} />
            <YAxis type="number" dataKey="citations" name={citLabel} tick={{ fontSize:9, fill:theme.textMuted }}
              tickFormatter={yTickFmt} allowDataOverflow={false} />
            <Tooltip content={<CustomTooltip />} />
            <Scatter data={data} fill="#3b82f6">
              {data.map((d, i) => <Cell key={i} fill={riskHex(d.risk)} />)}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </ChartBox>
    </div>
    </div>
  );
}

function ChartBox({ title, subtitle, children, theme }) {
  return (
    <div style={{ background:theme.chartBg, border:`1px solid ${theme.border}`, borderRadius:10, padding:"8px 10px" }}>
      <div style={{ fontSize:10, fontWeight:600, color:theme.textMuted, marginBottom:1 }}>{title}</div>
      {subtitle && <div style={{ fontSize:8, color:theme.textDimmed, marginBottom:4 }}>{subtitle}</div>}
      {children}
    </div>
  );
}
