/**
 * Cultural traditions library — source of truth for the timeline picker.
 *
 * Ceremonies sourced verbatim (label + detail) from
 *   03_Research/CUE_Training_Wedding_Traditions_Module3_v1.1.md
 *
 * The picker (CulturalTraditionsPicker) surfaces these so blended families
 * can add ceremonies from each tradition to their timeline. Adheres to:
 *   - Lock 14 (cultural copy boundary) — labels are the tradition's own
 *     name, never concatenated with possessive/money/identifier.
 *   - Cue Cultural Voice Contract — `coverage` field signals depth honestly;
 *     partial-coverage cultures show a "still learning" badge in the picker
 *     and invite the user to free-type ceremonies the research doesn't cover.
 *
 * Key namespace matches the cultural-prefix scheme used in
 *   data/event-milestones.ts (e.g., hindu_sangeet, mexican_padrinos_confirmed).
 *
 * Adding a tradition or ceremony: append to TRADITIONS. The picker re-renders.
 * No migration required — these are seed defaults, not stored rows.
 */

export type Coverage = "documented" | "partial";

export type Ceremony = {
  key: string;
  label: string;
  detail: string;
  /** Days offset from event.start_date. 0 = day-of, -1 = night before, -180 = ~6 months before. */
  defaultOffsetDays: number;
};

export type Tradition = {
  key: string;
  label: string;
  /**
   * "documented" — full deep-dive section + ceremony timeline in the research.
   * "partial"    — variation noted but not fully timelined; honest signal to
   *                the user that the picker is incomplete and free-text adds
   *                are welcome. Cue Cultural Voice Contract: promise to learn.
   */
  coverage: Coverage;
  ceremonies: Ceremony[];
  /** Shown on the chip when coverage === "partial". */
  partialNote?: string;
};

const CATHOLIC: Ceremony[] = [
  {
    key: "catholic_pre_cana",
    label: "Pre-Cana",
    detail: "Marriage prep program required by the Church. 6 months to 1 year before; cannot be waived; must complete before parish confirms the date.",
    defaultOffsetDays: -270,
  },
  {
    key: "catholic_paperwork",
    label: "Paperwork",
    detail: "Baptismal certificate, confirmation certificate, freedom-to-marry declaration. Annulment paperwork if either party was previously married.",
    defaultOffsetDays: -180,
  },
  {
    key: "catholic_rehearsal",
    label: "Rehearsal",
    detail: "Evening before. Priest leads. Processional order, photography positions, and cue points locked here.",
    defaultOffsetDays: -1,
  },
  {
    key: "catholic_nuptial_mass",
    label: "Nuptial Mass",
    detail: "60–90 min with Mass. If one party is non-Catholic, ceremony without Mass is common (Communion omitted or restricted).",
    defaultOffsetDays: 0,
  },
  {
    key: "catholic_family_photos_altar",
    label: "Family photos at altar",
    detail: "Time-limited per parish allowance. Guests typically wait in vestibule or exit.",
    defaultOffsetDays: 0,
  },
];

const PROTESTANT: Ceremony[] = [
  {
    key: "protestant_premarital_counseling",
    label: "Premarital counseling",
    detail: "Pastor-led. Varies by denomination — Baptist, Methodist, Episcopal, Lutheran, Pentecostal all differ.",
    defaultOffsetDays: -240,
  },
  {
    key: "protestant_rehearsal",
    label: "Rehearsal",
    detail: "Evening before. Officiant typically leads.",
    defaultOffsetDays: -1,
  },
  {
    key: "protestant_unity_ceremony",
    label: "Unity ceremony",
    detail: "Candle, sand, wine, or other symbolic ritual. Optional. Confirm props are in place before ceremony begins.",
    defaultOffsetDays: 0,
  },
  {
    key: "protestant_ceremony",
    label: "Ceremony",
    detail: "30–60 min. Pastor-led, Scripture readings, vows, ring exchange, pronouncement. Highly couple-driven structure.",
    defaultOffsetDays: 0,
  },
];

