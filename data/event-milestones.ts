/**
 * Subtype-specific milestone timelines for the event-preview horizontal strip.
 *
 * Wedding cultural milestones: research-backed from
 *   03_Research/CUE_Training_Wedding_Traditions_Module3_v1.1.md
 *
 * Corporate / Non-Profit / Public-Cultural / Social milestones: industry-standard
 * (master spec §26 + Cvent / Northstar / Eventbrite benchmarks). No dedicated
 * research doc yet — refine when one exists.
 *
 * `lead` = months before the event when the milestone is typically due.
 *   (0 = day-of; 0.25 = day before; 0.5 = a few days before; etc.)
 */

import type { CategoryKey } from "./budget-presets";

export type MilestoneStatus = "now" | "next" | "open" | "done";

export type Milestone = {
  label: string;
  detail?: string;
  lead: number; // months before event
};

export type MilestoneWithStatus = Milestone & { status: MilestoneStatus };

const WEDDING: Record<string, Milestone[]> = {
  catholic: [
    { label: "Engagement", lead: 12, detail: "Set date with parish + family" },
    { label: "Pre-Cana", lead: 9, detail: "6mo–1yr Church marriage prep program" },
    { label: "Paperwork", lead: 6, detail: "Baptismal, confirmation, freedom-to-marry" },
    { label: "Save-the-dates", lead: 6 },
    { label: "Vendor lock", lead: 4, detail: "Photo, florals, music" },
    { label: "Invitations", lead: 2 },
    { label: "Rehearsal", lead: 0.03, detail: "Evening before; priest leads" },
    { label: "Wedding day", lead: 0, detail: "Nuptial Mass + reception" },
  ],
  protestant: [
    { label: "Engagement", lead: 12 },
    { label: "Premarital counseling", lead: 8, detail: "Pastor-led, varies by denomination" },
    { label: "Save-the-dates", lead: 6 },
    { label: "Vendor lock", lead: 4 },
    { label: "Invitations", lead: 2 },
    { label: "Rehearsal", lead: 0.03 },
    { label: "Wedding day", lead: 0 },
  ],
  greek_orthodox: [
    { label: "Engagement", lead: 12 },
    { label: "Cathedral membership", lead: 10, detail: "One party member in good standing" },
    { label: "Marriage Seminar", lead: 8, detail: "Held 3x/year — register early" },
    { label: "Pre-marital counseling", lead: 6, detail: "Two sessions required" },
    { label: "Save-the-dates", lead: 6 },
    { label: "Vendor lock", lead: 4 },
    { label: "Invitations", lead: 2 },
    { label: "Wedding day", lead: 0, detail: "Crowning + Kalamatiano reception" },
  ],
  jewish: [
    { label: "Engagement", lead: 12 },
    { label: "Tenaim", lead: 9, detail: "Formal engagement document" },
    { label: "Vendor lock", lead: 6, detail: "Kosher catering specialty" },
    { label: "Aufruf", lead: 0.5, detail: "Sabbath blessing before wedding" },
    { label: "Sheva Brachot list", lead: 0.5, detail: "Confirm 7 honorees 2 weeks out" },
    { label: "Bedeken + Ketubah signing", lead: 0, detail: "Day-of, before ceremony" },
    { label: "Chuppah ceremony", lead: 0 },
  ],
  hindu: [
    { label: "Roka / Engagement", lead: 15 },
    { label: "Save-the-dates", lead: 9 },
    { label: "Mandap + decor lock", lead: 6, detail: "Specialty mandap rentals book early" },
    { label: "Sangeet + Mehndi planning", lead: 6 },
    { label: "Mehndi night", lead: 0.07, detail: "Evening before — henna for bride" },
    { label: "Sangeet night", lead: 0.07, detail: "Music + dance celebration" },
    { label: "Baraat", lead: 0, detail: "Groom's procession, often on horseback" },
    { label: "Ceremony + reception", lead: 0, detail: "Saptapadi, mandap, banquet" },
  ],
  islamic: [
    { label: "Engagement", lead: 6 },
    { label: "Mahr negotiation", lead: 4, detail: "Marriage gift agreement" },
    { label: "Vendor lock", lead: 3 },
    { label: "Pre-wedding gathering", lead: 0.5 },
    { label: "Nikah ceremony", lead: 0 },
    { label: "Walima reception", lead: 0 },
  ],
  sikh: [
    { label: "Engagement / Roka", lead: 9 },
    { label: "Gurdwara booking", lead: 6 },
    { label: "Vendor lock", lead: 4 },
    { label: "Pre-wedding gathering", lead: 0.5 },
    { label: "Anand Karaj ceremony", lead: 0, detail: "At Gurdwara, head covering required" },
    { label: "Langar community meal", lead: 0, detail: "Open to all guests" },
    { label: "Reception", lead: 0 },
  ],
  chinese: [
    { label: "Engagement", lead: 9 },
    { label: "Guo Da Li / Betrothal", lead: 6, detail: "Formal gift presentation" },
    { label: "Banquet venue lock", lead: 6, detail: "8–12 course capacity required" },
    { label: "Wedding photos", lead: 3, detail: "Pre-wedding shoot is standard" },
    { label: "Tea ceremony", lead: 0.07, detail: "Morning of wedding day" },
    { label: "Banquet", lead: 0, detail: "8 to 12 courses, each symbolic" },
  ],
  nigerian: [
    { label: "Engagement", lead: 12 },
    { label: "Introduction / family meeting", lead: 9 },
    { label: "Aso-oke fabric procurement", lead: 6, detail: "Often Houston-sourced for DFW couples" },
    { label: "Vendor lock", lead: 4 },
    { label: "Traditional wedding day", lead: 0, detail: "Day 1 — Yoruba/Igbo/Hausa rites" },
    { label: "Church or court wedding", lead: 0, detail: "Day 2 — followed by reception" },
  ],
  ethiopian: [
    { label: "Engagement", lead: 9 },
    { label: "Community-catered planning", lead: 6, detail: "Family network handles food" },
    { label: "Vendor lock", lead: 4 },
    { label: "Ge'ez liturgy", lead: 0, detail: "60–90 min, led by Qes (priest)" },
    { label: "Reception", lead: 0 },
  ],
  mexican: [
    { label: "Engagement", lead: 9 },
    { label: "Padrinos confirmed", lead: 6, detail: "Sponsors for tiara, cake, dress, etc." },
    { label: "Pre-Cana (if Catholic)", lead: 6 },
    { label: "Mariachi confirmed", lead: 4 },
    { label: "Vendor lock", lead: 4 },
    { label: "Hora Loca prep", lead: 2, detail: "Costumes, props, surprise entertainment" },
    { label: "Ceremony", lead: 0, detail: "Often Catholic Mass" },
    { label: "Reception", lead: 0, detail: "Hora Loca mid-reception" },
  ],
  japanese: [
    { label: "Engagement", lead: 6 },
    { label: "Yui-no", lead: 4, detail: "Formal engagement gift exchange" },
    { label: "Attire fitting", lead: 3, detail: "Shinto or Western, sometimes both" },
    { label: "Vendor lock", lead: 3 },
    { label: "Ceremony", lead: 0, detail: "Shinto shrine or Western chapel" },
    { label: "Reception", lead: 0, detail: "Precisely timed, formal speeches" },
  ],
  korean: [
    { label: "Engagement", lead: 6 },
    { label: "Carrollton church + venue lock", lead: 5, detail: "Korean community referral network" },
    { label: "Hanbok fitting", lead: 4 },
    { label: "Vendor lock", lead: 3 },
    { label: "Wedding ceremony", lead: 0 },
    { label: "Paebaek", lead: 0.04, detail: "Traditional bowing to family elders" },
    { label: "Reception", lead: 0 },
  ],
  civil: [
    { label: "Engagement", lead: 3 },
    { label: "Marriage license", lead: 0.5 },
    { label: "Ceremony", lead: 0, detail: "Courthouse or venue" },
    { label: "Optional reception", lead: 0 },
  ],
  multicultural: [
    { label: "Engagement", lead: 12 },
    { label: "Two-tradition mapping", lead: 10, detail: "Cue helps blend ceremony elements" },
    { label: "Vendor lock", lead: 5, detail: "Cultural specialty vendors fill early" },
    { label: "Invitations", lead: 2 },
    { label: "Ceremony", lead: 0 },
    { label: "Reception", lead: 0 },
  ],
};

