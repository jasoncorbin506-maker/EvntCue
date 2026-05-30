// =============================================================================
// Lock 24 vendor-notification smoke — reusable test-data seeder
// =============================================================================
// Builds one realistic test scenario so Jason (or anyone) can smoke the
// vendor-notification flow end-to-end after a fresh-slate wipe:
//
//   1 orgnz user + tenant
//   1 future-dated confirmed event
//   3 vndr users + tenants + vendors rows + vndr_packages
//   3 confirmed bookings (one per vndr) on the seeded event
//
// Vendor contact emails use Resend test addresses so the email-delivery and
// bounce-webhook paths can be exercised without sending real mail:
//
//   vndr-1 → delivered@resend.dev  (Resend happy path; email.delivered)
//   vndr-2 → bounced@resend.dev    (Resend bounce path; email.bounced → flips
//                                   payload.email_delivery_failed in
//                                   event_notifications)
//   vndr-3 → delivered@resend.dev  (second happy-path vendor)
//
// Idempotency: stable tenant + event + booking UUIDs are hardcoded below.
// At script start, every public-side row tied to a seed tenant is cleared via
// `DELETE FROM tenants WHERE id IN (...)` (cascades through everything). Auth
// users are matched by email and deleted via the admin API. Then fresh rows
// are inserted. Re-running yields identical final state.
//
// Usage:
//   npm run seed:lock24
//
// Requires .env.local with NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY.
//
// Output: ~/Desktop/Backstage/seed-lock24-credentials.md (sign-in creds).
//
// See ~/Desktop/Backstage/inbox-cc/processed/2026-05-28-test-data-seeder-for-lock-24-smoke.md
// for the brief and acceptance criteria.
// =============================================================================

import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { homedir } from "node:os";

// -----------------------------------------------------------------------------
// Env loading (mirrors scripts/rls-isolation-test.mjs pattern)
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
// Tenant UUIDs (deterministic — re-runs delete + recreate by these ids).
const ORGNZ_TENANT_ID = "5eed0001-0000-0000-0000-000000000001";
const VNDR_1_TENANT_ID = "5eed0001-0000-0000-0000-000000000101";
const VNDR_2_TENANT_ID = "5eed0001-0000-0000-0000-000000000102";
const VNDR_3_TENANT_ID = "5eed0001-0000-0000-0000-000000000103";

const EVENT_ID = "5eed0001-0000-0000-0000-000000000201";
const BOOKING_1_ID = "5eed0001-0000-0000-0000-000000000301";
const BOOKING_2_ID = "5eed0001-0000-0000-0000-000000000302";
const BOOKING_3_ID = "5eed0001-0000-0000-0000-000000000303";

const PKG_1_ID = "5eed0001-0000-0000-0000-000000000401";
const PKG_2_ID = "5eed0001-0000-0000-0000-000000000402";
const PKG_3_ID = "5eed0001-0000-0000-0000-000000000403";

const INQ_1_ID = "5eed0001-0000-0000-0000-000000000501";
const INQ_2_ID = "5eed0001-0000-0000-0000-000000000502";
const INQ_3_ID = "5eed0001-0000-0000-0000-000000000503";

const SEED_TENANT_IDS = [ORGNZ_TENANT_ID, VNDR_1_TENANT_ID, VNDR_2_TENANT_ID, VNDR_3_TENANT_ID];

// Future event: 6 weeks from today (per brief: 4-8 weeks so date-change is meaningful).
const today = new Date();
const eventDate = new Date(today.getTime() + 42 * 24 * 60 * 60 * 1000);
const EVENT_START_DATE = eventDate.toISOString().slice(0, 10);

const PASSWORD = "SeedLock24!"; // Jason signs in with this for every seeded account.

const ORGNZ = {
  tenantId: ORGNZ_TENANT_ID,
  email: "seed-orgnz@evntcue.test",
  fullName: "Seed Orgnz",
  tenantName: "Seed Orgnz Tenant",
};

