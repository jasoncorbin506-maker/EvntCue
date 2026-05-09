/**
 * Budget Calculator presets — DFW-anchored, per-guest math.
 *
 * Each Category and Subtype carries `recommendedTotal` (at `typicalGuests`).
 * Line-item presets scale by `actualGuests / typicalGuests`, so per-guest
 * cost stays anchored across the slider range (10–499). At 500+ the
 * calculator branches into the mega-event modal.
 *
 * Sources:
 *   - DFW totals + averages: 03_Research/EvntCue_Market_Research_DFW_vs_Top25.xlsx (May 2026)
 *   - Wedding cultural taxonomy: 03_Research/CUE_Training_Wedding_Traditions_Module3_v1.1.md
 *   - Corporate / Non-Profit / Public-Cultural subtypes derived from
 *     EvntCue_Master_v27_1.html §26 event_type enum + industry standards
 *     (Cvent benchmarks, Northstar, Zeffy, Eventbrite). No dedicated
 *     research doc for these subtypes yet — refine when one exists.
 */

export type EventTypeEnum =
  | "wedding"
  | "corporate_meeting"
  | "corporate_gala"
  | "conference"
  | "product_launch"
  | "fundraiser"
  | "gala"
  | "other"
  | "birthday"
  | "quinceanera"
  | "religious"
  | "anniversary"
  | "baby_shower"
  | "bridal_shower"
  | "graduation"
  | "reunion"
  | "ticketed";

export type CategoryKey = "wedding" | "corporate" | "nonprofit" | "public" | "social";

export type LineItem = {
  key: string;
  label: string;
  min: number;        // dollars at typicalGuests
  recommended: number; // dollars at typicalGuests
  luxury: number;     // dollars at typicalGuests
};

export type Category = {
  key: CategoryKey;
  label: string;
  blurb: string;
  eventTypeEnum: EventTypeEnum;
  recommendedTotal: number; // at typicalGuests
  typicalGuests: number;
  recommendedLeadMonths: number; // category default if no subtype picked
  items: LineItem[];
};

const make = (
  items: Array<[string, string, number]>,
  minMult = 0.5,
  luxMult = 2.5,
): LineItem[] =>
  items.map(([key, label, recommended]) => ({
    key,
    label,
    recommended,
    min: Math.round(recommended * minMult),
    luxury: Math.round(recommended * luxMult),
  }));

