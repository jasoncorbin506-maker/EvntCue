// =============================================================================
// RLS Isolation Test Suite — foundation
// =============================================================================
// Pre-launch gate per PARKING_LOT #53. Runs adversarial cross-tenant queries
// against the live Supabase project and asserts:
//
//   1. **Isolation** — User A's session cannot read User B's tenant data.
//   2. **No recursion** — No RLS policy chain trips Postgres 42P17 for any
//      role configuration. Specifically tests role × table combos that
//      DON'T short-circuit on early policy clauses (Hard Rule #8 in
//      02_CLAUDE.md — the migration 034 bug class).
//   3. **Positive reads** — Role A's session CAN read the rows that role A
//      is supposed to see (otherwise we'd be passing by over-restriction).
//
// Usage:
//   cd 04_evntcue_Site_Live
//   node scripts/rls-isolation-test.mjs
//
// Exits 0 on all-green, non-zero on any failure. CI-runnable.
//
// Adding new tests:
//   1. Write an async function in the TESTS section below following the
//      existing pattern (seed → assert → no cleanup-in-test, the global
//      cleanup at the end nukes all test-created users via cascade).
//   2. Add it to the runner's TESTS array.
//   3. Each test uses seedTestUser() to spawn an isolated tenant + user +
//      authed client. Seed data via adminClient (service role bypasses RLS).
//      Then query via the test user's authedClient (RLS applies).
//
// Hard Rule #8 (canonical reference): https://github.com/.../02_CLAUDE.md
// Migration 034 (the bug this suite must regression-test):
//   /Users/ltc/Desktop/evntcue/00_Live/deploy/034_ep_select_recursion_fix.sql
// =============================================================================

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { randomUUID } from "node:crypto";

// -----------------------------------------------------------------------------
// Env loading — parse .env.local manually to avoid adding a dep.
// -----------------------------------------------------------------------------
const envFile = readFileSync(resolve(process.cwd(), ".env.local"), "utf-8");
const env = Object.fromEntries(
  envFile
    .split("\n")
    .filter((l) => l && !l.startsWith("#"))
    .map((l) => {
      const eq = l.indexOf("=");
      return [l.slice(0, eq).trim(), l.slice(eq + 1).trim().replace(/^["']|["']$/g, "")];
    }),
);

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const ANON_KEY = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !ANON_KEY) {
  console.error("Missing required env vars in .env.local");
  process.exit(1);
}

const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// -----------------------------------------------------------------------------
// Test-run identity — every test run stamps this on created data so cleanup
// is precise even if a previous run crashed mid-flight.
// -----------------------------------------------------------------------------
const TEST_RUN_ID = `rls-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const createdUserIds = [];

console.log(`\n=== RLS Isolation Test Suite ===`);
console.log(`Test run id: ${TEST_RUN_ID}`);
console.log(`Started: ${new Date().toISOString()}\n`);

// -----------------------------------------------------------------------------
// Helpers — seedTestUser, signOut, cleanup
// -----------------------------------------------------------------------------

/**
 * Seed an isolated test tenant + user + role + authed client.
 *
 * Returns:
 *   { userId, tenantId, authedClient, email }
 *
 * The authedClient is signed in as the test user — RLS applies normally to
 * its queries (just like a real browser session would behave).
 */
async function seedTestUser(role) {
  const email = `rls-test-${TEST_RUN_ID}-${role}-${randomUUID().slice(0, 6)}@test.evntcue.local`;
  const password = `Test-${randomUUID()}`;

  // 1. Create the auth user (service role bypass).
  const { data: created, error: createErr } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (createErr) throw new Error(`auth.admin.createUser failed: ${createErr.message}`);
  const userId = created.user.id;
  createdUserIds.push(userId);

  // 2. Mirror to public.users (postAuthSeed normally does this in the app).
  const { error: userMirrorErr } = await adminClient.from("users").insert({
    id: userId,
    email,
    language_preference: "en",
  });
  if (userMirrorErr) throw new Error(`users mirror insert failed: ${userMirrorErr.message}`);

  // 3. Create the tenant.
  const { data: tenant, error: tenantErr } = await adminClient
    .from("tenants")
    .insert({
      name: `RLS test ${role} ${TEST_RUN_ID}`,
      type: role,
      language_preference: "en",
    })
    .select("id")
    .single();
  if (tenantErr) throw new Error(`tenant insert failed: ${tenantErr.message}`);
  const tenantId = tenant.id;

  // 4. Bind user_roles.
  const { error: roleErr } = await adminClient.from("user_roles").insert({
    user_id: userId,
    tenant_id: tenantId,
    role,
    is_primary: true,
  });
  if (roleErr) throw new Error(`user_roles insert failed: ${roleErr.message}`);

  // 5. Sign in as this user via a separate anon client to get the authed session.
  const authedClient = createClient(SUPABASE_URL, ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error: signInErr } = await authedClient.auth.signInWithPassword({ email, password });
  if (signInErr) throw new Error(`signInWithPassword failed for ${email}: ${signInErr.message}`);

  return { userId, tenantId, authedClient, email };
}

/**
 * Delete all test-created users. Cascade handles tenants + user_roles + events
 * + bookings via FK ON DELETE CASCADE chains.
 */
async function cleanup() {
  console.log(`\nCleaning up ${createdUserIds.length} test users...`);
  for (const uid of createdUserIds) {
    const { error } = await adminClient.auth.admin.deleteUser(uid);
    if (error) console.warn(`  cleanup warning for ${uid}: ${error.message}`);
  }
  console.log(`Cleanup done.`);
}

// -----------------------------------------------------------------------------
// Test runner — runs each test, tracks pass/fail, returns exit code at end.
// -----------------------------------------------------------------------------
const results = { passed: 0, failed: 0, failures: [] };

async function runTest(name, fn) {
  process.stdout.write(`  ${name}... `);
  try {
    await fn();
    results.passed += 1;
    console.log("✓");
  } catch (err) {
    results.failed += 1;
    results.failures.push({ name, message: err.message });
    console.log(`✗\n      ${err.message}`);
  }
}

// -----------------------------------------------------------------------------
// TESTS
// -----------------------------------------------------------------------------
// Each test follows the same shape:
//   1. Seed isolated tenants/users via seedTestUser() and admin INSERTs.
//   2. Run the adversarial query as one of the seeded users.
//   3. Assert what should/shouldn't be visible.
//   4. NO cleanup inside the test — the global cleanup() handles it via
//      auth.admin.deleteUser() cascade.
//
// Adding more tests: append to the TESTS array at the bottom. Suggested
// next additions (each tests a different role × table cell of the
// "doesn't-short-circuit" matrix per Hard Rule #8):
//   - venue queries inquiries it doesn't own → empty
//   - plnr role (event_participants accepted) queries events → can read
//   - plnr role NOT on event → cannot read
//   - mood_board cross-tenant isolation
//   - tenants table cross-read isolation
// -----------------------------------------------------------------------------

/**
 * Migration 034 regression test.
 *
 * Reproduces the exact configuration that surfaced PARKING_LOT #59:
 * a user holding venue role on tenant V, with a bookings row linking
 * V to an event whose orgnz_tenant is a DIFFERENT tenant O. Pre-034
 * this query path triggered Postgres 42P17 because events_select
 * clause 3 (`EXISTS event_participants`) recursed through ep_select's
 * self-referential clause.
 *
 * The suite must catch this if a future migration ever re-introduces
 * a self-referential clause or other recursion.
 */
async function testMigration034Regression() {
  // Setup: orgnz user owns the event
  const orgnz = await seedTestUser("orgnz");
  const { data: event, error: eventErr } = await adminClient
    .from("events")
    .insert({
      name: `RLS test event ${TEST_RUN_ID}`,
      event_type: "wedding",
      orgnz_tenant_id: orgnz.tenantId,
      start_date: "2027-04-17",
      guest_count: 100,
      budget_cents: 1_000_000,
      status: "planning",
      timezone: "America/Chicago",
    })
    .select("id")
    .single();
  if (eventErr) throw new Error(`event seed failed: ${eventErr.message}`);

  // Setup: venue user with a bookings row linking the orgnz's event
  const venue = await seedTestUser("venue");
  const { error: bookingErr } = await adminClient.from("bookings").insert({
    event_id: event.id,
    vndr_tenant_id: venue.tenantId,
    vndr_type: "venue",
    status: "confirmed",
    subtotal_cents: 100_000,
    platform_fee_cents: 2_500,
    total_cents: 102_500,
    deposit_pct: 25,
    currency: "USD",
  });
  if (bookingErr) throw new Error(`booking seed failed: ${bookingErr.message}`);

  // The adversarial query: venue session reads bookings INNER JOIN events.
  // Pre-034 this returned PGRST201 → recursive 42P17.
  const { data, error } = await venue.authedClient
    .from("bookings")
    .select(
      "id, event_id, vndr_tenant_id, events!bookings_event_id_fkey!inner(name, start_date)",
    )
    .eq("event_id", event.id)
    .eq("vndr_tenant_id", venue.tenantId);

  // Hard Rule #8 assertion: no 42P17.
  if (error && error.code === "42P17") {
    throw new Error(
      `42P17 infinite recursion detected — migration 034 regression. Message: ${error.message}`,
    );
  }
  if (error) {
    throw new Error(`unexpected error: ${error.code} ${error.message}`);
  }

  // Positive assertion: venue CAN see their booking + the joined event.
  if (!data || data.length !== 1) {
    throw new Error(`expected 1 row, got ${data?.length ?? 0}`);
  }
  const row = data[0];
  if (row.event_id !== event.id) {
    throw new Error(`event_id mismatch: ${row.event_id} vs ${event.id}`);
  }
}

/**
 * Cross-tenant isolation — orgnz A cannot read orgnz B's events.
 *
 * The most basic adversarial test: two separate orgnz users on separate
 * tenants. A seeds an event. B's session queries events. Should return
 * zero rows (RLS filters via orgnz_tenant_id IN current_user_tenants()).
 */
async function testCrossTenantEventIsolation() {
  const orgnzA = await seedTestUser("orgnz");
  const orgnzB = await seedTestUser("orgnz");

  const { data: event, error: seedErr } = await adminClient
    .from("events")
    .insert({
      name: `Cross-tenant isolation test ${TEST_RUN_ID}`,
      event_type: "wedding",
      orgnz_tenant_id: orgnzA.tenantId,
      start_date: "2027-06-15",
      guest_count: 80,
      budget_cents: 800_000,
      status: "planning",
      timezone: "America/Chicago",
    })
    .select("id")
    .single();
  if (seedErr) throw new Error(`event seed failed: ${seedErr.message}`);

  // Orgnz B queries events — should NOT see Orgnz A's event.
  const { data: bView, error: bErr } = await orgnzB.authedClient
    .from("events")
    .select("id")
    .eq("id", event.id);

  if (bErr && bErr.code === "42P17") {
    throw new Error(`42P17 recursion on cross-tenant events query: ${bErr.message}`);
  }
  if (bErr) throw new Error(`unexpected error from orgnz B query: ${bErr.message}`);
  if (bView && bView.length > 0) {
    throw new Error(`RLS LEAK: orgnz B saw orgnz A's event (${bView.length} rows)`);
  }

  // Positive control: Orgnz A CAN see their own event.
  const { data: aView, error: aErr } = await orgnzA.authedClient
    .from("events")
    .select("id")
    .eq("id", event.id);
  if (aErr) throw new Error(`orgnz A positive control failed: ${aErr.message}`);
  if (!aView || aView.length !== 1) {
    throw new Error(`orgnz A positive control: expected 1 row, got ${aView?.length ?? 0}`);
  }
}