const VENDORS = [
  {
    tenantId: VNDR_1_TENANT_ID,
    email: "seed-vndr-1@evntcue.test",
    fullName: "Seed Vendor 1",
    tenantName: "SEED_Vndr_1 (delivered)",
    displayName: "Seed Vendor 1 — Florals",
    contactEmail: "delivered@resend.dev",
    primaryCategory: "florist",
    bookingId: BOOKING_1_ID,
    packageId: PKG_1_ID,
    packageName: "Signature Floral Package",
    packagePriceCents: 350000,
    bookingTotalCents: 350000,
    roleLabel: "Florals",
    phases: ["pre_day_staging", "load_in", "opening_moment", "first_arc"],
    inquiryId: INQ_1_ID,
    inquiryMessage:
      "Hi! We're booking florals for our wedding — would love to chat about your signature package.",
    inquiryReply:
      "Thanks for reaching out! Happy to walk you through everything when you have a few minutes.",
  },
  {
    tenantId: VNDR_2_TENANT_ID,
    email: "seed-vndr-2@evntcue.test",
    fullName: "Seed Vendor 2",
    tenantName: "SEED_Vndr_2 (bounced)",
    displayName: "Seed Vendor 2 — Photography",
    contactEmail: "bounced@resend.dev",
    primaryCategory: "photographer",
    bookingId: BOOKING_2_ID,
    packageId: PKG_2_ID,
    packageName: "Full Day Photography",
    packagePriceCents: 425000,
    bookingTotalCents: 425000,
    roleLabel: "Photography",
    phases: [
      "vip_arrivals",
      "guest_arrivals",
      "opening_moment",
      "first_arc",
      "transition",
      "anchor_moment",
      "continuation_arc",
      "send_off",
    ],
    inquiryId: INQ_2_ID,
    inquiryMessage:
      "Looking for full-day photography coverage. What does your standard timeline look like?",
    inquiryReply:
      "I cover prep through send-off — let's hop on a quick call to map it out.",
  },
  {
    tenantId: VNDR_3_TENANT_ID,
    email: "seed-vndr-3@evntcue.test",
    fullName: "Seed Vendor 3",
    tenantName: "SEED_Vndr_3 (delivered)",
    displayName: "Seed Vendor 3 — DJ",
    contactEmail: "delivered@resend.dev",
    primaryCategory: "dj",
    bookingId: BOOKING_3_ID,
    packageId: PKG_3_ID,
    packageName: "Reception DJ Package",
    packagePriceCents: 185000,
    bookingTotalCents: 185000,
    roleLabel: "DJ",
    phases: ["first_arc", "transition", "anchor_moment", "continuation_arc", "send_off"],
    inquiryId: INQ_3_ID,
    inquiryMessage: "Need a DJ for reception. What's your availability + base package?",
    inquiryReply:
      "I'd love to host your reception. Sharing my package menu now — let me know what fits.",
  },
];

