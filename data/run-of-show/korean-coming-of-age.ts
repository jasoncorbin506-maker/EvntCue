// data/run-of-show/korean-coming-of-age.ts
// Korean Coming-of-Age Day (Seongnyeon-il)
//
// V2 Tier 4. Korean national coming-of-age holiday — third Monday in May
// for those turning 19. Traditional ceremony (Gwallye for men, Gyerye for
// women) involves hanbok dressing + hair styling + ceremonial bow to
// elders. Diaspora Korean families adapt or hold smaller versions.
//
// Anchor: ceremonial bow to parents + presentation of adult clothing/hair.

import type { RoSRecipe } from "./types";

const koreanComingOfAge: RoSRecipe = {
  key: "korean_coming_of_age",
  labelEn: "Korean Coming-of-Age Day (Seongnyeon-il)",
  labelEs: "Día coreano de mayoría de edad",
  eventType: "public_cultural",
  eventSubtypes: ["korean_coming_of_age", "seongnyeon"], // CC: cross-check vs data/budget-presets.ts
  items: [
    {
      key: "hanbok_acquired",
      phase: "pre_day_staging",
      slot: 10,
      time: "D-60",
      title: "Adult hanbok rental or purchase · formal style for the ceremony",
      vendor: "hanbok rental boutique",
    },
    {
      key: "roses_traditional_gifts",
      phase: "pre_day_staging",
      slot: 20,
      time: "D-7",
      title: "Traditional gifts prepared · roses (love) + perfume (lasting impression) + kiss (?)",
      note:
        "Modern Korean tradition: roses, perfume, and (traditionally) a kiss " +
        "from a romantic partner. Friends and family often give gifts of " +
        "symbolic adulthood (wallet, cosmetics set, formal accessories).",
    },
    {
      key: "hair_styled_adult",
      phase: "vip_arrivals",
      slot: 10,
      time: "ceremony − 2 h",
      title: "Hair styled · traditional adult hairstyle (binyeo hairpin for women)",
      vendor: "hair / makeup",
    },
    {
      key: "hanbok_dressing",
      phase: "vip_arrivals",
      slot: 20,
      time: "ceremony − 90 min",
      title: "Hanbok dressing · honoree dressed by family member or specialist",
    },
    {
      key: "family_arrives",
      phase: "guest_arrivals",
      slot: 10,
      time: "ceremony − 30 min",
      title: "Family + close friends arrive at family home or venue",
    },
    {
      key: "ancestral_altar_offerings",
      phase: "opening_moment",
      slot: 10,
      time: "ceremony − 10 min",
      title: "Offerings made at ancestral altar (where observed) · ancestors notified",
    },
    {
      key: "ceremonial_bow_to_parents",
      phase: "anchor_moment",
      slot: 10,
      time: "ceremony + 0",
      title: "CEREMONIAL BOW · honoree performs full traditional bow (jeol) to parents",
      note:
        "Deep formal bow signifying gratitude for the years of upbringing + " +
        "readiness to assume adult responsibilities.",
    },
    {
      key: "parents_blessing",
      phase: "anchor_moment",
      slot: 20,
      time: "ceremony + 5 min",
      title: "Parents bless honoree · words of guidance for adult life",
    },
    {
      key: "tea_ceremony",
      phase: "anchor_moment",
      slot: 30,
      time: "ceremony + 15 min",
      title: "Tea ceremony · honoree serves tea to parents + elder family in formal cups",
    },
    {
      key: "extended_family_gifts",
      phase: "transition",
      slot: 10,
      time: "ceremony + 25 min",
      title: "Extended family presents gifts · cash + symbolic adulthood items",
    },
    {
      key: "family_meal",
      phase: "continuation_arc",
      slot: 10,
      time: "ceremony + 45 min",
      title: "Family meal · Korean banquet · honoree as centerpiece",
      vendor: "Korean caterer",
    },
    {
      key: "evening_friends_celebration",
      phase: "continuation_arc",
      slot: 20,
      time: "ceremony + 5 h",
      title: "Evening celebration with friends · informal · bars / karaoke / dinner out",
    },
    {
      key: "informal_close",
      phase: "send_off",
      slot: 10,
      time: "late evening",
      title: "Day concludes",
    },
  ],
};

export default koreanComingOfAge;
