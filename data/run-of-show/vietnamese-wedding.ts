// data/run-of-show/vietnamese-wedding.ts
//
// Vietnamese Wedding — Run of Show
//
// Source: cultural-research/weddings/vietnamese-wedding.md
// Source mapping: cultural-research/_milestone-anchor-mapping.md → Vietnamese wedding table
//   - le_dam_ngo_proposal (relative, -6 months)
//   - le_an_hoi_engagement (relative, -3 months)
//   - tea_ceremony (relative, -2 hours from Western ceremony)
//   - western_or_modern_ceremony (relative, 0)
//   - banquet_reception (relative, +3 hours)
//
// V2 recipe. Modal here is Southern Vietnamese (Saigon-origin, majority
// of DFW Vietnamese community). Northern and Central variants noted.
//
// Time format: anchor "tea ceremony" for morning beats; wall-clock for
// evening reception. Multi-event uses day prefix for engagement (which
// often happens weeks/months earlier).
//
// Anchor: tea ceremonies at the ancestral altars of both families.

import type { RoSRecipe } from "./types";

const vietnameseWedding: RoSRecipe = {
  key: "vietnamese_wedding",
  labelEn: "Vietnamese Wedding",
  labelEs: "Boda vietnamita",
  eventType: "wedding",
  eventSubtypes: ["vietnamese"], // CC: cross-check vs data/budget-presets.ts
  items: [
    // ─── pre_day_staging (Lễ Dạm Hỏi months before) ────────────────
    {
      key: "le_dam_ngo",
      phase: "pre_day_staging",
      slot: 10,
      time: "D-180 (often earlier)",
      title: "LỄ DẠM NGÕ · informal proposal · bride's family approves",
    },
    {
      key: "le_an_hoi_engagement",
      phase: "pre_day_staging",
      slot: 20,
      time: "D-90",
      title: "LỄ ĂN HỎI · formal engagement · groom's family brings gift trays (mâm quả) to bride's",
      note:
        "Red trays with betel leaves + areca nuts, traditional cakes (bánh phu " +
        "thê, bánh chưng), wine, tea, fruits, jewelry. Odd or even number per region.",
    },
    {
      key: "gift_trays_prepared",
      phase: "pre_day_staging",
      slot: 30,
      time: "D-7",
      title: "Engagement gift trays prepared · 5-9 trays for Lễ Đón Dâu",
      note:
        "Sometimes prepared by family; sometimes ordered from specialty Vietnamese " +
        "caterers ($300–$1,500/tray × 5–7 trays typical).",
    },

    // ─── load_in ───────────────────────────────────────────────────
    {
      key: "altar_setup_brides_home",
      phase: "load_in",
      slot: 10,
      time: "tea ceremony − 2 h",
      title: "Ancestral altar set up at bride's home · incense + offerings",
      note:
        "Ancestors formally notified of the marriage through incense at the altar.",
    },
    {
      key: "banquet_venue_setup",
      phase: "load_in",
      slot: 20,
      time: "reception − 6 h",
      title: "Vietnamese banquet venue setup (Garland / Arlington corridor typical)",
    },

    // ─── vip_arrivals ──────────────────────────────────────────────
    {
      key: "ao_dai_dressing",
      phase: "vip_arrivals",
      slot: 10,
      time: "tea ceremony − 3 h",
      title: "Bride in red áo dài + khăn đóng (headdress); groom in blue áo dài",
      vendor: "áo dài boutique",
      note:
        "Both wear áo dài for the tea ceremony. Western attire often added for " +
        "reception. Family áo dài (mom, sisters, aunts) often color-coordinated.",
    },

    // ─── guest_arrivals (groom's procession arrives) ───────────────
    {
      key: "le_don_dau_procession",
      phase: "guest_arrivals",
      slot: 10,
      time: "tea ceremony − 30 min",
      title: "LỄ ĐÓN DÂU · groom's family travels in procession to bride's home with gift trays",
      note:
        "Cars decorated; traditional or modern music. Gift trays carried by " +
        "young unmarried attendants.",
    },
    {
      key: "family_welcomes_gift_trays_presented",
      phase: "guest_arrivals",
      slot: 20,
      time: "tea ceremony − 10 min",
      title: "Bride's family welcomes · gift trays presented · bride emerges",
    },

    // ─── opening_moment ────────────────────────────────────────────
    {
      key: "incense_lit_at_altar",
      phase: "opening_moment",
      slot: 10,
      time: "tea ceremony − 5 min",
      title: "Incense lit at bride's ancestral altar · ancestors formally notified",
    },

    // ─── first_arc (bows at bride's altar) ─────────────────────────
    {
      key: "bows_to_brides_ancestors",
      phase: "first_arc",
      slot: 10,
      time: "tea ceremony − 3 min",
      title: "Couple bows three times to bride's ancestors at altar",
    },

    // ─── anchor_moment (tea ceremonies at both homes) ──────────────
    {
      key: "tea_brides_parents",
      phase: "anchor_moment",
      slot: 10,
      time: "tea ceremony + 0",
      title: "TEA CEREMONY · bride's home · tea to parents + grandparents in formal order",
      note:
        "Cultural and spiritual centerpiece. Each elder receives tea in formal " +
        "cups; blesses the couple; often returns jewelry or hongbao-equivalent gifts.",
    },
    {
      key: "bride_departs_with_grooms_family",
      phase: "anchor_moment",
      slot: 20,
      time: "tea ceremony + 25 min",
      title: "Bride formally departs with groom's family",
    },
    {
      key: "tea_grooms_parents",
      phase: "anchor_moment",
      slot: 30,
      time: "tea ceremony + 60 min",
      title: "TEA CEREMONY · groom's home OR wedding venue altar · tea to groom's family",
      note:
        "Bride formally accepted into groom's family. Second tea ceremony at " +
        "groom's family ancestral altar — or at the wedding venue's prepared altar.",
    },

    // ─── transition (Western ceremony if included) ─────────────────
    {
      key: "optional_western_or_catholic_ceremony",
      phase: "transition",
      slot: 10,
      time: "tea ceremony + 2 h",
      title: "Optional Western ceremony · Catholic Mass for Vietnamese Catholic families",
      vendor: "priest (Vietnamese Catholic parish)",
      note:
        "Vietnamese Catholic parishes in DFW (Our Lady of Lavang in Carrollton, " +
        "Holy Martyrs of Vietnam) coordinate the Mass; tea ceremony at family home " +
        "before or after.",
    },

    // ─── continuation_arc (banquet reception) ──────────────────────
    {
      key: "couple_grand_entrance_banquet",
      phase: "continuation_arc",
      slot: 10,
      time: "6:30 PM",
      title: "Couple's grand entrance at Vietnamese banquet venue",
      vendor: "MC (bilingual)",
    },
    {
      key: "banquet_courses",
      phase: "continuation_arc",
      slot: 20,
      time: "7:00 PM",
      title: "Banquet courses · whole steamed fish · roast suckling pig · lobster (upper tier)",
      vendor: "Vietnamese caterer",
    },
    {
      key: "speeches_and_toasts",
      phase: "continuation_arc",
      slot: 30,
      time: "8:00 PM",
      title: "Speeches + toasts · bilingual MC · cash-envelope gifts brought to designated table",
    },
    {
      key: "dancing_kpop_vpop_western",
      phase: "continuation_arc",
      slot: 40,
      time: "9:00 PM",
      title: "Dancing · DJ mixes Vietnamese pop, ballads, Western pop",
      vendor: "DJ",
    },

    // ─── send_off + strike ─────────────────────────────────────────
    {
      key: "guests_depart",
      phase: "send_off",
      slot: 10,
      time: "10:30 PM",
      title: "Guests depart · informal close",
    },
    {
      key: "vendor_breakdown",
      phase: "strike",
      slot: 10,
      time: "11:00 PM",
      title: "Vendor breakdown",
    },

    // ─── day_after ─────────────────────────────────────────────────
    {
      key: "cash_envelope_acknowledgment",
      phase: "day_after",
      slot: 10,
      time: "D+1 to D+7",
      title: "Cash envelope gift tracking + thank-you notes",
    },
  ],
};

export default vietnameseWedding;
