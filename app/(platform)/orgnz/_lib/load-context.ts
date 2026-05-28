import { cache } from "react";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  humanizeEventType,
  resolveSelectedEvent,
  sortEventsForPicker,
} from "@/lib/events/event-picker";

// PL #61 — proxy.ts copies `/orgnz?event=<id>` into this request header so the
// layout (which never receives searchParams) can resolve the selection.
const ORGNZ_EVENT_HEADER = "x-orgnz-event-id";

export type OrgnzEvent = {
  id: string;
  name: string;
  event_type: string;
  event_subtype: string | null;
  start_date: string;
  start_time: string | null;
  // Migration 043 — F1.b / F5.b / Q5 in
  // decisions-log/2026-05-23-event-start-time-architecture.md
  timezone: string;
  date_status: "tentative" | "confirmed" | "final";
  duration_minutes: number | null;
  guest_count: number | null;
  budget_cents: number | null;
  contingency_pct: number | null;
  // Lock 27 (activation gate) — 'draft' = planning sandbox (non-transactional),
  // 'active' = real event (bookings/inquiries/payments allowed). Flipped by the
  // "Date Set, Ready to Book" affordance via activate-event. Selected in the
  // events query since PL #61.
  status: string | null;
  /**
   * Phase 3.6 milestone-editing overrides. Optional on the type so the rest
   * of the app still works before migration 024 is applied to Supabase
   * (otherwise selecting a non-existent column makes events queries return
   * null and the whole funnel — mood board, dashboard, tiles — falls into
   * the no-event recovery branch).
   *
   * Read defensively via the helper below.
   */
  milestone_overrides?: Record<string, Record<string, unknown>> | null;
};

export type OrgnzBudgetLine = {
  label: string;
  amount_cents: number;
  sort_order: number | null;
};

export type OrgnzCustomMilestone = {
  id: string;
  label: string | null;
  detail: string | null;
  custom_date: string;
  custom_time: string | null;
  sort_order: number | null;
  tradition_key: string | null;
  // Migration 048 — Scope B hallway. NULL = planning-only milestone (lives
  // on the planning timeline only). Non-NULL surfaces in RunOfShow at the
  // matching phase slot. Optional on the type so pre-048 schema reads keep
  // working — the SELECT is best-effort below.
  ros_phase?: string | null;
  vendor_name?: string | null;
  vendor_contact_email?: string | null;
  // Migration 050 — Concept C lifecycle. assignment_status drives the
  // derived Open Items view (lib/events/open-items.ts). day_of_relevant is
  // the day-of mode suppression flag. Optional on the type so pre-050
  // schema reads keep working.
  assignment_status?: "unowned" | "vendor_assigned" | "manually_defined" | "resolved";
  day_of_relevant?: boolean;
};

/**
 * PL #61 — lightweight per-event row for the Chrome event picker. One per
 * event on the tenant. `dateLabel` / `typeLabel` are pre-formatted server-side
 * so the client picker stays dumb and locale-consistent.
 */
export type OrgnzEventSummary = {
  id: string;
  name: string;
  eventType: string;
  typeLabel: string;
  startDate: string | null;
  dateLabel: string | null;
  status: string | null;
};

export type OrgnzContext = {
  user: { id: string; email: string; initials: string; displayName: string };
  tenantId: string | null;
  event: OrgnzEvent | null;
  lineItems: OrgnzBudgetLine[];
  customMilestones: OrgnzCustomMilestone[];
  // PL #61 — multi-event support.
  events: OrgnzEventSummary[];
  selectedEventId: string | null;
  /** True when a `?event=<id>` was requested but didn't resolve to a tenant
   * event (stale bookmark / wrong tenant). The Chrome surfaces a soft toast
   * and strips the bad param — warnings inform, never block (Lock 22). */
  eventNotFound: boolean;
};

