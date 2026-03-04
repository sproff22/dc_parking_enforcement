import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { WARD_STATS, HOURLY_CITATIONS } from "../data/mockData";
import { riskHex, incomeHex } from "../utils/colors";
import { fmt } from "../utils/formatters";

export default function BottomCharts({ wards, theme }) {
  const ttStyle = { background:theme.cardBg, border:`1px solid ${theme.border}`, fontSize:11, color:theme.text };
  const wardBar = wards.map(w => ({
    ward:   `W${w}`,
    citations: WARD_STATS[w]?.citations ?? 0,
    income: Math.round((WARD_STATS[w]?.medianIncome ?? 0) / 1000),
    rFill:  riskHex(WARD_STATS[w]?.riskScore ?? 0),
    iFill:  incomeHex(WARD_STATS[w]?.medianIncome ?? 0),
  }));

  return (
    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, height:150 }}>
      <ChartBox title="Citations by Ward (after spatial join -> WARD field)" theme={theme}>
        <ResponsiveContainer width="100%" height={108}>
          <BarChart data={wardBar} margin={{ top:0,right:0,left:-22,bottom:0 }}>
            <XAxis dataKey="ward" tick={{ fontSize:10, fill:"#64748b" }} />
            <YAxis tick={{ fontSize:9, fill:"#64748b" }} />
            <Tooltip contentStyle={ttStyle} formatter={v => fmt(v)} />
            <Bar dataKey="citations" radius={[3,3,0,0]} fill="#3b82f6" />
          </BarChart>
        </ResponsiveContainer>
      </ChartBox>

      <ChartBox title="Citations by Hour (from ISSUE_TIME field)" theme={theme}>
        <ResponsiveContainer width="100%" height={108}>
          <BarChart data={HOURLY_CITATIONS} margin={{ top:0,right:0,left:-22,bottom:0 }}>
            <XAxis dataKey="hour" tick={{ fontSize:9, fill:"#64748b" }} />
            <YAxis tick={{ fontSize:9, fill:"#64748b" }} />
            <Tooltip contentStyle={ttStyle} />
            <Bar dataKey="n" fill="#8b5cf6" radius={[3,3,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartBox>

      <ChartBox title="Median Income by Ward (ACS B19013 - equity layer)" theme={theme}>
        <ResponsiveContainer width="100%" height={108}>
          <BarChart data={wardBar} margin={{ top:0,right:0,left:-8,bottom:0 }}>
            <XAxis dataKey="ward" tick={{ fontSize:10, fill:"#64748b" }} />
            <YAxis tick={{ fontSize:9, fill:"#64748b" }} unit="k" />
            <Tooltip contentStyle={ttStyle} formatter={v => `$${v}k`} />
            <Bar dataKey="income" radius={[3,3,0,0]} fill="#a78bfa" />
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
