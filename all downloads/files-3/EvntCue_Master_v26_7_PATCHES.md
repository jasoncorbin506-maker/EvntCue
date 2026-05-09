# EvntCue Master Doc v26.6 → v26.7 — Patch Manifest

> **Purpose:** This document captures every change required to bring `EvntCue_Master_v26_6.html` to `EvntCue_Master_v26_7.html`. The masterdoc is the single source of truth across all sessions and operators. **If this manifest is in conflict with the live masterdoc HTML, the masterdoc wins. Update this manifest, not your interpretation.**
>
> **Apply these changes in order.** The numbering corresponds to section IDs in the masterdoc HTML. Search by `id="sN"` for the anchor, then update the section content per the patch below. Each patch shows: what's there now, what to replace it with, and why.

---

## Provenance

This patch series resolves decisions made across the v26.6 → v26.7 session arc:

- The Venu acquisition arc shipped (`evntcue_venu_freemium_v2.html`)
- The Vndr acquisition arc shipped previously
- The Orgnz acquisition arc shipped previously
- All three intakes are now LOCKED. The next phase is the Workstation.
- Pricing model shifted from "Starter free / Pro $149" to "free until first booking, then 60-day grace, then subscription"
- Commission language standardized away from "commission" toward "fees and passes" in user-facing copy; schema codes (`venue_in_house`, etc.) preserved as DB enums
- Trust Badge artwork specced at three tiers (Verified / Top Venue / Premier)
- Verification gate modes (Soft / Required / Conditional) made admin-toggleable
- Tax-exempt entity flow added to onboarding for universities, government, non-profit venues
- Workstation architecture committed as new §85

---

## Patch 1 — §19 Pricing & Tiers (surgical update)

**Find:** `<div class="sec" id="s19">`

**What to add (after the existing tier table):**

```html
<h3>Subscription activation model — locked v26.7</h3>
<table class="tbl">
  <thead><tr><th>Phase</th><th>State</th><th>Trigger</th></tr></thead>
  <tbody>
    <tr><td><strong>Phase 1 — Free profile</strong></td><td>No card on file. Full Starter feature access. No monthly charge.</td><td>From signup until first confirmed booking clears escrow.</td></tr>
    <tr><td><strong>Phase 2 — 60-day grace</strong></td><td>Subscription model presented in dashboard. User chooses tier. Card collected but not charged.</td><td>Day 1 = first booking clears. Day 60 = subscription activates.</td></tr>
    <tr><td><strong>Phase 3 — Active subscription</strong></td><td>Charged at chosen tier. Standard renewal cycle.</td><td>Day 60+. User can downgrade to Starter (free) at any time, but Starter is feature-limited per the existing tier table.</td></tr>
  </tbody>
</table>
<div class="sec-p"><strong>Rationale.</strong> The platform earns trust before it asks for money. A venue manager who has booked through EvntCue knows the platform works; they can decide whether the Pro tier is worth it from a position of evidence, not hope. This is the inverse of Tripleseat ($250–$500/mo subscription required before any value delivered) and The Knot Pro ($300+/mo subscription, leads not guaranteed). Acquisition friction at zero; activation gated by demonstrated value.</div>

<h3>Pro tier pricing — open decision</h3>
<div class="sec-p">The original $149/mo · $129/mo annual was set against a feature bundle that has since grown. v1 Pro now includes: CRM, proposals/BEO, scheduler, deposit schedules, client communication portal, preferred vendor directory, earnings/ledger reporting, COI alerts, ticketed events, multi-location tools. Comparable products: HoneyBook $39–$129/mo (CRM + proposals only, no marketplace demand); Tripleseat $250–$500/mo (full venue ops, per-seat pricing). <strong>Recommended Pro v2 pricing: $199/mo · $169/mo annual.</strong> Locks pending decision; should be set before public launch. Enterprise stays custom.</div>

<h3>Acquisition surface rule — locked v26.7</h3>
<div class="sec-p">Pricing numbers do not appear on landing pages or onboarding flows. The free-until-first-booking phrasing is the only commercial language acquisition surfaces are allowed to carry. Pricing is introduced in-product, in the dashboard, at the moment subscription becomes relevant. This rule prevents the landing-page-as-pricing-page failure mode (decision-makers bouncing on dollar figures before they understand value).</div>
```