const GREEK_ORTHODOX: Ceremony[] = [
  {
    key: "greek_orthodox_cathedral_membership",
    label: "Cathedral membership",
    detail: "One party must be a member in good standing.",
    defaultOffsetDays: -300,
  },
  {
    key: "greek_orthodox_marriage_seminar",
    label: "Marriage Seminar",
    detail: "Held 3× per year — register early.",
    defaultOffsetDays: -240,
  },
  {
    key: "greek_orthodox_premarital_counseling",
    label: "Pre-marital counseling",
    detail: "Two sessions required.",
    defaultOffsetDays: -180,
  },
  {
    key: "greek_orthodox_betrothal",
    label: "Service of Betrothal",
    detail: "Blessing and exchange of rings by priest. Rings exchanged three times by the koumbaro/koumbara.",
    defaultOffsetDays: 0,
  },
  {
    key: "greek_orthodox_crowning",
    label: "The Crowning (Stefana)",
    detail: "Two crowns placed on the couple's heads, exchanged three times by the koumbaro/koumbara. Central sacramental moment.",
    defaultOffsetDays: 0,
  },
  {
    key: "greek_orthodox_common_cup",
    label: "The Common Cup",
    detail: "Couple shares wine from the same cup three times.",
    defaultOffsetDays: 0,
  },
  {
    key: "greek_orthodox_dance_of_isaiah",
    label: "Dance of Isaiah",
    detail: "Priest leads the couple in three circles around the altar table. The most photographed sequence of the ceremony.",
    defaultOffsetDays: 0,
  },
];

const JEWISH: Ceremony[] = [
  {
    key: "jewish_tenaim",
    label: "Tenaim",
    detail: "Formal engagement document. Ashkenazi Orthodox practice; a plate is broken to commemorate the destruction of the Temple. May happen at a separate event or just before the wedding.",
    defaultOffsetDays: -270,
  },
  {
    key: "jewish_aufruf",
    label: "Aufruf",
    detail: "Sabbath blessing before the wedding. Couple called to the Torah; congregation showers them with candy.",
    defaultOffsetDays: -7,
  },
  {
    key: "jewish_ketubah_signing",
    label: "Ketubah signing",
    detail: "Marriage contract signed by two witnesses, rabbi, groom, and bride before the ceremony. In Orthodox practice, witnesses cannot be immediate family.",
    defaultOffsetDays: 0,
  },
  {
    key: "jewish_bedeken",
    label: "Bedeken (veiling)",
    detail: "Groom lowers veil over bride's face, surrounded by family. Echoes Jacob and Leah. Ashkenazi practice; generally not observed in Sephardi or Mizrahi communities.",
    defaultOffsetDays: 0,
  },
  {
    key: "jewish_chuppah_ceremony",
    label: "Chuppah ceremony",
    detail: "Wedding canopy open on all four sides. The full ceremony — Kiddush, vows, ring, Ketubah reading, D'var Torah, Sheva Brachot, breaking of the glass — takes place beneath it.",
    defaultOffsetDays: 0,
  },
  {
    key: "jewish_hakafot",
    label: "Hakafot (circling)",
    detail: "Bride circles groom three or seven times immediately upon arriving under the Chuppah. Ashkenazi practice; generally not performed in Sephardi communities.",
    defaultOffsetDays: 0,
  },
  {
    key: "jewish_sheva_brachot",
    label: "Sheva Brachot (Seven Blessings)",
    detail: "Seven honored guests recite one blessing each. The honoree list is a social document; confirm at least two weeks out and provide each their blessing text.",
    defaultOffsetDays: 0,
  },
  {
    key: "jewish_breaking_glass",
    label: "Breaking of the glass",
    detail: "Groom stomps; guests cheer Mazel Tov. The emotional climax of the ceremony.",
    defaultOffsetDays: 0,
  },
  {
    key: "jewish_yichud",
    label: "Yichud",
    detail: "Couple alone in private room for 10–15 minutes after the ceremony. Sacred. Must not be interrupted. Water and a small meal prepared.",
    defaultOffsetDays: 0,
  },
];