/**
 * Cross-tenant isolation — venue A cannot read venue B's bookings.
 */
async function testCrossTenantBookingsIsolation() {
  // Each venue needs a booking — bookings.event_id is NOT NULL, so we need
  // events too. Use a shared orgnz to keep the test compact.
  const orgnz = await seedTestUser("orgnz");
  const venueA = await seedTestUser("venue");
  const venueB = await seedTestUser("venue");

  const { data: event } = await adminClient
    .from("events")
    .insert({
      name: `Cross-venue isolation test ${TEST_RUN_ID}`,
      event_type: "wedding",
      orgnz_tenant_id: orgnz.tenantId,
      start_date: "2027-09-20",
      guest_count: 150,
      budget_cents: 1_500_000,
      status: "planning",
      timezone: "America/Chicago",
    })
    .select("id")
    .single();

  const { data: aBooking, error: aBookingErr } = await adminClient
    .from("bookings")
    .insert({
      event_id: event.id,
      vndr_tenant_id: venueA.tenantId,
      vndr_type: "venue",
      status: "confirmed",
      subtotal_cents: 200_000,
      platform_fee_cents: 5_000,
      total_cents: 205_000,
      deposit_pct: 25,
      currency: "USD",
    })
    .select("id")
    .single();
  if (aBookingErr) throw new Error(`venue A booking seed failed: ${aBookingErr.message}`);

  // Venue B queries bookings — should NOT see Venue A's booking.
  const { data: bView, error: bErr } = await venueB.authedClient
    .from("bookings")
    .select("id")
    .eq("id", aBooking.id);

  if (bErr && bErr.code === "42P17") {
    throw new Error(`42P17 recursion on cross-venue bookings query: ${bErr.message}`);
  }
  if (bErr) throw new Error(`unexpected error from venue B query: ${bErr.message}`);
  if (bView && bView.length > 0) {
    throw new Error(`RLS LEAK: venue B saw venue A's booking (${bView.length} rows)`);
  }

  // Positive control: Venue A CAN see their own booking.
  const { data: aView, error: aErr } = await venueA.authedClient
    .from("bookings")
    .select("id")
    .eq("id", aBooking.id);
  if (aErr) throw new Error(`venue A positive control failed: ${aErr.message}`);
  if (!aView || aView.length !== 1) {
    throw new Error(`venue A positive control: expected 1 row, got ${aView?.length ?? 0}`);
  }
}

/**
 * Cross-tenant venue_inquiries isolation — venue A cannot read venue B's inquiries.
 *
 * Different policy chain than bookings — venue_inquiries has its own RLS
 * surface scoped by venue_tenant_id. Exercises the "doesn't short-circuit
 * on earlier clauses" pattern: venue B's session fails the venue_tenant_id
 * match clause and falls through to any remaining clauses. Assert no
 * recursion + no cross-tenant leak.
 */
async function testCrossTenantVenueInquiriesIsolation() {
  const venueA = await seedTestUser("venue");
  const venueB = await seedTestUser("venue");

  const { data: aInquiry, error: aInquiryErr } = await adminClient
    .from("venue_inquiries")
    .insert({
      venue_tenant_id: venueA.tenantId,
      client_name: `RLS test client ${TEST_RUN_ID}`,
      event_type: "wedding",
      event_date: "2027-08-15",
      guest_count: 100,
      est_revenue_cents: 5_000_000,
      status: "reviewing",
    })
    .select("id")
    .single();
  if (aInquiryErr) throw new Error(`venue A inquiry seed failed: ${aInquiryErr.message}`);

  // Venue B queries venue_inquiries — should NOT see Venue A's inquiry.
  const { data: bView, error: bErr } = await venueB.authedClient
    .from("venue_inquiries")
    .select("id")
    .eq("id", aInquiry.id);

  if (bErr && bErr.code === "42P17") {
    throw new Error(`42P17 recursion on venue_inquiries cross-tenant query: ${bErr.message}`);
  }
  if (bErr) throw new Error(`unexpected error from venue B query: ${bErr.message}`);
  if (bView && bView.length > 0) {
    throw new Error(`RLS LEAK: venue B saw venue A's inquiry (${bView.length} rows)`);
  }

  // Positive control: Venue A CAN see their own inquiry.
  const { data: aView, error: aErr } = await venueA.authedClient
    .from("venue_inquiries")
    .select("id")
    .eq("id", aInquiry.id);
  if (aErr) throw new Error(`venue A positive control failed: ${aErr.message}`);
  if (!aView || aView.length !== 1) {
    throw new Error(`venue A positive control: expected 1 row, got ${aView?.length ?? 0}`);
  }
}

/**
 * Plnr role accepted on event CAN read the event.
 *
 * Exercises the events_select clause 3 → user_is_event_participant path
 * (which is now the SECURITY DEFINER helper, post-034). The Plnr's tenant
 * fails clause 2 (orgnz_tenant_id mismatch), forcing the planner to
 * evaluate clause 3 — historically the recursion source. Verifies the
 * 034 fix supports the legitimate plnr-via-participant access pattern.
 */
