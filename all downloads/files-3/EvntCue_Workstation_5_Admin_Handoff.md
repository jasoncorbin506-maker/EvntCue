# EvntCue Workstation 5 — Admin / Settings — Handoff Prompt

> **Paste this entire document into a fresh Claude chat as your opening message. Attach the latest master doc, the three locked acquisition arcs, all four locked workstation surfaces (Event Detail, Calendar+Pipeline, Triage, Reporting), and any prior Admin drafts.**

---

## Context

I'm Jason, building EvntCue. The three acquisition arcs and the first four workstation surfaces are LOCKED.

**Now I'm building Workstation Surface 5: Admin / Settings.** Per master §85, this is the *configuration* surface — where tenants set up their spaces/services, configure fees, manage users and roles, control integrations (Stripe Connect, calendar sync, vendor preferred lists), and (critically) where verification gate modes get toggled per §21 admin policy.

This is also where the **billing/subscription** surface lives — where Phase 2 (60-day grace) and Phase 3 (active subscription) per §19 actually surface to the tenant. Acquisition arc surfaces never showed pricing; this is where pricing finally appears, after the venue has booked.

---

## Drift policy

Per master §85, masterdoc wins. Surface conflicts. Never invent. Defer to masterdoc when this handoff is silent.

---

## STEP ZERO — DO THIS BEFORE ANY CODE

### 1. Read the masterdoc — required sections