const HINDU: Ceremony[] = [
  {
    key: "hindu_roka_engagement",
    label: "Roka / Engagement",
    detail: "Formal engagement ceremony.",
    defaultOffsetDays: -450,
  },
  {
    key: "hindu_ganesh_puja",
    label: "Ganesh Puja",
    detail: "Prayer to Ganesh — remover of obstacles — performed before the wedding ceremonies begin.",
    defaultOffsetDays: -1,
  },
  {
    key: "hindu_mehndi",
    label: "Mehndi",
    detail: "Bride's hands and feet decorated with henna. Music, dancing, family gathered.",
    defaultOffsetDays: -1,
  },
  {
    key: "hindu_sangeet",
    label: "Sangeet",
    detail: "Musical evening — family members perform songs and dances for the couple. Can be as elaborate as the wedding itself.",
    defaultOffsetDays: -1,
  },
  {
    key: "hindu_haldi",
    label: "Haldi",
    detail: "Turmeric paste applied to both bride and groom in separate or combined ceremonies.",
    defaultOffsetDays: -1,
  },
  {
    key: "hindu_baraat",
    label: "Baraat",
    detail: "Groom's procession — often on horseback or in a decorated vehicle, surrounded by dancing family. Runs 30–60 minutes before the ceremony.",
    defaultOffsetDays: 0,
  },
  {
    key: "hindu_kanya_daan",
    label: "Kanya Daan",
    detail: "Father gives bride away to groom; places her hand in his. Pandit chants. Emotionally significant.",
    defaultOffsetDays: 0,
  },
  {
    key: "hindu_vivah_homa",
    label: "Vivah Homa",
    detail: "Sacred fire lit and maintained throughout the ceremony. Venue must permit open flame indoors.",
    defaultOffsetDays: 0,
  },
  {
    key: "hindu_saptapadi",
    label: "Saptapadi",
    detail: "Seven steps around the sacred fire. Each step is a sacred vow. Legally binding under Section 7(2), Hindu Marriage Act 1955 where part of customary practice. Cannot be shortened.",
    defaultOffsetDays: 0,
  },
  {
    key: "hindu_sindoor",
    label: "Sindoor",
    detail: "Groom applies vermilion in bride's hair parting. Marks the bride as a married woman.",
    defaultOffsetDays: 0,
  },
  {
    key: "hindu_mangalsutra",
    label: "Mangalsutra",
    detail: "Groom ties sacred necklace around bride's neck. North Indian sequence places this AFTER Saptapadi. South Indian (Tamil, Telugu, Kannada, Malayali) traditions tie Mangalsutra/Thali BEFORE Saptapadi and treat it as the central emotional moment — confirm sequence with family and Pandit.",
    defaultOffsetDays: 0,
  },
  {
    key: "hindu_vidai",
    label: "Vidai",
    detail: "Bride's departure from her family. She throws rice over her shoulder toward her family home. Deeply emotional. Takes as long as it takes.",
    defaultOffsetDays: 0,
  },
];

const ISLAMIC: Ceremony[] = [
  {
    key: "islamic_mehndi_night",
    label: "Mehndi night",
    detail: "Henna application for the bride. Women-only in observant families, mixed in others.",
    defaultOffsetDays: -1,
  },
  {
    key: "islamic_mahr_negotiation",
    label: "Mahr agreement",
    detail: "Mandatory gift from groom to bride. May be paid in two parts — muqaddam (at the contract) and mu'akhkhar (deferred, paid later or upon divorce/death). Belongs exclusively to the bride.",
    defaultOffsetDays: -90,
  },
  {
    key: "islamic_aqd_preparation",
    label: "Contract preparation (Aqd)",
    detail: "Marriage contract prepared by the Imam or family in advance. Both parties and their walis review and agree.",
    defaultOffsetDays: -30,
  },
  {
    key: "islamic_khutbah",
    label: "Khutbah (sermon)",
    detail: "Imam opens with a sermon on marriage in Islam. Quranic verses recited.",
    defaultOffsetDays: 0,
  },
  {
    key: "islamic_ijab_qabul",
    label: "Ijab-o-Qabul",
    detail: "Offer and acceptance. Groom states acceptance of the Mahr and marriage; bride (or her wali) accepts. Two Muslim witnesses must hear it. Sometimes spoken three times.",
    defaultOffsetDays: 0,
  },
  {
    key: "islamic_nikah_signing",
    label: "Nikah signing",
    detail: "Contract signed — groom first, then bride, then witnesses.",
    defaultOffsetDays: 0,
  },
  {
    key: "islamic_walima",
    label: "Walima",
    detail: "Wedding feast. Strongly emphasized practice for the groom to host. May be the same day or the following day.",
    defaultOffsetDays: 1,
  },
];

