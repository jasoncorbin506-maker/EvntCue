// data/run-of-show/catholic-wedding.ts
//
// Catholic Wedding — Run of Show
//
// Source prose: product/run-of-show/cultural/catholic-wedding.md
// Source mapping: cultural-research/_milestone-anchor-mapping.md
//   Wedding tradition extensions — Catholic wedding table:
//     - book_parish_priest (relative, -9 months) overrides book_officiant
//     - pre_cana_classes (relative, -6 months) — constraint cascade
//     - marriage_license (relative, -2 weeks)
//     - padrinos_confirmation (relative, -3 months) — Mexican-American specific
//     - rehearsal_at_parish (absolute)
//     - wedding_mass (absolute) — parish-confirmed slot
//     - unity_candle_or_lasso (absolute) — within Mass
//     - reception (relative, +2 hours)
//
// Time format: anchor-relative around the consent / nuptial blessing.
// The Catholic sacramental anchor is the exchange of consent (the
// couple's free, knowing, unconditional "yes"). The Nuptial Mass
// containing it runs 60–90 min for a full Mass, 30–45 min for Rite of
// Marriage without Mass. Reception times relative to the reception
// grand entrance since transit makes it a separate cluster.
//
// Anchor: exchange of consent + rings + nuptial blessing.

import type { RoSRecipe } from "./types";

