export const WARD_STATS = {
  1: { citations:14823, riskScore:0.83, medianIncome:60200,  povertyRate:0.149, vehicleOwnership:0.48, fineRevenue:1230450, topViolation:"STREET CLEANING",  topAgency:"DPW",  avgFine:83  },
  2: { citations:19441, riskScore:0.91, medianIncome:94800,  povertyRate:0.062, vehicleOwnership:0.39, fineRevenue:1987300, topViolation:"NO PARKING",       topAgency:"DDOT", avgFine:102 },
  3: { citations:5820,  riskScore:0.31, medianIncome:128500, povertyRate:0.033, vehicleOwnership:0.77, fineRevenue:612100,  topViolation:"EXPIRED METER",    topAgency:"DPW",  avgFine:105 },
  4: { citations:11034, riskScore:0.57, medianIncome:67300,  povertyRate:0.128, vehicleOwnership:0.61, fineRevenue:943200,  topViolation:"DOUBLE PARKING",   topAgency:"MPD",  avgFine:85  },
  5: { citations:8912,  riskScore:0.46, medianIncome:55900,  povertyRate:0.172, vehicleOwnership:0.58, fineRevenue:771400,  topViolation:"FIRE HYDRANT",     topAgency:"DPW",  avgFine:86  },
  6: { citations:13267, riskScore:0.72, medianIncome:96100,  povertyRate:0.083, vehicleOwnership:0.46, fineRevenue:1344600, topViolation:"EXPIRED METER",    topAgency:"DDOT", avgFine:101 },
  7: { citations:6234,  riskScore:0.35, medianIncome:39800,  povertyRate:0.291, vehicleOwnership:0.62, fineRevenue:501800,  topViolation:"DOUBLE PARKING",   topAgency:"MPD",  avgFine:80  },
  8: { citations:5341,  riskScore:0.30, medianIncome:35100,  povertyRate:0.338, vehicleOwnership:0.59, fineRevenue:432900,  topViolation:"FIRE HYDRANT",     topAgency:"DPW",  avgFine:81  },
};

// From ISSUE_TIME field — bucketed by hour
export const HOURLY_CITATIONS = [
  { hour:"12a",n:312  }, { hour:"2a",n:198  }, { hour:"4a", n:143  },
  { hour:"6a", n:621  }, { hour:"8a",n:3841 }, { hour:"10a",n:5203 },
  { hour:"12p",n:4890 }, { hour:"2p",n:4412 }, { hour:"4p", n:5931 },
  { hour:"6p", n:3102 }, { hour:"8p",n:1843 }, { hour:"10p",n:876  },
];

export const VIOLATION_TYPES = [
  "All Types","EXPIRED METER","NO PARKING",
  "STREET CLEANING","FIRE HYDRANT","DOUBLE PARKING","NO STANDING"
];

export const TIME_RANGES = [
  "All Hours","12am-6am","6am-12pm","12pm-6pm","6pm-12am"
];

export const DEFAULT_FILTERS = {
  ward: null,
  violation: "All Types",
  timeRange: "All Hours",
  colorMode: "risk",
  minRisk: 0,
};