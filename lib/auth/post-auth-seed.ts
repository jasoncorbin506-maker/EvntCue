"use server";

import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getLocale } from "@/i18n/locale";
import { logEventHistoryWrite } from "@/lib/events/timing";
import {
  CATEGORIES,
  dbHorizonFromUi,
  getSubtype,
  type CategoryKey,
  type DateHorizon,
  type EventTypeEnum,
  type GuestBand,
} from "@/data/budget-presets";

export type CalcCookieState = {
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
  selectedDateIso?: string;  // set when user picked a date on /event-preview
  selectedTimeIso?: string | null; // "HH:MM:SS" 24h or null = all-day (Q3)
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
  // Capture the cookie locale at signup time so the tenant + user persist the
  // language they chose pre-auth (or the browser default if they never flipped
  // the toggle). Migration 022 — tenants.language_preference + users.language_preference.
  const locale = await getLocale();

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
      language_preference: locale,
    });
    if (insertUserErr) throw new Error("Could not create profile.");
  }

  // 2. Resolve desired role + ensure tenant.
  //
  // Three-priority chain (revised 2026-05-27 — Lock 26 soft-closure compliance):
  //
  //   1. Explicit `args.role` hint from the auth flow. Vndr Door B sets
  //      role=vndr after Stage 0 calculator. Future portals can pass their
  //      own role hints the same way.
  //   2. If the user already has any role rows, respect their primary one.
  //      DO NOT auto-seed an orgnz tenant for a venue / plnr / catr / admin
  //      user — that would silently violate Lock 26 ("no new multi-role
  //      accounts post-launch"). Surfaced 2026-05-27 when the CvenuTest
  //      account signed in and got an unwanted orgnz tenant created.
  //   3. First-time funnel signup with no existing roles → default orgnz.
  //
  // tenants.type accepts every value in the role list per the tenant_type
  // enum (migration 001 + later additions).
  const VALID_ROLES = ["orgnz", "vndr", "venue", "plnr", "catr", "admin"] as const;
  type DesiredRole = (typeof VALID_ROLES)[number];
  const isValidRole = (r: string | null): r is DesiredRole =>
    !!r && (VALID_ROLES as readonly string[]).includes(r);

  let desiredRole: DesiredRole;
  if (isValidRole(args.role)) {
    desiredRole = args.role;
  } else {
    const { data: existingRoles } = await admin
      .from("user_roles")
      .select("role, is_primary, created_at")
      .eq("user_id", args.userId)
      .order("is_primary", { ascending: false })
      .order("created_at", { ascending: true });

    const primary = existingRoles?.[0]?.role as string | undefined;
    desiredRole = isValidRole(primary ?? null) ? (primary as DesiredRole) : "orgnz";
  }

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
      .insert({ name: args.email, type: desiredRole, language_preference: locale })
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

  // 3. Seed role-specific pre-auth state from cookies / LCS row.
  //    Branches on desiredRole — orgnz seeds events + event_budgets from the
  //    Budget Calculator funnel; vndr seeds a draft vendors row from Stage 0
  //    of the /vndr-onboarding acquisition arc.
  const c = await cookies();
  const sessionToken = c.get("evntcue_capture_session")?.value;

  if (desiredRole === "vndr") {
    // Vndr Door B path. Pick up the Stage 0 calculator state from the
    // evntcue_vndr_stage0 cookie (set by save-vndr-session.ts) and seed a
    // draft vendors row scoped to the new tenant. Stages 1–4 of
    // /vndr-onboarding/[step]/ persist directly to this row via per-stage
    // server actions; lib/vndr/current-vendor.ts is the resolver.
    const stage0Raw = c.get("evntcue_vndr_stage0")?.value;
    let bookingAmount: number | null = null;
    if (stage0Raw) {
      try {
        const stage0 = JSON.parse(stage0Raw) as { bookingAmount?: unknown };
        if (
          typeof stage0.bookingAmount === "number" &&
          Number.isFinite(stage0.bookingAmount)
        ) {
          bookingAmount = stage0.bookingAmount;
        }
      } catch {
        // Bad JSON — proceed without a Stage 0 anchor.
      }
    }
    await seedVendorFromStage0(
      admin,
      args,
      tenantId,
      bookingAmount,
      sessionToken ?? null,
    );
    if (sessionToken) c.delete("evntcue_capture_session");
    if (stage0Raw) c.delete("evntcue_vndr_stage0");
  } else if (desiredRole === "orgnz") {
    // Orgnz path. Two sources:
    //    (a) Cookies on this device (same-device email-confirm or direct signin).
    //    (b) PARKING_LOT #12 fallback: cross-device email-confirm — cookies are
    //        on the signup device, not the confirming one. signUpAction wrote
    //        email_captured + pending_calc_state to the LCS row pre-signUp
    //        (migration 027); look it up by email here.
    //
    //    If cookies present → cookie path wins (most recent). If not, try DB.
    //    Never double-seed: PARKING_LOT #56 (locked 2026-05-21) — gate
    //    on `tenant has no existing events`. Catches both stale-cookie
    //    re-signin AND "cleared cookies + reran calc + signed in" cases.
    //    The LCS row's converted_user_id is the second-line defense for
    //    the cross-device DB path.
    const stateRaw = c.get("evntcue_calc_state")?.value;

    const { data: existingEvents } = await admin
      .from("events")
      .select("id")
      .eq("orgnz_tenant_id", tenantId)
      .limit(1);
    const hasExistingEvents = (existingEvents?.length ?? 0) > 0;

    if (hasExistingEvents) {
      // Returning signin with leftover capture cookies, or user reran the
      // calculator then signed back in. Either way, they already have at
      // least one event on this tenant — don't seed another. Clear cookies
      // so the next signin doesn't re-hit this branch.
      if (sessionToken) c.delete("evntcue_capture_session");
      if (stateRaw) c.delete("evntcue_calc_state");
    } else if (sessionToken && stateRaw) {
      let state: CalcCookieState | null = null;
      try {
        state = JSON.parse(stateRaw) as CalcCookieState;
      } catch {
        state = null;
      }
      if (state) {
        await seedEventFromCalcState(admin, args, tenantId, state, sessionToken);
      }
      c.delete("evntcue_capture_session");
      c.delete("evntcue_calc_state");
    } else if (args.email) {
      // No cookies — cross-device fallback. Look up the most-recent unconverted
      // LCS row by email. signUpAction wrote pending_calc_state here pre-signUp.
      const { data: lcsRow } = await admin
        .from("landing_capture_sessions")
        .select("session_token, pending_calc_state")
        .eq("email_captured", args.email)
        .is("converted_user_id", null)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (lcsRow?.pending_calc_state) {
        const state = lcsRow.pending_calc_state as CalcCookieState;
        await seedEventFromCalcState(
          admin,
          args,
          tenantId,
          state,
          lcsRow.session_token as string,
        );
      }
    }
  }

  // Make sure auth session is hydrated for the redirect target
  void (await createClient()).auth.getUser();

  if (desiredRole === "vndr") return "/vndr-onboarding/1";
  if (args.intent === "mood_board") return "/mood-board";
  if (desiredRole === "venue") return "/venu";
  if (desiredRole === "plnr") return "/plnr";
  if (desiredRole === "catr") return "/catr";
  if (desiredRole === "admin") return "/admin";
  return "/orgnz";
}

