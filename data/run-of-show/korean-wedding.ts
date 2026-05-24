// data/run-of-show/korean-wedding.ts
//
// Korean Wedding (Paebaek + Western Reception) — Run of Show
//
// Source: cultural-research/weddings/korean-wedding.md
// Source mapping: cultural-research/_milestone-anchor-mapping.md → Korean wedding table
//   - fortune_teller_date_consult (relative, -12 months; optional)
//   - western_ceremony (relative, 0)
//   - paebaek_ceremony (relative, +2 hours)
//   - pyebaek_jujube_cash_gifts (absolute — specific moment in Paebaek)
//   - reception_banquet (relative, +4 hours)
//
// V2 recipe. Modal here is Korean Protestant (most common DFW Korean
// wedding). Korean Catholic, Buddhist, secular variants noted.
//
// Time format: anchor "Western ceremony + 0" for the church/venue portion;
// "Paebaek + 0" for the traditional Korean ceremony. Single-day hybrid
// is the DFW modal.
//
// Anchor: dual — Western ceremony (Christian for most DFW Korean families)
// + Paebaek (the culturally meaningful family ceremony). Many couples
// report the Paebaek is MORE emotionally significant despite being shorter.

import type { RoSRecipe } from "./types";

const koreanWedding: RoSRecipe = {
  key: "korean_wedding",
  labelEn: "Korean Wedding (Paebaek + Reception)",
  labelEs: "Boda coreana (Paebaek + recepción)",
  eventType: "wedding",
  eventSubtypes: ["korean"], // CC: cross-check vs data/budget-presets.ts
  items: [
    // ─── pre_day_staging ───────────────────────────────────────────
    {
      key: "hanbok_fittings_final",
      phase: "pre_day_staging",
      slot: 10,
      time: "D-7",
      title: "Hanbok fittings final · wonsam (outer robe) + bride's hair ornaments",
      vendor: "hanbok rental boutique",
      note:
        "Bride often wears two pieces: wonsam (red, blue, or gold ceremonial outer " +
        "robe) over the hanbok, with elaborate hair ornaments. Groom wears samogwandae. " +
        "Some brides also wear yeonji-gonji (red dot cheek makeup symbolizing youth).",
    },
    {
      key: "paebaek_table_arranged",
      phase: "pre_day_staging",
      slot: 20,
      time: "D-1",
      title: "Paebaek table + ceremonial items prepared · tea + jujubes + chestnuts",
      note:
        "Special low table, ceremonial cloth, tea set, jujubes (dried red dates), " +
        "chestnuts, screen backdrop with traditional Korean motifs.",
    },

    // ─── load_in ───────────────────────────────────────────────────
    {
      key: "western_venue_setup",
      phase: "load_in",
      slot: 10,
      time: "Western ceremony − 4 h",
      title: "Western ceremony venue setup · floral + AV + seating",
      vendor: "florist",
    },
    {
      key: "reception_venue_setup",
      phase: "load_in",
      slot: 20,
      time: "Western ceremony − 3 h",
      title: "Reception venue setup · Korean banquet hall (Carrollton K-Town typical)",
      vendor: "Korean banquet hall",
    },

    // ─── vip_arrivals ──────────────────────────────────────────────
    {
      key: "bride_groom_western_prep",
      phase: "vip_arrivals",
      slot: 10,
      time: "Western ceremony − 4 h",
      title: "Bride + groom Western attire prep · hair + makeup",
      vendor: "hair / makeup",
    },

    // ─── guest_arrivals ───────────────────────────────────────────
    {
      key: "guests_arrive_church",
      phase: "guest_arrivals",
      slot: 10,
      time: "Western ceremony − 30 min",
      title: "Guests arrive at church or venue",
    },

    // ─── opening_moment (Western ceremony) ─────────────────────────
    {
      key: "western_ceremony_starts",
      phase: "opening_moment",
      slot: 10,
      time: "Western ceremony + 0",
      title: "Western Christian ceremony begins · processional",
      vendor: "Korean Christian pastor (bilingual)",
      note:
        "Most common DFW Korean wedding format is Korean Protestant. Pastor often " +
        "delivers sermon and vows in both Korean and English. Hymns often bilingual.",
    },

    // ─── first_arc (Western ceremony content) ──────────────────────
    {
      key: "hymns_and_sermon",
      phase: "first_arc",
      slot: 10,
      time: "Western ceremony + 5 min",
      title: "Hymns · prayer · sermon (bilingual Korean + English)",
    },
    {
      key: "vows_and_rings_western",
      phase: "first_arc",
      slot: 20,
      time: "Western ceremony + 25 min",
      title: "Vows + ring exchange · unity prayer or unity candle",
    },
    {
      key: "western_ceremony_concludes",
      phase: "first_arc",
      slot: 30,
      time: "Western ceremony + 40 min",
      title: "Pastor pronounces · recessional · group photos",
      vendor: "photographer",
    },

    // ─── transition (cocktail + hanbok change) ─────────────────────
    {
      key: "cocktail_hour",
      phase: "transition",
      slot: 10,
      time: "Western ceremony + 75 min",
      title: "Cocktail hour begins at reception venue · guests mingle",
    },
    {
      key: "hanbok_change",
      phase: "transition",
      slot: 20,
      time: "Paebaek − 30 min",
      title: "Bride + groom change into HANBOK · hair/makeup refresh (15-30 min)",
      vendor: "hanbok rental boutique",
    },

    // ─── anchor_moment (Paebaek ritual cluster) ────────────────────
    {
      key: "paebaek_table_set",
      phase: "anchor_moment",
      slot: 10,
      time: "Paebaek − 5 min",
      title: "Paebaek table set · tea + jujubes + chestnuts staged · families seated",
    },
    {
      key: "formal_bow_brides_family",
      phase: "anchor_moment",
      slot: 20,
      time: "Paebaek + 0",
      title: "PAEBAEK · couple performs deep traditional bow (jeol) to bride's parents",
      note:
        "Bows are formalized and choreographed; depth and posture are specific. " +
        "Many Korean-American couples report the Paebaek is more emotionally " +
        "significant than the Western ceremony, despite being shorter.",
    },
    {
      key: "formal_bow_grooms_family",
      phase: "anchor_moment",
      slot: 30,
      time: "Paebaek + 3 min",
      title: "Couple bows to groom's parents · tea served to parents in formal cups",
    },
    {
      key: "jujubes_chestnuts_catch",
      phase: "anchor_moment",
      slot: 40,
      time: "Paebaek + 12 min",
      title: "JUJUBES + CHESTNUTS thrown to couple · catch in stretched cloth (number = children)",
      note:
        "Parents throw dried jujubes (representing sons) and chestnuts (daughters) " +
        "toward the couple, who attempt to catch as many as possible. Light, photographed.",
    },
    {
      key: "piggyback",
      phase: "anchor_moment",
      slot: 50,
      time: "Paebaek + 18 min",
      title: "PIGGYBACK · groom carries bride around the table · sign of strength + commitment",
      note:
        "Light, playful, photographed extensively.",
    },
    {
      key: "saebae_don_cash_gifts",
      phase: "anchor_moment",
      slot: 60,
      time: "Paebaek + 25 min",
      title: "Elders verbally bless the couple · saebae-don (cash gifts in white envelopes)",
    },

    // ─── continuation_arc (reception) ──────────────────────────────
    {
      key: "reception_attire_change",
      phase: "continuation_arc",
      slot: 10,
      time: "reception start − 15 min",
      title: "Bride changes into reception attire (often Korean-style reception dress)",
    },
    {
      key: "grand_entrance_mc_intro",
      phase: "continuation_arc",
      slot: 20,
      time: "reception start + 0",
      title: "Grand entrance · MC introductions (bilingual)",
      vendor: "MC (bilingual)",
    },
    {
      key: "first_dance",
      phase: "continuation_arc",
      slot: 30,
      time: "reception start + 10 min",
      title: "First dance",
    },
    {
      key: "dinner_kpop_kballad",
      phase: "continuation_arc",
      slot: 40,
      time: "reception start + 30 min",
      title: "Dinner · Korean food (galbi, bulgogi, japchae, banchan) + Western options",
      vendor: "Korean caterer",
    },
    {
      key: "toasts_speeches",
      phase: "continuation_arc",
      slot: 50,
      time: "reception start + 75 min",
      title: "Toasts + speeches · sometimes samul nori (Korean drum) performance",
    },
    {
      key: "open_dance_kpop",
      phase: "continuation_arc",
      slot: 60,
      time: "reception start + 2 h",
      title: "Open dance floor · K-pop, K-R&B, K-ballads mixed with Western pop",
      vendor: "DJ",
    },
    {
      key: "cake_korean_style",
      phase: "continuation_arc",
      slot: 70,
      time: "reception start + 3 h",
      title: "Cake · Korean-style (less sugar, sometimes incorporated rice cake)",
      vendor: "Korean bakery",
    },

    // ─── send_off + strike ─────────────────────────────────────────
    {
      key: "guests_depart_close",
      phase: "send_off",
      slot: 10,
      time: "reception start + 4 h",
      title: "Guests depart · couple's exit",
    },
    {
      key: "vendor_breakdown",
      phase: "strike",
      slot: 10,
      time: "reception start + 5 h",
      title: "Vendor breakdown · hanbok returned to boutique",
    },

    // ─── day_after ─────────────────────────────────────────────────
    {
      key: "saebae_don_acknowledgment",
      phase: "day_after",
      slot: 10,
      time: "D+1 to D+7",
      title: "Saebae-don tracking + thank-you notes",
      note:
        "Paper-and-envelope cash gift tradition. EvntCue's structured tracking + " +
        "auto-draft thank-you notes is a meaningful insertion.",
    },
  ],
};

export default koreanWedding;