const SIKH: Ceremony[] = [
  {
    key: "sikh_milni",
    label: "Milni",
    detail: "Formal meeting of both families outside the Gurdwara. Male relatives matched and embrace; garlands exchanged. Joyful — allow 20–30 minutes.",
    defaultOffsetDays: 0,
  },
  {
    key: "sikh_ardas",
    label: "Ardas (opening prayer)",
    detail: "Granthi leads the opening prayer. All stand; hands clasped.",
    defaultOffsetDays: 0,
  },
  {
    key: "sikh_palla",
    label: "Palla ceremony",
    detail: "Bride's father places one end of a scarf in the groom's hand; bride holds the other end. Symbolizes the father entrusting his daughter to the groom's care.",
    defaultOffsetDays: 0,
  },
  {
    key: "sikh_anand_karaj",
    label: "Anand Karaj (Four Lavs)",
    detail: "Four circumambulations of the Guru Granth Sahib, one for each verse of the Laavan. After the fourth, the couple is married. Each Lav is followed by a full kirtan — cannot be rushed.",
    defaultOffsetDays: 0,
  },
  {
    key: "sikh_anand_sahib",
    label: "Anand Sahib & Hukamnama",
    detail: "Hymn of bliss; closing Ardas; Hukamnama (reading from the Guru Granth Sahib).",
    defaultOffsetDays: 0,
  },
  {
    key: "sikh_karah_parshad",
    label: "Karah Parshad",
    detail: "Sacred sweet distributed to all present. Accept with both hands cupped; never refuse.",
    defaultOffsetDays: 0,
  },
  {
    key: "sikh_langar",
    label: "Langar",
    detail: "Communal vegetarian meal in the Gurdwara langar hall. All sit together regardless of social status — Sikh principle of equality in action.",
    defaultOffsetDays: 0,
  },
];

const CHINESE: Ceremony[] = [
  {
    key: "chinese_guo_da_li",
    label: "Guo Da Li (betrothal gifts)",
    detail: "Groom's family presents gifts to bride's family — formal acknowledgment of the marriage. A serious negotiation, not a formality.",
    defaultOffsetDays: -180,
  },
  {
    key: "chinese_an_chuang",
    label: "An Chuang (bed-setting)",
    detail: "Groom's family sets up the bridal bed with red dates, longans, lotus seeds, and peanuts — symbolizing fertility and prosperity.",
    defaultOffsetDays: -2,
  },
  {
    key: "chinese_shang_tou",
    label: "Shang Tou (hair-combing)",
    detail: "Elder combs the bride's hair four times while reciting blessings for longevity, prosperity, children, and a good marriage. Groom has a parallel ceremony.",
    defaultOffsetDays: -1,
  },
  {
    key: "chinese_an_men",
    label: "An Men (door games)",
    detail: "Wedding morning — groom arrives to fetch the bride; bridesmaids block the door with challenges. Runs 30–60 minutes. One of the most joyful moments.",
    defaultOffsetDays: 0,
  },
  {
    key: "chinese_tea_ceremony_brides",
    label: "Tea ceremony — bride's family",
    detail: "Bride serves tea to her own parents and elders. A moment of farewell and gratitude before she departs the family home.",
    defaultOffsetDays: 0,
  },
  {
    key: "chinese_tea_ceremony_grooms",
    label: "Tea ceremony — groom's family",
    detail: "THE most significant traditional moment. Couple kneels and serves tea to each elder in order of seniority; elders give red envelopes (hongbao). Takes 30–60 minutes — cannot be rushed.",
    defaultOffsetDays: 0,
  },
  {
    key: "chinese_banquet",
    label: "Banquet",
    detail: "8–12 course banquet. Each course has symbolic meaning. Multiple outfit changes for the couple are standard.",
    defaultOffsetDays: 0,
  },
  {
    key: "chinese_lion_dance",
    label: "Lion / dragon dance",
    detail: "Common at Cantonese receptions. Requires advance booking, significant space, and noise planning with the venue.",
    defaultOffsetDays: 0,
  },
];

