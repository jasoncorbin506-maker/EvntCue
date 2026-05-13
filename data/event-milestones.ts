/**
 * Subtype-specific milestone timelines for the event-preview horizontal strip
 * and the Orgnz dashboard rail.
 *
 * Wedding cultural milestones: research-backed from
 *   03_Research/CUE_Training_Wedding_Traditions_Module3_v1.1.md
 *
 * Corporate / Non-Profit / Public-Cultural / Social milestones: industry-standard
 * (master spec §26 + Cvent / Northstar / Eventbrite benchmarks). No dedicated
 * research doc yet — refine when one exists.
 *
 * `lead` = months before the event when the milestone is typically due.
 *   (0 = day-of; 0.25 = day before; 0.5 = a few days before; etc.)
 *
 * `key` = stable identifier used by:
 *   - events.milestone_overrides JSONB (status / custom_date / custom_time
 *     overrides keyed by milestone_key — see migration 024)
 *   - the cultural picker (data/cultural-traditions.ts) which shares keys for
 *     overlapping ceremonies so the picker can show "already on your timeline"
 *     instead of duplicating
 *
 * Key conventions:
 *   - Cultural tradition keys: `<tradition>_<slug>` (e.g., catholic_pre_cana,
 *     hindu_sangeet) — these may be reused across subtypes (a Mexican Catholic
 *     wedding's pre-Cana shares the catholic_pre_cana key)
 *   - Universal wedding-logistics keys: `wedding_<slug>` (wedding_save_the_dates)
 *   - Non-wedding category keys: `<category>_<subtype>_<slug>` (corporate_
 *     conference_speaker_confirmations)
 */

import type { CategoryKey } from "./budget-presets";

export type MilestoneStatus = "now" | "next" | "open" | "done";

export type Milestone = {
  key: string;
  label: string;
  detail?: string;
  lead: number; // months before event
};

export type MilestoneWithStatus = Milestone & { status: MilestoneStatus };