export const CATEGORIES: Category[] = [
  {
    key: "wedding",
    label: "Wedding",
    blurb: "DFW average $40,129 · ~158 guests typical",
    eventTypeEnum: "wedding",
    recommendedTotal: 40000,
    typicalGuests: 158,
    recommendedLeadMonths: 9,
    items: make([
      ["venue", "Venue & rental", 12000],
      ["catering", "Catering & beverage", 8800],
      ["photography", "Photography", 4000],
      ["florals", "Florals & decor", 3200],
      ["attire", "Attire (couple)", 3200],
      ["music", "Music (DJ or band)", 2800],
      ["videography", "Videography", 2000],
      ["cake", "Cake & desserts", 800],
      ["invitations", "Invitations & stationery", 800],
      ["transportation", "Transportation", 800],
      ["hairmakeup", "Hair & makeup", 800],
      ["lighting", "Lighting & AV", 400],
      ["officiant", "Officiant", 400],
    ]),
  },
  {
    key: "corporate",
    label: "Corporate",
    blurb: "DFW blended $52,000 · KBHCCD/Gaylord Texan tier",
    eventTypeEnum: "corporate_gala",
    recommendedTotal: 52000,
    typicalGuests: 200,
    recommendedLeadMonths: 6,
    items: make([
      ["venue", "Venue", 13000],
      ["av", "AV & production", 10400],
      ["catering", "Catering", 10400],
      ["speakers", "Speaker fees", 4160],
      ["travel", "Travel & lodging", 3120],
      ["photo", "Photography & video", 2600],
      ["branded", "Branded materials & signage", 2080],
      ["streaming", "Live streaming", 2080],
      ["registration", "Registration platform", 1560],
      ["swag", "Swag", 1560],
      ["decor", "Decor", 1040],
    ]),
  },
  {
    key: "nonprofit",
    label: "Non-Profit",
    blurb: "DFW gala average $35,000 · ~250 guests typical",
    eventTypeEnum: "fundraiser",
    recommendedTotal: 35000,
    typicalGuests: 250,
    recommendedLeadMonths: 9,
    items: make([
      ["venue", "Venue", 10500],
      ["catering", "Catering", 8750],
      ["av", "AV & production", 4200],
      ["florals", "Florals & decor", 3500],
      ["entertainment", "Speaker / entertainment", 2450],
      ["photography", "Photography", 2100],
      ["auction", "Auction software", 1750],
      ["print", "Programs & print", 1050],
      ["permits", "Insurance & permits", 700],
    ]),
  },
  {
    key: "public",
    label: "Public / Cultural",
    blurb: "Festival, concert, community event · mid-range $25,000",
    eventTypeEnum: "other",
    recommendedTotal: 25000,
    typicalGuests: 300,
    recommendedLeadMonths: 6,
    items: make([
      ["permits", "Venue & permits", 6250],
      ["stage", "Stage, sound, AV", 5000],
      ["performers", "Performers", 4500],
      ["food", "Catering or food trucks", 3000],
      ["security", "Security", 2000],
      ["insurance", "Insurance", 1500],
      ["marketing", "Marketing", 1500],
      ["volunteers", "Volunteer stipends", 750],
      ["decor", "Decor", 500],
    ]),
  },
  {
    key: "social",
    label: "Social",
    blurb: "Quinceañera, mitzvah, milestone birthday · mid $15,000",
    eventTypeEnum: "birthday",
    recommendedTotal: 15000,
    typicalGuests: 100,
    recommendedLeadMonths: 4,
    items: make([
      ["venue", "Venue", 3750],
      ["catering", "Catering", 3750],
      ["decor", "Decor & florals", 2250],
      ["photography", "Photography", 1500],
      ["music", "DJ / music", 1500],
      ["cake", "Cake & desserts", 750],
      ["rentals", "Rentals", 600],
      ["invitations", "Invitations", 450],
      ["transportation", "Transportation", 450],
    ]),
  },
];

/* ---------------- Subtypes ---------------- */

export type Subtype = {
  key: string;
  label: string;
  blurb: string;
  recommendedTotal: number; // at typicalGuests
  typicalGuests: number;
  recommendedLeadMonths: number; // lower bound of typical lead time
  eventTypeEnum: EventTypeEnum;
};