async function testPlnrParticipantCanReadEvent() {
  const orgnz = await seedTestUser("orgnz");
  const plnr = await seedTestUser("plnr");

  const { data: event, error: eventErr } = await adminClient
    .from("events")
    .insert({
      name: `RLS plnr-access test ${TEST_RUN_ID}`,
      event_type: "wedding",
      orgnz_tenant_id: orgnz.tenantId,
      start_date: "2027-07-04",
      guest_count: 200,
      budget_cents: 2_000_000,
      status: "planning",
      timezone: "America/Chicago",
    })
    .select("id")
    .single();
  if (eventErr) throw new Error(`event seed failed: ${eventErr.message}`);

  // Bind the Plnr to the event as accepted plnr_lead participant.
  const { error: epErr } = await adminClient.from("event_participants").insert({
    event_id: event.id,
    tenant_id: plnr.tenantId,
    role: "plnr_lead",
    status: "accepted",
  });
  if (epErr) throw new Error(`event_participants seed failed: ${epErr.message}`);

  // The Plnr's session queries the event. Clause 2 fails (Plnr tenant != orgnz
  // tenant), clause 3 should grant via the participant helper.
  const { data, error } = await plnr.authedClient
    .from("events")
    .select("id")
    .eq("id", event.id);

  if (error && error.code === "42P17") {
    throw new Error(`42P17 recursion on plnr events query: ${error.message}`);
  }
  if (error) throw new Error(`unexpected error: ${error.message}`);
  if (!data || data.length !== 1) {
    throw new Error(`plnr should see event via participant; got ${data?.length ?? 0} rows`);
  }
}

/**
 * Plnr NOT on event CANNOT read it.
 *
 * Negative control for the prior test. A Plnr with no event_participants
 * row should fail all events_select clauses for this event.
 */
async function testPlnrNotParticipantCannotReadEvent() {
  const orgnz = await seedTestUser("orgnz");
  const plnr = await seedTestUser("plnr");

  const { data: event } = await adminClient
    .from("events")
    .insert({
      name: `RLS plnr-denied test ${TEST_RUN_ID}`,
      event_type: "wedding",
      orgnz_tenant_id: orgnz.tenantId,
      start_date: "2027-03-21",
      guest_count: 60,
      budget_cents: 600_000,
      status: "planning",
      timezone: "America/Chicago",
    })
    .select("id")
    .single();

  // No event_participants row created — Plnr is unrelated to this event.

  const { data, error } = await plnr.authedClient
    .from("events")
    .select("id")
    .eq("id", event.id);

  if (error && error.code === "42P17") {
    throw new Error(`42P17 recursion on unrelated-plnr query: ${error.message}`);
  }
  if (error) throw new Error(`unexpected error: ${error.message}`);
  if (data && data.length > 0) {
    throw new Error(`RLS LEAK: unrelated plnr saw event (${data.length} rows)`);
  }
}

/**
 * Cross-tenant mood_boards isolation.
 *
 * Exercises a different policy family (mood_boards / mood_board_members)
 * with its own visibility enum + complex EXISTS chains. Default visibility
 * is 'private' — owner only. Orgnz A creates board, Orgnz B should not see it.
 */
async function testCrossTenantMoodBoardIsolation() {
  const orgnzA = await seedTestUser("orgnz");
  const orgnzB = await seedTestUser("orgnz");

  const { data: board, error: boardErr } = await adminClient
    .from("mood_boards")
    .insert({
      owner_id: orgnzA.userId,
      tenant_id: orgnzA.tenantId,
      title: `RLS test board ${TEST_RUN_ID}`,
      visibility: "private",
    })
    .select("id")
    .single();
  if (boardErr) throw new Error(`mood_board seed failed: ${boardErr.message}`);

  // Orgnz B queries mood_boards — should NOT see Orgnz A's private board.
  const { data: bView, error: bErr } = await orgnzB.authedClient
    .from("mood_boards")
    .select("id")
    .eq("id", board.id);

  if (bErr && bErr.code === "42P17") {
    throw new Error(`42P17 recursion on cross-tenant mood_boards query: ${bErr.message}`);
  }
  if (bErr) throw new Error(`unexpected error from orgnz B query: ${bErr.message}`);
  if (bView && bView.length > 0) {
    throw new Error(`RLS LEAK: orgnz B saw orgnz A's private mood_board (${bView.length} rows)`);
  }

  // Positive control: Orgnz A CAN see their own board.
  const { data: aView, error: aErr } = await orgnzA.authedClient
    .from("mood_boards")
    .select("id")
    .eq("id", board.id);
  if (aErr) throw new Error(`orgnz A positive control failed: ${aErr.message}`);
  if (!aView || aView.length !== 1) {
    throw new Error(`orgnz A positive control: expected 1 row, got ${aView?.length ?? 0}`);
  }
}

/**
 * Cross-tenant mood_board_pins isolation.
 *
 * Peer-policy audit per PARKING_LOT #60 follow-up. mbp_select has an
 * inline EXISTS chain through mood_boards (and via mb_select clause 5,
 * could reach mood_board_members pre-035 — that path now goes through
 * the SECURITY DEFINER helper). Test verifies no recursion + no leak
 * for cross-tenant pin access.
 */
async function testCrossTenantMoodBoardPinsIsolation() {
  const orgnzA = await seedTestUser("orgnz");
  const orgnzB = await seedTestUser("orgnz");

  const { data: board } = await adminClient
    .from("mood_boards")
    .insert({
      owner_id: orgnzA.userId,
      tenant_id: orgnzA.tenantId,
      title: `RLS pins test board ${TEST_RUN_ID}`,
      visibility: "private",
    })
    .select("id")
    .single();

  const { data: pin, error: pinErr } = await adminClient
    .from("mood_board_pins")
    .insert({
      board_id: board.id,
      source: "upload",
      url: "https://example.test/rls-test-pin.jpg",
      added_by: orgnzA.userId,
    })
    .select("id")
    .single();
  if (pinErr) throw new Error(`pin seed failed: ${pinErr.message}`);

  // Orgnz B queries mood_board_pins — should NOT see Orgnz A's pin.
  const { data: bView, error: bErr } = await orgnzB.authedClient
    .from("mood_board_pins")
    .select("id")
    .eq("id", pin.id);

  if (bErr && bErr.code === "42P17") {
    throw new Error(`42P17 recursion on cross-tenant mood_board_pins query: ${bErr.message}`);
  }
  if (bErr) throw new Error(`unexpected error from orgnz B query: ${bErr.message}`);
  if (bView && bView.length > 0) {
    throw new Error(`RLS LEAK: orgnz B saw orgnz A's pin (${bView.length} rows)`);
  }

  // Positive control: Orgnz A CAN see their pin.
  const { data: aView, error: aErr } = await orgnzA.authedClient
    .from("mood_board_pins")
    .select("id")
    .eq("id", pin.id);
  if (aErr) throw new Error(`orgnz A positive control failed: ${aErr.message}`);
  if (!aView || aView.length !== 1) {
    throw new Error(`orgnz A positive control: expected 1 row, got ${aView?.length ?? 0}`);
  }
}

/**
 * Cross-tenant mood_board_comments isolation.
 *
 * Peer-policy audit per PARKING_LOT #60. mbc_select has the deepest
 * nested EXISTS chain — queries mood_boards which queries mood_board_members.
 * If any future change re-introduces the mb→mbm cycle, this is the test
 * that would catch it first because mbc_select forces both levels.
 */
async function testCrossTenantMoodBoardCommentsIsolation() {
  const orgnzA = await seedTestUser("orgnz");
  const orgnzB = await seedTestUser("orgnz");

  const { data: board } = await adminClient
    .from("mood_boards")
    .insert({
      owner_id: orgnzA.userId,
      tenant_id: orgnzA.tenantId,
      title: `RLS comments test board ${TEST_RUN_ID}`,
      visibility: "private",
    })
    .select("id")
    .single();

  const { data: comment, error: commentErr } = await adminClient
    .from("mood_board_comments")
    .insert({
      board_id: board.id,
      user_id: orgnzA.userId,
      body: `RLS test comment ${TEST_RUN_ID}`,
    })
    .select("id")
    .single();
  if (commentErr) throw new Error(`comment seed failed: ${commentErr.message}`);

  // Orgnz B queries mood_board_comments — should NOT see Orgnz A's comment.
  const { data: bView, error: bErr } = await orgnzB.authedClient
    .from("mood_board_comments")
    .select("id")
    .eq("id", comment.id);

  if (bErr && bErr.code === "42P17") {
    throw new Error(`42P17 recursion on cross-tenant mood_board_comments query: ${bErr.message}`);
  }
  if (bErr) throw new Error(`unexpected error from orgnz B query: ${bErr.message}`);
  if (bView && bView.length > 0) {
    throw new Error(`RLS LEAK: orgnz B saw orgnz A's comment (${bView.length} rows)`);
  }

  // Positive control: Orgnz A CAN see their comment.
  const { data: aView, error: aErr } = await orgnzA.authedClient
    .from("mood_board_comments")
    .select("id")
    .eq("id", comment.id);
  if (aErr) throw new Error(`orgnz A positive control failed: ${aErr.message}`);
  if (!aView || aView.length !== 1) {
    throw new Error(`orgnz A positive control: expected 1 row, got ${aView?.length ?? 0}`);
  }
}