const WEDDING: Record<string, Milestone[]> = {
  catholic: [
    { key: "wedding_engagement", label: "Engagement", lead: 12, detail: "Set date with parish + family" },
    { key: "catholic_pre_cana", label: "Pre-Cana", lead: 9, detail: "6mo–1yr Church marriage prep program" },
    { key: "catholic_paperwork", label: "Paperwork", lead: 6, detail: "Baptismal, confirmation, freedom-to-marry" },
    { key: "wedding_save_the_dates", label: "Save-the-dates", lead: 6 },
    { key: "wedding_vendor_lock", label: "Vendor lock", lead: 4, detail: "Photo, florals, music" },
    { key: "wedding_invitations", label: "Invitations", lead: 2 },
    { key: "catholic_rehearsal", label: "Rehearsal", lead: 0.03, detail: "Evening before; priest leads" },
    { key: "catholic_wedding_day", label: "Wedding day", lead: 0, detail: "Nuptial Mass + reception" },
  ],
  protestant: [
    { key: "wedding_engagement", label: "Engagement", lead: 12 },
    { key: "protestant_premarital_counseling", label: "Premarital counseling", lead: 8, detail: "Pastor-led, varies by denomination" },
    { key: "wedding_save_the_dates", label: "Save-the-dates", lead: 6 },
    { key: "wedding_vendor_lock", label: "Vendor lock", lead: 4 },
    { key: "wedding_invitations", label: "Invitations", lead: 2 },
    { key: "protestant_rehearsal", label: "Rehearsal", lead: 0.03 },
    { key: "protestant_wedding_day", label: "Wedding day", lead: 0 },
  ],
  greek_orthodox: [
    { key: "wedding_engagement", label: "Engagement", lead: 12 },
    { key: "greek_orthodox_cathedral_membership", label: "Cathedral membership", lead: 10, detail: "One party member in good standing" },
    { key: "greek_orthodox_marriage_seminar", label: "Marriage Seminar", lead: 8, detail: "Held 3x/year — register early" },
    { key: "greek_orthodox_premarital_counseling", label: "Pre-marital counseling", lead: 6, detail: "Two sessions required" },
    { key: "wedding_save_the_dates", label: "Save-the-dates", lead: 6 },
    { key: "wedding_vendor_lock", label: "Vendor lock", lead: 4 },
    { key: "wedding_invitations", label: "Invitations", lead: 2 },
    { key: "greek_orthodox_wedding_day", label: "Wedding day", lead: 0, detail: "Crowning + Kalamatiano reception" },
  ],
  jewish: [
    { key: "wedding_engagement", label: "Engagement", lead: 12 },
    { key: "jewish_tenaim", label: "Tenaim", lead: 9, detail: "Formal engagement document" },
    { key: "wedding_vendor_lock", label: "Vendor lock", lead: 6, detail: "Kosher catering specialty" },
    { key: "jewish_aufruf", label: "Aufruf", lead: 0.5, detail: "Sabbath blessing before wedding" },
    { key: "jewish_sheva_brachot_list", label: "Sheva Brachot list", lead: 0.5, detail: "Confirm 7 honorees 2 weeks out" },
    { key: "jewish_bedeken_ketubah", label: "Bedeken + Ketubah signing", lead: 0, detail: "Day-of, before ceremony" },
    { key: "jewish_chuppah_ceremony", label: "Chuppah ceremony", lead: 0 },
  ],
  hindu: [
    { key: "hindu_roka_engagement", label: "Roka / Engagement", lead: 15 },
    { key: "wedding_save_the_dates", label: "Save-the-dates", lead: 9 },
    { key: "hindu_mandap_decor_lock", label: "Mandap + decor lock", lead: 6, detail: "Specialty mandap rentals book early" },
    { key: "hindu_sangeet_mehndi_planning", label: "Sangeet + Mehndi planning", lead: 6 },
    { key: "hindu_mehndi", label: "Mehndi night", lead: 0.07, detail: "Evening before — henna for bride" },
    { key: "hindu_sangeet", label: "Sangeet night", lead: 0.07, detail: "Music + dance celebration" },
    { key: "hindu_baraat", label: "Baraat", lead: 0, detail: "Groom's procession, often on horseback" },
    { key: "hindu_ceremony_reception", label: "Ceremony + reception", lead: 0, detail: "Saptapadi, mandap, banquet" },
  ],
  islamic: [
    { key: "wedding_engagement", label: "Engagement", lead: 6 },
    { key: "islamic_mahr_negotiation", label: "Mahr negotiation", lead: 4, detail: "Marriage gift agreement" },
    { key: "wedding_vendor_lock", label: "Vendor lock", lead: 3 },
    { key: "islamic_pre_wedding_gathering", label: "Pre-wedding gathering", lead: 0.5 },
    { key: "islamic_nikah_ceremony", label: "Nikah ceremony", lead: 0 },
    { key: "islamic_walima", label: "Walima reception", lead: 0 },
  ],
  sikh: [
    { key: "sikh_engagement_roka", label: "Engagement / Roka", lead: 9 },
    { key: "sikh_gurdwara_booking", label: "Gurdwara booking", lead: 6 },
    { key: "wedding_vendor_lock", label: "Vendor lock", lead: 4 },
    { key: "sikh_pre_wedding_gathering", label: "Pre-wedding gathering", lead: 0.5 },
    { key: "sikh_anand_karaj", label: "Anand Karaj ceremony", lead: 0, detail: "At Gurdwara, head covering required" },
    { key: "sikh_langar", label: "Langar community meal", lead: 0, detail: "Open to all guests" },
    { key: "sikh_reception", label: "Reception", lead: 0 },
  ],
  chinese: [
    { key: "wedding_engagement", label: "Engagement", lead: 9 },
    { key: "chinese_guo_da_li", label: "Guo Da Li / Betrothal", lead: 6, detail: "Formal gift presentation" },
    { key: "chinese_banquet_venue_lock", label: "Banquet venue lock", lead: 6, detail: "8–12 course capacity required" },
    { key: "chinese_wedding_photos", label: "Wedding photos", lead: 3, detail: "Pre-wedding shoot is standard" },
    { key: "chinese_tea_ceremony_grooms", label: "Tea ceremony", lead: 0.07, detail: "Morning of wedding day" },
    { key: "chinese_banquet", label: "Banquet", lead: 0, detail: "8 to 12 courses, each symbolic" },
  ],
  nigerian: [
    { key: "wedding_engagement", label: "Engagement", lead: 12 },
    { key: "nigerian_introduction_family_meeting", label: "Introduction / family meeting", lead: 9 },
    { key: "nigerian_aso_oke_procurement", label: "Aso-oke fabric procurement", lead: 6, detail: "Often Houston-sourced for DFW couples" },
    { key: "wedding_vendor_lock", label: "Vendor lock", lead: 4 },
    { key: "nigerian_traditional_wedding_day", label: "Traditional wedding day", lead: 0, detail: "Day 1 — Yoruba/Igbo/Hausa rites" },
    { key: "nigerian_church_wedding", label: "Church or court wedding", lead: 0, detail: "Day 2 — followed by reception" },
  ],
  ethiopian: [
    { key: "wedding_engagement", label: "Engagement", lead: 9 },
    { key: "ethiopian_community_catering_plan", label: "Community-catered planning", lead: 6, detail: "Family network handles food" },
    { key: "wedding_vendor_lock", label: "Vendor lock", lead: 4 },
    { key: "ethiopian_geez_liturgy", label: "Ge'ez liturgy", lead: 0, detail: "60–90 min, led by Qes (priest)" },
    { key: "ethiopian_reception", label: "Reception", lead: 0 },
  ],
  mexican: [
    { key: "wedding_engagement", label: "Engagement", lead: 9 },
    { key: "mexican_padrinos_confirmed", label: "Padrinos confirmed", lead: 6, detail: "Sponsors for tiara, cake, dress, etc." },
    { key: "catholic_pre_cana", label: "Pre-Cana (if Catholic)", lead: 6 },
    { key: "mexican_mariachi_confirmed", label: "Mariachi confirmed", lead: 4 },
    { key: "wedding_vendor_lock", label: "Vendor lock", lead: 4 },
    { key: "mexican_hora_loca_prep", label: "Hora Loca prep", lead: 2, detail: "Costumes, props, surprise entertainment" },
    { key: "mexican_ceremony", label: "Ceremony", lead: 0, detail: "Often Catholic Mass" },
    { key: "mexican_reception", label: "Reception", lead: 0, detail: "Hora Loca mid-reception" },
  ],
  japanese: [
    { key: "wedding_engagement", label: "Engagement", lead: 6 },
    { key: "japanese_yui_no", label: "Yui-no", lead: 4, detail: "Formal engagement gift exchange" },
    { key: "japanese_attire_fitting", label: "Attire fitting", lead: 3, detail: "Shinto or Western, sometimes both" },
    { key: "wedding_vendor_lock", label: "Vendor lock", lead: 3 },
    { key: "japanese_ceremony", label: "Ceremony", lead: 0, detail: "Shinto shrine or Western chapel" },
    { key: "japanese_reception", label: "Reception", lead: 0, detail: "Precisely timed, formal speeches" },
  ],
  korean: [
    { key: "wedding_engagement", label: "Engagement", lead: 6 },
    { key: "korean_church_venue_lock", label: "Carrollton church + venue lock", lead: 5, detail: "Korean community referral network" },
    { key: "korean_hanbok_fitting", label: "Hanbok fitting", lead: 4 },
    { key: "wedding_vendor_lock", label: "Vendor lock", lead: 3 },
    { key: "korean_wedding_ceremony", label: "Wedding ceremony", lead: 0 },
    { key: "korean_paebaek", label: "Paebaek", lead: 0.04, detail: "Traditional bowing to family elders" },
    { key: "korean_reception", label: "Reception", lead: 0 },
  ],
  civil: [
    { key: "wedding_engagement", label: "Engagement", lead: 3 },
    { key: "civil_marriage_license", label: "Marriage license", lead: 0.5 },
    { key: "civil_ceremony", label: "Ceremony", lead: 0, detail: "Courthouse or venue" },
    { key: "civil_optional_reception", label: "Optional reception", lead: 0 },
  ],
  multicultural: [
    { key: "wedding_engagement", label: "Engagement", lead: 12 },
    { key: "multicultural_tradition_mapping", label: "Two-tradition mapping", lead: 10, detail: "Cue helps blend ceremony elements" },
    { key: "wedding_vendor_lock", label: "Vendor lock", lead: 5, detail: "Cultural specialty vendors fill early" },
    { key: "wedding_invitations", label: "Invitations", lead: 2 },
    { key: "multicultural_ceremony", label: "Ceremony", lead: 0 },
    { key: "multicultural_reception", label: "Reception", lead: 0 },
  ],
};

