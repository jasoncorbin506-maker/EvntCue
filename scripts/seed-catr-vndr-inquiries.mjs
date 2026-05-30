// =============================================================================
// Catr + Vndr inquiry smoke — ready-to-test seeder
// =============================================================================
// Resend can't send the branded verify email locally (RESEND_API_KEY lives only
// in Vercel/prod), so fresh local signups never confirm. This seeder sidesteps
// that: it creates already-confirmed (email_confirm:true) accounts and seeds
// inquiries on each, so you sign in and land directly on populated routes:
//
//   1 orgnz buyer  (the inquiry sender)
//   1 catr account → /catr  + /catr/inquiries  (3 inquiries: inquiry/reviewing/quoted)
//   1 vndr account → /vndr  + /vndr/inquiries   (3 inquiries: inquiry/reviewing/quoted)
//   1 future-dated event owned by the orgnz (so event_id FKs resolve)
//
// recipient_type drives which portal sees a row: 'catr' rows surface in the catr
// portal, 'vndr' rows in the vndr portal (post-070 unified inquiries table).
//
// Idempotency: stable seed UUIDs (prefix 5eed0002-…). On each run the prior seed
// footprint is cleared (auth users by email, public rows by id in FK order) then
// re-inserted. Re-running yields identical final state.
//
// Usage:   npm run seed:inq
// Requires .env.local with NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY.
// Output:  ~/Desktop/Backstage/seed-catr-vndr-credentials.md
// =============================================================================

import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { homedir } from "node:os";

// -----------------------------------------------------------------------------
// Env loading
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

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// -----------------------------------------------------------------------------
// Stable seed data
// -----------------------------------------------------------------------------
const ORGNZ_TENANT_ID = "5eed0002-0000-0000-0000-000000000001";
const CATR_TENANT_ID = "5eed0002-0000-0000-0000-000000000002";
const VNDR_TENANT_ID = "5eed0002-0000-0000-0000-000000000003";
const EVENT_ID = "5eed0002-0000-0000-0000-000000000201";

const SEED_TENANT_IDS = [ORGNZ_TENANT_ID, CATR_TENANT_ID, VNDR_TENANT_ID];

// Future event: 5 weeks out.
const eventDate = new Date(Date.now() + 35 * 24 * 60 * 60 * 1000);
const EVENT_START_DATE = eventDate.toISOString().slice(0, 10);

const PASSWORD = "SeedInq2b!"; // every seeded account signs in with this.

// Emails are namespaced `seed-inq-*` so this seeder never collides with the
// lock24 seeder (which owns the bare `seed-orgnz@evntcue.test`, etc.).
const ORGNZ = {
  tenantId: ORGNZ_TENANT_ID,
  email: "seed-inq-orgnz@evntcue.test",
  fullName: "Seed Organizer",
  tenantName: "Seed Organizer Tenant",
};

const CATR = {
  tenantId: CATR_TENANT_ID,
  email: "seed-inq-catr@evntcue.test",
  fullName: "Seed Caterer",
  tenantName: "Seed Kitchen Co.",
};

const VNDR = {
  tenantId: VNDR_TENANT_ID,
  email: "seed-inq-vndr@evntcue.test",
  fullName: "Seed Vendor",
  tenantName: "Seed Florals Co.",
  displayName: "Seed Florals — Studio",
  primaryCategory: "florist",
};

// Inquiry rows. recipient drives the portal; mix of statuses so the lists show
// the full pill range and detail routes resolve for each.
const CATR_INQUIRIES = [
  {
    id: "5eed0002-0000-0000-0000-000000000301",
    status: "inquiry",
    clientName: "Marquez Wedding",
    guestCount: 140,
    estRevenueCents: 1260000,
    message:
      "Plated dinner for 140 — we'd love a tasting. Can you share menu options and pricing?",
    responded: false,
  },
  {
    id: "5eed0002-0000-0000-0000-000000000302",
    status: "reviewing",
    clientName: "TechCorp Holiday Gala",
    guestCount: 320,
    estRevenueCents: 2880000,
    message: "Corporate gala, stations + passed apps. Checking your availability for the date.",
    responded: true,
  },
  {
    id: "5eed0002-0000-0000-0000-000000000303",
    status: "quoted",
    clientName: "Anderson 50th Anniversary",
    guestCount: 80,
    estRevenueCents: 640000,
    message: "Family-style dinner for 80. Quote sent over — let me know if it works!",
    responded: true,
  },
];

const VNDR_INQUIRIES = [
  {
    id: "5eed0002-0000-0000-0000-000000000401",
    status: "inquiry",
    guestCount: 140,
    proposedPriceCents: null,
    message: "Hi! Booking florals for our wedding — would love to see your signature package.",
    responded: false,
  },
  {
    id: "5eed0002-0000-0000-0000-000000000402",
    status: "reviewing",
    guestCount: 320,
    proposedPriceCents: null,
    message: "Large corporate event — centerpieces for 32 tables plus a stage installation.",
    responded: true,
  },
  {
    id: "5eed0002-0000-0000-0000-000000000403",
    status: "quoted",
    guestCount: 80,
    proposedPriceCents: 350000,
    message: "Intimate anniversary dinner. Sending a quote for the arrangements now.",
    responded: true,
  },
];

