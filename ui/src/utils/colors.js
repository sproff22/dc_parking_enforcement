// Color scale helpers — used by the map, charts, and detail panel.
// Each function maps a data value to a hex color.


export const riskHex = (s) =>
  s > 0.75 ? "#ef4444" : s > 0.5 ? "#fb923c" : s > 0.25 ? "#fde047" : s > 0.10 ? "#a3e635" : "#4ade80";

export const riskLabel = (s) =>
  s > 0.75 ? "Very High" : s > 0.5 ? "High" : s > 0.25 ? "Moderate" : s > 0.10 ? "Low" : "Very Low";

export const riskGrade = (s) =>
  s > 0.75 ? "F" : s > 0.5 ? "D" : s > 0.25 ? "C" : s > 0.10 ? "B" : "A";

export const gradeHex = (g) =>
  ({ A:"#4ade80", B:"#a3e635", C:"#fde047", D:"#fb923c", F:"#ef4444" })[g] || "#94a3b8";

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
  risk:    [["#4ade80","A (0-10%)"],["#a3e635","B (10-25%)"],["#fde047","C (25-50%)"],["#fb923c","D (50-75%)"],["#ef4444","F (75%+)"]],
  income:  [["#818cf8",">$110k"],["#a78bfa","$80-110k"],["#c084fc","$55-80k"],["#e879f9","$40-55k"],["#f43f5e","<$40k"]],
  poverty: [["#4ade80","<10%"],["#fde047","10-18%"],["#fb923c","18-28%"],["#ef4444",">28%"]],
};

export const LEGEND_LABELS = {
  risk: "Predicted Risk Score",
  income: "Median Income (ACS B19013)",
  poverty: "Poverty Rate (ACS B17001)",

};

 