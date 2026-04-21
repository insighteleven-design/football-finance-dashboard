// J-League financial data — FY2024 season (current) and FY2023 season (prior).
// All source figures in JPY millions; converted to USD at ¥150/$1.
// Net Debt = Total Liabilities − Current Assets (proxy, individual debt not disclosed).

export type JDivision = "j1" | "j2" | "j3";

export interface JapanPriorYear {
  fiscal_year_end: string;
  revenue: number | null;
  wage_bill: number | null;
  wage_ratio: number | null;
  operating_profit: number | null;
  profit_from_player_sales: number | null;
  pre_tax_profit: number | null;
  net_debt: number | null;
}

export interface JapanClub {
  slug: string;
  name: string;
  division: JDivision;
  revenue: number | null;
  wage_bill: number | null;
  wage_ratio: number | null;
  operating_profit: number | null;
  profit_from_player_sales: number | null;
  pre_tax_profit: number | null;
  net_debt: number | null;
  cash: null;
  fiscal_year_end: string;
  data_confidence: "high" | "medium" | "low";
  prior_year: JapanPriorYear | null;
}

// Convert JPY millions to USD millions at ¥150
function j(x: number): number { return Math.round((x / 150) * 100) / 100; }
function jn(x: number | null): number | null { return x === null ? null : j(x); }

// Net debt from balance sheet: Total_Liabilities − Current_Assets
function nd(totLiab: number, currAssets: number): number { return j(totLiab - currAssets); }

// Wage ratio
function wr(wage: number | null, rev: number | null): number | null {
  if (!wage || !rev) return null;
  return Math.round((wage / rev) * 1000) / 10;
}

// ─── J1 clubs ─────────────────────────────────────────────────────────────────