const WEDDING_SUBTYPES: Subtype[] = [
  // research: CUE_Training_Wedding_Traditions_Module3_v1.1.md §§01–12
  { key: "civil",          label: "Civil / non-religious",   blurb: "Smaller, courthouse or venue ceremony",            recommendedTotal: 25000, typicalGuests: 75,  recommendedLeadMonths: 2,  eventTypeEnum: "wedding" },
  { key: "multicultural",  label: "Multicultural / blended", blurb: "Two traditions woven together",                    recommendedTotal: 50000, typicalGuests: 200, recommendedLeadMonths: 12, eventTypeEnum: "wedding" },
  { key: "catholic",       label: "Catholic",                blurb: "Pre-Cana, Nuptial Mass, parish ceremony",          recommendedTotal: 40000, typicalGuests: 150, recommendedLeadMonths: 9,  eventTypeEnum: "wedding" },
  { key: "protestant",     label: "Protestant",              blurb: "Church or venue ceremony, varies by denomination", recommendedTotal: 38000, typicalGuests: 150, recommendedLeadMonths: 6,  eventTypeEnum: "wedding" },
  { key: "greek_orthodox", label: "Greek Orthodox",          blurb: "Cathedral required, crowning + Kalamatiano",       recommendedTotal: 50000, typicalGuests: 200, recommendedLeadMonths: 9,  eventTypeEnum: "wedding" },
  { key: "jewish",         label: "Jewish",                  blurb: "Chuppah, Ketubah, Sheva Brachot — kosher catering", recommendedTotal: 55000, typicalGuests: 200, recommendedLeadMonths: 9,  eventTypeEnum: "wedding" },
  { key: "hindu",          label: "Hindu",                   blurb: "Multi-day · Sangeet, Mehndi, Baraat, ceremony",    recommendedTotal: 80000, typicalGuests: 350, recommendedLeadMonths: 12, eventTypeEnum: "wedding" },
  { key: "islamic",        label: "Islamic (Nikah)",         blurb: "Nikah ceremony + Walima reception",                recommendedTotal: 35000, typicalGuests: 200, recommendedLeadMonths: 4,  eventTypeEnum: "wedding" },
  { key: "sikh",           label: "Sikh (Anand Karaj)",      blurb: "Gurdwara ceremony, langar, head covering protocol", recommendedTotal: 45000, typicalGuests: 250, recommendedLeadMonths: 6,  eventTypeEnum: "wedding" },
  { key: "chinese",        label: "Chinese",                 blurb: "Banquet-driven, 8–12 courses, photography heavy",  recommendedTotal: 60000, typicalGuests: 250, recommendedLeadMonths: 9,  eventTypeEnum: "wedding" },
  { key: "korean",         label: "Korean",                  blurb: "Church + Paebaek + reception, hanbok",             recommendedTotal: 42000, typicalGuests: 200, recommendedLeadMonths: 6,  eventTypeEnum: "wedding" },
  { key: "japanese",       label: "Japanese",                blurb: "Smaller, formal, precisely timed (Shinto or Western)", recommendedTotal: 38000, typicalGuests: 60, recommendedLeadMonths: 4, eventTypeEnum: "wedding" },
  { key: "mexican",        label: "Mexican",                 blurb: "Mariachi, padrinos, Hora Loca · cultural depth",   recommendedTotal: 38000, typicalGuests: 200, recommendedLeadMonths: 6,  eventTypeEnum: "wedding" },
  { key: "nigerian",       label: "Nigerian",                blurb: "Two-day · Traditional + church, Yoruba/Igbo/Hausa", recommendedTotal: 80000, typicalGuests: 400, recommendedLeadMonths: 9, eventTypeEnum: "wedding" },
  { key: "ethiopian",      label: "Ethiopian / Habesha",     blurb: "Ge'ez liturgy, community-catered",                 recommendedTotal: 35000, typicalGuests: 300, recommendedLeadMonths: 6,  eventTypeEnum: "wedding" },
];

const CORPORATE_SUBTYPES: Subtype[] = [
  { key: "conference",     label: "Conference / Summit",         blurb: "Multi-track, multi-day · 250–500 attendees", recommendedTotal: 120000, typicalGuests: 400, recommendedLeadMonths: 9,  eventTypeEnum: "conference" },
  { key: "trade_show",     label: "Trade Show / Exhibition",     blurb: "Booth-driven · exhibitor logistics",          recommendedTotal: 150000, typicalGuests: 500, recommendedLeadMonths: 12, eventTypeEnum: "conference" },
  { key: "corporate_gala", label: "Corporate Gala / Awards",     blurb: "Black-tie, year-end recognition",            recommendedTotal: 80000,  typicalGuests: 250, recommendedLeadMonths: 6,  eventTypeEnum: "corporate_gala" },
  { key: "holiday_party",  label: "Holiday Party",               blurb: "Year-end employee celebration",              recommendedTotal: 40000,  typicalGuests: 200, recommendedLeadMonths: 4,  eventTypeEnum: "corporate_gala" },
  { key: "meeting",        label: "Meeting / Offsite / Retreat", blurb: "Leadership offsite, team retreat",           recommendedTotal: 25000,  typicalGuests: 50,  recommendedLeadMonths: 2,  eventTypeEnum: "corporate_meeting" },
  { key: "product_launch", label: "Product Launch",              blurb: "Press, partners, livestream",                recommendedTotal: 60000,  typicalGuests: 150, recommendedLeadMonths: 4,  eventTypeEnum: "product_launch" },
];

