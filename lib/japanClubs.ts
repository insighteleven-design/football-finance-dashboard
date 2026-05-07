// J-League financial data — FY2024/25 season (current), FY2023 (prior), and historical back to FY2020.
// All source figures in JPY millions; converted to USD at ¥150/$1.
// Net Debt = Total Liabilities − Current Assets (proxy, individual debt not disclosed).
// division reflects the 2025 J-League season. league_2026_27 reflects promotion/relegation from 2025.

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
  league_2026_27: JDivision | null;
  league_notes: string | null;
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
  prior_years: JapanPriorYear[];
}

// Convert JPY millions to USD millions at ¥150
function j(x: number): number { return Math.round((x / 150) * 100) / 100; }

// Net debt from balance sheet: Total_Liabilities − Current_Assets
function nd(totLiab: number, currAssets: number): number { return j(totLiab - currAssets); }

// Wage ratio
function wr(wage: number | null, rev: number | null): number | null {
  if (!wage || !rev) return null;
  return Math.round((wage / rev) * 1000) / 10;
}

// ─── J1 clubs (2025 season) ───────────────────────────────────────────────────

const j1Data: Omit<JapanClub, "slug" | "name" | "division" | "cash">[] = [
  // Kashima Antlers
  {
    revenue: j(7200), wage_bill: j(2475), wage_ratio: wr(2475, 7200),
    operating_profit: j(76), profit_from_player_sales: j(964 - 311),
    pre_tax_profit: j(38), net_debt: nd(3705, 3419),
    fiscal_year_end: "2025-01-31", data_confidence: "high",
    league_2026_27: "j1", league_notes: null,
    prior_years: [
      { fiscal_year_end: "2024-01-31", revenue: j(6462), wage_bill: j(2532), wage_ratio: wr(2532, 6462), operating_profit: j(1997), profit_from_player_sales: null, pre_tax_profit: j(-326), net_debt: nd(3378, 3062) },
      { fiscal_year_end: "2023-01-31", revenue: 40.77, wage_bill: 19.99, wage_ratio: 49.0, operating_profit: -5.44, profit_from_player_sales: null, pre_tax_profit: -4.51, net_debt: 0.67 },
      { fiscal_year_end: "2022-01-31", revenue: 44.02, wage_bill: 19.12, wage_ratio: 43.4, operating_profit: 0.39, profit_from_player_sales: null, pre_tax_profit: 0.05, net_debt: 6.2 },
      { fiscal_year_end: "2021-01-31", revenue: 31.98, wage_bill: 17.0, wage_ratio: 53.2, operating_profit: -6.33, profit_from_player_sales: null, pre_tax_profit: -6.3, net_debt: 4.59 },
    ],
  },
  // Urawa Red Diamonds
  {
    revenue: j(10211), wage_bill: j(3186), wage_ratio: wr(3186, 10211),
    operating_profit: j(329), profit_from_player_sales: j(1192 - 784),
    pre_tax_profit: j(379), net_debt: nd(3181, 2074),
    fiscal_year_end: "2025-01-31", data_confidence: "high",
    league_2026_27: "j1", league_notes: null,
    prior_years: [
      { fiscal_year_end: "2024-01-31", revenue: j(10384), wage_bill: j(3860), wage_ratio: wr(3860, 10384), operating_profit: j(367), profit_from_player_sales: null, pre_tax_profit: j(392), net_debt: nd(1841, 1405) },
      { fiscal_year_end: "2023-01-31", revenue: 54.18, wage_bill: 19.02, wage_ratio: 35.1, operating_profit: 2.85, profit_from_player_sales: null, pre_tax_profit: 3.28, net_debt: 6.75 },
      { fiscal_year_end: "2022-01-31", revenue: 45.94, wage_bill: 20.59, wage_ratio: 44.8, operating_profit: -0.66, profit_from_player_sales: null, pre_tax_profit: 0.02, net_debt: 8.75 },
      { fiscal_year_end: "2021-01-31", revenue: 38.47, wage_bill: 20.79, wage_ratio: 54.0, operating_profit: -5.12, profit_from_player_sales: null, pre_tax_profit: -4.07, net_debt: 8.27 },
    ],
  },
  // Kashiwa Reysol
  {
    revenue: j(4658), wage_bill: j(2121), wage_ratio: wr(2121, 4658),
    operating_profit: j(441), profit_from_player_sales: j(658 - 732),
    pre_tax_profit: j(426), net_debt: nd(1604, 347),
    fiscal_year_end: "2025-03-31", data_confidence: "high",
    league_2026_27: "j1", league_notes: null,
    prior_years: [
      { fiscal_year_end: "2024-03-31", revenue: j(4419), wage_bill: j(2654), wage_ratio: wr(2654, 4419), operating_profit: j(522), profit_from_player_sales: null, pre_tax_profit: j(491), net_debt: nd(1718, 172) },
      { fiscal_year_end: "2023-03-31", revenue: 30.88, wage_bill: 21.25, wage_ratio: 68.8, operating_profit: 0.78, profit_from_player_sales: null, pre_tax_profit: 0.69, net_debt: 14.31 },
      { fiscal_year_end: "2022-03-31", revenue: 26.04, wage_bill: 20.7, wage_ratio: 79.5, operating_profit: -2.46, profit_from_player_sales: null, pre_tax_profit: -2.66, net_debt: 15.46 },
      { fiscal_year_end: "2021-03-31", revenue: 30.75, wage_bill: 19.19, wage_ratio: 62.4, operating_profit: -0.01, profit_from_player_sales: null, pre_tax_profit: 0.15, net_debt: 14.83 },
    ],
  },
  // FC Tokyo
  {
    revenue: j(6989), wage_bill: j(2334), wage_ratio: wr(2334, 6989),
    operating_profit: j(96), profit_from_player_sales: j(629 - 377),
    pre_tax_profit: j(90), net_debt: nd(1317, 3109),
    fiscal_year_end: "2025-01-31", data_confidence: "high",
    league_2026_27: "j1", league_notes: null,
    prior_years: [
      { fiscal_year_end: "2024-01-31", revenue: j(5929), wage_bill: j(2597), wage_ratio: wr(2597, 5929), operating_profit: j(-97), profit_from_player_sales: null, pre_tax_profit: j(-222), net_debt: nd(1003, 3195) },
      { fiscal_year_end: "2023-01-31", revenue: 35.16, wage_bill: 16.92, wage_ratio: 48.1, operating_profit: -0.58, profit_from_player_sales: null, pre_tax_profit: -1.17, net_debt: -16.13 },
      { fiscal_year_end: "2022-01-31", revenue: 31.81, wage_bill: 18.08, wage_ratio: 56.8, operating_profit: -1.51, profit_from_player_sales: null, pre_tax_profit: -3.19, net_debt: -9.67 },
      { fiscal_year_end: "2021-01-31", revenue: 30.59, wage_bill: 20.23, wage_ratio: 66.1, operating_profit: -2.79, profit_from_player_sales: null, pre_tax_profit: -2.12, net_debt: -10.75 },
    ],
  },
  // Tokyo Verdy
  {
    revenue: j(3683), wage_bill: j(902), wage_ratio: wr(902, 3683),
    operating_profit: j(60), profit_from_player_sales: j(78 - 111),
    pre_tax_profit: j(34), net_debt: nd(1096, 989),
    fiscal_year_end: "2025-01-31", data_confidence: "high",
    league_2026_27: "j1", league_notes: null,
    prior_years: [
      { fiscal_year_end: "2024-01-31", revenue: j(2818), wage_bill: j(778), wage_ratio: wr(778, 2818), operating_profit: j(17), profit_from_player_sales: null, pre_tax_profit: j(6), net_debt: nd(1502, 888) },
      { fiscal_year_end: "2023-01-31", revenue: 14.11, wage_bill: 3.27, wage_ratio: 23.2, operating_profit: 0.09, profit_from_player_sales: null, pre_tax_profit: 0.12, net_debt: 3.99 },
      { fiscal_year_end: "2022-01-31", revenue: 11.7, wage_bill: 4.52, wage_ratio: 38.6, operating_profit: -0.7, profit_from_player_sales: null, pre_tax_profit: -0.7, net_debt: 4.28 },
      { fiscal_year_end: "2021-01-31", revenue: 9.95, wage_bill: 4.4, wage_ratio: 44.2, operating_profit: -3.41, profit_from_player_sales: null, pre_tax_profit: -3.51, net_debt: 3.13 },
    ],
  },
  // Machida Zelvia
  {
    revenue: j(5754), wage_bill: j(2478), wage_ratio: wr(2478, 5754),
    operating_profit: j(7), profit_from_player_sales: j(81 - 747),
    pre_tax_profit: j(20), net_debt: nd(1651, 993),
    fiscal_year_end: "2025-01-31", data_confidence: "high",
    league_2026_27: "j1", league_notes: null,
    prior_years: [
      { fiscal_year_end: "2024-01-31", revenue: j(3409), wage_bill: j(1806), wage_ratio: wr(1806, 3409), operating_profit: j(6), profit_from_player_sales: null, pre_tax_profit: j(7), net_debt: nd(1033, 604) },
      { fiscal_year_end: "2023-01-31", revenue: 12.79, wage_bill: 4.96, wage_ratio: 38.8, operating_profit: 0.27, profit_from_player_sales: null, pre_tax_profit: 0.02, net_debt: -0.84 },
      { fiscal_year_end: "2022-01-31", revenue: 9.95, wage_bill: 4.37, wage_ratio: 43.9, operating_profit: -0.01, profit_from_player_sales: null, pre_tax_profit: 0.03, net_debt: -0.4 },
      { fiscal_year_end: "2021-01-31", revenue: 8.35, wage_bill: 3.31, wage_ratio: 39.7, operating_profit: 0.01, profit_from_player_sales: null, pre_tax_profit: 0.05, net_debt: -4.18 },
    ],
  },
  // Kawasaki Frontale
  {
    revenue: j(8403), wage_bill: j(2744), wage_ratio: wr(2744, 8403),
    operating_profit: j(-713), profit_from_player_sales: j(183 - 1316),
    pre_tax_profit: j(-712), net_debt: nd(3626, 1795),
    fiscal_year_end: "2025-01-31", data_confidence: "high",
    league_2026_27: "j1", league_notes: null,
    prior_years: [
      { fiscal_year_end: "2024-01-31", revenue: j(7963), wage_bill: j(3287), wage_ratio: wr(3287, 7963), operating_profit: j(124), profit_from_player_sales: null, pre_tax_profit: j(149), net_debt: nd(3151, 1570) },
      { fiscal_year_end: "2023-01-31", revenue: 46.53, wage_bill: 20.12, wage_ratio: 43.2, operating_profit: 1.45, profit_from_player_sales: null, pre_tax_profit: 1.72, net_debt: 3.55 },
      { fiscal_year_end: "2022-01-31", revenue: 46.55, wage_bill: 24.2, wage_ratio: 52.0, operating_profit: 3.71, profit_from_player_sales: null, pre_tax_profit: 3.97, net_debt: -2.7 },
      { fiscal_year_end: "2021-01-31", revenue: 36.3, wage_bill: 20.24, wage_ratio: 55.8, operating_profit: -1.45, profit_from_player_sales: null, pre_tax_profit: -1.09, net_debt: 0.19 },
    ],
  },
  // Yokohama F.Marinos
  {
    revenue: j(7333), wage_bill: j(2366), wage_ratio: wr(2366, 7333),
    operating_profit: j(207), profit_from_player_sales: j(18 - 542),
    pre_tax_profit: j(6), net_debt: nd(2426, 1830),
    fiscal_year_end: "2025-01-31", data_confidence: "high",
    league_2026_27: "j1", league_notes: null,
    prior_years: [
      { fiscal_year_end: "2024-01-31", revenue: j(6509), wage_bill: j(3042), wage_ratio: wr(3042, 6509), operating_profit: j(-68), profit_from_player_sales: null, pre_tax_profit: j(3), net_debt: nd(2316, 1504) },
      { fiscal_year_end: "2023-01-31", revenue: 43.21, wage_bill: 22.77, wage_ratio: 52.7, operating_profit: 0.07, profit_from_player_sales: null, pre_tax_profit: 0.05, net_debt: 7.38 },
      { fiscal_year_end: "2022-01-31", revenue: 34.85, wage_bill: 16.94, wage_ratio: 48.6, operating_profit: -0.09, profit_from_player_sales: null, pre_tax_profit: 0.02, net_debt: 4.33 },
      { fiscal_year_end: "2021-01-31", revenue: 39.09, wage_bill: 19.75, wage_ratio: 50.5, operating_profit: -0.43, profit_from_player_sales: null, pre_tax_profit: 0.02, net_debt: 4.6 },
    ],
  },
  // Shonan Bellmare
  {
    revenue: j(2896), wage_bill: j(1245), wage_ratio: wr(1245, 2896),
    operating_profit: j(-149), profit_from_player_sales: j(339 - 199),
    pre_tax_profit: j(-152), net_debt: nd(1238, 1145),
    fiscal_year_end: "2025-03-31", data_confidence: "high",
    league_2026_27: "j2", league_notes: "Relegated from J1",
    prior_years: [
      { fiscal_year_end: "2024-03-31", revenue: j(2812), wage_bill: j(1255), wage_ratio: wr(1255, 2812), operating_profit: j(26), profit_from_player_sales: null, pre_tax_profit: j(30), net_debt: nd(1230, 1287) },
      { fiscal_year_end: "2023-03-31", revenue: 16.51, wage_bill: 7.94, wage_ratio: 48.1, operating_profit: 0.1, profit_from_player_sales: null, pre_tax_profit: 0.11, net_debt: -0.25 },
      { fiscal_year_end: "2022-03-31", revenue: 14.52, wage_bill: 8.62, wage_ratio: 59.4, operating_profit: -0.89, profit_from_player_sales: null, pre_tax_profit: 0.02, net_debt: 0.07 },
      { fiscal_year_end: "2021-03-31", revenue: 14.59, wage_bill: 7.47, wage_ratio: 51.2, operating_profit: -0.96, profit_from_player_sales: null, pre_tax_profit: 0.07, net_debt: -0.2 },
    ],
  },
  // Albirex Niigata
  {
    revenue: j(4062), wage_bill: j(970), wage_ratio: wr(970, 4062),
    operating_profit: j(431), profit_from_player_sales: j(153 - 112),
    pre_tax_profit: j(466), net_debt: nd(1797, 2520),
    fiscal_year_end: "2025-01-31", data_confidence: "high",
    league_2026_27: "j2", league_notes: "Relegated from J1",
    prior_years: [
      { fiscal_year_end: "2024-01-31", revenue: j(3659), wage_bill: j(889), wage_ratio: wr(889, 3659), operating_profit: j(620), profit_from_player_sales: null, pre_tax_profit: j(666), net_debt: nd(1897, 2341) },
      { fiscal_year_end: "2023-01-31", revenue: 16.93, wage_bill: 5.04, wage_ratio: 29.8, operating_profit: -0.03, profit_from_player_sales: null, pre_tax_profit: 1.21, net_debt: -0.61 },
      { fiscal_year_end: "2021-12-31", revenue: 14.72, wage_bill: 4.61, wage_ratio: 31.3, operating_profit: 0.52, profit_from_player_sales: null, pre_tax_profit: 2.67, net_debt: -0.79 },
    ],
  },
  // Nagoya Grampus
  {
    revenue: j(6874), wage_bill: j(2719), wage_ratio: wr(2719, 6874),
    operating_profit: j(49), profit_from_player_sales: j(649 - 368),
    pre_tax_profit: j(205), net_debt: nd(1461, 1397),
    fiscal_year_end: "2025-01-31", data_confidence: "high",
    league_2026_27: "j1", league_notes: null,
    prior_years: [
      { fiscal_year_end: "2024-01-31", revenue: j(6303), wage_bill: j(2836), wage_ratio: wr(2836, 6303), operating_profit: j(188), profit_from_player_sales: null, pre_tax_profit: j(221), net_debt: nd(1329, 1368) },
      { fiscal_year_end: "2023-01-31", revenue: 40.61, wage_bill: 18.78, wage_ratio: 46.2, operating_profit: 1.17, profit_from_player_sales: null, pre_tax_profit: 5.21, net_debt: -1.49 },
      { fiscal_year_end: "2022-01-31", revenue: 41.15, wage_bill: 20.59, wage_ratio: 50.0, operating_profit: 1.64, profit_from_player_sales: null, pre_tax_profit: 0.55, net_debt: 5.35 },
      { fiscal_year_end: "2021-01-31", revenue: 34.91, wage_bill: 23.5, wage_ratio: 67.3, operating_profit: -4.29, profit_from_player_sales: null, pre_tax_profit: -3.53, net_debt: 3.51 },
    ],
  },
  // Kyoto Sanga
  {
    revenue: j(3720), wage_bill: j(1680), wage_ratio: wr(1680, 3720),
    operating_profit: j(44), profit_from_player_sales: j(206 - 281),
    pre_tax_profit: j(99), net_debt: nd(612, 1024),
    fiscal_year_end: "2024-12-31", data_confidence: "high",
    league_2026_27: "j1", league_notes: null,
    prior_years: [
      { fiscal_year_end: "2023-12-31", revenue: j(3393), wage_bill: j(1838), wage_ratio: wr(1838, 3393), operating_profit: j(82), profit_from_player_sales: null, pre_tax_profit: j(61), net_debt: nd(677, 1058) },
      { fiscal_year_end: "2021-12-31", revenue: 14.73, wage_bill: 7.53, wage_ratio: 51.2, operating_profit: 0.78, profit_from_player_sales: null, pre_tax_profit: 0.88, net_debt: -2.47 },
    ],
  },
  // Gamba Osaka
  {
    revenue: j(7223), wage_bill: j(2548), wage_ratio: wr(2548, 7223),
    operating_profit: j(221), profit_from_player_sales: j(178 - 725),
    pre_tax_profit: j(75), net_debt: nd(2073, 1053),
    fiscal_year_end: "2025-01-31", data_confidence: "high",
    league_2026_27: "j1", league_notes: null,
    prior_years: [
      { fiscal_year_end: "2024-01-31", revenue: j(6574), wage_bill: j(2763), wage_ratio: wr(2763, 6574), operating_profit: j(539), profit_from_player_sales: null, pre_tax_profit: j(264), net_debt: nd(1884, 1147) },
      { fiscal_year_end: "2023-01-31", revenue: 39.79, wage_bill: 18.91, wage_ratio: 47.5, operating_profit: 1.51, profit_from_player_sales: null, pre_tax_profit: 0.69, net_debt: 6.19 },
      { fiscal_year_end: "2022-01-31", revenue: 34.53, wage_bill: 18.23, wage_ratio: 52.8, operating_profit: -0.18, profit_from_player_sales: null, pre_tax_profit: 0.55, net_debt: 6.63 },
      { fiscal_year_end: "2021-01-31", revenue: 34.91, wage_bill: 18.14, wage_ratio: 52.0, operating_profit: -2.9, profit_from_player_sales: null, pre_tax_profit: -2.27, net_debt: 8.86 },
    ],
  },
  // Cerezo Osaka
  {
    revenue: j(5401), wage_bill: j(1825), wage_ratio: wr(1825, 5401),
    operating_profit: j(276), profit_from_player_sales: j(493 - 727),
    pre_tax_profit: j(311), net_debt: nd(1714, 1847),
    fiscal_year_end: "2025-01-31", data_confidence: "high",
    league_2026_27: "j1", league_notes: null,
    prior_years: [
      { fiscal_year_end: "2024-01-31", revenue: j(4868), wage_bill: j(2010), wage_ratio: wr(2010, 4868), operating_profit: j(411), profit_from_player_sales: null, pre_tax_profit: j(403), net_debt: nd(1777, 1890) },
      { fiscal_year_end: "2023-01-31", revenue: 28.11, wage_bill: 13.62, wage_ratio: 48.5, operating_profit: 1.23, profit_from_player_sales: null, pre_tax_profit: 0.58, net_debt: 8.64 },
      { fiscal_year_end: "2022-01-31", revenue: 24.92, wage_bill: 16.33, wage_ratio: 65.5, operating_profit: -4.65, profit_from_player_sales: null, pre_tax_profit: -2.77, net_debt: 9.11 },
      { fiscal_year_end: "2021-01-31", revenue: 29.94, wage_bill: 13.47, wage_ratio: 45.0, operating_profit: -4.43, profit_from_player_sales: null, pre_tax_profit: -5.34, net_debt: 6.15 },
    ],
  },
  // Vissel Kobe
  {
    revenue: j(8067), wage_bill: j(2810), wage_ratio: wr(2810, 8067),
    operating_profit: j(-148), profit_from_player_sales: j(11 - 465),
    pre_tax_profit: j(35), net_debt: nd(2301, 2111),
    fiscal_year_end: "2024-12-31", data_confidence: "high",
    league_2026_27: "j1", league_notes: null,
    prior_years: [
      { fiscal_year_end: "2023-12-31", revenue: j(7037), wage_bill: j(3800), wage_ratio: wr(3800, 7037), operating_profit: j(-1226), profit_from_player_sales: null, pre_tax_profit: j(49), net_debt: nd(1849, 1560) },
      { fiscal_year_end: "2022-12-31", revenue: 42.43, wage_bill: 32.26, wage_ratio: 76.0, operating_profit: -20.82, profit_from_player_sales: null, pre_tax_profit: 0.0, net_debt: 3.73 },
      { fiscal_year_end: "2021-12-31", revenue: 42.59, wage_bill: 33.68, wage_ratio: 79.1, operating_profit: -20.92, profit_from_player_sales: null, pre_tax_profit: -0.43, net_debt: 3.33 },
      { fiscal_year_end: "2020-12-31", revenue: 19.43, wage_bill: 42.64, wage_ratio: 219.4, operating_profit: -34.21, profit_from_player_sales: null, pre_tax_profit: 0.57, net_debt: 3.42 },
    ],
  },
  // Sanfrecce Hiroshima
  {
    revenue: j(8035), wage_bill: j(2682), wage_ratio: wr(2682, 8035),
    operating_profit: j(573), profit_from_player_sales: j(306 - 566),
    pre_tax_profit: j(563), net_debt: nd(2670, 2851),
    fiscal_year_end: "2025-01-31", data_confidence: "high",
    league_2026_27: "j1", league_notes: null,
    prior_years: [
      { fiscal_year_end: "2024-01-31", revenue: j(4198), wage_bill: j(2435), wage_ratio: wr(2435, 4198), operating_profit: j(-736), profit_from_player_sales: null, pre_tax_profit: j(-755), net_debt: nd(2556, 2663) },
      { fiscal_year_end: "2023-01-31", revenue: 26.78, wage_bill: 15.47, wage_ratio: 57.8, operating_profit: -3.91, profit_from_player_sales: null, pre_tax_profit: -3.71, net_debt: 2.61 },
      { fiscal_year_end: "2022-01-31", revenue: 23.07, wage_bill: 12.51, wage_ratio: 54.2, operating_profit: 0.17, profit_from_player_sales: null, pre_tax_profit: 0.17, net_debt: -2.56 },
      { fiscal_year_end: "2021-01-31", revenue: 31.43, wage_bill: 13.6, wage_ratio: 43.3, operating_profit: -1.28, profit_from_player_sales: null, pre_tax_profit: -1.13, net_debt: -3.11 },
    ],
  },
  // Avispa Fukuoka
  {
    revenue: j(3053), wage_bill: j(1424), wage_ratio: wr(1424, 3053),
    operating_profit: j(16), profit_from_player_sales: j(177 - 204),
    pre_tax_profit: j(14), net_debt: nd(1131, 537),
    fiscal_year_end: "2025-01-31", data_confidence: "high",
    league_2026_27: "j1", league_notes: null,
    prior_years: [
      { fiscal_year_end: "2024-01-31", revenue: j(2874), wage_bill: j(1611), wage_ratio: wr(1611, 2874), operating_profit: j(-92), profit_from_player_sales: null, pre_tax_profit: j(-89), net_debt: nd(1178, 459) },
      { fiscal_year_end: "2023-01-31", revenue: 18.86, wage_bill: 11.18, wage_ratio: 59.3, operating_profit: 0.1, profit_from_player_sales: null, pre_tax_profit: -0.01, net_debt: 4.71 },
      { fiscal_year_end: "2022-01-31", revenue: 14.21, wage_bill: 10.95, wage_ratio: 77.1, operating_profit: -3.21, profit_from_player_sales: null, pre_tax_profit: -3.36, net_debt: 4.85 },
      { fiscal_year_end: "2021-01-31", revenue: 10.25, wage_bill: 6.45, wage_ratio: 62.9, operating_profit: -1.91, profit_from_player_sales: null, pre_tax_profit: -1.91, net_debt: 3.67 },
    ],
  },
  // Fagiano Okayama — promoted from J2 for 2025
  {
    revenue: j(2036), wage_bill: j(668), wage_ratio: wr(668, 2036),
    operating_profit: j(-108), profit_from_player_sales: j(0 - 74),
    pre_tax_profit: j(-65), net_debt: nd(1482, 1094),
    fiscal_year_end: "2025-01-31", data_confidence: "high",
    league_2026_27: "j1", league_notes: null,
    prior_years: [
      { fiscal_year_end: "2024-01-31", revenue: j(1937), wage_bill: j(715), wage_ratio: wr(715, 1937), operating_profit: j(13), profit_from_player_sales: null, pre_tax_profit: j(26), net_debt: nd(1011, 865) },
      { fiscal_year_end: "2023-01-31", revenue: 12.55, wage_bill: 3.86, wage_ratio: 30.8, operating_profit: 0.35, profit_from_player_sales: null, pre_tax_profit: 0.49, net_debt: 0.71 },
      { fiscal_year_end: "2022-01-31", revenue: 10.47, wage_bill: 4.08, wage_ratio: 39.0, operating_profit: 0.09, profit_from_player_sales: null, pre_tax_profit: 0.12, net_debt: -1.39 },
      { fiscal_year_end: "2021-01-31", revenue: 9.08, wage_bill: 4.23, wage_ratio: 46.6, operating_profit: -0.25, profit_from_player_sales: null, pre_tax_profit: -0.11, net_debt: -0.51 },
    ],
  },
  // Shimizu S-Pulse — promoted from J2 for 2025
  {
    revenue: j(5003), wage_bill: j(2157), wage_ratio: wr(2157, 5003),
    operating_profit: j(68), profit_from_player_sales: j(514 - 396),
    pre_tax_profit: j(27), net_debt: nd(1291, 635),
    fiscal_year_end: "2025-01-31", data_confidence: "high",
    league_2026_27: "j1", league_notes: null,
    prior_years: [
      { fiscal_year_end: "2024-01-31", revenue: j(5101), wage_bill: j(2246), wage_ratio: wr(2246, 5101), operating_profit: j(520), profit_from_player_sales: null, pre_tax_profit: j(536), net_debt: nd(794, 481) },
      { fiscal_year_end: "2023-01-31", revenue: 33.91, wage_bill: 14.73, wage_ratio: 43.4, operating_profit: 0.29, profit_from_player_sales: null, pre_tax_profit: 0.08, net_debt: 5.51 },
      { fiscal_year_end: "2022-01-31", revenue: 29.11, wage_bill: 14.18, wage_ratio: 48.7, operating_profit: 0.25, profit_from_player_sales: null, pre_tax_profit: -2.06, net_debt: 6.04 },
      { fiscal_year_end: "2021-01-31", revenue: 30.3, wage_bill: 12.91, wage_ratio: 42.6, operating_profit: 1.43, profit_from_player_sales: null, pre_tax_profit: 0.27, net_debt: 6.29 },
    ],
  },
  // Yokohama FC — promoted from J2 for 2025, relegated after
  {
    revenue: j(3314), wage_bill: j(1407), wage_ratio: wr(1407, 3314),
    operating_profit: j(-124), profit_from_player_sales: j(426 - 211),
    pre_tax_profit: j(-102), net_debt: nd(788, 827),
    fiscal_year_end: "2025-01-31", data_confidence: "high",
    league_2026_27: "j2", league_notes: "Relegated from J1",
    prior_years: [
      { fiscal_year_end: "2024-01-31", revenue: j(3627), wage_bill: j(2089), wage_ratio: wr(2089, 3627), operating_profit: j(-346), profit_from_player_sales: null, pre_tax_profit: j(-333), net_debt: nd(1448, 817) },
      { fiscal_year_end: "2023-01-31", revenue: 19.07, wage_bill: 11.69, wage_ratio: 61.3, operating_profit: -1.38, profit_from_player_sales: null, pre_tax_profit: -1.17, net_debt: 2.37 },
      { fiscal_year_end: "2022-01-31", revenue: 17.07, wage_bill: 10.09, wage_ratio: 59.1, operating_profit: -0.42, profit_from_player_sales: null, pre_tax_profit: -0.45, net_debt: 1.64 },
      { fiscal_year_end: "2021-01-31", revenue: 14.43, wage_bill: 6.73, wage_ratio: 46.7, operating_profit: 0.88, profit_from_player_sales: null, pre_tax_profit: 0.33, net_debt: 0.43 },
    ],
  },
];