const j1Data: Omit<JapanClub, "slug" | "name" | "division" | "cash">[] = [
  // Sapporo
  {
    revenue: j(5000), wage_bill: j(2176), wage_ratio: wr(2176, 5000),
    operating_profit: j(-342), profit_from_player_sales: j(657 - 346),
    pre_tax_profit: j(-271), net_debt: nd(2212, 1873),
    fiscal_year_end: "2025-01-31", data_confidence: "high",
    prior_year: { fiscal_year_end: "2024-01-31", revenue: j(4111), wage_bill: j(1723), wage_ratio: wr(1723, 4111), operating_profit: j(644), profit_from_player_sales: null, pre_tax_profit: j(-410), net_debt: nd(1887, 1413) },
  },
  // Kashima
  {
    revenue: j(7200), wage_bill: j(2475), wage_ratio: wr(2475, 7200),
    operating_profit: j(76), profit_from_player_sales: j(964 - 311),
    pre_tax_profit: j(38), net_debt: nd(3705, 3419),
    fiscal_year_end: "2025-01-31", data_confidence: "high",
    prior_year: { fiscal_year_end: "2024-01-31", revenue: j(6462), wage_bill: j(2532), wage_ratio: wr(2532, 6462), operating_profit: j(1997), profit_from_player_sales: null, pre_tax_profit: j(-326), net_debt: nd(3378, 3062) },
  },
  // Urawa
  {
    revenue: j(10211), wage_bill: j(3186), wage_ratio: wr(3186, 10211),
    operating_profit: j(329), profit_from_player_sales: j(1192 - 784),
    pre_tax_profit: j(379), net_debt: nd(3181, 2074),
    fiscal_year_end: "2025-01-31", data_confidence: "high",
    prior_year: { fiscal_year_end: "2024-01-31", revenue: j(10384), wage_bill: j(3860), wage_ratio: wr(3860, 10384), operating_profit: j(367), profit_from_player_sales: null, pre_tax_profit: j(392), net_debt: nd(1841, 1405) },
  },
  // Kashiwa
  {
    revenue: j(4658), wage_bill: j(2121), wage_ratio: wr(2121, 4658),
    operating_profit: j(441), profit_from_player_sales: j(658 - 732),
    pre_tax_profit: j(426), net_debt: nd(1604, 347),
    fiscal_year_end: "2025-03-31", data_confidence: "high",
    prior_year: { fiscal_year_end: "2024-03-31", revenue: j(4419), wage_bill: j(2654), wage_ratio: wr(2654, 4419), operating_profit: j(522), profit_from_player_sales: null, pre_tax_profit: j(491), net_debt: nd(1718, 172) },
  },
  // FC Tokyo
  {
    revenue: j(6989), wage_bill: j(2334), wage_ratio: wr(2334, 6989),
    operating_profit: j(96), profit_from_player_sales: j(629 - 377),
    pre_tax_profit: j(90), net_debt: nd(1317, 3109),
    fiscal_year_end: "2025-01-31", data_confidence: "high",
    prior_year: { fiscal_year_end: "2024-01-31", revenue: j(5929), wage_bill: j(2597), wage_ratio: wr(2597, 5929), operating_profit: j(-97), profit_from_player_sales: null, pre_tax_profit: j(-222), net_debt: nd(1003, 3195) },
  },
  // Tokyo Verdy
  {
    revenue: j(3683), wage_bill: j(902), wage_ratio: wr(902, 3683),
    operating_profit: j(60), profit_from_player_sales: j(78 - 111),
    pre_tax_profit: j(34), net_debt: nd(1096, 989),
    fiscal_year_end: "2025-01-31", data_confidence: "high",
    prior_year: { fiscal_year_end: "2024-01-31", revenue: j(2818), wage_bill: j(778), wage_ratio: wr(778, 2818), operating_profit: j(17), profit_from_player_sales: null, pre_tax_profit: j(6), net_debt: nd(1502, 888) },
  },
  // Machida Zelvia
  {
    revenue: j(5754), wage_bill: j(2478), wage_ratio: wr(2478, 5754),
    operating_profit: j(7), profit_from_player_sales: j(81 - 747),
    pre_tax_profit: j(20), net_debt: nd(1651, 993),
    fiscal_year_end: "2025-01-31", data_confidence: "high",
    prior_year: { fiscal_year_end: "2024-01-31", revenue: j(3409), wage_bill: j(1806), wage_ratio: wr(1806, 3409), operating_profit: j(6), profit_from_player_sales: null, pre_tax_profit: j(7), net_debt: nd(1033, 604) },
  },
  // Kawasaki Frontale
  {
    revenue: j(8403), wage_bill: j(2744), wage_ratio: wr(2744, 8403),
    operating_profit: j(-713), profit_from_player_sales: j(183 - 1316),
    pre_tax_profit: j(-712), net_debt: nd(3626, 1795),
    fiscal_year_end: "2025-01-31", data_confidence: "high",
    prior_year: { fiscal_year_end: "2024-01-31", revenue: j(7963), wage_bill: j(3287), wage_ratio: wr(3287, 7963), operating_profit: j(124), profit_from_player_sales: null, pre_tax_profit: j(149), net_debt: nd(3151, 1570) },
  },
  // Yokohama F.Marinos
  {
    revenue: j(7333), wage_bill: j(2366), wage_ratio: wr(2366, 7333),
    operating_profit: j(207), profit_from_player_sales: j(18 - 542),
    pre_tax_profit: j(6), net_debt: nd(2426, 1830),
    fiscal_year_end: "2025-01-31", data_confidence: "high",
    prior_year: { fiscal_year_end: "2024-01-31", revenue: j(6509), wage_bill: j(3042), wage_ratio: wr(3042, 6509), operating_profit: j(-68), profit_from_player_sales: null, pre_tax_profit: j(3), net_debt: nd(2316, 1504) },
  },
  // Shonan Bellmare
  {
    revenue: j(2896), wage_bill: j(1245), wage_ratio: wr(1245, 2896),
    operating_profit: j(-149), profit_from_player_sales: j(339 - 199),
    pre_tax_profit: j(-152), net_debt: nd(1238, 1145),
    fiscal_year_end: "2025-03-31", data_confidence: "high",
    prior_year: { fiscal_year_end: "2024-03-31", revenue: j(2812), wage_bill: j(1255), wage_ratio: wr(1255, 2812), operating_profit: j(26), profit_from_player_sales: null, pre_tax_profit: j(30), net_debt: nd(1230, 1287) },
  },
  // Albirex Niigata
  {
    revenue: j(4062), wage_bill: j(970), wage_ratio: wr(970, 4062),
    operating_profit: j(431), profit_from_player_sales: j(153 - 112),
    pre_tax_profit: j(466), net_debt: nd(1797, 2520),
    fiscal_year_end: "2025-01-31", data_confidence: "high",
    prior_year: { fiscal_year_end: "2024-01-31", revenue: j(3659), wage_bill: j(889), wage_ratio: wr(889, 3659), operating_profit: j(620), profit_from_player_sales: null, pre_tax_profit: j(666), net_debt: nd(1897, 2341) },
  },
  // Júbilo Iwata
  {
    revenue: j(4852), wage_bill: j(1948), wage_ratio: wr(1948, 4852),
    operating_profit: j(-99), profit_from_player_sales: j(196 - 343),
    pre_tax_profit: j(-37), net_debt: nd(1252, 907),
    fiscal_year_end: "2025-01-31", data_confidence: "high",
    prior_year: { fiscal_year_end: "2024-01-31", revenue: j(4254), wage_bill: j(1413), wage_ratio: wr(1413, 4254), operating_profit: j(109), profit_from_player_sales: null, pre_tax_profit: j(124), net_debt: nd(1149, 707) },
  },
  // Nagoya Grampus
  {
    revenue: j(6874), wage_bill: j(2719), wage_ratio: wr(2719, 6874),
    operating_profit: j(49), profit_from_player_sales: j(649 - 368),
    pre_tax_profit: j(205), net_debt: nd(1461, 1397),
    fiscal_year_end: "2025-01-31", data_confidence: "high",
    prior_year: { fiscal_year_end: "2024-01-31", revenue: j(6303), wage_bill: j(2836), wage_ratio: wr(2836, 6303), operating_profit: j(188), profit_from_player_sales: null, pre_tax_profit: j(221), net_debt: nd(1329, 1368) },
  },
  // Kyoto Sanga
  {
    revenue: j(3720), wage_bill: j(1680), wage_ratio: wr(1680, 3720),
    operating_profit: j(44), profit_from_player_sales: j(206 - 281),
    pre_tax_profit: j(99), net_debt: nd(612, 1024),
    fiscal_year_end: "2024-12-31", data_confidence: "high",
    prior_year: { fiscal_year_end: "2024-12-31", revenue: j(3393), wage_bill: j(1838), wage_ratio: wr(1838, 3393), operating_profit: j(82), profit_from_player_sales: null, pre_tax_profit: j(61), net_debt: nd(677, 1058) },
  },
  // Gamba Osaka
  {
    revenue: j(7223), wage_bill: j(2548), wage_ratio: wr(2548, 7223),
    operating_profit: j(221), profit_from_player_sales: j(178 - 725),
    pre_tax_profit: j(75), net_debt: nd(2073, 1053),
    fiscal_year_end: "2025-01-31", data_confidence: "high",
    prior_year: { fiscal_year_end: "2024-01-31", revenue: j(6574), wage_bill: j(2763), wage_ratio: wr(2763, 6574), operating_profit: j(539), profit_from_player_sales: null, pre_tax_profit: j(264), net_debt: nd(1884, 1147) },
  },
  // Cerezo Osaka
  {
    revenue: j(5401), wage_bill: j(1825), wage_ratio: wr(1825, 5401),
    operating_profit: j(276), profit_from_player_sales: j(493 - 727),
    pre_tax_profit: j(311), net_debt: nd(1714, 1847),
    fiscal_year_end: "2025-01-31", data_confidence: "high",
    prior_year: { fiscal_year_end: "2024-01-31", revenue: j(4868), wage_bill: j(2010), wage_ratio: wr(2010, 4868), operating_profit: j(411), profit_from_player_sales: null, pre_tax_profit: j(403), net_debt: nd(1777, 1890) },
  },
  // Vissel Kobe
  {
    revenue: j(8067), wage_bill: j(2810), wage_ratio: wr(2810, 8067),
    operating_profit: j(-148), profit_from_player_sales: j(11 - 465),
    pre_tax_profit: j(35), net_debt: nd(2301, 2111),
    fiscal_year_end: "2024-12-31", data_confidence: "high",
    prior_year: { fiscal_year_end: "2023-12-31", revenue: j(7037), wage_bill: j(3800), wage_ratio: wr(3800, 7037), operating_profit: j(-1226), profit_from_player_sales: null, pre_tax_profit: j(49), net_debt: nd(1849, 1560) },
  },
  // Sanfrecce Hiroshima
  {
    revenue: j(8035), wage_bill: j(2682), wage_ratio: wr(2682, 8035),
    operating_profit: j(573), profit_from_player_sales: j(306 - 566),
    pre_tax_profit: j(563), net_debt: nd(2670, 2851),
    fiscal_year_end: "2025-01-31", data_confidence: "high",
    prior_year: { fiscal_year_end: "2024-01-31", revenue: j(4198), wage_bill: j(2435), wage_ratio: wr(2435, 4198), operating_profit: j(-736), profit_from_player_sales: null, pre_tax_profit: j(-755), net_debt: nd(2556, 2663) },
  },
  // Avispa Fukuoka
  {
    revenue: j(3053), wage_bill: j(1424), wage_ratio: wr(1424, 3053),
    operating_profit: j(16), profit_from_player_sales: j(177 - 204),
    pre_tax_profit: j(14), net_debt: nd(1131, 537),
    fiscal_year_end: "2025-01-31", data_confidence: "high",
    prior_year: { fiscal_year_end: "2024-01-31", revenue: j(2874), wage_bill: j(1611), wage_ratio: wr(1611, 2874), operating_profit: j(-92), profit_from_player_sales: null, pre_tax_profit: j(-89), net_debt: nd(1178, 459) },
  },
  // Sagan Tosu
  {
    revenue: j(3058), wage_bill: j(1081), wage_ratio: wr(1081, 3058),
    operating_profit: j(217), profit_from_player_sales: j(630 - 385),
    pre_tax_profit: j(215), net_debt: nd(1235, 971),
    fiscal_year_end: "2025-01-31", data_confidence: "high",
    prior_year: { fiscal_year_end: "2024-01-31", revenue: j(2497), wage_bill: j(1016), wage_ratio: wr(1016, 2497), operating_profit: j(147), profit_from_player_sales: null, pre_tax_profit: j(158), net_debt: nd(1327, 1020) },
  },
];

