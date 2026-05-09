# EvntCue Workstation 1 — Event Detail — Handoff Prompt

> **Paste this entire document into a fresh Claude chat as your opening message. Attach the latest master doc (`EvntCue_Master_v26_7.html` — apply the patch manifest first if you only have v26.6), the three locked acquisition arc files (`evntcue_orgnz_freemium_v1.html`, `evntcue_vndr_freemium_v1.html`, `evntcue_venu_freemium_v2.html`), and any prior workstation drafts.**

---

## Context

I'm Jason, building EvntCue — a multi-tenant event-planning platform with five portal roles (Orgnz, Plnr, Vndr, Catr, Venu) plus a Cue AI assistant. The three intake/acquisition arcs are LOCKED and shipped (Orgnz, Vndr, Venu). The full schema is built (82 tables, 4 views, 44 enums, 202 indexes, 148 RLS policies — see master §4).

**Now I'm building the Workstation. This is Surface 1 of 6: Event Detail.** Per master §85, this is the gravity well — the surface where 80% of working hours happen, the SaaS that justifies the subscription, the screen the venue manager opens at 8am Monday and closes at 6pm Friday.

The Event Detail view is structurally the most important screen in the entire product. Every other workstation surface (Calendar, Triage, Reporting, Admin, Cue) orbits around it. **Get this right and the rest falls into place. Get it wrong and every other screen has to compensate.**

---

## Drift policy — read this first

Per master §85, **the masterdoc is the source of truth across sessions**. If anything in this handoff or in your interpretation conflicts with the masterdoc, the masterdoc wins until a written exception is ratified. Drift is the failure mode of multi-session work; the policy that catches it is:

1. Read the masterdoc first, every session
2. Write the plan in writing before code
3. Refuse to ship code that conflicts with locked decisions
4. Surface conflicts explicitly: *"§N says X, you're asking me to do Y, which wins?"*

Wherever this handoff is silent, defer to the masterdoc. Wherever the masterdoc is silent, surface the gap and ask. Never invent.

---

## STEP ZERO — DO THIS BEFORE ANY CODE

Five things, in this order, **in writing**, before you write a single byte of code.

### 1. Read the masterdoc — required sections

- **§85 Workstation Architecture** — the canonical brief for all six workstation surfaces. Read in full.
- **§4 Schema** — the tables Event Detail surfaces. Specifically: `events`, `beo_documents`, `event_communications`, `payment_schedules`, `tasks`, `event_participants`, `run_of_show`, `cue_drafts`, `cue_followups`, plus all foreign keys touching `events`.
- **§27 Venue confirmation gate** — the architectural unlock for vendor booking. Surfaces in Event Detail status logic.
- **§34 Fee flows** — the four flows. They surface in Payments tab. Use **user-facing language** (In-house fees, F&B surcharge, Preferred vendor pass, Planner sourcing fee), never schema codes.
- **§44 Co-Plnr permissions** — Plnrs can be co-assigned with scoped write access. Event Detail must respect this RLS.
- **§47 Boards** — Mood / Signature / Atmosphere boards surface as participant-context inside Event Detail (not as their own tab).
- **§55 SafeTab** — the alcohol-service waiver attestation chain. Surfaces in Event Detail Tasks.
- **§76 Reporting** — Cue narrative pattern, used in Event Detail summary panels.
- **§80, §82, §83** — per-portal reporting specs that drill down to Event Detail.

For each section, write 2-3 sentences in your plan describing what it says about Event Detail. Surface contradictions before building.

### 2. Read all three locked acquisition arcs

Open and skim each:

- `evntcue_orgnz_freemium_v1.html` — locked. Mood Board lives here.
- `evntcue_vndr_freemium_v1.html` — locked. Signature Board lives here.
- `evntcue_venu_freemium_v2.html` — locked. Atmosphere Board, the four-state inquiry taxonomy, the Trust Badge artwork, the editable pill rows, the floor plan upload component, the financial metrics card, the trust score breakdown panel — all live here.

**You are not redesigning these. You are continuing them.** Visual language locked: italic Cormorant for warm/named entities, Barlow Condensed for labels, Barlow for body. Bay blue (Venu), coral (Vndr), rose (Orgnz, Cue, custom). 4-point star brand mark. EvntCue wordmark left, role pill right, step/breadcrumb rightmost. SVG line-art icons. No emoji except the brand `✦` reserved for Cue.

### 3. Search past conversations

Run `conversation_search` for:

- "Event Detail"
- "BEO acknowledgment"
- "Run of show"
- "Event participants"
- "Workstation"
- "Tripleseat"
- "event record"

Decisions were made across multiple sessions that you shouldn't have to re-derive.

### 4. Produce the schema-to-screen lineage map — REQUIRED ARTIFACT

