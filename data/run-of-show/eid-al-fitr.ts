// data/run-of-show/eid-al-fitr.ts
//
// Eid al-Fitr — Run of Show
//
// Source mapping: cultural-research/_milestone-anchor-mapping.md → Eid al-Fitr
// Source: cultural-research/religious-holidays/eid-al-fitr.md
//
// V2 Tier 3. Eid al-Fitr celebrates the end of Ramadan — moon-sighting
// dependent (sometimes uncertain until 24-48 hours before).
//
// Anchor: Eid prayer at masjid in the morning, followed by family feast.

import type { RoSRecipe } from "./types";

const eidAlFitr: RoSRecipe = {
  key: "eid_al_fitr",
  labelEn: "Eid al-Fitr",
  labelEs: "Eid al-Fitr",
  eventType: "public_cultural",
  eventSubtypes: ["eid_al_fitr"], // CC: cross-check vs data/budget-presets.ts
  items: [
    {
      key: "moon_sighting_eve",
      phase: "pre_day_staging",
      slot: 10,
      time: "D-1 · evening",
      title: "Moon sighting · Ramadan concludes · final iftar of the month",
      note:
        "Eid date confirmed once new moon is sighted. Sometimes uncertain " +
        "until late evening D-1.",
    },
    {
      key: "new_clothes_prepared",
      phase: "pre_day_staging",
      slot: 20,
      time: "D-2",
      title: "New clothes prepared · traditional dress for family",
      note: "Tradition to wear new clothes for Eid morning prayer.",
    },
    {
      key: "eid_food_prep",
      phase: "pre_day_staging",
      slot: 30,
      time: "D-1",
      title: "Eid feast prep · sheer khurma + biryani + sweets",
    },
    {
      key: "family_morning_prep",
      phase: "vip_arrivals",
      slot: 10,
      time: "Eid prayer − 90 min",
      title: "Family wakes early · ghusl (ritual bath) · dressed in new clothes",
    },
    {
      key: "travel_to_masjid",
      phase: "guest_arrivals",
      slot: 10,
      time: "Eid prayer − 30 min",
      title: "Family travels to masjid · sometimes outdoor prayer ground for capacity",
    },
    {
      key: "eid_prayer",
      phase: "anchor_moment",
      slot: 10,
      time: "Eid prayer + 0",
      title: "EID PRAYER (Salat al-Eid) at masjid · two rakat + khutbah",
      vendor: "imam",
      note:
        "Major masjids often hold multiple prayer times to accommodate " +
        "capacity. Outdoor grounds used by largest DFW masjids.",
    },
    {
      key: "embraces_eid_mubarak",
      phase: "anchor_moment",
      slot: 20,
      time: "Eid prayer + 30 min",
      title: "Embraces + 'Eid Mubarak' greetings · community fellowship",
    },
    {
      key: "return_home_family_breakfast",
      phase: "transition",
      slot: 10,
      time: "Eid prayer + 60 min",
      title: "Return home · family breakfast (often sheer khurma)",
    },
    {
      key: "eidi_gifts_to_children",
      phase: "continuation_arc",
      slot: 10,
      time: "Eid prayer + 2 h",
      title: "EIDI · cash gifts to children from elders",
      note: "Children receive cash from elders. Modal $5-$50 per child per elder.",
    },
    {
      key: "family_feast",
      phase: "continuation_arc",
      slot: 20,
      time: "Eid prayer + 4 h",
      title: "Family feast · biryani + kebabs + multi-course meal · extended family gathers",
    },
    {
      key: "extended_family_visits",
      phase: "continuation_arc",
      slot: 30,
      time: "Eid prayer + 6 h",
      title: "Extended family visits · multi-stop visiting tradition",
      note:
        "Often spans 2-3 days. Each household visited briefly with sweets + chai.",
    },
    {
      key: "informal_close",
      phase: "send_off",
      slot: 10,
      time: "Eid prayer + 12 h",
      title: "Day concludes · multi-day visiting continues D+1 to D+3",
    },
  ],
};

export default eidAlFitr;
