// data/run-of-show/hindu-wedding-north-indian.ts
//
// Hindu Wedding (North Indian) — Run of Show
//
// Source prose: product/run-of-show/cultural/hindu-wedding-north-indian.md
// Source mapping: cultural-research/_milestone-anchor-mapping.md
//   Wedding tradition extensions — Hindu N-Indian table:
//     - muhurat_selection (relative, -9 months)
//     - book_pandit (relative, -9 months)
//     - book_mandap_florist (relative, -7 months)
//     - book_baraat_horse (relative, -4 months)
//     - book_dhol_player (relative, -4 months)
//     - book_sangeet_choreographer (relative, -3 months)
//     - mehndi_ceremony (relative, -2 days)
//     - sangeet (relative, -1 day)
//     - haldi_ceremony (relative, -6 hours)
//     - baraat_arrival (relative, -90 minutes from saptapadi)
//     - kanyadaan (absolute — specific moment in ceremony)
//     - saptapadi (absolute — MUST land inside muhurat window)
//     - reception (relative, +1 day)
//     - pandit_pre_wedding_pujas (absolute)
//
// Time format: anchor "saptapadi" / "muhurat window" for wedding-day
// ceremony beats. Multi-day arc uses day prefix ("D-2 · mehndi",
// "D-1 · sangeet", "morning of", "D+1 · reception"). Sub-events within
// the wedding day use "muhurat − N min" / "muhurat + N min".
//
// Anchor: saptapadi (seven steps around the sacred fire) inside the
// muhurat window. The single most important constraint in the entire
// recipe corpus — if the saptapadi slips outside the muhurat window,
// traditional families read the wedding as religiously compromised.

import type { RoSRecipe } from "./types";