Per master §85, the first artifact of every workstation session is the schema-to-screen lineage map. Before drawing a rectangle, produce a Markdown table with these columns:

| Schema column | Tab/Section | UI element | RLS scope by role |
|---|---|---|---|

For every column in: `events`, `beo_documents`, `event_communications`, `payment_schedules`, `tasks`, `event_participants`, `run_of_show`, `cue_drafts`. Identify which tab the column surfaces in, which UI element renders it, and which roles see it under RLS.

This is the brief that prevents the workstation from becoming a thousand small compromises against the schema. **Don't skip it.** I'd rather wait an extra hour for a clean lineage than ship a screen that violates RLS in three places.

### 5. Write the one-paragraph plan

After all four steps above, write me one paragraph in plain language describing:

1. The five tabs you'll build (Overview / BEO / Comms / Payments / Tasks) — confirm scope
2. How portal-variant rendering works (Venu sees BEO; Vndr sees deliverables instead of BEO; Catr sees menu+kitchen passport instead of BEO; Orgnz sees the participant view of all three)
3. How the Cue Assistant Surface threads through Event Detail (drafts in Comms, followups in Tasks, narrative in Overview, anomaly flags in Payments)
4. How RLS gates which tabs and which fields each role sees
5. What you'll defer

Only after I say **"go"** do you start writing code.

---

## The five lessons from prior sessions — bake these in

The acquisition-arc sessions surfaced patterns now canonical. Re-derive nothing.

### Lesson 1 — Schema-to-screen lineage before pixels

The temptation to start with a "five tab" sketch and back-fill the schema later produces beautiful screens that violate RLS, drop fields, or invent data. The lineage map is the brief. Ship it before any HTML.

### Lesson 2 — One screen, four portals — variant rendering, not four screens

Per §85, the Workstation is one architectural pattern with four content variants. Event Detail is one component that renders different tab sets and field masks based on the viewer's role. Not four parallel screens. Build the variant logic once; trust it across portals.

### Lesson 3 — Cue is presence, not feature

Cue surfaces in Event Detail as: drafted replies in Comms (rose-bordered draft block, "Send as drafted" + "Edit" pair), follow-up tasks in Tasks tab (with explicit "Cue will follow up Aug 29" framing), narrative leads on Overview ("Cumbres Norte requires $1M COI by Aug 29"), and anomaly flags on Payments. Cue is not a tab. Cue is the connective tissue.

### Lesson 4 — Demo-as-teacher pattern for empty states

Per §47 and the Venu welcome dashboard, when an event is in early state and panels are empty, surface sample/preview data labeled clearly so the venue manager learns the metrics vocabulary. *"This is what your BEO will look like"* / *"This is what your Comms thread will look like."* Real data replaces sample once it exists. Empty states should teach, not stare.

### Lesson 5 — Italic Cormorant for the named, Barlow Condensed for the labeled

Event names, participant names, run-of-show item titles, payment row titles, BEO section names — all italic Cormorant 14-30px depending on hierarchy. Field labels, metadata, status pills — all Barlow Condensed uppercase 9-11px with letter-spacing. This is the typographic discipline that makes the product feel authored, not generated.

---

## Things that bit prior sessions — read every one

1. **Calendar pickers.** Native `<input type="date">` is broken on mobile. Use the locked custom picker pattern from Orgnz v8 / Venu v2 if any date input is needed inside Event Detail.

2. **JS strings with apostrophes.** `'we'll move fast'` causes syntax errors. Default to double-quoted strings or template literals. Use `\u2019` for curly apostrophes and `\u2014` for em dashes inside string literals.

3. **Unicode escapes leaking as text.** The `create_file` tool can write Python-style `\u2026` literally as text instead of rendering. Validate by grepping for `\\u` outside JS string literals — there should be zero matches.

4. **No emoji ever.** Brand `✦` reserved for Cue. SVG line-art icons for everything else.

5. **Validate before delivering.** `node --check` parse the JS, count `<div>` opens vs closes, render in headless browser, confirm no console errors. Don't ship unvalidated.

6. **Plan in writing before code.** Skipping the plan = defaulting to generic.

7. **Master doc first, every session.** The rule that prevents drift.

8. **Search past conversations before assuming.** Decisions don't carry over automatically.

9. **Ownership attestation triple-layer for any image upload** — per §47. URL paste blocklist, own-domain check, affirmative attestation checkbox. Even if Event Detail only uploads BEO floor plans (not photos), the same three-layer pattern applies to any user-content upload.

10. **The "one glance" rule.** Every panel in Event Detail should answer the question it's named for in one glance, with detail underneath. The Payments panel: net-to-account number first, breakdown below. The BEO panel: layout + setup window first, details below. The Tasks panel: open count first, list below.

---

## Event Detail scope — what this session builds

