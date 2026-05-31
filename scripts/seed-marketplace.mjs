// =============================================================================
// Marketplace provider seeder — clean, trackable test set
// =============================================================================
// Wipes ALL current provider tenants (vndr / venue / catr / plnr) and reseeds a
// known, structured set so the marketplace data is trackable during testing:
//
//   16 vndr  — 2 per category (8 categories), each a published `vendors` row
//              with 2 active packages + 2 portfolio photos (uploaded to the
//              `vendor-photos` bucket so getPublicUrl renders them).
//    5 venue — published `venues` row + 1 `venue_spaces` row.
//    5 catr  — tenant + login only (no catr profile table exists).
//    3 plnr  — tenant + login only (no plnr profile table exists).
//
// Every account is pre-confirmed (email_confirm:true) and shares one password.
// Credentials table is written to ~/Desktop/Backstage/.
//
// DESTRUCTIVE + IDEMPOTENT: each run deletes EVERY vndr/venue/catr/plnr tenant
// (including ones it created last run, and the seed-inq / lock24 provider
// accounts — re-run those seeders if you still need their smokes), then rebuilds
// the canonical set. Tenant ids are deterministic (5eed0003-…) so photo storage
// paths are stable across runs.
//
// All marketplace data is test data (confirmed with Jason 2026-05-31).
//
// Usage:   npm run seed:marketplace   (or: node scripts/seed-marketplace.mjs)
// Requires .env.local with NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY.
// =============================================================================

import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { homedir } from "node:os";

// -----------------------------------------------------------------------------
// Env
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

const PASSWORD = "Marketplace2b!";
const PHOTO_BUCKET = "vendor-photos";
const CREDS_PATH = resolve(homedir(), "Desktop/Backstage/seed-marketplace-credentials.md");

const DFW_CITIES = [
  "Dallas", "Fort Worth", "Plano", "Arlington", "Irving",
  "Frisco", "McKinney", "Denton", "Grapevine", "Southlake",
];

// Deterministic tenant id from a sequence number → stable storage paths on re-run.
const mkTenantId = (n) => `5eed0003-0000-0000-0000-${String(n).padStart(12, "0")}`;

// -----------------------------------------------------------------------------
// Provider definitions
// -----------------------------------------------------------------------------
// 8 vndr categories (data/vndr-categories.ts). primary_category = the KEY,
// primary_sub_type = subTypes[0], sub_types = the array (per save-stage-1.ts).
const VNDR_CATS = [
  {
    key: "photo", label: "Photography & Media",
    sub: ["Photographer", "Videographer", "Content creator"],
    pkgs: [["Wedding Photography — 8 hr", 320000, 8], ["Elopement Coverage — 4 hr", 160000, 4]],
    story: "Documentary-style coverage with a fast, color-true gallery turnaround.",
  },
  {
    key: "florals", label: "Florals & Design",
    sub: ["Florist", "Event designer / stylist", "Balloon artist"],
    pkgs: [["Signature Floral Package", 450000, null], ["Ceremony Florals", 180000, null]],
    story: "Seasonal, locally sourced design for ceremonies and receptions.",
  },
  {
    key: "audio", label: "Audio & Music",
    sub: ["DJ", "Live band", "MC / host"],
    pkgs: [["DJ + MC — 6 hr", 250000, 6], ["Live Band — 4 sets", 600000, 4]],
    story: "Reads the room, keeps the floor full, handles the mic with care.",
  },
  {
    key: "visual", label: "Visual Production & Lighting",
    sub: ["AV / production company", "Lighting designer", "Stage / set builder"],
    pkgs: [["Event Lighting Design", 380000, null], ["Full AV Production", 750000, null]],
    story: "Lighting and AV that make the room feel intentional, not industrial.",
  },
  {
    key: "rentals", label: "Rentals",
    sub: ["Décor rental company", "Dance floor / flooring", "Tenting company"],
    pkgs: [["Décor Rental Collection", 220000, null], ["Lounge Furniture Set", 140000, null]],
    story: "Curated rental inventory delivered, styled, and struck on schedule.",
  },
  {
    key: "beauty", label: "Personal & Beauty",
    sub: ["Hair stylist", "Makeup artist", "Wardrobe stylist / tailor"],
    pkgs: [["Bridal Hair & Makeup", 90000, null], ["Bridal Party (up to 5)", 350000, null]],
    story: "On-location glam with trials, timelines, and touch-up kits.",
  },
  {
    key: "entertain", label: "Interactive Entertainment",
    sub: ["Photo booth", "Casino tables", "Lawn games"],
    pkgs: [["Photo Booth — 4 hr", 120000, 4], ["Casino Night Package", 280000, null]],
    story: "Crowd-pleasing activations that keep guests off their phones.",
  },
  {
    key: "transport", label: "Transportation & Logistics",
    sub: ["Guest transportation", "Luxury car service", "Valet company"],
    pkgs: [["Luxury Sedan — 6 hr", 85000, 6], ["Guest Shuttle (50 pax)", 200000, null]],
    story: "On-time, licensed, insured — guests and timeline both arrive intact.",
  },
];

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