const SOCIAL: Record<string, Milestone[]> = {
  quinceanera: [
    { label: "Planning", lead: 12 },
    { label: "Court of Honor", lead: 9, detail: "Chambelanes & damas — 14 typical" },
    { label: "Padrinos confirmed", lead: 8, detail: "Sponsors offset budget per master spec §46" },
    { label: "Choreography rehearsals", lead: 4 },
    { label: "Final fittings", lead: 1 },
    { label: "Mass / ceremony", lead: 0 },
    { label: "Reception with Hora Loca", lead: 0 },
  ],
  bar_bat_mitzvah: [
    { label: "Date locked", lead: 18, detail: "Tied to child's bar/bat mitzvah age" },
    { label: "Hebrew tutoring begins", lead: 12 },
    { label: "Synagogue + venue lock", lead: 12 },
    { label: "Vendor lock", lead: 6 },
    { label: "Torah portion mastered", lead: 3 },
    { label: "Final practice", lead: 0.5 },
    { label: "Ceremony", lead: 0 },
    { label: "Reception", lead: 0 },
  ],
  sweet_16: [
    { label: "Planning", lead: 4 },
    { label: "Venue + theme lock", lead: 3 },
    { label: "Vendor lock", lead: 2 },
    { label: "Invitations", lead: 1.5 },
    { label: "Day-of", lead: 0 },
  ],
  milestone_birthday: [
    { label: "Planning", lead: 3 },
    { label: "Venue + theme lock", lead: 2 },
    { label: "Invitations", lead: 1.5 },
    { label: "Vendor lock", lead: 1 },
    { label: "Day-of", lead: 0 },
  ],
  anniversary: [
    { label: "Planning", lead: 3 },
    { label: "Venue lock", lead: 2 },
    { label: "Invitations", lead: 1.5 },
    { label: "Day-of", lead: 0 },
  ],
  baby_shower: [
    { label: "Planning", lead: 1.5 },
    { label: "Venue lock", lead: 1 },
    { label: "Invitations", lead: 0.5 },
    { label: "Day-of", lead: 0 },
  ],
  bridal_shower: [
    { label: "Planning", lead: 2 },
    { label: "Venue lock", lead: 1.5 },
    { label: "Invitations", lead: 1 },
    { label: "Day-of", lead: 0 },
  ],
  graduation: [
    { label: "Date set", lead: 1.5 },
    { label: "Venue lock", lead: 1 },
    { label: "Invitations", lead: 0.5 },
    { label: "Day-of", lead: 0 },
  ],
  reunion: [
    { label: "Planning", lead: 9 },
    { label: "Save-the-dates", lead: 6 },
    { label: "Venue lock", lead: 5 },
    { label: "Catering lock", lead: 3 },
    { label: "Day-of", lead: 0 },
  ],
};