const NONPROFIT_SUBTYPES: Subtype[] = [
  { key: "annual_gala",        label: "Annual Gala",          blurb: "Black-tie fundraiser · DFW avg $35,000",    recommendedTotal: 35000, typicalGuests: 300, recommendedLeadMonths: 9, eventTypeEnum: "gala" },
  { key: "auction",            label: "Auction Event",        blurb: "Silent + live auction · auction software",  recommendedTotal: 30000, typicalGuests: 200, recommendedLeadMonths: 6, eventTypeEnum: "fundraiser" },
  { key: "walk_run",           label: "Walk / Run / P2P",     blurb: "Peer-to-peer, course logistics, stage",      recommendedTotal: 25000, typicalGuests: 500, recommendedLeadMonths: 6, eventTypeEnum: "fundraiser" },
  { key: "donor_appreciation", label: "Donor Appreciation",   blurb: "Stewardship dinner, intimate setting",       recommendedTotal: 20000, typicalGuests: 100, recommendedLeadMonths: 3, eventTypeEnum: "gala" },
  { key: "awareness",          label: "Awareness / Advocacy", blurb: "Lower budget · panels, speakers, education", recommendedTotal: 15000, typicalGuests: 150, recommendedLeadMonths: 2, eventTypeEnum: "fundraiser" },
];

const PUBLIC_SUBTYPES: Subtype[] = [
  { key: "festival",      label: "Festival / Multi-day",        blurb: "Multi-stage · vendors · 1,000+ attendees typical", recommendedTotal: 60000, typicalGuests: 1000, recommendedLeadMonths: 12, eventTypeEnum: "ticketed" },
  { key: "concert",       label: "Concert / Performance",       blurb: "Single stage, ticketed",                          recommendedTotal: 40000, typicalGuests: 500,  recommendedLeadMonths: 6,  eventTypeEnum: "ticketed" },
  { key: "religious",     label: "Religious Observance",        blurb: "Holiday service, dedication, community worship",   recommendedTotal: 15000, typicalGuests: 200,  recommendedLeadMonths: 3,  eventTypeEnum: "religious" },
  { key: "cultural_show", label: "Cultural Showcase",           blurb: "Heritage celebration, dance/music exhibition",     recommendedTotal: 20000, typicalGuests: 300,  recommendedLeadMonths: 4,  eventTypeEnum: "other" },
  { key: "civic",         label: "Civic Ceremony / Dedication", blurb: "Ribbon-cutting, dedication, public proclamation",  recommendedTotal: 15000, typicalGuests: 150,  recommendedLeadMonths: 2,  eventTypeEnum: "other" },
  { key: "community",     label: "Community Gathering",         blurb: "Block party, neighborhood event",                  recommendedTotal: 10000, typicalGuests: 200,  recommendedLeadMonths: 2,  eventTypeEnum: "other" },
];

const SOCIAL_SUBTYPES_DATA: Subtype[] = [
  { key: "quinceanera",        label: "Quinceañera",        blurb: "DFW avg $15,000",                          recommendedTotal: 15000, typicalGuests: 200, recommendedLeadMonths: 9,  eventTypeEnum: "quinceanera" },
  { key: "bar_bat_mitzvah",    label: "Bar / Bat Mitzvah",  blurb: "DFW avg $22,000",                          recommendedTotal: 22000, typicalGuests: 150, recommendedLeadMonths: 12, eventTypeEnum: "religious" },
  { key: "sweet_16",           label: "Sweet 16",           blurb: "DFW avg $8,000",                           recommendedTotal: 8000,  typicalGuests: 80,  recommendedLeadMonths: 4,  eventTypeEnum: "birthday" },
  { key: "milestone_birthday", label: "Milestone Birthday", blurb: "30th, 40th, 50th — DFW avg $5,000",        recommendedTotal: 5000,  typicalGuests: 50,  recommendedLeadMonths: 3,  eventTypeEnum: "birthday" },
  { key: "anniversary",        label: "Anniversary",        blurb: "Vow renewal, 25th, 50th — typical $8,000", recommendedTotal: 8000,  typicalGuests: 80,  recommendedLeadMonths: 3,  eventTypeEnum: "anniversary" },
  { key: "baby_shower",        label: "Baby Shower",        blurb: "Typical $1,500",                           recommendedTotal: 1500,  typicalGuests: 30,  recommendedLeadMonths: 1,  eventTypeEnum: "baby_shower" },
  { key: "bridal_shower",      label: "Bridal Shower",      blurb: "Typical $2,500",                           recommendedTotal: 2500,  typicalGuests: 30,  recommendedLeadMonths: 2,  eventTypeEnum: "bridal_shower" },
  { key: "graduation",         label: "Graduation Party",   blurb: "Typical $2,000",                           recommendedTotal: 2000,  typicalGuests: 50,  recommendedLeadMonths: 1,  eventTypeEnum: "graduation" },
  { key: "reunion",            label: "Reunion",            blurb: "Family or class — typical $4,000",         recommendedTotal: 4000,  typicalGuests: 100, recommendedLeadMonths: 6,  eventTypeEnum: "reunion" },
];

