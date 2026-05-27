/**
 * lib/labels/event-subtypes.ts
 *
 * `events.event_subtype` (TEXT column per migration 021) → UI display string.
 *
 * The DB column is TEXT, not an enum — migration 021 deliberately chose TEXT
 * because subtype keys evolve faster than enum migrations should run. The
 * canonical key list lives in `data/budget-presets.ts`; this module wraps it
 * with locale-aware accessors per Lock 15 (DB / canonical keys → locale-aware
 * UI strings).
 *
 * EN labels mirror `data/budget-presets.ts`. ES labels carry DFW-Hispanic
 * register per Lock 14b — dignified Spanish where cultural specificity exists,
 * with English-loanword retention for terms that DFW Latino communities
 * commonly use in English ("Sweet 16", "Baby Shower").
 *
 * PARKING_LOT #41.
 */

import type { Locale } from "@/i18n/locale";

const EN_LABELS: Record<string, string> = {
  // Wedding subtypes
  civil: "Civil / non-religious",
  multicultural: "Multicultural / blended",
  catholic: "Catholic",
  protestant: "Protestant",
  greek_orthodox: "Greek Orthodox",
  jewish: "Jewish",
  hindu: "Hindu",
  islamic: "Islamic (Nikah)",
  sikh: "Sikh (Anand Karaj)",
  chinese: "Chinese",
  korean: "Korean",
  japanese: "Japanese",
  mexican: "Mexican",
  nigerian: "Nigerian",
  ethiopian: "Ethiopian / Habesha",
  // Corporate subtypes
  conference: "Conference / Summit",
  trade_show: "Trade Show / Exhibition",
  corporate_gala: "Corporate Gala / Awards",
  holiday_party: "Holiday Party",
  meeting: "Meeting / Offsite / Retreat",
  product_launch: "Product Launch",
  // Nonprofit subtypes
  annual_gala: "Annual Gala",
  auction: "Auction Event",
  walk_run: "Walk / Run / P2P",
  donor_appreciation: "Donor Appreciation",
  awareness: "Awareness / Advocacy",
  // Public / cultural subtypes
  festival: "Festival / Multi-day",
  concert: "Concert / Performance",
  religious: "Religious Observance",
  cultural_show: "Cultural Showcase",
  civic: "Civic Ceremony / Dedication",
  community: "Community Gathering",
  // Social subtypes
  quinceanera: "Quinceañera",
  bar_bat_mitzvah: "Bar / Bat Mitzvah",
  sweet_16: "Sweet 16",
  milestone_birthday: "Milestone Birthday",
  anniversary: "Anniversary",
  baby_shower: "Baby Shower",
  bridal_shower: "Bridal Shower",
  graduation: "Graduation Party",
  reunion: "Reunion",
};

const ES_LABELS: Record<string, string> = {
  // Wedding subtypes
  civil: "Civil / no religiosa",
  multicultural: "Multicultural / mixta",
  catholic: "Católica",
  protestant: "Protestante",
  greek_orthodox: "Ortodoxa griega",
  jewish: "Judía",
  hindu: "Hindú",
  islamic: "Islámica (Nikah)",
  sikh: "Sij (Anand Karaj)",
  chinese: "China",
  korean: "Coreana",
  japanese: "Japonesa",
  mexican: "Mexicana",
  nigerian: "Nigeriana",
  ethiopian: "Etíope / Habesha",
  // Corporate subtypes
  conference: "Conferencia / Cumbre",
  trade_show: "Feria comercial / Exhibición",
  corporate_gala: "Gala corporativa / Premios",
  holiday_party: "Fiesta de fin de año",
  meeting: "Reunión / Retiro corporativo",
  product_launch: "Lanzamiento de producto",
  // Nonprofit subtypes
  annual_gala: "Gala anual",
  auction: "Subasta",
  walk_run: "Caminata / Carrera",
  donor_appreciation: "Apreciación de donantes",
  awareness: "Concientización / Defensa",
  // Public / cultural subtypes
  festival: "Festival / Multi-día",
  concert: "Concierto / Espectáculo",
  religious: "Celebración religiosa",
  cultural_show: "Exhibición cultural",
  civic: "Ceremonia cívica / Inauguración",
  community: "Reunión comunitaria",
  // Social subtypes — Sweet 16 / Baby Shower retain English per DFW-Hispanic
  // colloquial usage; per Lock 14b cultural-intelligence register.
  quinceanera: "Quinceañera",
  bar_bat_mitzvah: "Bar / Bat Mitzvá",
  sweet_16: "Sweet 16",
  milestone_birthday: "Cumpleaños importante",
  anniversary: "Aniversario",
  baby_shower: "Baby Shower",
  bridal_shower: "Despedida de soltera",
  graduation: "Fiesta de graduación",
  reunion: "Reunión",
};

/**
 * Map an event_subtype key (TEXT column value) to its display string.
 * Falls back to the raw key if unrecognized — keeps UI rendering safe when
 * `data/budget-presets.ts` adds a new key before this map is updated.
 */
export function eventSubtypeLabel(
  key: string | null | undefined,
  locale: Locale,
): string {
  if (!key) return "";
  const table = locale === "es" ? ES_LABELS : EN_LABELS;
  return table[key] ?? EN_LABELS[key] ?? key;
}
