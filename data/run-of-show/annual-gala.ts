// data/run-of-show/annual-gala.ts
//
// Annual Gala / Fundraiser — Run of Show
//
// Source prose: product/run-of-show/nonprofit/annual-gala.md
// Source mapping: cultural-research/_milestone-anchor-mapping.md
//   (life-cycle / nonprofit entries — not extracted into a per-tradition
//   table since galas are structurally consistent across causes.)
//
// Time format: wall-clock. Galas have a canonical 6 PM → 11 PM rhythm
// that's stable across the format; wall-clock reads more naturally than
// anchor-relative for the planner's mental model.
//
// Anchor: "the ask" — typically 8:30 PM, after entrée before dessert.
// Rhetorical anchor (not ritual or KPI). Lights come up, auctioneer or
// board chair or beneficiary takes the mic, paddle-raise begins.

import type { RoSRecipe } from "./types";

const annualGala: RoSRecipe = {
  key: "annual_gala",
  labelEn: "Annual Gala / Fundraiser",
  labelEs: "Gala anual / Recaudación de fondos",
  eventType: "nonprofit",
  eventSubtypes: ["annual_gala"], // CC: cross-check vs data/budget-presets.ts
  items: [
    // ─── pre_day_staging (D-7 to D-1) ──────────────────────────────
    {
      key: "final_guest_count",
      phase: "pre_day_staging",
      slot: 10,
      time: "D-7",
      title: "Final guest count locked · sent to caterer (72h notice)",
      vendor: "caterer",
    },
    {
      key: "auction_items_tagged",
      phase: "pre_day_staging",
      slot: 20,
      time: "D-7 to D-3",
      title: "Auction items photographed + tagged + verified",
    },
    {
      key: "printed_materials_delivered",
      phase: "pre_day_staging",
      slot: 30,
      time: "D-3 to D-1",
      title: "Programs · paddle cards · donation envelopes · signage delivered",
      vendor: "printer",
      note:
        "Production timeline gets tight — guest list finalizes 1 week before, " +
        "programs print 4–5 days before. Have a contingency plan for last-minute " +
        "additions (insert sheet, name correction).",
    },
    {
      key: "sponsor_logo_audit",
      phase: "pre_day_staging",
      slot: 40,
      time: "D-1",
      title: "Sponsor logo audit · every contract checked against placements",
      note:
        "Treat recognition deliverables as binding, not aspirational. Read " +
        "each sponsor contract before the event and check them off. A missing " +
        "logo is a contract breach.",
    },
    {
      key: "beneficiary_video_retested",
      phase: "pre_day_staging",
      slot: 50,
      time: "D-1",
      title: "Beneficiary video re-tested for AV quality",
      vendor: "AV partner",
      note:
        "The video is the load-bearing emotional moment of the entire night. " +
        "The ask that follows depends on it. Test three times.",
    },
    {
      key: "speaker_walkthrough",
      phase: "pre_day_staging",
      slot: 60,
      time: "D-2",
      title: "Board chair + host + featured speakers walk-through",
      note:
        "First-time speakers — especially beneficiaries telling their own " +
        "story — need rehearsal time.",
    },

    // ─── load_in (D-1 + morning of) ────────────────────────────────
    {
      key: "venue_load_in",
      phase: "load_in",
      slot: 10,
      time: "D-1",
      title: "Venue load-in · floral install · AV rig · linens",
      vendor: "florist",
      note:
        "Room should be camera-ready by 4 PM D-1 — for next year's marketing " +
        "collateral and to buffer for fixing whatever went wrong with linens.",
    },
    {
      key: "caterer_arrives_morning",
      phase: "load_in",
      slot: 20,
      time: "morning of",
      title: "Caterer arrives + prep begins",
      vendor: "caterer",
    },
    {
      key: "volunteer_orientation",
      phase: "load_in",
      slot: 30,
      time: "afternoon of",
      title: "Volunteer orientation · 60–90 min · roles + venue walkthrough",
      vendor: "volunteer coordinator",
      note:
        "Orientation is its own mini-event. 15–40 volunteers for registration, " +
        "auction running, paddle tracking, silent-auction monitoring.",
    },

    // ─── vip_arrivals (pre-reception) ──────────────────────────────
    {
      key: "vip_pre_reception",
      phase: "vip_arrivals",
      slot: 10,
      time: "5:00 PM",
      title: "Board + major-donor pre-reception · private champagne",
      note:
        "This is where the night's biggest gifts get warmed up. A $50K gift " +
        "doesn't happen during the paddle-raise — it happens here, when a board " +
        "member pulls a donor aside and says 'we'd love to count on you tonight.'",
    },

    // ─── guest_arrivals ────────────────────────────────────────────
    {
      key: "doors_open_cocktail_hour",
      phase: "guest_arrivals",
      slot: 10,
      time: "6:00 PM",
      title: "Doors open · registration · cocktail hour · silent auction live",
      note:
        "Cocktail hour is part of cultivation — the only time guests can move " +
        "freely. Don't compress below 60 min; 75 if the auction is large.",
    },
    {
      key: "guests_seated",
      phase: "guest_arrivals",
      slot: 20,
      time: "7:00 PM",
      title: "Ushers herd guests to dinner room · music shifts to seated ambient",
      note:
        "Often the most logistically chaotic moment of the night — 300+ people " +
        "moving from cocktails to seated. Position ushers to direct flow.",
    },

    // ─── opening_moment ────────────────────────────────────────────
    {
      key: "welcome_remarks",
      phase: "opening_moment",
      slot: 10,
      time: "7:15 PM",
      title: "MC welcome + board + sponsor recognition (by tier)",
      vendor: "MC",
      note:
        "One of the contractual recognition moments — read the sponsor list " +
        "with the right names in the right order. Sets the emotional frame.",
    },

    // ─── first_arc (dinner service through the video) ─────────────
    {
      key: "salad_service_first_speaking",
      phase: "first_arc",
      slot: 10,
      time: "7:30 PM",
      title: "Salad served · brief board chair message or sponsor video (≤5 min)",
      note:
        "Don't let any single speaker dominate before the entrée; the room is " +
        "just getting into rhythm.",
    },
    {
      key: "entree_service",
      phase: "first_arc",
      slot: 20,
      time: "7:50 PM",
      title: "Entrée served · 25–30 min for banquet service of 300+",
      vendor: "caterer",
      note:
        "Most expensive line item of the night and the longest single time " +
        "block. Banquet service takes longer than it feels like it should.",
    },
    {
      key: "beneficiary_story_video",
      phase: "first_arc",
      slot: 30,
      time: "8:15 PM",
      title: "Lights dim · beneficiary story video plays (4–6 min)",
      vendor: "AV partner",
      note:
        "Load-bearing emotional moment of the entire night. If you have one " +
        "production budget line you don't cut, it's this. Test it with people " +
        "who don't know the cause — if they're not engaged at the end, re-cut.",
    },

    // ─── transition (none — anchor lands directly after the video) ─
    // (Galas don't have a transition phase distinct from first_arc; the
    // video → ask is intentionally back-to-back to preserve emotional momentum.)

    // ─── anchor_moment ─────────────────────────────────────────────
    {
      key: "the_ask",
      phase: "anchor_moment",
      slot: 10,
      time: "8:30 PM",
      title: "THE ASK · paddle-raise · 5–15 min of focused fundraising",
      vendor: "auctioneer",
      note:
        "Lights up slightly. Auctioneer or board chair or beneficiary takes " +
        "the mic. The single most undervalued vendor of a gala is the auctioneer " +
        "— a good one extracts 2–3x what a mediocre one does. Don't economize.",
    },

    // ─── continuation_arc (live auction through dessert + dance) ──
    {
      key: "live_auction",
      phase: "continuation_arc",
      slot: 10,
      time: "8:45 PM",
      title: "Live auction · marquee items (4–8 typical)",
      vendor: "auctioneer",
      note:
        "Pacing matters as much during this block as during the paddle-raise. " +
        "Slow auction kills the room's energy and depresses bidding on later items.",
    },
    {
      key: "dessert_service",
      phase: "continuation_arc",
      slot: 20,
      time: "9:00 PM",
      title: "Dessert + coffee · lights up · fundraising portion done",
    },
    {
      key: "total_raised_announcement",
      phase: "continuation_arc",
      slot: 30,
      time: "9:15 PM",
      title: "Total raised announced (if development team can tally)",
      note:
        "'Thanks to all of you, we've raised $487,000 tonight!' If below target, " +
        "soft message instead: 'Thanks for an incredible night — final total in " +
        "follow-up email.' Don't announce a disappointing number publicly.",
    },
    {
      key: "open_dance_floor",
      phase: "continuation_arc",
      slot: 40,
      time: "9:30 PM",
      title: "Band or DJ kicks in · open dance floor · photo moment active",
      note:
        "Many guests leave during this window — they came for the dinner and " +
        "the ask, not for dancing. Room thinning 30 min after the ask is normal.",
    },

    // ─── send_off ──────────────────────────────────────────────────
    {
      key: "formal_close",
      phase: "send_off",
      slot: 10,
      time: "10:30–11:00 PM",
      title: "Formal program ends · last call at bar",
    },

    // ─── strike ────────────────────────────────────────────────────
    {
      key: "auction_item_handoff",
      phase: "strike",
      slot: 10,
      time: "11:00 PM",
      title: "Silent auction winners pick up items · sign-out for every item",
      note:
        "Track every item handoff — losing an auction item is a real embarrassment.",
    },
    {
      key: "venue_strike",
      phase: "strike",
      slot: 20,
      time: "11:00 PM to next AM",
      title: "Floral teardown · AV breakdown · rental returns",
    },

    // ─── day_after (D+1 to D+7) ────────────────────────────────────
    {
      key: "tax_receipts_sent",
      phase: "day_after",
      slot: 10,
      time: "D+1 (within 48 hours)",
      title: "Tax receipts sent to every donor",
      note:
        "Donors expect this. Late receipts read as administrative dysfunction " +
        "and chill the relationship. Have the receipt process pre-staged to " +
        "trigger from the donation log within hours.",
    },
    {
      key: "thank_you_emails",
      phase: "day_after",
      slot: 20,
      time: "D+1 to D+3",
      title: "Thank-you emails · personalized for major gifts, templated for others",
    },
    {
      key: "sponsor_recognition_post_event",
      phase: "day_after",
      slot: 30,
      time: "D+1 to D+7",
      title: "Sponsor recognition post-event · press release · social · annual report",
    },
    {
      key: "board_debrief",
      phase: "day_after",
      slot: 40,
      time: "D+7 to D+14",
      title: "Board debrief · what worked, what to change for next year",
    },
    {
      key: "major_donor_stewardship",
      phase: "day_after",
      slot: 50,
      time: "D+30",
      title: "Major donor one-on-one stewardship · next year's ask begins",
      note:
        "Re-engage major donors within 30 days; that's when next year's gift " +
        "conversation starts.",
    },
  ],
};

export default annualGala;