const NIGERIAN: Ceremony[] = [
  {
    key: "nigerian_aso_oke_procurement",
    label: "Aso-oke procurement",
    detail: "Family-color woven fabric. Both families have their own color scheme; all family members on each side wear matching fabric. Requires a fabric coordinator and significant lead time. DFW couples often source from Houston.",
    defaultOffsetDays: -180,
  },
  {
    key: "nigerian_introduction",
    label: "Introduction (traditional)",
    detail: "Igba Nkwu (Igbo), Introduction (Yoruba), or Kamu (Hausa). Formal presentation of the groom's family to the bride's, bride price negotiation, ceremonial blessing. A complete ceremony in its own right — not a rehearsal for the church wedding.",
    defaultOffsetDays: -1,
  },
  {
    key: "nigerian_kola_nut_ceremony",
    label: "Kola nut ceremony",
    detail: "Sacred in Yoruba and Igbo culture; opens all important gatherings. Breaking accompanied by prayer and libation.",
    defaultOffsetDays: -1,
  },
  {
    key: "nigerian_palm_wine_ceremony",
    label: "Palm wine ceremony",
    detail: "Bride carries a calabash of palm wine through the guests; when she finds the groom, she kneels and presents it. Public declaration of her choice.",
    defaultOffsetDays: -1,
  },
  {
    key: "nigerian_spraying_money",
    label: "Spraying of money",
    detail: "Guests celebrate by spraying cash onto the couple as they dance. A spraying coordinator or family member collects the money as it falls — the couple does not pick it up themselves.",
    defaultOffsetDays: 0,
  },
  {
    key: "nigerian_church_wedding",
    label: "Church or court wedding",
    detail: "Day 2 — standard Christian ceremony with high-energy praise and worship music, full choir and live band typical.",
    defaultOffsetDays: 0,
  },
];

const ETHIOPIAN: Ceremony[] = [
  {
    key: "ethiopian_agelgel",
    label: "Agelgel (Engagement)",
    detail: "Day 1 of multi-day celebration. Formal agreement between families; gift exchange.",
    defaultOffsetDays: -2,
  },
  {
    key: "ethiopian_sebseba",
    label: "Sebseba (Wedding Eve)",
    detail: "Family gathering the night before. Traditional music and dance; bride's final night with her family.",
    defaultOffsetDays: -1,
  },
  {
    key: "ethiopian_orthodox_ceremony",
    label: "Ethiopian Orthodox ceremony",
    detail: "Liturgical core in Ge'ez (the ancient liturgical language); readings, homily, and announcements typically in Amharic. Led by a Qes (priest). Incense (tenakel) burned throughout — venues must accommodate. Couple processes three times around the altar.",
    defaultOffsetDays: 0,
  },
  {
    key: "ethiopian_eskista",
    label: "Eskista",
    detail: "Traditional Ethiopian shoulder-rolling dance performed by guests. A professional Eskista dancer is often hired to lead it.",
    defaultOffsetDays: 0,
  },
  {
    key: "ethiopian_post_wedding",
    label: "Post-wedding celebration",
    detail: "Family and close friends gather at the couple's new home for continued celebration.",
    defaultOffsetDays: 1,
  },
];

