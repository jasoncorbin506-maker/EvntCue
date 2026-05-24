// data/run-of-show/persian-wedding.ts
//
// Persian Wedding (Sofreh Aghd) — Run of Show
//
// Source: cultural-research/weddings/persian-wedding.md
// Source mapping: cultural-research/_milestone-anchor-mapping.md → Persian wedding table
//   - book_aghd_officiant (relative, -6 months) — cross-faith (Muslim/Jewish/Bahá'í/Zoroastrian/secular)
//   - sofreh_aghd_setup (relative, -4 hours)
//   - aghd_ceremony (relative, 0)
//   - bale_baroon_response_ritual (absolute — three-times-asked moment)
//   - jashn_reception (relative, +3 hours)
//
// V2 Tier 2 recipe. Time format: anchor-relative around "Aghd + 0" (the
// ceremony in front of the Sofreh). Receptions run late — wall-clock
// would mislead since 11 PM is barely mid-evening at a Persian Jashn.
//
// Anchor: the bride's third "yes" to the officiant's three-times-asked
// question. Comedic-romantic moment of truth.

import type { RoSRecipe } from "./types";

const persianWedding: RoSRecipe = {
  key: "persian_wedding",
  labelEn: "Persian Wedding (Sofreh Aghd)",
  labelEs: "Boda persa (Sofreh Aghd)",
  eventType: "wedding",
  eventSubtypes: ["persian"], // CC: cross-check vs data/budget-presets.ts
  items: [
    {
      key: "khastegari_proposal_visit",
      phase: "pre_day_staging",
      slot: 10,
      time: "D-180 (often earlier)",
      title: "KHASTEGARI · formal family-to-family proposal visit · months before",
    },
    {
      key: "sofreh_aghd_setup",
      phase: "load_in",
      slot: 10,
      time: "Aghd − 4 h",
      title: "SOFREH AGHD setup · specialist team works 3-6 hours assembling ceremonial spread",
      vendor: "Sofreh Aghd specialist",
      note:
        "Mirror, candelabra, honey, sugar cones, decorated bread with calligraphy, " +
        "herbs, esfand incense, gold-illuminated holy book or poetry book, fresh " +
        "fruit. The most photographed wedding setup in any culture. $1,500-$10,000+.",
    },
    {
      key: "persian_caterer_load_in",
      phase: "load_in",
      slot: 20,
      time: "Aghd − 3 h",
      title: "Persian caterer load-in · kebabs + saffron rice + khoresht prep",
      vendor: "Persian caterer",
    },
    {
      key: "bride_styling_persian",
      phase: "vip_arrivals",
      slot: 10,
      time: "Aghd − 3 h",
      title: "Bride styling · Persian aesthetic (contoured makeup, voluminous hair, dramatic eye)",
      vendor: "hair / makeup",
    },
    {
      key: "guests_assemble_around_sofreh",
      phase: "guest_arrivals",
      slot: 10,
      time: "Aghd − 30 min",
      title: "Guests assemble around the Sofreh · esfand burned to ward off evil eye",
    },
    {
      key: "groom_takes_position",
      phase: "opening_moment",
      slot: 10,
      time: "Aghd − 10 min",
      title: "Groom takes position in front of Sofreh",
    },
    {
      key: "brides_veiled_entrance",
      phase: "opening_moment",
      slot: 20,
      time: "Aghd − 5 min",
      title: "Bride enters veiled · escorted by brother or close family member",
    },
    {
      key: "mirror_moment",
      phase: "first_arc",
      slot: 10,
      time: "Aghd + 0",
      title: "MIRROR MOMENT · groom sees bride first as her reflection in aayeneh",
      note:
        "Culturally weighted moment; photographed. Symbolizes clarity, reflection, " +
        "authenticity. The bride enters veiled; mirror reveals her.",
    },
    {
      key: "reading_holy_or_poetry_book",
      phase: "first_arc",
      slot: 20,
      time: "Aghd + 5 min",
      title: "Officiant reads from holy book or poetry book (Quran / Torah / Hafez / Rumi)",
      vendor: "officiant (mullah / rabbi / mobed / Bahá'í / secular Hafez reader)",
      note:
        "Denomination-flexible. Persian Muslim uses Quran; Persian Jewish uses " +
        "Torah; Persian Bahá'í uses Kitáb-i-Aqdas; Zoroastrian uses Avesta; " +
        "secular Iranians substitute Shahnameh / Divan of Hafez / Rumi.",
    },
    {
      key: "three_times_asked_first",
      phase: "anchor_moment",
      slot: 10,
      time: "Aghd + 12 min",
      title: "First asking · officiant asks bride if she consents · bride silent",
      note:
        "Tradition: bride pauses for first two askings. Someone in the front row " +
        "delivers 'the bride has gone to pick flowers' line. Comedic-romantic " +
        "delay. Groom and family slightly nervous.",
    },
    {
      key: "three_times_asked_second",
      phase: "anchor_moment",
      slot: 20,
      time: "Aghd + 14 min",
      title: "Second asking · bride silent again · 'she has gone to pick flowers'",
    },
    {
      key: "three_times_asked_third_yes",
      phase: "anchor_moment",
      slot: 30,
      time: "Aghd + 16 min",
      title: "THIRD ASKING · BRIDE'S YES · room erupts in joy",
      note:
        "The famously photographed moment of truth. Bale baroon (the response " +
        "ritual). Marriage moment.",
    },
    {
      key: "honey_ceremony",
      phase: "anchor_moment",
      slot: 40,
      time: "Aghd + 20 min",
      title: "HONEY CEREMONY · couple dips pinky fingers in asal · feeds each other",
      note:
        "Beginning the marriage with sweetness.",
    },
    {
      key: "sugar_cone_unity_cloth",
      phase: "anchor_moment",
      slot: 50,
      time: "Aghd + 24 min",
      title: "Sugar cones rubbed over unity cloth held above couple's heads",
      note:
        "Close women relatives hold the parcheh-ye sefid (white cloth) and rub " +
        "two large rock-sugar cones, sprinkling sweetness onto the marriage.",
    },
    {
      key: "contract_signing_ring_exchange",
      phase: "anchor_moment",
      slot: 60,
      time: "Aghd + 30 min",
      title: "Marriage contract signed · ring exchange · mehrieh terms recorded",
      note:
        "Mehrieh in Persian Muslim weddings often poetically symbolic ('1,001 " +
        "gold coins'). Persian Jewish use ketubah; Persian Bahá'í simpler vow.",
    },
    {
      key: "family_blessings_gift_presentation",
      phase: "transition",
      slot: 10,
      time: "Aghd + 45 min",
      title: "Family blessings · close family present gold jewelry + cash gifts (hediye)",
    },
    {
      key: "jashn_reception_begins",
      phase: "continuation_arc",
      slot: 10,
      time: "Aghd + 2 h",
      title: "JASHN-E AROOSI · reception begins · Persian banquet served",
      vendor: "Persian caterer",
    },
    {
      key: "persian_music_dance",
      phase: "continuation_arc",
      slot: 20,
      time: "Aghd + 3 h",
      title: "Persian music ensemble (santoor + tar + tonbak + ney) · Bandari + Tehrangeles pop · dance floor packed",
      vendor: "Persian live music ensemble",
    },
    {
      key: "cake_cutting_late",
      phase: "continuation_arc",
      slot: 30,
      time: "Aghd + 6 h",
      title: "Cake cutting late in evening · toasts",
    },
    {
      key: "reception_extends_late",
      phase: "send_off",
      slot: 10,
      time: "Aghd + 8 h",
      title: "Reception extends 6-10 hours · informal close past midnight",
      note:
        "Venues with hard 11pm shutoffs are incompatible. Persian receptions " +
        "commonly run until 2-3 AM.",
    },
    {
      key: "vendor_breakdown",
      phase: "strike",
      slot: 10,
      time: "Aghd + 10 h",
      title: "Vendor breakdown · Sofreh specialist disassembles spread",
    },
  ],
};

export default persianWedding;