/**
 * Internal helper — insert events + event_budgets rows from a CalcCookieState,
 * then attach the landing_capture_sessions row to the user (set
 * converted_user_id, clear pending_calc_state, mirror date_horizon +
 * event_subtype). Idempotent on its inputs but should be called at most once
 * per signup (caller guarantees this via the cookie-or-DB branch in postAuthSeed).
 *
 * Used by both the cookie path (same-device) and the DB fallback path
 * (cross-device email-confirm — PARKING_LOT #12).
 */
export async function seedEventFromCalcState(
  admin: ReturnType<typeof createAdminClient>,
  args: { userId: string; email: string },
  tenantId: string,
  state: CalcCookieState,
  sessionToken: string,
): Promise<void> {
  const category = CATEGORIES.find((cat) => cat.key === state.category);
  if (category) {
    const subtype = getSubtype(state.category, state.subtypeKey);
    const eventTypeEnum: EventTypeEnum =
      subtype?.eventTypeEnum ?? category.eventTypeEnum;
    const eventName = subtype
      ? `${subtype.label} · draft`
      : `${category.label} · draft`;

    // Prefer the user-picked date if /event-preview captured one; otherwise
    // fall back to the horizon midpoint.
    const isPickedDate =
      typeof state.selectedDateIso === "string" &&
      /^\d{4}-\d{2}-\d{2}$/.test(state.selectedDateIso);
    const startDate = isPickedDate
      ? state.selectedDateIso!
      : horizonToStartDate(state.dateHorizon);

    // Per Q3 — normalize selectedTimeIso to "HH:MM:SS" or null (= all-day).
    // The cookie may carry "HH:MM" (HTML input type="time" default), null,
    // or undefined. Validate before stamping into events.start_time.
    let startTime: string | null = null;
    if (typeof state.selectedTimeIso === "string") {
      const raw = state.selectedTimeIso;
      if (/^\d{2}:\d{2}:\d{2}$/.test(raw)) startTime = raw;
      else if (/^\d{2}:\d{2}$/.test(raw)) startTime = `${raw}:00`;
    }

    const { data: event, error: eventErr } = await admin
      .from("events")
      .insert({
        name: eventName,
        event_type: eventTypeEnum,
        event_subtype: state.subtypeKey,  // 3.2.C — drives milestone rail subtype lookup
        orgnz_tenant_id: tenantId,
        start_date: startDate,
        start_time: startTime,             // Q3 — null = all-day
        date_status: "tentative",          // Q1 — calc-state defaults to tentative
        duration_minutes: null,            // Q5 — app code defaults to 240 at use time
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

      // Per F3.b — append event_history entries for the initial timing
      // values. One row per field so future diff queries can target by
      // field. Reason="Event created from calc state" is canonical.
      const eventId = event.id as string;
      const initialFields: ReadonlyArray<{ field: string; newValue: unknown }> = [
        { field: "start_date", newValue: startDate },
        { field: "start_time", newValue: startTime },
        { field: "date_status", newValue: "tentative" },
      ];
      for (const f of initialFields) {
        await logEventHistoryWrite(admin, {
          eventId,
          userId: args.userId,
          field: f.field,
          oldValue: null,
          newValue: f.newValue,
          reason: "Event created from calc state",
        });
      }
    }
  }

  // Attach LCS row to the now-real user. pending_calc_state cleared per the
  // migration 027 COMMENT — once converted, the data lives on events +
  // event_budgets and a stale copy here would drift.
  await admin
    .from("landing_capture_sessions")
    .update({
      converted_user_id: args.userId,
      email_captured: args.email,
      date_horizon: dbHorizonFromUi(state.dateHorizon),
      event_subtype: state.subtypeKey,  // 3.2.C — also persist on capture session
      pending_calc_state: null,
    })
    .eq("session_token", sessionToken);
}

/**
 * Internal helper — insert a draft vendors row scoped to the new tenant +
 * attach the landing_capture_sessions row to the user. Vndr analogue of
 * seedEventFromCalcState (which seeds Orgnz events + event_budgets). Writes
 * a single vendors row instead.
 *
 * Idempotent guard: if a vendors row already exists for the tenant (rare —
 * would only happen on a re-sign-up where the user_role was deleted but the
 * vendor wasn't), skip. The vendors_tenant_implies_claimed CHECK constraint
 * requires claimed_at to be set whenever tenant_id is — we set both atomically.
 *
 * display_name is NOT NULL on vendors but Stage 2 of the funnel is where
 * the vendor actually provides their business name; we seed with the user's
 * email as a placeholder. Stage 2's saveStage2Action overwrites it. Every
 * other column is either NULL (set by later stages) or a meaningful default
 * from migration 041 (claim_status, acquisition_lane defaults exist but we
 * set them explicitly for clarity).
 *
 * avg_ticket_cents anchors from the Stage 0 calculator slider. If the cookie
 * was missing or malformed, we leave it NULL — Stage 3's saveStage3Action
 * may overwrite it via the starting_price slider, or it stays NULL for
 * vendors who skip the Stage 0 calculator (e.g., direct sign-up at /login).
 */
async function seedVendorFromStage0(
  admin: ReturnType<typeof createAdminClient>,
  args: { userId: string; email: string },
  tenantId: string,
  bookingAmount: number | null,
  sessionToken: string | null,
): Promise<void> {
  // Idempotent guard — skip if a vendors row already exists for this tenant.
  const { data: existing } = await admin
    .from("vendors")
    .select("id")
    .eq("tenant_id", tenantId)
    .limit(1);
  if (existing && existing.length > 0) return;

  const nowIso = new Date().toISOString();
  const avgTicketCents =
    bookingAmount != null ? Math.round(bookingAmount * 100) : null;

  await admin.from("vendors").insert({
    tenant_id: tenantId,
    // vendors_tenant_implies_claimed CHECK: tenant_id + claimed_at travel together.
    claimed_at: nowIso,
    // Stage 4 finishOnboardingAction flips this to 'published'.
    claim_status: "pending_claim",
    // Door B signature. Set EXACTLY ONCE per migration 041 hard constraint #10.
    acquisition_lane: "self_serve",
    // NOT NULL placeholder; Stage 2 saveStage2Action overwrites with the
    // business name the vendor types into the form.
    display_name: args.email,
    avg_ticket_cents: avgTicketCents,
  });

  // Attach the LCS row to the now-real user, if we have a session token.
  // converted_user_id flips this row from "anonymous Stage 0 visitor" to
  // "this user's pre-auth state" so analytics can stitch them together.
  if (sessionToken) {
    await admin
      .from("landing_capture_sessions")
      .update({
        converted_user_id: args.userId,
        email_captured: args.email,
      })
      .eq("session_token", sessionToken);
  }
}