/**
 * Cross-tenant mood_board_vendor_briefs isolation.
 *
 * Peer-policy audit per PARKING_LOT #60. mbvb_select gates on
 * vendor_tenant_id OR mood_boards ownership. An orgnz from a foreign
 * tenant (neither the vendor target nor a board member) should see
 * nothing.
 */
async function testCrossTenantMoodBoardVendorBriefsIsolation() {
  const orgnzA = await seedTestUser("orgnz");
  const venue = await seedTestUser("venue"); // the brief's vendor target
  const orgnzB = await seedTestUser("orgnz"); // the unrelated foreign tenant

  const { data: board } = await adminClient
    .from("mood_boards")
    .insert({
      owner_id: orgnzA.userId,
      tenant_id: orgnzA.tenantId,
      title: `RLS briefs test board ${TEST_RUN_ID}`,
      visibility: "private",
    })
    .select("id")
    .single();

  const { data: brief, error: briefErr } = await adminClient
    .from("mood_board_vendor_briefs")
    .insert({
      board_id: board.id,
      vendor_tenant_id: venue.tenantId,
      vndr_category: "venue",
      brief_text: `RLS test brief ${TEST_RUN_ID}`,
    })
    .select("id")
    .single();
  if (briefErr) throw new Error(`brief seed failed: ${briefErr.message}`);

  // Orgnz B (unrelated tenant) queries vendor briefs — should NOT see it.
  const { data: bView, error: bErr } = await orgnzB.authedClient
    .from("mood_board_vendor_briefs")
    .select("id")
    .eq("id", brief.id);

  if (bErr && bErr.code === "42P17") {
    throw new Error(`42P17 recursion on cross-tenant mood_board_vendor_briefs query: ${bErr.message}`);
  }
  if (bErr) throw new Error(`unexpected error from orgnz B query: ${bErr.message}`);
  if (bView && bView.length > 0) {
    throw new Error(`RLS LEAK: orgnz B saw vendor brief (${bView.length} rows)`);
  }

  // Positive control #1: Orgnz A (board owner) CAN see the brief.
  const { data: aView, error: aErr } = await orgnzA.authedClient
    .from("mood_board_vendor_briefs")
    .select("id")
    .eq("id", brief.id);
  if (aErr) throw new Error(`orgnz A positive control failed: ${aErr.message}`);
  if (!aView || aView.length !== 1) {
    throw new Error(`orgnz A positive control: expected 1 row, got ${aView?.length ?? 0}`);
  }

  // Positive control #2: the vendor target CAN see the brief.
  const { data: vView, error: vErr } = await venue.authedClient
    .from("mood_board_vendor_briefs")
    .select("id")
    .eq("id", brief.id);
  if (vErr) throw new Error(`vendor positive control failed: ${vErr.message}`);
  if (!vView || vView.length !== 1) {
    throw new Error(`vendor positive control: expected 1 row, got ${vView?.length ?? 0}`);
  }
}

/**
 * Cross-tenant bookings isolation — vndr A vs vndr B.
 *
 * Preemptive Vndr-port coverage per Hard Rule #8. Same code path as the
 * venue cross-tenant test (clause 2: vndr_tenant_id IN current_user_tenants)
 * but with vndr role specifically. If a future migration ever filters
 * bookings_select by role-type, this test would surface the divergence.
 */
async function testCrossTenantBookingsVndrIsolation() {
  const orgnz = await seedTestUser("orgnz");
  const vndrA = await seedTestUser("vndr");
  const vndrB = await seedTestUser("vndr");

  const { data: event } = await adminClient
    .from("events")
    .insert({
      name: `RLS vndr bookings test ${TEST_RUN_ID}`,
      event_type: "wedding",
      orgnz_tenant_id: orgnz.tenantId,
      start_date: "2027-05-30",
      guest_count: 120,
      budget_cents: 1_200_000,
      status: "planning",
      timezone: "America/Chicago",
    })
    .select("id")
    .single();

  const { data: aBooking, error: aBookingErr } = await adminClient
    .from("bookings")
    .insert({
      event_id: event.id,
      vndr_tenant_id: vndrA.tenantId,
      vndr_type: "florist",
      status: "confirmed",
      subtotal_cents: 50_000,
      platform_fee_cents: 1_250,
      total_cents: 51_250,
      deposit_pct: 25,
      currency: "USD",
    })
    .select("id")
    .single();
  if (aBookingErr) throw new Error(`vndr A booking seed failed: ${aBookingErr.message}`);

  // Vndr B queries bookings — should NOT see Vndr A's booking.
  const { data: bView, error: bErr } = await vndrB.authedClient
    .from("bookings")
    .select("id")
    .eq("id", aBooking.id);

  if (bErr && bErr.code === "42P17") {
    throw new Error(`42P17 recursion on cross-vndr bookings query: ${bErr.message}`);
  }
  if (bErr) throw new Error(`unexpected error from vndr B query: ${bErr.message}`);
  if (bView && bView.length > 0) {
    throw new Error(`RLS LEAK: vndr B saw vndr A's booking (${bView.length} rows)`);
  }

  // Positive control: Vndr A CAN see their own booking.
  const { data: aView, error: aErr } = await vndrA.authedClient
    .from("bookings")
    .select("id")
    .eq("id", aBooking.id);
  if (aErr) throw new Error(`vndr A positive control failed: ${aErr.message}`);
  if (!aView || aView.length !== 1) {
    throw new Error(`vndr A positive control: expected 1 row, got ${aView?.length ?? 0}`);
  }
}

/**
 * Cross-tenant booking_inquiries isolation — vndr A vs vndr B.
 *
 * booking_inquiries has vndr_tenant_id as the receiver. Migration 028
 * renamed the status enum + added edge_flag column. Suite verifies the
 * vndr-side read path works (vndr A sees their inquiry) and is isolated
 * (vndr B doesn't see it).
 */
async function testCrossTenantBookingInquiriesVndrIsolation() {
  const orgnz = await seedTestUser("orgnz");
  const vndrA = await seedTestUser("vndr");
  const vndrB = await seedTestUser("vndr");

  const { data: event } = await adminClient
    .from("events")
    .insert({
      name: `RLS vndr inq test ${TEST_RUN_ID}`,
      event_type: "wedding",
      orgnz_tenant_id: orgnz.tenantId,
      start_date: "2027-06-12",
      guest_count: 90,
      budget_cents: 900_000,
      status: "planning",
      timezone: "America/Chicago",
    })
    .select("id")
    .single();

  const { data: inquiry, error: inquiryErr } = await adminClient
    .from("booking_inquiries")
    .insert({
      event_id: event.id,
      orgnz_tenant_id: orgnz.tenantId,
      vndr_tenant_id: vndrA.tenantId,
      event_date: "2027-06-12",
      guest_count: 90,
      message: `RLS test inquiry ${TEST_RUN_ID}`,
      status: "inquiry",
    })
    .select("id")
    .single();
  if (inquiryErr) throw new Error(`booking_inquiry seed failed: ${inquiryErr.message}`);

  // Vndr B queries booking_inquiries — should NOT see Vndr A's inquiry.
  const { data: bView, error: bErr } = await vndrB.authedClient
    .from("booking_inquiries")
    .select("id")
    .eq("id", inquiry.id);

  if (bErr && bErr.code === "42P17") {
    throw new Error(`42P17 recursion on cross-vndr booking_inquiries query: ${bErr.message}`);
  }
  if (bErr) throw new Error(`unexpected error from vndr B query: ${bErr.message}`);
  if (bView && bView.length > 0) {
    throw new Error(`RLS LEAK: vndr B saw vndr A's inquiry (${bView.length} rows)`);
  }

  // Positive control: Vndr A CAN see their own inquiry.
  const { data: aView, error: aErr } = await vndrA.authedClient
    .from("booking_inquiries")
    .select("id")
    .eq("id", inquiry.id);
  if (aErr) throw new Error(`vndr A positive control failed: ${aErr.message}`);
  if (!aView || aView.length !== 1) {
    throw new Error(`vndr A positive control: expected 1 row, got ${aView?.length ?? 0}`);
  }

  // Positive control: Orgnz who sent the inquiry CAN also see it.
  const { data: oView, error: oErr } = await orgnz.authedClient
    .from("booking_inquiries")
    .select("id")
    .eq("id", inquiry.id);
  if (oErr) throw new Error(`orgnz positive control failed: ${oErr.message}`);
  if (!oView || oView.length !== 1) {
    throw new Error(`orgnz positive control: expected 1 row, got ${oView?.length ?? 0}`);
  }
}