const CORPORATE: Record<string, Milestone[]> = {
  conference: [
    { label: "Date + venue lock", lead: 12 },
    { label: "Speaker confirmations", lead: 9 },
    { label: "Sponsor sales", lead: 6 },
    { label: "Registration opens", lead: 4 },
    { label: "Marketing push", lead: 2 },
    { label: "Day-of", lead: 0 },
  ],
  trade_show: [
    { label: "Date + venue lock", lead: 12 },
    { label: "Exhibitor sales", lead: 9 },
    { label: "Floor plan finalized", lead: 6 },
    { label: "Marketing", lead: 3 },
    { label: "Show day", lead: 0 },
  ],
  corporate_gala: [
    { label: "Date + venue lock", lead: 6 },
    { label: "Award nominees", lead: 4 },
    { label: "Sponsor sales", lead: 3 },
    { label: "Invitations", lead: 2 },
    { label: "Gala", lead: 0 },
  ],
  holiday_party: [
    { label: "Date + venue lock", lead: 4 },
    { label: "Vendor lock", lead: 3 },
    { label: "Invitations", lead: 1.5 },
    { label: "Day-of", lead: 0 },
  ],
  meeting: [
    { label: "Date + venue lock", lead: 2 },
    { label: "Travel + lodging", lead: 1 },
    { label: "Day-of", lead: 0 },
  ],
  product_launch: [
    { label: "Venue + date lock", lead: 4 },
    { label: "Press list", lead: 3 },
    { label: "Run of show finalized", lead: 1 },
    { label: "Day-of", lead: 0 },
  ],
};

