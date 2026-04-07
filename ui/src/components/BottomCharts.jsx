import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { getHourlyCitations, getTopViolations, getMonthlyCitations } from "../data/mockData";
import { riskHex } from "../utils/colors";
import { fmt } from "../utils/formatters";

export default function BottomCharts({ wards, theme, filteredStats, filters }) {
  const ttStyle = { background:theme.cardBg, border:`1px solid ${theme.border}`, fontSize:11, color:theme.text };

  const wardBar = wards.map(w => ({
    ward:   `W${w}`,
    citations: filteredStats[w]?.citations ?? 0,
    rFill:  riskHex(filteredStats[w]?.riskScore ?? 0),
  }));
  const hourlyCitations = getHourlyCitations(wards, filters);
  const topViolations = getTopViolations(wards, filteredStats, filters);
  const monthlyCitations = getMonthlyCitations(wards);

  return (
    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:8, height:170 }}>
      <ChartBox title="Citations by Ward" theme={theme}>
        <ResponsiveContainer width="100%" height={128}>
          <BarChart data={wardBar} margin={{ top:0,right:0,left:-22,bottom:0 }}>
            <XAxis dataKey="ward" tick={{ fontSize:10, fill:theme.textMuted }} />
            <YAxis tick={{ fontSize:9, fill:theme.textMuted }} />
            <Tooltip contentStyle={ttStyle} formatter={v => fmt(v)} />
            <Bar dataKey="citations" radius={[3,3,0,0]}>
              {wardBar.map((d, i) => <Cell key={i} fill={d.rFill} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartBox>

      <ChartBox title="Citations by Hour" subtitle={filters?.violation !== "All Types" || filters?.season !== "All Seasons" || filters?.dayOfWeek !== "All Days" ? "(filtered)" : null} theme={theme}>
        <ResponsiveContainer width="100%" height={128}>
          <BarChart data={hourlyCitations} margin={{ top:0,right:0,left:-22,bottom:0 }}>
            <XAxis dataKey="hour" tick={{ fontSize:8, fill:theme.textMuted }} interval={1} />
            <YAxis tick={{ fontSize:9, fill:theme.textMuted }} />
            <Tooltip contentStyle={ttStyle} />
            <Bar dataKey="n" fill="#8b5cf6" radius={[3,3,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartBox>

      <ChartBox title="Monthly Trend (2025)" theme={theme}>
        <ResponsiveContainer width="100%" height={128}>
          <LineChart data={monthlyCitations} margin={{ top:4,right:8,left:-22,bottom:0 }}>
            <XAxis dataKey="month" tick={{ fontSize:9, fill:theme.textMuted }} />
            <YAxis tick={{ fontSize:9, fill:theme.textMuted }} />
            <Tooltip contentStyle={ttStyle} formatter={v => fmt(v)} />
            <Line type="monotone" dataKey="n" stroke="#3b82f6" strokeWidth={2} dot={{ r:3, fill:"#3b82f6" }} />
          </LineChart>
        </ResponsiveContainer>
      </ChartBox>

      <ChartBox title="Top Violation Types" theme={theme}>
        <ResponsiveContainer width="100%" height={128}>
          <BarChart data={topViolations} layout="vertical" margin={{ top:0,right:8,left:2,bottom:0 }}>
            <XAxis type="number" tick={{ fontSize:9, fill:theme.textMuted }} tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
            <YAxis type="category" dataKey="name" tick={<TruncatedTick fill={theme.textMuted} />} width={80} interval={0} />
            <Tooltip contentStyle={ttStyle} formatter={v => fmt(v)} />
            <Bar dataKey="count" radius={[0,3,3,0]} fill="#a78bfa" />
          </BarChart>
        </ResponsiveContainer>
      </ChartBox>
    </div>
  );
}

function TruncatedTick({ x, y, payload, fill }) {
  const label = payload.value.length > 16 ? payload.value.slice(0, 14) + "…" : payload.value;
  return (
    <text x={x} y={y} dy={3} textAnchor="end" fontSize={7} fill={fill}>
      {label}
    </text>
  );
}

function ChartBox({ title, subtitle, children, theme }) {
  return (
    <div style={{ background:theme.chartBg, border:`1px solid ${theme.border}`, borderRadius:10, padding:"8px 10px" }}>
      <div style={{ display:"flex", alignItems:"baseline", gap:4 }}>
        <div style={{ fontSize:9, color:theme.textDimmed, marginBottom:3 }}>{title}</div>
        {subtitle && <div style={{ fontSize:8, color:theme.textMuted, fontStyle:"italic" }}>{subtitle}</div>}
      </div>
      {children}
    </div>
  );
}