const ALL_SEED_EMAILS = [ORGNZ.email, CATR.email, VNDR.email];
const ALL_INQUIRY_IDS = [...CATR_INQUIRIES, ...VNDR_INQUIRIES].map((i) => i.id);

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------
function log(label, payload) {
  console.log(`\n→ ${label}`);
  if (payload !== undefined) console.log(payload);
}

function fail(stage, error) {
  console.error(`\n✗ ${stage} failed:`);
  console.error(error);
  process.exit(1);
}

async function clearSeedAuthUsers() {
  const seedEmails = new Set(ALL_SEED_EMAILS);
  let page = 1;
  let deleted = 0;
  let scanned = 0;
  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) fail("auth.admin.listUsers", error);
    const users = data?.users ?? [];
    scanned += users.length;
    for (const u of users) {
      if (u.email && seedEmails.has(u.email.toLowerCase())) {
        const { error: delErr } = await admin.auth.admin.deleteUser(u.id);
        if (delErr) fail(`auth.admin.deleteUser(${u.email})`, delErr);
        deleted += 1;
      }
    }
    if (users.length < 1000) break;
    page += 1;
  }
  return { deleted, scanned };
}

async function clearSeedPublicRows() {
  const steps = [
    ["inquiries", admin.from("inquiries").delete().in("id", ALL_INQUIRY_IDS)],
    ["event_history", admin.from("event_history").delete().eq("event_id", EVENT_ID)],
    ["events", admin.from("events").delete().eq("id", EVENT_ID)],
    ["vendors", admin.from("vendors").delete().eq("tenant_id", VNDR_TENANT_ID)],
    ["user_roles", admin.from("user_roles").delete().in("tenant_id", SEED_TENANT_IDS)],
    ["tenants", admin.from("tenants").delete().in("id", SEED_TENANT_IDS)],
    ["public.users", admin.from("users").delete().in("email", ALL_SEED_EMAILS)],
  ];
  for (const [label, q] of steps) {
    const { error } = await q;
    if (error) fail(`delete ${label}`, error);
  }
}

async function createAuthUser(email, fullName) {
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: fullName, seed: true },
  });
  if (error) fail(`auth.admin.createUser(${email})`, error);
  return data.user;
}

async function insertPublicUser(authUser, fullName) {
  const { error } = await admin.from("users").insert({
    id: authUser.id,
    email: authUser.email,
    full_name: fullName,
  });
  if (error) fail(`insert public.users(${authUser.email})`, error);
}

async function insertTenant(id, name, type) {
  const { error } = await admin.from("tenants").insert({ id, name, type });
  if (error) fail(`insert tenants(${name})`, error);
}

async function insertUserRole(userId, tenantId, role) {
  const { error } = await admin.from("user_roles").insert({
    user_id: userId,
    tenant_id: tenantId,
    role,
    is_primary: true,
  });
  if (error) fail(`insert user_roles(${role})`, error);
}

