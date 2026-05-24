// data/run-of-show/universal-fallback.ts
//
// Universal fallback Run of Show recipe.
//
// What this is: the recipe CC dispatches for any event whose event_type +
// event_subtype combination doesn't match a tradition-specific recipe.
// Launch-readiness piece — no user lands on a blank Run of Show on
// July 12, 2026, even if their tradition isn't yet covered by a specific
// recipe.
//
// Source: cultural-research/_milestone-anchor-mapping.md "Universal
// milestones" section (20 entries). The planning-phase entries (book
// venue, send invites, etc.) live in data/event-milestones.ts and aren't
// repeated here — this file is the DAY-OF universal skeleton only.
//
// Architecture note: this recipe is intentionally generic. As tradition-
// specific recipes are authored (post-launch — the "second launch"
// scope per Jason's 2026-05-24 direction), they layer on top of (not
// replace) this universal fallback. CC's dispatch logic:
//   1. Find a recipe matching event.event_type + event.event_subtype
//   2. If none matches, fall back to this universal recipe
//   3. (Future) Some recipes may "extend" universal by overriding specific
//      slots rather than replacing the whole arc — that's a follow-up
//      architecture conversation, not in scope today.

import type { RoSRecipe } from "./types";

const universalFallback: RoSRecipe = {
  key: "universal_fallback",
  labelEn: "General event",
  labelEs: "Evento general",
  // Empty eventType + eventSubtypes means: this is the catch-all.
  // CC's dispatcher reads ALL_RECIPES and falls through to this when
  // no tradition-specific match is found. Authoring note: CC's brief
  // shows eventType as a union of 5 values; the dispatcher logic
  // should treat the universal recipe as the explicit fallback.
  // I'm using "public_cultural" since it's the most neutral of the 5;
  // CC: please confirm the dispatcher reads this as the catch-all OR
  // tell me to add a new "any" / "fallback" eventType to the union.
  eventType: "public_cultural",
  eventSubtypes: [],
  items: [
    // ─── pre_day_staging ────────────────────────────────────────────
    {
      key: "day_before_walkthrough",
      phase: "pre_day_staging",
      slot: 10,
      time: "event start − 1 day",
      title: "Walk the venue with key vendors",
      note:
        "Last chance to catch logistics gaps — power for AV, parking flow, " +
        "load-in path, rain plan. Most failures show up the day before, not on the day.",
    },
    {
      key: "rehearsal_or_run_through",
      phase: "pre_day_staging",
      slot: 20,
      time: "event start − 1 day",
      title: "Rehearsal or run-through",
      note:
        "If the event has a formal program — ceremony, speeches, choreography — " +
        "rehearse it. Surprises here are recoverable; surprises on the day aren't.",
    },

    // ─── load_in ────────────────────────────────────────────────────
    {
      key: "vendor_load_in",
      phase: "load_in",
      slot: 10,
      time: "event start − 6 h",
      title: "Vendors arrive and load in",
      vendor: "venue coordinator",
      note:
        "Confirm venue access window in writing. If load-in is scheduled for " +
        "10 AM and the venue isn't unlocked until 11, every vendor downstream slides.",
    },
    {
      key: "av_setup_and_test",
      phase: "load_in",
      slot: 20,
      time: "event start − 4 h",
      title: "AV setup + sound check + video test",
      vendor: "AV lead",
      note:
        "Test every video block in the actual room before the program day. " +
        "If a video fails mid-program, the block dies.",
    },
    {
      key: "floral_and_decor_install",
      phase: "load_in",
      slot: 30,
      time: "event start − 4 h",
      title: "Floral + decor install",
      vendor: "florist",
    },

    // ─── vip_arrivals ───────────────────────────────────────────────
    {
      key: "honoree_and_immediate_family_arrive",
      phase: "vip_arrivals",
      slot: 10,
      time: "event start − 90 min",
      title: "Honoree + immediate family in place",
      note:
        "VIPs should be settled and photo-ready before guests arrive. " +
        "Photographer captures pre-event candids here.",
    },
    {
      key: "vendor_briefing",
      phase: "vip_arrivals",
      slot: 20,
      time: "event start − 60 min",
      title: "Final vendor briefing + cue review",
      note:
        "MC, AV, photographer, lead vendors review the run sheet. Last chance " +
        "to surface conflicts before guest arrival.",
    },

    // ─── guest_arrivals ─────────────────────────────────────────────
    {
      key: "doors_open",
      phase: "guest_arrivals",
      slot: 10,
      time: "event start − 30 min",
      title: "Doors open · greeters in place",
      note:
        "Greeters at every entry point. Wayfinding signage if the venue is " +
        "complex. Build a generous arrival window — guests cluster early or late.",
    },
    {
      key: "pre_program_hospitality",
      phase: "guest_arrivals",
      slot: 20,
      time: "event start − 30 min",
      title: "Pre-program hospitality (drinks, music, mingling)",
      note:
        "Soft music, light beverages or hors d'oeuvres if appropriate. The " +
        "tone the room settles into during this window carries through the program.",
    },

    // ─── opening_moment ─────────────────────────────────────────────
    {
      key: "formal_opening",
      phase: "opening_moment",
      slot: 10,
      time: "event start + 0",
      title: "Formal opening · MC welcomes",
      vendor: "MC",
      note:
        "Welcome the room. Acknowledge honoree, sponsors, anyone the event " +
        "owes recognition to. Set the emotional frame for the rest of the program.",
    },

    // ─── first_arc ──────────────────────────────────────────────────
    {
      key: "first_program_block",
      phase: "first_arc",
      slot: 10,
      time: "event start + 15 min",
      title: "First content block",
      note:
        "Whatever the event's first substantive program piece is — readings, " +
        "presentations, performances. Tradition-specific recipes override this slot.",
    },

    // ─── transition ─────────────────────────────────────────────────
    {
      key: "meal_or_break",
      phase: "transition",
      slot: 10,
      time: "event start + 60 min",
      title: "Meal service or break",
      note:
        "The breath between first arc and the anchor moment. Don't compress; " +
        "guests need the pause. Brief catering on the cue from MC to begin service.",
    },

    // ─── anchor_moment ──────────────────────────────────────────────
    {
      key: "the_anchor_moment",
      phase: "anchor_moment",
      slot: 10,
      time: "event start + 90 min",
      title: "The anchor moment",
      note:
        "The one thing the event exists to do. Tradition-specific recipes name " +
        "this precisely (vows, saptapadi, the ask, the keynote, the vals); " +
        "the universal fallback marks the position so the planner knows where to put it.",
    },

    // ─── continuation_arc ───────────────────────────────────────────
    {
      key: "celebration_or_continuation",
      phase: "continuation_arc",
      slot: 10,
      time: "event start + 2 h",
      title: "Celebration or continuation",
      note:
        "Speeches, music, dancing, second-half content. Energy flows from the " +
        "anchor moment; this is where it spreads.",
    },

    // ─── send_off ───────────────────────────────────────────────────
    {
      key: "formal_close",
      phase: "send_off",
      slot: 10,
      time: "event start + 4 h",
      title: "Formal close · send-off",
      note:
        "Should feel intentional, not like 'the music stopped.' Whether it's " +
        "sparklers, a final toast, a closing prayer — give the room a clear ending.",
    },

    // ─── strike ─────────────────────────────────────────────────────
    {
      key: "vendor_breakdown",
      phase: "strike",
      slot: 10,
      time: "event start + 5 h",
      title: "Vendor breakdown begins",
      vendor: "venue coordinator",
      note:
        "Sequence matters — rentals can't go back in the truck before AV gear " +
        "comes off the stage.",
    },

    // ─── day_after ──────────────────────────────────────────────────
    {
      key: "thank_yous_and_follow_up",
      phase: "day_after",
      slot: 10,
      time: "event start + 1 day",
      title: "Thank-yous + vendor follow-up",
      note:
        "Within 48 hours: thank-yous to vendors, debrief notes while fresh, " +
        "any tax-receipt or sponsor recognition obligations.",
    },
  ],
};

export default universalFallback;
