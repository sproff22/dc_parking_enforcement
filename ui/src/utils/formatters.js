export const fmt  = (n) => n?.toLocaleString() ?? "-";
export const pct  = (n) => `${(n * 100).toFixed(1)}%`;
export const usdK = (n) => `$${(n / 1000).toFixed(0)}k`;
export const usdM = (n) => `$${(n / 1000000).toFixed(2)}M`;