const catholicWedding: RoSRecipe = {
  key: "catholic_wedding",
  labelEn: "Catholic Wedding",
  labelEs: "Boda católica",
  eventType: "wedding",
  eventSubtypes: ["catholic"], // CC: cross-check vs data/budget-presets.ts
  items: [
    // ─── pre_day_staging (D-1) ─────────────────────────────────────
    {
      key: "parish_rehearsal",
      phase: "pre_day_staging",
      slot: 10,
      time: "D-1 · evening",
      title: "Rehearsal at parish · priest or liturgist runs",
      vendor: "parish priest",
      note:
        "Lectors practice Scripture readings — pronunciation + pacing. Family " +
        "members honored with lectorships need rehearsal.",
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
      key: "florist_to_parish",
      phase: "load_in",
      slot: 10,
      time: "Mass − 6 h",
      title: "Florist delivers altar arrangements to parish",
      vendor: "florist",
      note:
        "Per parish liturgist's schedule (often delivered day before for " +
        "Saturday weddings). Confirm parish florist rules — height limits, " +
        "candle restrictions, pre-approved florists.",
    },
    {
      key: "reception_venue_load_in",
      phase: "load_in",
      slot: 20,
      time: "Mass − 6 h",
      title: "Reception venue load-in · decor + AV + linens",
      vendor: "venue coordinator",
    },

    // ─── vip_arrivals (bride/groom prep) ───────────────────────────
    {
      key: "bridal_party_prep",
      phase: "vip_arrivals",
      slot: 10,
      time: "Mass − 5 h",
      title: "Bride + bridesmaids hair + makeup · 4–6 hours",
      vendor: "hair / makeup",
    },
    {
      key: "photographer_briefed_parish_rules",
      phase: "vip_arrivals",
      slot: 20,
      time: "Mass − 3 h",
      title: "Photographer arrives · re-briefed on parish photography rules",
      vendor: "photographer",
      note:
        "Critical: many parishes prohibit photography during consecration. " +
        "Brief the photographer in writing before the day, not on the day.",
    },
    {
      key: "first_look_optional",
      phase: "vip_arrivals",
      slot: 30,
      time: "Mass − 90 min",
      title: "First look (optional · increasingly common)",
      note:
        "Some Catholic couples and families consider it inappropriate (the " +
        "aisle moment is sacred); others embrace it. Confirm in onboarding.",
    },
    {
      key: "travel_to_church",
      phase: "vip_arrivals",
      slot: 40,
      time: "Mass − 45 min",
      title: "Travel to church · 30-min buffer for bride to position",
      note:
        "Catholic churches are often older buildings with limited dressing " +
        "space — bride often arrives already in dress.",
    },

    // ─── guest_arrivals ────────────────────────────────────────────
    {
      key: "pre_ceremony_at_church",
      phase: "guest_arrivals",
      slot: 10,
      time: "Mass − 30 min",
      title: "Guests arrive · ushers seat · prelude music (organ or classical)",
      vendor: "organist",
      note:
        "Almost always the parish's preferred or required organist. Cantor " +
        "often present for responsorial psalm + Gospel acclamation.",
    },

    // ─── opening_moment ────────────────────────────────────────────
    {
      key: "processional",
      phase: "opening_moment",
      slot: 10,
      time: "Mass + 0",
      title: "Processional · parents, wedding party, bride with father last",
      note:
        "Some parishes restrict processional music to sacred / classical. " +
        "Pachelbel's Canon traditional; confirm with liturgist 90 days out.",
    },
    {
      key: "introductory_rites",
      phase: "opening_moment",
      slot: 20,
      time: "Mass + 3 min",
      title: "Introductory rites · sign of the cross · opening prayer · Gloria (sung)",
    },

    // ─── first_arc (Liturgy of the Word) ───────────────────────────
    {
      key: "old_testament_reading",
      phase: "first_arc",
      slot: 10,
      time: "Mass + 10 min",
      title: "Liturgy of the Word · Old Testament reading",
    },
    {
      key: "responsorial_psalm",
      phase: "first_arc",
      slot: 20,
      time: "Mass + 14 min",
      title: "Responsorial psalm (often sung by cantor)",
      vendor: "cantor",
    },
    {
      key: "new_testament_reading",
      phase: "first_arc",
      slot: 30,
      time: "Mass + 18 min",
      title: "New Testament reading",
    },
    {
      key: "gospel_acclamation_and_reading",
      phase: "first_arc",
      slot: 40,
      time: "Mass + 22 min",
      title: "Gospel acclamation · Gospel reading by priest",
      vendor: "parish priest",
    },
    {
      key: "homily",
      phase: "first_arc",
      slot: 50,
      time: "Mass + 28 min",
      title: "Homily",
      vendor: "parish priest",
    },

    // ─── anchor_moment (Rite of Marriage) ──────────────────────────
    {
      key: "questions_of_intent",
      phase: "anchor_moment",
      slot: 10,
      time: "Mass + 38 min",
      title: "Questions of intent · free? willing? open to children?",
      vendor: "parish priest",
    },
    {
      key: "exchange_of_consent",
      phase: "anchor_moment",
      slot: 20,
      time: "Mass + 41 min",
      title: "EXCHANGE OF CONSENT (the vows) · the sacramental moment",
      note:
        "In Catholic theology, the moment of marriage is the consent — the " +
        "couple's free, knowing, unconditional 'yes' before God and witnesses. " +
        "The couple themselves are the ministers of the sacrament.",
    },
    {
      key: "exchange_of_rings",
      phase: "anchor_moment",
      slot: 30,
      time: "Mass + 45 min",
      title: "Blessing and EXCHANGE OF RINGS",
    },
    {
      key: "arras_or_unity_candle",
      phase: "anchor_moment",
      slot: 40,
      time: "Mass + 48 min",
      title: "Optional · arras (13 coins) · lasso · unity candle",
      note:
        "Arras + lasso are common Mexican Catholic additions; lasso is a cord " +
        "or large rosary draped over the couple during nuptial blessing. " +
        "Confirm with family + parish liturgist.",
    },
    {
      key: "liturgy_of_the_eucharist",
      phase: "anchor_moment",
      slot: 50,
      time: "Mass + 52 min",
      title: "Liturgy of the Eucharist · preparation of gifts · eucharistic prayer · communion (if full Nuptial Mass)",
      note:
        "Communion for Catholic guests; non-Catholics may come forward with " +
        "arms crossed for a blessing. Add program note or priest verbal " +
        "explanation to avoid awkward communion-line moments.",
    },
    {
      key: "nuptial_blessing",
      phase: "anchor_moment",
      slot: 60,
      time: "Mass + 68 min",
      title: "NUPTIAL BLESSING · priest blesses the couple",
      vendor: "parish priest",
    },
    {
      key: "sign_of_peace",
      phase: "anchor_moment",
      slot: 70,
      time: "Mass + 72 min",
      title: "Sign of peace",
    },
    {
      key: "concluding_rite",
      phase: "anchor_moment",
      slot: 80,
      time: "Mass + 75 min",
      title: "Concluding rite · final blessing · recessional",
    },

    // ─── transition (post-Mass photos + transit + cocktail) ────────
    {
      key: "church_side_photos",
      phase: "transition",
      slot: 10,
      time: "Mass + 80 min",
      title: "Family + couple photos in sanctuary or on church steps · 45 min minimum",
      vendor: "photographer",
      note:
        "Once you leave the parish, you can't return easily. Build the time.",
    },
    {
      key: "transit_to_reception",
      phase: "transition",
      slot: 20,
      time: "Mass + 2 h",
      title: "Transit to reception · separate vehicles · couple + wedding party + guests",
      note:
        "Reception venue ≤30 min from church if possible. Every extra mile is " +
        "extra cocktail-hour time without the couple. Scout the route at same " +
        "day-of-week and time; pad 30 min.",
    },
    {
      key: "cocktail_hour_at_reception",
      phase: "transition",
      slot: 30,
      time: "Mass + 2.5 h",
      title: "Cocktail hour · 75–90 min · couple often missing for photos",
      note:
        "Catholic reception cocktail hour is longer than Protestant by design " +
        "— transit + post-church photos take real time.",
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
      title: "First dance",
    },
    {
      key: "welcome_priests_blessing_optional",
      phase: "continuation_arc",
      slot: 30,
      time: "reception start + 10 min",
      title: "Welcome · father-of-bride · priest's meal blessing (if staying)",
      note:
        "Often the priest is invited to bless the meal. Confirm whether " +
        "he's staying for reception; designate a family-member backup if not.",
    },
    {
      key: "meal_service",
      phase: "continuation_arc",
      slot: 40,
      time: "reception start + 15 min",
      title: "Meal service · 60–90 min · plated or buffet",
      vendor: "caterer",
    },
    {
      key: "toasts_during_meal",
      phase: "continuation_arc",
      slot: 50,
      time: "reception start + 30 min",
      title: "Toasts · often more explicitly religious flavor",
      note:
        "References to God's blessing, the sacrament, faith journey. Don't " +
        "strip this if the family wants it.",
    },
    {
      key: "parent_dances",
      phase: "continuation_arc",
      slot: 60,
      time: "reception start + 90 min",
      title: "Father-daughter dance · mother-son dance",
    },
    {
      key: "cake_cutting",
      phase: "continuation_arc",
      slot: 70,
      time: "reception start + 100 min",
      title: "Cake cutting",
      vendor: "baker",
    },
    {
      key: "open_dance_floor",
      phase: "continuation_arc",
      slot: 80,
      time: "reception start + 110 min",
      title: "Open dance floor · wine + dancing standard at Catholic receptions",
      vendor: "DJ or band",
    },
    {
      key: "late_night_snack",
      phase: "continuation_arc",
      slot: 90,
      time: "reception start + 4 h",
      title: "Late-night snack service (optional)",
    },

    // ─── send_off ──────────────────────────────────────────────────
    {
      key: "send_off",
      phase: "send_off",
      slot: 10,
      time: "reception start + 5 h",
      title: "Send-off · sparklers, bubbles, or rose petals",
      note:
        "Some Catholic couples honor a 'ribbon dance' tradition or include a " +
        "closing prayer before departure.",
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
      title: "Couple returns to venue for personal items",
    },
  ],
};

export default catholicWedding;