const J1_SLUGS: string[] = [
  "sapporo", "kashima", "urawa", "kashiwa", "fc-tokyo", "tokyo-verdy",
  "machida", "kawasaki", "yokohama-fm", "shonan", "niigata", "iwata",
  "nagoya", "kyoto", "gamba-osaka", "cerezo-osaka", "vissel-kobe",
  "hiroshima", "fukuoka", "tosu",
];

const J1_NAMES: string[] = [
  "Consadole Sapporo", "Kashima Antlers", "Urawa Red Diamonds", "Kashiwa Reysol",
  "FC Tokyo", "Tokyo Verdy", "Machida Zelvia", "Kawasaki Frontale",
  "Yokohama F.Marinos", "Shonan Bellmare", "Albirex Niigata", "Júbilo Iwata",
  "Nagoya Grampus", "Kyoto Sanga", "Gamba Osaka", "Cerezo Osaka",
  "Vissel Kobe", "Sanfrecce Hiroshima", "Avispa Fukuoka", "Sagan Tosu",
];

// ─── J2 clubs ─────────────────────────────────────────────────────────────────

const j2Data: Omit<JapanClub, "slug" | "name" | "division" | "cash">[] = [
  // Vegalta Sendai
  { revenue: j(2500), wage_bill: j(734), wage_ratio: wr(734, 2500), operating_profit: j(124), profit_from_player_sales: j(24 - 141), pre_tax_profit: j(124), net_debt: nd(1117, 715), fiscal_year_end: "2025-01-31", data_confidence: "high",
    prior_year: { fiscal_year_end: "2024-01-31", revenue: j(2520), wage_bill: j(1044), wage_ratio: wr(1044, 2520), operating_profit: j(86), profit_from_player_sales: null, pre_tax_profit: j(92), net_debt: nd(1125, 972) } },
  // Blaublitz Akita
  { revenue: j(1007), wage_bill: j(296), wage_ratio: wr(296, 1007), operating_profit: j(-82), profit_from_player_sales: j(23 - 128), pre_tax_profit: j(-54), net_debt: nd(379, 290), fiscal_year_end: "2025-01-31", data_confidence: "high",
    prior_year: { fiscal_year_end: "2024-01-31", revenue: j(904), wage_bill: j(265), wage_ratio: wr(265, 904), operating_profit: j(-18), profit_from_player_sales: null, pre_tax_profit: j(-24), net_debt: nd(239, 236) } },
  // Montedio Yamagata
  { revenue: j(2612), wage_bill: j(725), wage_ratio: wr(725, 2612), operating_profit: j(28), profit_from_player_sales: j(48 - 128), pre_tax_profit: j(40), net_debt: nd(737, 639), fiscal_year_end: "2025-01-31", data_confidence: "high",
    prior_year: { fiscal_year_end: "2024-01-31", revenue: j(2500), wage_bill: j(839), wage_ratio: wr(839, 2500), operating_profit: j(55), profit_from_player_sales: null, pre_tax_profit: j(70), net_debt: nd(763, 731) } },
  // Iwaki FC
  { revenue: j(1408), wage_bill: j(367), wage_ratio: wr(367, 1408), operating_profit: j(-10), profit_from_player_sales: j(164 - 6), pre_tax_profit: j(7), net_debt: nd(523, 426), fiscal_year_end: "2024-12-31", data_confidence: "high",
    prior_year: { fiscal_year_end: "2024-01-31", revenue: j(1077), wage_bill: j(282), wage_ratio: wr(282, 1077), operating_profit: j(-2), profit_from_player_sales: null, pre_tax_profit: j(49), net_debt: nd(471, 387) } },
  // Mito HollyHock
  { revenue: j(1224), wage_bill: j(372), wage_ratio: wr(372, 1224), operating_profit: j(0), profit_from_player_sales: j(93 - 14), pre_tax_profit: j(3), net_debt: nd(457, 544), fiscal_year_end: "2025-01-31", data_confidence: "high",
    prior_year: { fiscal_year_end: "2024-01-31", revenue: j(1104), wage_bill: j(346), wage_ratio: wr(346, 1104), operating_profit: j(5), profit_from_player_sales: null, pre_tax_profit: j(6), net_debt: nd(444, 597) } },
  // Tochigi SC
  { revenue: j(1199), wage_bill: j(339), wage_ratio: wr(339, 1199), operating_profit: j(4), profit_from_player_sales: j(2 - 4), pre_tax_profit: j(5), net_debt: nd(227, 348), fiscal_year_end: "2025-01-31", data_confidence: "high",
    prior_year: { fiscal_year_end: "2024-01-31", revenue: j(1088), wage_bill: j(316), wage_ratio: wr(316, 1088), operating_profit: j(-10), profit_from_player_sales: null, pre_tax_profit: j(-7), net_debt: nd(177, 279) } },
  // Thespakusatsu Gunma
  { revenue: j(1007), wage_bill: j(326), wage_ratio: wr(326, 1007), operating_profit: j(-87), profit_from_player_sales: j(61 - 21), pre_tax_profit: j(-94), net_debt: nd(321, 241), fiscal_year_end: "2025-01-31", data_confidence: "high",
    prior_year: { fiscal_year_end: "2024-01-31", revenue: j(790), wage_bill: j(330), wage_ratio: wr(330, 790), operating_profit: j(-41), profit_from_player_sales: null, pre_tax_profit: j(-24), net_debt: nd(1125, 203) } },
  // Chiba (JEF United)
  { revenue: j(3197), wage_bill: j(889), wage_ratio: wr(889, 3197), operating_profit: j(43), profit_from_player_sales: j(274 - 241), pre_tax_profit: j(24), net_debt: nd(1495, 1249), fiscal_year_end: "2025-01-31", data_confidence: "high",
    prior_year: { fiscal_year_end: "2024-01-31", revenue: j(2649), wage_bill: j(873), wage_ratio: wr(873, 2649), operating_profit: j(-28), profit_from_player_sales: null, pre_tax_profit: j(-54), net_debt: nd(1557, 1259) } },
  // Yokohama FC
  { revenue: j(3314), wage_bill: j(1407), wage_ratio: wr(1407, 3314), operating_profit: j(-124), profit_from_player_sales: j(426 - 211), pre_tax_profit: j(-102), net_debt: nd(788, 827), fiscal_year_end: "2025-01-31", data_confidence: "high",
    prior_year: { fiscal_year_end: "2024-01-31", revenue: j(3627), wage_bill: j(2089), wage_ratio: wr(2089, 3627), operating_profit: j(-346), profit_from_player_sales: null, pre_tax_profit: j(-333), net_debt: nd(1448, 817) } },
  // Ventforet Kofu
  { revenue: j(1748), wage_bill: j(476), wage_ratio: wr(476, 1748), operating_profit: j(1), profit_from_player_sales: j(151 - 142), pre_tax_profit: j(8), net_debt: nd(453, 591), fiscal_year_end: "2025-01-31", data_confidence: "high",
    prior_year: { fiscal_year_end: "2024-01-31", revenue: j(2040), wage_bill: j(748), wage_ratio: wr(748, 2040), operating_profit: j(1), profit_from_player_sales: null, pre_tax_profit: j(13), net_debt: nd(482, 615) } },
  // Shimizu S-Pulse
  { revenue: j(5003), wage_bill: j(2157), wage_ratio: wr(2157, 5003), operating_profit: j(68), profit_from_player_sales: j(514 - 396), pre_tax_profit: j(27), net_debt: nd(1291, 635), fiscal_year_end: "2025-01-31", data_confidence: "high",
    prior_year: { fiscal_year_end: "2024-01-31", revenue: j(5101), wage_bill: j(2246), wage_ratio: wr(2246, 5101), operating_profit: j(520), profit_from_player_sales: null, pre_tax_profit: j(536), net_debt: nd(794, 481) } },
  // Fujeda MYFC (STFC)
  { revenue: j(907), wage_bill: j(270), wage_ratio: wr(270, 907), operating_profit: j(-29), profit_from_player_sales: j(53 - 16), pre_tax_profit: j(-16), net_debt: nd(191, 206), fiscal_year_end: "2025-01-31", data_confidence: "high",
    prior_year: { fiscal_year_end: "2024-01-31", revenue: j(805), wage_bill: j(265), wage_ratio: wr(265, 805), operating_profit: j(109), profit_from_player_sales: null, pre_tax_profit: j(116), net_debt: nd(195, 264) } },
  // Fagiano Okayama
  { revenue: j(2036), wage_bill: j(668), wage_ratio: wr(668, 2036), operating_profit: j(-108), profit_from_player_sales: j(0 - 74), pre_tax_profit: j(-65), net_debt: nd(1482, 1094), fiscal_year_end: "2025-01-31", data_confidence: "high",
    prior_year: { fiscal_year_end: "2024-01-31", revenue: j(1937), wage_bill: j(715), wage_ratio: wr(715, 1937), operating_profit: j(13), profit_from_player_sales: null, pre_tax_profit: j(26), net_debt: nd(1011, 865) } },
  // Renofa Yamaguchi
  { revenue: j(1251), wage_bill: j(447), wage_ratio: wr(447, 1251), operating_profit: j(-29), profit_from_player_sales: j(72 - 8), pre_tax_profit: j(-30), net_debt: nd(190, 364), fiscal_year_end: "2025-01-31", data_confidence: "high",
    prior_year: { fiscal_year_end: "2024-01-31", revenue: j(1098), wage_bill: j(406), wage_ratio: wr(406, 1098), operating_profit: j(53), profit_from_player_sales: null, pre_tax_profit: j(44), net_debt: nd(454, 659) } },
  // Tokushima Vortis
  { revenue: j(2731), wage_bill: j(1010), wage_ratio: wr(1010, 2731), operating_profit: j(191), profit_from_player_sales: j(711 - 274), pre_tax_profit: j(204), net_debt: nd(445, 1326), fiscal_year_end: "2025-01-31", data_confidence: "high",
    prior_year: { fiscal_year_end: "2024-01-31", revenue: j(2092), wage_bill: j(984), wage_ratio: wr(984, 2092), operating_profit: j(-3), profit_from_player_sales: null, pre_tax_profit: j(15), net_debt: nd(1315, 2013) } },
  // Ehime FC
  { revenue: j(1119), wage_bill: j(316), wage_ratio: wr(316, 1119), operating_profit: j(61), profit_from_player_sales: j(31 - 9), pre_tax_profit: j(69), net_debt: nd(152, 324), fiscal_year_end: "2024-12-31", data_confidence: "high",
    prior_year: null },
  // V-Varen Nagasaki
  { revenue: j(2352), wage_bill: j(1519), wage_ratio: wr(1519, 2352), operating_profit: j(-1225), profit_from_player_sales: j(18 - 80), pre_tax_profit: j(8), net_debt: nd(2234, 2148), fiscal_year_end: "2024-12-31", data_confidence: "high",
    prior_year: { fiscal_year_end: "2024-12-31", revenue: j(2111), wage_bill: j(1799), wage_ratio: wr(1799, 2111), operating_profit: j(135), profit_from_player_sales: null, pre_tax_profit: j(138), net_debt: nd(2323, 2218) } },
  // Roasso Kumamoto
  { revenue: j(1133), wage_bill: j(273), wage_ratio: wr(273, 1133), operating_profit: j(128), profit_from_player_sales: j(77 - 84), pre_tax_profit: j(108), net_debt: nd(526, 796), fiscal_year_end: "2025-01-31", data_confidence: "high",
    prior_year: { fiscal_year_end: "2024-01-31", revenue: j(1228), wage_bill: j(326), wage_ratio: wr(326, 1228), operating_profit: j(94), profit_from_player_sales: null, pre_tax_profit: j(8), net_debt: nd(541, 737) } },
  // Oita Trinita
  { revenue: j(1819), wage_bill: j(548), wage_ratio: wr(548, 1819), operating_profit: j(79), profit_from_player_sales: j(187 - 99), pre_tax_profit: j(83), net_debt: nd(406, 523), fiscal_year_end: "2025-01-31", data_confidence: "high",
    prior_year: { fiscal_year_end: "2024-01-31", revenue: j(1861), wage_bill: j(1070), wage_ratio: wr(1070, 1861), operating_profit: j(-48), profit_from_player_sales: null, pre_tax_profit: j(-47), net_debt: nd(455, 472) } },
  // Kagoshima United
  { revenue: j(1130), wage_bill: j(342), wage_ratio: wr(342, 1130), operating_profit: j(-26), profit_from_player_sales: j(51 - 16), pre_tax_profit: j(50), net_debt: nd(260, 309), fiscal_year_end: "2025-01-31", data_confidence: "high",
    prior_year: { fiscal_year_end: "2024-01-31", revenue: j(759), wage_bill: j(232), wage_ratio: wr(232, 759), operating_profit: j(-34), profit_from_player_sales: null, pre_tax_profit: j(-36), net_debt: nd(181, 214) } },
];

