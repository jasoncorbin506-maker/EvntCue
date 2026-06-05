/**
 * Inquiry-offer action + cause display labels — Lock 15 translation layer.
 *
 * Backs the negotiation primitive (migration 091). Two vocabularies:
 *   - action: what a ledger row IS (claim / counter / accept / decline)
 *   - cause:  why a counter/decline happened. These double as the buyer- and
 *             vendor-facing PREPOPULATED reason chips (the "canned responses"),
 *             so each cause carries both a terse chip label and a fuller
 *             sentence the other side reads ("declined due to …").
 *
 * Voice per Lock 8 — present-tense, non-punishing, specific. The "due to"
 * sentences are written from the RECEIVER's side ("They're booked that day"),
 * never accusatory.
 */

import type { Locale } from "@/i18n/locale";

export type InquiryOfferAction = "claim" | "counter" | "accept" | "decline";

export type InquiryOfferCause =
  | "uncompetitive"
  | "time_constraint"
  | "prior_engagement"
  | "distance"
  | "other";

const ACTION_LABELS_EN: Record<InquiryOfferAction, string> = {
  claim: "Quick Claim",
  counter: "Counter",
  accept: "Accept",
  decline: "Pass",
};

const ACTION_LABELS_ES: Record<InquiryOfferAction, string> = {
  claim: "Aceptar ya",
  counter: "Contraoferta",
  accept: "Aceptar",
  decline: "Rechazar",
};

/** Terse chip text shown in the reason picker. */
const CAUSE_CHIP_EN: Record<InquiryOfferCause, string> = {
  uncompetitive: "Offer out of scope",
  time_constraint: "Timing doesn't work",
  prior_engagement: "Already booked",
  distance: "Too far",
  other: "Other",
};

const CAUSE_CHIP_ES: Record<InquiryOfferCause, string> = {
  uncompetitive: "Fuera de alcance",
  time_constraint: "El horario no funciona",
  prior_engagement: "Ya reservado",
  distance: "Muy lejos",
  other: "Otro",
};

/**
 * Buyer-actor wording for the SAME cause enum. The reasons read differently
 * depending on who declined — a buyer rejecting a counter isn't "already
 * booked," they're "going another direction." `OfferActor` selects the set.
 */
export type OfferActor = "vendor" | "buyer";

const CAUSE_CHIP_BUYER_EN: Record<InquiryOfferCause, string> = {
  uncompetitive: "Over budget",
  time_constraint: "Timing doesn't work",
  prior_engagement: "Going another direction",
  distance: "Too far",
  other: "Other",
};

const CAUSE_CHIP_BUYER_ES: Record<InquiryOfferCause, string> = {
  uncompetitive: "Fuera de presupuesto",
  time_constraint: "El horario no funciona",
  prior_engagement: "Elegimos otra opción",
  distance: "Muy lejos",
  other: "Otro",
};

/** Receiver-facing sentence: "{Name} passed — {sentence}". */
const CAUSE_SENTENCE_EN: Record<InquiryOfferCause, string> = {
  uncompetitive: "the offer was below their rate for this kind of event",
  time_constraint: "the timing doesn't fit their schedule",
  prior_engagement: "they're already booked that day",
  distance: "the location is outside their travel range",
  other: "they shared a note below",
};

const CAUSE_SENTENCE_ES: Record<InquiryOfferCause, string> = {
  uncompetitive: "la oferta estaba por debajo de su tarifa para este tipo de evento",
  time_constraint: "el horario no encaja en su agenda",
  prior_engagement: "ya tienen una reservación ese día",
  distance: "la ubicación está fuera de su rango de viaje",
  other: "dejaron una nota abajo",
};

/** Buyer-actor sentences — what the SELLER reads when a buyer passes. */
const CAUSE_SENTENCE_BUYER_EN: Record<InquiryOfferCause, string> = {
  uncompetitive: "the counter came in above their budget",
  time_constraint: "the timing no longer works for them",
  prior_engagement: "they're going another direction",
  distance: "the location no longer fits their plans",
  other: "they shared a note below",
};

const CAUSE_SENTENCE_BUYER_ES: Record<InquiryOfferCause, string> = {
  uncompetitive: "la contraoferta superó su presupuesto",
  time_constraint: "el horario ya no les funciona",
  prior_engagement: "decidieron tomar otra dirección",
  distance: "la ubicación ya no encaja en sus planes",
  other: "dejaron una nota abajo",
};

export function inquiryOfferActionLabel(
  action: string,
  locale: Locale = "en",
): string {
  const t = locale === "es" ? ACTION_LABELS_ES : ACTION_LABELS_EN;
  return t[action as InquiryOfferAction] ?? ACTION_LABELS_EN[action as InquiryOfferAction] ?? action;
}

export function inquiryCauseChipLabel(
  cause: string,
  locale: Locale = "en",
  actor: OfferActor = "vendor",
): string {
  const en = actor === "buyer" ? CAUSE_CHIP_BUYER_EN : CAUSE_CHIP_EN;
  const es = actor === "buyer" ? CAUSE_CHIP_BUYER_ES : CAUSE_CHIP_ES;
  const t = locale === "es" ? es : en;
  return t[cause as InquiryOfferCause] ?? en[cause as InquiryOfferCause] ?? cause;
}

export function inquiryCauseSentence(
  cause: string,
  locale: Locale = "en",
  actor: OfferActor = "vendor",
): string {
  const en = actor === "buyer" ? CAUSE_SENTENCE_BUYER_EN : CAUSE_SENTENCE_EN;
  const es = actor === "buyer" ? CAUSE_SENTENCE_BUYER_ES : CAUSE_SENTENCE_ES;
  const t = locale === "es" ? es : en;
  return t[cause as InquiryOfferCause] ?? en[cause as InquiryOfferCause] ?? cause;
}

/** Ordered cause set for the vendor reason-chip picker (counter / pass). */
export const INQUIRY_OFFER_CAUSES: InquiryOfferCause[] = [
  "uncompetitive",
  "time_constraint",
  "prior_engagement",
  "distance",
  "other",
];

/** Buyer reject picker — drops `distance` (a seller-only reason). */
export const INQUIRY_OFFER_BUYER_CAUSES: InquiryOfferCause[] = [
  "uncompetitive",
  "time_constraint",
  "prior_engagement",
  "other",
];