const NONPROFIT: Record<string, Milestone[]> = {
  annual_gala: [
    { label: "Date + venue lock", lead: 9 },
    { label: "Honoree confirmed", lead: 6 },
    { label: "Sponsor sales", lead: 6 },
    { label: "Auction items secured", lead: 3 },
    { label: "Invitations", lead: 2 },
    { label: "Gala", lead: 0 },
  ],
  auction: [
    { label: "Date + venue", lead: 6 },
    { label: "Auction items", lead: 4 },
    { label: "Auction software setup", lead: 3 },
    { label: "Invitations", lead: 2 },
    { label: "Day-of", lead: 0 },
  ],
  walk_run: [
    { label: "Date + course", lead: 6 },
    { label: "Permits", lead: 5 },
    { label: "Sponsor sales", lead: 4 },
    { label: "P2P platform launch", lead: 3 },
    { label: "Marketing push", lead: 1 },
    { label: "Race day", lead: 0 },
  ],
  donor_appreciation: [
    { label: "Venue + date", lead: 3 },
    { label: "Guest list", lead: 2 },
    { label: "Invitations", lead: 1 },
    { label: "Dinner", lead: 0 },
  ],
  awareness: [
    { label: "Date + venue", lead: 2 },
    { label: "Speaker confirmations", lead: 1.5 },
    { label: "Marketing", lead: 1 },
    { label: "Event", lead: 0 },
  ],
};

const PUBLIC_CULTURAL: Record<string, Milestone[]> = {
  festival: [
    { label: "Date + venue", lead: 12 },
    { label: "Permits", lead: 10 },
    { label: "Lineup booked", lead: 8 },
    { label: "Sponsor sales", lead: 6 },
    { label: "Ticket sales open", lead: 4 },
    { label: "Marketing push", lead: 2 },
    { label: "Festival day", lead: 0 },
  ],
  concert: [
    { label: "Date + venue", lead: 6 },
    { label: "Talent confirmed", lead: 5 },
    { label: "Production team", lead: 3 },
    { label: "Ticket sales", lead: 2 },
    { label: "Show", lead: 0 },
  ],
  religious: [
    { label: "Date + venue", lead: 3 },
    { label: "Programs printed", lead: 1 },
    { label: "Day-of", lead: 0 },
  ],
  cultural_show: [
    { label: "Date + venue", lead: 4 },
    { label: "Performers confirmed", lead: 3 },
    { label: "Marketing", lead: 1.5 },
    { label: "Showcase day", lead: 0 },
  ],
  civic: [
    { label: "Date set", lead: 2 },
    { label: "Speaker confirmations", lead: 1 },
    { label: "Programs", lead: 0.5 },
    { label: "Ceremony", lead: 0 },
  ],
  community: [
    { label: "Date + permits", lead: 2 },
    { label: "Volunteer recruitment", lead: 1 },
    { label: "Day-of", lead: 0 },
  ],
};

const BY_CATEGORY: Record<CategoryKey, Record<string, Milestone[]>> = {
  wedding: WEDDING,
  social: SOCIAL,
  corporate: CORPORATE,
  nonprofit: NONPROFIT,
  public: PUBLIC_CULTURAL,
};