export const SUBTYPES_BY_CATEGORY: Record<CategoryKey, Subtype[]> = {
  wedding: WEDDING_SUBTYPES,
  corporate: CORPORATE_SUBTYPES,
  nonprofit: NONPROFIT_SUBTYPES,
  public: PUBLIC_SUBTYPES,
  social: SOCIAL_SUBTYPES_DATA,
};

export function getSubtype(category: CategoryKey, key: string | null | undefined): Subtype | undefined {
  if (!key) return undefined;
  return SUBTYPES_BY_CATEGORY[category].find((s) => s.key === key);
}

/* ---------------- Guest count + horizon enums ---------------- */

export const GUEST_BANDS = [
  { value: "under_50", label: "Under 50", midpoint: 35 },
  { value: "50_100", label: "50–100", midpoint: 75 },
  { value: "100_250", label: "100–250", midpoint: 175 },
  { value: "250_500", label: "250–500", midpoint: 375 },
  { value: "500_plus", label: "500+", midpoint: 600 },
] as const;

export type GuestBand = (typeof GUEST_BANDS)[number]["value"];

export const GUEST_SLIDER = {
  min: 10,
  max: 500,
  step: 5,
  default: 150,
  // At max the user is in the 500_plus band — beyond the calculator's resolution.
  // ScopeStep branches into a "talk to our team" modal at this rail.
  megaThreshold: 500,
} as const;

/**
 * Budget slider — log-scale $1K to $500K, exposed as 0–1000 units on a
 * native range input. The log mapping lets a single slider feel responsive
 * for both $5K social events and $250K corporate trade shows.
 */
export const BUDGET_SLIDER = {
  units: 1000,
  dollarMin: 1000,
  dollarMax: 500_000,
} as const;

const _budgetMinLog = Math.log(BUDGET_SLIDER.dollarMin);
const _budgetMaxLog = Math.log(BUDGET_SLIDER.dollarMax);
const _budgetRange = _budgetMaxLog - _budgetMinLog;

export function sliderToBudget(units: number): number {
  const t = Math.max(0, Math.min(1, units / BUDGET_SLIDER.units));
  const dollars = Math.exp(_budgetMinLog + t * _budgetRange);
  return Math.round(dollars / 100) * 100; // round to nearest $100
}

export function budgetToSlider(dollars: number): number {
  const clamped = Math.max(
    BUDGET_SLIDER.dollarMin,
    Math.min(BUDGET_SLIDER.dollarMax, dollars),
  );
  const t = (Math.log(clamped) - _budgetMinLog) / _budgetRange;
  return Math.round(t * BUDGET_SLIDER.units);
}

export function guestBandFromCount(count: number): GuestBand {
  if (count < 50) return "under_50";
  if (count < 100) return "50_100";
  if (count < 250) return "100_250";
  if (count < 500) return "250_500";
  return "500_plus";
}

/**
 * Date horizons — UI shows 2-month increments up to 18+. The DB
 * `date_horizon_band` enum has coarser buckets (lt_1mo / 1_3mo / 3_6mo /
 * 6_12mo / 12mo_plus); each UI value maps to one of those on save.
 */
export const DATE_HORIZONS = [
  { value: "0_2",     label: "<2 mo",    months: 0.5, db: "lt_1mo" },
  { value: "2_4",     label: "2–4 mo",   months: 2,   db: "1_3mo" },
  { value: "4_6",     label: "4–6 mo",   months: 4,   db: "3_6mo" },
  { value: "6_8",     label: "6–8 mo",   months: 6,   db: "6_12mo" },
  { value: "8_10",    label: "8–10 mo",  months: 8,   db: "6_12mo" },
  { value: "10_12",   label: "10–12 mo", months: 10,  db: "6_12mo" },
  { value: "12_14",   label: "12–14 mo", months: 12,  db: "12mo_plus" },
  { value: "14_16",   label: "14–16 mo", months: 14,  db: "12mo_plus" },
  { value: "16_18",   label: "16–18 mo", months: 16,  db: "12mo_plus" },
  { value: "18_plus", label: "18+ mo",   months: 18,  db: "12mo_plus" },
] as const;

