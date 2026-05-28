/**
 * Cert-type display labels + soft-gate metadata — Lock 15 translation layer.
 *
 * Wraps the `cert_type` enum from migration 003 with locale-aware accessors
 * plus the master spec §75 soft-gate framing fields. UI components import
 * from here; never read the enum strings directly for display copy (per the
 * lib/labels README — DB keys speak to engineers, the UI speaks to the
 * customer).
 *
 * Per master spec §75: vendor certs are *discoverability gates*, never hard
 * intake blockers. The `gateType` + `trustReward` fields encode that posture:
 *
 *   - `soft`        — always offered at Stage 4. Upload adds the Verified
 *                     badge + trustReward bump. Never blocks listing.
 *   - `optional`    — offered at Stage 4 if applicable to the vendor's
 *                     discipline. Smaller trust bump. Never blocks.
 *   - `conditional` — surfaces in Stage 4 only when triggerSubTypes match
 *                     ANY of the vendor's selected sub_types (V-1c semantic —
 *                     fires if at least one selected sub-type matches; falls
 *                     back to primary_category when sub_types is empty — see
 *                     Stage 4 reveal logic in app/(public)/vndr-onboarding/[step]/).
 *
 * There is no `hard` gate type — hard certs are Catr territory (migration
 * 010 TABC + SafeTab immutability for alcohol/food caterers). Vndr's posture
 * is explicitly the opposite per the §75 / V-1a intake brief.
 *
 * Enum source of truth: migration 003 cert_type. Stage 4 surfaces the first
 * four values (COI, business_license, tabc, food_handler). plnr_professional
 * is Plnr-portal; health_permit + other are Stage 4 polish + edge cases.
 *
 * Lock 14 amendment (2026-05-23) + Jason 2026-05-28: dessert & bar (Mixologist,
 * Sommelier, Cake designer, Dessert vendor, Coffee cart, Late-night snack) are
 * Catr, not Vndr — a dessert vendor IS a caterer and carries the same legal
 * burden (valid food safety, insurance, and TABC where alcohol applies). That
 * compliance is enforced Catr-side as HARD gates (migration 010 TABC + SafeTab),
 * NOT as Vndr soft gates. No current Vndr sub-type handles food or alcohol, so
 * the conditional tabc / food_handler triggers below are empty for Vndr; the
 * cert entries remain only to document the migration 003 enum.
 */

import type { Locale } from "@/i18n/locale";

export type CertTypeKey =
  | "general_liability_insurance"
  | "food_handler"
  | "tabc"
  | "plnr_professional"
  | "business_license"
  | "health_permit"
  | "other";

export type CertGateType = "soft" | "optional" | "conditional";

export type CertTypeEntry = {
  key: CertTypeKey;
  labelEn: string;
  labelEs: string;
  descEn: string;
  descEs: string;
  tagEn: string;
  tagEs: string;
  gateType: CertGateType;
  trustReward: number;
  // For conditional gates only. Match (ANY-of semantic per V-1c) against
  // vendors.sub_types or fall back to primary_category-based reveal when
  // sub_types is empty. Empty array for non-conditional cert types.
  triggerSubTypes: readonly string[];
};

export const CERT_TYPES: readonly CertTypeEntry[] = [
  {
    key: "general_liability_insurance",
    labelEn: "General liability insurance (COI)",
    labelEs: "Seguro de responsabilidad general (COI)",
    descEn:
      "$1M minimum per occurrence. PDF certificate of insurance. We track the expiry date and remind you before it lapses.",
    descEs:
      "$1M mínimo por ocurrencia. Certificado de seguro en PDF. Llevamos cuenta del vencimiento y te avisamos antes de que caduque.",
    tagEn: "Soft · unlocks Verified",
    tagEs: "Suave · desbloquea Verificado",
    gateType: "soft",
    trustReward: 18,
    triggerSubTypes: [],
  },
  {
    key: "business_license",
    labelEn: "Business license",
    labelEs: "Licencia comercial",
    descEn:
      "If your discipline requires one in Texas. Adds another layer of trust on your public profile.",
    descEs:
      "Si tu disciplina la requiere en Texas. Suma otra capa de confianza en tu perfil público.",
    tagEn: "Optional",
    tagEs: "Opcional",
    gateType: "optional",
    trustReward: 8,
    triggerSubTypes: [],
  },
  {
    key: "tabc",
    labelEn: "TABC certification",
    labelEs: "Certificación TABC",
    descEn:
      "Required for any Vndr serving, pouring, or handling alcohol in Texas. Texas Alcoholic Beverage Commission certification.",
    descEs:
      "Requerido para cualquier Vndr que sirva, vierta o maneje alcohol en Texas. Certificación de la Texas Alcoholic Beverage Commission.",
    tagEn: "Conditional",
    tagEs: "Condicional",
    gateType: "conditional",
    trustReward: 12,
    // Empty for Vndr — Mixologist/Sommelier are Catr sub-types (Lock 14 amendment);
    // alcohol compliance is a Catr hard gate, not a Vndr soft gate.
    triggerSubTypes: [],
  },
  {
    key: "food_handler",
    labelEn: "Food handler certification",
    labelEs: "Certificación de manejo de alimentos",
    descEn:
      "Texas health code applies to any Vndr preparing or serving food. State-approved food handler certificate.",
    descEs:
      "El código de salud de Texas aplica a cualquier Vndr que prepare o sirva alimentos. Certificado estatal de manejo de alimentos.",
    tagEn: "Conditional",
    tagEs: "Condicional",
    gateType: "conditional",
    trustReward: 12,
    // Empty for Vndr — these dessert/bar sub-types moved to Catr (Lock 14
    // amendment); food-safety compliance is a Catr hard gate, not a Vndr soft gate.
    triggerSubTypes: [],
  },
  {
    key: "plnr_professional",
    labelEn: "Plnr professional credential",
    labelEs: "Credencial profesional de Plnr",
    descEn:
      "Plnr-portal credential (CMP, CSEP, or equivalent). Not surfaced in the Vndr Stage 4 funnel.",
    descEs:
      "Credencial del portal Plnr (CMP, CSEP o equivalente). No aparece en el funnel del Stage 4 de Vndr.",
    tagEn: "Plnr",
    tagEs: "Plnr",
    gateType: "optional",
    trustReward: 0,
    triggerSubTypes: [],
  },
  {
    key: "health_permit",
    labelEn: "Health permit",
    labelEs: "Permiso de salud",
    descEn:
      "County or city health permit. Polish-pass surface; not part of the V-1b Stage 4 minimum.",
    descEs:
      "Permiso de salud del condado o ciudad. Superficie de pulido; no es parte del mínimo del Stage 4 de V-1b.",
    tagEn: "Polish",
    tagEs: "Pulido",
    gateType: "optional",
    trustReward: 6,
    triggerSubTypes: [],
  },
  {
    key: "other",
    labelEn: "Other certification",
    labelEs: "Otra certificación",
    descEn: "Anything else worth surfacing on your profile. Staff reviews.",
    descEs:
      "Cualquier otra cosa que valga la pena mostrar en tu perfil. El equipo lo revisa.",
    tagEn: "Other",
    tagEs: "Otro",
    gateType: "optional",
    trustReward: 0,
    triggerSubTypes: [],
  },
] as const;

