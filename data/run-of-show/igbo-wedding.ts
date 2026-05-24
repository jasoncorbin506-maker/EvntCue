// data/run-of-show/igbo-wedding.ts
//
// Igbo Wedding (Igba Nkwu + White Wedding) — Run of Show
//
// Source: cultural-research/weddings/igbo-wedding.md
// Source mapping: Shares anchor classifications with Yoruba wedding (Nigerian
// diaspora pair). See yoruba-wedding.ts for the mapping table.
//
// V2 Tier 2 recipe. Centers on Igba Nkwu (the wine carrying ceremony) —
// the bride formally identifies and accepts her husband by carrying palm
// wine to him through the crowd. Per Igbo custom, marriage is not legally
// recognized without bride price payment — even with church/court wedding.
//
// Anchor: Igba Nkwu — bride finds groom + sips wine + offers it to him +
// he drinks. They are married per Igbo custom. The deliberate slowness +
// bride's free choice are the point: marriage is consented, not coerced.

import type { RoSRecipe } from "./types";

const igboWedding: RoSRecipe = {
  key: "igbo_wedding",
  labelEn: "Igbo Wedding (Igba Nkwu)",
  labelEs: "Boda igbo (Igba Nkwu)",
  eventType: "wedding",
  eventSubtypes: ["igbo"], // CC: cross-check vs data/budget-presets.ts
  items: [
    {
      key: "iku_aka_introduction",
      phase: "pre_day_staging",
      slot: 10,
      time: "D-180 (often earlier)",
      title: "IKU AKA · 'knocking on the door' · groom's family first formal visit · kola nuts + palm wine + gifts",
    },
    {
      key: "iju_ese_investigation",
      phase: "pre_day_staging",
      slot: 20,
      time: "D-120",
      title: "IJU ESE · bride's family inquires about groom's family lineage + character",
      note:
        "Historic ritual; sometimes lightly preserved in modern practice.",
    },
    {
      key: "bride_price_negotiation",
      phase: "pre_day_staging",
      slot: 30,
      time: "D-90 to D-30",
      title: "IME EGO · bride price negotiation across multi-meeting family-to-family discussion",
      note:
        "Compulsory for legal recognition of marriage under Igbo custom. Amount " +
        "is typically modest/symbolic ($500-$5,000 US diaspora); the act of " +
        "payment matters, not the amount. Bride's father names a high initial " +
        "number; groom's family negotiates down with humor + proverbs.",
    },
    {
      key: "town_unions_honors_confirmed",
      phase: "pre_day_staging",
      slot: 40,
      time: "D-14",
      title: "Town union honors confirmed · cash gifts for bride/groom's home-village umunna",
    },
    {
      key: "palm_wine_sourced_fresh",
      phase: "load_in",
      slot: 10,
      time: "Igba Nkwu − 2 days",
      title: "Palm wine sourced fresh · from West African suppliers (perishable)",
      vendor: "palm wine supplier",
      note:
        "Some families bring palm wine from Nigeria. Others substitute red wine " +
        "or grape juice for symbolic purposes if fresh palm wine unavailable.",
    },
    {
      key: "kola_nuts_sourced",
      phase: "load_in",
      slot: 20,
      time: "Igba Nkwu − 1 day",
      title: "Kola nuts (oji) sourced · fresh from West African grocery stores",
      note:
        "Quality matters; respected elders will notice if inferior.",
    },
    {
      key: "venue_seating_setup",
      phase: "load_in",
      slot: 30,
      time: "Igba Nkwu − 3 h",
      title: "Venue setup · both families seated · iko (calabash cup) and ceremonial items prepared",
    },
    {
      key: "bride_isiagu_red_coral",
      phase: "vip_arrivals",
      slot: 10,
      time: "Igba Nkwu − 2 h",
      title: "Bride in isiagu + ichafu + red coral beads · groom in isiagu shirt + red cap",
      vendor: "isiagu boutique",
      note:
        "Signature Igbo bridal red coral beads adornment. Sourced via Nigerian " +
        "specialty jewelers.",
    },
    {
      key: "groom_family_arrives_procession",
      phase: "guest_arrivals",
      slot: 10,
      time: "Igba Nkwu − 30 min",
      title: "Groom + family arrive with formal procession · gifts presented",
    },
    {
      key: "kola_nut_breaking_prayer",
      phase: "opening_moment",
      slot: 10,
      time: "Igba Nkwu + 0",
      title: "KOLA NUT BREAKING · elder breaks the kola nut · prays for families and union",
      note:
        "Central to Igbo culture. Number of cotyledons (segments) interpreted " +
        "symbolically.",
    },
    {
      key: "bride_price_formal_payment",
      phase: "first_arc",
      slot: 10,
      time: "Igba Nkwu + 15 min",
      title: "Bride price formally paid · cash counted + applauded + acknowledged publicly",
      note:
        "Ceremonial moment. Negotiation theater completed or recapped publicly.",
    },
    {
      key: "town_union_honors_paid",
      phase: "first_arc",
      slot: 20,
      time: "Igba Nkwu + 25 min",
      title: "Town union honors paid to bride/groom's village umunna representatives",
    },
    {
      key: "bride_emerges_presented_to_father",
      phase: "first_arc",
      slot: 30,
      time: "Igba Nkwu + 35 min",
      title: "Bride emerges from her quarters · presented to her father",
    },
    {
      key: "father_gives_iko_palm_wine_cup",
      phase: "first_arc",
      slot: 40,
      time: "Igba Nkwu + 45 min",
      title: "Father gives iko (calabash cup) filled with palm wine to bride",
      note:
        "Father (or eldest uncle if father deceased) tells bride to find her husband.",
    },
    {
      key: "bride_searches_through_crowd",
      phase: "anchor_moment",
      slot: 10,
      time: "Igba Nkwu + 50 min",
      title: "BRIDE WALKS THROUGH CROWD · slowly · sometimes pretending not to see groom",
      note:
        "The deliberate slowness is the point. Photographed cultural-moment-of-truth. " +
        "Too fast loses the moment; too slow loses guest engagement.",
    },
    {
      key: "bride_kneels_offers_wine",
      phase: "anchor_moment",
      slot: 20,
      time: "Igba Nkwu + 55 min",
      title: "Bride kneels before groom · sips wine · offers iko to him",
    },
    {
      key: "groom_drinks_couple_married",
      phase: "anchor_moment",
      slot: 30,
      time: "Igba Nkwu + 58 min",
      title: "GROOM DRINKS · marriage moment · per Igbo custom they are now married",
      note:
        "Public consent ritual completed.",
    },
    {
      key: "couple_stands_family_blessings",
      phase: "transition",
      slot: 10,
      time: "Igba Nkwu + 65 min",
      title: "Couple stands · extended family blessings from both sides",
    },
    {
      key: "couple_dance_money_spraying",
      phase: "continuation_arc",
      slot: 10,
      time: "Igba Nkwu + 80 min",
      title: "Couple dances together · guests spray money · bridesmaids collect",
      note:
        "Money lands on the floor; bridesmaids manage collection. Significant " +
        "cash transfer at large Igbo weddings.",
    },
    {
      key: "igbo_highlife_ogene_music",
      phase: "continuation_arc",
      slot: 20,
      time: "Igba Nkwu + 90 min",
      title: "Igbo Highlife + Ogene + cultural music · dance floor opens",
      vendor: "Igbo music ensemble or DJ",
    },
    {
      key: "nigerian_banquet",
      phase: "continuation_arc",
      slot: 30,
      time: "Igba Nkwu + 2 h",
      title: "Nigerian banquet · jollof + suya + pepper soup + egusi soup + pounded yam",
      vendor: "Nigerian caterer",
    },
    {
      key: "afrobeats_dance_floor",
      phase: "continuation_arc",
      slot: 40,
      time: "Igba Nkwu + 4 h",
      title: "Afrobeats DJ continues · modern Igbo gospel + Naija pop + Western pop",
      vendor: "Afrobeats DJ",
    },
    {
      key: "traditional_wedding_close",
      phase: "send_off",
      slot: 10,
      time: "Igba Nkwu + 6 h",
      title: "Traditional wedding concludes",
    },
    {
      key: "vendor_breakdown",
      phase: "strike",
      slot: 10,
      time: "Igba Nkwu + 6 h",
      title: "Vendor breakdown · cash counted",
    },
    {
      key: "white_wedding",
      phase: "day_after",
      slot: 10,
      time: "D+1 OR D+7",
      title: "WHITE WEDDING · Catholic / Anglican / Pentecostal Christian ceremony",
      vendor: "Christian officiant",
      note:
        "Most common in diaspora is Igbo Catholic. Standard Western ceremony form " +
        "with Igbo cultural reception afterward.",
    },
  ],
};

export default igboWedding;