A standalone HTML prototype: `evntcue_workstation_event_detail_v1.html`

Same design language as the three acquisition arcs. **Three demonstration views** rendered as separate prototype pages within the same file (or via tab switching at the top), one per portal variant: **Venu**, **Vndr**, **Catr**. The Plnr variant can be deferred to v2 (Plnrs primarily consume Event Detail through the Orgnz/Venu views per §44 RLS scope).

### The Event Detail screen — five tabs

Each tab is structured per the schema-to-screen lineage. Build one canonical event ("Marisol & Diego, Sat Sep 12 2026, 140 guests, Garden Terrace, Hotel Drover") populated with realistic data. Render all three portal variants of that same event.

#### Tab 1 — Overview

- **Event hero**: status pill (Confirmed · Date locked / Quote sent / Browsing only / Capacity mismatch), italic Cormorant event name, 3-stat row (Booking total · Deposit held · Days out), participant avatars
- **Run of show** card: time-stamped rows, italic time in bay blue/role accent, item title + sub-detail. Auto-generated from event template per §26, editable inline
- **Event participants** card: role-colored avatar circles (rose for Orgnz, blue for Plnr, gold for Catr, teal for Vndrs aggregated), name + role line per row
- **Cue narrative panel**: rose-bordered, italic Cormorant insight ("Cumbres Norte requires $1M COI by Aug 29. I will follow up with them in 14 days.")

#### Tab 2 — BEO (Venu) / Deliverables (Vndr) / Menu+Kitchen (Catr)

- **Venu BEO**: Layout & Setup section (layout type, floor plan PDF link, setup/strike windows), Inclusions section (with rose-flagged custom items per §47), Restrictions section, Acknowledgments section (3-row signature chain: Venu, Orgnz, Catr — done/pending states with Cue-follow-up annotation)
- **Vndr Deliverables**: Per-vendor work scope, due dates, asset uploads, acknowledgment chain
- **Catr Menu + Kitchen Passport**: Final menu lock, food cost calc, dietary flags, SafeTab attestation, kitchen passport status

#### Tab 3 — Comms

- **Single event thread** — all participants on one channel
- Message rows with role-colored avatars
- **Cue drafted reply** rendered as rose-bordered block with `SUGGESTED:` eyebrow, draft text, Send-as-drafted (primary blue) + Edit (ghost) buttons
- Compose bar at bottom: input + Send button
- Per §44, Co-Plnrs see their scoped messages only (not the full thread)

#### Tab 4 — Payments

- **Payment schedule** card: 4-row schedule per §27 escrow lifecycle
  - Initial deposit (cleared, in escrow, teal)
  - Second installment (scheduled, gold pending status)
  - Final balance (scheduled, 7 days before event, gold)
  - Release to your account (48hr post-event, bay blue, dashed-top divider)
- Net-of-platform-fee number prominent
- Cue anomaly flags ("Final balance is 23% above your category average" or "Catr surcharge unusually high — review")
- Per-portal variant: Vndr sees their own payment row; Catr sees food cost vs. revenue net

#### Tab 5 — Tasks

- Open / Done counts in card header
- Checkbox rows: open + done, strikethrough on done
- Cue-generated tasks with explicit attribution ("Cue will follow up Aug 29")
- Task creation: inline + button at end of list

### Drawer / modal vs. full page

Decision deferred to your plan. Tripleseat treats Event Detail as a full page (URL: `/events/{event_id}`). HoneyBook uses a side panel. Recommendation: **full page on desktop, full-screen modal on mobile**, sliding up from the bottom (the same drawer pattern used in past prototypes, but covering 100% viewport instead of 92%). State your call in the plan.

### What's deferred (do NOT attempt in v1)

- **Plnr variant** — Plnrs consume Event Detail through other portals' views per §44; full Plnr-specific variant comes in v2
- **Real-time WebSocket Comms** — render the thread, but live presence/typing indicators are Phase 3
- **Floor plan annotations / drag-drop edit** — surface the PDF link, defer the editor (per §57)
- **Multi-event batch BEO send** — single event view only
- **Audit log / change history** — defer to v2; schema supports it via `booking_status_log`

---

## Design system — non-negotiable

Pulled forward from the locked acquisition arc files. Use exactly:

