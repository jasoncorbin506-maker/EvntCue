/**
 * DFW neighborhood catalog for the Vndr Stage 2 service-area multi-select.
 *
 * Source: 02_Locked_Prototypes/Vndr/evntcue_vndr_freemium_v1.html lines
 * 916-931 (areas-grid). Fifteen anchor neighborhoods covering metro Dallas,
 * Fort Worth, and the inner suburb ring. Vendors who don't see their area
 * use the "+ We're missing somewhere" escape (handled in the UI; persists
 * as a free-text note for now — staff curation pass adds new chips as the
 * DFW coverage map fills in).
 *
 * Stored on vendors.service_zips as TEXT[]. Despite the column name we
 * persist the slug here (e.g., "park-cities"), not literal zip codes — the
 * neighborhood-vs-zip naming compromise was inherited from the Venu schema
 * for now; Phase 5+ may add a real zip mapping for distance math. Service
 * area + zip catalog work is queued post-launch.
 */

export type DfwNeighborhood = {
  slug: string;
  labelEn: string;
  labelEs: string;
};

export const DFW_NEIGHBORHOODS: readonly DfwNeighborhood[] = [
  { slug: "downtown-dallas", labelEn: "Downtown Dallas", labelEs: "Centro de Dallas" },
  { slug: "uptown", labelEn: "Uptown", labelEs: "Uptown" },
  { slug: "bishop-arts", labelEn: "Bishop Arts", labelEs: "Bishop Arts" },
  { slug: "deep-ellum", labelEn: "Deep Ellum", labelEs: "Deep Ellum" },
  { slug: "oak-cliff", labelEn: "Oak Cliff", labelEs: "Oak Cliff" },
  { slug: "park-cities", labelEn: "Park Cities / HP", labelEs: "Park Cities / HP" },
  { slug: "plano", labelEn: "Plano", labelEs: "Plano" },
  { slug: "frisco", labelEn: "Frisco", labelEs: "Frisco" },
  { slug: "mckinney", labelEn: "McKinney", labelEs: "McKinney" },
  { slug: "fort-worth", labelEn: "Fort Worth", labelEs: "Fort Worth" },
  { slug: "arlington", labelEn: "Arlington", labelEs: "Arlington" },
  { slug: "grapevine", labelEn: "Grapevine / Southlake", labelEs: "Grapevine / Southlake" },
  { slug: "denton", labelEn: "Denton", labelEs: "Denton" },
  { slug: "addison", labelEn: "Addison / Carrollton", labelEs: "Addison / Carrollton" },
  { slug: "irving", labelEn: "Irving / Las Colinas", labelEs: "Irving / Las Colinas" },
] as const;

export const DFW_NEIGHBORHOOD_SLUGS: readonly string[] = DFW_NEIGHBORHOODS.map(
  (n) => n.slug,
);

export function isDfwNeighborhoodSlug(value: unknown): value is string {
  return typeof value === "string" && DFW_NEIGHBORHOOD_SLUGS.includes(value);
}

export function dfwNeighborhoodLabel(
  slug: string,
  locale: "en" | "es",
): string {
  const entry = DFW_NEIGHBORHOODS.find((n) => n.slug === slug);
  if (!entry) return slug;
  return locale === "es" ? entry.labelEs : entry.labelEn;
}
