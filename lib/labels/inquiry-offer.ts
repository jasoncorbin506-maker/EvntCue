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
): string {
  const t = locale === "es" ? CAUSE_CHIP_ES : CAUSE_CHIP_EN;
  return t[cause as InquiryOfferCause] ?? CAUSE_CHIP_EN[cause as InquiryOfferCause] ?? cause;
}

export function inquiryCauseSentence(
  cause: string,
  locale: Locale = "en",
): string {
  const t = locale === "es" ? CAUSE_SENTENCE_ES : CAUSE_SENTENCE_EN;
  return t[cause as InquiryOfferCause] ?? CAUSE_SENTENCE_EN[cause as InquiryOfferCause] ?? cause;
}

/** Ordered cause set for rendering the reason-chip picker. */
export const INQUIRY_OFFER_CAUSES: InquiryOfferCause[] = [
  "uncompetitive",
  "time_constraint",
  "prior_engagement",
  "distance",
  "other",
];
