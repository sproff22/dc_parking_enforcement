import RAW from "./wardFilterData.json";

export const VIOLATION_TYPES = RAW.violationTypes;
export const TIME_RANGES     = RAW.timeRanges;
export const SEASONS         = RAW.seasons;
export const DAYS_OF_WEEK    = RAW.daysOfWeek;

export const DEFAULT_FILTERS = {
  ward: null,
  violation: "All Types",
  timeRange: "All Hours",
  season: "All Seasons",
  dayOfWeek: "All Days",
  colorMode: "risk",
  minRisk: 0,
};

/**
 * Given active filters, return a WARD_STATS object keyed by ward number.
 * Breakdown keys are "violation|timeBand|season|dayOfWeek".
 */
export function getFilteredStats(filters = DEFAULT_FILTERS) {
  const { violation, timeRange, season, dayOfWeek } = filters;
  const byViolation = violation && violation !== "All Types";
  const byTime      = timeRange && timeRange !== "All Hours";
  const bySeason    = season && season !== "All Seasons";
  const byDay       = dayOfWeek && dayOfWeek !== "All Days";

  const stats = {};
  for (const [wn, ward] of Object.entries(RAW.wards)) {
    let citations = 0;
    let fineRevenue = 0;
    const violCounts = {};

    for (const [key, val] of Object.entries(ward.breakdown)) {
      const [viol, tb, seas, dow] = key.split("|");
      if (byViolation && viol !== violation) continue;
      if (byTime && tb !== timeRange) continue;
      if (bySeason && seas !== season) continue;
      if (byDay && dow !== dayOfWeek) continue;
      citations += val.c;
      fineRevenue += val.f;
      violCounts[viol] = (violCounts[viol] || 0) + val.c;
    }

    // Determine top violation from filtered data
    let topViolation = "";
    let topCount = 0;
    for (const [v, c] of Object.entries(violCounts)) {
      if (c > topCount) { topCount = c; topViolation = v; }
    }

    stats[parseInt(wn)] = {
      citations,
      riskScore: 0, // placeholder — normalized below
      medianIncome: ward.medianIncome,
      povertyRate: ward.povertyRate,
      vehicleOwnership: ward.vehicleOwnership,
      blackShare: ward.blackShare,
      whiteShare: ward.whiteShare,
      hispanicShare: ward.hispanicShare,
      asianShare: ward.asianShare,
      fineRevenue: Math.round(fineRevenue),
      avgFine: citations > 0 ? Math.round(fineRevenue / citations) : 0,
      topViolation,
    };
  }

  // Normalize risk scores relative to the filtered max, scaled so
  // the highest ward tops out ~95% (avoids implying 100% = certain ticket)
  const filteredMax = Math.max(...Object.values(stats).map(s => s.citations));
  for (const s of Object.values(stats)) {
    s.riskScore = filteredMax > 0 ? (s.citations / filteredMax) * 0.95 : 0;
  }

  return stats;
}

/* Unfiltered stats for backwards compat */
export const WARD_STATS = getFilteredStats();

/* Build hourly citation array from all wards combined, respecting optional ward list */
const HOUR_LABELS = ["12a","1a","2a","3a","4a","5a","6a","7a","8a","9a","10a","11a",
                     "12p","1p","2p","3p","4p","5p","6p","7p","8p","9p","10p","11p"];

export function getHourlyCitations(wardList) {
  const wards = wardList || [1,2,3,4,5,6,7,8];
  const totals = new Array(24).fill(0);
  for (const w of wards) {
    const hourly = RAW.wards[String(w)]?.hourly || {};
    for (const [h, n] of Object.entries(hourly)) {
      totals[parseInt(h)] += n;
    }
  }
  return totals.map((n, i) => ({ hour: HOUR_LABELS[i], n }));
}

export const HOURLY_CITATIONS = getHourlyCitations();

/* Top 5 violation types across selected wards, respecting current filteredStats */
export function getTopViolations(wardList, filteredStats) {
  const wards = wardList || [1,2,3,4,5,6,7,8];
  const counts = {};
  for (const w of wards) {
    const ward = RAW.wards[String(w)];
    if (!ward) continue;
    for (const [key, val] of Object.entries(ward.breakdown)) {
      const viol = key.split("|")[0];
      counts[viol] = (counts[viol] || 0) + val.c;
    }
  }
  return Object.entries(counts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([name, count]) => ({
      name: name.length > 18 ? name.slice(0, 16) + "…" : name,
      count,
    }));
}