const ALL_SEED_EMAILS = [ORGNZ.email, ...VENDORS.map((v) => v.email)];

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
  // List ALL auth users (page through). Delete any whose email matches a seed.
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
  // Not every FK to tenants cascades (events.orgnz_tenant_id_fkey is NO ACTION,
  // for one). Delete in dependency order. All seeded rows have stable ids so
  // .in() filters are precise — nothing outside the seed footprint is touched.
  const vndrTenantIds = [VNDR_1_TENANT_ID, VNDR_2_TENANT_ID, VNDR_3_TENANT_ID];
  const packageIds = [PKG_1_ID, PKG_2_ID, PKG_3_ID];
  const bookingIds = [BOOKING_1_ID, BOOKING_2_ID, BOOKING_3_ID];
  const inquiryIds = [INQ_1_ID, INQ_2_ID, INQ_3_ID];

  const steps = [
    ["event_notifications", admin.from("event_notifications").delete().eq("event_id", EVENT_ID)],
    ["event_vendor_presence", admin.from("event_vendor_presence").delete().eq("event_id", EVENT_ID)],
    ["inquiry_messages", admin.from("inquiry_messages").delete().in("inquiry_id", inquiryIds)],
    ["inquiries", admin.from("inquiries").delete().in("id", inquiryIds)],
    ["bookings", admin.from("bookings").delete().in("id", bookingIds)],
    ["events", admin.from("events").delete().eq("id", EVENT_ID)],
    ["vndr_packages", admin.from("vndr_packages").delete().in("id", packageIds)],
    ["vendors", admin.from("vendors").delete().in("tenant_id", vndrTenantIds)],
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
  console.log("=== Lock 24 smoke seeder ===");
  console.log(`Supabase: ${SUPABASE_URL}`);
  console.log(`Event date: ${EVENT_START_DATE} (6 weeks out)`);

  // Phase A — clear any prior seed footprint.
  log("Clearing prior seed footprint");
  const { deleted: authDeleted, scanned: authScanned } = await clearSeedAuthUsers();
  await clearSeedPublicRows();
  console.log(`  auth users scanned: ${authScanned}, matching seed emails deleted: ${authDeleted}`);
  console.log(`  public tenants/users by seed id+email cleared`);

  // Phase B — seed orgnz.
  log("Seeding orgnz");
  const orgnzAuth = await createAuthUser(ORGNZ.email, ORGNZ.fullName);
  await insertPublicUser(orgnzAuth, ORGNZ.fullName);
  await insertTenant(ORGNZ.tenantId, ORGNZ.tenantName, "orgnz");
  await insertUserRole(orgnzAuth.id, ORGNZ.tenantId, "orgnz");
  console.log(`  orgnz user ${orgnzAuth.email} (${orgnzAuth.id})`);

  // Phase C — seed the event.
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
  console.log(`  event ${EVENT_ID} on ${EVENT_START_DATE}`);

  // Phase D — seed vendors + their bookings.
  for (const v of VENDORS) {
    log(`Seeding ${v.tenantName}`);
    const vAuth = await createAuthUser(v.email, v.fullName);
    await insertPublicUser(vAuth, v.fullName);
    await insertTenant(v.tenantId, v.tenantName, "vndr");
    await insertUserRole(vAuth.id, v.tenantId, "vndr");

    const { error: vendErr } = await admin.from("vendors").insert({
      tenant_id: v.tenantId,
      claimed_at: new Date().toISOString(),
      display_name: v.displayName,
      primary_category: v.primaryCategory,
      contact_email: v.contactEmail,
      city: "Dallas",
      claim_status: "published",
    });
    if (vendErr) fail(`insert vendors(${v.email})`, vendErr);

    const { error: pkgErr } = await admin.from("vndr_packages").insert({
      id: v.packageId,
      tenant_id: v.tenantId,
      name: v.packageName,
      price_cents: v.packagePriceCents,
      active: true,
      is_visible: true,
    });
    if (pkgErr) fail(`insert vndr_packages(${v.email})`, pkgErr);

    const nowIso = new Date().toISOString();
    const { error: bookErr } = await admin.from("bookings").insert({
      id: v.bookingId,
      event_id: EVENT_ID,
      vndr_tenant_id: v.tenantId,
      package_id: v.packageId,
      subtotal_cents: v.bookingTotalCents,
      total_cents: v.bookingTotalCents,
      status: "confirmed",
      orgnz_confirmed_at: nowIso,
      vendor_confirmed_at: nowIso,
      confirmed_at: nowIso,
    });
    if (bookErr) fail(`insert bookings(${v.email})`, bookErr);

    // event_vendor_presence — separate primitive that surfaces the vendor on
    // the orgnz dashboard's cast list + per-phase dots. The bookings table
    // alone doesn't drive that surface (per lib/events/vendor-presence.ts).
    const { error: presErr } = await admin.from("event_vendor_presence").insert({
      event_id: EVENT_ID,
      vendor_tenant_id: v.tenantId,
      vendor_name: v.displayName,
      role_label: v.roleLabel,
      phases: v.phases,
      created_by: orgnzAuth.id,
    });
    if (presErr) fail(`insert event_vendor_presence(${v.email})`, presErr);

    // inquiries + inquiry_messages — gives VendorDetailSheet's Quick connect
    // button a real thread to deep-link to. Inquiry is in 'booked' status since
    // the seeded booking is already confirmed. recipient_type='vndr' (post-070
    // unified table: these are vndr-recipient leads).
    const { error: inqErr } = await admin.from("inquiries").insert({
      id: v.inquiryId,
      event_id: EVENT_ID,
      buyer_tenant_id: ORGNZ.tenantId,
      buyer_role: "orgnz",
      recipient_tenant_id: v.tenantId,
      recipient_type: "vndr",
      event_date: EVENT_START_DATE,
      guest_count: 150,
      message: v.inquiryMessage,
      proposed_price_cents: v.bookingTotalCents,
      status: "booked",
      responded_at: nowIso,
      resulting_booking_id: v.bookingId,
    });
    if (inqErr) fail(`insert inquiries(${v.email})`, inqErr);

    const { error: msgErr } = await admin.from("inquiry_messages").insert([
      {
        inquiry_id: v.inquiryId,
        inquiry_table: "inquiries",
        sender_user_id: orgnzAuth.id,
        sender_tenant_id: ORGNZ.tenantId,
        sender_role: "orgnz",
        body: v.inquiryMessage,
      },
      {
        inquiry_id: v.inquiryId,
        inquiry_table: "inquiries",
        sender_user_id: vAuth.id,
        sender_tenant_id: v.tenantId,
        sender_role: "vndr",
        body: v.inquiryReply,
      },
    ]);
    if (msgErr) fail(`insert inquiry_messages(${v.email})`, msgErr);

    console.log(`  vndr ${vAuth.email} (${vAuth.id}) → booking ${v.bookingId} → inquiry ${v.inquiryId} → notif email ${v.contactEmail}`);
  }

  // Phase E — verify final state.
  log("Verifying final state");
  const checks = await Promise.all([
    admin.from("tenants").select("id, type", { count: "exact", head: true }).in("id", SEED_TENANT_IDS),
    admin.from("events").select("id", { count: "exact", head: true }).eq("id", EVENT_ID),
    admin.from("bookings").select("id", { count: "exact", head: true }).eq("event_id", EVENT_ID),
    admin.from("vendors").select("tenant_id", { count: "exact", head: true }).in("tenant_id", [
      VNDR_1_TENANT_ID,
      VNDR_2_TENANT_ID,
      VNDR_3_TENANT_ID,
    ]),
    admin.from("vndr_packages").select("id", { count: "exact", head: true }).in("id", [PKG_1_ID, PKG_2_ID, PKG_3_ID]),
    admin.from("event_notifications").select("id", { count: "exact", head: true }).eq("event_id", EVENT_ID),
    admin.from("event_vendor_presence").select("id", { count: "exact", head: true }).eq("event_id", EVENT_ID),
    admin.from("inquiries").select("id", { count: "exact", head: true }).eq("event_id", EVENT_ID),
    admin.from("inquiry_messages").select("id", { count: "exact", head: true }).in("inquiry_id", [INQ_1_ID, INQ_2_ID, INQ_3_ID]),
  ]);
  const [tenantsR, eventsR, bookingsR, vendorsR, packagesR, notifR, presenceR, inqR, msgR] = checks;
  console.log(`  seed tenants:         ${tenantsR.count}  (expect 4)`);
  console.log(`  seed events:          ${eventsR.count}  (expect 1)`);
  console.log(`  seed vendors row:     ${vendorsR.count}  (expect 3)`);
  console.log(`  seed vndr_packages:   ${packagesR.count}  (expect 3)`);
  console.log(`  seed bookings:        ${bookingsR.count}  (expect 3)`);
  console.log(`  event_vendor_presence:${presenceR.count}  (expect 3 — surfaces on orgnz dashboard)`);
  console.log(`  inquiries:            ${inqR.count}  (expect 3 — Quick connect deep-link)`);
  console.log(`  inquiry_messages:     ${msgR.count}  (expect 6 — 2 per thread)`);
  console.log(`  event_notifications:  ${notifR.count}  (0 unless a date-change already fired)`);

  // Phase F — write credentials outside the repo.
  const credsPath = resolve(homedir(), "Desktop/Backstage/seed-lock24-credentials.md");
  const credsBody = renderCredentials();
  writeFileSync(credsPath, credsBody, "utf-8");
  log("Wrote credentials", credsPath);

  console.log("\n✓ Seed complete. Smoke unblocked.");
}