const SOCIAL: Record<string, Milestone[]> = {
  quinceanera: [
    { key: "social_quinceanera_planning", label: "Planning", lead: 12 },
    { key: "social_quinceanera_court_of_honor", label: "Court of Honor", lead: 9, detail: "Chambelanes & damas — 14 typical" },
    { key: "social_quinceanera_padrinos", label: "Padrinos confirmed", lead: 8, detail: "Sponsors offset budget per master spec §46" },
    { key: "social_quinceanera_choreography", label: "Choreography rehearsals", lead: 4 },
    { key: "social_quinceanera_fittings", label: "Final fittings", lead: 1 },
    { key: "social_quinceanera_ceremony", label: "Mass / ceremony", lead: 0 },
    { key: "social_quinceanera_reception", label: "Reception with Hora Loca", lead: 0 },
  ],
  bar_bat_mitzvah: [
    { key: "social_bar_bat_mitzvah_date", label: "Date locked", lead: 18, detail: "Tied to child's bar/bat mitzvah age" },
    { key: "social_bar_bat_mitzvah_tutoring", label: "Hebrew tutoring begins", lead: 12 },
    { key: "social_bar_bat_mitzvah_venue", label: "Synagogue + venue lock", lead: 12 },
    { key: "social_bar_bat_mitzvah_vendor_lock", label: "Vendor lock", lead: 6 },
    { key: "social_bar_bat_mitzvah_torah_portion", label: "Torah portion mastered", lead: 3 },
    { key: "social_bar_bat_mitzvah_practice", label: "Final practice", lead: 0.5 },
    { key: "social_bar_bat_mitzvah_ceremony", label: "Ceremony", lead: 0 },
    { key: "social_bar_bat_mitzvah_reception", label: "Reception", lead: 0 },
  ],
  sweet_16: [
    { key: "social_sweet_16_planning", label: "Planning", lead: 4 },
    { key: "social_sweet_16_venue", label: "Venue + theme lock", lead: 3 },
    { key: "social_sweet_16_vendor_lock", label: "Vendor lock", lead: 2 },
    { key: "social_sweet_16_invitations", label: "Invitations", lead: 1.5 },
    { key: "social_sweet_16_day_of", label: "Day-of", lead: 0 },
  ],
  milestone_birthday: [
    { key: "social_milestone_birthday_planning", label: "Planning", lead: 3 },
    { key: "social_milestone_birthday_venue", label: "Venue + theme lock", lead: 2 },
    { key: "social_milestone_birthday_invitations", label: "Invitations", lead: 1.5 },
    { key: "social_milestone_birthday_vendor_lock", label: "Vendor lock", lead: 1 },
    { key: "social_milestone_birthday_day_of", label: "Day-of", lead: 0 },
  ],
  anniversary: [
    { key: "social_anniversary_planning", label: "Planning", lead: 3 },
    { key: "social_anniversary_venue", label: "Venue lock", lead: 2 },
    { key: "social_anniversary_invitations", label: "Invitations", lead: 1.5 },
    { key: "social_anniversary_day_of", label: "Day-of", lead: 0 },
  ],
  baby_shower: [
    { key: "social_baby_shower_planning", label: "Planning", lead: 1.5 },
    { key: "social_baby_shower_venue", label: "Venue lock", lead: 1 },
    { key: "social_baby_shower_invitations", label: "Invitations", lead: 0.5 },
    { key: "social_baby_shower_day_of", label: "Day-of", lead: 0 },
  ],
  bridal_shower: [
    { key: "social_bridal_shower_planning", label: "Planning", lead: 2 },
    { key: "social_bridal_shower_venue", label: "Venue lock", lead: 1.5 },
    { key: "social_bridal_shower_invitations", label: "Invitations", lead: 1 },
    { key: "social_bridal_shower_day_of", label: "Day-of", lead: 0 },
  ],
  graduation: [
    { key: "social_graduation_date", label: "Date set", lead: 1.5 },
    { key: "social_graduation_venue", label: "Venue lock", lead: 1 },
    { key: "social_graduation_invitations", label: "Invitations", lead: 0.5 },
    { key: "social_graduation_day_of", label: "Day-of", lead: 0 },
  ],
  reunion: [
    { key: "social_reunion_planning", label: "Planning", lead: 9 },
    { key: "social_reunion_save_dates", label: "Save-the-dates", lead: 6 },
    { key: "social_reunion_venue", label: "Venue lock", lead: 5 },
    { key: "social_reunion_catering", label: "Catering lock", lead: 3 },
    { key: "social_reunion_day_of", label: "Day-of", lead: 0 },
  ],
};

