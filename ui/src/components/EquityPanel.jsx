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
  const active = wards && wards.length ? wards : ALL_WARDS;

  const data = active.map(w => {
    const s = filteredStats[w];
    if (!s) return null;
    return {
      ward: `W${w}`,
      citations: s.citations,
      income: s.medianIncome,
      poverty: s.povertyRate,
      blackShare: s.blackShare,
      risk: s.riskScore,
    };
  }).filter(Boolean);

  const rIncome = pearsonR(data.map(d => d.income), data.map(d => d.citations));
  const rPoverty = pearsonR(data.map(d => d.poverty), data.map(d => d.citations));
  const rBlack = pearsonR(data.map(d => d.blackShare), data.map(d => d.citations));

  const ttStyle = { background:theme.cardBg, border:`1px solid ${theme.border}`, fontSize:11, color:theme.text, borderRadius:6 };

  const CustomTooltip = ({ active: a, payload }) => {
    if (!a || !payload?.length) return null;
    const d = payload[0].payload;
    return (
      <div style={{ ...ttStyle, padding:"8px 10px" }}>
        <div style={{ fontWeight:700, marginBottom:2 }}>{d.ward}</div>
        <div>Citations: {d.citations.toLocaleString()}</div>
        <div>Income: {usdK(d.income)}</div>
        <div>Poverty: {pct(d.poverty)}</div>
        <div>Risk: {(d.risk * 100).toFixed(0)}%</div>
        {d.blackShare != null && <div>% Black: {(d.blackShare * 100).toFixed(0)}%</div>}
      </div>
    );
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
      <div style={{ fontSize:9, color:theme.textDimmed, fontStyle:"italic", padding:"0 4px" }}>Descriptive only — does not control for confounding factors (enforcement density, commercial activity, parking supply).</div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8 }}>
      <ChartBox title="Citations vs. Median Income" subtitle={`r = ${rIncome !== null ? rIncome.toFixed(2) : 'N/A'} · n = ${data.length} wards`} theme={theme}>
        <ResponsiveContainer width="100%" height={135}>
          <ScatterChart margin={{ top:8,right:12,left:-10,bottom:2 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={theme.border} />
            <XAxis dataKey="income" name="Income" tick={{ fontSize:9, fill:theme.textMuted }}
              tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
            <YAxis dataKey="citations" name="Citations" tick={{ fontSize:9, fill:theme.textMuted }}
              tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
            <Tooltip content={<CustomTooltip />} />
            <Scatter data={data} fill="#3b82f6">
              {data.map((d, i) => <Cell key={i} fill={riskHex(d.risk)} />)}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </ChartBox>

      <ChartBox title="Citations vs. Poverty Rate" subtitle={`r = ${rPoverty !== null ? rPoverty.toFixed(2) : 'N/A'} · n = ${data.length} wards`} theme={theme}>
        <ResponsiveContainer width="100%" height={135}>
          <ScatterChart margin={{ top:8,right:12,left:-10,bottom:2 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={theme.border} />
            <XAxis dataKey="poverty" name="Poverty" tick={{ fontSize:9, fill:theme.textMuted }}
              tickFormatter={v => `${(v*100).toFixed(0)}%`} />
            <YAxis dataKey="citations" name="Citations" tick={{ fontSize:9, fill:theme.textMuted }}
              tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
            <Tooltip content={<CustomTooltip />} />
            <Scatter data={data} fill="#3b82f6">
              {data.map((d, i) => <Cell key={i} fill={riskHex(d.risk)} />)}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </ChartBox>

      <ChartBox title="Citations vs. % Black Population" subtitle={`r = ${rBlack !== null ? rBlack.toFixed(2) : 'N/A'} · n = ${data.length} wards`} theme={theme}>
        <ResponsiveContainer width="100%" height={135}>
          <ScatterChart margin={{ top:8,right:12,left:-10,bottom:2 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={theme.border} />
            <XAxis dataKey="blackShare" name="% Black" tick={{ fontSize:9, fill:theme.textMuted }}
              tickFormatter={v => `${(v*100).toFixed(0)}%`} />
            <YAxis dataKey="citations" name="Citations" tick={{ fontSize:9, fill:theme.textMuted }}
              tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
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