/**
 * Vndr accepted on event_participants CAN read event.
 *
 * Parallel to test 5 (plnr_lead path) but with vndr role. Vndr is in
 * event_role enum, so vndr-on-event_participants is a legal state. The
 * test verifies events_select clause 3 (user_is_event_participant) grants
 * vndr the same access as plnr when vndr's tenant is accepted on the event.
 *
 * This is a "doesn't short-circuit" case for vndr role — vndr's tenant
 * fails clause 2 (orgnz match), so the planner forces evaluation of
 * clause 3. Per Hard Rule #8, this is the kind of role configuration
 * that historically surfaces latent recursion bugs.
 */
async function testVndrParticipantCanReadEvent() {
  const orgnz = await seedTestUser("orgnz");
  const vndr = await seedTestUser("vndr");

  const { data: event } = await adminClient
    .from("events")
    .insert({
      name: `RLS vndr participant test ${TEST_RUN_ID}`,
      event_type: "wedding",
      orgnz_tenant_id: orgnz.tenantId,
      start_date: "2027-08-08",
      guest_count: 75,
      budget_cents: 750_000,
      status: "planning",
      timezone: "America/Chicago",
    })
    .select("id")
    .single();

  const { error: epErr } = await adminClient.from("event_participants").insert({
    event_id: event.id,
    tenant_id: vndr.tenantId,
    role: "vndr",
    status: "accepted",
  });
  if (epErr) throw new Error(`event_participants seed failed: ${epErr.message}`);

  // Vndr session queries the event. Clause 2 fails (vndr tenant != orgnz),
  // clause 3 should grant via user_is_event_participant helper.
  const { data, error } = await vndr.authedClient
    .from("events")
    .select("id")
    .eq("id", event.id);

  if (error && error.code === "42P17") {
    throw new Error(`42P17 recursion on vndr-participant events query: ${error.message}`);
  }
  if (error) throw new Error(`unexpected error: ${error.message}`);
  if (!data || data.length !== 1) {
    throw new Error(`vndr should see event via participant; got ${data?.length ?? 0} rows`);
  }
}

/**
 * Catr accepted on event_participants CAN read event.
 *
 * Mirrors testVndrParticipantCanReadEvent for the catr role. tenant_type
 * and event_role enums both have a literal 'catr' value (see
 * 001_evntcue_consolidated_schema.sql lines 24, 34). This is the same
 * "doesn't short-circuit" pattern Hard Rule #8 targets — catr's tenant
 * fails events_select clause 2 (orgnz match), forcing the planner to
 * evaluate clause 3 (user_is_event_participant). Catr coverage was a
 * pre-launch gap until this test landed.
 */
async function testCatrParticipantCanReadEvent() {
  const orgnz = await seedTestUser("orgnz");
  const catr = await seedTestUser("catr");

  const { data: event } = await adminClient
    .from("events")
    .insert({
      name: `RLS catr participant test ${TEST_RUN_ID}`,
      event_type: "wedding",
      orgnz_tenant_id: orgnz.tenantId,
      start_date: "2027-09-04",
      guest_count: 140,
      budget_cents: 1_400_000,
      status: "planning",
      timezone: "America/Chicago",
    })
    .select("id")
    .single();

  const { error: epErr } = await adminClient.from("event_participants").insert({
    event_id: event.id,
    tenant_id: catr.tenantId,
    role: "catr",
    status: "accepted",
  });
  if (epErr) throw new Error(`event_participants seed failed: ${epErr.message}`);

  const { data, error } = await catr.authedClient
    .from("events")
    .select("id")
    .eq("id", event.id);

  if (error && error.code === "42P17") {
    throw new Error(`42P17 recursion on catr-participant events query: ${error.message}`);
  }
  if (error) throw new Error(`unexpected error: ${error.message}`);
  if (!data || data.length !== 1) {
    throw new Error(`catr should see event via participant; got ${data?.length ?? 0} rows`);
  }
}

/**
 * Catr NOT on event CANNOT read it.
 *
 * Negative control mirroring testPlnrNotParticipantCannotReadEvent. catr
 * with no event_participants row should see zero rows when querying the
 * event. Both clause 2 (orgnz match) and clause 3 (participant) must
 * deny — if either leaks, the test fails.
 */
async function testCatrNotParticipantCannotReadEvent() {
  const orgnz = await seedTestUser("orgnz");
  const catr = await seedTestUser("catr");

  const { data: event } = await adminClient
    .from("events")
    .insert({
      name: `RLS catr denied test ${TEST_RUN_ID}`,
      event_type: "wedding",
      orgnz_tenant_id: orgnz.tenantId,
      start_date: "2027-10-15",
      guest_count: 80,
      budget_cents: 800_000,
      status: "planning",
      timezone: "America/Chicago",
    })
    .select("id")
    .single();

  // No event_participants row — catr has no relation to this event.

  const { data, error } = await catr.authedClient
    .from("events")
    .select("id")
    .eq("id", event.id);

  if (error && error.code === "42P17") {
    throw new Error(`42P17 recursion on catr-denied events query: ${error.message}`);
  }
  if (error) throw new Error(`unexpected error: ${error.message}`);
  if (data && data.length > 0) {
    throw new Error(`RLS LEAK: catr saw event with no participant row (${data.length} rows)`);
  }
}

/**
 * Cross-tenant bookings isolation — catr A vs catr B.
 *
 * Mirrors testCrossTenantBookingsVndrIsolation for catr role. Catr A
 * has a confirmed booking on an orgnz event; catr B queries bookings
 * and must see nothing. Positive control: catr A sees their own.
 */
async function testCrossTenantBookingsCatrIsolation() {
  const orgnz = await seedTestUser("orgnz");
  const catrA = await seedTestUser("catr");
  const catrB = await seedTestUser("catr");

  const { data: event } = await adminClient
    .from("events")
    .insert({
      name: `RLS catr bookings test ${TEST_RUN_ID}`,
      event_type: "wedding",
      orgnz_tenant_id: orgnz.tenantId,
      start_date: "2027-11-06",
      guest_count: 110,
      budget_cents: 1_100_000,
      status: "planning",
      timezone: "America/Chicago",
    })
    .select("id")
    .single();

  const { data: aBooking, error: aBookingErr } = await adminClient
    .from("bookings")
    .insert({
      event_id: event.id,
      vndr_tenant_id: catrA.tenantId,
      vndr_type: "catr",
      status: "confirmed",
      subtotal_cents: 80_000,
      platform_fee_cents: 2_000,
      total_cents: 82_000,
      deposit_pct: 25,
      currency: "USD",
    })
    .select("id")
    .single();
  if (aBookingErr) throw new Error(`catr A booking seed failed: ${aBookingErr.message}`);

  // Catr B queries bookings — should NOT see Catr A's booking.
  const { data: bView, error: bErr } = await catrB.authedClient
    .from("bookings")
    .select("id")
    .eq("id", aBooking.id);

  if (bErr && bErr.code === "42P17") {
    throw new Error(`42P17 recursion on cross-catr bookings query: ${bErr.message}`);
  }
  if (bErr) throw new Error(`unexpected error from catr B query: ${bErr.message}`);
  if (bView && bView.length > 0) {
    throw new Error(`RLS LEAK: catr B saw catr A's booking (${bView.length} rows)`);
  }

  // Positive control: Catr A CAN see their own booking.
  const { data: aView, error: aErr } = await catrA.authedClient
    .from("bookings")
    .select("id")
    .eq("id", aBooking.id);
  if (aErr) throw new Error(`catr A positive control failed: ${aErr.message}`);
  if (!aView || aView.length !== 1) {
    throw new Error(`catr A positive control: expected 1 row, got ${aView?.length ?? 0}`);
  }
}

/**
 * Cross-tenant booking_inquiries isolation — catr A vs catr B.
 *
 * Mirrors testCrossTenantBookingInquiriesVndrIsolation for catr role.
 * Three assertions: (1) catr B cannot see catr A's inquiry, (2) catr A
 * can see their own, (3) the sending orgnz can also see it (preserves
 * the inquiry-thread visibility model).
 */
