// Plymouth Argyle cash flow data — Group Statement of Cash Flows and Note 30
// Source: Plymouth Argyle Football Club Limited Annual Report, year ended 30 June 2025
// Figures in £ (exact), displayed in £m by the component.

export interface CashFlowLineItem {
  label: string;
  fy25: number; // £ exact
  fy24: number; // £ exact
}

export interface ReconciliationItem {
  label: string;
  fy25: number;
  fy24: number;
}

export interface PlymouthCashFlowData {
  operating: CashFlowLineItem[];
  netOperating: { fy25: number; fy24: number };
  investing: CashFlowLineItem[];
  netInvesting: { fy25: number; fy24: number };
  financing: CashFlowLineItem[];
  netFinancing: { fy25: number; fy24: number };
  openingCash: { fy25: number; fy24: number };
  closingCash: { fy25: number; fy24: number };
  // Note 30 — reconciliation of profit/loss to cash absorbed by operations
  // FY2024 comparatives as presented in the FY2025 accounts (restated classification)
  reconciliation: ReconciliationItem[];
  postBalanceSheetDirectorLoan: number; // £9,808,539 drawn post year-end
}

export const plymouthCashFlow: PlymouthCashFlowData = {
  operating: [
    { label: "Cash absorbed by operations",  fy25: -7_602_684, fy24: -791_870 },
    { label: "Income taxes refunded",         fy25:          0, fy24:    6_905 },
  ],
  netOperating: { fy25: -7_602_684, fy24: -784_905 },

  investing: [
    { label: "Purchase of intangible assets",                  fy25: -5_742_124, fy24: -3_216_203 },
    { label: "Proceeds from disposal of intangibles",          fy25:  7_904_774, fy24:  1_063_000 },
    { label: "Purchase of tangible fixed assets",              fy25: -4_979_162, fy24: -3_273_569 },
    { label: "Proceeds from disposal of tangible fixed assets",fy25:      9_746, fy24:          0 },
    { label: "Interest received",                              fy25:    104_359, fy24:    249_025 },
  ],
  netInvesting: { fy25: -2_702_407, fy24: -5_177_747 },

  financing: [
    { label: "Proceeds from issue of shares",           fy25:          0, fy24: 11_000_000 },
    { label: "Proceeds/(Repayment) of borrowings",      fy25:  2_654_248, fy24:    -40_198 },
    { label: "Payment of finance lease obligations",    fy25:      3_145, fy24:    -18_156 },
  ],
  netFinancing: { fy25: 2_657_393, fy24: 10_941_646 },

  openingCash: { fy25: 10_323_934, fy24: 5_345_000 },
  closingCash:  { fy25:  2_676_236, fy24: 10_323_934 },

  // Note 30 — Cash (absorbed by)/generated from group operations
  reconciliation: [
    { label: "Profit/(loss) for the year after tax",                    fy25:    478_196, fy24: -2_422_020 },
    { label: "Taxation (credited)/charged",                             fy25:   -156_140, fy24:     20_907 },
    { label: "Investment income",                                       fy25:   -104_359, fy24:   -249_025 },
    { label: "Gain on disposal of intangible assets",                   fy25: -6_138_876, fy24:   -809_758 },
    { label: "Amortisation and impairment of intangible assets",        fy25:  2_486_575, fy24:  1_310_775 },
    { label: "Depreciation and impairment of tangible fixed assets",    fy25:  1_444_239, fy24:  1_052_981 },
    { label: "Decrease/(increase) in stocks",                           fy25:    107_448, fy24:   -642_660 },
    { label: "Increase in debtors",                                     fy25: -7_912_401, fy24: -1_895_496 },
    { label: "Increase in creditors",                                   fy25:  2_192_634, fy24:  8_534_316 },
  ],

  postBalanceSheetDirectorLoan: 9_808_539,
};