```css
:root{
  --ink:#050A14; --ink2:#0B1220; --ink3:#111928; --ink4:#152136;
  /* Portal accents — locked §18 */
  --blue:#2A6BDB; /* Venu */
  --bl:rgba(42,107,219,0.11); --bb:rgba(42,107,219,0.32); --bt:#7EB3F5;
  --coral:#E8622A; /* Vndr */
  --cl:rgba(232,98,42,0.11); --cb:rgba(232,98,42,0.32); --ct:#F5A882;
  --rose:#D4778A; /* Orgnz + Cue (cross-portal) + custom */
  --rl:rgba(212,119,138,0.11); --rb:rgba(212,119,138,0.32); --rt:#E8A0B0;
  --gold:#C98A1A; /* Catr */
  --gl:rgba(201,138,26,0.11); --gt:#E8C46A;
  --teal:#1A9E82; --tl:rgba(26,158,130,0.11); --tt:#5DCAA5;
  --txt:rgba(255,255,255,0.92); --txt2:rgba(255,255,255,0.56); --txt3:rgba(255,255,255,0.28);
  --bdr:rgba(255,255,255,0.08);
  --fn:'Barlow',sans-serif;
  --fc:'Barlow Condensed',sans-serif;
  --fd:'Cormorant Garamond',serif;
}
```

Topbar: 4-point star brand mark + EvntCue wordmark (italic Cormorant `Evnt` muted + plain `Cue` white) on left. Role pill + breadcrumb on right. Same chrome as Venu v2.

---

## Cue voice patterns inside Event Detail

Per master §47/§76, Cue stays humble and italic. Specific patterns Event Detail introduces:

- **Cue narrative on Overview**: declarative insight, italic Cormorant, rose accent on the noun. *"Cumbres Norte requires $1M COI by Aug 29. I will follow up with them in 14 days."*
- **Cue draft in Comms**: SUGGESTED eyebrow + draft text in rose-bordered block. Two buttons: primary "Send as drafted", ghost "Edit".
- **Cue follow-up in Tasks**: Task line annotated *"Cue will follow up Aug 29"* in rose. Task creator badge: a Cue avatar (the `✦` glyph) instead of the venue manager's avatar.
- **Cue anomaly in Payments**: Inline pill on a payment row. *"This is 23% above your average — review"*. Rose pill with subtle shake animation on first render.

The pattern: Cue makes a specific, dated, named-noun assertion. Never vague. Never "have you considered..." Always "I'll do X by Y" or "I noticed N, here's why."

---

## Files attached with this prompt

- `EvntCue_Master_v26_7.html` — masterdoc, source of truth (apply patches from `EvntCue_Master_v26_7_PATCHES.md` first if you only have v26.6)
- `evntcue_orgnz_freemium_v1.html` — locked acquisition arc, Mood Board reference
- `evntcue_vndr_freemium_v1.html` — locked acquisition arc, Signature Board reference
- `evntcue_venu_freemium_v2.html` — locked acquisition arc, Atmosphere Board / Trust Badge / pill row / financial metrics references
- This handoff prompt — workflow guide
- Any prior workstation drafts (if attached)

## Deliverables for this session

- A standalone `evntcue_workstation_event_detail_v1.html` ready for Claude Code, three portal variants of one canonical event (Venu, Vndr, Catr; Plnr deferred)
- Schema-to-screen lineage map (Markdown table) — first artifact, ships before HTML
- Summary of done vs deferred
- Updated `EvntCue_Master_v26_X.html` with §85 reflecting Event Detail decisions made in this session (revision log entry, any new sub-sections)
- Handoff prompt for **Calendar + Pipeline** session (the next surface in build order)

---

## Before you begin: the one-paragraph plan

When you've finished Step Zero — reading the masterdoc, reading the three acquisition arcs, searching past conversations, producing the schema-to-screen lineage map — write me one paragraph describing:

1. The five-tab structure with portal-variant rendering plan
2. How RLS-by-role gates which fields surface
3. The Cue presence pattern across all five tabs
4. Drawer vs. full-page decision
5. What you'll defer

Only after I say **"go"** do you start writing code.

---

## A note on the deeper architecture you're walking into

Event Detail is the surface that determines whether EvntCue is a marketplace plugin or a SaaS company. Tripleseat charges $250-$500/mo for *exactly this surface*, plus its calendar and reporting. HoneyBook charges $39-$129/mo for the project workspace equivalent. Get Event Detail right and EvntCue justifies a real subscription tier. Get it wrong and the platform drops to marketplace-fee economics.

The architectural pivot the acquisition arcs proved: **every input does multiple jobs**. The Atmosphere Board is portfolio + match input + trust signal. Custom inclusions are configuration + BEO content + future quote line items. The Trust Badge is reputation marker + verification surface + search-rank multiplier. Event Detail must compound this further: **every column on `events` must do at least three jobs across at least two surfaces**. If you find yourself adding a UI element that surfaces a single column in a single context, you've under-designed it. The schema-to-screen lineage map is the discipline that prevents this — every column gets its full surface footprint mapped before pixels.

That compounding is what makes EvntCue feel like it knows things other platforms don't. Build to it.

---

When you're ready: read the masterdoc first. Then the three acquisition arcs. Then search past conversations. Then produce the schema-to-screen lineage. Then write the plan. Then build.