// A delete scoped by a filter callback. ids=[] is a valid no-op filter.
async function del(table, applyFilter, { required = false } = {}) {
  const { error } = await applyFilter(admin.from(table).delete());
  if (error) {
    if (required) fail(`wipe delete ${table}`, error);
    console.warn(`  (skip) ${table}: ${error.message}`);
  }
}

async function createAuthUser(email, fullName) {
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: fullName, seed: "marketplace" },
  });
  if (error) fail(`createUser(${email})`, error);
  return data.user;
}

async function makeAccount({ tenantId, email, fullName, tenantName, type }) {
  const authUser = await createAuthUser(email, fullName);
  const { error: uErr } = await admin
    .from("users")
    .insert({ id: authUser.id, email, full_name: fullName });
  if (uErr) fail(`insert users(${email})`, uErr);
  const { error: tErr } = await admin
    .from("tenants")
    .insert({ id: tenantId, name: tenantName, type });
  if (tErr) fail(`insert tenants(${tenantName})`, tErr);
  const { error: rErr } = await admin
    .from("user_roles")
    .insert({ user_id: authUser.id, tenant_id: tenantId, role: type, is_primary: true });
  if (rErr) fail(`insert user_roles(${type})`, rErr);
  return authUser.id;
}

async function uploadPhoto(tenantId, userId, idx) {
  const url = `https://picsum.photos/seed/${tenantId}-${idx}/1200/800`;
  let buf;
  try {
    const res = await fetch(url, { redirect: "follow" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    buf = Buffer.from(await res.arrayBuffer());
  } catch (e) {
    console.warn(`  (skip photo) ${tenantId} #${idx}: fetch failed — ${e.message}`);
    return;
  }
  const path = `${tenantId}/seed-${idx}.jpg`;
  const { error: upErr } = await admin.storage
    .from(PHOTO_BUCKET)
    .upload(path, buf, { contentType: "image/jpeg", upsert: true });
  if (upErr) {
    console.warn(`  (skip photo) ${tenantId} #${idx}: upload failed — ${upErr.message}`);
    return;
  }
  const { error: rowErr } = await admin.from("vendor_photos").insert({
    tenant_id: tenantId,
    storage_path: path,
    display_order: idx,
    alt_text: `Portfolio image ${idx + 1}`,
    created_by: userId,
  });
  if (rowErr) console.warn(`  (skip photo row) ${tenantId} #${idx}: ${rowErr.message}`);
}

// -----------------------------------------------------------------------------
// Wipe
// -----------------------------------------------------------------------------
async function wipeProviders() {
  const { data: tgts, error: tErr } = await admin
    .from("tenants")
    .select("id")
    .in("type", ["vndr", "venue", "catr", "plnr"]);
  if (tErr) fail("select target tenants", tErr);
  const targetIds = (tgts ?? []).map((t) => t.id);
  console.log(`  provider tenants to wipe: ${targetIds.length}`);
  if (targetIds.length === 0) return;

  const { data: roles } = await admin.from("user_roles").select("user_id").in("tenant_id", targetIds);
  const memberIds = [...new Set((roles ?? []).map((r) => r.user_id))];

  const { data: bks } = await admin.from("bookings").select("id").in("vndr_tenant_id", targetIds);
  const bkIds = (bks ?? []).map((b) => b.id);

  const [{ data: inqA }, { data: inqB }] = await Promise.all([
    admin.from("inquiries").select("id").in("buyer_tenant_id", targetIds),
    admin.from("inquiries").select("id").in("recipient_tenant_id", targetIds),
  ]);
  const inqIds = [...new Set([...(inqA ?? []).map((i) => i.id), ...(inqB ?? []).map((i) => i.id)])];

  // 1. rows that block (NO ACTION) or orphan (SET NULL) a tenant/booking delete.
  await del("mood_board_vendor_briefs", (q) => q.in("vendor_tenant_id", targetIds));
  await del("event_reviews", (q) => q.in("reviewer_tenant_id", targetIds));
  await del("event_reviews", (q) => q.in("reviewee_tenant_id", targetIds));

  // booking-linked children (most are 0; harmless when bkIds is empty).
  await del("commission_flows", (q) => q.in("booking_id", bkIds));
  await del("commission_flows", (q) => q.in("from_party", targetIds));
  await del("commission_flows", (q) => q.in("to_party", targetIds));
  await del("disputes", (q) => q.in("booking_id", bkIds));
  await del("event_cancellations", (q) => q.in("booking_id", bkIds));
  await del("pending_manual_refunds", (q) => q.in("booking_id", bkIds));
  await del("vendor_credits", (q) => q.in("booking_id", bkIds));
  await del("stripe_payout_queue", (q) => q.in("booking_id", bkIds));
  await del("instant_bookings", (q) => q.in("resulting_booking_id", bkIds));
  await del("warm_transfers", (q) => q.in("resulting_booking_id", bkIds));
  await del("plnr_engagements", (q) => q.in("service_fee_booking_id", bkIds));

  // inquiries + their messages.
  await del("inquiry_messages", (q) => q.in("inquiry_id", inqIds));
  await del("inquiry_messages", (q) => q.in("sender_tenant_id", targetIds));
  await del("inquiries", (q) => q.in("id", inqIds), { required: true });

  // bookings (CASCADE clears review_requests / reviews / status_log / cancel reqs).
  await del("bookings", (q) => q.in("id", bkIds), { required: true });

  // profile rows are SET NULL on tenant delete — remove explicitly so none orphan.
  await del("vendors", (q) => q.in("tenant_id", targetIds), { required: true });
  await del("venues", (q) => q.in("tenant_id", targetIds), { required: true });

  // the tenants themselves — CASCADE clears user_roles, vndr_packages,
  // vendor_photos, venue_spaces, subscriptions, mood_boards, plnr_*/catr_*, etc.
  await del("tenants", (q) => q.in("id", targetIds), { required: true });

  // orphaned auth users (no roles left after the tenant delete) + their mirror row.
  let removed = 0;
  for (const uid of memberIds) {
    const { count } = await admin
      .from("user_roles")
      .select("user_id", { count: "exact", head: true })
      .eq("user_id", uid);
    if ((count ?? 0) > 0) continue; // multi-role user still tied to a kept tenant
    await admin.from("users").delete().eq("id", uid);
    const { error } = await admin.auth.admin.deleteUser(uid);
    if (error) console.warn(`  (skip auth delete) ${uid}: ${error.message}`);
    else removed += 1;
  }
  console.log(`  orphaned auth users removed: ${removed}`);
}

// -----------------------------------------------------------------------------
// Seed
// -----------------------------------------------------------------------------
const created = []; // for the credentials file

async function seedVndrs(startN) {
  let n = startN;
  for (const cat of VNDR_CATS) {
    for (let i = 1; i <= 2; i++) {
      const tenantId = mkTenantId(n);
      const email = `vndr-${cat.key}-0${i}@seed.evntcue.test`;
      const tenantName = `Vndr · ${cat.label} · 0${i}`;
      const city = DFW_CITIES[(n - 1) % DFW_CITIES.length];
      const userId = await makeAccount({
        tenantId, email, fullName: `${cat.label} Vendor ${i}`, tenantName, type: "vndr",
      });
      const { error: vErr } = await admin.from("vendors").insert({
        tenant_id: tenantId,
        claim_status: "published",
        claimed_at: new Date().toISOString(),
        display_name: tenantName,
        primary_category: cat.key,
        primary_sub_type: cat.sub[0],
        sub_types: cat.sub,
        city,
        contact_email: "delivered@resend.dev",
        founding_story: cat.story,
        years_in_business: 3 + (n % 9),
        starting_price_cents: cat.pkgs[1][1],
        pricing_model: "packages",
        booking_mode: "inquiry",
      });
      if (vErr) fail(`insert vendors(${tenantName})`, vErr);

      const pkgRows = cat.pkgs.map(([name, price, hrs], idx) => ({
        tenant_id: tenantId,
        name,
        price_cents: price,
        duration_hours: hrs,
        description: `${cat.label} — ${name}.`,
        display_order: idx,
        active: true,
        is_visible: true,
        deposit_pct: 25,
        created_by: userId,
      }));
      const { error: pErr } = await admin.from("vndr_packages").insert(pkgRows);
      if (pErr) fail(`insert vndr_packages(${tenantName})`, pErr);

      for (let p = 0; p < 2; p++) await uploadPhoto(tenantId, userId, p);

      created.push({ type: "vndr", label: tenantName, email, tenantId });
      console.log(`  vndr ${tenantName}`);
      n++;
    }
  }
  return n;
}

async function seedVenues(startN) {
  let n = startN;
  for (let i = 1; i <= 5; i++) {
    const tenantId = mkTenantId(n);
    const email = `venu-0${i}@seed.evntcue.test`;
    const tenantName = `Venu · 0${i}`;
    const city = DFW_CITIES[(n - 1) % DFW_CITIES.length];
    await makeAccount({ tenantId, email, fullName: `Venue ${i}`, tenantName, type: "venue" });
    const { error: vErr } = await admin.from("venues").insert({
      tenant_id: tenantId,
      claim_status: "published",
      claimed_at: new Date().toISOString(),
      acquisition_lane: "self_serve",
      display_name: tenantName,
      address_line1: `${100 + i} Main St`,
      city,
      state: "TX",
      postal_code: "75201",
    });
    if (vErr) fail(`insert venues(${tenantName})`, vErr);
    const { error: sErr } = await admin.from("venue_spaces").insert({
      tenant_id: tenantId,
      name: "Main Hall",
      capacity: 120 + i * 40,
      sq_ft: 3000 + i * 500,
      rate_per_day_cents: 350000 + i * 50000,
      status: "active",
      description: "Flexible primary event space with in-house tables and chairs.",
    });
    if (sErr) fail(`insert venue_spaces(${tenantName})`, sErr);
    created.push({ type: "venue", label: tenantName, email, tenantId });
    console.log(`  venue ${tenantName}`);
    n++;
  }
  return n;
}

async function seedThin(startN, type, prefix, count) {
  let n = startN;
  for (let i = 1; i <= count; i++) {
    const tenantId = mkTenantId(n);
    const email = `${prefix}-0${i}@seed.evntcue.test`;
    const tenantName = `${type === "catr" ? "Catr" : "Plnr"} · 0${i}`;
    await makeAccount({ tenantId, email, fullName: tenantName, tenantName, type });
    created.push({ type, label: tenantName, email, tenantId });
    console.log(`  ${type} ${tenantName}`);
    n++;
  }
  return n;
}

// -----------------------------------------------------------------------------
// Credentials file
// -----------------------------------------------------------------------------
function renderCredentials() {
  const rows = created
    .map((c) => `| ${c.type} | ${c.label} | \`${c.email}\` | \`${c.tenantId}\` |`)
    .join("\n");
  const byType = (t) => created.filter((c) => c.type === t).length;
  return [
    "# Marketplace seed — provider credentials",
    "",
    `Generated: ${new Date().toISOString()}`,
    "",
    "All accounts are pre-confirmed (no email step) and share one password.",
    "",
    `**Password (all accounts):** \`${PASSWORD}\``,
    "",
    `Counts — vndr: ${byType("vndr")}, venue: ${byType("venue")}, catr: ${byType("catr")}, plnr: ${byType("plnr")}.`,
    "",
    "vndr accounts have a published profile, 2 active packages, and 2 portfolio photos.",
    "venue accounts have a published profile + one space. catr/plnr are login + tenant only.",
    "",
    "| Type | Name | Sign-in email | Tenant id |",
    "|---|---|---|---|",
    rows,
    "",
    "## Re-running",
    "",
    "`npm run seed:marketplace` is idempotent: it wipes ALL provider tenants and rebuilds this exact set.",
    "",
  ].join("\n");
}

// -----------------------------------------------------------------------------
// Main
// -----------------------------------------------------------------------------
async function main() {
  console.log("=== Marketplace provider seeder ===");
  console.log(`Supabase: ${SUPABASE_URL}`);

  log("Wiping current provider tenants");
  await wipeProviders();

  log("Seeding vndrs (16)");
  let n = await seedVndrs(1);
  log("Seeding venues (5)");
  n = await seedVenues(n);
  log("Seeding catr (5)");
  n = await seedThin(n, "catr", "catr", 5);
  log("Seeding plnr (3)");
  n = await seedThin(n, "plnr", "plnr", 3);

  log("Verifying counts");
  for (const type of ["vndr", "venue", "catr", "plnr"]) {
    const { count } = await admin
      .from("tenants")
      .select("id", { count: "exact", head: true })
      .eq("type", type);
    console.log(`  ${type}: ${count}`);
  }
  const { count: pubVendors } = await admin
    .from("vendors")
    .select("id", { count: "exact", head: true })
    .eq("claim_status", "published");
  const { count: pkgs } = await admin
    .from("vndr_packages")
    .select("id", { count: "exact", head: true })
    .eq("active", true);
  const { count: photos } = await admin
    .from("vendor_photos")
    .select("id", { count: "exact", head: true });
  console.log(`  published vendors: ${pubVendors}, active packages: ${pkgs}, photos: ${photos}`);

  writeFileSync(CREDS_PATH, renderCredentials(), "utf-8");
  log("Wrote credentials", CREDS_PATH);
  console.log("\n✓ Seed complete.");
}

main().catch((e) => fail("main", e));