const MEXICAN: Ceremony[] = [
  {
    key: "mexican_padrinos_confirmed",
    label: "Padrinos",
    detail: "Sponsors for lazo, arras, cojines, church flowers, cake, music, and more. Confirm each padrino's element early.",
    defaultOffsetDays: -180,
  },
  {
    key: "mexican_mariachi_confirmed",
    label: "Mariachi",
    detail: "Live mariachi is traditional at the reception and often at the ceremony entrance.",
    defaultOffsetDays: -120,
  },
  {
    key: "mexican_civil_wedding",
    label: "Civil wedding (matrimonio civil)",
    detail: "Often held the day before the church ceremony. Legal core of the marriage.",
    defaultOffsetDays: -1,
  },
  {
    key: "mexican_arras",
    label: "Arras (unity coins)",
    detail: "Thirteen gold coins given from groom to bride — representing Christ and the twelve apostles, and the groom's pledge to provide. Padrino de arras presents the tray; priest blesses; groom pours into bride's hands.",
    defaultOffsetDays: 0,
  },
  {
    key: "mexican_lazo",
    label: "Lazo (wedding lasso)",
    detail: "Floral garland or rosary in a figure-eight placed around the couple's shoulders during the ceremony. Padrino de lazo places it; remains in place for the duration of vows.",
    defaultOffsetDays: 0,
  },
  {
    key: "mexican_cojines",
    label: "Cojines (kneeling pillows)",
    detail: "Couple kneels on embroidered pillows during significant moments. Often gifts from padrinos.",
    defaultOffsetDays: 0,
  },
  {
    key: "mexican_bouquet_offering",
    label: "Bouquet offering",
    detail: "After the ceremony, bride offers her bouquet to the Virgin Mary at a small side altar. A prayer of gratitude and petition.",
    defaultOffsetDays: 0,
  },
  {
    key: "mexican_hora_loca",
    label: "Hora Loca",
    detail: "Mid-reception burst of entertainment — costumes, glow items, confetti cannons, surprise performers. Requires DJ coordination and prop setup.",
    defaultOffsetDays: 0,
  },
  {
    key: "mexican_late_night_tamales",
    label: "Late-night tamales",
    detail: "Tamales and champurrado served if the celebration extends past midnight. A signal the party is still going.",
    defaultOffsetDays: 0,
  },
];

const JAPANESE: Ceremony[] = [
  {
    key: "japanese_yui_no",
    label: "Yui-no",
    detail: "Formal engagement gift exchange between families.",
    defaultOffsetDays: -120,
  },
  {
    key: "japanese_shubatsu",
    label: "Shubatsu (purification)",
    detail: "Shinto priest (Kannushi) purifies the couple and the space with a sacred wand (haraigushi).",
    defaultOffsetDays: 0,
  },
  {
    key: "japanese_norito",
    label: "Norito (prayers to the kami)",
    detail: "Priest recites prayers to the kami (spirits). Deep silence during this portion; no movement or sound from guests.",
    defaultOffsetDays: 0,
  },
  {
    key: "japanese_san_san_kudo",
    label: "San-san-kudo (sake sharing)",
    detail: "Three-three-nine times. Three cups of sake in increasing size; three sips each, nine total. The Shinto equivalent of the exchange of vows. Must never be rushed.",
    defaultOffsetDays: 0,
  },
  {
    key: "japanese_tamagushi_houken",
    label: "Tamagushi Houken",
    detail: "Offering of sacred branches to the kami.",
    defaultOffsetDays: 0,
  },
  {
    key: "japanese_candle_service",
    label: "Candle service",
    detail: "Couple visits each reception table carrying a candle, lighting the centerpiece candle. A quiet moment of connection with each group.",
    defaultOffsetDays: 0,
  },
  {
    key: "japanese_nijikai",
    label: "Nijikai (second party)",
    detail: "Separate, more casual reception after the formal one — for closer friends, smaller venue, relaxed atmosphere. A second event to plan.",
    defaultOffsetDays: 0,
  },
];

const KOREAN: Ceremony[] = [
  {
    key: "korean_hanbok_fitting",
    label: "Hanbok fitting",
    detail: "Traditional dress: chima jeogori for the bride, dopo for the groom.",
    defaultOffsetDays: -120,
  },
  {
    key: "korean_paebaek_setup",
    label: "Paebaek room preparation",
    detail: "Low table with fruit, jujubes, rice cakes, candlesticks. Red and blue candle, traditional wine. Many Korean families bring these items themselves.",
    defaultOffsetDays: 0,
  },
  {
    key: "korean_keun_jeol",
    label: "Keun Jeol (deep bows)",
    detail: "Couple performs four deep ceremonial bows to the groom's parents (two each). Each bow is held. An act of deep Confucian respect.",
    defaultOffsetDays: 0,
  },
  {
    key: "korean_parents_blessing",
    label: "Parents' blessing & wine",
    detail: "Parents return one bow, offer advice, and pour ceremonial wine for the couple to share.",
    defaultOffsetDays: 0,
  },
  {
    key: "korean_jujube_tossing",
    label: "Jujube and date tossing",
    detail: "Parents toss fruit; bride catches in her skirt. Said to predict the number of children. Joyful — allow laughter and time.",
    defaultOffsetDays: 0,
  },
  {
    key: "korean_paebaek_photos",
    label: "Family photos in hanbok",
    detail: "Photos with both families after the Paebaek concludes.",
    defaultOffsetDays: 0,
  },
];

