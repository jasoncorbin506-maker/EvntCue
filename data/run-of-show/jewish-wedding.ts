// data/run-of-show/jewish-wedding.ts
//
// Jewish Wedding — Run of Show
//
// Source: cultural-research/weddings/jewish-wedding.md
// Source mapping: cultural-research/_milestone-anchor-mapping.md → Jewish wedding table
//   - book_rabbi (relative, -9 months) overrides book_officiant
//   - book_cantor (relative, -6 months)
//   - aufruf (relative, -7 days) — pre-Shabbat-before-wedding synagogue blessing
//   - tisch (relative, -2 hours from chuppah)
//   - bedeken (relative, -30 min from chuppah)
//   - chuppah_ceremony (relative, 0)
//   - breaking_the_glass (absolute — end-of-ceremony moment)
//   - yichud (relative, +15 min) — first moments alone for couple
//   - hora_dancing (absolute — reception centerpiece)
//
// V2 recipe. Modal here is Reform / Conservative (DFW's largest Jewish
// cohort; Orthodox / Modern Orthodox variants noted in comments).
//
// Time format: anchor-relative around "chuppah + 0" (the ceremony under
// the canopy where kiddushin happens). Hebrew calendar restrictions
// noted but not encoded in time strings (CC's dispatcher should surface
// Hebrew-calendar-aware date selection elsewhere).
//
// Anchor: kiddushin (ring exchange + the "Harei at mekudeshet li"
// declaration) under the chuppah.

import type { RoSRecipe } from "./types";

