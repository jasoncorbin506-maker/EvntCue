// data/run-of-show/sikh-wedding.ts
//
// Sikh Wedding (Anand Karaj) — Run of Show
//
// Source: cultural-research/weddings/sikh-wedding.md
// Source mapping: cultural-research/_milestone-anchor-mapping.md → Sikh wedding table
//   - book_granthi (relative, -6 months) overrides book_officiant
//   - roka_or_engagement (relative, -6 months)
//   - mehndi_ceremony (relative, -2 days)
//   - sangeet (relative, -1 day)
//   - gurdwara_anand_karaj (absolute — gurdwara-scheduled)
//   - laavan_circumambulations (absolute — the marriage moment)
//   - reception (relative, +1 day or same day)
//
// V2 recipe — authored without a prose run-of-show file. Based on
// cultural-research entry + mapping classification. Per Jason's "second
// launch" scope for the ~37 V2 traditions.
//
// Time format: anchor-relative around "4th Laavan" (the moment of
// marriage in Sikh practice — completion of four circumambulations).
// No muhurat (a meaningful difference from Hindu N-Indian — no
// astrologically-bounded window). Multi-day uses day prefix.
//
// Anchor: completion of the 4th Laavan circumambulation around the
// Guru Granth Sahib.

import type { RoSRecipe } from "./types";

