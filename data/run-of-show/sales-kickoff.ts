// data/run-of-show/sales-kickoff.ts
//
// Sales Kickoff (SKO) — Run of Show
//
// Source prose: product/run-of-show/corporate/sales-kickoff.md
// Source mapping: cultural-research/_milestone-anchor-mapping.md (no
//   corporate-specific entries — SKOs aren't in the 44-tradition mapping
//   since the mapping focuses on cultural/religious anchors. Universal
//   day-of items still apply.)
//
// Time format: wall-clock with day prefix. SKOs are 3-day events with
// canonical day shapes ("Day 1 9 AM registration"), not anchor-relative.
// The keynote IS the anchor moment but it falls mid-Day-2, so time
// strings use absolute Day/clock notation rather than "keynote − N min".
//
// Anchor: the CEO/CRO keynote where the year's number + theme land.

import type { RoSRecipe } from "./types";

const salesKickoff: RoSRecipe = {
  key: "sales_kickoff",
  labelEn: "Sales Kickoff (SKO)",
  labelEs: "Sales Kickoff (SKO)",
  eventType: "corporate",
  eventSubtypes: ["sales_kickoff"], // CC: cross-check vs data/budget-presets.ts
  items: [
    // ─── pre_day_staging (D-3 to D-1) ──────────────────────────────
    {
      key: "av_pre_rig",
      phase: "pre_day_staging",
      slot: 10,
      time: "D-3 to D-1",
      title: "AV pre-rigs keynote stage + branded environment up",
      vendor: "AV partner",
      note:
        "AV is the lead vendor of an SKO — bigger budget line than F&B, often " +
        "bigger than venue. Stage, lighting, sound, video, IMAG, projection mapping.",
    },
    {
      key: "swag_arrives",
      phase: "pre_day_staging",
      slot: 20,
      time: "D-2 to D-1",
      title: "Swag arrives + distributed to room kits or registration",
      vendor: "swag vendor",
      note:
        "Swag is part of the reveal — the moment people unbox their bag and " +
        "the theme is on the merchandise reinforces the keynote. Don't ship the " +
        "theme to a warehouse weeks early; protect the reveal.",
    },
    {
      key: "tech_rehearsal",
      phase: "pre_day_staging",
      slot: 30,
      time: "D-1",
      title: "Full tech rehearsal with keynote slides + reveal moment",
      vendor: "AV partner",
      note:
        "Catch failures here, not on stage in front of 400 reps. Non-negotiable.",
    },
    {
      key: "keynote_speaker_walkthrough",
      phase: "pre_day_staging",
      slot: 40,
      time: "D-1",
      title: "CEO + CRO + key VPs walk the stage",
      note:
        "Senior leaders who haven't keynoted in a year forget how a hot mic " +
        "feels. D-1 walkthrough is mandatory even for experienced executives.",
    },

    // ─── load_in (D-1 evening) ─────────────────────────────────────
    {
      key: "early_arrivals",
      phase: "load_in",
      slot: 10,
      time: "D-1 · evening",
      title: "Early reps arrive · unstructured happy hour",
      note:
        "Some reps arrive a day early (flights, international territories). " +
        "Light hospitality; no formal program.",
    },

    // ─── vip_arrivals (D-1 evening leadership) ─────────────────────
    {
      key: "leadership_dinner",
      phase: "vip_arrivals",
      slot: 10,
      time: "D-1 · evening",
      title: "Leadership team dinner · final theme alignment",
      note:
        "Day-by-day messaging aligned. Final review of theme reveal. " +
        "Agreement on what NOT to say to broader audience until keynote moment.",
    },

    // ─── guest_arrivals (Day 1 morning) ────────────────────────────
    {
      key: "registration_open",
      phase: "guest_arrivals",
      slot: 10,
      time: "Day 1 · 7:30 AM",
      title: "Registration open · badges, room keys, swag distributed",
      note:
        "Build a generous registration window (90–120 min). Flights are " +
        "unpredictable. Wayfinding signage is critical — it tells reps 'you're " +
        "in the right place, this is going to be a good week.'",
    },

    // ─── opening_moment (Day 1 morning) ────────────────────────────
    {
      key: "day_1_opening",
      phase: "opening_moment",
      slot: 10,
      time: "Day 1 · 9:00 AM",
      title: "Host opens program · welcome video · leadership intro",
      vendor: "MC (often CMO or head of enablement)",
      note:
        "Energy at this moment should be high but not peaking — that's the " +
        "keynote tomorrow. Day 1 is warm-up: 'Sunday before the big game.'",
    },

    // ─── first_arc (Day 1 content + Day 2 morning warm-up) ─────────
    {
      key: "market_context_block",
      phase: "first_arc",
      slot: 10,
      time: "Day 1 · 9:30 AM",
      title: "Market context · competitive landscape · macro picture",
      note:
        "CMO or industry analyst opens the substantive content. Sets context " +
        "without pre-empting the keynote's strategy reveal.",
    },
    {
      key: "product_roadmap",
      phase: "first_arc",
      slot: 20,
      time: "Day 1 · 11:00 AM",
      title: "Product roadmap · new releases · positioning",
      note:
        "Energy dip risk highest Day 1 mid-afternoon. Don't load a 45-min deep " +
        "dive into Q3 roadmap at 2:30 PM without a break — you can watch the " +
        "energy die in real time.",
    },
    {
      key: "day_1_segment_breakouts",
      phase: "first_arc",
      slot: 30,
      time: "Day 1 · 2:00 PM",
      title: "Segment / regional breakouts",
    },
    {
      key: "day_1_evening_reception",
      phase: "first_arc",
      slot: 40,
      time: "Day 1 · 6:00 PM",
      title: "Welcome reception · 2-hour open bar · heavy hors d'oeuvres",
      note:
        "Reception is NOT separate from the SKO; it's where the program continues " +
        "in a different register. Plan it accordingly. Cap formal program at 2 hours.",
    },

    // ─── transition (Day 2 morning warm-up before the anchor) ──────
    {
      key: "day_2_humane_start",
      phase: "transition",
      slot: 10,
      time: "Day 2 · 10:00 AM",
      title: "Day 2 starts late · light breakfast 60–90 min before program",
      note:
        "Humane recovery window after Day 1 evening. Day 2 morning attendance " +
        "is the most-watched metric — below 85% means energy is leaking into " +
        "hangovers, not pipeline.",
    },
    {
      key: "day_2_warmup",
      phase: "transition",
      slot: 20,
      time: "Day 2 · 10:00 AM",
      title: "Customer story or high-energy video · external speaker",
      note:
        "Open the morning with something energizing but not load-bearing. Save " +
        "heavy content for after the keynote.",
    },

    // ─── anchor_moment (Day 2 mid-morning) ─────────────────────────
    {
      key: "the_keynote",
      phase: "anchor_moment",
      slot: 10,
      time: "Day 2 · 10:30 AM",
      title: "THE KEYNOTE · CEO/CRO unveils number + theme + strategy",
      vendor: "AV partner",
      note:
        "Build at least 60 min for this even if slides say 35. Reveal moment, " +
        "applause, unscripted Q&A, energy spike. If the keynote runs 35 min flat, " +
        "you've under-loaded the moment. Theme stays in 4–5 heads until this moment.",
    },

    // ─── continuation_arc (post-keynote through Day 3) ─────────────
    {
      key: "day_2_themed_lunch",
      phase: "continuation_arc",
      slot: 10,
      time: "Day 2 · 12:00 PM",
      title: "Themed lunch · room reacts to the reveal",
      note:
        "First meal under the new theme. Branded environment shifts subtly. " +
        "Don't over-program lunch with content — the conversations at tables " +
        "ARE part of the deliverable.",
    },
    {
      key: "day_2_strategy_block",
      phase: "continuation_arc",
      slot: 20,
      time: "Day 2 · 2:00 PM",
      title: "Strategy + account planning + vertical breakouts",
      note:
        "Every strategy block ends with a concrete 'here's what's different in " +
        "your first deal back.' Theory without execution is the most common " +
        "Day 2 afternoon failure.",
    },
    {
      key: "presidents_club_recognition",
      phase: "continuation_arc",
      slot: 30,
      time: "Day 2 · 7:00 PM",
      title: "President's Club recognition · awards · evening event",
      note:
        "Recognition lands BEFORE open bar. CRO or CEO personally names top " +
        "performers with a sentence each. Generic 'congrats to top 10' lands " +
        "like a holiday card.",
    },
    {
      key: "day_3_execution_breakouts",
      phase: "continuation_arc",
      slot: 40,
      time: "Day 3 · 9:00 AM",
      title: "Execution breakouts · first 30 days back at desk",
      note:
        "Half-day typical. Focused on what reps do Monday morning when they " +
        "get back to their territory.",
    },

    // ─── send_off (Day 3 closing) ──────────────────────────────────
    {
      key: "closing_keynote",
      phase: "send_off",
      slot: 10,
      time: "Day 3 · 12:00 PM",
      title: "Closing keynote · CEO reinforces theme · send-off",
      note:
        "Last impression matters as much as first. Skip the limp send-off " +
        "where leadership has already left for the airport — closing should " +
        "feel like a clear baton-pass back to the field.",
    },

    // ─── strike (Day 3 afternoon) ──────────────────────────────────
    {
      key: "av_breakdown",
      phase: "strike",
      slot: 10,
      time: "Day 3 · 2:00 PM",
      title: "AV breakdown · venue cleanup",
      vendor: "AV partner",
    },

    // ─── day_after (D+1) ───────────────────────────────────────────
    {
      key: "post_mortem",
      phase: "day_after",
      slot: 10,
      time: "D+1",
      title: "Internal post-mortem with planning team",
    },
    {
      key: "attendee_survey",
      phase: "day_after",
      slot: 20,
      time: "D+1",
      title: "Attendee survey sent within 48 hours",
      note:
        "Wait a week and responses get diluted with first-week-back noise.",
    },
    {
      key: "broader_org_recap",
      phase: "day_after",
      slot: 30,
      time: "D+1 to D+3",
      title: "Recap communication to non-attendees",
    },
  ],
};

export default salesKickoff;