**Why:** §70 already locked the free-until-first-booking model conceptually. §19 is where pricing structures live, so the activation model needs to be canonical here too. The acquisition-surface rule prevents future drift toward landing-page price displays.

---

## Patch 2 — §21 Verification Gates (surgical update)

**Find:** `<div class="sec" id="s21">`

**What to add (new subsection at end of §21):**

```html
<h3>Gate modes — admin-controlled — locked v26.7</h3>
<div class="sec-p">Each verification gate (COI, business license, food handler, liquor license, food handler manager certificate, etc.) carries a <code>gate_mode</code> attribute set per-portal, per-region, per-tier by admin. Three modes:</div>
<table class="tbl">
  <thead><tr><th>Mode</th><th>Behavior</th><th>UI surface</th></tr></thead>
  <tbody>
    <tr><td><strong>Soft</strong></td><td>Upload optional. Contributes to Trust Score. Surfaces Verified badge tier when gate cleared.</td><td>Pill labeled <code>SOFT</code>. Trust score impact line: <em>+N% to Trust Score</em>.</td></tr>
    <tr><td><strong>Required</strong></td><td>Upload mandatory. Blocks profile from going live. Blocks booking acceptance.</td><td>Pill labeled <code>REQUIRED</code> in coral. Continue button gated.</td></tr>
    <tr><td><strong>Conditional</strong></td><td>Required only if a related condition is true (e.g. liquor license required only if "alcohol service" is in inclusions; food handler required only if "in-house F&B" is in inclusions).</td><td>Pill labeled <code>CONDITIONAL</code>. Surfaces only when condition met.</td></tr>
  </tbody>
</table>

<h3>Default modes by portal — v1 launch</h3>
<table class="tbl">
  <thead><tr><th>Gate</th><th>Vndr</th><th>Catr</th><th>Venu</th><th>Plnr</th></tr></thead>
  <tbody>
    <tr><td>General liability COI</td><td>Soft</td><td>Required</td><td>Soft</td><td>Soft</td></tr>
    <tr><td>Business license</td><td>Soft</td><td>Required</td><td>Soft</td><td>Soft</td></tr>
    <tr><td>Food handler certificate</td><td>n/a</td><td>Required</td><td>Soft (conditional on in-house F&B)</td><td>n/a</td></tr>
    <tr><td>Food handler manager</td><td>n/a</td><td>Required</td><td>n/a</td><td>n/a</td></tr>
    <tr><td>Liquor license</td><td>n/a</td><td>Conditional</td><td>Conditional</td><td>n/a</td></tr>
    <tr><td>SafeTab attestation</td><td>n/a</td><td>Required if liquor license held</td><td>Required if liquor license held</td><td>n/a</td></tr>
  </tbody>
</table>

<h3>Trust Score weighting — locked v26.7</h3>
<div class="sec-p">Verification is a first-class Trust Score component, not a separate badge orbit. Five components:</div>
<table class="tbl">
  <thead><tr><th>Component</th><th>Weight</th><th>Sub-mechanic</th></tr></thead>
  <tbody>
    <tr><td>Profile completeness</td><td>30%</td><td>Atmosphere/Signature board (10%), all required fields filled (10%), founding story complete (5%), 3+ spaces or services defined (5%)</td></tr>
    <tr><td>Verification</td><td>25%</td><td>Each cleared soft gate contributes proportionally; required gates are pass/fail (zero credit if not cleared)</td></tr>
    <tr><td>Response time</td><td>20%</td><td>Median first-response time within 1 hour to qualified inquiries</td></tr>
    <tr><td>Booking completion</td><td>15%</td><td>% of accepted inquiries that reach event-day without cancellation</td></tr>
    <tr><td>Reviews</td><td>10%</td><td>Average post-event Orgnz review score, weighted by recency</td></tr>
  </tbody>
</table>
```

