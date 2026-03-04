// Color scale helpers — used by the map, charts, and detail panel.
// Each function maps a data value to a hex color.

export const riskHex = (s) =>
  s > 0.75 ? "#ef4444" : s > 0.5 ? "#fb923c" : s > 0.25 ? "#fde047" : "#4ade80";

export const riskLabel = (s) =>
  s > 0.75 ? "Very High" : s > 0.5 ? "High" : s > 0.25 ? "Medium" : "Low";

export const incomeHex = (i) =>
  i > 110000 ? "#818cf8" : i > 80000 ? "#a78bfa" : i > 55000 ? "#c084fc" : i > 40000 ? "#e879f9" : "#f43f5e";

export const povertyHex = (p) =>
  p > 0.28 ? "#ef4444" : p > 0.18 ? "#fb923c" : p > 0.10 ? "#fde047" : "#4ade80";

// Returns the right color based on the active map layer mode
export const wardColor = (wardStats, wardNum, mode) => {
  const s = wardStats[wardNum];
  if (!s) return "#374151";
  if (mode === "income")  return incomeHex(s.medianIncome);
  if (mode === "poverty") return povertyHex(s.povertyRate);
  return riskHex(s.riskScore);
};

export const LEGEND_ITEMS = {
  risk:    [["#4ade80","Low (<25%)"],["#fde047","Medium"],["#fb923c","High"],["#ef4444","Very High"]],
  income:  [["#818cf8",">$110k"],["#a78bfa","$80-110k"],["#c084fc","$55-80k"],["#e879f9","$40-55k"],["#f43f5e","<$40k"]],
  poverty: [["#4ade80","<10%"],["#fde047","10-18%"],["#fb923c","18-28%"],["#ef4444",">28%"]],
};

export const LEGEND_LABELS = {
  risk: "Predicted Risk Score",
  income: "Median Income (ACS B19013)",
  poverty: "Poverty Rate (ACS B17001)",

};

 