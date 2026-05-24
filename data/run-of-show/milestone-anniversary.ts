// data/run-of-show/milestone-anniversary.ts
// Milestone Anniversary (25th, 50th, etc.)
//
// V2 Tier 5. Major wedding anniversary celebration — 25th (silver),
// 50th (golden), 60th (diamond). Often paired with vow renewal ceremony.
// Family-organized; couple is honored rather than hosting.
//
// Anchor: family gathering + speeches honoring the couple's years together.
// Often a vow renewal embedded.

import type { RoSRecipe } from "./types";

const milestoneAnniversary: RoSRecipe = {
  key: "milestone_anniversary",
  labelEn: "Milestone Anniversary",
  labelEs: "Aniversario importante (bodas de plata / oro)",
  eventType: "social",
  // CC fix 2026-05-24 (session 18y V2 integration) — budget-presets.ts uses
  // generic "anniversary" key (covers all milestone anniversaries). Adding
  // it so today's funnel (generic anniversary) dispatches here. The named
  // milestone keys stay for future regional splits.
  eventSubtypes: ["anniversary", "milestone_anniversary", "silver_anniversary", "golden_anniversary"],
  items: [
    {
      key: "anniversary_planning_children_led",
      phase: "pre_day_staging",
      slot: 10,
      time: "D-180",
      title: "Anniversary planning · typically led by adult children for the couple",
      note:
        "Couple is honored, not hosting. Children/grandchildren take on planning " +
        "role similar to parents-of-the-bride at a wedding.",
    },
    {
      key: "original_wedding_party_invited",
      phase: "pre_day_staging",
      slot: 20,
      time: "D-120",
      title: "Original wedding party invited (where alive) · best man / maid of honor / bridesmaids",
      note:
        "Honoring continuity — those who witnessed the original wedding. " +
        "Emotionally significant when original wedding party can attend.",
    },
    {
      key: "venue_booked",
      phase: "pre_day_staging",
      slot: 30,
      time: "D-150",
      title: "Venue booked · banquet hall, restaurant private room, or home",
    },
    {
      key: "vow_renewal_clergy_arranged",
      phase: "pre_day_staging",
      slot: 40,
      time: "D-90",
      title: "Officiant arranged for vow renewal (if included)",
      vendor: "officiant",
    },
    {
      key: "memory_montage_prepared",
      phase: "pre_day_staging",
      slot: 50,
      time: "D-30",
      title: "Memory montage prepared · photos + videos from years together",
      note:
        "Often the emotional centerpiece of the celebration. Children compile " +
        "photos from across the couple's life together.",
    },
    {
      key: "venue_setup",
      phase: "load_in",
      slot: 10,
      time: "celebration − 4 h",
      title: "Venue decor setup · anniversary-themed (silver, gold, diamond accents)",
    },
    {
      key: "catering_load_in",
      phase: "load_in",
      slot: 20,
      time: "celebration − 3 h",
      title: "Catering load-in · meal featuring couple's favorite dishes",
      vendor: "caterer",
    },
    {
      key: "couple_in_formal_attire",
      phase: "vip_arrivals",
      slot: 10,
      time: "celebration − 60 min",
      title: "Couple dressed in formal attire · sometimes recreating wedding-day styling",
    },
    {
      key: "guests_arrive_cocktails",
      phase: "guest_arrivals",
      slot: 10,
      time: "celebration + 0",
      title: "Guests arrive · cocktails + appetizers · old photos displayed",
    },
    {
      key: "couple_greeted_with_applause",
      phase: "opening_moment",
      slot: 10,
      time: "celebration + 15 min",
      title: "Couple enters together · greeted with applause + family welcome",
    },
    {
      key: "memory_montage_played",
      phase: "first_arc",
      slot: 10,
      time: "celebration + 30 min",
      title: "Memory montage played · highlights from decades together",
    },
    {
      key: "vow_renewal_ceremony",
      phase: "anchor_moment",
      slot: 10,
      time: "celebration + 50 min",
      title: "VOW RENEWAL CEREMONY (if included) · couple renews commitment",
      vendor: "officiant",
      note:
        "Modernized vows often reflect the years of shared life. Original " +
        "wedding rings may be re-blessed; some couples exchange new bands.",
    },
    {
      key: "children_grandchildren_speeches",
      phase: "anchor_moment",
      slot: 20,
      time: "celebration + 75 min",
      title: "Speeches from children + grandchildren honoring the couple",
      note:
        "Emotional centerpiece. Often each child speaks; sometimes grandchildren " +
        "share favorite memories.",
    },
    {
      key: "dinner_served",
      phase: "continuation_arc",
      slot: 10,
      time: "celebration + 2 h",
      title: "Dinner served · multi-course or buffet · couple's favorite foods",
      vendor: "caterer",
    },
    {
      key: "couple_dance",
      phase: "continuation_arc",
      slot: 20,
      time: "celebration + 3 h",
      title: "Couple's dance · often to their wedding song",
    },
    {
      key: "open_dance_floor",
      phase: "continuation_arc",
      slot: 30,
      time: "celebration + 3.5 h",
      title: "Open dance floor · era-appropriate music + couple's favorites",
      vendor: "DJ",
    },
    {
      key: "cake_cutting",
      phase: "continuation_arc",
      slot: 40,
      time: "celebration + 4 h",
      title: "Cake cutting · often replica of wedding cake style",
    },
    {
      key: "celebration_close",
      phase: "send_off",
      slot: 10,
      time: "celebration + 5 h",
      title: "Celebration close · couple thanks guests · departure",
    },
    {
      key: "vendor_breakdown",
      phase: "strike",
      slot: 10,
      time: "celebration + 5.5 h",
      title: "Vendor breakdown",
    },
  ],
};

export default milestoneAnniversary;