const CORPORATE: Record<string, Milestone[]> = {
  conference: [
    { key: "corporate_conference_venue", label: "Date + venue lock", lead: 12 },
    { key: "corporate_conference_speakers", label: "Speaker confirmations", lead: 9 },
    { key: "corporate_conference_sponsors", label: "Sponsor sales", lead: 6 },
    { key: "corporate_conference_registration", label: "Registration opens", lead: 4 },
    { key: "corporate_conference_marketing", label: "Marketing push", lead: 2 },
    { key: "corporate_conference_day_of", label: "Day-of", lead: 0 },
  ],
  trade_show: [
    { key: "corporate_trade_show_venue", label: "Date + venue lock", lead: 12 },
    { key: "corporate_trade_show_exhibitors", label: "Exhibitor sales", lead: 9 },
    { key: "corporate_trade_show_floor_plan", label: "Floor plan finalized", lead: 6 },
    { key: "corporate_trade_show_marketing", label: "Marketing", lead: 3 },
    { key: "corporate_trade_show_day_of", label: "Show day", lead: 0 },
  ],
  corporate_gala: [
    { key: "corporate_gala_venue", label: "Date + venue lock", lead: 6 },
    { key: "corporate_gala_nominees", label: "Award nominees", lead: 4 },
    { key: "corporate_gala_sponsors", label: "Sponsor sales", lead: 3 },
    { key: "corporate_gala_invitations", label: "Invitations", lead: 2 },
    { key: "corporate_gala_day_of", label: "Gala", lead: 0 },
  ],
  holiday_party: [
    { key: "corporate_holiday_party_venue", label: "Date + venue lock", lead: 4 },
    { key: "corporate_holiday_party_vendor_lock", label: "Vendor lock", lead: 3 },
    { key: "corporate_holiday_party_invitations", label: "Invitations", lead: 1.5 },
    { key: "corporate_holiday_party_day_of", label: "Day-of", lead: 0 },
  ],
  meeting: [
    { key: "corporate_meeting_venue", label: "Date + venue lock", lead: 2 },
    { key: "corporate_meeting_travel", label: "Travel + lodging", lead: 1 },
    { key: "corporate_meeting_day_of", label: "Day-of", lead: 0 },
  ],
  product_launch: [
    { key: "corporate_product_launch_venue", label: "Venue + date lock", lead: 4 },
    { key: "corporate_product_launch_press", label: "Press list", lead: 3 },
    { key: "corporate_product_launch_ros", label: "Run of show finalized", lead: 1 },
    { key: "corporate_product_launch_day_of", label: "Day-of", lead: 0 },
  ],
};