export type DateHorizon = (typeof DATE_HORIZONS)[number]["value"];
export type DateHorizonDB = "lt_1mo" | "1_3mo" | "3_6mo" | "6_12mo" | "12mo_plus";

export function dbHorizonFromUi(ui: DateHorizon): DateHorizonDB {
  const h = DATE_HORIZONS.find((x) => x.value === ui);
  return (h?.db ?? "6_12mo") as DateHorizonDB;
}

export const DEFAULTS = {
  contingencyPct: 10,
  taxPct: 8.25, // Texas state baseline; user-editable
} as const;

/* ---------------- Lead-time / short-notice warnings ---------------- */

/**
 * Approximate month-equivalent for each date_horizon band.
 * Uses lower-bound of the band so warnings err on the conservative side
 * (a "1–3 month" pick is treated as 1 month for warning purposes).
 */
export const HORIZON_MONTHS: Record<DateHorizon, number> = Object.fromEntries(
  DATE_HORIZONS.map((h) => [h.value, h.months]),
) as Record<DateHorizon, number>;

export type LeadTimeSeverity = "calm" | "warn" | "danger";

/**
 * Compares user's date_horizon pick to the recommended lead time
 * for their event type. Maps to master spec §line 4556 calm/warn/danger urgency model.
 *
 * danger: < 50% of recommended lead time (very short notice)
 * warn:   < 80% of recommended lead time (short notice)
 * calm:   ≥ 80% (sufficient lead time)
 */
export function leadTimeSeverity(
  horizon: DateHorizon,
  recommendedLeadMonths: number,
): LeadTimeSeverity {
  const userMonths = HORIZON_MONTHS[horizon];
  if (recommendedLeadMonths <= 0) return "calm";
  const ratio = userMonths / recommendedLeadMonths;
  if (ratio < 0.5) return "danger";
  if (ratio < 0.8) return "warn";
  return "calm";
}

/**
 * Cover-count severity: compares user's guest count to DFW typical for the
 * subtype/category. Flags unusual scale (e.g., 50-guest Hindu wedding when
 * typical is 350; 400-guest Sweet 16 when typical is 80).
 */
export type CoverSeverity = { severity: LeadTimeSeverity; direction: "low" | "high" | null };

export function coverSeverity(userGuests: number, typicalGuests: number): CoverSeverity {
  if (typicalGuests <= 0) return { severity: "calm", direction: null };
  const ratio = userGuests / typicalGuests;
  if (ratio < 0.3) return { severity: "danger", direction: "low" };
  if (ratio < 0.5) return { severity: "warn", direction: "low" };
  if (ratio > 3.0) return { severity: "danger", direction: "high" };
  if (ratio > 2.0) return { severity: "warn", direction: "high" };
  return { severity: "calm", direction: null };
}

/**
 * Budget severity: compares user's per-guest spend to DFW typical per-guest
 * for the subtype/category. Flags significant deviation from market norms.
 * Only meaningful once user has customized line items (otherwise per-guest
 * stays anchored at typical by construction).
 */
export type BudgetSeverity = { severity: LeadTimeSeverity; direction: "low" | "high" | null };

export function budgetSeverity(userPerGuest: number, typicalPerGuest: number): BudgetSeverity {
  if (typicalPerGuest <= 0) return { severity: "calm", direction: null };
  const ratio = userPerGuest / typicalPerGuest;
  if (ratio < 0.4) return { severity: "danger", direction: "low" };
  if (ratio < 0.7) return { severity: "warn", direction: "low" };
  if (ratio > 2.5) return { severity: "danger", direction: "high" };
  if (ratio > 1.8) return { severity: "warn", direction: "high" };
  return { severity: "calm", direction: null };
}

/**
 * Combine multiple severity signals to a single worst-case state.
 * Used to color the warning box and pick the primary copy.
 */
export function combinedSeverity(...signals: LeadTimeSeverity[]): LeadTimeSeverity {
  if (signals.includes("danger")) return "danger";
  if (signals.includes("warn")) return "warn";
  return "calm";
}