function renderCredentials() {
  const lines = [
    "# Lock 24 smoke — seed credentials",
    "",
    `Generated: ${new Date().toISOString()}`,
    `Event date: ${EVENT_START_DATE}`,
    `Event id: \`${EVENT_ID}\``,
    "",
    "All accounts share the same password.",
    "",
    `**Password:** \`${PASSWORD}\``,
    "",
    "| Role | Sign-in email | Notification email | Tenant id |",
    "|---|---|---|---|",
    `| orgnz | \`${ORGNZ.email}\` | — | \`${ORGNZ.tenantId}\` |`,
    ...VENDORS.map(
      (v) => `| vndr | \`${v.email}\` | \`${v.contactEmail}\` | \`${v.tenantId}\` |`,
    ),
    "",
    "## Smoke sequence",
    "",
    `1. Sign in as \`${ORGNZ.email}\` and open the seeded event (\`${EVENT_ID}\`).`,
    "2. Trigger a date change via `EventDateEditor`. All 3 vendors should receive notifications.",
    "3. Sign in as `seed-vndr-1@evntcue.test` → Vndr Inquiries → accept the date-change card → confirm the orgnz feed strip shows acceptance.",
    "4. Sign in as `seed-vndr-3@evntcue.test` → decline the card → confirm the orgnz feed strip shows the coral-border decline.",
    "5. `seed-vndr-2@evntcue.test` uses `bounced@resend.dev` — once the Resend webhook fires, `payload.email_delivery_failed` on its notification row flips true. Confirm the EXPIRED-card / delivery-failed surface renders.",
    "",
    "## Re-running",
    "",
    "Idempotent: `npm run seed:lock24` re-seeds the same tenant/event/booking ids. Prior auth + public rows are cleared first; final state is identical.",
    "",
  ];
  return lines.join("\n");
}

main().catch((e) => fail("main", e));