const hinduWeddingNorthIndian: RoSRecipe = {
  key: "hindu_wedding_north_indian",
  labelEn: "Hindu Wedding (North Indian)",
  labelEs: "Boda hindú (norte de India)",
  eventType: "wedding",
  // CC fix 2026-05-24 — budget-presets.ts only has generic `hindu` subtype
  // (no regional split). Recipe dispatches on both keys so today's funnel
  // (generic Hindu) lands this North Indian recipe (closest match) AND a
  // future `hindu_north_indian` subtype works without recipe edits.
  eventSubtypes: ["hindu", "hindu_north_indian"],
  items: [
    // ─── pre_day_staging (mehndi, sangeet, mandap setup) ───────────
    {
      key: "mehndi_ceremony",
      phase: "pre_day_staging",
      slot: 10,
      time: "D-2",
      title: "MEHNDI CEREMONY · women of both families apply henna",
      vendor: "mehndi artist",
      note:
        "Bridal mehndi 6–8 hours. Family women lighter designs (~30–60 min " +
        "each). Often at bride's home or a small event space.",
    },
    {
      key: "sangeet",
      phase: "pre_day_staging",
      slot: 20,
      time: "D-1 · evening",
      title: "SANGEET · music + dance · family performances + open dance floor",
      vendor: "sangeet choreographer",
      note:
        "Largest single social event of the planning calendar. Choreography " +
        "rehearsed 8–12 weekly sessions starting T-3mo. If choreography falls " +
        "apart on the night: simplify; audience often doesn't notice; family does.",
    },
    {
      key: "mandap_construction",
      phase: "pre_day_staging",
      slot: 30,
      time: "D-1",
      title: "Mandap constructed at wedding venue",
      vendor: "mandap florist",
      note:
        "Largest single decor line item. Under-budgeting here is the most " +
        "common visual disappointment.",
    },
    {
      key: "pandit_confirms_ceremony_items",
      phase: "pre_day_staging",
      slot: 40,
      time: "D-1",
      title: "Pandit confirms ceremony items · agni materials, kumkum, rice, ghee, flowers, betel leaves, coconuts",
      vendor: "pandit",
    },

    // ─── load_in (early morning of) ────────────────────────────────
    {
      key: "haldi_brides_family",
      phase: "load_in",
      slot: 10,
      time: "morning of · 5:00 AM",
      title: "HALDI · bride's family applies turmeric paste at bride's location",
      note:
        "Family women apply turmeric, sandalwood, mustard oil paste. " +
        "Photographed extensively.",
    },
    {
      key: "haldi_grooms_family",
      phase: "load_in",
      slot: 20,
      time: "morning of · 5:00 AM",
      title: "HALDI · groom's family applies turmeric paste at groom's location",
    },
    {
      key: "caterer_load_in",
      phase: "load_in",
      slot: 30,
      time: "morning of · 7:00 AM",
      title: "Caterer load-in · Satvik / Jain / vegetarian per family tradition",
      vendor: "caterer",
      note:
        "Confirm dietary constraints in writing (no onion / garlic / root " +
        "vegetables / meat for Jain families). Religious-offense risk if missed.",
    },

    // ─── vip_arrivals (bride + groom dressing) ─────────────────────
    {
      key: "bride_styling_begins",
      phase: "vip_arrivals",
      slot: 10,
      time: "muhurat − 5 h",
      title: "Bride begins hair + makeup + outfit · 3–5 hours total",
      vendor: "hair / makeup",
      note:
        "Heavy gold jewelry from multiple family sources, lehenga with " +
        "multiple layers, bridal mehndi finalized, dupatta arrangement. Each " +
        "piece of gold has a known source — maternal grandmother's necklace, " +
        "aunt's bangles. Socially + emotionally weighted.",
    },
    {
      key: "groom_dresses_safa_tied",
      phase: "vip_arrivals",
      slot: 20,
      time: "muhurat − 3 h",
      title: "Groom dresses · safa (turban) tied by uncle (ritually weighted)",
    },
    {
      key: "photographer_arrives",
      phase: "vip_arrivals",
      slot: 30,
      time: "muhurat − 4 h",
      title: "Photographer + videographer arrive during bride's prep",
      vendor: "photographer",
      note:
        "Briefed in advance: saptapadi is the highest-priority shot; nothing " +
        "compares. Second shooter positioned for redundancy on saptapadi.",
    },

    // ─── guest_arrivals (pre-ceremony at venue) ────────────────────
    {
      key: "guests_arrive_at_venue",
      phase: "guest_arrivals",
      slot: 10,
      time: "muhurat − 2 h",
      title: "Guests arrive at wedding venue · seat in front of mandap",
    },
    {
      key: "pandit_pre_wedding_puja",
      phase: "guest_arrivals",
      slot: 20,
      time: "muhurat − 2 h",
      title: "Pandit performs ganesh puja + pre-wedding rituals at mandap",
      vendor: "pandit",
      note:
        "Family elders + immediate family attend. Camera quiet. Pandit running " +
        "long is a common cause of saptapadi slipping the muhurat — build buffer.",
    },

    // ─── opening_moment (baraat + milni + processional) ────────────
    {
      key: "baraat_staging",
      phase: "opening_moment",
      slot: 10,
      time: "muhurat − 90 min",
      title: "Baraat staging · groom mounts horse · dhol player begins",
      vendor: "dhol player",
      note:
        "Confirm venue's horse-on-grounds policy in writing during contract — " +
        "some DFW venues prohibit horses; baraat arrives last quarter-mile " +
        "by foot from a nearby drop-off.",
    },
    {
      key: "baraat_procession",
      phase: "opening_moment",
      slot: 20,
      time: "muhurat − 75 min",
      title: "BARAAT · groom's procession · dancing the whole way",
      note:
        "Energy peaks here. Bride's family meets at venue entrance.",
    },
    {
      key: "milni",
      phase: "opening_moment",
      slot: 30,
      time: "muhurat − 60 min",
      title: "MILNI · formal greeting between male family members · garlanding",
      note:
        "15–20 min photo set.",
    },
    {
      key: "groom_seated_at_mandap",
      phase: "opening_moment",
      slot: 40,
      time: "muhurat − 40 min",
      title: "Groom seated at mandap · awaits bride's processional",
    },
    {
      key: "brides_processional",
      phase: "opening_moment",
      slot: 50,
      time: "muhurat − 30 min",
      title: "Bride's processional · under chadar held by male family members",
      note:
        "Music shifts to processional tracks (varies by family). High-camera moment.",
    },

    // ─── first_arc (jaimala + kanyadaan + mangal phera) ────────────
    {
      key: "jaimala_varmala",
      phase: "first_arc",
      slot: 10,
      time: "muhurat − 20 min",
      title: "JAIMALA / VARMALA · bride + groom exchange floral garlands",
      vendor: "florist",
      note:
        "Playful — groom's friends sometimes lift him so bride can't reach; " +
        "bride's friends counter. Photographed extensively.",
    },
    {
      key: "kanyadaan",
      phase: "first_arc",
      slot: 20,
      time: "muhurat − 12 min",
      title: "KANYADAAN · bride's father places her hand in groom's hand",
      vendor: "pandit",
      note:
        "Emotionally weighted; bride's mother often crying. Camera quiet but " +
        "close. Father has traditionally fasted the morning of.",
    },
    {
      key: "mangal_phera",
      phase: "first_arc",
      slot: 30,
      time: "muhurat − 5 min",
      title: "MANGAL PHERA · couple walks around agni 4 or 7 times",
      vendor: "pandit",
      note:
        "Number varies by family tradition; pandit confirms in advance. " +
        "Energy building toward saptapadi.",
    },

    // ─── anchor_moment (saptapadi inside muhurat) ──────────────────
    {
      key: "saptapadi",
      phase: "anchor_moment",
      slot: 10,
      time: "muhurat window · 0",
      title: "SAPTAPADI · seven steps around the agni · MUST land inside muhurat",
      vendor: "pandit",
      note:
        "The single most important moment in the recipe corpus. If the seventh " +
        "step lands outside the muhurat window by even 5–10 min, traditional " +
        "families read the wedding as religiously compromised. Every vendor " +
        "and family member must understand this. Recovery is operational " +
        "(MC accelerates, pandit compresses preliminary readings) — never " +
        "announced publicly.",
    },
    {
      key: "mangalsutra_placed",
      phase: "anchor_moment",
      slot: 20,
      time: "muhurat + 8 min",
      title: "MANGALSUTRA · groom places necklace around bride's neck",
    },
    {
      key: "sindoor_applied",
      phase: "anchor_moment",
      slot: 30,
      time: "muhurat + 11 min",
      title: "SINDOOR · groom applies red sindoor to bride's hair part",
    },
    {
      key: "bichhuwa_bangles",
      phase: "anchor_moment",
      slot: 40,
      time: "muhurat + 14 min",
      title: "Bichhuwa (toe rings) + bangles · regional traditions",
      note:
        "Some North Indian sub-traditions include this final ritual cluster; " +
        "others skip. Confirm in onboarding with pandit.",
    },

    // ─── transition (aashirvad + lunch) ────────────────────────────
    {
      key: "aashirvad_family_blessings",
      phase: "transition",
      slot: 10,
      time: "muhurat + 20 min",
      title: "AASHIRVAD · elders bless couple one by one · cash + jewelry gifts",
      note:
        "20–30 min. Can run long if family is large. Emotionally rich.",
    },
    {
      key: "lunch",
      phase: "transition",
      slot: 20,
      time: "muhurat + 50 min",
      title: "Lunch · vegetarian Indian feast · mandap stays as photo backdrop",
      vendor: "caterer",
    },

    // ─── continuation_arc (post-lunch) ─────────────────────────────
    {
      key: "wedding_day_winds_down",
      phase: "continuation_arc",
      slot: 10,
      time: "muhurat + 3 h",
      title: "Wedding-day arc winds down · informal mingling",
    },

    // ─── send_off (vidaai) ─────────────────────────────────────────
    {
      key: "vidaai",
      phase: "send_off",
      slot: 10,
      time: "muhurat + 4 h",
      title: "VIDAAI · bride formally departs her parents' family",
      note:
        "Heaviest emotional moment for bride's parents. Bride throws rice " +
        "over her shoulder symbolically. In US weddings increasingly stylized " +
        "at venue rather than parental home, but emotionally intact.",
    },

    // ─── strike ────────────────────────────────────────────────────
    {
      key: "vendor_breakdown",
      phase: "strike",
      slot: 10,
      time: "muhurat + 6 h",
      title: "Vendor breakdown · mandap florist last (preserves photo set)",
    },

    // ─── day_after (RECEPTION D+1) ─────────────────────────────────
    {
      key: "reception_d_plus_1",
      phase: "day_after",
      slot: 10,
      time: "D+1 · evening",
      title: "RECEPTION · bride + groom change outfits · grand entrance · MC introductions",
      vendor: "DJ",
      note:
        "Often runs past midnight. Western-fusion cake increasingly common. " +
        "Bollywood DJ drives open dance floor. Reception is a distinct sub-event " +
        "from the wedding day; separate venue + vendor stack typical.",
    },
    {
      key: "reception_speeches_dinner",
      phase: "day_after",
      slot: 20,
      time: "D+1 · evening",
      title: "Speeches · sit-down dinner or buffet · cake · open dance floor",
    },
    {
      key: "vendor_settlements_thank_yous",
      phase: "day_after",
      slot: 30,
      time: "D+2 to D+3",
      title: "Family thank-yous to pandit + key vendors · final settlements",
    },
  ],
};

export default hinduWeddingNorthIndian;
