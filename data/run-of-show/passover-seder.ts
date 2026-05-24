// data/run-of-show/passover-seder.ts
//
// Passover Seder — Run of Show
//
// Source mapping: cultural-research/_milestone-anchor-mapping.md → Passover
// Source: cultural-research/religious-holidays/passover-seder.md
//
// V2 Tier 3. Jewish 8-day festival commemorating Exodus from Egypt. The
// Seder (ordered meal with Haggadah readings) on first night (and second
// night for diaspora communities) is the central observance.
//
// Anchor: Seder begins after nightfall on first night of Passover.

import type { RoSRecipe } from "./types";

const passoverSeder: RoSRecipe = {
  key: "passover_seder",
  labelEn: "Passover Seder",
  labelEs: "Seder de Pésaj",
  eventType: "public_cultural",
  eventSubtypes: ["passover", "passover_seder"], // CC: cross-check vs data/budget-presets.ts
  items: [
    {
      key: "kosher_for_passover_kitchening",
      phase: "pre_day_staging",
      slot: 10,
      time: "D-14",
      title: "KOSHER FOR PASSOVER · kitchen kashered · chametz (leavened) removed",
      note:
        "Major kitchen prep. Surfaces covered, separate Passover dishes brought " +
        "out, chametz searched + burned the night before Passover (bedikat chametz).",
    },
    {
      key: "passover_groceries",
      phase: "pre_day_staging",
      slot: 20,
      time: "D-7",
      title: "Passover groceries · matzah + kosher-for-Passover wine + symbolic foods",
      note:
        "DFW kosher market thinner than NYC/LA. Plan ahead. Tom Thumb in Plano " +
        "and select stores stock Passover specifics seasonally.",
    },
    {
      key: "haggadah_selection",
      phase: "pre_day_staging",
      slot: 30,
      time: "D-7",
      title: "Haggadahs gathered for each seat · printed or app-based",
      note:
        "Tradition: each guest follows along in their own Haggadah. Families " +
        "often use a specific Haggadah year over year (Maxwell House, Reform, " +
        "Sephardic, or specialty themed).",
    },
    {
      key: "seder_plate_assembly",
      phase: "load_in",
      slot: 10,
      time: "seder − 2 h",
      title: "SEDER PLATE assembled · 6 symbolic foods · zeroa, beitzah, maror, charoset, karpas, chazeret",
      note:
        "Zeroa (shank bone), beitzah (roasted egg), maror (bitter herb), " +
        "charoset (apple-walnut-wine mixture), karpas (parsley), chazeret " +
        "(second bitter herb).",
    },
    {
      key: "table_set_elijah_cup",
      phase: "load_in",
      slot: 20,
      time: "seder − 90 min",
      title: "Table set · Elijah's cup poured · pillow placed for ritual reclining",
    },
    {
      key: "matzah_three_pieces",
      phase: "load_in",
      slot: 30,
      time: "seder − 60 min",
      title: "Three pieces of matzah covered + ready · afikomen designated for hiding",
    },
    {
      key: "family_arrives_dressed_holiday",
      phase: "vip_arrivals",
      slot: 10,
      time: "seder − 90 min",
      title: "Family arrives + dressed for holiday · candles lit by women before sundown",
    },
    {
      key: "guests_arrive",
      phase: "guest_arrivals",
      slot: 10,
      time: "seder − 30 min",
      title: "Guests arrive · seated · Haggadahs distributed",
    },
    {
      key: "kiddush_first_cup",
      phase: "opening_moment",
      slot: 10,
      time: "seder + 0",
      title: "KIDDUSH · first of four cups of wine · blessing recited",
      note:
        "Seder begins after nightfall. Each guest drinks (or sips) four cups of " +
        "wine at specific moments. Children traditionally get grape juice.",
    },
    {
      key: "urchatz_karpas_yachatz",
      phase: "first_arc",
      slot: 10,
      time: "seder + 10 min",
      title: "Urchatz (hand washing) · Karpas (parsley dipped in salt water) · Yachatz (middle matzah broken)",
    },
    {
      key: "maggid_telling",
      phase: "anchor_moment",
      slot: 10,
      time: "seder + 25 min",
      title: "MAGGID · telling of the Exodus story · four questions · ten plagues",
      vendor: "seder leader",
      note:
        "The central narrative of Passover. Youngest child asks the four " +
        "questions ('Why is this night different from all other nights?'). " +
        "Adults respond by telling the story from the Haggadah. Can run 30-90 " +
        "minutes depending on family tradition.",
    },
    {
      key: "second_cup_blessings",
      phase: "anchor_moment",
      slot: 20,
      time: "seder + 75 min",
      title: "Second cup blessed + drunk · Dayenu sung",
    },
    {
      key: "rachtzah_motzi_matzah",
      phase: "anchor_moment",
      slot: 30,
      time: "seder + 90 min",
      title: "Rachtzah (washing) · Motzi (bread blessing) · matzah blessed + eaten",
    },
    {
      key: "maror_korech",
      phase: "anchor_moment",
      slot: 40,
      time: "seder + 100 min",
      title: "Maror (bitter herb) · Korech (Hillel sandwich of matzah + maror + charoset)",
    },
    {
      key: "shulchan_orech_meal",
      phase: "continuation_arc",
      slot: 10,
      time: "seder + 110 min",
      title: "SHULCHAN ORECH · the meal · brisket / lamb / matzah ball soup / kugel / seasonal sides",
    },
    {
      key: "afikomen_hunt_kids",
      phase: "continuation_arc",
      slot: 20,
      time: "seder + 2.5 h",
      title: "Afikomen hunt · kids search for the hidden matzah · ransom paid for return",
      note:
        "Children's tradition keeping them engaged. Afikomen must be found + " +
        "eaten as the seder's final food. Cash ransom typical ($5-$50).",
    },
    {
      key: "third_cup_birkat_hamazon",
      phase: "continuation_arc",
      slot: 30,
      time: "seder + 3 h",
      title: "Third cup · Birkat Hamazon (grace after meals) · Hallel (psalms of praise)",
    },
    {
      key: "elijahs_cup_door_opened",
      phase: "continuation_arc",
      slot: 40,
      time: "seder + 3.5 h",
      title: "Door opened for Elijah · symbolic welcome of the prophet",
    },
    {
      key: "fourth_cup_nirtzah",
      phase: "send_off",
      slot: 10,
      time: "seder + 4 h",
      title: "Fourth cup · Nirtzah (closing) · 'L'shanah haba'ah b'Yerushalayim' (next year in Jerusalem)",
    },
    {
      key: "second_seder_night",
      phase: "day_after",
      slot: 10,
      time: "D+1 evening",
      title: "Second night seder (diaspora Jewish communities hold two)",
      note:
        "Diaspora tradition. Israel has one seder; outside Israel two are held " +
        "on first two nights. Conservative + Orthodox usually observe; some " +
        "Reform skip the second night.",
    },
  ],
};

export default passoverSeder;
