// data/run-of-show/confirmation.ts
// Catholic Confirmation
//
// V2 Tier 4. Catholic coming-of-age sacrament — typically ages 13-16 in US
// dioceses. Diocesan bishop celebrates with parish; one Mass per year per
// diocese typical, so date is fixed by diocesan calendar.
//
// Anchor: bishop's confirmation of each candidate (chrism oil + new name +
// "Be sealed with the Gift of the Holy Spirit").

import type { RoSRecipe } from "./types";

const confirmation: RoSRecipe = {
  key: "confirmation",
  labelEn: "Catholic Confirmation",
  labelEs: "Confirmación católica",
  eventType: "social",
  eventSubtypes: ["confirmation"], // CC: cross-check vs data/budget-presets.ts
  items: [
    {
      key: "religious_education_year",
      phase: "pre_day_staging",
      slot: 10,
      time: "D-365 to D-1 (year-long)",
      title: "Religious education classes (CCD / PSR) · 1-2 years of weekly classes",
      note:
        "Constraint cascade — missing classes can void confirmation eligibility " +
        "for the year's Mass.",
    },
    {
      key: "retreat_weekend",
      phase: "pre_day_staging",
      slot: 20,
      time: "D-60",
      title: "Confirmation retreat weekend · spiritual preparation",
    },
    {
      key: "sponsor_confirmed",
      phase: "pre_day_staging",
      slot: 30,
      time: "D-90",
      title: "Sponsor (confirmation godparent) confirmed · must be confirmed Catholic in good standing",
    },
    {
      key: "confirmation_name_chosen",
      phase: "pre_day_staging",
      slot: 40,
      time: "D-30",
      title: "Confirmation name chosen · saint's name candidate will take",
      note:
        "Each candidate picks a saint whose example they want to emulate. The " +
        "name is spoken aloud during the confirmation rite.",
    },
    {
      key: "confirmation_robe_red",
      phase: "load_in",
      slot: 10,
      time: "Mass − 90 min",
      title: "Candidate dressed · red confirmation robe or appropriate formal attire",
    },
    {
      key: "family_sponsor_arrive",
      phase: "vip_arrivals",
      slot: 10,
      time: "Mass − 60 min",
      title: "Family + sponsor arrive at parish · candidate seated with sponsor",
    },
    {
      key: "guests_seated",
      phase: "guest_arrivals",
      slot: 10,
      time: "Mass − 15 min",
      title: "Guests arrive · diocese-wide candidates may number in hundreds",
    },
    {
      key: "bishop_processional",
      phase: "opening_moment",
      slot: 10,
      time: "Mass + 0",
      title: "Bishop's processional · Mass begins",
      vendor: "diocesan bishop",
    },
    {
      key: "liturgy_of_word_homily",
      phase: "first_arc",
      slot: 10,
      time: "Mass + 5 min",
      title: "Liturgy of the Word · bishop's homily on confirmation",
    },
    {
      key: "renewal_of_baptismal_promises",
      phase: "first_arc",
      slot: 20,
      time: "Mass + 25 min",
      title: "Renewal of baptismal promises · candidates respond as a group",
    },
    {
      key: "confirmation_rite",
      phase: "anchor_moment",
      slot: 10,
      time: "Mass + 30 min",
      title: "CONFIRMATION RITE · bishop anoints with chrism oil · 'Be sealed with the Gift of the Holy Spirit'",
      vendor: "diocesan bishop",
      note:
        "Each candidate approaches with sponsor's hand on shoulder. Bishop " +
        "uses confirmation name. Sacrament is administered individually.",
    },
    {
      key: "eucharist_liturgy",
      phase: "anchor_moment",
      slot: 20,
      time: "Mass + 50 min",
      title: "Liturgy of the Eucharist · newly-confirmed receive communion",
    },
    {
      key: "mass_concludes",
      phase: "transition",
      slot: 10,
      time: "Mass + 75 min",
      title: "Mass concludes · group photos with bishop at altar",
    },
    {
      key: "family_reception",
      phase: "continuation_arc",
      slot: 10,
      time: "Mass + 90 min",
      title: "Family reception · home or restaurant · gifts presented",
      note:
        "Often gifts of religious significance — rosaries, Bibles, saint medals, " +
        "crucifixes — from godparents + family.",
    },
    {
      key: "informal_close",
      phase: "send_off",
      slot: 10,
      time: "Mass + 5 h",
      title: "Reception concludes · informal close",
    },
  ],
};

export default confirmation;