export const TRADITIONS: Tradition[] = [
  { key: "catholic", label: "Catholic", coverage: "documented", ceremonies: CATHOLIC },
  {
    key: "protestant",
    label: "Protestant",
    coverage: "partial",
    partialNote:
      "Denomination shapes the ceremony — Baptist, Methodist, Episcopal, Lutheran, Pentecostal, Quaker all differ. Add your specifics below.",
    ceremonies: PROTESTANT,
  },
  { key: "greek_orthodox", label: "Greek Orthodox", coverage: "documented", ceremonies: GREEK_ORTHODOX },
  {
    key: "jewish",
    label: "Jewish",
    coverage: "documented",
    partialNote:
      "Default leans Ashkenazi. Sephardi, Mizrahi, Persian, Yemenite, Bukharian, and Moroccan practices vary structurally — add your tradition's specifics.",
    ceremonies: JEWISH,
  },
  {
    key: "hindu",
    label: "Hindu",
    coverage: "documented",
    partialNote:
      "Default sequence is North Indian. Tamil, Telugu, Kannada, Malayali, Bengali, and Punjabi traditions differ — particularly the Mangalsutra/Saptapadi order. Edit the sequence to fit your family.",
    ceremonies: HINDU,
  },
  {
    key: "islamic",
    label: "Islamic (Nikah)",
    coverage: "documented",
    partialNote:
      "Sunni vs Shia, school of jurisprudence (Hanafi, Maliki, Shafi'i, Hanbali, Ja'fari), and cultural background (Pakistani, Arab, West African, Turkish, Indonesian, Iranian) all shape the ceremony.",
    ceremonies: ISLAMIC,
  },
  { key: "sikh", label: "Sikh (Anand Karaj)", coverage: "documented", ceremonies: SIKH },
  {
    key: "chinese",
    label: "Chinese",
    coverage: "documented",
    partialNote:
      "Cantonese, Hokkien, Hakka, Teochew, and Northern Mandarin practices differ. The diaspora adds further variation.",
    ceremonies: CHINESE,
  },
  {
    key: "nigerian",
    label: "Nigerian",
    coverage: "documented",
    partialNote:
      "Default leans Yoruba. Igbo (Igba Nkwu) and Hausa (Kamu) traditions have distinct rituals — add your family's specifics.",
    ceremonies: NIGERIAN,
  },
  { key: "ethiopian", label: "Ethiopian / Habesha", coverage: "documented", ceremonies: ETHIOPIAN },
  { key: "mexican", label: "Mexican", coverage: "documented", ceremonies: MEXICAN },
  { key: "japanese", label: "Japanese", coverage: "documented", ceremonies: JAPANESE },
  { key: "korean", label: "Korean", coverage: "documented", ceremonies: KOREAN },
];

export function findTradition(key: string): Tradition | undefined {
  return TRADITIONS.find((t) => t.key === key);
}

export function findCeremony(traditionKey: string, ceremonyKey: string): Ceremony | undefined {
  return findTradition(traditionKey)?.ceremonies.find((c) => c.key === ceremonyKey);
}

/**
 * Order traditions for the picker: event's own subtype first (if it matches a
 * tradition key), then the rest in their natural order. Lets blended-family
 * Orgnzs see their primary cultures up front while keeping the full library
 * one tap away.
 */
export function orderTraditionsForSubtype(subtypeKey: string | null): Tradition[] {
  if (!subtypeKey) return TRADITIONS;
  const primary = TRADITIONS.find((t) => t.key === subtypeKey);
  if (!primary) return TRADITIONS;
  const rest = TRADITIONS.filter((t) => t.key !== subtypeKey);
  return [primary, ...rest];
}