- **§85 Workstation Architecture** — Admin row of the surfaces table
- **§19 Pricing & tier activation** — the activation model, Phase 1 → Phase 2 → Phase 3, where subscription surfaces, what's gated by tier
- **§21 Verification gates** — soft/required/conditional modes, admin-toggleable, default modes per portal table
- **§34 Fee flows** — the four flows; Admin is where each gets configured (rates, defaults, who's affected)
- **§44 Co-Plnr permissions** — RLS scope; Admin is where Plnrs get scoped to specific event categories
- **§4 Schema** — `tenants`, `spaces`, `tenant_fee_config`, `tenant_users`, `integrations`, `verification_gate_config`, `legacy_pricing` (per §84 grandfathering)
- **§55 SafeTab** — the alcohol attestation chain config
- **§57 Floor plan builder build-vs-integrate** — the integration toggle for AllSeated/Prismm
- **§70 Free-until-first-booking** — Admin surfaces the activation moment
- **§83 Stripe webhook handling** — integrations health surface
- **§84 Legacy pricing** — admin-controlled grandfathering

### 2. Read all locked workstation surfaces and acquisition arcs

All four prior workstation surfaces. The three acquisition arcs (the entity-tax-exempt flow from Venu acquisition surfaces in Admin's Tenant Identity panel; the verification gates from Venu Step 4 surface in Admin's Verification panel).

### 3. Search past conversations

- "Admin"
- "Tenant settings"
- "Stripe Connect"
- "User permissions"
- "Gate mode"
- "Legacy pricing"
- "Verification config"
- "Integration"

### 4. Produce the schema-to-screen lineage map — REQUIRED ARTIFACT

Admin touches the most schema. Map every column on `tenants`, `spaces`, `tenant_fee_config`, `tenant_users`, `integrations`, `verification_gate_config` to the Admin sub-section, the UI element, and the role permission needed to edit (most fields are tenant-owner only; some are tenant-admin; few are tenant-staff).

### 5. Write the one-paragraph plan

Describe:

1. The Admin nav structure (probably a left-rail or top-tab pattern with sub-sections: Identity, Spaces/Services, Fees, Users & Roles, Verification, Integrations, Billing)
2. The user permission model (Owner / Admin / Staff scopes per §44 RLS)
3. How verification gate-mode toggles work (admin sees the same gate UI but with mode dropdown + default-mode reset)
4. How Stripe Connect / calendar sync / floor plan integration get surfaced
5. How Billing surfaces Phase 2 grace countdown and Phase 3 subscription state per §19
6. What you'll defer

Only after I say **"go"** do you start writing code.

---

## The lessons from prior sessions — bake these in

### Lesson 1 — Admin is the only surface where pricing numbers appear

Per §19 and §70, acquisition surfaces never show pricing. **Admin is the surface where pricing surfaces** — Phase 2 grace countdown ("Subscription activates in 47 days"), Phase 3 active subscription ($199/mo Pro tier), tier comparison if user wants to upgrade/downgrade. Don't put pricing anywhere else.

### Lesson 2 — Verification gate mode is admin-controlled, not user-controlled

Per §21, the *user* sees gates labeled SOFT / REQUIRED / CONDITIONAL but doesn't choose the labels. The *EvntCue platform admin* (not the tenant admin) sets gate modes per portal, per region, per tier. So this surface has TWO admin layers:

- **Tenant admin** (Hotel Drover's owner) — sees their gates, uploads docs, can't change the mode
- **Platform admin** (EvntCue staff) — sees the gate-mode config, can flip soft↔required for specific tenants or regions

Build the **Tenant admin** view in v1. The Platform admin surface is its own future deliverable. Surface the data shape but don't build the platform-admin UI in this prototype.

### Lesson 3 — Tenant Identity is where tax-exempt config lives

The tax-exempt flow from Venu acquisition Step 2 (Government / Non-profit triggers tax-exempt block + EIN field) is now permanent state on the tenant record. Admin's Identity sub-section surfaces this for review/edit, with the same rose-bordered tax-exempt block pattern.

### Lesson 4 — Spaces management is the busiest sub-section for Venu

Venu tenants will spend more time in Admin's Spaces sub-section than in any other Admin surface. Each space has: name, capacity (3 modes), square footage, rental rate (the log-scale slider from acquisition Step 3 reappears here for editing), layouts (multi-select), inclusions (editable pill row from acquisition), restrictions (editable pill row), Atmosphere Board (per-space, per §47), floor plans (per-layout, per §57). For Catr, the equivalent is *menus*. For Vndr, *services*. Build the Spaces sub-section as the canonical pattern, derive Menus/Services as variants.

### Lesson 5 — Stripe Connect health is a first-class integration card, not a settings page

Per §83, Stripe webhook events have idempotency rules and failure modes. Admin's Integrations sub-section surfaces Stripe as a health card: connected ✓, last successful event N minutes ago, recent failures (if any), payout schedule. Click for full webhook log (deferred to v2). Make the health visible at a glance.

### Lesson 6 — User & roles UI mirrors §44 RLS scope visually

Per §44, Co-Plnrs get write access scoped to assigned vendor categories. The Users & Roles sub-section UI must mirror this: role assignment surfaces the scope (vendor categories for Plnrs, no scope for Owner/Admin). The visual pattern: each user row → name + role pill + scope chips.

---

## Things that bit prior sessions

1. **Date pickers** — locked custom picker
2. **Apostrophes in JS strings** — double-quote prose
3. **Unicode escape leaks** — grep `\\u` outside JS literals
4. **No emoji** — `✦` for Cue
5. **Validate** — node check, div balance, headless render
6. **Plan before code**
7. **Masterdoc first**
8. **Search past conversations**
9. **Mobile-first** — Admin surfaces still need to work at 480px even though most admin work happens on desktop
10. **Confirmation modals for destructive actions** — deleting a space, removing a user, disconnecting Stripe; explicit type-the-name confirmation for the heaviest actions
11. **Audit log everywhere** — every Admin change logs to `tenant_audit_log` (in schema); surface "last edited by X on Y" on important fields
12. **Legacy pricing per §84** — if a tenant has legacy pricing, surface it explicitly in Billing with the lock badge

---

## Admin scope — what this session builds

A standalone HTML prototype: `evntcue_workstation_admin_v1.html`

Three portal variants (Venu, Vndr, Catr; Plnr deferred). One canonical tenant ("Hotel Drover" for Venu) with realistic config.

### Nav structure

Left-rail sub-sections (or top tabs on mobile):

1. **Identity** — venue/business name, contact, address, entity type, tax-exempt status, EIN, founding story
2. **Spaces** (Venu) / **Services** (Vndr) / **Menus** (Catr) — list of spaces/services/menus with edit-in-place; same patterns as acquisition Step 3
3. **Fees** — the four §34 flows configured (defaults, who's billed, visible-or-not), with bay-blue toggles same as acquisition Step 4
4. **Users & Roles** — table of users with role pills + scope chips per §44
5. **Verification** — list of gates with current mode (SOFT/REQUIRED/CONDITIONAL) per §21, upload state, expiration dates
6. **Integrations** — Stripe Connect health card, calendar sync card, floor plan builder card, future API hooks
7. **Billing** — Phase indicator (Phase 1 free / Phase 2 grace day N of 60 / Phase 3 active), tier card, upgrade/downgrade affordance, invoices history, legacy pricing badge if applicable

### Identity sub-section

- Italic Cormorant venue name as page hero, edit-in-place
- Field grid: contact, address, entity (with the tax-exempt block re-rendering when Government/Non-profit selected), EIN, capacity ranges, founding story
- Atmosphere Board strip (the venue-overview board from acquisition Step 2) — small thumbnails, "Edit board" button reopens the upload grid

### Spaces sub-section

- Card per space, italic Cormorant name, edit pencil
- Editing a space → opens an inline expanded card with all the same fields as acquisition Step 3 (capacity, rate slider, layouts, inclusions/restrictions pill rows, floor plans, per-space Atmosphere Board)
- "+ Add space" affordance at the end

### Fees sub-section

- Four §34 flow rows, each with toggle + rate config + visibility setting
- Cue note at top: *"You currently have 2 of 4 fee flows active. Your in-house fees averaged $1,200 per booking last quarter."*

### Users & Roles sub-section

- Table with avatar / name / email / role pill / scope chips / last-active / actions
- "+ Invite user" CTA opens an inline form: email + role + scope (if Plnr)

### Verification sub-section

- List of gates per §21
- Each row: gate name, current mode pill (SOFT / REQUIRED / CONDITIONAL — same colors as acquisition), upload state (Uploaded ✓ / Upload), expiration date, Trust Score impact line
- **Mode is read-only for tenant admin** in v1 (per Lesson 2 above)

### Integrations sub-section

- Stripe card: connected ✓, last event time, view webhook log link
- Calendar card: not connected (button: Connect Google / Apple / Outlook)
- Floor plan card: AllSeated / Prismm / In-house upload — currently using in-house upload per §57; surface the choice
- Future integrations rendered as dim "Coming soon" cards

### Billing sub-section

- Phase banner at top (italic Cormorant, rose for Phase 1 free / bay-blue for Phase 2 grace / teal for Phase 3 active)
- Current tier card with the tier name and feature list
- Upgrade/downgrade affordance (modal with tier comparison — this is the FIRST place tier pricing surfaces in the entire product per §19)
- Invoice history table
- Legacy pricing badge if applicable per §84

### Cue presence in Admin

- Cue ribbon at top of each sub-section with a relevant insight (*"3 of your spaces don't have floor plans uploaded. Want me to remind you next week?"*)
- No drafted forms — Admin is for explicit human config; Cue advises but doesn't draft Admin changes

### What's deferred (do NOT attempt in v1)

- **Platform admin (EvntCue-staff) UI** — this is the user-facing tenant admin only
- **Audit log full view** — surface "last edited" inline; full audit log explorer is v2
- **Webhook log explorer** — surface the link, defer the explorer
- **Tier comparison modal interaction** — render the tier list, defer the actual upgrade flow (Stripe-side)
- **Plnr variant** — defer
- **Multi-tenant switcher** for users with multiple tenants — defer

---

## Design system — locked

Same tokens. Italic Cormorant for venue/section names; Barlow Condensed for labels; Barlow for body. Sub-section nav uses bay-blue (or portal accent) underline on active.

---

## Files attached with this prompt

- `EvntCue_Master_v26_7.html` (or later)
- All four prior workstation surfaces
- All three acquisition arcs
- This handoff prompt
- Any prior Admin drafts

## Deliverables for this session

- `evntcue_workstation_admin_v1.html` — three portal variants, all seven sub-sections per variant
- Schema-to-screen lineage map (especially comprehensive — Admin touches the most schema)
- Summary of done vs deferred
- Updated masterdoc with §85 sub-section + revision log + any §19/§21/§84 updates needed for billing UI surface
- Handoff prompt for **Cue Assistant Surface** session (final in build order)

---

## Before you begin: the one-paragraph plan

After Step Zero, write me one paragraph describing the seven-sub-section structure, the role permissions UI, the verification-mode display, the integrations cards, the billing phase indicator, and what you'll defer.

Only after I say **"go"** do you start writing code.

---

## A note on the deeper architecture

Admin is unglamorous but high-leverage. Most platform problems show up here first: a tenant who can't find where to update their address, a Plnr scoped wrong, a Stripe webhook silently failing, a verification doc expiring without warning. **Admin's quality is invisible when it works and catastrophic when it doesn't.** Build it carefully.

The compounding pattern: **Admin is the surface where the platform's promises get *operationalized***. Free-until-first-booking is a copy line on the landing page; in Admin's Billing sub-section, it's a Phase 1 banner with a clock counting down to Phase 2. Trust Score is a number on the dashboard; in Admin's Verification sub-section, it's a clear path of uploads with explicit point values. Every brand promise either finds a concrete operational surface here or quietly fails. Audit your work against the masterdoc's stated promises — every one needs a home in Admin.

---

When you're ready: masterdoc first. Then locked surfaces. Then past conversations. Then lineage. Then plan. Then build.