/**
 * Universal wedding planning milestones — overlaid on top of the cultural
 * subtype list so the rail shows the COMPLETE picture: cultural tradition
 * checkpoints (Tenaim, Aufruf, Sangeet, Pre-Cana, etc.) AND the logistical /
 * vendor-activity milestones (mood board, vendor lock, tastings, walkthrough,
 * fittings, RSVP cutoff, rehearsal). Without this overlay the rail under-tells
 * the story: every wedding regardless of tradition runs these planning beats.
 *
 * Merge strategy: cultural list wins on label collisions (since it carries the
 * cultural detail). Universal items that don't collide get added.
 */
const WEDDING_CORE: Milestone[] = [
  { label: "Save-the-dates", lead: 6 },
  { label: "Mood board lock", lead: 5, detail: "Cue extracts palettes from your images" },
  { label: "Vendor lock", lead: 4, detail: "Photo · florals · music · baker" },
  { label: "Engagement shoot", lead: 3, detail: "Photographer · save-the-date imagery" },
  { label: "Cake tasting", lead: 3, detail: "Baker selection round" },
  { label: "Catering tasting", lead: 3, detail: "Final menu locked" },
  { label: "Invitations", lead: 2 },
  { label: "Venue walkthrough", lead: 1, detail: "Coordinator + photographer site visit" },
  { label: "Final fittings", lead: 0.5 },
  { label: "Final guest count", lead: 0.5, detail: "Catering + seating cutoff" },
  { label: "Hotel block opens", lead: 0.1, detail: "Out-of-town guests check in" },
  { label: "Rehearsal", lead: 0.03 },
  { label: "Rehearsal dinner", lead: 0.03 },
];

function mergeWeddingMilestones(cultural: Milestone[]): Milestone[] {
  const culturalLabels = new Set(cultural.map((m) => m.label));
  const universalKept = WEDDING_CORE.filter((m) => !culturalLabels.has(m.label));
  return [...universalKept, ...cultural];
}

/**
 * Generic horizon-derived fallback when subtype isn't in the lookup table.
 * Used as a safety net — should be hit only if data is missing.
 */
function genericFallback(): Milestone[] {
  return [
    { label: "Lock the venue", lead: 6 },
    { label: "Vendor lock", lead: 4 },
    { label: "Invitations", lead: 2 },
    { label: "Day-of", lead: 0 },
  ];
}

function statusFor(milestone: Milestone, userHorizonMonths: number): MilestoneStatus {
  const m = milestone.lead;
  // The user's horizon is "months until event"; the milestone happens m months
  // before the event. Compare horizon to milestone lead to set urgency.
  if (userHorizonMonths <= m) return "now"; // overdue or due now
  if (userHorizonMonths <= m + 2) return "next"; // coming up
  return "open"; // still distant
}

export function getMilestones(
  category: CategoryKey,
  subtypeKey: string | null | undefined,
  userHorizonMonths: number,
): MilestoneWithStatus[] {
  // Wedding category: overlay WEDDING_CORE (universal logistical / vendor /
  // travel milestones) onto the subtype-specific cultural list so the rail
  // shows the complete picture, not just the cultural beats.
  let list: Milestone[];
  if (category === "wedding") {
    const cultural = subtypeKey ? WEDDING[subtypeKey] : undefined;
    list = cultural ? mergeWeddingMilestones(cultural) : [...WEDDING_CORE];
  } else {
    const lookup = subtypeKey ? BY_CATEGORY[category][subtypeKey] : undefined;
    list = lookup ?? genericFallback();
  }
  // Sort ascending by lead (largest lead first → earliest milestone first chronologically)
  const sorted = [...list].sort((a, b) => b.lead - a.lead);
  return sorted.map((m) => ({ ...m, status: statusFor(m, userHorizonMonths) }));
}

export function formatLead(months: number): string {
  if (months === 0) return "Day-of";
  if (months <= 0.07) return "Day before";
  if (months < 0.25) return "Days before";
  if (months < 1) return `${Math.round(months * 4)} weeks before`;
  if (months < 1.5) return "1 mo before";
  if (months >= 12) return `${Math.round(months)} mo before`;
  return `${Math.round(months)} mo before`;
}