async function testCrossTenantBookingInquiriesCatrIsolation() {
  const orgnz = await seedTestUser("orgnz");
  const catrA = await seedTestUser("catr");
  const catrB = await seedTestUser("catr");

  const { data: event } = await adminClient
    .from("events")
    .insert({
      name: `RLS catr inq test ${TEST_RUN_ID}`,
      event_type: "wedding",
      orgnz_tenant_id: orgnz.tenantId,
      start_date: "2027-12-04",
      guest_count: 130,
      budget_cents: 1_300_000,
      status: "planning",
      timezone: "America/Chicago",
    })
    .select("id")
    .single();

  const { data: inquiry, error: inquiryErr } = await adminClient
    .from("booking_inquiries")
    .insert({
      event_id: event.id,
      orgnz_tenant_id: orgnz.tenantId,
      vndr_tenant_id: catrA.tenantId,
      event_date: "2027-12-04",
      guest_count: 130,
      message: `RLS test catr inquiry ${TEST_RUN_ID}`,
      status: "inquiry",
    })
    .select("id")
    .single();
  if (inquiryErr) throw new Error(`booking_inquiry seed failed: ${inquiryErr.message}`);

  // Catr B queries booking_inquiries — should NOT see Catr A's inquiry.
  const { data: bView, error: bErr } = await catrB.authedClient
    .from("booking_inquiries")
    .select("id")
    .eq("id", inquiry.id);

  if (bErr && bErr.code === "42P17") {
    throw new Error(`42P17 recursion on cross-catr booking_inquiries query: ${bErr.message}`);
  }
  if (bErr) throw new Error(`unexpected error from catr B query: ${bErr.message}`);
  if (bView && bView.length > 0) {
    throw new Error(`RLS LEAK: catr B saw catr A's inquiry (${bView.length} rows)`);
  }

  // Positive control: Catr A CAN see their own inquiry.
  const { data: aView, error: aErr } = await catrA.authedClient
    .from("booking_inquiries")
    .select("id")
    .eq("id", inquiry.id);
  if (aErr) throw new Error(`catr A positive control failed: ${aErr.message}`);
  if (!aView || aView.length !== 1) {
    throw new Error(`catr A positive control: expected 1 row, got ${aView?.length ?? 0}`);
  }

  // Positive control: Orgnz who sent the inquiry CAN also see it.
  const { data: oView, error: oErr } = await orgnz.authedClient
    .from("booking_inquiries")
    .select("id")
    .eq("id", inquiry.id);
  if (oErr) throw new Error(`orgnz positive control failed: ${oErr.message}`);
  if (!oView || oView.length !== 1) {
    throw new Error(`orgnz positive control: expected 1 row, got ${oView?.length ?? 0}`);
  }
}

/**
 * Cross-plnr plnr_clients isolation — Bucket-3 PII (names, contact, notes).
 *
 * pc_select policy: `is_admin() OR plnr_tenant_id IN current_user_tenants()`.
 * Simple per-tenant filter, but plnr_clients carries Bucket-3 fields
 * (client_email, client_phone, plnr_notes). A leak across plnr tenants
 * would expose competitor CRM data. Test: plnr A inserts a client; plnr B
 * queries → zero rows. Plnr A sees their own row.
 */
async function testCrossPlnrClientsIsolation() {
  const plnrA = await seedTestUser("plnr");
  const plnrB = await seedTestUser("plnr");

  const { data: client, error: seedErr } = await adminClient
    .from("plnr_clients")
    .insert({
      plnr_tenant_id: plnrA.tenantId,
      client_name: `RLS test client ${TEST_RUN_ID}`,
      client_email: `rls-client-${TEST_RUN_ID}@test.evntcue.local`,
      plnr_notes: "Sensitive CRM notes — must not leak across plnr tenants.",
    })
    .select("id")
    .single();
  if (seedErr) throw new Error(`plnr_clients seed failed: ${seedErr.message}`);

  // Plnr B queries plnr_clients — should see zero of plnr A's rows.
  const { data: bView, error: bErr } = await plnrB.authedClient
    .from("plnr_clients")
    .select("id")
    .eq("id", client.id);

  if (bErr && bErr.code === "42P17") {
    throw new Error(`42P17 recursion on cross-plnr plnr_clients query: ${bErr.message}`);
  }
  if (bErr) throw new Error(`unexpected error from plnr B query: ${bErr.message}`);
  if (bView && bView.length > 0) {
    throw new Error(`RLS LEAK: plnr B saw plnr A's client row (${bView.length} rows)`);
  }

  // Positive control: plnr A CAN see their own client.
  const { data: aView, error: aErr } = await plnrA.authedClient
    .from("plnr_clients")
    .select("id")
    .eq("id", client.id);
  if (aErr) throw new Error(`plnr A positive control failed: ${aErr.message}`);
  if (!aView || aView.length !== 1) {
    throw new Error(`plnr A positive control: expected 1 row, got ${aView?.length ?? 0}`);
  }
}

/**
 * Cross-tenant commission_flows isolation — money table.
 *
 * Two SELECT policies on commission_flows (cf_select from 001, overlaid by
 * commission_flows_read_own from 014). Both must combine to deny unrelated
 * orgnz access. Test: orgnz A's event has a commission_flow row (from_party
 * = orgnz A, to_party = vndr X). Orgnz B (unrelated tenant, no event
 * participation, not a plnr) queries → zero rows. Positive: orgnz A sees it.
 */
async function testCrossTenantCommissionFlowsIsolation() {
  const orgnzA = await seedTestUser("orgnz");
  const orgnzB = await seedTestUser("orgnz");
  const vndr = await seedTestUser("vndr");

  const { data: event } = await adminClient
    .from("events")
    .insert({
      name: `RLS commission test ${TEST_RUN_ID}`,
      event_type: "wedding",
      orgnz_tenant_id: orgnzA.tenantId,
      start_date: "2027-07-22",
      guest_count: 100,
      budget_cents: 1_000_000,
      status: "planning",
      timezone: "America/Chicago",
    })
    .select("id")
    .single();

  const { data: flow, error: flowErr } = await adminClient
    .from("commission_flows")
    .insert({
      event_id: event.id,
      type: "vndr_referral",
      from_party: orgnzA.tenantId,
      to_party: vndr.tenantId,
      amount_cents: 5_000,
      basis_amount_cents: 100_000,
      is_disclosed: true,
      status: "pending",
    })
    .select("id")
    .single();
  if (flowErr) throw new Error(`commission_flows seed failed: ${flowErr.message}`);

  // Orgnz B queries commission_flows — should NOT see orgnz A's flow.
  const { data: bView, error: bErr } = await orgnzB.authedClient
    .from("commission_flows")
    .select("id")
    .eq("id", flow.id);

  if (bErr && bErr.code === "42P17") {
    throw new Error(`42P17 recursion on cross-tenant commission_flows query: ${bErr.message}`);
  }
  if (bErr) throw new Error(`unexpected error from orgnz B query: ${bErr.message}`);
  if (bView && bView.length > 0) {
    throw new Error(`RLS LEAK: orgnz B saw orgnz A's commission flow (${bView.length} rows)`);
  }

  // Positive: orgnz A is the from_party → cf_select clause grants.
  const { data: aView, error: aErr } = await orgnzA.authedClient
    .from("commission_flows")
    .select("id")
    .eq("id", flow.id);
  if (aErr) throw new Error(`orgnz A positive control failed: ${aErr.message}`);
  if (!aView || aView.length !== 1) {
    throw new Error(`orgnz A positive control: expected 1 row, got ${aView?.length ?? 0}`);
  }

  // Positive: vndr is the to_party → cf_select clause grants.
  const { data: vView, error: vErr } = await vndr.authedClient
    .from("commission_flows")
    .select("id")
    .eq("id", flow.id);
  if (vErr) throw new Error(`vndr positive control failed: ${vErr.message}`);
  if (!vView || vView.length !== 1) {
    throw new Error(`vndr positive control (to_party): expected 1 row, got ${vView?.length ?? 0}`);
  }
}

/**
 * Non-participant cannot read guest_accommodations — Bucket-3 PII.
 *
 * ga_select uses on_event(event_id) helper: TRUE if user is the orgnz of
 * the event OR an accepted event_participant OR is_admin. guest_accommodations
 * carries dietary_restrictions, mobility_needs, accessibility_notes —
 * Bucket-3 sensitive. Test: orgnz A's event has a guest + accommodation row.
 * Orgnz B (no relation) queries → zero rows. Orgnz A sees it.
 */