**Why:** Soft/required/conditional was an implicit pattern; v26.7 locks it as schema. Trust Score weighting was previously in §75.1 in piecemeal form; centralizing it here makes it canonical for all four portals (not just Venu).

---

## Patch 3 — §34 Fee Flows / Voice (surgical update)

**Find:** `<div class="sec" id="s34">`

**What to add:**

```html
<h3>User-facing language — locked v26.7</h3>
<div class="sec-p"><strong>The word "commission" is reserved for internal/schema use only.</strong> Venue managers think in fees, passes, and hold-backs — not commissions. User-facing copy uses:</div>
<table class="tbl">
  <thead><tr><th>Schema enum (preserved)</th><th>Internal name</th><th>User-facing label</th></tr></thead>
  <tbody>
    <tr><td><code>venue_in_house</code></td><td>In-house commission</td><td><strong>In-house fees</strong> (charged to Orgnz)</td></tr>
    <tr><td><code>venue_fb_surcharge</code></td><td>F&B surcharge commission</td><td><strong>F&B surcharge</strong> (charged to outside Catr)</td></tr>
    <tr><td><code>venue_kickback</code></td><td>Vendor kickback</td><td><strong>Preferred vendor pass</strong> (received from Vndr)</td></tr>
    <tr><td><code>venue_referral</code></td><td>Plnr referral commission</td><td><strong>Planner sourcing fee</strong> (paid to Plnr)</td></tr>
  </tbody>
</table>
<div class="sec-p">The DB enum strings remain unchanged. Migration risk = zero. Only the UI copy changes. Surface in the §85 Workstation as <em>"How money moves"</em> or <em>"Earnings &amp; ledger"</em>; never as "commissions" anywhere a venue manager will read it.</div>

<h3>Ledger panel surface — locked v26.7</h3>
<div class="sec-p">All four flows render in the same dashboard ledger panel ("Earnings &amp; ledger" or "Your earnings"). Each row shows: flow name (user-facing), counterparty direction (From/To Orgnz/Catr/Vndr/Plnr), period total. The panel is the canonical surfacing of §34 in the workstation. Never bury behind tabs or settings.</div>
```

**Why:** "Commission" was leaking into user surfaces because the schema uses it. Locking the user-facing rename here gives every future workstation surface a deterministic answer when the question comes up. Schema code stays put; DB migrations not affected.

---

## Patch 4 — §47 Mood/Signature/Atmosphere Boards (surgical update)

**Find:** `<div class="sec" id="s47">`

**What to add:**

```html
<h3>Three-vector pattern — locked v26.7</h3>
<div class="sec-p">The same <code>mood_boards</code> + <code>mood_board_items</code> infrastructure carries three role-specific vectors:</div>
<table class="tbl">
  <thead><tr><th>Role</th><th>Vector</th><th>Label in UI</th><th>Question</th></tr></thead>
  <tbody>
    <tr><td>Orgnz</td><td>What I want</td><td>Mood Board</td><td><em>"How do I want this to feel?"</em></td></tr>
    <tr><td>Vndr</td><td>What I make</td><td>Signature Board</td><td><em>"What kind of work do I do?"</em></td></tr>
    <tr><td>Venu</td><td>How it feels here</td><td>Atmosphere Board</td><td><em>"How does my space feel to host an event in?"</em></td></tr>
  </tbody>
</table>

<h3>Atmosphere Board collapse pattern — locked v26.7</h3>
<div class="sec-p">Once a Venu's Atmosphere Board has 6+ photos uploaded AND the venue manager has affirmatively attested to ownership, the 9-cell upload grid auto-collapses to a horizontal thumbnail strip plus the four-dimension Cue read. An <em>"Edit board"</em> ghost-button in the card header re-expands. <strong>Architectural principle:</strong> form chrome should be busy where decisions are happening, quiet where decisions are settled. Apply this collapse pattern to other multi-input fields where ownership attestation gates completion (Vndr Signature Board on the same trigger; Orgnz Mood Board does not collapse because it's perpetually being edited).</div>

<h3>Custom-Cue color convention — locked v26.7</h3>
<div class="sec-p">When a user adds custom content the platform did not suggest (custom inclusions, custom restrictions, manual category overrides), the resulting pill or chip renders in <strong>rose</strong> — the same color as the Cue voice block. The semiotic loop: the user's specific contribution wears the same color as the platform's interpretation engine, signaling that <em>the platform is listening to your specific truth here</em>. Distinct from suggested content (bay blue / coral / role accent).</div>
```