const NONPROFIT: Record<string, Milestone[]> = {
  annual_gala: [
    { key: "nonprofit_annual_gala_venue", label: "Date + venue lock", lead: 9 },
    { key: "nonprofit_annual_gala_honoree", label: "Honoree confirmed", lead: 6 },
    { key: "nonprofit_annual_gala_sponsors", label: "Sponsor sales", lead: 6 },
    { key: "nonprofit_annual_gala_auction", label: "Auction items secured", lead: 3 },
    { key: "nonprofit_annual_gala_invitations", label: "Invitations", lead: 2 },
    { key: "nonprofit_annual_gala_day_of", label: "Gala", lead: 0 },
  ],
  auction: [
    { key: "nonprofit_auction_venue", label: "Date + venue", lead: 6 },
    { key: "nonprofit_auction_items", label: "Auction items", lead: 4 },
    { key: "nonprofit_auction_software", label: "Auction software setup", lead: 3 },
    { key: "nonprofit_auction_invitations", label: "Invitations", lead: 2 },
    { key: "nonprofit_auction_day_of", label: "Day-of", lead: 0 },
  ],
  walk_run: [
    { key: "nonprofit_walk_run_course", label: "Date + course", lead: 6 },
    { key: "nonprofit_walk_run_permits", label: "Permits", lead: 5 },
    { key: "nonprofit_walk_run_sponsors", label: "Sponsor sales", lead: 4 },
    { key: "nonprofit_walk_run_p2p", label: "P2P platform launch", lead: 3 },
    { key: "nonprofit_walk_run_marketing", label: "Marketing push", lead: 1 },
    { key: "nonprofit_walk_run_day_of", label: "Race day", lead: 0 },
  ],
  donor_appreciation: [
    { key: "nonprofit_donor_appreciation_venue", label: "Venue + date", lead: 3 },
    { key: "nonprofit_donor_appreciation_guests", label: "Guest list", lead: 2 },
    { key: "nonprofit_donor_appreciation_invitations", label: "Invitations", lead: 1 },
    { key: "nonprofit_donor_appreciation_day_of", label: "Dinner", lead: 0 },
  ],
  awareness: [
    { key: "nonprofit_awareness_venue", label: "Date + venue", lead: 2 },
    { key: "nonprofit_awareness_speakers", label: "Speaker confirmations", lead: 1.5 },
    { key: "nonprofit_awareness_marketing", label: "Marketing", lead: 1 },
    { key: "nonprofit_awareness_day_of", label: "Event", lead: 0 },
  ],
};

