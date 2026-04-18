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

  // ─── Watford ────────────────────────────────────────────────────────────────
  // FY Jun 2025 / Jun 2024 · FRS 102 · Values in £ (net of overdraft)
  watford: {
    slug: "watford",
    currentFY: "FY2025",
    priorFY: "FY2024",
    operating: [
      { label: "Cash absorbed by operations",  current:   -175000, prior:        0 },
      { label: "Interest paid",                current:   -519000, prior:        0 },
    ],
    netOperating:  { current:    -694000, prior:   -5217000 },
    investing: [
      { label: "Purchase of intangible assets",     current:  -2048000, prior:        0 },
      { label: "Proceeds from sale of intangibles", current:  17194000, prior:        0 },
      { label: "Purchase of tangible assets",       current:   -228000, prior:        0 },
    ],
    netInvesting:  { current:  14918000, prior:  24573000 },
    financing: [
      { label: "Group loans (net)",           current:   1789000, prior:        0 },
      { label: "Repayment of other loans",    current: -13922000, prior:        0 },
      { label: "Finance lease payments",      current:   -167000, prior:        0 },
    ],
    netFinancing:  { current: -12300000, prior: -27552000 },
    openingCash:   { current:   -617000, prior:   7579000 },
    closingCash:   { current:   1307000, prior:   -617000 },
    reconciliation: null,
    reconciliationTitle: null,
    reconciliationNote: "Opening and closing cash stated net of overdraft. Prior year line-by-line breakdown not available; prior totals shown.",
    postBalanceSheetNote: null,
  },

  // ─── Blackburn Rovers ───────────────────────────────────────────────────────
  // FY Jun 2025 / Jun 2024 · FRS 102 · Indirect method · Net of overdraft
  blackburn: {
    slug: "blackburn",
    currentFY: "FY2025",
    priorFY: "FY2024",
    operating: [
      { label: "Net cash absorbed by operating activities", current: -20216378, prior: -13480850 },
    ],
    netOperating:  { current: -20216378, prior: -13480850 },
    investing: [
      { label: "Net cash from investing activities",        current:  15713582, prior:   8226507 },
    ],
    netInvesting:  { current:  15713582, prior:   8226507 },
    financing: [
      { label: "Net cash from financing activities",        current:   4571862, prior:   7585213 },
    ],
    netFinancing:  { current:   4571862, prior:   7585213 },
    openingCash:   { current: -12635600, prior: -14966470 },
    closingCash:   { current: -12566534, prior: -12635600 },
    reconciliation: null,
    reconciliationTitle: null,
    reconciliationNote: "Cash and cash equivalents stated net of bank overdraft throughout.",
    postBalanceSheetNote: null,
  },

  // ─── Wrexham ────────────────────────────────────────────────────────────────
  // FY Jun 2025 / Jun 2024 · FRS 102 · Values in £
  wrexham: {
    slug: "wrexham",
    currentFY: "FY2025",
    priorFY: "FY2024",
    operating: [
      { label: "Cash absorbed by operations",  current:  -5642452, prior: 0 },
      { label: "Interest paid",                current:   -406447, prior: 0 },
    ],
    netOperating:  { current:  -6048899, prior:   1831620 },
    investing: [
      { label: "Purchase of intangible assets",     current:  -8517773, prior: 0 },
      { label: "Purchase of tangible assets",       current:  -8950698, prior: 0 },
      { label: "Interest received",                 current:     11484, prior: 0 },
    ],
    netInvesting:  { current: -17456987, prior:  -3843143 },
    financing: [
      { label: "Proceeds from share issue",         current:  35783111, prior: 0 },
      { label: "Repayment of borrowings",           current: -10682572, prior: 0 },
      { label: "Bank loans received",               current:    638687, prior: 0 },
    ],
    netFinancing:  { current:  25739226, prior:   1695536 },
    openingCash:   { current:   1085956, prior:   1401943 },
    closingCash:   { current:   3319296, prior:   1085956 },
    reconciliation: null,
    reconciliationTitle: null,
    reconciliationNote: "Prior year line-by-line breakdown not available; prior totals shown.",
    postBalanceSheetNote: null,
  },

  // ─── Sheffield Wednesday ────────────────────────────────────────────────────
  // FY Jul 2024 / Jul 2023 · FRS 102 · Values in £'000 (converted to £)
  sheff_wed: {
    slug: "sheff_wed",
    currentFY: "FY2024",
    priorFY: "FY2023",
    operating: [
      { label: "Cash absorbed by operations (Note 28)", current: -8877000, prior: 0 },
      { label: "Interest paid",                          current:  -766000, prior: 0 },
      { label: "Tax refund received",                    current:   175000, prior: 0 },
    ],
    netOperating:  { current:  -9468000, prior:  -9956000 },
    investing: [
      { label: "Purchase of intangible assets",          current: -1584000, prior: 0 },
      { label: "Proceeds from sale of intangibles",      current:   122000, prior: 0 },
      { label: "Purchase of tangible assets",            current:  -397000, prior: 0 },
      { label: "Proceeds from sale of tangibles",        current:    11000, prior: 0 },
      { label: "Interest received",                      current:    13000, prior: 0 },
      { label: "Deferred proceeds — stadium",            current:        0, prior: 15000000 },
    ],
    netInvesting:  { current:  -1835000, prior:  14972000 },
    financing: [
      { label: "New loans received",                     current:   557000, prior: 0 },
      { label: "Loan from controlling party",            current: 10137000, prior: 0 },
      { label: "Finance lease payments",                 current:   -91000, prior: 0 },
    ],
    netFinancing:  { current:  10603000, prior:  -5044000 },
    openingCash:   { current:    856000, prior:    884000 },
    closingCash:   { current:    156000, prior:    856000 },
    reconciliation: null,
    reconciliationTitle: null,
    reconciliationNote: "Prior year investing includes £15m deferred proceeds from stadium asset. Prior year operating and financing line-by-line breakdown not available; prior totals shown.",
    postBalanceSheetNote: null,
  },

  // ─── Hull City ──────────────────────────────────────────────────────────────
  // FY Jun 2025 / Jun 2024 · FRS 102 · Values in £
  hull: {
    slug: "hull",
    currentFY: "FY2025",
    priorFY: "FY2024",
    operating: [
      { label: "Cash absorbed by operations (Note 29)", current: -15725326, prior: 0 },
      { label: "Tax refund received",                    current:    178045, prior: 0 },
    ],
    netOperating:  { current: -15547281, prior: -28501031 },
    investing: [
      { label: "Purchase of intangible assets",          current: -30259258, prior: 0 },
      { label: "Proceeds from sale of intangibles",      current:  36584300, prior: 0 },
      { label: "Purchase of tangible assets",            current:   -113219, prior: 0 },
      { label: "Interest received",                      current:   1540869, prior: 0 },
    ],
    netInvesting:  { current:   7752692, prior:   2553224 },
    financing: [
      { label: "Proceeds from borrowings",               current:  10987093, prior: 0 },
      { label: "Finance lease payments",                 current:    -43415, prior: 0 },
      { label: "Interest paid",                          current:  -3136147, prior: 0 },
    ],
    netFinancing:  { current:   7807531, prior:  25514426 },
    openingCash:   { current:     80064, prior:    513445 },
    closingCash:   { current:     93006, prior:     80064 },
    reconciliation: null,
    reconciliationTitle: null,
    reconciliationNote: "Prior year line-by-line breakdown not available; prior totals shown.",
    postBalanceSheetNote: null,
  },

  // ─── Oxford United ──────────────────────────────────────────────────────────
  // FY Jun 2025 / Jun 2024 · FRS 102 · Values in £
  oxford_utd: {
    slug: "oxford_utd",
    currentFY: "FY2025",
    priorFY: "FY2024",
    operating: [
      { label: "Cash generated from operations (Note 27)", current:  5661548, prior: 0 },
      { label: "Interest paid",                             current:   -30595, prior: 0 },
    ],
    netOperating:  { current:  5630953, prior:  1684001 },
    investing: [
      { label: "Purchase of intangible assets",             current: -5178058, prior: 0 },
      { label: "Proceeds from sale of intangibles",         current:   511138, prior: 0 },
      { label: "Purchase of tangible assets",               current: -1047966, prior: 0 },
      { label: "Interest received",                         current:    11179, prior: 0 },
    ],
    netInvesting:  { current: -5703707, prior: -1261848 },
    financing: [
      { label: "Repayment of bank loans",                   current:   -10000, prior: 0 },
      { label: "Finance lease payments",                    current:  -145202, prior: 0 },
    ],
    netFinancing:  { current:  -155202, prior:  -203742 },
    openingCash:   { current:   470625, prior:   252214 },
    closingCash:   { current:   242669, prior:   470625 },
    reconciliation: null,
    reconciliationTitle: null,
    reconciliationNote: "Prior year line-by-line breakdown not available; prior totals shown.",
    postBalanceSheetNote: null,
  },

  // ─── Derby County ───────────────────────────────────────────────────────────
  // FY Jun 2025 / Jun 2024 · FRS 102 · Values in £
  derby: {
    slug: "derby",
    currentFY: "FY2025",
    priorFY: "FY2024",
    operating: [
      { label: "Net cash absorbed by operating activities", current: -17050875, prior: -14797302 },
    ],
    netOperating:  { current: -17050875, prior: -14797302 },
    investing: [
      { label: "Net cash from investing activities",         current:   1324741, prior:   -202483 },
    ],
    netInvesting:  { current:   1324741, prior:   -202483 },
    financing: [
      { label: "Loans from parent company",                 current:  16250000, prior: 0 },
      { label: "Interest paid",                             current:     -3375, prior: 0 },
    ],
    netFinancing:  { current:  16246625, prior:  11815367 },
    openingCash:   { current:   1096012, prior:   4280430 },
    closingCash:   { current:   1616503, prior:   1096012 },
    reconciliation: null,
    reconciliationTitle: null,
    reconciliationNote: "Derby re-entered the EFL in Aug 2021 under administration; administration ended Oct 2022 under new ownership. Financing is entirely parent-company loans. Prior year financing breakdown not available.",
    postBalanceSheetNote: null,
  },

  // ─── Norwich City ───────────────────────────────────────────────────────────
  // FY Jun 2025 / Jun 2024 · FRS 102 · Group consolidated · Values in £'000 (converted to £)
  norwich: {
    slug: "norwich",
    currentFY: "FY2025",
    priorFY: "FY2024",
    operating: [
      { label: "Cash used in operations",  current: -26914000, prior: 0 },
      { label: "Interest received",        current:     57000, prior: 0 },
      { label: "Interest paid",            current:  -1291000, prior: 0 },
    ],
    netOperating:  { current: -28148000, prior:  -5981000 },
    investing: [
      { label: "Purchase of intangible assets",     current: -21642000, prior: 0 },
      { label: "Purchase of tangible assets",       current:  -2310000, prior: 0 },
      { label: "Proceeds from sale of intangibles", current:  23205000, prior: 0 },
    ],
    netInvesting:  { current:   -747000, prior:   1733000 },
    financing: [
      { label: "Directors' loan received",              current:  34717000, prior: 0 },
      { label: "Short-term loan capital received",      current:   6013000, prior: 0 },
      { label: "Short-term loan capital repayments",    current: -11625000, prior: 0 },
    ],
    netFinancing:  { current:  29105000, prior:   3743000 },
    openingCash:   { current:   1790000, prior:   2295000 },
    closingCash:   { current:   2000000, prior:   1790000 },
    reconciliation: null,
    reconciliationTitle: null,
    reconciliationNote: "Group consolidated accounts (Norwich City Football Club plc). Prior year line-by-line breakdown not available; prior totals shown.",
    postBalanceSheetNote: null,
  },

  // ─── Portsmouth ─────────────────────────────────────────────────────────────
  // FY Jun 2025 / Jun 2024 · FRS 102 · Values in £'000 (converted to £)
  portsmouth: {
    slug: "portsmouth",
    currentFY: "FY2025",
    priorFY: "FY2024",
    operating: [
      { label: "Cash absorbed by operations",  current: -1739000, prior: -2650000 },
      { label: "Interest paid",                current:    -5000, prior:        0 },
    ],
    netOperating:  { current: -1744000, prior: -2650000 },
    investing: [
      { label: "Purchase of intangible assets",     current: -4040000, prior: -1007000 },
      { label: "Proceeds from sale of intangibles", current:   620000, prior:   420000 },
      { label: "Purchase of tangible assets",       current: -3855000, prior: -5454000 },
    ],
    netInvesting:  { current: -7275000, prior: -6041000 },
    financing: [
      { label: "Funding received from owners",      current:  8000000, prior: 9000000 },
      { label: "Finance lease payments",            current:   -60000, prior:   -4000 },
    ],
    netFinancing:  { current:  7940000, prior:  8996000 },
    openingCash:   { current:  3122000, prior:  2817000 },
    closingCash:   { current:  2043000, prior:  3122000 },
    reconciliation: null,
    reconciliationTitle: null,
    reconciliationNote: null,
    postBalanceSheetNote: null,
  },

  // ─── Birmingham City ────────────────────────────────────────────────────────
  // FY Jun 2025 / Jun 2024 · FRS 102 · Values in £ (full)
  // League One in 2024/25; compare_division set to league-one in clubs.ts
  birmingham: {
    slug: "birmingham",
    currentFY: "FY2025",
    priorFY: "FY2024",
    operating: [
      { label: "Cash used in operations (Note 1)", current:  1580146, prior: -22505941 },
      { label: "Corporation tax received",          current:        0, prior:    371454 },
    ],
    netOperating:  { current:  1580146, prior: -22134487 },
    investing: [
      { label: "Purchase of intangible assets",     current: -26076851, prior:  -3947940 },
      { label: "Purchase of tangible assets",       current: -19857694, prior: -26211648 },
      { label: "Proceeds from sale of intangibles", current:   8283860, prior:  10409198 },
      { label: "Interest received",                 current:    870059, prior:    843003 },
    ],
    netInvesting:  { current: -36780626, prior: -18907387 },
    financing: [
      { label: "New loans received",                current:  53084843, prior:  55170495 },
      { label: "Loan repayments",                   current:         0, prior:  -3145165 },
      { label: "Interest paid",                     current: -10279565, prior:  -2176797 },
      { label: "Finance lease payments",            current:  -2043010, prior:  -1767859 },
    ],
    netFinancing:  { current:  40762268, prior:  48080674 },
    openingCash:   { current:   8671807, prior:   1633007 },
    closingCash:   { current:  14233595, prior:   8671807 },
    reconciliation: [
      { label: "Loss before income tax",                  current: -34559453, prior: -16081826 },
      { label: "Depreciation",                            current:   4442009, prior:   2618065 },
      { label: "Profit on sale of player registrations",  current: -14267841, prior: -15405191 },
      { label: "Amortisation",                            current:   6830337, prior:   4382419 },
      { label: "Finance costs",                           current:  10279565, prior:   3097744 },
      { label: "Finance income",                          current:   -870059, prior:    -843003 },
      { label: "(Increase) in inventories",               current:   -714990, prior:  -1288830 },
      { label: "(Increase)/decrease in receivables",      current: -4965964, prior:  -7600225 },
      { label: "Increase/(decrease) in payables",         current:  35406542, prior:   8614906 },
    ],
    reconciliationTitle: "Note 1 — Reconciliation of loss to cash from operations",
    reconciliationNote: null,
    postBalanceSheetNote: null,
  },

  // ─── Ipswich Town ───────────────────────────────────────────────────────────
  // FY Jun 2025 / Jun 2024 · FRS 102 · Values in £'000 (converted to £)
  // FY2025 = Premier League season; FY2024 = Championship season (promoted)
  ipswich: {
    slug: "ipswich",
    currentFY: "FY2025",
    priorFY: "FY2024",
    operating: [
      { label: "Cash generated / (absorbed) by operations (Note 29)", current:  74084000, prior: -7580000 },
      { label: "Interest paid",                                        current:    -88000, prior:   -25000 },
    ],
    netOperating:  { current:  73996000, prior:  -7605000 },
    investing: [
      { label: "Purchase of intangible assets",     current: -119701000, prior: -26295000 },
      { label: "Proceeds from sale of intangibles", current:   32237000, prior:   1226000 },
      { label: "Purchase of tangible assets",       current:  -21323000, prior:  -5825000 },
      { label: "Proceeds from sale of tangibles",   current:          0, prior:     -2000 },
    ],
    netInvesting:  { current: -108787000, prior: -30896000 },
    financing: [
      { label: "Proceeds from issue of shares",     current:          0, prior: 39200000 },
      { label: "Cash in advance of share issue",    current:   44500000, prior:        0 },
      { label: "Repayment of borrowings",           current:    -343000, prior:    -3000 },
      { label: "Finance lease payments",            current:     976000, prior:        0 },
    ],
    netFinancing:  { current:  45133000, prior:  39197000 },
    openingCash:   { current:   3328000, prior:   2632000 },
    closingCash:   { current:  13670000, prior:   3328000 },
    reconciliation: null,
    reconciliationTitle: null,
    reconciliationNote: null,
    postBalanceSheetNote: null,
  },

  // ─── Leicester City ─────────────────────────────────────────────────────────
  // FY Jun 2024 / 13m to Jun 2022 · FRS 102 · Group consolidated · Values in £'000 (converted to £)
  // Comparative is the 13-month period to Jun 2022 (year-end changed from May to June)
  leicester: {
    slug: "leicester",
    currentFY: "FY2024",
    priorFY: "13m to Jun 2022",
    operating: [
      { label: "Net cash absorbed by operating activities (Note 20)", current: -31850000, prior: -54166000 },
    ],
    netOperating:  { current: -31850000, prior: -54166000 },
    investing: [
      { label: "Purchase of tangible assets",       current:  -1993000, prior:  -2552000 },
      { label: "Purchase of intangible assets",     current: -44466000, prior: -56121000 },
      { label: "Proceeds from sale of tangibles",   current:      1000, prior:        0 },
      { label: "Proceeds from sale of intangibles", current:  56082000, prior:  49716000 },
      { label: "Interest received",                 current:    563000, prior:        0 },
    ],
    netInvesting:  { current:  10187000, prior:  -8957000 },
    financing: [
      { label: "Loan amounts received",             current:  79895000, prior: 101759000 },
      { label: "Repayment of external loans",       current: -55931000, prior: -59433000 },
      { label: "Interest paid",                     current:  -3448000, prior:  -5190000 },
    ],
    netFinancing:  { current:  20516000, prior:  37136000 },
    openingCash:   { current:   8235000, prior:  34222000 },
    closingCash:   { current:   7088000, prior:   8235000 },
    reconciliation: null,
    reconciliationTitle: null,
    reconciliationNote: "Comparative period is the 13 months ended 30 June 2022 (Leicester changed their accounting year-end from 31 May to 30 June, making the prior period non-comparable). The most recent annual accounts available at Companies House are for FY2024.",
    postBalanceSheetNote: null,
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

  // ─── Chelsea ────────────────────────────────────────────────────────────────
  // Chelsea FC Holdings Limited (group) · FY Jun 2025 / Jun 2024 · FRS 102
  // Group accounts include a cash flow statement (subsidiary Chelsea Football
  // Club Limited is FRS 102 s7 exempt, but the group entity is not)
  chelsea: {
    slug: "chelsea",
    currentFY: "FY2025",
    priorFY: "FY2024",
    operating: [
      { label: "Cash absorbed by operations (Note 33)",            current: -356529000, prior:  -11902000 },
      { label: "Interest received",                                current:    1325000, prior:    1716000 },
      { label: "Income taxes paid",                                current:          0, prior:      -5000 },
    ],
    netOperating: { current: -355204000, prior: -10191000 },
    investing: [
      { label: "Purchase of intangible assets",                    current: -155193000, prior: -589158000 },
      { label: "Proceeds from disposal of intangibles",            current:  201686000, prior:  189254000 },
      { label: "Purchase of tangible fixed assets",                current:   -8407000, prior:  -11520000 },
      { label: "Proceeds from disposal of tangible fixed assets",  current:          0, prior:      54000 },
    ],
    netInvesting: { current: 38086000, prior: -411370000 },
    financing: [
      { label: "Proceeds from issue of shares",                    current:  339189000, prior:  315000000 },
      { label: "Proceeds from borrowings",                         current:   65311000, prior:   71500000 },
      { label: "Repayment of borrowings",                          current:  -74500000, prior:  -16800000 },
    ],
    netFinancing: { current: 330000000, prior: 369700000 },
    openingCash: { current: 36025000, prior: 87889000 },
    closingCash: { current: 49009000, prior: 36025000 },
    reconciliation: [
      { label: "(Loss)/profit for the year after tax",             current: -262647000, prior:  129606000 },
      { label: "Taxation charged/(credited)",                      current:     203000, prior:   -1206000 },
      { label: "Finance costs",                                    current:   20357000, prior:   19271000 },
      { label: "Investment income",                                current:  -11149000, prior:   -9748000 },
      { label: "Profit on disposal of tangible fixed assets",      current:    2985000, prior:     -54000 },
      { label: "Profit on disposal of player registrations",       current:  -57906000, prior: -152463000 },
      { label: "Fair value (gain)/loss on investment properties",  current:          0, prior:     384000 },
      { label: "Amortisation & impairment of intangible assets",   current:  225990000, prior:  191826000 },
      { label: "Depreciation & impairment of tangible assets",     current:   12519000, prior:   13445000 },
      { label: "Gain on sale of investments",                      current:          0, prior: -198749000 },
      { label: "Increase in provisions",                           current:   24209000, prior:           0 },
      { label: "Increase in stocks",                               current:   -1019000, prior:    -883000 },
      { label: "Decrease/(increase) in debtors",                   current:  256525000, prior: -329412000 },
      { label: "(Decrease)/increase in creditors",                 current: -566596000, prior:  326081000 },
    ],
    reconciliationTitle: "Note 33 — Cash absorbed by group operations",
    reconciliationNote: null,
    postBalanceSheetNote: "Since the year end the Group has acquired the registration of 6 players at an initial cost of £263.3m and disposed of the registration of 15 players at a profit of £31.8m.",
  },

  // ─── Bolton Wanderers ───────────────────────────────────────────────────────
  // FY Jun 2025 / Jun 2024 · FRS 102 · Group (Football Ventures (Whites) Limited)
  // Interest classified in operating; reconciliation in Note 25
  bolton: {
    slug: "bolton",
    currentFY: "FY2025",
    priorFY: "FY2024",
    operating: [
      { label: "Cash absorbed by operations (Note 25)", current: -17097805, prior:  -9177162 },
      { label: "Interest paid",                         current:   -425457, prior:   -711166 },
    ],
    netOperating: { current: -17523262, prior: -9888328 },
    investing: [
      { label: "Purchase of intangible assets",         current:  -3749148, prior:  -1601663 },
      { label: "Proceeds from disposal of intangibles", current:   1350000, prior:       943 },
      { label: "Purchase of tangible fixed assets",     current:  -2404846, prior:  -3509858 },
      { label: "Interest received",                     current:     18787, prior:    14731 },
    ],
    netInvesting: { current: -4785207, prior: -5095847 },
    financing: [
      { label: "Proceeds from issue of shares",                        current:   2000002, prior:  4499973 },
      { label: "Proceeds from shareholders for shares yet to be issued", current: 20150000, prior:  7000504 },
      { label: "Proceeds from borrowings",                             current:         0, prior:  1631164 },
      { label: "Repayment of borrowings",                              current:  -299720, prior:        0 },
      { label: "Repayment of bank loans",                              current:        0, prior: -1422901 },
    ],
    netFinancing: { current: 21850282, prior: 11708740 },
    openingCash: { current: 920791, prior: 4196226 },
    closingCash: { current: 462604, prior:  920791 },
    reconciliation: [
      { label: "Loss after taxation",                                current: -14361894, prior: -11150424 },
      { label: "Finance costs",                                      current:    425457, prior:    711166 },
      { label: "Investment income",                                  current:    -18787, prior:    -14731 },
      { label: "Gain on disposal of intangible assets",             current:   -540544, prior:    -96567 },
      { label: "Amortisation & impairment of intangible assets",    current:   2484356, prior:   1751405 },
      { label: "Depreciation & impairment of tangible fixed assets",current:   1388685, prior:   1000222 },
      { label: "Decrease in stocks",                                current:    190829, prior:     67912 },
      { label: "Decrease/(increase) in debtors",                    current:    722983, prior:   -440593 },
      { label: "Decrease in creditors",                             current:  -7279059, prior:  -1540086 },
      { label: "(Decrease)/increase in deferred income",            current:   -109831, prior:    534534 },
    ],
    reconciliationTitle: "Note 25 — Cash absorbed by group operations",
    reconciliationNote: null,
    postBalanceSheetNote: "Post year-end the shareholders issued further share capital: £3m (14 Jul 2025), £17.15m (31 Jul 2025) and £9m (1 Aug 2025).",
  },
};
