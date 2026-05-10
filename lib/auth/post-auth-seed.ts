"use server";

import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  CATEGORIES,
  dbHorizonFromUi,
  getSubtype,
  type CategoryKey,
  type DateHorizon,
  type EventTypeEnum,
  type GuestBand,
} from "@/data/budget-presets";

type CalcCookieState = {
  category: CategoryKey;
  subtypeKey: string | null;
  guestCount: number;
  guestBand: GuestBand;
  dateHorizon: DateHorizon;
  amounts: Record<string, number>;
  contingencyPct: number;
  taxPct: number;
  subtotal: number;
  contingency: number;
  tax: number;
  grand: number;
};

const horizonToStartDate = (h: DateHorizon): string => {
  const map: Record<DateHorizon, number> = {
    "0_2": 1,
    "2_4": 3,
    "4_6": 5,
    "6_8": 7,
    "8_10": 9,
    "10_12": 11,
    "12_14": 13,
    "14_16": 15,
    "16_18": 17,
    "18_plus": 20,
  };
  const months = map[h] ?? 6;
  const d = new Date();
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
};

/**
 * Run after Supabase auth.signUp / signInWithPassword succeeds. Idempotent —
 * safe to call on existing users (skips redundant inserts).
 *
 * Steps:
 *   1. Mirror auth.users → public.users (insert-if-missing).
 *   2. Ensure the user has an Orgnz tenant + user_roles row.
 *   3. If calculator cookies present, seed events + event_budgets and
 *      attach the landing_capture_sessions row to this user.
 *   4. Clear the two pre-auth cookies.
 *
 * Returns the route to redirect to.
 */
export async function postAuthSeed(args: {
  userId: string;
  email: string;
  intent: string | null;
  role: string | null;
}): Promise<string> {
  const admin = createAdminClient();

  // 1. public.users mirror
  const { data: existingUser } = await admin
    .from("users")
    .select("id")
    .eq("id", args.userId)
    .maybeSingle();

  if (!existingUser) {
    const { error: insertUserErr } = await admin.from("users").insert({
      id: args.userId,
      email: args.email,
    });
    if (insertUserErr) throw new Error("Could not create profile.");
  }

  // 2. Ensure Orgnz tenant + user_roles
  // For Phase 3.1, every signup converges on Orgnz (the funnel is Orgnz-first).
  // When Vndr/Venu signup ships, switch on args.role here.
  const desiredRole = "orgnz" as const;

  const { data: existingRole } = await admin
    .from("user_roles")
    .select("tenant_id")
    .eq("user_id", args.userId)
    .eq("role", desiredRole)
    .maybeSingle();

  let tenantId: string;
  if (existingRole?.tenant_id) {
    tenantId = existingRole.tenant_id as string;
  } else {
    const { data: tenant, error: tenantErr } = await admin
      .from("tenants")
      .insert({ name: args.email, type: desiredRole })
      .select("id")
      .single();
    if (tenantErr || !tenant) throw new Error("Could not create workspace.");
    tenantId = tenant.id;

    const { error: roleErr } = await admin.from("user_roles").insert({
      user_id: args.userId,
      tenant_id: tenantId,
      role: desiredRole,
      is_primary: true,
    });
    if (roleErr) throw new Error("Could not assign role.");
  }

  // 3. Consume calculator cookies, if present
  const c = await cookies();
  const sessionToken = c.get("evntcue_capture_session")?.value;
  const stateRaw = c.get("evntcue_calc_state")?.value;

  if (sessionToken && stateRaw) {
    let state: CalcCookieState | null = null;
    try {
      state = JSON.parse(stateRaw) as CalcCookieState;
    } catch {
      state = null;
    }

    if (state) {
      const category = CATEGORIES.find((cat) => cat.key === state.category);
      if (category) {
        const subtype = getSubtype(state.category, state.subtypeKey);
        const eventTypeEnum: EventTypeEnum =
          subtype?.eventTypeEnum ?? category.eventTypeEnum;
        const eventName = subtype
          ? `${subtype.label} · draft`
          : `${category.label} · draft`;

        const { data: event, error: eventErr } = await admin
          .from("events")
          .insert({
            name: eventName,
            event_type: eventTypeEnum,
            orgnz_tenant_id: tenantId,
            start_date: horizonToStartDate(state.dateHorizon),
            guest_count: state.guestCount,
            budget_cents: Math.round(state.grand * 100),
            contingency_pct: state.contingencyPct,
            tax_pct: state.taxPct,
            status: "draft",
          })
          .select("id")
          .single();

        if (!eventErr && event) {
          const itemLabels: Record<string, string> = {};
          for (const it of category.items) itemLabels[it.key] = it.label;

          const lineRows = Object.entries(state.amounts)
            .filter(([, v]) => Number.isFinite(v) && v > 0)
            .map(([key, dollars], idx) => ({
              event_id: event.id as string,
              line_key: key,
              label: itemLabels[key] ?? key,
              amount_cents: Math.round(dollars * 100),
              sort_order: idx,
            }));

          if (lineRows.length > 0) {
            await admin.from("event_budgets").insert(lineRows);
          }
        }
      }

      // Update landing_capture_sessions to attach the now-real user.
      await admin
        .from("landing_capture_sessions")
        .update({
          converted_user_id: args.userId,
          email_captured: args.email,
          date_horizon: dbHorizonFromUi(state.dateHorizon),
        })
        .eq("session_token", sessionToken);
    }

    c.delete("evntcue_capture_session");
    c.delete("evntcue_calc_state");
  }

  // Make sure auth session is hydrated for the redirect target
  void (await createClient()).auth.getUser();

  if (args.intent === "mood_board") return "/orgnz/mood-board";
  return "/orgnz";
}