const PUBLIC_CULTURAL: Record<string, Milestone[]> = {
  festival: [
    { key: "public_festival_venue", label: "Date + venue", lead: 12 },
    { key: "public_festival_permits", label: "Permits", lead: 10 },
    { key: "public_festival_lineup", label: "Lineup booked", lead: 8 },
    { key: "public_festival_sponsors", label: "Sponsor sales", lead: 6 },
    { key: "public_festival_tickets", label: "Ticket sales open", lead: 4 },
    { key: "public_festival_marketing", label: "Marketing push", lead: 2 },
    { key: "public_festival_day_of", label: "Festival day", lead: 0 },
  ],
  concert: [
    { key: "public_concert_venue", label: "Date + venue", lead: 6 },
    { key: "public_concert_talent", label: "Talent confirmed", lead: 5 },
    { key: "public_concert_production", label: "Production team", lead: 3 },
    { key: "public_concert_tickets", label: "Ticket sales", lead: 2 },
    { key: "public_concert_show", label: "Show", lead: 0 },
  ],
  religious: [
    { key: "public_religious_venue", label: "Date + venue", lead: 3 },
    { key: "public_religious_programs", label: "Programs printed", lead: 1 },
    { key: "public_religious_day_of", label: "Day-of", lead: 0 },
  ],
  cultural_show: [
    { key: "public_cultural_show_venue", label: "Date + venue", lead: 4 },
    { key: "public_cultural_show_performers", label: "Performers confirmed", lead: 3 },
    { key: "public_cultural_show_marketing", label: "Marketing", lead: 1.5 },
    { key: "public_cultural_show_day_of", label: "Showcase day", lead: 0 },
  ],
  civic: [
    { key: "public_civic_date", label: "Date set", lead: 2 },
    { key: "public_civic_speakers", label: "Speaker confirmations", lead: 1 },
    { key: "public_civic_programs", label: "Programs", lead: 0.5 },
    { key: "public_civic_ceremony", label: "Ceremony", lead: 0 },
  ],
  community: [
    { key: "public_community_permits", label: "Date + permits", lead: 2 },
    { key: "public_community_volunteers", label: "Volunteer recruitment", lead: 1 },
    { key: "public_community_day_of", label: "Day-of", lead: 0 },
  ],
};

const BY_CATEGORY: Record<CategoryKey, Record<string, Milestone[]>> = {
  wedding: WEDDING,
  social: SOCIAL,
  corporate: CORPORATE,
  nonprofit: NONPROFIT,
  public: PUBLIC_CULTURAL,
};

/**
 * Universal wedding planning milestones — overlaid on top of the cultural
 * subtype list so the rail shows the COMPLETE picture: cultural tradition
 * checkpoints (Tenaim, Aufruf, Sangeet, Pre-Cana, etc.) AND the logistical /
 * vendor-activity milestones (mood board, vendor lock, tastings, walkthrough,
 * fittings, RSVP cutoff, rehearsal). Without this overlay the rail under-tells
 * the story: every wedding regardless of tradition runs these planning beats.
 *
 * Merge strategy: cultural list wins on key collisions (since it carries the
 * cultural detail). Universal items that don't collide get added.
 */