export function certTypeLabel(key: CertTypeKey, locale: Locale): string {
  const entry = CERT_TYPES.find((c) => c.key === key);
  if (!entry) return key;
  return locale === "es" ? entry.labelEs : entry.labelEn;
}

export function certTypeDescription(key: CertTypeKey, locale: Locale): string {
  const entry = CERT_TYPES.find((c) => c.key === key);
  if (!entry) return "";
  return locale === "es" ? entry.descEs : entry.descEn;
}

export function certTypeTag(key: CertTypeKey, locale: Locale): string {
  const entry = CERT_TYPES.find((c) => c.key === key);
  if (!entry) return "";
  return locale === "es" ? entry.tagEs : entry.tagEn;
}

export function certTypeGate(key: CertTypeKey): CertGateType | null {
  return CERT_TYPES.find((c) => c.key === key)?.gateType ?? null;
}

export function certTypeTrustReward(key: CertTypeKey): number {
  return CERT_TYPES.find((c) => c.key === key)?.trustReward ?? 0;
}

/**
 * Stage 4 conditional-reveal predicate. Returns true if the cert card should
 * surface for a vendor with the given sub-type selection (preferred) or
 * primary_category (fallback when sub_types is empty).
 *
 * V-1c semantic — ANY-match across the sub_types array:
 *   reveal if AT LEAST ONE selected sub-type triggers this cert.
 * Rationale: a vendor who picked "Wedding DJ" + "Mixologist" needs TABC for
 * the alcohol side regardless of which they ranked primary. Compliance-
 * gated certs (TABC, food_handler) are over-reveal-tolerant by design —
 * surfacing one extra optional card is cheaper than missing one.
 *
 * No category fallback: the 'dessert' category that historically triggered
 * conditional certs moved to Catr (Lock 14 amendment), so an empty sub_types
 * selection reveals no conditional card. A future food/alcohol Vndr category
 * would re-introduce its triggers + a fallback here.
 *
 * Note: as of V-1c this helper is dead code in the live Stage 4 UI
 * (Stage4.tsx hard-codes general_liability_insurance + business_license
 * unconditionally per Lock 14). The signature is correct for future V-2+
 * profile / discovery surfaces that surface cert badges per vendor.
 */
export function certTypeShouldReveal(
  key: CertTypeKey,
  vendor: { primarySubTypes: string[]; primaryCategory: string | null },
): boolean {
  const entry = CERT_TYPES.find((c) => c.key === key);
  if (!entry) return false;
  if (entry.gateType !== "conditional") {
    // Soft + optional cards are always-shown at Stage 4 (the four cards
    // surfaced in the V-1b mockup are COI + business_license + the two
    // conditional ones). plnr_professional / health_permit / other are
    // not part of Stage 4 V-1b — the page filters those out.
    return entry.gateType === "soft" || entry.key === "business_license";
  }
  if (vendor.primarySubTypes.length > 0) {
    return vendor.primarySubTypes.some((st) =>
      entry.triggerSubTypes.includes(st),
    );
  }
  // No category-based fallback: the 'dessert' category that historically
  // triggered TABC + food_handler moved to Catr (Lock 14 amendment), where that
  // compliance is a hard gate. No current Vndr category triggers a conditional cert.
  return false;
}
