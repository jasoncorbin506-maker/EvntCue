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

// -----------------------------------------------------------------------------
// Test array — append more tests here as new role/table combos are covered.
// -----------------------------------------------------------------------------
const TESTS = [
  { name: "Migration 034 regression (venue role + events join, no 42P17)", fn: testMigration034Regression },
  { name: "Cross-tenant events isolation (orgnz A vs orgnz B)", fn: testCrossTenantEventIsolation },
  { name: "Cross-tenant bookings isolation (venue A vs venue B)", fn: testCrossTenantBookingsIsolation },
];

// -----------------------------------------------------------------------------
// Runner
// -----------------------------------------------------------------------------
let exitCode = 0;
try {
  console.log("Running tests:\n");
  for (const { name, fn } of TESTS) {
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