const sikhWedding: RoSRecipe = {
  key: "sikh_wedding",
  labelEn: "Sikh Wedding (Anand Karaj)",
  labelEs: "Boda sij (Anand Karaj)",
  eventType: "wedding",
  eventSubtypes: ["sikh"], // CC: cross-check vs data/budget-presets.ts
  items: [
    // ─── pre_day_staging ───────────────────────────────────────────
    {
      key: "akhand_paath_or_sukhmani_sahib",
      phase: "pre_day_staging",
      slot: 10,
      time: "D-3 to D-1",
      title: "Akhand Paath (48-hour Guru Granth Sahib reading) or Sukhmani Sahib paath",
      vendor: "gurdwara granthi",
      note:
        "Continuous scripture reading sponsored by the family at the gurdwara. " +
        "Donation-based ($500–$3,000); religious-institutional booking, not a fee transaction.",
    },
    {
      key: "mehndi_ceremony",
      phase: "pre_day_staging",
      slot: 20,
      time: "D-2",
      title: "MEHNDI · henna application for bride + family women",
      vendor: "mehndi artist",
    },
    {
      key: "sangeet",
      phase: "pre_day_staging",
      slot: 30,
      time: "D-1 · evening",
      title: "SANGEET · music + Bhangra dance · family performances",
      note:
        "Often shared structurally with Punjabi Hindu sangeet. Bhangra-heavy; " +
        "dhol-led. Largest single social event of the calendar.",
    },
    {
      key: "jaggo",
      phase: "pre_day_staging",
      slot: 40,
      time: "D-1 · late night",
      title: "JAGGO · women carry decorated gagghar (water pots) with lit candles",
      note:
        "Distinctly Punjabi late-night dance and music event led by women of the family.",
    },

    // ─── load_in ────────────────────────────────────────────────────
    {
      key: "langar_coordination",
      phase: "load_in",
      slot: 10,
      time: "Anand Karaj − 4 h",
      title: "Langar coordination with gurdwara langar committee",
      note:
        "Family contributes supplies (rice, atta, dal, vegetables, ghee, milk) " +
        "+ often $2,000–$10,000 cash to community kitchen for serving 200–500 wedding guests.",
    },
    {
      key: "gurdwara_setup",
      phase: "load_in",
      slot: 20,
      time: "Anand Karaj − 3 h",
      title: "Gurdwara hall prepared · Guru Granth Sahib installed · raagis warm up",
      vendor: "raagi jatha",
    },

    // ─── vip_arrivals ───────────────────────────────────────────────
    {
      key: "bride_groom_prep",
      phase: "vip_arrivals",
      slot: 10,
      time: "Anand Karaj − 4 h",
      title: "Bride + groom prepare separately · Punjabi suits + sherwani + safa",
      vendor: "hair / makeup",
    },

    // ─── guest_arrivals ────────────────────────────────────────────
    {
      key: "guests_arrive_gurdwara",
      phase: "guest_arrivals",
      slot: 10,
      time: "Anand Karaj − 30 min",
      title: "Guests enter gurdwara · heads covered · shoes removed · seated on floor",
      note:
        "Sacred space rules apply to all attendees regardless of faith. Pre-event " +
        "guest education essential — family typically provides explanatory cards.",
    },

    // ─── opening_moment ────────────────────────────────────────────
    {
      key: "baraat_arrives_at_gurdwara",
      phase: "opening_moment",
      slot: 10,
      time: "Anand Karaj − 20 min",
      title: "Baraat arrives at gurdwara grounds · dancing + dhol CEASE on entering",
      vendor: "dhol player",
      note:
        "Hard cultural constraint: no baraat dancing inside gurdwara grounds. " +
        "Dhol stops at the threshold. Family and vendors must understand this.",
    },
    {
      key: "milni",
      phase: "opening_moment",
      slot: 20,
      time: "Anand Karaj − 15 min",
      title: "MILNI · formal greeting + garlanding between male family members",
    },

    // ─── first_arc ─────────────────────────────────────────────────
    {
      key: "kirtan_and_ardas",
      phase: "first_arc",
      slot: 10,
      time: "Anand Karaj + 0",
      title: "Kirtan + opening Ardas (formal prayer)",
      vendor: "raagi jatha",
      note:
        "Music is integral to the ceremony, not background. Raagi jatha sings " +
        "kirtan throughout the entire Anand Karaj.",
    },
    {
      key: "palla_ceremony",
      phase: "first_arc",
      slot: 20,
      time: "Anand Karaj + 10 min",
      title: "PALLA · bride's father places sash end into groom's hand",
    },

    // ─── anchor_moment (the four Laavan) ───────────────────────────
    {
      key: "first_laavan",
      phase: "anchor_moment",
      slot: 10,
      time: "4th Laavan − 18 min",
      title: "1st LAAVAN · embracing dharma · couple circumambulates Guru Granth Sahib",
      vendor: "raagi jatha",
      note:
        "Granthi reads meaning of each Laavan; raagis sing; couple walks clockwise " +
        "around the Guru Granth Sahib, bride following groom.",
    },
    {
      key: "second_laavan",
      phase: "anchor_moment",
      slot: 20,
      time: "4th Laavan − 12 min",
      title: "2nd LAAVAN · meeting the True Guru",
    },
    {
      key: "third_laavan",
      phase: "anchor_moment",
      slot: 30,
      time: "4th Laavan − 6 min",
      title: "3rd LAAVAN · detachment and renunciation of ego",
    },
    {
      key: "fourth_laavan",
      phase: "anchor_moment",
      slot: 40,
      time: "4th Laavan + 0",
      title: "4th LAAVAN · UNION WITH THE DIVINE · the moment of marriage",
      note:
        "Completion of the fourth circumambulation. The couple is now married " +
        "in Sikh religious law.",
    },
    {
      key: "anand_sahib_recitation",
      phase: "anchor_moment",
      slot: 50,
      time: "4th Laavan + 5 min",
      title: "Anand Sahib recitation · invoking spiritual bliss",
    },
    {
      key: "hukamnama",
      phase: "anchor_moment",
      slot: 60,
      time: "4th Laavan + 12 min",
      title: "HUKAMNAMA · day's command read from Guru Granth Sahib · couple's blessing",
    },
    {
      key: "karah_prashad",
      phase: "anchor_moment",
      slot: 70,
      time: "4th Laavan + 18 min",
      title: "Karah Prashad distributed to all attendees · sacred sweet",
    },

    // ─── transition (langar) ───────────────────────────────────────
    {
      key: "langar_served",
      phase: "transition",
      slot: 10,
      time: "langar + 0",
      title: "LANGAR · community vegetarian meal served free to all guests",
      vendor: "gurdwara langar committee",
      note:
        "Egalitarian institution central to Sikhism. Everyone sits on the floor " +
        "in equal status and is served by community members. Vegetarian only.",
    },

    // ─── continuation_arc (outfit change + travel to reception) ────
    {
      key: "doli_farewell",
      phase: "continuation_arc",
      slot: 10,
      time: "langar + 2 h",
      title: "DOLI · emotional farewell of the bride from her parental home",
      note:
        "Parallel to Hindu vidaai. Heaviest emotional moment for the bride's family.",
    },
    {
      key: "outfit_change_for_reception",
      phase: "continuation_arc",
      slot: 20,
      time: "reception start − 2 h",
      title: "Bride changes from gurdwara saree/suit to heavier lehenga · full hair/makeup refresh",
    },

    // ─── send_off (reception) ──────────────────────────────────────
    {
      key: "reception_evening",
      phase: "send_off",
      slot: 10,
      time: "reception start + 0",
      title: "Reception · Western-influenced · DJ + dancing + speeches",
      vendor: "DJ",
      note:
        "Separate evening event. Often features a live Punjabi singer or Bhangra " +
        "performance troupe ($2,000–$8,000+). Western-style cake increasingly common.",
    },

    // ─── strike + day_after ────────────────────────────────────────
    {
      key: "vendor_breakdown",
      phase: "strike",
      slot: 10,
      time: "reception start + 5 h",
      title: "Vendor breakdown · gurdwara reset for next day's services",
    },
    {
      key: "golak_offering",
      phase: "day_after",
      slot: 10,
      time: "D+1",
      title: "Family golak (donation) to gurdwara · thank-yous to granthi + raagis",
      note:
        "No fee for the Anand Karaj itself — granthi service is seva. Family " +
        "voluntary offering is the customary acknowledgment.",
    },
  ],
};

export default sikhWedding;
