import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  CATEGORIES,
  HORIZON_MONTHS,
  budgetSeverity,
  combinedSeverity,
  coverSeverity,
  getSubtype,
  leadTimeSeverity,
  type BudgetSeverity,
  type CategoryKey,
  type CoverSeverity,
  type DateHorizon,
  type GuestBand,
  type LeadTimeSeverity,
} from "@/data/budget-presets";
import { Preview } from "./Preview";

export const metadata = {
  title: "Your event preview · EvntCue",
  description: "Your event budget rendered in the planning workspace. Sign up to keep it live.",
};

export type PreviewData = {
  category: CategoryKey;
  subtypeKey: string | null;
  guestCount: number;
  guestBand: GuestBand;
  dateHorizon: DateHorizon;
  amounts: Record<string, number>;
  contingencyPct: number;
  taxPct: number;
  subtotal: number;
  contingency: number;
  tax: number;
  grand: number;
  perGuest: number;
  categoryLabel: string;
  subtypeLabel: string | null;
  recommendedLeadMonths: number;
  horizonMonths: number;
  severity: LeadTimeSeverity;
  itemLabels: Record<string, string>;
  suggestPlnr: boolean;
  // Multi-signal warning data
  leadSeverity: LeadTimeSeverity;
  coverSig: CoverSeverity;
  budgetSig: BudgetSeverity;
  typicalGuests: number;
  typicalPerGuest: number;
};

export default async function EventPreviewPage() {
  const c = await cookies();
  const stateRaw = c.get("evntcue_calc_state")?.value;
  if (!stateRaw) redirect("/budget-calculator");

  type Cookie = {
    category: CategoryKey;
    subtypeKey: string | null;
    guestCount: number;
    guestBand: GuestBand;
    dateHorizon: DateHorizon;
    amounts: Record<string, number>;
    contingencyPct: number;
    taxPct: number;
    subtotal: number;
    contingency: number;
    tax: number;
    grand: number;
  };

  let parsed: Cookie;
  try {
    parsed = JSON.parse(stateRaw) as Cookie;
  } catch {
    redirect("/budget-calculator");
  }

  const category = CATEGORIES.find((cat) => cat.key === parsed.category);
  if (!category) redirect("/budget-calculator");

  const subtype = getSubtype(parsed.category, parsed.subtypeKey);
  const recLead = subtype?.recommendedLeadMonths ?? category.recommendedLeadMonths;
  const horizonMonths = HORIZON_MONTHS[parsed.dateHorizon];
  const perGuest = parsed.guestCount > 0 ? Math.round(parsed.grand / parsed.guestCount) : 0;

  // Multi-signal severity computations
  const typicalGuests = subtype?.typicalGuests ?? category.typicalGuests;
  const anchorTotalForBudget = subtype?.recommendedTotal ?? category.recommendedTotal;
  const typicalPerGuest = typicalGuests > 0 ? Math.round(anchorTotalForBudget / typicalGuests) : 0;

  const leadSeverity = leadTimeSeverity(parsed.dateHorizon, recLead);
  const coverSig = coverSeverity(parsed.guestCount, typicalGuests);
  const budgetSig = budgetSeverity(perGuest, typicalPerGuest);
  const severity = combinedSeverity(leadSeverity, coverSig.severity, budgetSig.severity);

  const itemLabels: Record<string, string> = {};
  for (const it of category.items) itemLabels[it.key] = it.label;

  // Plnr suggestion: triggers when budget is in the "average range" for the
  // event type (0.5×–2× the recommended total). Anchored to subtype if picked,
  // category baseline otherwise. Mirrors master spec §28 budget_tier=mid logic.
  const anchorTotal = subtype?.recommendedTotal ?? category.recommendedTotal;
  const suggestPlnr =
    parsed.grand >= anchorTotal * 0.5 && parsed.grand <= anchorTotal * 2.0;

  const data: PreviewData = {
    ...parsed,
    perGuest,
    categoryLabel: category.label,
    subtypeLabel: subtype?.label ?? null,
    recommendedLeadMonths: recLead,
    horizonMonths,
    severity,
    itemLabels,
    suggestPlnr,
    leadSeverity,
    coverSig,
    budgetSig,
    typicalGuests,
    typicalPerGuest,
  };

  return <Preview data={data} />;
}
