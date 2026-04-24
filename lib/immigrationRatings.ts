// Immigration ease ratings for non-EU African players by country.
// Scale: 1 (easiest) → 10 (hardest).
// Colours: 1–4 = green, 5–8 = amber, 9–10 = red.

export interface ImmigrationRating {
  country: string;
  rank: number;
  label: string;
  colorName: "green" | "amber" | "red";
  hex: string;
  explanation: string;
  /** Country-specific advisory note (shown separately in tooltip). */
  note?: string;
}

const RATINGS: ImmigrationRating[] = [
  {
    country: "Germany",
    rank: 1,
    label: "Very Easy",
    colorName: "green",
    hex: "#4CAF50",
    explanation:
      "No non-EU player quota applies. African players register under standard work-permit rules with no numerical cap at club or league level.",
  },
  {
    country: "Japan",
    rank: 2,
    label: "Very Easy",
    colorName: "green",
    hex: "#4CAF50",
    explanation:
      "J-League allows up to 5 foreign players on the pitch simultaneously; no EU/non-EU distinction. African players face no special quota or exemption requirement.",
  },
  {
    country: "Spain",
    rank: 3,
    label: "Easy — ACP/Cotonou exempt",
    colorName: "green",
    hex: "#4CAF50",
    explanation:
      "Non-EU slots exist under Spanish football rules, but ACP-nation players are exempt under the Samoa Agreement.",
    note: "Sub-Saharan ACP nations (Nigeria, Ghana, Senegal, Ivory Coast etc.) do not occupy non-EU quota slots under the Samoa Agreement.",
  },
  {
    country: "France",
    rank: 4,
    label: "Easy — ACP/Cotonou exempt",
    colorName: "green",
    hex: "#4CAF50",
    explanation:
      "French football applies ACP/Samoa Agreement exemptions: sub-Saharan African players are not counted toward non-EU registration limits.",
    note: "Sub-Saharan ACP nations (Nigeria, Ghana, Senegal, Ivory Coast etc.) do not occupy non-EU quota slots under the Samoa Agreement.",
  },
  {
    country: "Norway",
    rank: 5,
    label: "Moderate",
    colorName: "amber",
    hex: "#FF9800",
    explanation:
      "No hard squad quota, but non-EEA work permits require the club to demonstrate labour-market need. Process is manageable for established professionals.",
  },
  {
    country: "Austria",
    rank: 6,
    label: "Moderate",
    colorName: "amber",
    hex: "#FF9800",
    explanation:
      "Non-EU players require a work permit under Austrian immigration law. No hard squad cap, but the administrative process must be completed before registration.",
  },
  {
    country: "Denmark",
    rank: 7,
    label: "Moderate — Cotonou recognised",
    colorName: "amber",
    hex: "#FF9800",
    explanation:
      "Denmark has recognised Cotonou Agreement rights for ACP nationals in some administrative contexts, offering a pathway — but application is assessed case by case.",
  },
  {
    country: "Sweden",
    rank: 8,
    label: "Restricted — 3 non-EU on pitch",
    colorName: "amber",
    hex: "#FF9800",
    explanation:
      "Allsvenskan clubs may field at most 3 non-EU players simultaneously. African players without EU residency status count toward this on-pitch limit.",
  },
  {
    country: "England",
    rank: 9,
    label: "Hard — GBE points system, post-Brexit",
    colorName: "amber",
    hex: "#FF9800",
    explanation:
      "Governed by the Governing Body Endorsement (GBE) points system. Player must meet a threshold based on international caps and league-standing of their national team.",
    note: "Post-Brexit: Kolpak/Cotonou protections no longer apply. GBE points system required.",
  },
  {
    country: "Italy",
    rank: 10,
    label: "Very Hard — 2 non-EU slots per season",
    colorName: "red",
    hex: "#F44336",
    explanation:
      "Serie A/B clubs are limited to registering 2 non-EU players per season. Cotonou exemption is not applied, meaning all African non-EU nationals consume a slot.",
    note: "Only 2 non-EU registrations per club per season. Cotonou exemption not applied.",
  },
];

export function getImmigrationRating(country: string): ImmigrationRating | null {
  return RATINGS.find((r) => r.country === country) ?? null;
}

export const ALL_IMMIGRATION_RATINGS = RATINGS;
