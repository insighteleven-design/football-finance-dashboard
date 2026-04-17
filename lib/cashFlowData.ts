// Generic cash flow data types and registry for all clubs.
// Data populated from Companies House annual reports.

export interface CashFlowItem {
  label: string;
  current: number; // exact £ (positive = inflow, negative = outflow)
  prior: number;   // exact £
}

export interface ClubCashFlowData {
  slug: string;
  currentFY: string; // e.g. "FY2025"
  priorFY: string;   // e.g. "FY2024"
  // Statement of Cash Flows
  operating: CashFlowItem[];
  netOperating: { current: number; prior: number };
  investing: CashFlowItem[];
  netInvesting: { current: number; prior: number };
  financing: CashFlowItem[];
  netFinancing: { current: number; prior: number };
  openingCash: { current: number; prior: number };
  closingCash: { current: number; prior: number };
  // Reconciliation note (indirect method — profit to cash from operations)
  reconciliation: CashFlowItem[] | null;
  reconciliationTitle: string | null; // e.g. "Note 32 — Cash generated from operations"
  reconciliationNote: string | null;  // footnote text (e.g. re restatements)
  // Post-balance sheet / other notes
  postBalanceSheetNote: string | null;
}

// Registry — keyed by club slug. Populated from Companies House annual reports.
export const cashFlowData: Record<string, ClubCashFlowData> = {

  // ─── Liverpool ──────────────────────────────────────────────────────────────
  // FY May 2025 / May 2024 · FRS 102 · Interest classified in operating
  // All items on face of statement — no separate reconciliation note
  liverpool: {
    slug: "liverpool",
    currentFY: "FY2025",
    priorFY: "FY2024",
    operating: [
      { label: "Operating profit / (loss)",                current:   23761000, prior:  -47658000 },
      { label: "Depreciation & amortisation",              current:  131810000, prior:  130773000 },
      { label: "Profit on disposal of registrations",      current:  -53268000, prior:  -22017000 },
      { label: "Profit on disposal of tangible assets",    current:      -9000, prior:      11000 },
      { label: "Decrease / (increase) in debtors",         current:   -4193000, prior:   -8159000 },
      { label: "Decrease / (increase) in stocks",          current:    7755000, prior:   -3625000 },
      { label: "Increase / (decrease) in creditors",       current:    4057000, prior:   34421000 },
      { label: "Interest received",                        current:     351000, prior:     376000 },
      { label: "Interest paid",                            current:   -6665000, prior:   -8689000 },
    ],
    netOperating: { current: 103599000, prior: 75433000 },
    investing: [
      { label: "Proceeds from sale of tangible assets",    current:      55000, prior:      21000 },
      { label: "Purchase of tangible assets",              current:  -19370000, prior:  -55978000 },
      { label: "Proceeds from sale of registrations",      current:   53828000, prior:   49061000 },
      { label: "Purchase of registrations",                current: -113345000, prior: -181568000 },
    ],
    netInvesting: { current: -78832000, prior: -188464000 },
    financing: [
      { label: "Bank loans (repaid) / drawn",              current:  -48946000, prior:  -10159000 },
      { label: "Intercompany loans",                       current:   19216000, prior:  127300000 },
    ],
    netFinancing: { current: -29730000, prior: 117141000 },
    openingCash: { current: 7504000, prior: 3394000 },
    closingCash: { current: 2541000, prior: 7504000 },
    reconciliation: null,
    reconciliationTitle: null,
    reconciliationNote: null,
    postBalanceSheetNote: null,
  },

  // ─── Newcastle ──────────────────────────────────────────────────────────────
  // FY Jun 2025 / Jun 2024 · FRS 102 · Interest classified in operating
  // Note: -£128,975k tangible disposal adjustment in operating = profit on St James'
  // Park leasehold sale-and-leaseback (FRS 102 operating lease; Premier League reviewing)
  newcastle: {
    slug: "newcastle",
    currentFY: "FY2025",
    priorFY: "FY2024",
    operating: [
      { label: "Profit / (loss) before tax",                       current:   34728000, prior:  -11097000 },
      { label: "Amortisation & impairment of registrations",        current:   99868000, prior:   97545000 },
      { label: "Depreciation of tangible assets",                   current:    8182000, prior:    4962000 },
      { label: "Profit on disposal of registrations",               current:  -19875000, prior:  -69816000 },
      { label: "Profit on disposal of tangible assets",             current: -128975000, prior:    -113000 },
      { label: "Profit on disposal of subsidiary",                  current:   -4158000, prior:          0 },
      { label: "Interest payable",                                  current:   11647000, prior:   14419000 },
      { label: "Interest receivable",                               current:   -2794000, prior:   -2127000 },
      { label: "Tax charge",                                        current:          0, prior:      18000 },
      { label: "Capital grants released",                           current:     -87000, prior:     -87000 },
      { label: "(Increase) / decrease in stocks",                   current:   -2227000, prior:   -2719000 },
      { label: "(Increase) / decrease in debtors",                  current:    4641000, prior:  -24614000 },
      { label: "Increase / (decrease) in creditors",                current:    8061000, prior:   17639000 },
      { label: "Increase / (decrease) in provisions",               current:   -4154000, prior:    4063000 },
      { label: "Tax paid",                                          current:          0, prior:    -203000 },
    ],
    netOperating: { current: 4857000, prior: 27870000 },
    investing: [
      { label: "Purchase of registrations",                         current: -124975000, prior: -111124000 },
      { label: "Proceeds from sale of registrations",               current:   80452000, prior:    9998000 },
      { label: "Purchase of tangible assets",                       current:  -16123000, prior:  -15133000 },
      { label: "Proceeds from sale of tangible assets",             current:      38000, prior:     150000 },
      { label: "Interest received",                                 current:     306000, prior:     500000 },
      { label: "Loan advanced to joint venture",                    current:          0, prior:    -881000 },
    ],
    netInvesting: { current: -60302000, prior: -116520000 },
    financing: [
      { label: "Share capital issued",                              current:   50000000, prior:   97000000 },
      { label: "Loan drawdowns",                                    current:    8333000, prior:          0 },
      { label: "Interest paid",                                     current:   -5616000, prior:   -6345000 },
    ],
    netFinancing: { current: 52717000, prior: 90655000 },
    openingCash: { current: 15429000, prior: 13424000 },
    closingCash: { current: 12701000, prior: 15429000 },
    reconciliation: null,
    reconciliationTitle: null,
    reconciliationNote: null,
    postBalanceSheetNote:
      "St James' Park: in FY2025, Newcastle sold its leasehold interest in the stadium via a sale-and-leaseback. The £128.98m profit on disposal is eliminated within operating cash flow as a non-cash adjustment. The Premier League is reviewing the £172.1m premium recognised in the transaction.",
  },

  // ─── Nottingham Forest ──────────────────────────────────────────────────────
  // FY Jun 2025 / Jun 2024 · FRS 102 · Interest classified in investing (not operating)
  // Opening/closing cash figures are stated net of overdraft
  nottm_forest: {
    slug: "nottm_forest",
    currentFY: "FY2025",
    priorFY: "FY2024",
    operating: [
      { label: "Cash absorbed by operations (Note 30)", current: -2144000, prior: -24141000 },
    ],
    netOperating: { current: -2144000, prior: -24141000 },
    investing: [
      { label: "Purchase of player registrations",       current:  -73487000, prior:  -72456000 },
      { label: "Proceeds from player registrations",     current:   15876000, prior:   18665000 },
      { label: "Purchase of tangible fixed assets",      current:  -10648000, prior:  -10288000 },
      { label: "Proceeds from tangible fixed assets",    current:     131000, prior:     200000 },
      { label: "Interest paid",                          current:   -9049000, prior:   -8073000 },
      { label: "Interest received",                      current:       5000, prior:      16000 },
    ],
    netInvesting: { current: -77172000, prior: -71936000 },
    financing: [
      { label: "Loan from NF Football Investments Ltd",  current:   89070000, prior:   58795000 },
      { label: "Hire purchase repayments",               current:    -367000, prior:    -155000 },
      { label: "Other loans received",                   current:   78381000, prior:   38521000 },
      { label: "Other loans repaid",                     current:  -63081000, prior:          0 },
    ],
    netFinancing: { current: 104003000, prior: 97161000 },
    openingCash: { current: -11463000, prior: -12547000 },
    closingCash: { current: 13224000, prior: -11463000 },
    reconciliation: [
      { label: "Loss / profit before tax",                        current:  -78921000, prior:   12099000 },
      { label: "Finance costs",                                   current:    9049000, prior:    8073000 },
      { label: "Investment income",                               current:      -5000, prior:     -16000 },
      { label: "Amortisation & impairment of registrations",      current:   74205000, prior:   61685000 },
      { label: "Depreciation of tangible assets",                 current:    1894000, prior:    1159000 },
      { label: "Profit on disposal of registrations",             current:   -7017000, prior: -100531000 },
      { label: "(Increase) / decrease in stocks",                 current:   -1275000, prior:     395000 },
      { label: "(Increase) / decrease in debtors",                current:   62615000, prior:  -12915000 },
      { label: "Increase / (decrease) in creditors",              current:  -62689000, prior:    5910000 },
    ],
    reconciliationTitle: "Note 30 — Cash absorbed by operations",
    reconciliationNote:
      "Opening and closing cash balances are stated net of bank overdraft. FY2025: cash £13,224k, overdraft £nil. FY2024: cash £29k, overdraft £11,492k (net: -£11,463k).",
    postBalanceSheetNote: null,
  },

  // ─── Tottenham ──────────────────────────────────────────────────────────────
  // FY Jun 2025 / Jun 2024 · IFRS · Interest classified in operating
  // All items on face of statement — no separate reconciliation note
  tottenham: {
    slug: "tottenham",
    currentFY: "FY2025",
    priorFY: "FY2024",
    operating: [
      { label: "Operating loss / profit",                      current:  -50398000, prior:   21287000 },
      { label: "Amortisation of intangible assets",            current:  141851000, prior:  136287000 },
      { label: "Impairment of intangible assets",              current:          0, prior:    1822000 },
      { label: "Profit on disposal of intangible assets",      current:  -52565000, prior:  -82305000 },
      { label: "Profit / (loss) on disposal of PPE",           current:    -110000, prior:       6000 },
      { label: "Depreciation of PPE",                          current:   56948000, prior:   68796000 },
      { label: "Release of capital grants",                    current:    2108000, prior:    1806000 },
      { label: "Foreign exchange movements",                   current:    1685000, prior:   -2148000 },
      { label: "Movement in financial assets",                 current:      -9000, prior:      21000 },
      { label: "(Increase) / decrease in receivables",         current:   -4006000, prior:    2579000 },
      { label: "(Increase) / decrease in inventories",         current:   -2387000, prior:   -2023000 },
      { label: "Increase / (decrease) in payables",            current:   -1084000, prior:  -25706000 },
      { label: "Interest paid",                                current:  -28912000, prior:  -29742000 },
      { label: "Interest received",                            current:      46000, prior:    1141000 },
      { label: "Tax received",                                 current:          0, prior:     692000 },
      { label: "Lease interest paid",                          current:    -866000, prior:    -833000 },
    ],
    netOperating: { current: 62301000, prior: 91680000 },
    investing: [
      { label: "Purchase of PPE",                              current:  -23811000, prior:  -43300000 },
      { label: "Proceeds from sale of PPE",                    current:      27000, prior:       7000 },
      { label: "Purchase of intangible assets (registrations)", current: -197161000, prior: -223637000 },
      { label: "Proceeds from sale of intangible assets",      current:   66968000, prior:   81600000 },
    ],
    netInvesting: { current: -153977000, prior: -185330000 },
    financing: [
      { label: "Lease liability payments",                     current:   -1885000, prior:   -1259000 },
      { label: "Share capital issued",                         current:   35000000, prior:          0 },
    ],
    netFinancing: { current: 33115000, prior: -1259000 },
    openingCash: { current: 78974000, prior: 173883000 },
    closingCash: { current: 20413000, prior: 78974000 },
    reconciliation: null,
    reconciliationTitle: null,
    reconciliationNote: null,
    postBalanceSheetNote: null,
  },

  // ─── Burnley ────────────────────────────────────────────────────────────────
  // FY Jul 2024 / Jul 2023 · FRS 102
  burnley: {
    slug: "burnley",
    currentFY: "FY2024",
    priorFY: "FY2023",
    operating: [
      { label: "Cash absorbed by operations (Note 30)", current:  -4849000, prior: -14132000 },
      { label: "Interest paid",                         current: -10492000, prior:  -4444000 },
      { label: "Tax refund received",                   current:         0, prior:   3685000 },
    ],
    netOperating: { current: -15341000, prior: -14891000 },
    investing: [
      { label: "Purchase of intangible assets",         current: -61235000, prior: -48362000 },
      { label: "Proceeds from sale of intangibles",     current:  30528000, prior:  45906000 },
      { label: "Purchase of tangible assets",           current:  -3221000, prior:  -1360000 },
      { label: "Group loans advanced",                  current:         0, prior:  -9700000 },
      { label: "Interest received",                     current:    520000, prior:    361000 },
    ],
    netInvesting: { current: -33408000, prior: -13155000 },
    financing: [
      { label: "Borrowings received",                   current:   3208000, prior:  36309000 },
      { label: "Borrowings repaid",                     current: -13876000, prior: -22673000 },
      { label: "Bank loans received",                   current: 111000000, prior:  70000000 },
      { label: "Bank loans repaid",                     current: -88810000, prior: -45000000 },
      { label: "Lease liability payments",              current:   -925000, prior:  -1918000 },
      { label: "Group loans received / (repaid)",       current:  26517000, prior:  -1000000 },
    ],
    netFinancing: { current: 37114000, prior: 35718000 },
    openingCash: { current: 20545000, prior: 12873000 },
    closingCash: { current: 8910000, prior: 20545000 },
    reconciliation: [
      { label: "Loss before tax",                       current: -24431000, prior: -27943000 },
      { label: "Tax charge",                            current:  -4016000, prior:  -8056000 },
      { label: "Finance costs",                         current:  19025000, prior:   9499000 },
      { label: "Investment income",                     current:  -2064000, prior:  -2804000 },
      { label: "Profit on disposal of intangibles",     current: -15059000, prior: -11399000 },
      { label: "Amortisation of intangible assets",     current:  42615000, prior:  22115000 },
      { label: "Depreciation of tangible assets",       current:   2629000, prior:   2412000 },
      { label: "Decrease / (increase) in stocks",       current:    380000, prior:    -459000 },
      { label: "(Increase) / decrease in debtors",      current:  -4574000, prior:   1322000 },
      { label: "Increase / (decrease) in creditors",    current: -19354000, prior:   1181000 },
    ],
    reconciliationTitle: "Note 30 — Cash absorbed by operations",
    reconciliationNote:
      "Prior year (FY2023) restated for loan fee reclassification — no cash impact.",
    postBalanceSheetNote: null,
  },

  // ─── Leeds United ───────────────────────────────────────────────────────────
  // FY Jun 2025 / Jun 2024 · FRS 102
  // All items on face of statement — no separate reconciliation note
  leeds: {
    slug: "leeds",
    currentFY: "FY2025",
    priorFY: "FY2024",
    operating: [
      { label: "Loss before tax",                                   current:  -49178000, prior:  -60811000 },
      { label: "Depreciation of tangible assets",                   current:    6200000, prior:    4856000 },
      { label: "Amortisation of intangible assets",                 current:   45728000, prior:   59590000 },
      { label: "Impairment of intangible assets",                   current:    3014000, prior:    7475000 },
      { label: "Profit on disposal of registrations",               current:  -24766000, prior:  -33694000 },
      { label: "Interest receivable",                               current:   -6528000, prior:   -3395000 },
      { label: "Interest payable",                                  current:   12070000, prior:   21647000 },
      { label: "Movement in accrued expenses & other items",        current:   22643000, prior:  -27444000 },
      { label: "(Increase) / decrease in stocks",                   current:    4764000, prior:    5485000 },
      { label: "(Increase) / decrease in debtors",                  current:  -44456000, prior:  -13994000 },
      { label: "Increase / (decrease) in creditors",                current:   -9905000, prior:  -50651000 },
      { label: "Interest paid",                                     current:   -3389000, prior:   -1510000 },
      { label: "Interest received",                                 current:     573000, prior:     291000 },
    ],
    netOperating: { current: -43229000, prior: -92155000 },
    investing: [
      { label: "Purchase of tangible assets",                       current:  -12346000, prior:   -4760000 },
      { label: "Proceeds from sale of tangible assets",             current:          0, prior:      11000 },
      { label: "Purchase of player registrations",                  current:  -95890000, prior:  -84222000 },
      { label: "Proceeds from sale of player registrations",        current:   64822000, prior:   17218000 },
    ],
    netInvesting: { current: -43414000, prior: -71753000 },
    financing: [
      { label: "Borrowings received",                               current:   34239000, prior:   33468000 },
      { label: "Borrowings repaid",                                 current:  -26583000, prior:  -24075000 },
      { label: "Group loans received",                              current:     264000, prior:   21856000 },
      { label: "Group loans repaid",                                current:          0, prior:   -4583000 },
      { label: "Lease liability payments",                          current:    -330000, prior:     -45000 },
      { label: "Capital contribution",                              current:  107996000, prior:  140736000 },
    ],
    netFinancing: { current: 115587000, prior: 167357000 },
    openingCash: { current: 5009000, prior: 1561000 },
    closingCash: { current: 33953000, prior: 5009000 },
    reconciliation: null,
    reconciliationTitle: null,
    reconciliationNote: null,
    postBalanceSheetNote: null,
  },

  // ─── Bournemouth ────────────────────────────────────────────────────────────
  // FY Jun 2025 / Jun 2024 · IFRS (first year applying IFRS)
  // Interest classified in operating (IFRS elected treatment)
  bournemouth: {
    slug: "bournemouth",
    currentFY: "FY2025",
    priorFY: "FY2024",
    operating: [
      { label: "Net cash generated from operating activities (Note 32)", current: 31871000, prior: 8617000 },
    ],
    netOperating: { current: 31871000, prior: 8617000 },
    investing: [
      { label: "Purchase of intangible assets (registrations)",  current:  -88874000, prior: -100801000 },
      { label: "Purchase of property, plant & equipment",        current:  -17676000, prior:  -23455000 },
      { label: "Proceeds from sale of intangible assets",        current:   34137000, prior:    6958000 },
      { label: "Capitalised borrowing costs",                    current:   -1035000, prior:    -996000 },
    ],
    netInvesting: { current: -73448000, prior: -118294000 },
    financing: [
      { label: "Secured loans received",                         current:   46909000, prior:   17200000 },
      { label: "Other loan repayments",                          current:  -42700000, prior:   -5149000 },
      { label: "Other new loans received",                       current:    9700000, prior:   98800000 },
      { label: "Share capital issued",                           current:   67800000, prior:           0 },
    ],
    netFinancing: { current: 81709000, prior: 110851000 },
    openingCash: { current: 7104000, prior: 5930000 },
    closingCash: { current: 47236000, prior: 7104000 },
    reconciliation: [
      { label: "Profit / (loss) before tax",                     current:   14887000, prior:  -66265000 },
      { label: "Interest income",                                current:   -5312000, prior:    -191000 },
      { label: "Finance costs",                                  current:   18699000, prior:   10502000 },
      { label: "Amortisation of registrations",                  current:   69165000, prior:   61616000 },
      { label: "Depreciation of tangible assets",                current:    2494000, prior:    1896000 },
      { label: "Depreciation of right-of-use assets",            current:     495000, prior:     495000 },
      { label: "Rent paid on short-term leases",                 current:    -643000, prior:    -643000 },
      { label: "Lease interest paid",                            current:     230000, prior:     260000 },
      { label: "Interest paid",                                  current:   -4872000, prior:    -693000 },
      { label: "Interest received",                              current:     206000, prior:           0 },
      { label: "(Increase) / decrease in inventories",           current:    -325000, prior:     240000 },
      { label: "(Increase) / decrease in receivables",           current:   -6696000, prior:   -2881000 },
      { label: "Increase / (decrease) in payables",             current:   34498000, prior:    4570000 },
      { label: "Increase / (decrease) in provisions",           current:      62000, prior:     -40000 },
      { label: "Reversal of impairment",                         current:          0, prior:       2000 },
      { label: "Profit on disposal of registrations",            current:  -91017000, prior:    -251000 },
    ],
    reconciliationTitle: "Note 32 — Cash generated from operating activities",
    reconciliationNote:
      "IFRS adopted for the first time in FY2025. FY2024 comparatives restated under IFRS: loss difference -£114k, equity difference -£27k, primarily from IFRS 16 lease recognition.",
    postBalanceSheetNote: null,
  },

  // ─── Brentford ──────────────────────────────────────────────────────────────
  // FY Jun 2025 / Jun 2024 · FRS 102
  // Cash balances stated net of bank overdraft throughout
  brentford: {
    slug: "brentford",
    currentFY: "FY2025",
    priorFY: "FY2024",
    operating: [
      { label: "Cash generated from operations (Note 1)", current:  4912000, prior: 21461000 },
      { label: "Net interest paid",                       current: -2697000, prior: -1200000 },
    ],
    netOperating: { current: 2215000, prior: 20261000 },
    investing: [
      { label: "Purchase of intangible assets",           current: -77892000, prior: -58558000 },
      { label: "Purchase of tangible assets",             current: -15847000, prior:  -7918000 },
      { label: "Proceeds from sale of intangibles",       current:  46324000, prior:   1894000 },
      { label: "Proceeds from sale of tangibles",         current:   7500000, prior:          0 },
    ],
    netInvesting: { current: -39915000, prior: -64582000 },
    financing: [
      { label: "Shareholder loans issued",                current:  23000000, prior:          0 },
      { label: "Shareholder loans repaid",                current: -23000000, prior:          0 },
      { label: "Bank loans issued",                       current:  42406000, prior:          0 },
      { label: "Other loans received",                    current:   1000000, prior:      2000 },
      { label: "Other loans repaid",                      current:  -1000000, prior:          0 },
    ],
    netFinancing: { current: 42406000, prior: 2000 },
    openingCash: { current: -29277000, prior: 15042000 },
    closingCash: { current: -24571000, prior: -29277000 },
    reconciliation: [
      { label: "Loss before tax",                         current: -20527000, prior:  -7873000 },
      { label: "Depreciation of tangible assets",         current:  11390000, prior:   8694000 },
      { label: "Amortisation of intangible assets",       current:  47872000, prior:  35631000 },
      { label: "Profit on disposal of intangibles",       current: -27236000, prior: -25198000 },
      { label: "Profit on disposal of tangibles",         current:  -8796000, prior:          0 },
      { label: "Interest payable",                        current:  10446000, prior:   5020000 },
      { label: "Interest receivable",                     current:  -2680000, prior:  -1168000 },
      { label: "Foreign exchange movements",              current:    736000, prior:          0 },
      { label: "(Increase) / decrease in inventories",    current:   -280000, prior:     -27000 },
      { label: "(Increase) / decrease in debtors",        current: -12623000, prior:   2530000 },
      { label: "Increase / (decrease) in creditors",      current:   6707000, prior:   3804000 },
      { label: "Increase / (decrease) in provisions",     current:    -97000, prior:      48000 },
    ],
    reconciliationTitle: "Note 1 — Cash generated from operations",
    reconciliationNote: null,
    postBalanceSheetNote:
      "Cash balances are stated net of overdraft throughout. FY2025: gross cash £1,977k, overdraft £26,548k (net: -£24,571k). FY2024: gross cash £7,470k, overdraft £36,747k (net: -£29,277k). Post year-end: new £100m Macquarie facility arranged; Barclays overdraft repaid. New minority equity investment used to repay preference share capital.",
  },

  // ─── Everton ────────────────────────────────────────────────────────────────
  // FY Jun 2025 / Jun 2024 · FRS 102
  // All items on face of statement — no separate reconciliation note
  everton: {
    slug: "everton",
    currentFY: "FY2025",
    priorFY: "FY2024",
    operating: [
      { label: "Loss before tax",                                  current:   -8609000, prior:  -53222000 },
      { label: "Profit on disposal of registrations",              current:  -31325000, prior:  -48545000 },
      { label: "Profit on disposal of tangible assets",            current:      -4000, prior:      -4000 },
      { label: "Depreciation of tangible assets",                  current:   2613000, prior:   3737000 },
      { label: "Amortisation of capital grants",                   current:   -709000, prior:    -208000 },
      { label: "Amortisation of registrations",                    current:  50901000, prior:  64581000 },
      { label: "Interest receivable",                              current:  -1471000, prior:   -1377000 },
      { label: "Interest payable",                                 current:  14637000, prior:  10460000 },
      { label: "Tax charge",                                       current:          0, prior:          0 },
      { label: "(Increase) / decrease in working capital",         current:  26033000, prior:  -24578000 },
      { label: "(Increase) / decrease in debtors",                 current: -62156000, prior:     980000 },
      { label: "Increase / (decrease) in creditors",               current:  38524000, prior:  20624000 },
      { label: "Increase / (decrease) in provisions",              current:     96000, prior:    -159000 },
    ],
    netOperating: { current: 2497000, prior: -3133000 },
    investing: [
      { label: "Proceeds from disposal of registrations",          current: 116015000, prior:  80223000 },
      { label: "Proceeds from disposal of tangible assets",        current:      4000, prior:       4000 },
      { label: "Purchase of registrations",                        current: -58870000, prior:  -57664000 },
      { label: "Purchase of tangible assets",                      current: -77605000, prior: -210522000 },
      { label: "Interest received",                                current:    672000, prior:           0 },
      { label: "Interest paid",                                    current: -17422000, prior:  -39338000 },
    ],
    netInvesting: { current: -37206000, prior: -227297000 },
    financing: [
      { label: "Interest paid",                                    current:  -6961000, prior:   -4287000 },
      { label: "Loan repayments",                                  current: -385612000, prior: -179290000 },
      { label: "New loans received",                               current: 480000000, prior:  429594000 },
    ],
    netFinancing: { current: 87427000, prior: 246017000 },
    openingCash: { current: 26423000, prior: 10836000 },
    closingCash: { current: 79141000, prior: 26423000 },
    reconciliation: null,
    reconciliationTitle: null,
    reconciliationNote: null,
    postBalanceSheetNote: null,
  },
};