const J1_SLUGS: string[] = [
  "kashima", "urawa", "kashiwa", "fc-tokyo", "tokyo-verdy",
  "machida", "kawasaki", "yokohama-fm", "shonan", "niigata",
  "nagoya", "kyoto", "gamba-osaka", "cerezo-osaka", "vissel-kobe",
  "hiroshima", "fukuoka", "okayama", "shimizu", "yokohama-fc",
];

const J1_NAMES: string[] = [
  "Kashima Antlers", "Urawa Red Diamonds", "Kashiwa Reysol",
  "FC Tokyo", "Tokyo Verdy", "Machida Zelvia", "Kawasaki Frontale",
  "Yokohama F.Marinos", "Shonan Bellmare", "Albirex Niigata",
  "Nagoya Grampus", "Kyoto Sanga", "Gamba Osaka", "Cerezo Osaka",
  "Vissel Kobe", "Sanfrecce Hiroshima", "Avispa Fukuoka",
  "Fagiano Okayama", "Shimizu S-Pulse", "Yokohama FC",
];

// ─── J2 clubs (2025 season) ───────────────────────────────────────────────────

const j2Data: Omit<JapanClub, "slug" | "name" | "division" | "cash">[] = [
  // Vegalta Sendai
  {
    revenue: j(2500), wage_bill: j(734), wage_ratio: wr(734, 2500),
    operating_profit: j(124), profit_from_player_sales: j(24 - 141),
    pre_tax_profit: j(124), net_debt: nd(1117, 715),
    fiscal_year_end: "2025-01-31", data_confidence: "high",
    league_2026_27: "j2", league_notes: null,
    prior_years: [
      { fiscal_year_end: "2024-01-31", revenue: j(2520), wage_bill: j(1044), wage_ratio: wr(1044, 2520), operating_profit: j(86), profit_from_player_sales: null, pre_tax_profit: j(92), net_debt: nd(1125, 972) },
      { fiscal_year_end: "2023-01-31", revenue: 17.77, wage_bill: 7.08, wage_ratio: 39.8, operating_profit: 1.16, profit_from_player_sales: null, pre_tax_profit: 1.21, net_debt: 1.69 },
      { fiscal_year_end: "2022-01-31", revenue: 14.14, wage_bill: 7.71, wage_ratio: 54.5, operating_profit: -0.92, profit_from_player_sales: null, pre_tax_profit: -0.9, net_debt: 5.1 },
      { fiscal_year_end: "2021-01-31", revenue: 13.31, wage_bill: 8.31, wage_ratio: 62.4, operating_profit: -3.31, profit_from_player_sales: null, pre_tax_profit: -3.21, net_debt: 3.81 },
    ],
  },
  // Blaublitz Akita
  {
    revenue: j(1007), wage_bill: j(296), wage_ratio: wr(296, 1007),
    operating_profit: j(-82), profit_from_player_sales: j(23 - 128),
    pre_tax_profit: j(-54), net_debt: nd(379, 290),
    fiscal_year_end: "2025-01-31", data_confidence: "high",
    league_2026_27: "j2", league_notes: null,
    prior_years: [
      { fiscal_year_end: "2024-01-31", revenue: j(904), wage_bill: j(265), wage_ratio: wr(265, 904), operating_profit: j(-18), profit_from_player_sales: null, pre_tax_profit: j(-24), net_debt: nd(239, 236) },
      { fiscal_year_end: "2023-01-31", revenue: 5.85, wage_bill: 1.71, wage_ratio: 29.2, operating_profit: 0.0, profit_from_player_sales: null, pre_tax_profit: 0.07, net_debt: -0.35 },
      { fiscal_year_end: "2022-01-31", revenue: 5.17, wage_bill: 1.77, wage_ratio: 34.2, operating_profit: -0.05, profit_from_player_sales: null, pre_tax_profit: 0.17, net_debt: -0.25 },
      { fiscal_year_end: "2021-01-31", revenue: 3.07, wage_bill: 1.23, wage_ratio: 39.9, operating_profit: -0.33, profit_from_player_sales: null, pre_tax_profit: -0.23, net_debt: 0.35 },
    ],
  },
  // Montedio Yamagata
  {
    revenue: j(2612), wage_bill: j(725), wage_ratio: wr(725, 2612),
    operating_profit: j(28), profit_from_player_sales: j(48 - 128),
    pre_tax_profit: j(40), net_debt: nd(737, 639),
    fiscal_year_end: "2025-01-31", data_confidence: "high",
    league_2026_27: "j2", league_notes: null,
    prior_years: [
      { fiscal_year_end: "2024-01-31", revenue: j(2500), wage_bill: j(839), wage_ratio: wr(839, 2500), operating_profit: j(55), profit_from_player_sales: null, pre_tax_profit: j(70), net_debt: nd(763, 731) },
      { fiscal_year_end: "2023-01-31", revenue: 14.61, wage_bill: 5.25, wage_ratio: 35.9, operating_profit: -0.02, profit_from_player_sales: null, pre_tax_profit: 0.09, net_debt: 0.77 },
      { fiscal_year_end: "2022-01-31", revenue: 12.31, wage_bill: 3.92, wage_ratio: 31.8, operating_profit: 0.07, profit_from_player_sales: null, pre_tax_profit: 0.19, net_debt: 0.58 },
      { fiscal_year_end: "2021-01-31", revenue: 11.16, wage_bill: 4.03, wage_ratio: 36.1, operating_profit: -0.33, profit_from_player_sales: null, pre_tax_profit: -0.11, net_debt: 0.76 },
    ],
  },
  // Iwaki FC
  {
    revenue: j(1408), wage_bill: j(367), wage_ratio: wr(367, 1408),
    operating_profit: j(-10), profit_from_player_sales: j(164 - 6),
    pre_tax_profit: j(7), net_debt: nd(523, 426),
    fiscal_year_end: "2024-12-31", data_confidence: "high",
    league_2026_27: "j2", league_notes: null,
    prior_years: [
      { fiscal_year_end: "2024-01-31", revenue: j(1077), wage_bill: j(282), wage_ratio: wr(282, 1077), operating_profit: j(-2), profit_from_player_sales: null, pre_tax_profit: j(49), net_debt: nd(471, 387) },
    ],
  },
  // Mito HollyHock — promoted to J1
  {
    revenue: j(1224), wage_bill: j(372), wage_ratio: wr(372, 1224),
    operating_profit: j(0), profit_from_player_sales: j(93 - 14),
    pre_tax_profit: j(3), net_debt: nd(457, 544),
    fiscal_year_end: "2025-01-31", data_confidence: "high",
    league_2026_27: "j1", league_notes: "Promoted to J1",
    prior_years: [
      { fiscal_year_end: "2024-01-31", revenue: j(1104), wage_bill: j(346), wage_ratio: wr(346, 1104), operating_profit: j(5), profit_from_player_sales: null, pre_tax_profit: j(6), net_debt: nd(444, 597) },
      { fiscal_year_end: "2023-01-31", revenue: 6.83, wage_bill: 2.31, wage_ratio: 33.8, operating_profit: 0.03, profit_from_player_sales: null, pre_tax_profit: 0.05, net_debt: -0.99 },
      { fiscal_year_end: "2022-01-31", revenue: 5.49, wage_bill: 2.34, wage_ratio: 42.6, operating_profit: -0.33, profit_from_player_sales: null, pre_tax_profit: -0.32, net_debt: -0.98 },
      { fiscal_year_end: "2021-01-31", revenue: 5.08, wage_bill: 2.23, wage_ratio: 44.0, operating_profit: -0.19, profit_from_player_sales: null, pre_tax_profit: -0.18, net_debt: -1.33 },
    ],
  },
  // JEF United Chiba — promoted to J1
  {
    revenue: j(3197), wage_bill: j(889), wage_ratio: wr(889, 3197),
    operating_profit: j(43), profit_from_player_sales: j(274 - 241),
    pre_tax_profit: j(24), net_debt: nd(1495, 1249),
    fiscal_year_end: "2025-01-31", data_confidence: "high",
    league_2026_27: "j1", league_notes: "Promoted to J1 (via playoff)",
    prior_years: [
      { fiscal_year_end: "2024-01-31", revenue: j(2649), wage_bill: j(873), wage_ratio: wr(873, 2649), operating_profit: j(-28), profit_from_player_sales: null, pre_tax_profit: j(-54), net_debt: nd(1557, 1259) },
      { fiscal_year_end: "2023-01-31", revenue: 17.59, wage_bill: 5.71, wage_ratio: 32.5, operating_profit: 0.16, profit_from_player_sales: null, pre_tax_profit: 0.27, net_debt: 1.46 },
      { fiscal_year_end: "2022-01-31", revenue: 15.81, wage_bill: 7.02, wage_ratio: 44.4, operating_profit: 0.08, profit_from_player_sales: null, pre_tax_profit: -0.02, net_debt: 2.07 },
      { fiscal_year_end: "2021-01-31", revenue: 16.69, wage_bill: 9.63, wage_ratio: 57.7, operating_profit: -1.16, profit_from_player_sales: null, pre_tax_profit: -1.17, net_debt: 2.52 },
    ],
  },
  // Ventforet Kofu
  {
    revenue: j(1748), wage_bill: j(476), wage_ratio: wr(476, 1748),
    operating_profit: j(1), profit_from_player_sales: j(151 - 142),
    pre_tax_profit: j(8), net_debt: nd(453, 591),
    fiscal_year_end: "2025-01-31", data_confidence: "high",
    league_2026_27: "j2", league_notes: null,
    prior_years: [
      { fiscal_year_end: "2024-01-31", revenue: j(2040), wage_bill: j(748), wage_ratio: wr(748, 2040), operating_profit: j(1), profit_from_player_sales: null, pre_tax_profit: j(13), net_debt: nd(482, 615) },
      { fiscal_year_end: "2023-01-31", revenue: 10.43, wage_bill: 4.27, wage_ratio: 40.9, operating_profit: 0.24, profit_from_player_sales: null, pre_tax_profit: 0.27, net_debt: -0.81 },
      { fiscal_year_end: "2022-01-31", revenue: 8.61, wage_bill: 3.22, wage_ratio: 37.4, operating_profit: 0.43, profit_from_player_sales: null, pre_tax_profit: 0.56, net_debt: -0.93 },
      { fiscal_year_end: "2021-01-31", revenue: 8.19, wage_bill: 4.06, wage_ratio: 49.6, operating_profit: -0.33, profit_from_player_sales: null, pre_tax_profit: -0.15, net_debt: -0.45 },
    ],
  },
  // Fujeda MYFC
  {
    revenue: j(907), wage_bill: j(270), wage_ratio: wr(270, 907),
    operating_profit: j(-29), profit_from_player_sales: j(53 - 16),
    pre_tax_profit: j(-16), net_debt: nd(191, 206),
    fiscal_year_end: "2025-01-31", data_confidence: "high",
    league_2026_27: "j2", league_notes: null,
    prior_years: [
      { fiscal_year_end: "2024-01-31", revenue: j(805), wage_bill: j(265), wage_ratio: wr(265, 805), operating_profit: j(109), profit_from_player_sales: null, pre_tax_profit: j(116), net_debt: nd(195, 264) },
      { fiscal_year_end: "2022-01-31", revenue: 2.39, wage_bill: 1.17, wage_ratio: 49.2, operating_profit: -0.01, profit_from_player_sales: null, pre_tax_profit: 0.01, net_debt: 0.14 },
    ],
  },
  // Renofa Yamaguchi — relegated to J3
  {
    revenue: j(1251), wage_bill: j(447), wage_ratio: wr(447, 1251),
    operating_profit: j(-29), profit_from_player_sales: j(72 - 8),
    pre_tax_profit: j(-30), net_debt: nd(190, 364),
    fiscal_year_end: "2025-01-31", data_confidence: "high",
    league_2026_27: "j3", league_notes: "Relegated from J2",
    prior_years: [
      { fiscal_year_end: "2024-01-31", revenue: j(1098), wage_bill: j(406), wage_ratio: wr(406, 1098), operating_profit: j(53), profit_from_player_sales: null, pre_tax_profit: j(44), net_debt: nd(454, 659) },
      { fiscal_year_end: "2023-01-31", revenue: 7.45, wage_bill: 2.83, wage_ratio: 38.0, operating_profit: 0.35, profit_from_player_sales: null, pre_tax_profit: 0.49, net_debt: -1.71 },
      { fiscal_year_end: "2022-01-31", revenue: 6.73, wage_bill: 3.22, wage_ratio: 47.8, operating_profit: -0.84, profit_from_player_sales: null, pre_tax_profit: -0.81, net_debt: 1.47 },
      { fiscal_year_end: "2021-01-31", revenue: 6.95, wage_bill: 3.37, wage_ratio: 48.4, operating_profit: -0.79, profit_from_player_sales: null, pre_tax_profit: 0.74, net_debt: 0.64 },
    ],
  },
  // Tokushima Vortis
  {
    revenue: j(2731), wage_bill: j(1010), wage_ratio: wr(1010, 2731),
    operating_profit: j(191), profit_from_player_sales: j(711 - 274),
    pre_tax_profit: j(204), net_debt: nd(445, 1326),
    fiscal_year_end: "2025-01-31", data_confidence: "high",
    league_2026_27: "j2", league_notes: null,
    prior_years: [
      { fiscal_year_end: "2024-01-31", revenue: j(2092), wage_bill: j(984), wage_ratio: wr(984, 2092), operating_profit: j(-3), profit_from_player_sales: null, pre_tax_profit: j(15), net_debt: nd(1315, 2013) },
      { fiscal_year_end: "2023-01-31", revenue: 14.81, wage_bill: 7.81, wage_ratio: 52.7, operating_profit: 0.24, profit_from_player_sales: null, pre_tax_profit: -0.25, net_debt: -3.37 },
      { fiscal_year_end: "2022-01-31", revenue: 18.3, wage_bill: 11.23, wage_ratio: 61.3, operating_profit: -0.23, profit_from_player_sales: null, pre_tax_profit: -0.29, net_debt: -5.62 },
      { fiscal_year_end: "2021-01-31", revenue: 11.15, wage_bill: 6.11, wage_ratio: 54.8, operating_profit: 0.57, profit_from_player_sales: null, pre_tax_profit: 0.74, net_debt: -6.53 },
    ],
  },
  // Ehime FC — relegated to J3
  {
    revenue: j(1119), wage_bill: j(316), wage_ratio: wr(316, 1119),
    operating_profit: j(61), profit_from_player_sales: j(31 - 9),
    pre_tax_profit: j(69), net_debt: nd(152, 324),
    fiscal_year_end: "2024-12-31", data_confidence: "high",
    league_2026_27: "j3", league_notes: "Relegated from J2",
    prior_years: [
      { fiscal_year_end: "2023-12-31", revenue: 13.76, wage_bill: 9.0, wage_ratio: 65.4, operating_profit: -6.35, profit_from_player_sales: null, pre_tax_profit: -0.01, net_debt: -0.14 },
      { fiscal_year_end: "2022-12-31", revenue: 5.63, wage_bill: 2.69, wage_ratio: 47.7, operating_profit: 0.13, profit_from_player_sales: null, pre_tax_profit: 0.19, net_debt: -0.95 },
      { fiscal_year_end: "2021-12-31", revenue: 5.37, wage_bill: 2.73, wage_ratio: 50.9, operating_profit: -0.13, profit_from_player_sales: null, pre_tax_profit: 0.09, net_debt: -0.71 },
    ],
  },
  // V-Varen Nagasaki — promoted to J1
  {
    revenue: j(2352), wage_bill: j(1519), wage_ratio: wr(1519, 2352),
    operating_profit: j(-1225), profit_from_player_sales: j(18 - 80),
    pre_tax_profit: j(8), net_debt: nd(2234, 2148),
    fiscal_year_end: "2024-12-31", data_confidence: "high",
    league_2026_27: "j1", league_notes: "Promoted to J1",
    prior_years: [
      { fiscal_year_end: "2023-12-31", revenue: j(2111), wage_bill: j(1799), wage_ratio: wr(1799, 2111), operating_profit: j(135), profit_from_player_sales: null, pre_tax_profit: j(138), net_debt: nd(2323, 2218) },
      { fiscal_year_end: "2022-12-31", revenue: 13.2, wage_bill: 9.23, wage_ratio: 69.9, operating_profit: -6.69, profit_from_player_sales: null, pre_tax_profit: 0.15, net_debt: -0.19 },
      { fiscal_year_end: "2021-12-31", revenue: 12.39, wage_bill: 9.21, wage_ratio: 74.4, operating_profit: -7.0, profit_from_player_sales: null, pre_tax_profit: -1.31, net_debt: 0.11 },
    ],
  },
  // Roasso Kumamoto — relegated to J3
  {
    revenue: j(1133), wage_bill: j(273), wage_ratio: wr(273, 1133),
    operating_profit: j(128), profit_from_player_sales: j(77 - 84),
    pre_tax_profit: j(108), net_debt: nd(526, 796),
    fiscal_year_end: "2025-01-31", data_confidence: "high",
    league_2026_27: "j3", league_notes: "Relegated from J2",
    prior_years: [
      { fiscal_year_end: "2024-01-31", revenue: j(1228), wage_bill: j(326), wage_ratio: wr(326, 1228), operating_profit: j(94), profit_from_player_sales: null, pre_tax_profit: j(8), net_debt: nd(541, 737) },
      { fiscal_year_end: "2023-01-31", revenue: 6.52, wage_bill: 2.01, wage_ratio: 30.8, operating_profit: 0.63, profit_from_player_sales: null, pre_tax_profit: 0.67, net_debt: -0.71 },
      { fiscal_year_end: "2022-01-31", revenue: 3.67, wage_bill: 1.61, wage_ratio: 44.0, operating_profit: -0.25, profit_from_player_sales: null, pre_tax_profit: -0.23, net_debt: -0.03 },
      { fiscal_year_end: "2021-01-31", revenue: 3.45, wage_bill: 1.61, wage_ratio: 46.6, operating_profit: -0.43, profit_from_player_sales: null, pre_tax_profit: -0.21, net_debt: -0.29 },
    ],
  },
  // Oita Trinita
  {
    revenue: j(1819), wage_bill: j(548), wage_ratio: wr(548, 1819),
    operating_profit: j(79), profit_from_player_sales: j(187 - 99),
    pre_tax_profit: j(83), net_debt: nd(406, 523),
    fiscal_year_end: "2025-01-31", data_confidence: "high",
    league_2026_27: "j2", league_notes: null,
    prior_years: [
      { fiscal_year_end: "2024-01-31", revenue: j(1861), wage_bill: j(1070), wage_ratio: wr(1070, 1861), operating_profit: j(-48), profit_from_player_sales: null, pre_tax_profit: j(-47), net_debt: nd(455, 472) },
      { fiscal_year_end: "2023-01-31", revenue: 12.18, wage_bill: 7.13, wage_ratio: 58.6, operating_profit: -0.32, profit_from_player_sales: null, pre_tax_profit: -0.31, net_debt: 0.11 },
      { fiscal_year_end: "2022-01-31", revenue: 13.97, wage_bill: 8.34, wage_ratio: 59.7, operating_profit: -0.07, profit_from_player_sales: null, pre_tax_profit: -0.03, net_debt: -0.15 },
    ],
  },
  // Consadole Sapporo — relegated from J1
  {
    revenue: j(5000), wage_bill: j(2176), wage_ratio: wr(2176, 5000),
    operating_profit: j(-342), profit_from_player_sales: j(657 - 346),
    pre_tax_profit: j(-271), net_debt: nd(2212, 1873),
    fiscal_year_end: "2025-01-31", data_confidence: "high",
    league_2026_27: "j2", league_notes: null,
    prior_years: [
      { fiscal_year_end: "2024-01-31", revenue: j(4111), wage_bill: j(1723), wage_ratio: wr(1723, 4111), operating_profit: j(644), profit_from_player_sales: null, pre_tax_profit: j(-410), net_debt: nd(1887, 1413) },
      { fiscal_year_end: "2023-01-31", revenue: 24.03, wage_bill: 12.09, wage_ratio: 50.3, operating_profit: -6.06, profit_from_player_sales: null, pre_tax_profit: -4.72, net_debt: -1.85 },
      { fiscal_year_end: "2022-01-31", revenue: 22.61, wage_bill: 11.07, wage_ratio: 48.9, operating_profit: -2.09, profit_from_player_sales: null, pre_tax_profit: -0.11, net_debt: 0.27 },
      { fiscal_year_end: "2021-01-31", revenue: 20.64, wage_bill: 10.76, wage_ratio: 52.1, operating_profit: -2.61, profit_from_player_sales: null, pre_tax_profit: -1.8, net_debt: 1.19 },
    ],
  },
  // Júbilo Iwata — relegated from J1
  {
    revenue: j(4852), wage_bill: j(1948), wage_ratio: wr(1948, 4852),
    operating_profit: j(-99), profit_from_player_sales: j(196 - 343),
    pre_tax_profit: j(-37), net_debt: nd(1252, 907),
    fiscal_year_end: "2025-01-31", data_confidence: "high",
    league_2026_27: "j2", league_notes: null,
    prior_years: [
      { fiscal_year_end: "2024-01-31", revenue: j(4254), wage_bill: j(1413), wage_ratio: wr(1413, 4254), operating_profit: j(109), profit_from_player_sales: null, pre_tax_profit: j(124), net_debt: nd(1149, 707) },
      { fiscal_year_end: "2023-01-31", revenue: 21.55, wage_bill: 8.69, wage_ratio: 40.3, operating_profit: 2.22, profit_from_player_sales: null, pre_tax_profit: 2.29, net_debt: 3.93 },
      { fiscal_year_end: "2022-03-31", revenue: 20.72, wage_bill: 10.55, wage_ratio: 50.9, operating_profit: -0.87, profit_from_player_sales: null, pre_tax_profit: -0.41, net_debt: 7.3 },
      { fiscal_year_end: "2021-03-31", revenue: 19.11, wage_bill: 9.37, wage_ratio: 49.0, operating_profit: -0.83, profit_from_player_sales: null, pre_tax_profit: -0.19, net_debt: 5.48 },
    ],
  },
  // Sagan Tosu — relegated from J1
  {
    revenue: j(3058), wage_bill: j(1081), wage_ratio: wr(1081, 3058),
    operating_profit: j(217), profit_from_player_sales: j(630 - 385),
    pre_tax_profit: j(215), net_debt: nd(1235, 971),
    fiscal_year_end: "2025-01-31", data_confidence: "high",
    league_2026_27: "j2", league_notes: null,
    prior_years: [
      { fiscal_year_end: "2024-01-31", revenue: j(2497), wage_bill: j(1016), wage_ratio: wr(1016, 2497), operating_profit: j(147), profit_from_player_sales: null, pre_tax_profit: j(158), net_debt: nd(1327, 1020) },
      { fiscal_year_end: "2023-01-31", revenue: 18.41, wage_bill: 7.25, wage_ratio: 39.4, operating_profit: 1.69, profit_from_player_sales: null, pre_tax_profit: 1.34, net_debt: 2.21 },
      { fiscal_year_end: "2022-01-31", revenue: 15.11, wage_bill: 8.89, wage_ratio: 58.8, operating_profit: -1.31, profit_from_player_sales: null, pre_tax_profit: -1.47, net_debt: 3.23 },
    ],
  },
  // Omiya Ardija — promoted from J3
  {
    revenue: j(2640), wage_bill: j(719), wage_ratio: wr(719, 2640),
    operating_profit: j(-41), profit_from_player_sales: j(18 - 50),
    pre_tax_profit: j(-40), net_debt: nd(1323, 570),
    fiscal_year_end: "2025-01-31", data_confidence: "high",
    league_2026_27: "j2", league_notes: null,
    prior_years: [
      { fiscal_year_end: "2024-01-31", revenue: j(2788), wage_bill: j(792), wage_ratio: wr(792, 2788), operating_profit: j(132), profit_from_player_sales: null, pre_tax_profit: j(131), net_debt: nd(1348, 1053) },
      { fiscal_year_end: "2023-01-31", revenue: 17.59, wage_bill: 3.89, wage_ratio: 22.1, operating_profit: 1.89, profit_from_player_sales: null, pre_tax_profit: 1.95, net_debt: 2.91 },
      { fiscal_year_end: "2022-01-31", revenue: 20.77, wage_bill: 9.03, wage_ratio: 43.5, operating_profit: 0.22, profit_from_player_sales: null, pre_tax_profit: 0.0, net_debt: 3.91 },
      { fiscal_year_end: "2021-01-31", revenue: 20.23, wage_bill: 8.67, wage_ratio: 42.8, operating_profit: -0.08, profit_from_player_sales: null, pre_tax_profit: 0.0, net_debt: 5.0 },
    ],
  },
  // FC Imabari — promoted from J3
  {
    revenue: j(1353), wage_bill: j(399), wage_ratio: wr(399, 1353),
    operating_profit: j(-191), profit_from_player_sales: j(15 - 51),
    pre_tax_profit: j(-172), net_debt: nd(600, 603),
    fiscal_year_end: "2025-01-31", data_confidence: "high",
    league_2026_27: "j2", league_notes: null,
    prior_years: [
      { fiscal_year_end: "2024-01-31", revenue: j(1045), wage_bill: j(304), wage_ratio: wr(304, 1045), operating_profit: j(-43), profit_from_player_sales: null, pre_tax_profit: j(10), net_debt: nd(590, 939) },
      { fiscal_year_end: "2022-01-31", revenue: 6.11, wage_bill: 2.05, wage_ratio: 33.6, operating_profit: -0.11, profit_from_player_sales: null, pre_tax_profit: 0.02, net_debt: -0.41 },
      { fiscal_year_end: "2021-01-31", revenue: 5.56, wage_bill: 1.55, wage_ratio: 27.9, operating_profit: 0.25, profit_from_player_sales: null, pre_tax_profit: 0.37, net_debt: -0.33 },
    ],
  },
  // Kataller Toyama — promoted from J3
  {
    revenue: j(919), wage_bill: j(228), wage_ratio: wr(228, 919),
    operating_profit: j(1), profit_from_player_sales: j(5 - 0),
    pre_tax_profit: j(3), net_debt: nd(117, 162),
    fiscal_year_end: "2025-01-31", data_confidence: "high",
    league_2026_27: "j2", league_notes: null,
    prior_years: [
      { fiscal_year_end: "2022-01-31", revenue: 4.18, wage_bill: 1.59, wage_ratio: 38.1, operating_profit: 0.03, profit_from_player_sales: null, pre_tax_profit: 0.04, net_debt: -0.64 },
      { fiscal_year_end: "2021-01-31", revenue: 3.65, wage_bill: 1.2, wage_ratio: 32.8, operating_profit: 0.33, profit_from_player_sales: null, pre_tax_profit: 0.38, net_debt: -0.61 },
    ],
  },
];