function deriveInitials(email: string): string {
  const local = email.split("@")[0] ?? "";
  const parts = local.split(/[._-]/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return (local.slice(0, 2) || "EC").toUpperCase();
}

export const loadOrgnzContext = cache(async (): Promise<OrgnzContext | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const admin = createAdminClient();

  const { data: roles } = await admin
    .from("user_roles")
    .select("tenant_id")
    .eq("user_id", user.id)
    .eq("role", "orgnz")
    .limit(1);
  const tenantId = (roles?.[0]?.tenant_id as string | undefined) ?? null;

  let event: OrgnzEvent | null = null;
  let lineItems: OrgnzBudgetLine[] = [];
  let customMilestones: OrgnzCustomMilestone[] = [];
  let events: OrgnzEventSummary[] = [];
  let selectedEventId: string | null = null;
  let eventNotFound = false;

  if (tenantId) {
    // PL #61 — the URL-driven selection, forwarded by proxy.ts as a request
    // header (layouts never receive searchParams).
    const requestedEventId =
      (await headers()).get(ORGNZ_EVENT_HEADER)?.trim() || null;

    // Load ALL events on the tenant in one pass: created_at-desc ordering
    // doubles as the default-selection order, and the rows feed the Chrome
    // picker. Only columns guaranteed to exist on EVERY deployment (+ status
    // for the picker pill). Phase 3.6 columns (milestone_overrides) get a
    // separate best-effort query below so a pre-migration schema doesn't 500
    // every page that loads the orgnz context.
    const { data: rows } = await admin
      .from("events")
      .select(
        "id,name,event_type,event_subtype,start_date,start_time,timezone,date_status,duration_minutes,guest_count,budget_cents,contingency_pct,status",
      )
      .eq("orgnz_tenant_id", tenantId)
      .order("created_at", { ascending: false });

    const allEvents =
      (rows as (OrgnzEvent & { status?: string | null })[] | null) ?? [];

    // Resolve the active event. `allEvents` is ordered created_at-desc, so the
    // default (no/invalid `?event=`) is the most-recent — preserving pre-#61
    // behavior. See lib/events/event-picker.ts.
    const resolution = resolveSelectedEvent(allEvents, requestedEventId);
    event = resolution.selected;
    eventNotFound = resolution.eventNotFound;
    selectedEventId = event?.id ?? null;

    // Picker rows, sorted next-upcoming-first for display (the created_at-desc
    // order above is retained purely for default-selection).
    events = sortEventsForPicker(allEvents).map((e) => ({
      id: e.id,
      name: e.name,
      eventType: e.event_type,
      typeLabel: humanizeEventType(e.event_type),
      startDate: e.start_date ?? null,
      dateLabel: e.start_date ? formatStartDateMedium(e.start_date) : null,
      status: (e.status as string | null) ?? null,
    }));

    if (event) {
      const { data: items } = await admin
        .from("event_budgets")
        .select("label,amount_cents,sort_order")
        .eq("event_id", event.id)
        .order("sort_order", { ascending: true });
      lineItems = (items as OrgnzBudgetLine[] | null) ?? [];

      // Best-effort: milestone_overrides lives on events post-migration 024.
      // If the column doesn't exist yet, this query returns an error which we
      // silently swallow — event already loaded fine via the core select.
      const { data: overridesRow, error: overridesErr } = await admin
        .from("events")
        .select("milestone_overrides")
        .eq("id", event.id)
        .maybeSingle();
      if (!overridesErr && overridesRow) {
        event.milestone_overrides =
          (overridesRow.milestone_overrides as Record<string, Record<string, unknown>> | null) ??
          null;
      }

      // Best-effort: event_custom_milestones is a new table from migration 024.
      // Migration 048 adds ros_phase + vendor_name + vendor_contact_email
      // (Scope B hallway). Pre-048 the extra columns don't exist; SELECT'ing
      // them would error and drop ALL custom milestones from the page. Two
      // queries: minimal-shape first (guaranteed to work post-024), then a
      // best-effort 048-columns enrichment pass.
      const { data: customs, error: customsErr } = await admin
        .from("event_custom_milestones")
        .select("id,label,detail,custom_date,custom_time,sort_order,tradition_key")
        .eq("event_id", event.id);
      if (!customsErr) {
        customMilestones = (customs as OrgnzCustomMilestone[] | null) ?? [];
      }

      if (customMilestones.length > 0) {
        const { data: rosData, error: rosErr } = await admin
          .from("event_custom_milestones")
          .select(
            "id,ros_phase,vendor_name,vendor_contact_email,assignment_status,day_of_relevant",
          )
          .eq("event_id", event.id);
        if (!rosErr && rosData) {
          const byId = new Map<
            string,
            {
              ros_phase: string | null;
              vendor_name: string | null;
              vendor_contact_email: string | null;
              assignment_status?: OrgnzCustomMilestone["assignment_status"];
              day_of_relevant?: boolean;
            }
          >();
          for (const row of rosData) {
            byId.set(row.id as string, {
              ros_phase: (row.ros_phase as string | null) ?? null,
              vendor_name: (row.vendor_name as string | null) ?? null,
              vendor_contact_email:
                (row.vendor_contact_email as string | null) ?? null,
              assignment_status:
                (row.assignment_status as OrgnzCustomMilestone["assignment_status"]) ??
                undefined,
              day_of_relevant: (row.day_of_relevant as boolean | null) ?? undefined,
            });
          }
          customMilestones = customMilestones.map((m) => {
            const extras = byId.get(m.id);
            return extras ? { ...m, ...extras } : m;
          });
        }
      }
    }
  }

  const email = user.email ?? "";
  return {
    user: {
      id: user.id,
      email,
      initials: deriveInitials(email),
      displayName: email.split("@")[0] ?? "You",
    },
    tenantId,
    event,
    lineItems,
    customMilestones,
    events,
    selectedEventId,
    eventNotFound,
  };
});

export function daysUntil(startDateIso: string): number {
  const start = new Date(startDateIso + "T00:00:00").getTime();
  const now = Date.now();
  return Math.floor((start - now) / (1000 * 60 * 60 * 24));
}

const LONG_DATE = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  month: "short",
  day: "numeric",
  year: "numeric",
});

const SHORT_DATE = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
});

export function formatStartDateLong(startDateIso: string): string {
  return LONG_DATE.format(new Date(startDateIso + "T00:00:00"));
}

export function formatStartDateShort(startDateIso: string): string {
  return SHORT_DATE.format(new Date(startDateIso + "T00:00:00"));
}

export function buildTargetIso(
  startDateIso: string,
  startTime: string | null,
): string {
  // start_time is a TIME string (HH:MM:SS). Default to 5pm if absent.
  const t = startTime ?? "17:00:00";
  return `${startDateIso}T${t}`;
}

export function prettyEventType(eventType: string): string {
  return eventType.charAt(0).toUpperCase() + eventType.slice(1);
}

// ── PL #61 event-picker helpers ──────────────────────────────────────────────

const MEDIUM_DATE = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

/** "Jul 1, 2027" — fuller than the chrome chip's short date so a picker row is
 *  unambiguous across years. Matches the en-US convention the other date
 *  formatters in this module already use. */
export function formatStartDateMedium(startDateIso: string): string {
  return MEDIUM_DATE.format(new Date(startDateIso + "T00:00:00"));
}
