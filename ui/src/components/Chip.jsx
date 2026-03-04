import { chipColors } from "../utils/theme";

export default function Chip({ label, color = "gray", theme, isDark }) {
  const colors = isDark ? chipColors.dark : chipColors.light;
  const [bg, fg] = colors[color] ?? colors.gray;
  return (
    <span style={{ background:bg, color:fg, fontSize:10, padding:"3px 9px", borderRadius:99, fontWeight:500 }}>
      {label}
    </span>
  );
}
