// data/run-of-show/muslim-wedding.ts
//
// Muslim Wedding (Nikah + Walima) — Run of Show
//
// Source: cultural-research/weddings/muslim-wedding.md
// Source mapping: cultural-research/_milestone-anchor-mapping.md → Muslim wedding table
//   - book_imam (relative, -6 months) overrides book_officiant
//   - mahr_negotiation (relative, -3 months)
//   - mehndi_or_henna_party (relative, -2 days; South Asian Muslim)
//   - nikah_ceremony (relative, 0) — the Nikah IS the legal marriage
//   - walima_feast (relative, +1 day) — groom's family hosts, Sunnah
//
// V2 recipe. Modal here is Pakistani/South Asian Sunni (largest DFW Muslim
// wedding cohort). Arab Levantine, Khaleeji, Bangladeshi, African-American
// Muslim, and Persian Muslim variants noted in cultural-research entry.
//
// Time format: anchor-relative around "Nikah + 0" (the moment of ijab +
// qabul — offer and acceptance — which IS the marriage). Multi-day uses
// day prefix for sub-events. Wall-clock for Walima evening.
//
// Anchor: ijab + qabul (offer + acceptance of marriage in same meeting,
// before witnesses, in unambiguous language). The moment of marriage.

import type { RoSRecipe } from "./types";