**Why:** The collapse pattern and the custom-Cue color convention emerged in the Venu session and proved useful enough to canonicalize. Three-vector table was implicit; making it explicit prevents future drift toward mood board / atmosphere board confusion.

---

## Patch 5 — §70 Free-until-first-booking (MERGED INTO PATCH 1)

**Status:** §70 did not pre-exist as a standalone section in v26.6. The free-until-first-booking activation lifecycle (Phase 1 → Phase 2 → Phase 3) and the acquisition-surface no-pricing rule both landed in **Patch 1 (§19 Pricing & Tiers)** instead, where pricing structures are canonically housed. No standalone §70 added; the conceptual ground is fully covered by §19's new subsections.

If future revisions want a dedicated §70 anchor, it can be added then, citing §19 as the canonical source.

---

## Patch 6 — §75.1 Venu Portal UI (significant update)

**Find:** `<div class="sec" id="s75_1">`

**What to update:**

The existing §75.1 is the legacy "Venue" pre-rename writeup. Two rolling changes:

1. **All "Venue" labels in user-facing copy → "Venu"** (URLs, slugs, page titles, button labels, role names in copy). Schema "venue" enum stays. Wherever §75.1 says *"Venue Dashboard"* it should now read *"Venu Dashboard"*. Find-replace inside the section.

2. **Add the v26.7 lessons from the freemium build:**

```html
<h3>v26.7 lessons baked in</h3>
<ul>
  <li><strong>Six-stage acquisition arc</strong> mirrors Vndr/Catr structure. Stages: Landing → Type → Profile → Spaces & Pricing → Money flows + Verification → Welcome dashboard. Locked.</li>
  <li><strong>Atmosphere Board collapse pattern</strong> per §47. Once 6+ photos + attestation, collapse to thumbnail strip.</li>
  <li><strong>Editable pill rows</strong> for inclusions and restrictions. Suggested set + × on each active pill + "+ Add your own" inline draft form. Custom inclusions can carry an optional price (rose pill, italic price tag, future quote integration via title attribute).</li>
  <li><strong>Floor plan upload (v1)</strong> — per-layout upload cells (PDF or image), checkmark on uploaded state. Drag-drop builder deferred to Phase 2 per §57.</li>
  <li><strong>Multi-space onboarding</strong> — Hotel / Country club / Museum-Cultural-University / Mixed-use venue types auto-populate 3 spaces in Step 3 with smart placeholders by type.</li>
  <li><strong>Tax-exempt entity flow</strong> — Government and Non-profit entity selections surface a tax-exempt block (auto-checked for Government, optional for Non-profit) plus EIN field. Surfaces on contracts and 1099-K reporting.</li>
  <li><strong>Trust Badge</strong> — circular SVG crest, 4-point star centered, "EVNTCUE · VERIFIED VENUE ·" inscribed perimeter. Three tiers: Verified (bay blue) / Top Venue (silver) / Premier (gold). Tier track on welcome dashboard. Hero-anchored on dashboard.</li>
  <li><strong>Trust Score breakdown panel</strong> per §21 weighting. Verification (25%), Profile (30%), Response (20%), Booking completion (15%), Reviews (10%). Tier track shows progress to next tier.</li>
  <li><strong>Financial metrics with sample data</strong> on welcome dashboard — labeled <em>"Sample · what a busy month looks like"</em>. Real ledger sits below as the zero state. Demo-as-teacher pattern: literacy before data.</li>
  <li><strong>4-state inquiry taxonomy</strong> on welcome dashboard sample inquiry: Ready to book (teal) / Quote sent (bay blue) / Browsing only (gold) / Capacity mismatch (rose, with Cue redirect suggestion).</li>
  <li><strong>Hero copy</strong> locked: "<em>Deposits,</em> not inquiries." Subcopy: "Stop chasing unvetted leads. EvntCue sends you booked clients — vetted, with deposits already in escrow. <em>List free. Reply. Get paid.</em>"</li>
  <li><strong>Topbar chrome</strong>: 4-point star icon + EvntCue wordmark (italic Cormorant <em>Evnt</em> + plain <em>Cue</em>) on the left. Role pill (VENU bay blue) and step indicator on the right. Brand left, role right, step rightmost.</li>
  <li><strong>Comparison strip</strong> on landing — six competitors with feature dimensions: PartySlate (discovery only), Eventbrite Venues (built for ticketed events), HoneyBook (CRM tool, no marketplace demand), The Knot Pro (pay first, hope leads come), Tripleseat (powerful, per-seat cost wall). EvntCue framed as "Free to claim · deposits in escrow / Inquiries arrive qualified."</li>
</ul>

<h3>Workstation lineage — see §85</h3>
<div class="sec-p">The freemium acquisition arc captured here is the <em>front door</em>. Every onboarding decision has a destination in the Workstation: Atmosphere Board → public profile + Cue match input. Floor plan upload → BEO Layout section. Custom inclusions → BEO Inclusions section. Money flows enabled → Earnings ledger panel. Verification gates → Trust Badge tier. See §85 Workstation Architecture for the full schema-to-screen lineage.</div>
```