const J2_SLUGS: string[] = [
  "sendai", "akita", "yamagata", "iwaki", "mito", "tochigi-sc", "gunma",
  "chiba", "yokohama-fc", "kofu", "shimizu", "fujeda", "okayama",
  "yamaguchi", "tokushima", "ehime", "nagasaki", "kumamoto", "oita", "kagoshima",
];

const J2_NAMES: string[] = [
  "Vegalta Sendai", "Blaublitz Akita", "Montedio Yamagata", "Iwaki FC",
  "Mito HollyHock", "Tochigi SC", "Thespakusatsu Gunma", "JEF United Chiba",
  "Yokohama FC", "Ventforet Kofu", "Shimizu S-Pulse", "Fujeda MYFC",
  "Fagiano Okayama", "Renofa Yamaguchi", "Tokushima Vortis", "Ehime FC",
  "V-Varen Nagasaki", "Roasso Kumamoto", "Oita Trinita", "Kagoshima United",
];

// ─── J3 clubs ─────────────────────────────────────────────────────────────────

const j3Data: Omit<JapanClub, "slug" | "name" | "division" | "cash">[] = [
  // Vanraure Hachinohe
  { revenue: j(538), wage_bill: j(144), wage_ratio: wr(144, 538), operating_profit: j(-20), profit_from_player_sales: j(8 - 1), pre_tax_profit: j(1), net_debt: nd(355, 220), fiscal_year_end: "2025-01-31", data_confidence: "high",
    prior_year: { fiscal_year_end: "2024-01-31", revenue: j(494), wage_bill: j(126), wage_ratio: wr(126, 494), operating_profit: j(-21), profit_from_player_sales: null, pre_tax_profit: j(1), net_debt: nd(356, 211) } },
  // Iwate Grulla Morioka
  { revenue: j(689), wage_bill: j(279), wage_ratio: wr(279, 689), operating_profit: j(-15), profit_from_player_sales: j(0 - 51), pre_tax_profit: j(6), net_debt: nd(56, 126), fiscal_year_end: "2025-01-31", data_confidence: "high",
    prior_year: { fiscal_year_end: "2024-01-31", revenue: j(536), wage_bill: j(255), wage_ratio: wr(255, 536), operating_profit: j(-98), profit_from_player_sales: null, pre_tax_profit: j(-80), net_debt: nd(149, 188) } },
  // Fukushima United
  { revenue: j(523), wage_bill: j(175), wage_ratio: wr(175, 523), operating_profit: j(-158), profit_from_player_sales: j(4 - 0), pre_tax_profit: j(-159), net_debt: nd(162, 194), fiscal_year_end: "2025-01-31", data_confidence: "high",
    prior_year: { fiscal_year_end: "2024-01-31", revenue: j(403), wage_bill: j(157), wage_ratio: wr(157, 403), operating_profit: j(-96), profit_from_player_sales: null, pre_tax_profit: j(-92), net_debt: nd(156, 147) } },
  // Omiya Ardija
  { revenue: j(2640), wage_bill: j(719), wage_ratio: wr(719, 2640), operating_profit: j(-41), profit_from_player_sales: j(18 - 50), pre_tax_profit: j(-40), net_debt: nd(1323, 570), fiscal_year_end: "2025-01-31", data_confidence: "high",
    prior_year: { fiscal_year_end: "2024-01-31", revenue: j(2788), wage_bill: j(792), wage_ratio: wr(792, 2788), operating_profit: j(132), profit_from_player_sales: null, pre_tax_profit: j(131), net_debt: nd(1348, 1053) } },
  // Y.S.C.C. Yokohama
  { revenue: j(251), wage_bill: j(97), wage_ratio: wr(97, 251), operating_profit: j(-23), profit_from_player_sales: j(25 - 0), pre_tax_profit: j(-23), net_debt: nd(130, 43), fiscal_year_end: "2025-01-31", data_confidence: "high",
    prior_year: { fiscal_year_end: "2024-01-31", revenue: j(209), wage_bill: j(113), wage_ratio: wr(113, 209), operating_profit: j(-96), profit_from_player_sales: null, pre_tax_profit: j(-95), net_debt: nd(113, 23) } },
  // SC Sagamihara
  { revenue: j(1074), wage_bill: j(332), wage_ratio: wr(332, 1074), operating_profit: j(72), profit_from_player_sales: j(0 - 0), pre_tax_profit: j(32), net_debt: nd(1123, 621), fiscal_year_end: "2025-01-31", data_confidence: "high",
    prior_year: { fiscal_year_end: "2024-01-31", revenue: j(486), wage_bill: j(265), wage_ratio: wr(265, 486), operating_profit: j(-518), profit_from_player_sales: null, pre_tax_profit: j(-577), net_debt: nd(1077, 547) } },
  // Matsumoto Yamaga FC
  { revenue: j(1432), wage_bill: j(469), wage_ratio: wr(469, 1432), operating_profit: j(-214), profit_from_player_sales: j(32 - 44), pre_tax_profit: j(-190), net_debt: nd(449, 525), fiscal_year_end: "2025-01-31", data_confidence: "high",
    prior_year: { fiscal_year_end: "2024-01-31", revenue: j(1456), wage_bill: j(518), wage_ratio: wr(518, 1456), operating_profit: j(-215), profit_from_player_sales: null, pre_tax_profit: j(-204), net_debt: nd(426, 678) } },
  // Nagano Parceiro
  { revenue: j(874), wage_bill: j(239), wage_ratio: wr(239, 874), operating_profit: j(-118), profit_from_player_sales: j(5 - 3), pre_tax_profit: j(-119), net_debt: nd(194, 225), fiscal_year_end: "2024-12-31", data_confidence: "high",
    prior_year: { fiscal_year_end: "2023-12-31", revenue: j(741), wage_bill: j(177), wage_ratio: wr(177, 741), operating_profit: j(-98), profit_from_player_sales: null, pre_tax_profit: j(-98), net_debt: nd(175, 123) } },
  // Kataller Toyama
  { revenue: j(919), wage_bill: j(228), wage_ratio: wr(228, 919), operating_profit: j(1), profit_from_player_sales: j(5 - 0), pre_tax_profit: j(3), net_debt: nd(117, 162), fiscal_year_end: "2025-01-31", data_confidence: "high",
    prior_year: null },
  //ツエーゲン金沢 (Zweigen Kanazawa)
  { revenue: j(1274), wage_bill: j(378), wage_ratio: wr(378, 1274), operating_profit: j(-78), profit_from_player_sales: j(30 - 29), pre_tax_profit: j(-89), net_debt: nd(416, 355), fiscal_year_end: "2025-01-31", data_confidence: "high",
    prior_year: { fiscal_year_end: "2024-01-31", revenue: j(871), wage_bill: j(359), wage_ratio: wr(359, 871), operating_profit: j(-2), profit_from_player_sales: null, pre_tax_profit: j(3), net_debt: nd(278, 229) } },
  // Azul Claro Numazu
  { revenue: j(589), wage_bill: j(185), wage_ratio: wr(185, 589), operating_profit: j(16), profit_from_player_sales: j(0 - 1), pre_tax_profit: j(17), net_debt: nd(280, 249), fiscal_year_end: "2025-01-31", data_confidence: "high",
    prior_year: null },
  // FC Gifu
  { revenue: j(1010), wage_bill: j(287), wage_ratio: wr(287, 1010), operating_profit: j(28), profit_from_player_sales: j(29 - 0), pre_tax_profit: j(33), net_debt: nd(353, 478), fiscal_year_end: "2025-01-31", data_confidence: "high",
    prior_year: null },
  // FC Osaka
  { revenue: j(659), wage_bill: j(222), wage_ratio: wr(222, 659), operating_profit: j(2), profit_from_player_sales: j(25 - 3), pre_tax_profit: j(1), net_debt: nd(73, 136), fiscal_year_end: "2025-01-31", data_confidence: "high",
    prior_year: { fiscal_year_end: "2024-01-31", revenue: j(559), wage_bill: j(156), wage_ratio: wr(156, 559), operating_profit: j(1), profit_from_player_sales: null, pre_tax_profit: j(1), net_debt: nd(113, 171) } },
  // Nara Club
  { revenue: j(465), wage_bill: j(188), wage_ratio: wr(188, 465), operating_profit: j(-19), profit_from_player_sales: j(3 - 10), pre_tax_profit: j(-13), net_debt: nd(101, 98), fiscal_year_end: "2025-01-31", data_confidence: "high",
    prior_year: { fiscal_year_end: "2024-01-31", revenue: j(429), wage_bill: j(163), wage_ratio: wr(163, 429), operating_profit: j(10), profit_from_player_sales: null, pre_tax_profit: j(16), net_debt: nd(125, 135) } },
  // Gainare Tottori
  { revenue: j(540), wage_bill: j(142), wage_ratio: wr(142, 540), operating_profit: j(11), profit_from_player_sales: j(23 - 3), pre_tax_profit: j(-78), net_debt: nd(591, 63), fiscal_year_end: "2025-01-31", data_confidence: "high",
    prior_year: null },
  // Kagawa Olive Giken
  { revenue: j(443), wage_bill: j(173), wage_ratio: wr(173, 443), operating_profit: j(-162), profit_from_player_sales: j(25 - 0), pre_tax_profit: j(-78), net_debt: nd(376, 209), fiscal_year_end: "2025-01-31", data_confidence: "high",
    prior_year: null },
  // FC Imabari
  { revenue: j(1353), wage_bill: j(399), wage_ratio: wr(399, 1353), operating_profit: j(-191), profit_from_player_sales: j(15 - 51), pre_tax_profit: j(-172), net_debt: nd(600, 603), fiscal_year_end: "2025-01-31", data_confidence: "high",
    prior_year: { fiscal_year_end: "2024-01-31", revenue: j(1045), wage_bill: j(304), wage_ratio: wr(304, 1045), operating_profit: j(-43), profit_from_player_sales: null, pre_tax_profit: j(10), net_debt: nd(590, 939) } },
  // Giravanz Kitakyushu
  { revenue: j(907), wage_bill: j(235), wage_ratio: wr(235, 907), operating_profit: j(-37), profit_from_player_sales: j(14 - 5), pre_tax_profit: j(-38), net_debt: nd(280, 200), fiscal_year_end: "2025-01-31", data_confidence: "high",
    prior_year: null },
  // Tegevajaro Miyazaki
  { revenue: j(510), wage_bill: j(197), wage_ratio: wr(197, 510), operating_profit: j(-54), profit_from_player_sales: j(0 - 3), pre_tax_profit: j(-53), net_debt: nd(35, 60), fiscal_year_end: "2025-01-31", data_confidence: "high",
    prior_year: { fiscal_year_end: "2024-01-31", revenue: j(325), wage_bill: j(101), wage_ratio: wr(101, 325), operating_profit: j(7), profit_from_player_sales: null, pre_tax_profit: j(8), net_debt: nd(32, 269) } },
  // FC Ryukyu
  { revenue: j(603), wage_bill: j(221), wage_ratio: wr(221, 603), operating_profit: j(-333), profit_from_player_sales: j(10 - 3), pre_tax_profit: j(-341), net_debt: nd(401, 726), fiscal_year_end: "2025-01-31", data_confidence: "high",
    prior_year: null },
  // Tochigi City FC
  { revenue: j(17293), wage_bill: j(5309), wage_ratio: wr(5309, 17293), operating_profit: j(-1334), profit_from_player_sales: j(271 - 207), pre_tax_profit: j(-1219), net_debt: nd(46, 55), fiscal_year_end: "2025-01-31", data_confidence: "medium",
    prior_year: null },
  // Kochi United SC
  { revenue: j(865), wage_bill: j(265), wage_ratio: wr(265, 865), operating_profit: j(-67), profit_from_player_sales: j(14 - 10), pre_tax_profit: j(-61), net_debt: nd(119, 19), fiscal_year_end: "2025-01-31", data_confidence: "high",
    prior_year: null },
];

