// Revenue breakdown for J-League clubs — USD millions (JPY millions / 150).
// Current year = FY2024 season. Prior year = FY2023 season.

export interface JapanRevenueBreakdown {
  sponsorship: number | null;
  admission: number | null;
  broadcast: number | null;   // J-League distribution
  merchandise: number | null;
  academy: number | null;
  women: number | null;
  other: number | null;
}

export interface JapanTransferBreakdown {
  income: number | null;       // Transfer compensation received (USD m)
  expenditure: number | null;  // Transfer fees paid (USD m)
}

export interface JapanClubDeepDive {
  revenue_breakdown: JapanRevenueBreakdown | null;
  revenue_breakdown_prior: JapanRevenueBreakdown | null;
  transfer_breakdown: JapanTransferBreakdown | null;
  // Prior year has no transfer split in the 2023 CSV
}

function j(x: number): number { return Math.round((x / 150) * 100) / 100; }

function tb(income: number, expenditure: number): JapanTransferBreakdown {
  return { income: j(income), expenditure: j(expenditure) };
}

function rb(
  spon: number, adm: number, jl: number, merch: number,
  academy: number, women: number, other: number,
): JapanRevenueBreakdown {
  return { sponsorship: j(spon), admission: j(adm), broadcast: j(jl), merchandise: j(merch), academy: j(academy), women: j(women), other: j(other) };
}

