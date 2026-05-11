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
  guest_count: number | null;
  budget_cents: number | null;
  contingency_pct: number | null;
};

export type OrgnzBudgetLine = {
  label: string;
  amount_cents: number;
  sort_order: number | null;
};

export type OrgnzContext = {
  user: { id: string; email: string; initials: string; displayName: string };
  tenantId: string | null;
  event: OrgnzEvent | null;
  lineItems: OrgnzBudgetLine[];
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

  if (tenantId) {
    const { data: events } = await admin
      .from("events")
      .select(
        "id,name,event_type,event_subtype,start_date,start_time,guest_count,budget_cents,contingency_pct",
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
