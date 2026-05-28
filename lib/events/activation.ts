/**
 * Lock 27 — draft → active activation gate (pure logic).
 *
 * The decision (Jason, 2026-05-28): a draft is a non-transactional planning
 * sandbox; a real-world touch requires an active event. Drafts can browse,
 * estimate, and shortlist; **inquiries, bookings, and payments require an
 * active event** (Jason picked "gate inquiries too"). The organizer flips
 * draft → active via the "Date Set, Ready to Book" affordance.
 *
 * This module is intentionally pure — no Supabase, no server-only — so the
 * predicates are unit-testable and importable anywhere (server actions, the
 * dashboard server component, future gate call sites). The DB load lives in
 * the caller (it already has the event row in hand).
 *
 * ── How future transactional actions gate themselves ──────────────────────
 * When the booking / inquiry / Stripe creation flows land (not built yet —
 * today bookings/inquiries exist only via the seeder), each creation action
 * should, after loading its parent event:
 *
 *     const gate = assertEventActive(event.status);
 *     if (!gate.ok) return { ok: false, error: gate.error }; // EVENT_NOT_ACTIVATED
 *
 * The caller surfaces `EVENT_NOT_ACTIVATED` via a Lock 22 toast that routes to
 * the activation affordance (inform + invite, never hard-block). Server-side
 * enforcement is mandatory — UI-hidden alone is insufficient.
 */

/** Typed error code a gated action returns when its event isn't active yet. */
export const EVENT_NOT_ACTIVATED = "event_not_activated" as const;

/** The transactional state. */
export function isEventActive(status: string | null | undefined): boolean {
  return status === "active";
}

/** True for events still in the planning sandbox. */
export function isEventDraft(status: string | null | undefined): boolean {
  return status === "draft";
}

/**
 * Gate predicate for transactional creation actions (bookings / inquiries /
 * payments). Returns a typed error when the parent event isn't active.
 */
export function assertEventActive(
  status: string | null | undefined,
):
  | { ok: true }
  | { ok: false; error: typeof EVENT_NOT_ACTIVATED } {
  return isEventActive(status)
    ? { ok: true }
    : { ok: false, error: EVENT_NOT_ACTIVATED };
}

/** Reasons activation can't proceed (surfaced to the organizer, Lock 22). */
export type ActivateBlock = "not_draft" | "no_date";

/**
 * Guard for the activate-event action: an event can be activated only from
 * 'draft' and only once it has a start_date (should always hold post-funnel,
 * but defensive). `already_active` is treated as a no-op success by the caller.
 */
export function canActivate(
  status: string | null | undefined,
  startDate: string | null | undefined,
): { ok: true } | { ok: false; reason: ActivateBlock } {
  if (!isEventDraft(status)) return { ok: false, reason: "not_draft" };
  if (!startDate) return { ok: false, reason: "no_date" };
  return { ok: true };
}