async function testNonParticipantCannotReadGuestAccommodations() {
  const orgnzA = await seedTestUser("orgnz");
  const orgnzB = await seedTestUser("orgnz");

  const { data: event } = await adminClient
    .from("events")
    .insert({
      name: `RLS guest_accom test ${TEST_RUN_ID}`,
      event_type: "wedding",
      orgnz_tenant_id: orgnzA.tenantId,
      start_date: "2027-08-15",
      guest_count: 60,
      budget_cents: 600_000,
      status: "planning",
      timezone: "America/Chicago",
    })
    .select("id")
    .single();

  const { data: guest, error: guestErr } = await adminClient
    .from("guests")
    .insert({
      event_id: event.id,
      full_name: `RLS test guest ${TEST_RUN_ID}`,
    })
    .select("id")
    .single();
  if (guestErr) throw new Error(`guests seed failed: ${guestErr.message}`);

  const { data: accom, error: accomErr } = await adminClient
    .from("guest_accommodations")
    .insert({
      guest_id: guest.id,
      event_id: event.id,
      dietary_restrictions: ["vegan", "nut-allergy"],
      mobility_needs: "Wheelchair-accessible seating",
      accessibility_notes: "Sensitive PII — must not leak across tenants.",
    })
    .select("id")
    .single();
  if (accomErr) throw new Error(`guest_accommodations seed failed: ${accomErr.message}`);

  // Orgnz B queries guest_accommodations — should NOT see orgnz A's row.
  const { data: bView, error: bErr } = await orgnzB.authedClient
    .from("guest_accommodations")
    .select("id")
    .eq("id", accom.id);

  if (bErr && bErr.code === "42P17") {
    throw new Error(`42P17 recursion on cross-tenant guest_accommodations query: ${bErr.message}`);
  }
  if (bErr) throw new Error(`unexpected error from orgnz B query: ${bErr.message}`);
  if (bView && bView.length > 0) {
    throw new Error(`RLS LEAK: orgnz B saw orgnz A's guest accommodations (${bView.length} rows)`);
  }

  // Positive: orgnz A (event owner) CAN see via on_event() path.
  const { data: aView, error: aErr } = await orgnzA.authedClient
    .from("guest_accommodations")
    .select("id")
    .eq("id", accom.id);
  if (aErr) throw new Error(`orgnz A positive control failed: ${aErr.message}`);
  if (!aView || aView.length !== 1) {
    throw new Error(`orgnz A positive control: expected 1 row, got ${aView?.length ?? 0}`);
  }
}

/**
 * Mood Board Chunk A write-path test — authed-client INSERT/UPDATE/cross-tenant denial.
 *
 * Test #7 (testCrossTenantMoodBoardIsolation) seeds boards via admin client
 * and tests SELECT isolation. This test exercises the WRITE path Chunk A
 * introduces — the user's authed client creating their own mood_board via
 * the mb_insert policy, updating it via mb_update, and being denied on
 * cross-tenant writes.
 *
 * Policies under test (from 005_mood_boards.sql):
 *   mb_insert: WITH CHECK (tenant_id IN current_user_tenants() AND owner_id = auth.uid())
 *   mb_update: USING (is_admin() OR owner_id = auth.uid() OR member role IN ('owner','editor'))
 *
 * Assertions:
 *   1. Orgnz A's authed client CAN insert a mood_board on their own tenant.
 *   2. Orgnz A's authed client CAN update their own board.
 *   3. Orgnz B's authed client CANNOT insert a board with owner_id pointing to A
 *      (mb_insert WITH CHECK fails on owner_id != auth.uid()).
 *   4. Orgnz B's authed client CANNOT update Orgnz A's board (mb_update USING fails).
 */
async function testMoodBoardWritePathChunkA() {
  const orgnzA = await seedTestUser("orgnz");
  const orgnzB = await seedTestUser("orgnz");

  // 1. Orgnz A creates their own board via authed client.
  const { data: aBoard, error: aInsertErr } = await orgnzA.authedClient
    .from("mood_boards")
    .insert({
      owner_id: orgnzA.userId,
      tenant_id: orgnzA.tenantId,
      title: `RLS Chunk A write test ${TEST_RUN_ID}`,
      visibility: "private",
    })
    .select("id")
    .single();
  if (aInsertErr) {
    throw new Error(`orgnz A self-insert failed (mb_insert should grant): ${aInsertErr.message}`);
  }
  if (!aBoard?.id) throw new Error(`orgnz A insert returned no id`);

  // 2. Orgnz A updates their own board.
  const { error: aUpdateErr } = await orgnzA.authedClient
    .from("mood_boards")
    .update({ title: `RLS Chunk A renamed ${TEST_RUN_ID}` })
    .eq("id", aBoard.id);
  if (aUpdateErr) {
    throw new Error(`orgnz A self-update failed (mb_update should grant): ${aUpdateErr.message}`);
  }

  // 3. Orgnz B cannot insert with owner_id pointing to A's user.
  //    mb_insert WITH CHECK requires owner_id = auth.uid() — should fail.
  const { data: bSpoofInsert, error: bSpoofErr } = await orgnzB.authedClient
    .from("mood_boards")
    .insert({
      owner_id: orgnzA.userId,         // attempting to spoof owner
      tenant_id: orgnzB.tenantId,
      title: `RLS spoof attempt ${TEST_RUN_ID}`,
      visibility: "private",
    })
    .select("id");

  if (bSpoofErr && bSpoofErr.code === "42P17") {
    throw new Error(`42P17 recursion on cross-tenant mb_insert: ${bSpoofErr.message}`);
  }
  // Expect either an RLS error (preferred) OR a silent zero-rows return.
  // Postgres RLS WITH CHECK failures surface as PostgREST error code 42501
  // ("new row violates row-level security policy") — that's success here.
  if (!bSpoofErr && bSpoofInsert && bSpoofInsert.length > 0) {
    throw new Error(`RLS LEAK: orgnz B spoof-insert succeeded with owner_id=A`);
  }

  // 4. Orgnz B cannot update Orgnz A's board.
  //    mb_update USING denies (B is not admin, not owner, not a member).
  //    Update with eq() filter returns zero rows on RLS denial (no error).
  const { data: bUpdate, error: bUpdateErr } = await orgnzB.authedClient
    .from("mood_boards")
    .update({ title: `RLS HIJACK ATTEMPT ${TEST_RUN_ID}` })
    .eq("id", aBoard.id)
    .select("id");

  if (bUpdateErr && bUpdateErr.code === "42P17") {
    throw new Error(`42P17 recursion on cross-tenant mb_update: ${bUpdateErr.message}`);
  }
  if (bUpdate && bUpdate.length > 0) {
    throw new Error(`RLS LEAK: orgnz B updated orgnz A's board (${bUpdate.length} rows affected)`);
  }

  // 5. Sanity: re-read the board as A and confirm the title wasn't hijacked.
  const { data: aReread, error: aRereadErr } = await orgnzA.authedClient
    .from("mood_boards")
    .select("title")
    .eq("id", aBoard.id)
    .single();
  if (aRereadErr) throw new Error(`orgnz A re-read failed: ${aRereadErr.message}`);
  if (!aReread || aReread.title.includes("HIJACK")) {
    throw new Error(`RLS LEAK: B's hijack attempt actually mutated A's board title`);
  }
}

// -----------------------------------------------------------------------------
// TEST: vendors (migration 041) — vndr can read own row.
// -----------------------------------------------------------------------------
// Positive control: with Door A live, the vendors table is the canonical
// vndr-profile row. vendors_select (migration 041) grants is_admin() OR
// user_owns_vendor(id). A vndr authed against their own tenant must read
// their own row, otherwise the dashboard discovery query (V-2) would
// silently return empty.
async function testVndrReadOwnVendorRow() {
  const vndr = await seedTestUser("vndr");
  const { data: vendor, error: insErr } = await adminClient
    .from("vendors")
    .insert({
      tenant_id: vndr.tenantId,
      display_name: `RLS vndr own ${TEST_RUN_ID}`,
      claim_status: "published",
      acquisition_lane: "self_serve",
      claimed_at: new Date().toISOString(),
    })
    .select("id")
    .single();
  if (insErr || !vendor) {
    throw new Error(`seed vendor insert failed: ${insErr?.message}`);
  }

  const { data: read, error: readErr } = await vndr.authedClient
    .from("vendors")
    .select("id, display_name")
    .eq("id", vendor.id)
    .maybeSingle();

  if (readErr && readErr.code === "42P17") {
    throw new Error(`42P17 recursion on vendors_select for own row: ${readErr.message}`);
  }
  if (readErr) throw new Error(`vndr self-read on vendors failed: ${readErr.message}`);
  if (!read) {
    throw new Error(`RLS DENY: vndr cannot read own vendors row (vendors_select misgrant)`);
  }
}

// -----------------------------------------------------------------------------
// TEST: vendors — vndr A CANNOT read vndr B's row (cross-tenant isolation).
// -----------------------------------------------------------------------------
// user_owns_vendor() is the canonical helper. If a future migration introduces
// a clause that doesn't short-circuit on the tenant gate, this test catches it.
async function testVndrCrossTenantVendorsIsolation() {
  const vndrA = await seedTestUser("vndr");
  const vndrB = await seedTestUser("vndr");

  const { data: bVendor, error: insErr } = await adminClient
    .from("vendors")
    .insert({
      tenant_id: vndrB.tenantId,
      display_name: `RLS vndr B private ${TEST_RUN_ID}`,
      claim_status: "published",
      acquisition_lane: "warm_intro",
      claimed_at: new Date().toISOString(),
    })
    .select("id")
    .single();
  if (insErr || !bVendor) throw new Error(`seed vendor B insert failed: ${insErr?.message}`);

  const { data: leak, error: readErr } = await vndrA.authedClient
    .from("vendors")
    .select("id, display_name")
    .eq("id", bVendor.id)
    .maybeSingle();

  if (readErr && readErr.code === "42P17") {
    throw new Error(`42P17 recursion on cross-tenant vendors_select: ${readErr.message}`);
  }
  if (leak) {
    throw new Error(
      `RLS LEAK: vndr A read vndr B's vendors row (display_name=${leak.display_name})`,
    );
  }
}

