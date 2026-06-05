/**
 * Negotiation-cycle Cue guidance (Inquiry negotiation primitive, Layer A/B).
 *
 * Tells both parties what the negotiation cycle looks like and where they are
 * in it — the "inform them what the cycle looks like" surface. Ships as a
 * DETERMINISTIC guidance function now; becomes Cue's prompt source when
 * CueService.ts wires the Anthropic API in Phase 3.4+ (same pattern as
 * lib/cue/vndr-home-prompt.ts — the deterministic ladder is not throwaway, it
 * is the eventual Cue prompt material).
 *
 * Pure module (no server-only) — the stepper renders client-side inside the
 * inquiry sheet, so both client and server can call this.
 *
 * Voice — per Lock 8: warm, specific, present-tense, never punishing.
 *   "They countered — your call" not "You failed to agree."
 *
 * The bounded cycle (one counter each way, then settled or closed):
 *
 *   Offer ──► Vendor responds ──► Buyer responds ──► Settled
 *   (orgnz)   (claim/counter/    (accept/counter)    (agreed
 *             decline)                                 or closed)
 *
 * Turn order + the one-counter-each-way cap are ENFORCED in the action layer;
 * this module only mirrors that state for display, so the two must agree.
 */

export type NegotiationRole = "orgnz" | "vndr";
export type NegotiationAction = "claim" | "counter" | "accept" | "decline";

/** Minimal view of the offer ledger this guidance reads (newest last). */
export type NegotiationOfferLite = {
  action: NegotiationAction;
  by: NegotiationRole;
};

export type NegotiationView = {
  /** Who is looking at the cue right now. */
  viewer: NegotiationRole;
  /** Did the buyer attach an initial offer $ (enables Quick Claim)? */
  hasInitialOffer: boolean;
  /** The offer ledger so far, oldest → newest. Empty = vendor hasn't acted. */
  offers: NegotiationOfferLite[];
  /** Display name of the other party, for warm copy. */
  counterpartyName: string;
};

export type CycleStepState = "done" | "current" | "upcoming";

export type CycleStep = {
  key: "offer" | "vendor" | "buyer" | "settled";
  label: string;
  state: CycleStepState;
};

export type NegotiationCue = {
  /** The 4-stage stepper — always rendered so users see the whole shape. */
  steps: CycleStep[];
  /** Where it stands, one short line. */
  headline: string;
  /** What THIS viewer can do next (null = waiting on the other side). */
  nextStep: string | null;
  /** True on the viewer's final decision (no counter left). Drives "last round" UI. */
  lastRound: boolean;
  /** Terminal states. */
  settled: boolean;
  closed: boolean;
};

const STEP_LABELS: Record<CycleStep["key"], string> = {
  offer: "Offer",
  vendor: "Vendor responds",
  buyer: "You respond",
  settled: "Settled",
};

function steps(active: CycleStep["key"], terminal: boolean): CycleStep[] {
  const order: CycleStep["key"][] = ["offer", "vendor", "buyer", "settled"];
  const activeIdx = order.indexOf(active);
  return order.map((key, i) => ({
    key,
    label: STEP_LABELS[key],
    state:
      terminal && key === "settled"
        ? "current"
        : i < activeIdx
          ? "done"
          : i === activeIdx
            ? "current"
            : "upcoming",
  }));
}

/**
 * Derive the negotiation cue from current state. Deterministic — same inputs
 * always yield the same guidance, so the action layer and the display never
 * drift. Counter count per side caps at 1 (bounded negotiation).
 */
export function negotiationCue(v: NegotiationView): NegotiationCue {
  const { viewer, offers, hasInitialOffer, counterpartyName: cp } = v;
  const last = offers[offers.length - 1];
  const vndrCountered = offers.some((o) => o.by === "vndr" && o.action === "counter");
  const orgnzCountered = offers.some((o) => o.by === "orgnz" && o.action === "counter");

  // ── Terminal: settled (a claim or accept landed) ──────────────────────────
  if (last && (last.action === "claim" || last.action === "accept")) {
    return {
      steps: steps("settled", true),
      headline: "You're agreed on a price.",
      nextStep: null,
      lastRound: false,
      settled: true,
      closed: false,
    };
  }

  // ── Terminal: closed (someone passed) ─────────────────────────────────────
  if (last && last.action === "decline") {
    const whoPassed = last.by === viewer ? "You passed" : `${cp} passed`;
    return {
      steps: steps("settled", true),
      headline: `${whoPassed} — this one's closed.`,
      nextStep:
        viewer === "orgnz" && last.by === "vndr"
          ? "You can send a fresh inquiry whenever you like."
          : null,
      lastRound: false,
      settled: false,
      closed: true,
    };
  }

  // ── Open: vendor hasn't responded yet ─────────────────────────────────────
  if (offers.length === 0) {
    if (viewer === "vndr") {
      return {
        steps: steps("vendor", false),
        headline: hasInitialOffer
          ? `${cp} sent an offer with this inquiry.`
          : `${cp} sent you an inquiry.`,
        nextStep: hasInitialOffer
          ? "Quick Claim the offer, counter with a reason, or pass."
          : "Send your quote, or pass with a reason.",
        lastRound: false,
        settled: false,
        closed: false,
      };
    }
    return {
      steps: steps("vendor", false),
      headline: `Sent to ${cp} — waiting on their response.`,
      nextStep: null,
      lastRound: false,
      settled: false,
      closed: false,
    };
  }

  // ── Vendor has countered; buyer's turn (buyer's only counter) ─────────────
  if (vndrCountered && !orgnzCountered) {
    if (viewer === "orgnz") {
      return {
        steps: steps("buyer", false),
        headline: `${cp} countered your offer.`,
        nextStep: "Accept it, counter once, or pass — this is your last counter.",
        lastRound: true, // after an orgnz counter, only the vendor's final decision remains
        settled: false,
        closed: false,
      };
    }
    return {
      steps: steps("buyer", false),
      headline: "You countered — waiting on their call.",
      nextStep: null,
      lastRound: false,
      settled: false,
      closed: false,
    };
  }

  // ── Buyer countered back; vendor's final decision (no counter left) ───────
  if (orgnzCountered) {
    if (viewer === "vndr") {
      return {
        steps: steps("buyer", false),
        headline: `${cp} countered back.`,
        nextStep: "Accept or pass — this is the final round.",
        lastRound: true,
        settled: false,
        closed: false,
      };
    }
    return {
      steps: steps("buyer", false),
      headline: `Countered — waiting on ${cp}'s final call.`,
      nextStep: null,
      lastRound: false,
      settled: false,
      closed: false,
    };
  }

  // ── Fallback (vendor sent a plain quote without countering, etc.) ─────────
  return {
    steps: steps("buyer", false),
    headline:
      viewer === "orgnz"
        ? `${cp} responded — review and decide.`
        : "Waiting on their decision.",
    nextStep: viewer === "orgnz" ? "Accept, counter, or pass." : null,
    lastRound: false,
    settled: false,
    closed: false,
  };
}