const J2_SLUGS: string[] = [
  "sendai", "akita", "yamagata", "iwaki", "mito", "chiba",
  "kofu", "fujeda", "yamaguchi", "tokushima", "ehime", "nagasaki",
  "kumamoto", "oita", "sapporo", "iwata", "tosu",
  "omiya", "imabari", "toyama",
];

const J2_NAMES: string[] = [
  "Vegalta Sendai", "Blaublitz Akita", "Montedio Yamagata", "Iwaki FC",
  "Mito HollyHock", "JEF United Chiba", "Ventforet Kofu", "Fujeda MYFC",
  "Renofa Yamaguchi", "Tokushima Vortis", "Ehime FC", "V-Varen Nagasaki",
  "Roasso Kumamoto", "Oita Trinita", "Consadole Sapporo", "Júbilo Iwata",
  "Sagan Tosu", "Omiya Ardija", "FC Imabari", "Kataller Toyama",
];

// ─── J3 clubs (2025 season) ───────────────────────────────────────────────────

const j3Data: Omit<JapanClub, "slug" | "name" | "division" | "cash">[] = [
  // Vanraure Hachinohe — promoted to J2
  {
    revenue: j(538), wage_bill: j(144), wage_ratio: wr(144, 538),
    operating_profit: j(-20), profit_from_player_sales: j(8 - 1),
    pre_tax_profit: j(1), net_debt: nd(355, 220),
    fiscal_year_end: "2025-01-31", data_confidence: "high",
    league_2026_27: "j2", league_notes: "Promoted from J3",
    prior_years: [
      { fiscal_year_end: "2024-01-31", revenue: j(494), wage_bill: j(126), wage_ratio: wr(126, 494), operating_profit: j(-21), profit_from_player_sales: null, pre_tax_profit: j(1), net_debt: nd(356, 211) },
      { fiscal_year_end: "2022-01-31", revenue: 2.25, wage_bill: 0.48, wage_ratio: 21.4, operating_profit: -0.09, profit_from_player_sales: null, pre_tax_profit: 0.03, net_debt: 0.58 },
      { fiscal_year_end: "2021-01-31", revenue: 1.74, wage_bill: 0.47, wage_ratio: 26.8, operating_profit: -0.18, profit_from_player_sales: null, pre_tax_profit: 0.02, net_debt: 0.7 },
    ],
  },
  // Fukushima United
  {
    revenue: j(523), wage_bill: j(175), wage_ratio: wr(175, 523),
    operating_profit: j(-158), profit_from_player_sales: j(4 - 0),
    pre_tax_profit: j(-159), net_debt: nd(162, 194),
    fiscal_year_end: "2025-01-31", data_confidence: "high",
    league_2026_27: "j3", league_notes: null,
    prior_years: [
      { fiscal_year_end: "2024-01-31", revenue: j(403), wage_bill: j(157), wage_ratio: wr(157, 403), operating_profit: j(-96), profit_from_player_sales: null, pre_tax_profit: j(-92), net_debt: nd(156, 147) },
      { fiscal_year_end: "2022-01-31", revenue: 2.45, wage_bill: 0.93, wage_ratio: 38.1, operating_profit: -0.3, profit_from_player_sales: null, pre_tax_profit: -0.29, net_debt: 0.15 },
      { fiscal_year_end: "2021-01-31", revenue: 2.37, wage_bill: 0.81, wage_ratio: 34.3, operating_profit: 0.02, profit_from_player_sales: null, pre_tax_profit: 0.04, net_debt: -0.14 },
    ],
  },
  // SC Sagamihara
  {
    revenue: j(1074), wage_bill: j(332), wage_ratio: wr(332, 1074),
    operating_profit: j(72), profit_from_player_sales: j(0 - 0),
    pre_tax_profit: j(32), net_debt: nd(1123, 621),
    fiscal_year_end: "2025-01-31", data_confidence: "high",
    league_2026_27: "j3", league_notes: null,
    prior_years: [
      { fiscal_year_end: "2024-01-31", revenue: j(486), wage_bill: j(265), wage_ratio: wr(265, 486), operating_profit: j(-518), profit_from_player_sales: null, pre_tax_profit: j(-577), net_debt: nd(1077, 547) },
      { fiscal_year_end: "2022-01-31", revenue: 5.17, wage_bill: 1.77, wage_ratio: 34.1, operating_profit: 0.66, profit_from_player_sales: null, pre_tax_profit: 0.61, net_debt: -0.27 },
      { fiscal_year_end: "2021-01-31", revenue: 2.53, wage_bill: 1.01, wage_ratio: 39.8, operating_profit: -0.21, profit_from_player_sales: null, pre_tax_profit: 0.0, net_debt: 0.06 },
    ],
  },
  // Matsumoto Yamaga FC
  {
    revenue: j(1432), wage_bill: j(469), wage_ratio: wr(469, 1432),
    operating_profit: j(-214), profit_from_player_sales: j(32 - 44),
    pre_tax_profit: j(-190), net_debt: nd(449, 525),
    fiscal_year_end: "2025-01-31", data_confidence: "high",
    league_2026_27: "j3", league_notes: null,
    prior_years: [
      { fiscal_year_end: "2024-01-31", revenue: j(1456), wage_bill: j(518), wage_ratio: wr(518, 1456), operating_profit: j(-215), profit_from_player_sales: null, pre_tax_profit: j(-204), net_debt: nd(426, 678) },
      { fiscal_year_end: "2022-01-31", revenue: 12.69, wage_bill: 5.49, wage_ratio: 43.2, operating_profit: 0.49, profit_from_player_sales: null, pre_tax_profit: 0.79, net_debt: -3.93 },
      { fiscal_year_end: "2021-01-31", revenue: 12.85, wage_bill: 7.27, wage_ratio: 56.5, operating_profit: -0.75, profit_from_player_sales: null, pre_tax_profit: 0.03, net_debt: -3.33 },
    ],
  },
  // AC Nagano Parceiro
  {
    revenue: j(874), wage_bill: j(239), wage_ratio: wr(239, 874),
    operating_profit: j(-118), profit_from_player_sales: j(5 - 3),
    pre_tax_profit: j(-119), net_debt: nd(194, 225),
    fiscal_year_end: "2024-12-31", data_confidence: "high",
    league_2026_27: "j3", league_notes: null,
    prior_years: [
      { fiscal_year_end: "2023-12-31", revenue: j(741), wage_bill: j(177), wage_ratio: wr(177, 741), operating_profit: j(-98), profit_from_player_sales: null, pre_tax_profit: j(-98), net_debt: nd(175, 123) },
      { fiscal_year_end: "2021-12-31", revenue: 4.72, wage_bill: 1.85, wage_ratio: 39.3, operating_profit: 0.13, profit_from_player_sales: null, pre_tax_profit: 0.13, net_debt: 0.01 },
    ],
  },
  // Zweigen Kanazawa
  {
    revenue: j(1274), wage_bill: j(378), wage_ratio: wr(378, 1274),
    operating_profit: j(-78), profit_from_player_sales: j(30 - 29),
    pre_tax_profit: j(-89), net_debt: nd(416, 355),
    fiscal_year_end: "2025-01-31", data_confidence: "high",
    league_2026_27: "j3", league_notes: null,
    prior_years: [
      { fiscal_year_end: "2024-01-31", revenue: j(871), wage_bill: j(359), wage_ratio: wr(359, 871), operating_profit: j(-2), profit_from_player_sales: null, pre_tax_profit: j(3), net_debt: nd(278, 229) },
      { fiscal_year_end: "2023-01-31", revenue: 5.75, wage_bill: 2.17, wage_ratio: 37.7, operating_profit: -0.01, profit_from_player_sales: null, pre_tax_profit: 0.02, net_debt: 0.24 },
      { fiscal_year_end: "2022-01-31", revenue: 5.07, wage_bill: 2.31, wage_ratio: 45.6, operating_profit: 0.01, profit_from_player_sales: null, pre_tax_profit: 0.03, net_debt: 0.31 },
      { fiscal_year_end: "2021-01-31", revenue: 4.43, wage_bill: 2.08, wage_ratio: 46.9, operating_profit: -0.3, profit_from_player_sales: null, pre_tax_profit: -0.17, net_debt: 0.43 },
    ],
  },
  // Azul Claro Numazu
  {
    revenue: j(589), wage_bill: j(185), wage_ratio: wr(185, 589),
    operating_profit: j(16), profit_from_player_sales: j(0 - 1),
    pre_tax_profit: j(17), net_debt: nd(280, 249),
    fiscal_year_end: "2025-01-31", data_confidence: "high",
    league_2026_27: "j3", league_notes: null,
    prior_years: [],
  },
  // FC Gifu
  {
    revenue: j(1010), wage_bill: j(287), wage_ratio: wr(287, 1010),
    operating_profit: j(28), profit_from_player_sales: j(29 - 0),
    pre_tax_profit: j(33), net_debt: nd(353, 478),
    fiscal_year_end: "2025-01-31", data_confidence: "high",
    league_2026_27: "j3", league_notes: null,
    prior_years: [
      { fiscal_year_end: "2021-01-31", revenue: 5.69, wage_bill: 2.22, wage_ratio: 39.0, operating_profit: 0.08, profit_from_player_sales: null, pre_tax_profit: 0.11, net_debt: -1.46 },
    ],
  },
  // FC Osaka — promoted to J2
  {
    revenue: j(659), wage_bill: j(222), wage_ratio: wr(222, 659),
    operating_profit: j(2), profit_from_player_sales: j(25 - 3),
    pre_tax_profit: j(1), net_debt: nd(73, 136),
    fiscal_year_end: "2025-01-31", data_confidence: "high",
    league_2026_27: "j2", league_notes: "Promoted from J3 (via playoff)",
    prior_years: [
      { fiscal_year_end: "2024-01-31", revenue: j(559), wage_bill: j(156), wage_ratio: wr(156, 559), operating_profit: j(1), profit_from_player_sales: null, pre_tax_profit: j(1), net_debt: nd(113, 171) },
    ],
  },
  // Nara Club
  {
    revenue: j(465), wage_bill: j(188), wage_ratio: wr(188, 465),
    operating_profit: j(-19), profit_from_player_sales: j(3 - 10),
    pre_tax_profit: j(-13), net_debt: nd(101, 98),
    fiscal_year_end: "2025-01-31", data_confidence: "high",
    league_2026_27: "j3", league_notes: null,
    prior_years: [
      { fiscal_year_end: "2024-01-31", revenue: j(429), wage_bill: j(163), wage_ratio: wr(163, 429), operating_profit: j(10), profit_from_player_sales: null, pre_tax_profit: j(16), net_debt: nd(125, 135) },
    ],
  },
  // Gainare Tottori
  {
    revenue: j(540), wage_bill: j(142), wage_ratio: wr(142, 540),
    operating_profit: j(11), profit_from_player_sales: j(23 - 3),
    pre_tax_profit: j(-78), net_debt: nd(591, 63),
    fiscal_year_end: "2025-01-31", data_confidence: "high",
    league_2026_27: "j3", league_notes: null,
    prior_years: [
      { fiscal_year_end: "2021-01-31", revenue: 1.89, wage_bill: 0.76, wage_ratio: 40.3, operating_profit: -1.2, profit_from_player_sales: null, pre_tax_profit: -1.07, net_debt: 2.99 },
    ],
  },
  // Giravanz Kitakyushu
  {
    revenue: j(907), wage_bill: j(235), wage_ratio: wr(235, 907),
    operating_profit: j(-37), profit_from_player_sales: j(14 - 5),
    pre_tax_profit: j(-38), net_debt: nd(280, 200),
    fiscal_year_end: "2025-01-31", data_confidence: "high",
    league_2026_27: "j3", league_notes: null,
    prior_years: [
      { fiscal_year_end: "2022-01-31", revenue: 7.29, wage_bill: 2.99, wage_ratio: 41.0, operating_profit: -0.05, profit_from_player_sales: null, pre_tax_profit: -0.07, net_debt: -0.95 },
      { fiscal_year_end: "2021-01-31", revenue: 6.57, wage_bill: 2.2, wage_ratio: 33.5, operating_profit: 0.55, profit_from_player_sales: null, pre_tax_profit: 0.57, net_debt: -0.91 },
    ],
  },
  // Tegevajaro Miyazaki
  {
    revenue: j(510), wage_bill: j(197), wage_ratio: wr(197, 510),
    operating_profit: j(-54), profit_from_player_sales: j(0 - 3),
    pre_tax_profit: j(-53), net_debt: nd(35, 60),
    fiscal_year_end: "2025-01-31", data_confidence: "high",
    league_2026_27: "j3", league_notes: null,
    prior_years: [
      { fiscal_year_end: "2024-01-31", revenue: j(325), wage_bill: j(101), wage_ratio: wr(101, 325), operating_profit: j(7), profit_from_player_sales: null, pre_tax_profit: j(8), net_debt: nd(32, 269) },
      { fiscal_year_end: "2022-01-31", revenue: 1.94, wage_bill: 0.71, wage_ratio: 36.4, operating_profit: 0.08, profit_from_player_sales: null, pre_tax_profit: 0.02, net_debt: -1.53 },
      { fiscal_year_end: "2021-01-31", revenue: 4.65, wage_bill: 1.81, wage_ratio: 39.0, operating_profit: -0.26, profit_from_player_sales: null, pre_tax_profit: -0.25, net_debt: 0.59 },
    ],
  },
  // FC Ryukyu
  {
    revenue: j(603), wage_bill: j(221), wage_ratio: wr(221, 603),
    operating_profit: j(-333), profit_from_player_sales: j(10 - 3),
    pre_tax_profit: j(-341), net_debt: nd(401, 726),
    fiscal_year_end: "2025-01-31", data_confidence: "high",
    league_2026_27: "j3", league_notes: null,
    prior_years: [
      { fiscal_year_end: "2022-01-31", revenue: 4.27, wage_bill: 2.46, wage_ratio: 57.6, operating_profit: -0.87, profit_from_player_sales: null, pre_tax_profit: -0.85, net_debt: -0.5 },
      { fiscal_year_end: "2021-01-31", revenue: 3.73, wage_bill: 2.1, wage_ratio: 56.2, operating_profit: -0.83, profit_from_player_sales: null, pre_tax_profit: -0.64, net_debt: -0.55 },
    ],
  },
  // Tochigi City FC — promoted to J2
  {
    revenue: j(17293), wage_bill: j(5309), wage_ratio: wr(5309, 17293),
    operating_profit: j(-1334), profit_from_player_sales: j(271 - 207),
    pre_tax_profit: j(-1219), net_debt: nd(46, 55),
    fiscal_year_end: "2025-01-31", data_confidence: "medium",
    league_2026_27: "j2", league_notes: "Promoted from J3",
    prior_years: [],
  },
  // Kochi United SC
  {
    revenue: j(865), wage_bill: j(265), wage_ratio: wr(265, 865),
    operating_profit: j(-67), profit_from_player_sales: j(14 - 10),
    pre_tax_profit: j(-61), net_debt: nd(119, 19),
    fiscal_year_end: "2025-01-31", data_confidence: "high",
    league_2026_27: "j3", league_notes: null,
    prior_years: [],
  },
  // Tochigi SC — relegated from J2
  {
    revenue: j(1199), wage_bill: j(339), wage_ratio: wr(339, 1199),
    operating_profit: j(4), profit_from_player_sales: j(2 - 4),
    pre_tax_profit: j(5), net_debt: nd(227, 348),
    fiscal_year_end: "2025-01-31", data_confidence: "high",
    league_2026_27: "j3", league_notes: null,
    prior_years: [
      { fiscal_year_end: "2024-01-31", revenue: j(1088), wage_bill: j(316), wage_ratio: wr(316, 1088), operating_profit: j(-10), profit_from_player_sales: null, pre_tax_profit: j(-7), net_debt: nd(177, 279) },
      { fiscal_year_end: "2023-01-31", revenue: 6.94, wage_bill: 2.03, wage_ratio: 29.3, operating_profit: 0.07, profit_from_player_sales: null, pre_tax_profit: 0.04, net_debt: -0.83 },
      { fiscal_year_end: "2022-01-31", revenue: 6.52, wage_bill: 2.15, wage_ratio: 33.0, operating_profit: 0.09, profit_from_player_sales: null, pre_tax_profit: 0.15, net_debt: -0.9 },
      { fiscal_year_end: "2021-01-31", revenue: 5.7, wage_bill: 2.09, wage_ratio: 36.7, operating_profit: 0.03, profit_from_player_sales: null, pre_tax_profit: 0.15, net_debt: -0.85 },
    ],
  },
  // Thespakusatsu Gunma — relegated from J2
  {
    revenue: j(1007), wage_bill: j(326), wage_ratio: wr(326, 1007),
    operating_profit: j(-87), profit_from_player_sales: j(61 - 21),
    pre_tax_profit: j(-94), net_debt: nd(321, 241),
    fiscal_year_end: "2025-01-31", data_confidence: "high",
    league_2026_27: "j3", league_notes: null,
    prior_years: [
      { fiscal_year_end: "2024-01-31", revenue: j(790), wage_bill: j(330), wage_ratio: wr(330, 790), operating_profit: j(-41), profit_from_player_sales: null, pre_tax_profit: j(-24), net_debt: nd(1125, 203) },
      { fiscal_year_end: "2023-01-31", revenue: 4.78, wage_bill: 2.25, wage_ratio: 47.1, operating_profit: -0.37, profit_from_player_sales: null, pre_tax_profit: -0.27, net_debt: -0.37 },
      { fiscal_year_end: "2022-01-31", revenue: 4.25, wage_bill: 1.99, wage_ratio: 46.8, operating_profit: -0.23, profit_from_player_sales: null, pre_tax_profit: -0.16, net_debt: -0.58 },
      { fiscal_year_end: "2021-01-31", revenue: 4.15, wage_bill: 1.61, wage_ratio: 38.9, operating_profit: 0.35, profit_from_player_sales: null, pre_tax_profit: 0.46, net_debt: -0.77 },
    ],
  },
  // Kagoshima United — relegated from J2
  {
    revenue: j(1130), wage_bill: j(342), wage_ratio: wr(342, 1130),
    operating_profit: j(-26), profit_from_player_sales: j(51 - 16),
    pre_tax_profit: j(50), net_debt: nd(260, 309),
    fiscal_year_end: "2025-01-31", data_confidence: "high",
    league_2026_27: "j3", league_notes: null,
    prior_years: [
      { fiscal_year_end: "2024-01-31", revenue: j(759), wage_bill: j(232), wage_ratio: wr(232, 759), operating_profit: j(-34), profit_from_player_sales: null, pre_tax_profit: j(-36), net_debt: nd(181, 214) },
      { fiscal_year_end: "2022-01-31", revenue: 4.61, wage_bill: 1.55, wage_ratio: 33.7, operating_profit: 0.01, profit_from_player_sales: null, pre_tax_profit: 0.01, net_debt: 0.61 },
    ],
  },
  // Kamatamare Sanuki — shell record, no financial data
  {
    revenue: null, wage_bill: null, wage_ratio: null,
    operating_profit: null, profit_from_player_sales: null,
    pre_tax_profit: null, net_debt: null,
    fiscal_year_end: "2025-01-31", data_confidence: "low",
    league_2026_27: "j3", league_notes: null,
    prior_years: [],
  },
];

const J3_SLUGS: string[] = [
  "hachinohe", "fukushima-utd", "sagamihara", "matsumoto", "nagano",
  "kanazawa", "numazu", "fc-gifu", "fc-osaka", "nara",
  "tottori", "kitakyushu", "miyazaki", "ryukyu", "tochigi-city",
  "kochi", "tochigi-sc", "gunma", "kagoshima", "kamatamare-sanuki",
];

const J3_NAMES: string[] = [
  "Vanraure Hachinohe", "Fukushima United", "SC Sagamihara", "Matsumoto Yamaga FC",
  "AC Nagano Parceiro", "Zweigen Kanazawa", "Azul Claro Numazu", "FC Gifu",
  "FC Osaka", "Nara Club", "Gainare Tottori", "Giravanz Kitakyushu",
  "Tegevajaro Miyazaki", "FC Ryukyu", "Tochigi City FC", "Kochi United SC",
  "Tochigi SC", "Thespakusatsu Gunma", "Kagoshima United", "Kamatamare Sanuki",
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