// -----------------------------------------------------------------------------
// Seed phases
// -----------------------------------------------------------------------------
async function main() {
  console.log("=== Catr + Vndr inquiry seeder ===");
  console.log(`Supabase: ${SUPABASE_URL}`);
  console.log(`Event date: ${EVENT_START_DATE} (5 weeks out)`);

  log("Clearing prior seed footprint");
  const { deleted, scanned } = await clearSeedAuthUsers();
  await clearSeedPublicRows();
  console.log(`  auth users scanned: ${scanned}, matching seed emails deleted: ${deleted}`);

  log("Seeding orgnz buyer");
  const orgnzAuth = await createAuthUser(ORGNZ.email, ORGNZ.fullName);
  await insertPublicUser(orgnzAuth, ORGNZ.fullName);
  await insertTenant(ORGNZ.tenantId, ORGNZ.tenantName, "orgnz");
  await insertUserRole(orgnzAuth.id, ORGNZ.tenantId, "orgnz");

  log("Seeding event");
  const { error: eventErr } = await admin.from("events").insert({
    id: EVENT_ID,
    name: "Seed Event — Test Wedding",
    event_type: "wedding",
    orgnz_tenant_id: ORGNZ.tenantId,
    start_date: EVENT_START_DATE,
    timezone: "America/Chicago",
    status: "active",
    date_status: "confirmed",
    guest_count: 150,
    budget_cents: 5000000,
  });
  if (eventErr) fail("insert events", eventErr);

  log("Seeding catr account");
  const catrAuth = await createAuthUser(CATR.email, CATR.fullName);
  await insertPublicUser(catrAuth, CATR.fullName);
  await insertTenant(CATR.tenantId, CATR.tenantName, "catr");
  await insertUserRole(catrAuth.id, CATR.tenantId, "catr");

  log("Seeding vndr account");
  const vndrAuth = await createAuthUser(VNDR.email, VNDR.fullName);
  await insertPublicUser(vndrAuth, VNDR.fullName);
  await insertTenant(VNDR.tenantId, VNDR.tenantName, "vndr");
  await insertUserRole(vndrAuth.id, VNDR.tenantId, "vndr");
  // vendors row keeps getCurrentVendor() from bouncing to /vndr-onboarding.
  const { error: vendErr } = await admin.from("vendors").insert({
    tenant_id: VNDR.tenantId,
    claimed_at: new Date().toISOString(),
    display_name: VNDR.displayName,
    primary_category: VNDR.primaryCategory,
    contact_email: "delivered@resend.dev",
    city: "Dallas",
    claim_status: "published",
  });
  if (vendErr) fail("insert vendors", vendErr);

  log("Seeding catr inquiries");
  for (const inq of CATR_INQUIRIES) {
    const { error } = await admin.from("inquiries").insert({
      id: inq.id,
      event_id: EVENT_ID,
      buyer_tenant_id: ORGNZ.tenantId,
      buyer_role: "orgnz",
      recipient_tenant_id: CATR.tenantId,
      recipient_type: "catr",
      event_date: EVENT_START_DATE,
      guest_count: inq.guestCount,
      message: inq.message,
      client_name: inq.clientName,
      est_revenue_cents: inq.estRevenueCents,
      status: inq.status,
      responded_at: inq.responded ? new Date().toISOString() : null,
    });
    if (error) fail(`insert catr inquiry(${inq.status})`, error);
    console.log(`  catr inquiry ${inq.id} · ${inq.status}`);
  }

  log("Seeding vndr inquiries");
  for (const inq of VNDR_INQUIRIES) {
    const { error } = await admin.from("inquiries").insert({
      id: inq.id,
      event_id: EVENT_ID,
      buyer_tenant_id: ORGNZ.tenantId,
      buyer_role: "orgnz",
      recipient_tenant_id: VNDR.tenantId,
      recipient_type: "vndr",
      event_date: EVENT_START_DATE,
      guest_count: inq.guestCount,
      message: inq.message,
      proposed_price_cents: inq.proposedPriceCents,
      status: inq.status,
      responded_at: inq.responded ? new Date().toISOString() : null,
    });
    if (error) fail(`insert vndr inquiry(${inq.status})`, error);
    console.log(`  vndr inquiry ${inq.id} · ${inq.status}`);
  }

  log("Verifying final state");
  const [catrR, vndrR] = await Promise.all([
    admin.from("inquiries").select("id", { count: "exact", head: true })
      .eq("recipient_tenant_id", CATR_TENANT_ID).eq("recipient_type", "catr"),
    admin.from("inquiries").select("id", { count: "exact", head: true })
      .eq("recipient_tenant_id", VNDR_TENANT_ID).eq("recipient_type", "vndr"),
  ]);
  console.log(`  catr inquiries: ${catrR.count}  (expect 3)`);
  console.log(`  vndr inquiries: ${vndrR.count}  (expect 3)`);

  const credsPath = resolve(homedir(), "Desktop/Backstage/seed-catr-vndr-credentials.md");
  writeFileSync(credsPath, renderCredentials(), "utf-8");
  log("Wrote credentials", credsPath);

  console.log("\n✓ Seed complete. Sign in and land on populated inquiry lists.");
}

function renderCredentials() {
  return [
    "# Catr + Vndr inquiry smoke — seed credentials",
    "",
    `Generated: ${new Date().toISOString()}`,
    `Event date: ${EVENT_START_DATE}`,
    "",
    "All accounts are pre-confirmed (no email step) and share one password.",
    "",
    `**Password:** \`${PASSWORD}\``,
    "",
    "| Role | Sign-in email | Lands on | Inquiries |",
    "|---|---|---|---|",
    `| orgnz | \`${ORGNZ.email}\` | organizer dashboard | (sender) |`,
    `| catr | \`${CATR.email}\` | \`/catr\` → \`/catr/inquiries\` | 3 (inquiry/reviewing/quoted) |`,
    `| vndr | \`${VNDR.email}\` | \`/vndr\` → \`/vndr/inquiries\` | 3 (inquiry/reviewing/quoted) |`,
    "",
    "## Try it",
    "",
    `1. Sign in as \`${CATR.email}\` → tap **Inquiries** → open any row (detail route resolves).`,
    `2. Sign in as \`${VNDR.email}\` → **Inquiries** tab → open any row.`,
    "",
    "## Re-running",
    "",
    "Idempotent: `npm run seed:inq` clears the prior seed footprint and re-inserts identical rows.",
    "",
  ].join("\n");
}

main().catch((e) => fail("main", e));
