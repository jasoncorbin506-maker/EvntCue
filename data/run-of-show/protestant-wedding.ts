// data/run-of-show/protestant-wedding.ts
//
// Protestant Wedding — Run of Show
//
// Source prose: product/run-of-show/cultural/protestant-wedding.md
// Source mapping: cultural-research/_milestone-anchor-mapping.md
//   (Universal milestones cover most of the planning phase; this file
//   only encodes day-of items. Protestant wedding has no dedicated
//   tradition-extension table in the mapping since most variation is
//   denomination-level, captured in prose variants.)
//
// Time format: anchor-relative. The ceremony anchor is the exchange of
// vows → rings → officiant's pronouncement. Times rendered as
// "ceremony − N min" / "ceremony + N min". Reception items use
// "reception start + N min" since they're a separate cluster keyed to
// the grand entrance.
//
// Anchor: the exchange of vows + rings + pronouncement.

import type { RoSRecipe } from "./types";

const protestantWedding: RoSRecipe = {
  key: "protestant_wedding",
  labelEn: "Protestant Wedding",
  labelEs: "Boda protestante",
  eventType: "wedding",
  eventSubtypes: ["protestant"], // CC: cross-check vs data/budget-presets.ts
  items: [
    // ─── pre_day_staging (D-1) ─────────────────────────────────────
    {
      key: "rehearsal_walkthrough",
      phase: "pre_day_staging",
      slot: 10,
      time: "D-1 · evening",
      title: "Rehearsal walks processional + ceremony + recessional",
      vendor: "officiant",
      note:
        "Find out the bride's father can't remember which side to walk on " +
        "tonight, not on the day. Surprises here are recoverable.",
    },
    {
      key: "rehearsal_dinner",
      phase: "pre_day_staging",
      slot: 20,
      time: "D-1 · evening",
      title: "Rehearsal dinner",
    },

    // ─── load_in (morning of) ──────────────────────────────────────
    {
      key: "venue_load_in",
      phase: "load_in",
      slot: 10,
      time: "ceremony − 6 h",
      title: "Vendors load in at ceremony + reception venues",
      vendor: "venue coordinator",
    },
    {
      key: "florist_delivers",
      phase: "load_in",
      slot: 20,
      time: "ceremony − 5 h",
      title: "Florist delivers bouquets · altar arrangements · centerpieces",
      vendor: "florist",
    },

    // ─── vip_arrivals (bride/groom prep) ───────────────────────────
    {
      key: "bridal_party_getting_ready",
      phase: "vip_arrivals",
      slot: 10,
      time: "ceremony − 5 h",
      title: "Bride + bridesmaids hair + makeup · 4–6 hours for full party",
      vendor: "hair / makeup",
    },
    {
      key: "photographer_prep_coverage",
      phase: "vip_arrivals",
      slot: 20,
      time: "ceremony − 3 h",
      title: "Photographer arrives for getting-ready shots",
      vendor: "photographer",
      note:
        "Second shooter common — covers groom prep in parallel.",
    },
    {
      key: "first_look",
      phase: "vip_arrivals",
      slot: 30,
      time: "ceremony − 90 min",
      title: "First look (optional) · couple sees each other privately",
      vendor: "photographer",
      note:
        "Personal preference. Some couples consider it bad luck; others love " +
        "the calmer pre-ceremony connection. Confirm in onboarding who's " +
        "invited — often just couple + photographer.",
    },
    {
      key: "wedding_party_portraits_pre_ceremony",
      phase: "vip_arrivals",
      slot: 40,
      time: "ceremony − 75 min",
      title: "Wedding party portraits (if first look) · frees cocktail hour",
      vendor: "photographer",
    },

    // ─── guest_arrivals ────────────────────────────────────────────
    {
      key: "ceremony_doors_open",
      phase: "guest_arrivals",
      slot: 10,
      time: "ceremony − 30 min",
      title: "Greeters seat guests · pre-ceremony music plays",
      note:
        "Prelude music varies widely by denomination — hymn-based for some, " +
        "processional pop for others. Confirm in onboarding.",
    },

    // ─── opening_moment ────────────────────────────────────────────
    {
      key: "processional",
      phase: "opening_moment",
      slot: 10,
      time: "ceremony + 0",
      title: "Processional · wedding party enters · bride enters last",
    },
    {
      key: "officiant_welcome",
      phase: "opening_moment",
      slot: 20,
      time: "ceremony + 2 min",
      title: "Officiant's welcome + opening",
      vendor: "officiant",
    },

    // ─── first_arc (readings + sermon) ─────────────────────────────
    {
      key: "scripture_readings",
      phase: "first_arc",
      slot: 10,
      time: "ceremony + 5 min",
      title: "Scripture readings · often Corinthians + Song of Songs",
    },
    {
      key: "pastors_message",
      phase: "first_arc",
      slot: 20,
      time: "ceremony + 12 min",
      title: "Pastor's message · sermon or homily (5–15 min, varies)",
      vendor: "officiant",
      note:
        "Length varies wildly by denomination. Baptist often 15–25 min; most " +
        "others 5–15. Ask officiant for estimated length; build a 10-min buffer.",
    },

    // ─── anchor_moment (vows + rings + pronouncement) ──────────────
    {
      key: "vow_exchange",
      phase: "anchor_moment",
      slot: 10,
      time: "ceremony + 22 min",
      title: "THE VOWS · traditional or couple-written",
      note:
        "Vows → rings → pronouncement is the marriage. Don't fragment with " +
        "other ceremony elements.",
    },
    {
      key: "ring_exchange",
      phase: "anchor_moment",
      slot: 20,
      time: "ceremony + 27 min",
      title: "THE RING EXCHANGE",
    },
    {
      key: "optional_unity_ritual",
      phase: "anchor_moment",
      slot: 30,
      time: "ceremony + 30 min",
      title: "Optional unity ritual · candle, sand, communion, handfasting",
      note:
        "Per couple's choice; confirm in onboarding so officiant is briefed. " +
        "Communion-for-guests needs program note or verbal explanation.",
    },
    {
      key: "the_pronouncement",
      phase: "anchor_moment",
      slot: 40,
      time: "ceremony + 33 min",
      title: "THE PRONOUNCEMENT + first kiss",
      vendor: "officiant",
      note:
        "The legal-spiritual moment of marriage.",
    },

    // ─── transition (recessional + cocktail + photos) ──────────────
    {
      key: "recessional",
      phase: "transition",
      slot: 10,
      time: "ceremony + 35 min",
      title: "Recessional · wedding party exits to celebratory music",
    },
    {
      key: "family_portraits",
      phase: "transition",
      slot: 20,
      time: "ceremony + 40 min",
      title: "Family + couple portraits (if not done pre-ceremony)",
      vendor: "photographer",
    },
    {
      key: "cocktail_hour",
      phase: "transition",
      slot: 30,
      time: "ceremony + 45 min",
      title: "Cocktail hour · 60–90 min · light food + drinks + softer music",
      note:
        "75-min minimum unless first look + pre-ceremony portraits were done. " +
        "Don't compress — wedding party needs time for photos.",
    },

    // ─── continuation_arc (reception) ──────────────────────────────
    {
      key: "grand_entrance",
      phase: "continuation_arc",
      slot: 10,
      time: "reception start + 0",
      title: "Grand entrance · wedding party then couple",
      vendor: "DJ or band",
    },
    {
      key: "first_dance",
      phase: "continuation_arc",
      slot: 20,
      time: "reception start + 5 min",
      title: "First dance · immediately after grand entrance",
      vendor: "DJ or band",
    },
    {
      key: "welcome_toast",
      phase: "continuation_arc",
      slot: 30,
      time: "reception start + 10 min",
      title: "Welcome / toast from father of bride · officiant blessing optional",
    },
    {
      key: "meal_service",
      phase: "continuation_arc",
      slot: 40,
      time: "reception start + 15 min",
      title: "Meal service · plated or buffet · 60–90 min",
      vendor: "caterer",
    },
    {
      key: "toasts_during_meal",
      phase: "continuation_arc",
      slot: 50,
      time: "reception start + 30 min",
      title: "Toasts · parents, maid of honor, best man · cap at 3 min each",
      note:
        "Toasts during meal, not after. Once dance floor opens, no one wants " +
        "to stop dancing for toasts.",
    },
    {
      key: "parent_dances",
      phase: "continuation_arc",
      slot: 60,
      time: "reception start + 90 min",
      title: "Father-daughter dance · mother-son dance",
      note:
        "Many couples streamline (combined, or skip for family-situation " +
        "reasons — divorce, deceased parent, estranged). Ask in onboarding.",
    },
    {
      key: "cake_cutting",
      phase: "continuation_arc",
      slot: 70,
      time: "reception start + 100 min",
      title: "Cake cutting · mostly photographic moment",
      vendor: "baker",
    },
    {
      key: "open_dance_floor",
      phase: "continuation_arc",
      slot: 80,
      time: "reception start + 110 min",
      title: "Open dance floor · DJ or band drives",
      vendor: "DJ or band",
      note:
        "Some Protestant denominations restrict alcohol or dancing (Baptist " +
        "historically). Confirm in onboarding.",
    },
    {
      key: "late_night_snack",
      phase: "continuation_arc",
      slot: 90,
      time: "reception start + 4 h",
      title: "Late-night snack service (popular addition · tacos, pizza, donuts)",
    },

    // ─── send_off ──────────────────────────────────────────────────
    {
      key: "send_off",
      phase: "send_off",
      slot: 10,
      time: "reception start + 5 h",
      title: "Send-off · sparklers, bubbles, or rose petals as couple exits",
      note:
        "Brief guests via signage or DJ announcement 15 min before. Designate " +
        "two ushers to manage lighting. Photographer pre-positioned.",
    },

    // ─── strike ────────────────────────────────────────────────────
    {
      key: "vendor_breakdown",
      phase: "strike",
      slot: 10,
      time: "reception start + 5 h",
      title: "Vendor breakdown begins as send-off completes",
    },

    // ─── day_after ─────────────────────────────────────────────────
    {
      key: "personal_item_pickup",
      phase: "day_after",
      slot: 10,
      time: "D+1",
      title: "Couple returns to venue to collect personal items",
    },
  ],
};

export default protestantWedding;