const muslimWedding: RoSRecipe = {
  key: "muslim_wedding",
  labelEn: "Muslim Wedding (Nikah + Walima)",
  labelEs: "Boda musulmana (Nikah + Walima)",
  eventType: "wedding",
  // CC fix 2026-05-24 (session 18y V2 integration) — budget-presets.ts uses
  // canonical key "islamic" (matching master spec §75 Islamic Nikah label),
  // not "muslim". Recipe re-keyed to dispatch.
  eventSubtypes: ["islamic"],
  items: [
    // ─── pre_day_staging (multi-day pre-events, Pakistani modal) ───
    {
      key: "mayoun",
      phase: "pre_day_staging",
      slot: 10,
      time: "D-3 to D-2",
      title: "MAYOUN · turmeric ceremony for bride (Pakistani / South Asian)",
      note:
        "Parallel to Hindu Haldi. Distinctly Pakistani / South Asian Muslim; " +
        "less common in Arab, African-American, or West African Muslim weddings.",
    },
    {
      key: "dholki_or_mehndi",
      phase: "pre_day_staging",
      slot: 20,
      time: "D-2 · evening",
      title: "DHOLKI · women's drum-and-clapping music night + MEHNDI",
      vendor: "mehndi artist",
      note:
        "Pakistani / Bangladeshi tradition. Family-led or hired ensemble. " +
        "Henna applied to bride + family women.",
    },
    {
      key: "mahr_finalized",
      phase: "pre_day_staging",
      slot: 30,
      time: "D-2",
      title: "MAHR · dower terms finalized between families · Nikah Nama drafted",
      note:
        "The mahr is the bride's exclusive property — religiously protected from " +
        "husband or his family. May be paid in full at Nikah or partially deferred " +
        "(mahr-mu'akhkhar). Architecturally NOT a wedding cost — it's a contract " +
        "artifact that follows the bride.",
    },

    // ─── load_in (morning of Nikah) ────────────────────────────────
    {
      key: "venue_setup",
      phase: "load_in",
      slot: 10,
      time: "Nikah − 4 h",
      title: "Venue setup · gender-segregated partition (if observant)",
      note:
        "Many observant Pakistani / Khaleeji Arab / some Bangladeshi weddings " +
        "separate men + women into different rooms or partitioned sides. Vendor " +
        "+ venue must accommodate two-parallel-sub-events at one location.",
    },
    {
      key: "halal_caterer_arrival",
      phase: "load_in",
      slot: 20,
      time: "Nikah − 4 h",
      title: "Halal caterer load-in · meat sourced from halal supplier",
      vendor: "halal caterer",
    },

    // ─── vip_arrivals ──────────────────────────────────────────────
    {
      key: "bride_groom_prep_modest",
      phase: "vip_arrivals",
      slot: 10,
      time: "Nikah − 3 h",
      title: "Bride + groom prep · modest dress required at masjid · hijab-friendly styling",
      vendor: "hair / makeup",
      note:
        "Bride often wears red/maroon/pink heavy embellished lehenga or sharara " +
        "(Pakistani) or specific regional dress. Separate Walima outfit often planned.",
    },
    {
      key: "wali_father_arrives",
      phase: "vip_arrivals",
      slot: 20,
      time: "Nikah − 90 min",
      title: "Wali (bride's guardian) + witnesses arrive · final consent confirmation",
      note:
        "Imam may visit the bride privately or in the women's section to confirm " +
        "consent before announcing the marriage. Not a formality — religious " +
        "safeguard against coerced marriage.",
    },

    // ─── guest_arrivals ───────────────────────────────────────────
    {
      key: "guests_seated_by_section",
      phase: "guest_arrivals",
      slot: 10,
      time: "Nikah − 30 min",
      title: "Guests seated · men's + women's sections (if segregated)",
    },

    // ─── opening_moment ────────────────────────────────────────────
    {
      key: "khutbat_un_nikah",
      phase: "opening_moment",
      slot: 10,
      time: "Nikah − 15 min",
      title: "KHUTBAT UN-NIKAH · imam's sermon on Islamic marriage",
      vendor: "imam",
    },

    // ─── first_arc (Nikah Nama review + wali offer) ────────────────
    {
      key: "wali_offers_bride",
      phase: "first_arc",
      slot: 10,
      time: "Nikah − 5 min",
      title: "Wali offers the bride · imam asks for bride's consent",
      vendor: "imam",
    },

    // ─── anchor_moment (ijab + qabul) ──────────────────────────────
    {
      key: "ijab_offer",
      phase: "anchor_moment",
      slot: 10,
      time: "Nikah + 0",
      title: "IJAB · offer of marriage spoken aloud in clear language",
      note:
        "The moment of marriage in Islamic law. Must be heard by witnesses + " +
        "spoken in the same meeting as the qabul that follows.",
    },
    {
      key: "qabul_acceptance",
      phase: "anchor_moment",
      slot: 20,
      time: "Nikah + 1 min",
      title: "QABUL · acceptance of marriage spoken aloud",
    },
    {
      key: "witnesses_sign_nikah_nama",
      phase: "anchor_moment",
      slot: 30,
      time: "Nikah + 3 min",
      title: "Witnesses sign NIKAH NAMA · contract recorded",
      note:
        "Most Sunni schools (Hanafi / Maliki / Shafi'i / Hanbali) require two " +
        "adult Muslim male witnesses (or one male + two female in some interpretations).",
    },
    {
      key: "dua_concluding_prayer",
      phase: "anchor_moment",
      slot: 40,
      time: "Nikah + 8 min",
      title: "DU'A · concluding prayer for the couple's success",
      vendor: "imam",
    },
    {
      key: "dates_and_sweets",
      phase: "anchor_moment",
      slot: 50,
      time: "Nikah + 12 min",
      title: "Dates + sweets distributed (Sunnah)",
    },

    // ─── transition ────────────────────────────────────────────────
    {
      key: "post_nikah_celebration",
      phase: "transition",
      slot: 10,
      time: "Nikah + 30 min",
      title: "Post-Nikah celebration begins · congratulations + photo session",
    },

    // ─── continuation_arc (Rukhsati for South Asian) ───────────────
    {
      key: "rukhsati",
      phase: "continuation_arc",
      slot: 10,
      time: "Nikah + 4 h",
      title: "RUKHSATI · bride's tearful farewell from parents' home (South Asian)",
      note:
        "Distinctly Pakistani / Bangladeshi / Indian Muslim. Emotionally heaviest " +
        "moment for the bride's family. Father typically gives a Quranic verse + blessing.",
    },

    // ─── send_off (Walima D+1) ─────────────────────────────────────
    {
      key: "walima_feast",
      phase: "send_off",
      slot: 10,
      time: "D+1 · evening",
      title: "WALIMA · banquet hosted by groom's family · public announcement of marriage",
      vendor: "halal caterer",
      note:
        "Sunnah (strongly recommended). Modest to lavish per family means. " +
        "Often the next day; can be the next week or even later.",
    },

    // ─── strike ────────────────────────────────────────────────────
    {
      key: "vendor_breakdown",
      phase: "strike",
      slot: 10,
      time: "Walima + 5 h",
      title: "Vendor breakdown · venue reset",
    },
  ],
};

export default muslimWedding;