**Why:** §75.1 was the canonical Venu spec but predated the v26.7 lessons. Folding them in here closes the loop. The workstation lineage callout at the end is the bridge to §85.

---

## Patch 7 — §85 NEW: Workstation Architecture

**Add at end of doc, before final divider:**

```html
<div class="sec" id="s85">
  <div class="sec-ey">85 — Workstation architecture (added v26.7)</div>
  <div class="sec-h">The daily product. The thing the venue manager opens at 8am Monday and closes at 6pm Friday. The SaaS that justifies the subscription. Specced as six surfaces that compose into one product.</div>

  <h3>The principle</h3>
  <div class="sec-p"><strong>The event record is the gravity well.</strong> Every venue's daily life is anchored to specific upcoming events. Inquiries get promoted to events. Quotes hang off events. BEOs are <em>of</em> events. Payments schedule <em>against</em> events. Communications thread <em>through</em> events. Vendor coordination happens <em>for</em> events. Reviews get written <em>about</em> events. The Workstation is structured as orbits around the event record, not as features bolted to a dashboard. Get the event detail view right and the rest of the product's information architecture falls into place. Get it wrong and every other screen has to compensate.</div>

  <h3>The six surfaces</h3>
  <table class="tbl">
    <thead><tr><th>Surface</th><th>Job</th><th>Key tables</th><th>Relationship to event record</th></tr></thead>
    <tbody>
      <tr><td><strong>1 · Event Detail</strong></td><td>The gravity well. Where 80% of working hours happen. Five-tab record: Overview / BEO / Comms / Payments / Tasks.</td><td><code>events</code>, <code>beo_documents</code>, <code>event_communications</code>, <code>payment_schedules</code>, <code>tasks</code>, <code>event_participants</code>, <code>run_of_show</code></td><td>IS the event record. Other surfaces orbit around it.</td></tr>
      <tr><td><strong>2 · Calendar &amp; Pipeline</strong></td><td>Above-the-event navigation. Multi-space day/week/month grid. Pipeline view: stages from inquiry to confirmed.</td><td><code>events</code>, <code>spaces</code>, <code>holds</code>, <code>booking_status_log</code></td><td>Lists events. Click an event → opens Event Detail.</td></tr>
      <tr><td><strong>3 · Inquiry Triage</strong></td><td>The inbox. New inquiries land here with qualification badges. Cue-drafted first responses. Promote to event.</td><td><code>inquiries</code>, <code>event_participants</code>, <code>cue_drafts</code></td><td>Inquiries become events. Triage → promote → opens Event Detail.</td></tr>
      <tr><td><strong>4 · Reporting</strong></td><td>Cross-event analytics. Per §76 global reporting decisions. CSV exports keyed on <code>event_id</code>. Cue narrative leads each report view.</td><td>Aggregates over <code>events</code>, <code>annual_payments</code>, all four §34 fee flows</td><td>Reports across events. Drill-down opens Event Detail filtered to one event.</td></tr>
      <tr><td><strong>5 · Admin / Settings</strong></td><td>Tenant config. Spaces, fees, vendor preferred-list, integrations, gate-mode toggles, user/role permissions, billing.</td><td><code>tenants</code>, <code>spaces</code>, <code>tenant_fee_config</code>, <code>tenant_users</code>, <code>integrations</code>, <code>verification_gate_config</code></td><td>Configures the rules that govern Event Detail behavior.</td></tr>
      <tr><td><strong>6 · Cue Assistant Surface</strong></td><td>Cross-cutting. Where Cue drafts replies, surfaces follow-ups, flags anomalies, narrates reports. Not a tab — a presence threaded through every other surface.</td><td><code>cue_drafts</code>, <code>cue_followups</code>, <code>cue_anomalies</code>, <code>cue_narratives</code></td><td>Acts on events. Cue UI surfaces in every other workstation surface.</td></tr>
    </tbody>
  </table>

  <h3>Build order — locked v26.7</h3>
  <table class="tbl">
    <thead><tr><th>Order</th><th>Surface</th><th>Why this position</th></tr></thead>
    <tbody>
      <tr><td>1</td><td>Event Detail</td><td>The gravity well. Without this, the other five have nothing concrete to point at. Every schema-to-screen lineage decision compounds from here.</td></tr>
      <tr><td>2</td><td>Calendar + Pipeline</td><td>Same population (whoever opens the workstation needs to see what's happening this week). Shares pattern language with Triage. Build together.</td></tr>
      <tr><td>3</td><td>Inquiry Triage</td><td>Where new bookings enter the system. Now that Event Detail exists, Triage has a concrete <em>"promote to event"</em> destination.</td></tr>
      <tr><td>4</td><td>Reporting</td><td>Aggregates over events. Needs Event Detail's data shape locked first.</td></tr>
      <tr><td>5</td><td>Admin / Settings</td><td>Configuration surface. Can be built in parallel with anything but doesn't unblock anything else.</td></tr>
      <tr><td>6</td><td>Cue Assistant Surface</td><td>Threads through everything. Designs only crystallize once the surfaces it threads through exist. Build last.</td></tr>
    </tbody>
  </table>

  <h3>Cross-portal scope</h3>
  <div class="sec-p">Each surface has portal-specific variants. The Workstation isn't four separate workstations; it's one architectural pattern with four content-and-permission variants. A Vndr Event Detail and a Venu Event Detail share component vocabulary, RLS scope, and Cue surface conventions; they differ in tab content (Vndr has no BEO; Venu has no booth setup logistics) and in default views. Each handoff specifies its own portal scope. <strong>Never build a portal-specific workstation surface without confirming the four-portal pattern.</strong></div>

  <h3>Schema-to-screen lineage — first artifact of every workstation session</h3>
  <div class="sec-p">Before drawing a rectangle in any workstation session, produce a schema-to-screen lineage map for that surface. For Event Detail: every column in <code>events</code>, <code>beo_documents</code>, <code>event_communications</code>, <code>payment_schedules</code>, <code>tasks</code>, <code>event_participants</code> maps to a tab and a UI element. RLS scope identified per role. This map is the brief that prevents the workstation from becoming a thousand small compromises against the schema.</div>

  <h3>Drift policy</h3>
  <div class="sec-p">If a Workstation session's design conflicts with this masterdoc, the masterdoc wins until the session produces a written exception ratified by the next masterdoc revision. The handoff prompts enforce this by instructing future Claude to read the masterdoc first, write the plan in writing, refuse to ship code that conflicts with locked decisions. Drift is inevitable across multi-session work; this is the governance that catches it.</div>

  <h3>Cross-references</h3>
  <ul>
    <li><strong>§19</strong> — Pricing &amp; tier activation (free-until-first-booking)</li>
    <li><strong>§21</strong> — Verification gates &amp; Trust Score weighting</li>
    <li><strong>§27</strong> — Venue confirmation gate (architectural unlock for vendor booking)</li>
    <li><strong>§34</strong> — Fee flows (the four flows, user-facing language)</li>
    <li><strong>§47</strong> — Mood/Signature/Atmosphere Board pattern</li>
    <li><strong>§57</strong> — Floor plan builder build-vs-integrate decision</li>
    <li><strong>§70</strong> — Free-until-first-booking model</li>
    <li><strong>§75 / §75.1 / future §75.2</strong> — Portal-specific UI specs (Vndr / Venu / Catr)</li>
    <li><strong>§76</strong> — Reporting global decisions</li>
    <li><strong>§77, §78, §79, §80</strong> — Per-portal reporting specs</li>
  </ul>
</div>

<div class="divider"></div>
```

