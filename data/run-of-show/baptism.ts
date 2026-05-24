// data/run-of-show/baptism.ts
// Christian Baptism (Catholic + Protestant infant baptism modal)
//
// V2 Tier 5. Sacrament initiating the child into the Christian faith.
// Catholic + most Protestant denominations baptize infants; Baptist + some
// Pentecostal traditions baptize adolescents/adults by full immersion.
// This recipe covers infant baptism modal — adapts for adult baptism with
// fewer items.
//
// Anchor: pouring of water + Trinitarian formula ("I baptize you in the
// name of the Father, and of the Son, and of the Holy Spirit").

import type { RoSRecipe } from "./types";

const baptism: RoSRecipe = {
  key: "baptism",
  labelEn: "Baptism",
  labelEs: "Bautismo",
  eventType: "social",
  eventSubtypes: ["baptism"], // CC: cross-check vs data/budget-presets.ts
  items: [
    {
      key: "parish_baptism_class",
      phase: "pre_day_staging",
      slot: 10,
      time: "D-60",
      title: "Parents' parish baptism class · required by most Catholic parishes",
      vendor: "parish priest or deacon",
    },
    {
      key: "godparents_confirmed",
      phase: "pre_day_staging",
      slot: 20,
      time: "D-60",
      title: "Godparents (padrinos) confirmed · must be confirmed Catholic in good standing",
      note:
        "Hispanic Catholic families: padrinos. Each godparent may have specific " +
        "role (godparent of water, of candle, of book, etc.).",
    },
    {
      key: "baptism_gown_acquired",
      phase: "pre_day_staging",
      slot: 30,
      time: "D-21",
      title: "Baptism gown acquired · traditional white · sometimes family heirloom",
    },
    {
      key: "family_arrives_at_parish",
      phase: "vip_arrivals",
      slot: 10,
      time: "ceremony − 30 min",
      title: "Family arrives · child in baptism gown · godparents present",
    },
    {
      key: "guests_seated",
      phase: "guest_arrivals",
      slot: 10,
      time: "ceremony − 10 min",
      title: "Extended family + close friends seated near baptismal font",
    },
    {
      key: "welcome_at_door",
      phase: "opening_moment",
      slot: 10,
      time: "ceremony + 0",
      title: "Welcome at church door · priest signs cross on child's forehead",
      vendor: "parish priest",
    },
    {
      key: "scripture_homily",
      phase: "first_arc",
      slot: 10,
      time: "ceremony + 5 min",
      title: "Scripture reading + homily on baptism",
    },
    {
      key: "renunciation_profession_faith",
      phase: "first_arc",
      slot: 20,
      time: "ceremony + 15 min",
      title: "Renunciation of evil · profession of faith by parents + godparents",
    },
    {
      key: "blessing_baptismal_water",
      phase: "first_arc",
      slot: 30,
      time: "ceremony + 20 min",
      title: "Blessing of baptismal water",
    },
    {
      key: "baptism_with_water",
      phase: "anchor_moment",
      slot: 10,
      time: "ceremony + 25 min",
      title: "BAPTISM · water poured 3 times · 'I baptize you in the name of the Father, and of the Son, and of the Holy Spirit'",
      vendor: "parish priest",
      note:
        "The sacramental moment. Photographed extensively. Trinitarian formula " +
        "is the load-bearing element.",
    },
    {
      key: "anointing_chrism_oil",
      phase: "anchor_moment",
      slot: 20,
      time: "ceremony + 28 min",
      title: "Anointing with chrism oil on crown of head",
    },
    {
      key: "white_garment_candle",
      phase: "anchor_moment",
      slot: 30,
      time: "ceremony + 32 min",
      title: "White garment placed · baptismal candle lit from Easter candle",
    },
    {
      key: "lords_prayer_blessing",
      phase: "transition",
      slot: 10,
      time: "ceremony + 38 min",
      title: "Lord's Prayer · final blessing of parents + child",
    },
    {
      key: "family_photos_at_font",
      phase: "transition",
      slot: 20,
      time: "ceremony + 45 min",
      title: "Family photos at baptismal font · with priest and godparents",
      vendor: "photographer",
    },
    {
      key: "family_reception",
      phase: "continuation_arc",
      slot: 10,
      time: "ceremony + 60 min",
      title: "Family reception · home or restaurant · gifts presented (religious items typical)",
    },
    {
      key: "meal_celebration",
      phase: "continuation_arc",
      slot: 20,
      time: "ceremony + 90 min",
      title: "Celebration meal · cake (sometimes baptism-themed) cut",
    },
    {
      key: "informal_close",
      phase: "send_off",
      slot: 10,
      time: "ceremony + 4 h",
      title: "Reception closes",
    },
  ],
};

export default baptism;