const WEDDING_CORE: Milestone[] = [
  { key: "wedding_save_the_dates", label: "Save-the-dates", lead: 6 },
  { key: "wedding_mood_board_lock", label: "Mood board lock", lead: 5, detail: "Cue extracts palettes from your images" },
  { key: "wedding_vendor_lock", label: "Vendor lock", lead: 4, detail: "Photo · florals · music · baker" },
  { key: "wedding_engagement_shoot", label: "Engagement shoot", lead: 3, detail: "Photographer · save-the-date imagery" },
  { key: "wedding_cake_tasting", label: "Cake tasting", lead: 3, detail: "Baker selection round" },
  { key: "wedding_catering_tasting", label: "Catering tasting", lead: 3, detail: "Final menu locked" },
  { key: "wedding_invitations", label: "Invitations", lead: 2 },
  { key: "wedding_venue_walkthrough", label: "Venue walkthrough", lead: 1, detail: "Coordinator + photographer site visit" },
  { key: "wedding_final_fittings", label: "Final fittings", lead: 0.5 },
  { key: "wedding_final_guest_count", label: "Final guest count", lead: 0.5, detail: "Catering + seating cutoff" },
  { key: "wedding_hotel_block_opens", label: "Hotel block opens", lead: 0.1, detail: "Out-of-town guests check in" },
  { key: "wedding_rehearsal", label: "Rehearsal", lead: 0.03 },
  { key: "wedding_rehearsal_dinner", label: "Rehearsal dinner", lead: 0.03 },
];

function mergeWeddingMilestones(cultural: Milestone[]): Milestone[] {
  const culturalKeys = new Set(cultural.map((m) => m.key));
  const universalKept = WEDDING_CORE.filter((m) => !culturalKeys.has(m.key));
  return [...universalKept, ...cultural];
}

/**
 * Generic horizon-derived fallback when subtype isn't in the lookup table.
 * Used as a safety net — should be hit only if data is missing.
 */
function genericFallback(): Milestone[] {
  return [
    { key: "fallback_lock_venue", label: "Lock the venue", lead: 6 },
    { key: "fallback_vendor_lock", label: "Vendor lock", lead: 4 },
    { key: "fallback_invitations", label: "Invitations", lead: 2 },
    { key: "fallback_day_of", label: "Day-of", lead: 0 },
  ];
}

function statusFor(milestone: Milestone, userHorizonMonths: number): MilestoneStatus {
  const m = milestone.lead;
  // The user's horizon is "months until event"; the milestone happens m months
  // before the event. Compare horizon to milestone lead to set urgency.
  if (userHorizonMonths <= m) return "now"; // overdue or due now
  if (userHorizonMonths <= m + 2) return "next"; // coming up
  return "open"; // still distant
}

export function getMilestones(
  category: CategoryKey,
  subtypeKey: string | null | undefined,
  userHorizonMonths: number,
): MilestoneWithStatus[] {
  // Wedding category: overlay WEDDING_CORE (universal logistical / vendor /
  // travel milestones) onto the subtype-specific cultural list so the rail
  // shows the complete picture, not just the cultural beats.
  let list: Milestone[];
  if (category === "wedding") {
    const cultural = subtypeKey ? WEDDING[subtypeKey] : undefined;
    list = cultural ? mergeWeddingMilestones(cultural) : [...WEDDING_CORE];
  } else {
    const lookup = subtypeKey ? BY_CATEGORY[category][subtypeKey] : undefined;
    list = lookup ?? genericFallback();
  }
  // Sort ascending by lead (largest lead first → earliest milestone first chronologically)
  const sorted = [...list].sort((a, b) => b.lead - a.lead);
  return sorted.map((m) => ({ ...m, status: statusFor(m, userHorizonMonths) }));
}

export function formatLead(months: number): string {
  if (months === 0) return "Day-of";
  if (months <= 0.07) return "Day before";
  if (months < 0.25) return "Days before";
  if (months < 1) return `${Math.round(months * 4)} weeks before`;
  if (months < 1.5) return "1 mo before";
  if (months >= 12) return `${Math.round(months)} mo before`;
  return `${Math.round(months)} mo before`;
}
