// data/run-of-show/bar-mitzvah.ts
//
// Bar / Bat Mitzvah — Run of Show
//
// Source prose: product/run-of-show/cultural/bar-mitzvah.md
// Source mapping: cultural-research/_milestone-anchor-mapping.md
//   Coming-of-age extensions — bar mitzvah entries cover synagogue date
//   reservation (3–5 years out), tutor/cantor relationship (24 months
//   weekly), Torah portion, aliyah, haftarah, d'var Torah, mitzvah
//   project, Kiddush lunch, candle lighting, hora chair-lift.
//   The Reform/Conservative day arc lives in this recipe; Orthodox
//   variants noted in comments since the structure differs significantly
//   (Sunday reception, no Saturday photography).
//
// Time format: dual anchor — "Torah reading" for Saturday morning
// service beats, "candle lighting" for Saturday evening reception
// emotional centerpiece. Cross-day arc uses day prefix ("Fri eve",
// "Sat morning", "Sat eve").
//
// Anchor: Torah portion completion (aliyah through d'var Torah).

import type { RoSRecipe } from "./types";

const barMitzvah: RoSRecipe = {
  key: "bar_mitzvah",
  labelEn: "Bar / Bat Mitzvah",
  labelEs: "Bar / Bat Mitzvah",
  eventType: "social",
  // CC fix 2026-05-24 — budget-presets.ts uses combined `bar_bat_mitzvah`
  // subtype (single chip covers both); recipe dispatches on that key.
  eventSubtypes: ["bar_bat_mitzvah"],
  items: [
    // ─── pre_day_staging (D-1 + earlier prep) ──────────────────────
    {
      key: "synagogue_rehearsal_complete",
      phase: "pre_day_staging",
      slot: 10,
      time: "D-30 days",
      title: "Rehearsal at synagogue with cantor + rabbi · on the actual bimah",
      vendor: "cantor",
      note:
        "Bar/bat mitzvah practices on the actual bimah a month before. " +
        "Tutor's final sign-off on cantillation + d'var Torah follows.",
    },
    {
      key: "candle_list_locked",
      phase: "pre_day_staging",
      slot: 20,
      time: "D-7 days",
      title: "Final candle-lighting list locked · 13 + shamash · tributes written",
      note:
        "Bar/bat mitzvah writes a short tribute for each candle's dedicated " +
        "person. Tutor / rabbi can help.",
    },
    {
      key: "out_of_town_family_arrives",
      phase: "pre_day_staging",
      slot: 30,
      time: "D-3 days",
      title: "Out-of-town family arrives · informal welcome dinners",
    },

    // ─── load_in (Friday + Saturday morning prep) ──────────────────
    {
      key: "friday_kabbalat_shabbat",
      phase: "load_in",
      slot: 10,
      time: "Fri · evening",
      title: "Friday Kabbalat Shabbat service · bar/bat mitzvah participates",
      vendor: "cantor",
      note:
        "Family-and-close-friends scale, much smaller than Saturday's " +
        "congregation. Often followed by Shabbat dinner at home or private " +
        "dining room. Warm-up, not a show.",
    },
    {
      key: "saturday_morning_prep",
      phase: "load_in",
      slot: 20,
      time: "Sat · 7:30 AM",
      title: "Bar/bat mitzvah + family prep · final d'var Torah rehearsal at home",
    },

    // ─── vip_arrivals (synagogue arrival) ──────────────────────────
    {
      key: "family_arrives_synagogue",
      phase: "vip_arrivals",
      slot: 10,
      time: "Torah reading − 90 min",
      title: "Family arrives at synagogue · cantor reviews any last-minute concerns",
      vendor: "cantor",
    },

    // ─── guest_arrivals (congregation seats) ───────────────────────
    {
      key: "congregation_seats",
      phase: "guest_arrivals",
      slot: 10,
      time: "Sat · 9:00 AM",
      title: "Congregation arrives · service begins",
      note:
        "Service typically 9 AM or 9:30 AM start; runs 2 to 2.5 hours total.",
    },

    // ─── opening_moment (service opening) ──────────────────────────
    {
      key: "service_opens",
      phase: "opening_moment",
      slot: 10,
      time: "Sat · 9:00 AM",
      title: "Shabbat morning service opens · liturgy begins",
      vendor: "cantor",
    },

    // ─── first_arc (liturgy + family aliyot) ───────────────────────
    {
      key: "morning_liturgy",
      phase: "first_arc",
      slot: 10,
      time: "Torah reading − 75 min",
      title: "Morning Shabbat liturgy · prayers · Torah service prep",
      vendor: "cantor",
    },
    {
      key: "family_aliyot",
      phase: "first_arc",
      slot: 20,
      time: "Torah reading − 15 min",
      title: "Family aliyot · grandparents, parents, siblings called for Torah honors",
      note:
        "Sequence the rabbi coordinated with family in advance. Common " +
        "failure mode: cousin Aaron expected an aliyah and didn't get one. " +
        "Lock list with rabbi at 4-week mark, communicate to family.",
    },

    // ─── anchor_moment (Torah reading + d'var Torah) ───────────────
    {
      key: "bar_mitzvah_aliyah",
      phase: "anchor_moment",
      slot: 10,
      time: "Torah reading + 0",
      title: "Bar/bat mitzvah called to the Torah · aliyah blessing recited",
    },
    {
      key: "torah_portion_chanted",
      phase: "anchor_moment",
      slot: 20,
      time: "Torah reading + 3 min",
      title: "TORAH PORTION CHANTED · the public moment of becoming an adult",
      vendor: "cantor",
      note:
        "If the bar/bat mitzvah freezes, cantor or rabbi steps in to chant " +
        "the next phrase, gives them a moment to recover, hands the reading " +
        "back. Built into the rabbinical job — don't panic.",
    },
    {
      key: "haftarah_chanted",
      phase: "anchor_moment",
      slot: 30,
      time: "Torah reading + 12 min",
      title: "Haftarah · complementary reading from the Prophets",
    },
    {
      key: "dvar_torah",
      phase: "anchor_moment",
      slot: 40,
      time: "Torah reading + 20 min",
      title: "D'VAR TORAH · interpretive speech on the portion's meaning",
      note:
        "Drafted with tutor / rabbi over 5 months. Often references the " +
        "mitzvah project. The intellectual + spiritual centerpiece of the morning.",
    },
    {
      key: "rabbis_charge",
      phase: "anchor_moment",
      slot: 50,
      time: "Torah reading + 27 min",
      title: "Rabbi's personal charge to the bar/bat mitzvah",
    },
    {
      key: "family_blessing_final",
      phase: "anchor_moment",
      slot: 60,
      time: "Torah reading + 30 min",
      title: "Family called up for final blessing",
    },

    // ─── transition (Kiddush + afternoon break) ────────────────────
    {
      key: "kiddush_lunch",
      phase: "transition",
      slot: 10,
      time: "Sat · 11:30 AM",
      title: "Kiddush lunch · synagogue social hall · blessings over wine + challah",
      vendor: "caterer",
      note:
        "Light food, congregational mingling. NOT a 'reception' in the " +
        "wedding sense — coffee-and-cake-and-blessings. Don't over-style; " +
        "synagogue Kiddush is communal and modest.",
    },
    {
      key: "afternoon_break",
      phase: "transition",
      slot: 20,
      time: "Sat · 1:00 PM",
      title: "Family rests · regroups · gets ready for evening",
      note:
        "Morning was emotionally massive. People need a few hours. Don't " +
        "schedule anything here.",
    },

    // ─── continuation_arc (Saturday evening reception) ─────────────
    {
      key: "reception_cocktail_hour",
      phase: "continuation_arc",
      slot: 10,
      time: "Sat · 6:30 PM",
      title: "Reception cocktail hour · guests arrive · photographer roams",
      note:
        "Reception is what secular people think of as 'the bar mitzvah party.' " +
        "Bar/bat mitzvah + immediate family often arrive 30 min after cocktail " +
        "starts (lets guests settle before entrance).",
    },
    {
      key: "grand_entrance",
      phase: "continuation_arc",
      slot: 20,
      time: "Sat · 7:00 PM",
      title: "Grand entrance · family first, bar/bat mitzvah last with high-energy track",
      vendor: "DJ",
    },
    {
      key: "hora",
      phase: "continuation_arc",
      slot: 30,
      time: "Sat · 7:15 PM",
      title: "HORA · Israeli folk dance · bar/bat mitzvah lifted in chair at center",
      note:
        "One of the highest-energy and most-photographed moments. Needs a real " +
        "chair-lift crew — 4 to 6 adults who know what they're doing. If lift " +
        "tips: corners lower together, don't try to recover mid-fall.",
    },
    {
      key: "meal_service",
      phase: "continuation_arc",
      slot: 40,
      time: "Sat · 7:45 PM",
      title: "Three-course meal · parent speeches · video montage · d'var Torah reprise",
      vendor: "caterer",
    },
    {
      key: "candle_lighting",
      phase: "continuation_arc",
      slot: 50,
      time: "candle lighting + 0",
      title: "CANDLE LIGHTING · 13 candles · each dedicated to a person",
      vendor: "MC",
      note:
        "Emotional centerpiece. 15–25 min total — cap at 25 unless compressing " +
        "introductions. Bar/bat mitzvah calls each honoree by name. Brief DJ " +
        "to keep music low under announcements. Brief photographer every " +
        "candle lighting is a portrait.",
    },
    {
      key: "cake",
      phase: "continuation_arc",
      slot: 60,
      time: "candle lighting + 25 min",
      title: "Cake · sometimes folded into candle lighting as candle #13",
      vendor: "baker",
    },
    {
      key: "open_dance_floor",
      phase: "continuation_arc",
      slot: 70,
      time: "candle lighting + 35 min",
      title: "Dance floor opens · DJ-led games · snowball, chair dances, hora reprise",
      vendor: "DJ",
      note:
        "Build in slower-music breaks so adults have moments to dance. The " +
        "night isn't only for the bar/bat mitzvah and their friends.",
    },

    // ─── send_off ──────────────────────────────────────────────────
    {
      key: "informal_close",
      phase: "send_off",
      slot: 10,
      time: "Sat · 11:00 PM",
      title: "Bar/bat mitzvah is exhausted · night fades naturally",
      note:
        "Generally low-key — no formal exit scheduled.",
    },

    // ─── strike ────────────────────────────────────────────────────
    {
      key: "vendor_breakdown",
      phase: "strike",
      slot: 10,
      time: "Sat · 11:30 PM",
      title: "Vendor breakdown begins",
    },

    // ─── day_after ─────────────────────────────────────────────────
    {
      key: "out_of_town_family_departure",
      phase: "day_after",
      slot: 10,
      time: "D+1 to D+2",
      title: "Out-of-town family departs · thank-yous + cleanup",
    },
  ],
};

export default barMitzvah;