const J3_SLUGS: string[] = [
  "hachinohe", "iwate-grulla", "fukushima-utd", "omiya", "ys-yokohama",
  "sagamihara", "matsumoto", "nagano", "toyama", "kanazawa",
  "numazu", "fc-gifu", "fc-osaka", "nara", "tottori",
  "kagawa", "imabari", "kitakyushu", "miyazaki", "ryukyu",
  "tochigi-city", "kochi",
];

const J3_NAMES: string[] = [
  "Vanraure Hachinohe", "Iwate Grulla Morioka", "Fukushima United", "Omiya Ardija",
  "Y.S.C.C. Yokohama", "SC Sagamihara", "Matsumoto Yamaga FC", "Nagano Parceiro",
  "Kataller Toyama", "Zweigen Kanazawa", "Azul Claro Numazu", "FC Gifu",
  "FC Osaka", "Nara Club", "Gainare Tottori", "Kagawa Olive Giken",
  "FC Imabari", "Giravanz Kitakyushu", "Tegevajaro Miyazaki", "FC Ryukyu",
  "Tochigi City FC", "Kochi United SC",
];

// ─── Assembled export ─────────────────────────────────────────────────────────

function buildClubs(
  data: Omit<JapanClub, "slug" | "name" | "division" | "cash">[],
  slugs: string[],
  names: string[],
  division: JDivision,
): JapanClub[] {
  return data.map((d, i) => ({
    slug: slugs[i],
    name: names[i],
    division,
    cash: null,
    ...d,
  }));
}

export const japanClubs: JapanClub[] = [
  ...buildClubs(j1Data, J1_SLUGS, J1_NAMES, "j1"),
  ...buildClubs(j2Data, J2_SLUGS, J2_NAMES, "j2"),
  ...buildClubs(j3Data, J3_SLUGS, J3_NAMES, "j3"),
];

export function getJapanClub(slug: string): JapanClub | undefined {
  return japanClubs.find((c) => c.slug === slug);
}

export function fmtJpy(value: number | null, isRatio = false): string {
  if (value === null || value === undefined) return "—";
  if (isRatio) return `${value.toFixed(1)}%`;
  const abs = Math.abs(value);
  return `${value < 0 ? "-" : ""}$${abs.toFixed(1)}m`;
}

export const J_DIVISION_LABELS: Record<JDivision, string> = {
  "j1": "J1 League",
  "j2": "J2 League",
  "j3": "J3 League",
};

export const JAPAN_LEAGUES: { key: JDivision; label: string }[] = [
  { key: "j1", label: "J1 League" },
  { key: "j2", label: "J2 League" },
  { key: "j3", label: "J3 League" },
];