// -----------------------------------------------------------------------------
// TEST: vndr_packages — vndr can INSERT own package; cross-tenant denied.
// -----------------------------------------------------------------------------
// vp_select is USING (TRUE) by design (public marketplace catalog), so the
// adversarial path lives on the WRITE side. vp_write USING + WITH CHECK
// both require tenant_id IN current_user_tenants(). This test exercises
// both: own-tenant INSERT must succeed; cross-tenant INSERT (spoofing
// tenant_id = B) must fail with 42501 or zero-rows return.
async function testVndrPackagesWriteOwnTenant() {
  const vndr = await seedTestUser("vndr");

  const { data: pkg, error: insErr } = await vndr.authedClient
    .from("vndr_packages")
    .insert({
      tenant_id: vndr.tenantId,
      name: `RLS vndr pkg ${TEST_RUN_ID}`,
      price_cents: 250000,
      deposit_pct: 25,
    })
    .select("id")
    .single();

  if (insErr && insErr.code === "42P17") {
    throw new Error(`42P17 recursion on vp_write own-tenant INSERT: ${insErr.message}`);
  }
  if (insErr) throw new Error(`vndr self-insert on vndr_packages failed: ${insErr.message}`);
  if (!pkg?.id) throw new Error(`vndr self-insert returned no id`);
}

async function testVndrPackagesWriteCrossTenantDenied() {
  const vndrA = await seedTestUser("vndr");
  const vndrB = await seedTestUser("vndr");

  // 1. vndr A tries to insert a package under vndr B's tenant — vp_write
  //    WITH CHECK should deny.
  const { data: spoof, error: spoofErr } = await vndrA.authedClient
    .from("vndr_packages")
    .insert({
      tenant_id: vndrB.tenantId,
      name: `RLS spoof pkg ${TEST_RUN_ID}`,
      price_cents: 100,
      deposit_pct: 0,
    })
    .select("id");

  if (spoofErr && spoofErr.code === "42P17") {
    throw new Error(`42P17 recursion on cross-tenant vp_write INSERT: ${spoofErr.message}`);
  }
  if (!spoofErr && spoof && spoof.length > 0) {
    throw new Error(`RLS LEAK: vndr A inserted vndr_packages row under vndr B's tenant`);
  }

  // 2. Seed a real package on B (via admin), then confirm A cannot UPDATE it.
  //    vp_write USING denies — UPDATE returns zero rows.
  const { data: bPkg, error: bInsErr } = await adminClient
    .from("vndr_packages")
    .insert({
      tenant_id: vndrB.tenantId,
      name: `RLS vndr B real pkg ${TEST_RUN_ID}`,
      price_cents: 500000,
      deposit_pct: 25,
    })
    .select("id")
    .single();
  if (bInsErr || !bPkg) throw new Error(`seed vndr B pkg failed: ${bInsErr?.message}`);

  const { data: hijack, error: hijackErr } = await vndrA.authedClient
    .from("vndr_packages")
    .update({ name: `RLS HIJACKED ${TEST_RUN_ID}` })
    .eq("id", bPkg.id)
    .select("id");

  if (hijackErr && hijackErr.code === "42P17") {
    throw new Error(`42P17 recursion on cross-tenant vp_write UPDATE: ${hijackErr.message}`);
  }
  if (hijack && hijack.length > 0) {
    throw new Error(`RLS LEAK: vndr A updated vndr B's vndr_packages row`);
  }
}

// -----------------------------------------------------------------------------
// Test array — append more tests here as new role/table combos are covered.
// -----------------------------------------------------------------------------
const TESTS = [
  { name: "Migration 034 regression (venue role + events join, no 42P17)", fn: testMigration034Regression },
  { name: "Cross-tenant events isolation (orgnz A vs orgnz B)", fn: testCrossTenantEventIsolation },
  { name: "Cross-tenant bookings isolation (venue A vs venue B)", fn: testCrossTenantBookingsIsolation },
  { name: "Cross-tenant venue_inquiries isolation (venue A vs venue B)", fn: testCrossTenantVenueInquiriesIsolation },
  { name: "Plnr accepted on event CAN read event (event_participants path)", fn: testPlnrParticipantCanReadEvent },
  { name: "Plnr NOT on event CANNOT read it (negative control)", fn: testPlnrNotParticipantCannotReadEvent },
  { name: "Cross-tenant mood_boards isolation (orgnz A vs orgnz B, private board)", fn: testCrossTenantMoodBoardIsolation },
  { name: "Cross-tenant mood_board_pins isolation (orgnz A vs orgnz B)", fn: testCrossTenantMoodBoardPinsIsolation },
  { name: "Cross-tenant mood_board_comments isolation (orgnz A vs orgnz B)", fn: testCrossTenantMoodBoardCommentsIsolation },
  { name: "Cross-tenant mood_board_vendor_briefs isolation (orgnz B vs vendor target)", fn: testCrossTenantMoodBoardVendorBriefsIsolation },
  { name: "Cross-tenant bookings isolation — vndr role (vndr A vs vndr B)", fn: testCrossTenantBookingsVndrIsolation },
  { name: "Cross-tenant booking_inquiries isolation — vndr role (vndr A vs vndr B)", fn: testCrossTenantBookingInquiriesVndrIsolation },
  { name: "Vndr accepted on event CAN read event (event_participants path)", fn: testVndrParticipantCanReadEvent },
  { name: "Catr accepted on event CAN read event (event_participants path)", fn: testCatrParticipantCanReadEvent },
  { name: "Catr NOT on event CANNOT read it (negative control)", fn: testCatrNotParticipantCannotReadEvent },
  { name: "Cross-tenant bookings isolation — catr role (catr A vs catr B)", fn: testCrossTenantBookingsCatrIsolation },
  { name: "Cross-tenant booking_inquiries isolation — catr role (catr A vs catr B)", fn: testCrossTenantBookingInquiriesCatrIsolation },
  { name: "Cross-plnr plnr_clients isolation (Bucket-3 PII)", fn: testCrossPlnrClientsIsolation },
  { name: "Cross-tenant commission_flows isolation (orgnz A vs orgnz B; money table)", fn: testCrossTenantCommissionFlowsIsolation },
  { name: "Non-participant cannot read guest_accommodations (Bucket-3 PII)", fn: testNonParticipantCannotReadGuestAccommodations },
  { name: "Mood Board Chunk A write path — authed INSERT/UPDATE + cross-tenant denial", fn: testMoodBoardWritePathChunkA },
  { name: "Vndr can read own vendors row (migration 041 vendors_select positive)", fn: testVndrReadOwnVendorRow },
  { name: "Cross-tenant vendors isolation — vndr role (vndr A vs vndr B)", fn: testVndrCrossTenantVendorsIsolation },
  { name: "Vndr can INSERT own vndr_packages row (vp_write own-tenant positive)", fn: testVndrPackagesWriteOwnTenant },
  { name: "Cross-tenant vndr_packages write denied — vndr A spoofs/hijacks vndr B", fn: testVndrPackagesWriteCrossTenantDenied },
];

// -----------------------------------------------------------------------------
// Runner
// -----------------------------------------------------------------------------
// Each test seeds 2–3 auth users via signInWithPassword. Supabase's auth
// bucket caps sequential sign-ins per window; running 25 tests back-to-back
// exhausts it and the tail tests fail spuriously with "Request rate limit
// reached." A 1.5s pause between tests spreads the suite well under the
// bucket. Adds ~40s to total runtime — worth it for green CI.
const INTER_TEST_DELAY_MS = 1500;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let exitCode = 0;
try {
  console.log("Running tests:\n");
  let first = true;
  for (const { name, fn } of TESTS) {
    if (!first) await sleep(INTER_TEST_DELAY_MS);
    first = false;
    await runTest(name, fn);
  }
} catch (fatal) {
  console.error(`\nFATAL: ${fatal.message}`);
  exitCode = 1;
} finally {
  await cleanup();

  console.log(`\n=== Results ===`);
  console.log(`  Passed: ${results.passed}`);
  console.log(`  Failed: ${results.failed}`);
  if (results.failures.length > 0) {
    console.log(`\nFailures:`);
    for (const f of results.failures) {
      console.log(`  - ${f.name}`);
      console.log(`    ${f.message}`);
    }
    exitCode = 1;
  }
  console.log(`\nFinished: ${new Date().toISOString()}`);
  process.exit(exitCode);
}
