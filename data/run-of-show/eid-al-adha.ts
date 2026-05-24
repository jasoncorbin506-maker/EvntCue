// data/run-of-show/eid-al-adha.ts
//
// Eid al-Adha — Run of Show
//
// Source mapping: cultural-research/_milestone-anchor-mapping.md → Eid al-Adha
// Source: cultural-research/religious-holidays/eid-al-adha.md
//
// V2 Tier 3. Eid al-Adha ("Festival of Sacrifice") commemorates Abraham's
// willingness to sacrifice his son. Similar structure to Eid al-Fitr +
// sacrificial component (qurbani).
//
// Anchor: Eid prayer at masjid + qurbani sacrifice + meat distribution.

import type { RoSRecipe } from "./types";

const eidAlAdha: RoSRecipe = {
  key: "eid_al_adha",
  labelEn: "Eid al-Adha",
  labelEs: "Eid al-Adha",
  eventType: "public_cultural",
  eventSubtypes: ["eid_al_adha"], // CC: cross-check vs data/budget-presets.ts
  items: [
    {
      key: "qurbani_arrangement",
      phase: "pre_day_staging",
      slot: 10,
      time: "D-14",
      title: "QURBANI · sacrificial animal arranged through halal butcher or qurbani service",
      vendor: "halal butcher / qurbani service",
      note:
        "Family selects animal (goat / sheep / cow share). DFW halal butchers " +
        "in Plano / Richardson / Garland coordinate Eid al-Adha qurbani in volume.",
    },
    {
      key: "new_clothes_prepared",
      phase: "pre_day_staging",
      slot: 20,
      time: "D-2",
      title: "New clothes prepared for family",
    },
    {
      key: "family_morning_prep",
      phase: "vip_arrivals",
      slot: 10,
      time: "Eid prayer − 90 min",
      title: "Family wakes early · ghusl · dressed in new clothes",
    },
    {
      key: "travel_to_masjid",
      phase: "guest_arrivals",
      slot: 10,
      time: "Eid prayer − 30 min",
      title: "Family travels to masjid · multiple prayer times for capacity",
    },
    {
      key: "eid_prayer",
      phase: "anchor_moment",
      slot: 10,
      time: "Eid prayer + 0",
      title: "EID PRAYER (Salat al-Eid) at masjid · two rakat + khutbah",
      vendor: "imam",
    },
    {
      key: "embraces_eid_mubarak",
      phase: "anchor_moment",
      slot: 20,
      time: "Eid prayer + 30 min",
      title: "Embraces + 'Eid Mubarak' greetings",
    },
    {
      key: "qurbani_slaughter",
      phase: "transition",
      slot: 10,
      time: "Eid prayer + 3 h",
      title: "QURBANI SLAUGHTER · animal sacrificed at halal facility · meat divided in thirds",
      vendor: "halal butcher",
      note:
        "Meat divided: one-third for family, one-third for relatives/friends, " +
        "one-third for the poor/needy. Religious obligation.",
    },
    {
      key: "meat_distribution",
      phase: "continuation_arc",
      slot: 10,
      time: "Eid prayer + 5 h",
      title: "Meat distribution to extended family + needy + relatives",
    },
    {
      key: "family_feast",
      phase: "continuation_arc",
      slot: 20,
      time: "Eid prayer + 6 h",
      title: "Family feast featuring qurbani meat · biryani + kebabs + grilled meats",
    },
    {
      key: "eidi_to_children",
      phase: "continuation_arc",
      slot: 30,
      time: "Eid prayer + 7 h",
      title: "Eidi cash gifts to children",
    },
    {
      key: "extended_visiting",
      phase: "continuation_arc",
      slot: 40,
      time: "D+1 to D+3",
      title: "Extended family visits · multi-day · meat distribution continues",
    },
    {
      key: "informal_close",
      phase: "send_off",
      slot: 10,
      time: "Eid prayer + 12 h",
      title: "Day 1 concludes · holiday continues 3 days total",
    },
  ],
};

export default eidAlAdha;
