import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

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
};

export type OrgnzContext = {
  user: { id: string; email: string; initials: string; displayName: string };
  tenantId: string | null;
  event: OrgnzEvent | null;
  lineItems: OrgnzBudgetLine[];
  customMilestones: OrgnzCustomMilestone[];
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

  if (tenantId) {
    // Core event select — only columns guaranteed to exist on EVERY deployment.
    // Phase 3.6 columns (milestone_overrides) get a separate best-effort query
    // below so a pre-migration schema doesn't 500 every page that loads the
    // orgnz context.
    const { data: events } = await admin
      .from("events")
      .select(
        "id,name,event_type,event_subtype,start_date,start_time,timezone,date_status,duration_minutes,guest_count,budget_cents,contingency_pct",
      )
      .eq("orgnz_tenant_id", tenantId)
      .order("created_at", { ascending: false })
      .limit(1);
    event = (events?.[0] as OrgnzEvent | undefined) ?? null;

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
      // Pre-migration, this errors and we fall through with an empty list.
      const { data: customs, error: customsErr } = await admin
        .from("event_custom_milestones")
        .select("id,label,detail,custom_date,custom_time,sort_order,tradition_key")
        .eq("event_id", event.id);
      if (!customsErr) {
        customMilestones = (customs as OrgnzCustomMilestone[] | null) ?? [];
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