export const japanDeepDive: Record<string, JapanClubDeepDive> = {
  // ─── J1 ──────────────────────────────────────────────────────────────────────
  "sapporo":     { revenue_breakdown: rb(2059,1127,362,540,26,0,229),    revenue_breakdown_prior: rb(1933,775,347,467,26,0,563),    transfer_breakdown: tb(657,346) },
  "kashima":     { revenue_breakdown: rb(2598,1238,480,720,259,0,941),   revenue_breakdown_prior: rb(2418,1201,333,893,259,0,1358),  transfer_breakdown: tb(964,311) },
  "urawa":       { revenue_breakdown: rb(4108,2012,679,1594,69,185,372), revenue_breakdown_prior: rb(4223,2145,473,1583,32,121,1807),transfer_breakdown: tb(1192,784) },
  "kashiwa":     { revenue_breakdown: rb(2845,623,285,7,34,0,206),       revenue_breakdown_prior: rb(3111,413,295,11,22,0,567),      transfer_breakdown: tb(658,732) },
  "fc-tokyo":    { revenue_breakdown: rb(2989,1450,316,768,467,0,370),   revenue_breakdown_prior: rb(2836,1208,316,610,435,0,524),   transfer_breakdown: tb(629,377) },
  "tokyo-verdy": { revenue_breakdown: rb(873,726,308,346,245,438,669),   revenue_breakdown_prior: rb(343,366,128,169,214,343,1255),  transfer_breakdown: tb(78,111) },
  "machida":     { revenue_breakdown: rb(4043,687,320,321,49,0,253),     revenue_breakdown_prior: rb(2656,202,110,149,48,0,244),     transfer_breakdown: tb(81,747) },
  "kawasaki":    { revenue_breakdown: rb(4029,1329,452,1221,256,0,933),  revenue_breakdown_prior: rb(3452,1258,432,951,263,0,1607),  transfer_breakdown: tb(183,1316) },
  "yokohama-fm": { revenue_breakdown: rb(2762,1741,489,1107,0,0,1216),   revenue_breakdown_prior: rb(2222,1499,1076,1244,0,0,1134), transfer_breakdown: tb(18,542) },
  "shonan":      { revenue_breakdown: rb(1310,476,289,194,84,26,177),    revenue_breakdown_prior: rb(1287,523,276,96,62,25,543),     transfer_breakdown: tb(339,199) },
  "niigata":     { revenue_breakdown: rb(1338,1010,338,700,200,0,323),   revenue_breakdown_prior: rb(1233,847,322,630,196,0,431),    transfer_breakdown: tb(153,112) },
  "iwata":       { revenue_breakdown: rb(2849,614,308,469,139,0,277),    revenue_breakdown_prior: rb(2675,530,223,413,150,0,263),    transfer_breakdown: tb(196,343) },
  "nagoya":      { revenue_breakdown: rb(2817,1310,471,824,240,0,564),   revenue_breakdown_prior: rb(2738,1243,352,634,217,0,1119), transfer_breakdown: tb(649,368) },
  "kyoto":       { revenue_breakdown: rb(2151,612,292,138,136,0,185),    revenue_breakdown_prior: rb(1997,599,289,123,135,0,250),    transfer_breakdown: tb(206,281) },
  "gamba-osaka": { revenue_breakdown: rb(2263,1185,357,758,228,0,2254),  revenue_breakdown_prior: rb(2188,970,321,577,213,0,2305),  transfer_breakdown: tb(178,725) },
  "cerezo-osaka":{ revenue_breakdown: rb(2737,1000,319,269,0,311,272),   revenue_breakdown_prior: rb(2741,900,280,225,0,182,540),    transfer_breakdown: tb(493,727) },
  "vissel-kobe": { revenue_breakdown: rb(2439,1309,678,962,259,0,2409),  revenue_breakdown_prior: rb(2409,1320,536,831,256,0,1685), transfer_breakdown: tb(11,465) },
  "hiroshima":   { revenue_breakdown: rb(2719,2004,493,432,107,493,1481),revenue_breakdown_prior: rb(1864,631,315,411,103,311,563), transfer_breakdown: tb(306,566) },
  "fukuoka":     { revenue_breakdown: rb(1025,669,374,273,171,0,364),    revenue_breakdown_prior: rb(936,618,310,265,151,0,594),     transfer_breakdown: tb(177,204) },
  "tosu":        { revenue_breakdown: rb(986,607,273,219,63,0,280),      revenue_breakdown_prior: rb(982,619,303,226,62,0,305),      transfer_breakdown: tb(630,385) },
  // ─── J2 ──────────────────────────────────────────────────────────────────────
  "sendai":      { revenue_breakdown: rb(1591,433,127,23,93,0,209),      revenue_breakdown_prior: rb(1702,375,173,19,71,0,180),      transfer_breakdown: tb(24,141) },
  "akita":       { revenue_breakdown: rb(527,55,108,62,73,0,159),        revenue_breakdown_prior: rb(467,48,109,51,68,0,161),         transfer_breakdown: tb(23,128) },
  "yamagata":    { revenue_breakdown: rb(1053,366,112,257,0,0,776),      revenue_breakdown_prior: rb(940,279,106,203,0,0,972),        transfer_breakdown: tb(48,128) },
  "iwaki":       { revenue_breakdown: rb(502,129,107,173,8,0,325),       revenue_breakdown_prior: rb(488,90,132,116,11,0,240),        transfer_breakdown: tb(164,6) },
  "mito":        { revenue_breakdown: rb(641,136,101,98,41,0,114),       revenue_breakdown_prior: rb(574,109,104,95,23,0,199),        transfer_breakdown: tb(93,14) },
  "tochigi-sc":  { revenue_breakdown: rb(650,163,107,136,95,0,46),       revenue_breakdown_prior: rb(560,154,119,120,88,0,47),        transfer_breakdown: tb(2,4) },
  "gunma":       { revenue_breakdown: rb(480,100,105,109,48,0,104),      revenue_breakdown_prior: rb(350,116,108,82,0,0,134),         transfer_breakdown: tb(61,21) },
  "chiba":       { revenue_breakdown: rb(1713,382,122,276,132,157,141),  revenue_breakdown_prior: rb(1622,302,102,176,133,127,187),   transfer_breakdown: tb(274,241) },
  "yokohama-fc": { revenue_breakdown: rb(1441,327,111,200,260,0,550),    revenue_breakdown_prior: rb(1528,524,287,235,240,0,813),     transfer_breakdown: tb(426,211) },
  "kofu":        { revenue_breakdown: rb(780,313,113,244,20,0,127),      revenue_breakdown_prior: rb(851,338,216,322,21,0,292),       transfer_breakdown: tb(151,142) },
  "shimizu":     { revenue_breakdown: rb(2510,941,135,233,358,0,312),    revenue_breakdown_prior: rb(2910,835,246,220,350,0,540),     transfer_breakdown: tb(514,396) },
  "fujeda":      { revenue_breakdown: rb(449,137,101,66,29,6,66),        revenue_breakdown_prior: rb(414,102,104,60,20,3,102),        transfer_breakdown: tb(53,16) },
  "okayama":     { revenue_breakdown: rb(910,293,126,237,0,0,470),       revenue_breakdown_prior: rb(861,248,117,161,0,0,550),        transfer_breakdown: tb(0,74) },
  "yamaguchi":   { revenue_breakdown: rb(589,150,109,168,43,5,116),      revenue_breakdown_prior: rb(611,125,109,101,40,4,108),       transfer_breakdown: tb(72,8) },
  "tokushima":   { revenue_breakdown: rb(1329,154,108,157,95,0,177),     revenue_breakdown_prior: rb(1347,170,160,107,81,0,227),      transfer_breakdown: tb(711,274) },
  "ehime":       { revenue_breakdown: rb(540,78,102,93,98,92,85),        revenue_breakdown_prior: null,                               transfer_breakdown: tb(31,9) },
  "nagasaki":    { revenue_breakdown: rb(1274,548,131,152,80,0,149),     revenue_breakdown_prior: rb(1240,182,113,202,64,0,310),      transfer_breakdown: tb(18,80) },
  "kumamoto":    { revenue_breakdown: rb(488,169,105,105,0,0,188),       revenue_breakdown_prior: rb(459,155,103,87,0,0,424),         transfer_breakdown: tb(77,84) },
  "oita":        { revenue_breakdown: rb(784,361,114,167,48,0,158),      revenue_breakdown_prior: rb(738,334,166,224,46,0,353),       transfer_breakdown: tb(187,99) },
  "kagoshima":   { revenue_breakdown: rb(491,129,104,172,0,0,183),       revenue_breakdown_prior: rb(397,41,31,126,0,0,164),          transfer_breakdown: tb(51,16) },
  // ─── J3 ──────────────────────────────────────────────────────────────────────
  "hachinohe":   { revenue_breakdown: rb(305,18,24,54,0,0,129),    revenue_breakdown_prior: rb(296,13,21,32,0,0,132),  transfer_breakdown: tb(8,1) },
  "iwate-grulla":{ revenue_breakdown: rb(498,21,23,37,32,0,78),    revenue_breakdown_prior: rb(293,21,81,30,36,0,75),  transfer_breakdown: tb(0,51) },
  "fukushima-utd":{ revenue_breakdown: rb(326,21,23,49,18,0,82),   revenue_breakdown_prior: rb(261,19,20,33,20,0,50),  transfer_breakdown: tb(4,0) },
  "omiya":       { revenue_breakdown: rb(1574,259,30,224,174,293,68),revenue_breakdown_prior: rb(1493,270,112,157,200,313,243), transfer_breakdown: tb(18,50) },
  "ys-yokohama": { revenue_breakdown: rb(132,44,21,10,0,0,19),     revenue_breakdown_prior: rb(121,25,32,9,0,0,36),    transfer_breakdown: tb(25,0) },
  "sagamihara":  { revenue_breakdown: rb(856,43,17,49,84,0,24),    revenue_breakdown_prior: rb(240,45,62,40,73,0,26),  transfer_breakdown: tb(0,0) },
  "matsumoto":   { revenue_breakdown: rb(742,320,34,177,24,0,103), revenue_breakdown_prior: rb(780,276,70,126,24,0,153),transfer_breakdown: tb(32,44) },
  "nagano":      { revenue_breakdown: rb(331,80,22,15,32,190,200), revenue_breakdown_prior: rb(338,69,20,13,43,173,81), transfer_breakdown: tb(5,3) },
  "toyama":      { revenue_breakdown: rb(490,141,25,103,96,0,58),  revenue_breakdown_prior: null,                       transfer_breakdown: tb(5,0) },
  "kanazawa":    { revenue_breakdown: rb(599,170,25,115,67,0,269), revenue_breakdown_prior: rb(360,80,108,84,72,0,167), transfer_breakdown: tb(30,29) },
  "numazu":      { revenue_breakdown: rb(352,53,24,80,39,0,41),    revenue_breakdown_prior: null,                       transfer_breakdown: tb(0,1) },
  "fc-gifu":     { revenue_breakdown: rb(525,107,27,103,89,0,130), revenue_breakdown_prior: null,                       transfer_breakdown: tb(29,0) },
  "fc-osaka":    { revenue_breakdown: rb(499,25,18,16,41,0,35),    revenue_breakdown_prior: rb(404,16,19,12,18,1,89),  transfer_breakdown: tb(25,3) },
  "nara":        { revenue_breakdown: rb(243,44,22,35,79,0,39),    revenue_breakdown_prior: rb(215,38,21,28,58,0,69),  transfer_breakdown: tb(3,10) },
  "tottori":     { revenue_breakdown: rb(220,58,24,40,54,0,121),   revenue_breakdown_prior: null,                       transfer_breakdown: tb(23,3) },
  "kagawa":      { revenue_breakdown: rb(196,35,20,30,48,0,89),    revenue_breakdown_prior: null,                       transfer_breakdown: tb(25,0) },
  "imabari":     { revenue_breakdown: rb(802,83,24,66,40,8,315),   revenue_breakdown_prior: rb(617,34,33,60,35,0,266), transfer_breakdown: tb(15,51) },
  "kitakyushu":  { revenue_breakdown: rb(436,120,23,78,108,0,128), revenue_breakdown_prior: null,                       transfer_breakdown: tb(14,5) },
  "miyazaki":    { revenue_breakdown: rb(345,24,34,33,11,0,63),    revenue_breakdown_prior: rb(209,23,28,13,8,0,63),   transfer_breakdown: tb(0,3) },
  "ryukyu":      { revenue_breakdown: rb(212,61,21,62,124,34,79),  revenue_breakdown_prior: null,                       transfer_breakdown: tb(10,3) },
  "tochigi-city":{ revenue_breakdown: rb(9683,1727,481,1376,1160,525,2070), revenue_breakdown_prior: null,              transfer_breakdown: tb(271,207) },
  "kochi":       { revenue_breakdown: rb(484,86,24,69,58,26,104),  revenue_breakdown_prior: null,                       transfer_breakdown: tb(14,10) },
};