**Why:** New canonical anchor for all six workstation handoffs. Establishes the gravity-well principle, locks build order, and codifies the drift policy. Cross-references prevent the section from becoming an island.

---

## Patch 8 — Revision log entry (§20 update)

**Find:** `<div class="sec" id="s20">` revision log table.

**What to add as new row at top of `<tbody>`:**

```html
<tr><td><strong>26.7</strong></td><td>May 2026</td><td>Workstation phase begins. <strong>§85 added:</strong> Workstation architecture, six surfaces, gravity-well principle, build order locked, drift policy. <strong>§19 patched:</strong> Free-until-first-booking activation model locked; Pro v2 pricing recommendation $199/mo · $169/mo annual pending; acquisition-surface no-pricing rule. <strong>§21 patched:</strong> Soft/Required/Conditional gate modes admin-controlled; default modes by portal table; Trust Score weighting locked at 5 components. <strong>§34 patched:</strong> User-facing language locked — schema enums preserve "commission" terminology, UI never uses it; ledger panel surface canonicalized. <strong>§47 patched:</strong> Three-vector table; Atmosphere Board collapse pattern; custom-Cue color convention. <strong>§70 patched:</strong> Acquisition copy rule explicit. <strong>§75.1 patched:</strong> v26.7 lessons baked in; "Venue" → "Venu" labels in user-facing copy; workstation lineage cross-reference. Three intakes (Vndr, Venu, Orgnz) shipped and locked. Workstation phase begins with Event Detail handoff.</td></tr>
```

**Why:** Revision log is the canonical change record. Every patch in this manifest must appear here.

---

## Verification checklist after applying patches

1. Search for `commission` in user-facing copy paths — should find only schema enum mentions, never UI strings.
2. Search for `$149` in landing-page copy paths — should find only references in §19 and §75.1 (the historical price), never in any acquisition file.
3. Open §85 anchor — should render with all subsections and cross-reference table.
4. Open §20 revision log — should show v26.7 row at top.
5. Search for `Venue` (with vowel) in §75.1 — minimize occurrences; only legacy references should remain, all UI labels should read "Venu".
6. The masterdoc filename should now be `EvntCue_Master_v26_7.html`.

---

## What this manifest does NOT do

- Does not change the database schema. All DB enums, table names, foreign keys remain exactly as v25/v26 specced.
- Does not modify §76 (Reporting global) — that section is independent and unchanged.
- Does not pre-spec the workstation surface internals — those live in their per-surface handoffs, written below.
- Does not lock Pro v2 pricing — that requires explicit user decision before it canonicalizes.

---

*End of patch manifest. Apply in order. Validate per checklist. Then proceed to workstation handoffs.*