const jewishWedding: RoSRecipe = {
  key: "jewish_wedding",
  labelEn: "Jewish Wedding",
  labelEs: "Boda judía",
  eventType: "wedding",
  eventSubtypes: ["jewish"], // CC: cross-check vs data/budget-presets.ts
  items: [
    // ─── pre_day_staging ───────────────────────────────────────────
    {
      key: "aufruf",
      phase: "pre_day_staging",
      slot: 10,
      time: "Shabbat before · synagogue",
      title: "AUFRUF · groom's Torah honor on the Shabbat before · sponsored kiddush",
      vendor: "rabbi",
      note:
        "Synagogue blessing the week before. Family + community sponsor a kiddush " +
        "after services. Orthodox / Conservative tradition; less common in Reform.",
    },
    {
      key: "mikveh_bride",
      phase: "pre_day_staging",
      slot: 20,
      time: "D-1",
      title: "MIKVEH · bride's ritual immersion (Orthodox / some Conservative)",
      note:
        "Religious institution, not a vendor. Appointment coordination is a planning " +
        "task no incumbent tool models.",
    },

    // ─── load_in ───────────────────────────────────────────────────
    {
      key: "kosher_caterer_load_in",
      phase: "load_in",
      slot: 10,
      time: "chuppah − 5 h",
      title: "Kosher caterer load-in · mashgiach on-site if observant",
      vendor: "kosher caterer",
      note:
        "Full kashrut requires kosher-supervised kitchen + certified ingredients + " +
        "meat/dairy separation + (for the most observant) a mashgiach during prep " +
        "and serving. DFW kosher caterer pool is smaller than NYC/LA.",
    },
    {
      key: "chuppah_built",
      phase: "load_in",
      slot: 20,
      time: "chuppah − 4 h",
      title: "Chuppah built · canopy + four poles · floral if applicable",
      vendor: "florist",
      note:
        "Can be a tallit stretched between four poles held by friends, a fabric " +
        "canopy, or an elaborate floral structure. Symbolizes the home they will build.",
    },

    // ─── vip_arrivals ──────────────────────────────────────────────
    {
      key: "bride_groom_prep",
      phase: "vip_arrivals",
      slot: 10,
      time: "chuppah − 4 h",
      title: "Bride + groom prep separately · in some traditions don't see each other for days",
      vendor: "hair / makeup",
    },
    {
      key: "tisch_and_ketubah_signing",
      phase: "vip_arrivals",
      slot: 20,
      time: "chuppah − 2 h",
      title: "TISCH · groom's gathering + KETUBAH signing by two witnesses",
      vendor: "rabbi",
      note:
        "The marriage is NOT solemnized until the ketubah is signed. Rabbi will " +
        "not start the chuppah ceremony without it. In Orthodox practice, men-only " +
        "tisch with male witnesses; Reform/Conservative often mixed-gender signing room.",
    },
    {
      key: "bedeken_veiling",
      phase: "vip_arrivals",
      slot: 30,
      time: "chuppah − 30 min",
      title: "BEDEKEN · groom (escorted by both fathers) places veil over bride's face",
      note:
        "Ashkenazi tradition. References Jacob being deceived into marrying Leah. " +
        "Emotional, photographed.",
    },

    // ─── guest_arrivals ───────────────────────────────────────────
    {
      key: "guests_seated",
      phase: "guest_arrivals",
      slot: 10,
      time: "chuppah − 15 min",
      title: "Guests seated · kippot distributed to male guests (+ women in egalitarian)",
    },

    // ─── opening_moment ────────────────────────────────────────────
    {
      key: "processional",
      phase: "opening_moment",
      slot: 10,
      time: "chuppah + 0",
      title: "Processional · rabbi · grandparents · parents · attendants · couple",
      note:
        "Groom often escorted by both parents in Jewish tradition; bride often " +
        "escorted by both parents. Egalitarian convention by design.",
    },

    // ─── first_arc (welcome + circling) ────────────────────────────
    {
      key: "welcoming_blessings",
      phase: "first_arc",
      slot: 10,
      time: "chuppah + 2 min",
      title: "Welcoming blessings + Mi Adir (sung)",
      vendor: "cantor",
    },
    {
      key: "circling",
      phase: "first_arc",
      slot: 20,
      time: "chuppah + 5 min",
      title: "Bride circles groom seven times (Ashkenazi) OR couple circles each other (egalitarian)",
      note:
        "Symbolically 'building the walls' of their new home. Modern egalitarian " +
        "couples often circle each other (each three times, then once together) " +
        "to reflect partnership.",
    },
    {
      key: "erusin_betrothal_blessings",
      phase: "first_arc",
      slot: 30,
      time: "chuppah + 10 min",
      title: "Erusin (betrothal) blessings + first kiddush cup",
    },

    // ─── anchor_moment (kiddushin) ─────────────────────────────────
    {
      key: "ring_exchange_kiddushin",
      phase: "anchor_moment",
      slot: 10,
      time: "chuppah + 14 min",
      title:
        "KIDDUSHIN · groom places ring · 'Harei at mekudeshet li b'taba'at zo k'dat Moshe v'Yisrael'",
      vendor: "rabbi",
      note:
        "The legal-religious moment. 'Behold, you are consecrated to me with this " +
        "ring according to the law of Moses and Israel.' In egalitarian ceremonies, " +
        "bride gives a ring with similar declaration adapted.",
    },
    {
      key: "ketubah_read_aloud",
      phase: "anchor_moment",
      slot: 20,
      time: "chuppah + 18 min",
      title: "KETUBAH read aloud · often Aramaic + English summary",
    },
    {
      key: "sheva_brachot",
      phase: "anchor_moment",
      slot: 30,
      time: "chuppah + 22 min",
      title: "SHEVA BRACHOT · seven blessings sung under the canopy",
      vendor: "cantor",
      note:
        "Sung or chanted under the chuppah, blessing the couple and the joy of " +
        "the marriage. Also recited at festive meals for the seven days following.",
    },
    {
      key: "second_kiddush_cup",
      phase: "anchor_moment",
      slot: 40,
      time: "chuppah + 28 min",
      title: "Second kiddush cup",
    },
    {
      key: "breaking_the_glass",
      phase: "anchor_moment",
      slot: 50,
      time: "chuppah + 30 min",
      title: "BREAKING THE GLASS · 'Mazel tov!' · ceremony concludes",
      note:
        "Symbolizes destruction of the Temple in Jerusalem + persistence of grief " +
        "even in joyful moments. Increasingly both partners break a glass in " +
        "egalitarian ceremonies.",
    },

    // ─── transition (yichud + cocktail) ────────────────────────────
    {
      key: "recessional",
      phase: "transition",
      slot: 10,
      time: "chuppah + 32 min",
      title: "Recessional · wedding party exits",
    },
    {
      key: "yichud",
      phase: "transition",
      slot: 20,
      time: "chuppah + 35 min",
      title: "YICHUD · couple in private room for 15–30 min (Ashkenazi)",
      note:
        "Requires private room locked with two witnesses outside (witnessing the " +
        "couple were alone together). Real logistical requirement. Often the moment " +
        "the couple eats for the first time after fasting. Sephardim skip yichud " +
        "and proceed directly to reception.",
    },
    {
      key: "cocktail_hour",
      phase: "transition",
      slot: 30,
      time: "chuppah + 45 min",
      title: "Cocktail hour · guests mingle while couple is in yichud",
    },

    // ─── continuation_arc (reception with hora) ────────────────────
    {
      key: "grand_entrance",
      phase: "continuation_arc",
      slot: 10,
      time: "reception start + 0",
      title: "Couple announced · grand entrance",
      vendor: "MC",
    },
    {
      key: "hora_chair_lift",
      phase: "continuation_arc",
      slot: 20,
      time: "reception start + 5 min",
      title: "HORA · couple lifted on chairs · concentric circles dance · 'Hava Nagila'",
      vendor: "klezmer band",
      note:
        "Signature Jewish wedding moment + what guests photograph most. Must " +
        "happen EARLY in the reception (energy peak). Chairs must be sturdy + " +
        "dancers experienced. Hora is what guests remember.",
    },
    {
      key: "israeli_folk_dance_set",
      phase: "continuation_arc",
      slot: 30,
      time: "reception start + 20 min",
      title: "Israeli folk-dance set · klezmer band drives",
      vendor: "klezmer band",
    },
    {
      key: "dinner_with_toasts",
      phase: "continuation_arc",
      slot: 40,
      time: "reception start + 45 min",
      title: "Dinner · motzi blessing + birkat hamazon if observant · toasts",
      vendor: "kosher caterer",
    },
    {
      key: "mezinke_optional",
      phase: "continuation_arc",
      slot: 50,
      time: "reception start + 90 min",
      title: "MEZINKE · parents' dance if marrying child is last unmarried sibling (Ashkenazi)",
      note:
        "Eastern European Ashkenazi tradition. Parents honored on dance floor.",
    },
    {
      key: "open_dance_floor",
      phase: "continuation_arc",
      slot: 60,
      time: "reception start + 2 h",
      title: "Open dance floor · Jewish + secular music mixed",
    },
    {
      key: "cake",
      phase: "continuation_arc",
      slot: 70,
      time: "reception start + 3 h",
      title: "Cake · challah for the motzi at the start; tiered cake at the end",
    },

    // ─── send_off + strike ─────────────────────────────────────────
    {
      key: "send_off",
      phase: "send_off",
      slot: 10,
      time: "reception start + 4 h",
      title: "Couple departs · informal close",
    },
    {
      key: "vendor_breakdown",
      phase: "strike",
      slot: 10,
      time: "reception start + 5 h",
      title: "Vendor breakdown",
    },

    // ─── day_after (sheva brachot dinners) ─────────────────────────
    {
      key: "sheva_brachot_dinners_week",
      phase: "day_after",
      slot: 10,
      time: "D+1 to D+7",
      title: "SHEVA BRACHOT DINNERS · 7 nights of festive meals with the blessings",
      note:
        "Friends and family host the couple at festive meals for the week following " +
        "the wedding, with the seven blessings recited each night.",
    },
  ],
};

export default jewishWedding;
