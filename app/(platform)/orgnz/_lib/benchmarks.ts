import { CATEGORIES, type CategoryKey } from "@/data/budget-presets";

export type BenchmarkRow = {
  label: string;
  yourCents: number;     // user's allocated amount for this category
  medianCents: number;   // DFW median at the user's guest count
  pctVsMedian: number;   // (your - median) / median; e.g. -0.12 = 12% under
  state: "under" | "over" | "match";
};

const MATCH_BAND = 0.04; // within ±4% counts as "at median"

/**
 * Top-N comparison rows for the Cue Pricing Informatics chart in the Budget sheet.
 *
 * Pulls category line items from `data/budget-presets.ts`, scales the "recommended"
 * spend by `userGuests / typicalGuests`, and compares to the user's allocated
 * spend for the matching label.
 *
 * DFW benchmark data is reused from budget-presets.ts (per Jason 2026-05-10 — proper
 * percentile extraction from 03_Research/ xlsx queued in PARKING_LOT #20).
 */
export function buildBenchmarkRows(args: {
  category: CategoryKey;
  guestCount: number;
  userLineItems: { label: string; amount_cents: number }[];
  topN?: number;
}): BenchmarkRow[] {
  const cat = CATEGORIES.find((c) => c.key === args.category);
  if (!cat) return [];

  const scale = args.guestCount > 0 ? args.guestCount / cat.typicalGuests : 1;
  const userByLabel = new Map(
    args.userLineItems.map((li) => [li.label, li.amount_cents]),
  );

  const rows: BenchmarkRow[] = cat.items.map((item) => {
    const medianCents = Math.round(item.recommended * scale * 100);
    const yourCents = userByLabel.get(item.label) ?? 0;
    const pctVsMedian = medianCents > 0 ? (yourCents - medianCents) / medianCents : 0;
    let state: BenchmarkRow["state"] = "match";
    if (pctVsMedian < -MATCH_BAND) state = "under";
    else if (pctVsMedian > MATCH_BAND) state = "over";
    return { label: item.label, yourCents, medianCents, pctVsMedian, state };
  });

  // Sort by median spend descending (biggest budget items first)
  rows.sort((a, b) => b.medianCents - a.medianCents);
  return rows.slice(0, args.topN ?? 5);
}

/**
 * Overall variance vs the category median across shown rows.
 * Returns the user's total vs the median total as a signed percentage.
 */
export function overallVariance(rows: BenchmarkRow[]): {
  pct: number;
  state: "under" | "over" | "match";
} {
  const userSum = rows.reduce((s, r) => s + r.yourCents, 0);
  const medianSum = rows.reduce((s, r) => s + r.medianCents, 0);
  if (medianSum <= 0) return { pct: 0, state: "match" };
  const pct = (userSum - medianSum) / medianSum;
  let state: "under" | "over" | "match" = "match";
  if (pct < -MATCH_BAND) state = "under";
  else if (pct > MATCH_BAND) state = "over";
  return { pct, state };
}
