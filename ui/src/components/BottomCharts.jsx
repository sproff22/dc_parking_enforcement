import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { getHourlyCitations, getTopViolations } from "../data/mockData";
import { riskHex } from "../utils/colors";
import { fmt } from "../utils/formatters";

export default function BottomCharts({ wards, theme, filteredStats }) {
  const ttStyle = { background:theme.cardBg, border:`1px solid ${theme.border}`, fontSize:11, color:theme.text };

  const wardBar = wards.map(w => ({
    ward:   `W${w}`,
    citations: filteredStats[w]?.citations ?? 0,
    rFill:  riskHex(filteredStats[w]?.riskScore ?? 0),
  }));
  const hourlyCitations = getHourlyCitations(wards);
  const topViolations = getTopViolations(wards, filteredStats);

  return (
    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, height:150 }}>
      <ChartBox title="Citations by Ward" theme={theme}>
        <ResponsiveContainer width="100%" height={108}>
          <BarChart data={wardBar} margin={{ top:0,right:0,left:-22,bottom:0 }}>
            <XAxis dataKey="ward" tick={{ fontSize:10, fill:"#64748b" }} />
            <YAxis tick={{ fontSize:9, fill:"#64748b" }} />
            <Tooltip contentStyle={ttStyle} formatter={v => fmt(v)} />
            <Bar dataKey="citations" radius={[3,3,0,0]}>
              {wardBar.map((d, i) => <Cell key={i} fill={d.rFill} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartBox>

      <ChartBox title="Citations by Hour" theme={theme}>
        <ResponsiveContainer width="100%" height={108}>
          <BarChart data={hourlyCitations} margin={{ top:0,right:0,left:-22,bottom:0 }}>
            <XAxis dataKey="hour" tick={{ fontSize:9, fill:"#64748b" }} />
            <YAxis tick={{ fontSize:9, fill:"#64748b" }} />
            <Tooltip contentStyle={ttStyle} />
            <Bar dataKey="n" fill="#8b5cf6" radius={[3,3,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartBox>

      <ChartBox title="Top Violation Types" theme={theme}>
        <ResponsiveContainer width="100%" height={108}>
          <BarChart data={topViolations} layout="vertical" margin={{ top:0,right:8,left:2,bottom:0 }}>
            <XAxis type="number" tick={{ fontSize:9, fill:"#64748b" }} tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
            <YAxis type="category" dataKey="name" tick={{ fontSize:8, fill:"#64748b" }} width={70} />
            <Tooltip contentStyle={ttStyle} formatter={v => fmt(v)} />
            <Bar dataKey="count" radius={[0,3,3,0]} fill="#a78bfa" />
          </BarChart>
        </ResponsiveContainer>
      </ChartBox>
    </div>
  );
}

function ChartBox({ title, children, theme }) {
  return (
    <div style={{ background:theme.chartBg, border:`1px solid ${theme.border}`, borderRadius:10, padding:"8px 10px" }}>
      <div style={{ fontSize:9, color:theme.textDimmed, marginBottom:3 }}>{title}</div>
      {children}
    </div>
  );
}
