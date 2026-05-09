# EvntCue Workstation 2 — Calendar + Pipeline — Handoff Prompt

> **Paste this entire document into a fresh Claude chat as your opening message. Attach the latest master doc (`EvntCue_Master_v26_7.html` or later), the three locked acquisition arc files, the locked Event Detail file (`evntcue_workstation_event_detail_v1.html`), and any prior Calendar/Pipeline drafts.**

---

## Context

I'm Jason, building EvntCue. The three acquisition arcs are LOCKED (Orgnz, Vndr, Venu). Workstation Surface 1 (Event Detail) is shipped and locked.

**Now I'm building Workstation Surface 2: Calendar + Pipeline.** Per master §85, this is the *above-the-event* navigation layer — the surface where the venue/vendor/caterer scans their week, sees what's coming, and decides where to focus attention. Click any event → opens Event Detail.

Two views, one surface:

- **Calendar** — multi-space day/week/month grid showing confirmed bookings (B), holds (H), inquiries (I), with portal-specific space dimensions (Venu = physical spaces; Vndr = team members or service slots; Catr = kitchen blocks; Plnr = clients)
- **Pipeline** — Kanban-style stage view: New → Quoted → Hold → Confirmed → Completed → Reviewed. Each card is an event in flight; drag (or tap) to advance.

This surface is what makes Tripleseat feel like an operations tool instead of a CRM. It's the *"what's my week"* layer.

---

## Drift policy — read this first

Per master §85, the masterdoc is source of truth. Conflicts → masterdoc wins until written exception. Surface conflicts explicitly. Never invent. Wherever this handoff is silent, defer to the masterdoc.

---

## STEP ZERO — DO THIS BEFORE ANY CODE

### 1. Read the masterdoc — required sections

- **§85 Workstation Architecture** — full, especially the Calendar/Pipeline row of the surfaces table and the build-order rationale
- **§4 Schema** — `events`, `spaces`, `holds`, `booking_status_log`, `event_participants`, plus the date/time fields and status enums on `events`
- **§27 Venue confirmation gate** — defines the inquiry → quote → hold → confirmed transitions; Pipeline stages mirror this lifecycle
- **§44 Co-Plnr permissions** — RLS scope for who sees which events on the calendar
- **§75.1** — Venu portal multi-space calendar spec (the Welcome dashboard preview was a sketch; this is the full version)
- **§75 / §75.2** — Vndr and Catr portal calendar specs (your team-availability vs. your kitchen-block scopes)

For each section, write 2-3 sentences in your plan describing what it says about Calendar/Pipeline.

### 2. Read all locked workstation surfaces and acquisition arcs

- `evntcue_workstation_event_detail_v1.html` — locked. The destination of every calendar click and pipeline tap. Visual language continues from here.
- `evntcue_venu_freemium_v2.html` — the welcome dashboard's mini calendar is the seed of this full calendar. The 7-day grid pattern, the B/H/I markers, the legend — extend, don't redesign.
- `evntcue_vndr_freemium_v1.html` — Vndr workstation will branch from your Venu work, but its scope is different (booking gigs, not rooms).
- `evntcue_orgnz_freemium_v1.html` — Orgnzs see calendar from the participant side; reference the Mood Board pattern only as visual continuity.

### 3. Search past conversations

Run `conversation_search` for:

- "Calendar"
- "Pipeline"
- "Multi-space calendar"
- "Booking status"
- "Tripleseat calendar"
- "drag-and-drop pipeline"
- "Holds"

### 4. Produce the schema-to-screen lineage map — REQUIRED ARTIFACT

Per master §85, ship the lineage map before pixels. Markdown table covering every column in `events`, `spaces`, `holds`, `booking_status_log`, `event_participants` mapped to which view (Calendar / Pipeline) and which UI element. Include RLS scope by role.

### 5. Write the one-paragraph plan

Describe:

1. The two-view structure (Calendar default, Pipeline as toggle) and which loads first per portal
2. How portal-specific axes work (Venu = spaces; Vndr = team/service slots; Catr = kitchen blocks; Plnr = clients)
3. Day / Week / Month density across viewport sizes (mobile-first, but desktop must shine)
4. How a click/tap navigates to Event Detail
5. What you'll defer

Only after I say **"go"** do you start writing code.

---

## The lessons from prior sessions — bake these in

### Lesson 1 — The mini calendar in Venu's welcome dashboard is the seed, not the spec

The 7-day Mon-Sun grid in the welcome dashboard preview is the visual seed. The full Calendar must extend it: Day view with hour-grid, Week view (5- or 7-day), Month view, and a portal-specific axis (rows = spaces for Venu, rows = team members for Vndr, etc.). Use the same B/H/I markers, the same legend, the same color semantics (teal=booked, gold=hold, bay-blue=inquiry).

### Lesson 2 — Pipeline mirrors §27, doesn't invent its own stages

The §27 Venue confirmation gate defines: inquiry → quote → hold → confirmed → completed → reviewed. Pipeline stages are these stages. Never fewer (collapse loses information). Never more (custom stages drift from the schema). The status transition is a `booking_status_log` insertion under the hood.

### Lesson 3 — Portal-specific axes are the variant; the grid pattern is universal

The Calendar component renders one grid. The axis label changes per portal. Venu = "Grand Ballroom / Garden Terrace / Library". Vndr = "Sarah / Marcus / Solo bookings". Catr = "Main kitchen / Prep kitchen / Cold storage". Plnr = "Marisol & Diego / Henley Corp / Cohen bat mitzvah". The cells render the same way. Build the variant logic once.

### Lesson 4 — Drag-to-reschedule is a Phase 2 feature; tap-to-open Event Detail is the v1 affordance

Tripleseat allows drag-to-reschedule on the calendar. v1 here is read-only navigation: tap a cell → open Event Detail. Drag interactions defer to v2. Do not over-engineer interaction primitives in v1.

### Lesson 5 — Empty calendars need teaching, not staring

Per the demo-as-teacher pattern from the Venu welcome dashboard, an empty Calendar should surface sample placeholder rows labeled clearly *"Sample · what a busy week looks like"*. The four-state inquiry taxonomy (Ready to book / Quote sent / Browsing only / Capacity mismatch) shows up here too. New venues and new vendors get *literacy* before they get *data*.

---

## Things that bit prior sessions

1. **Date pickers** — use the locked Orgnz v8 / Venu v2 custom picker if any date input is needed (e.g. jump-to-date)
2. **JS strings with apostrophes** — double-quote prose strings; `\u2019` for curly apostrophes
3. **Unicode escapes leaking** — validate by grepping `\\u` outside JS string literals
4. **No emoji ever** — `✦` reserved for Cue
5. **Validate before delivering** — `node --check`, div balance, headless render
6. **Plan before code** — every session
7. **Masterdoc first** — every session
8. **Search past conversations before assuming**
9. **Mobile is the floor** — 480px design must shine; desktop builds up from there
10. **Time zones** — every event has a tenant timezone; never display naked UTC; format per locale; this bites if missed early

---

## Calendar + Pipeline scope — what this session builds

A standalone HTML prototype: `evntcue_workstation_calendar_pipeline_v1.html`

Three portal variants (Venu, Vndr, Catr; Plnr deferred to v2 same as Event Detail). Each variant renders both views.

### Calendar view

- **Day / Week / Month switch** — Barlow Condensed segmented control top-right
- **Portal axis on left** — italic Cormorant row labels (space names, team member names, kitchen blocks)
- **Date axis on top** — Barlow Condensed weekday labels, italic Cormorant date numbers
- **Cells** — colored per status (teal=booked, gold=hold, bay-blue=inquiry, dim=available), B/H/I single-letter marker
- **Today indicator** — vertical bay-blue line through the current date column
- **Hover/tap cell** — surfaces event name + booking total in a tooltip; tap opens Event Detail
- **Filter bar** — by space (multi-select), by status (multi-select), by participant role
- **Legend** — bottom of card

### Pipeline view

- **Stage columns** — New / Quoted / Hold / Confirmed / Completed (Reviewed collapsed under Completed for v1)
- **Cards** — italic Cormorant event name, role-colored avatar dots, dollar amount, days-out countdown
- **Card density** — desktop: full card with avatar + amount + countdown. Mobile: collapsed to name + amount + status pill.
- **Tap card** → opens Event Detail
- **Filter bar** — by month, by space, by participant role
- **Stage counts** — number badge per column header

### Cue presence

- **Calendar Cue ribbon** at top: *"3 inquiries waiting on your reply, longest 4 days. Top priority: Marisol & Diego — escrow held, response time impacting your Trust Score."*
- **Pipeline Cue ribbon** at top: *"2 events in Hold longer than 7 days. I'll send a check-in draft you can review."*
- Per master §47/§76, italic Cormorant insight, rose accent on named nouns

### What's deferred (do NOT attempt in v1)

- **Drag-and-drop reschedule** on Calendar
- **Drag-and-drop stage advance** on Pipeline (tap-to-promote is v1 affordance)
- **iCal / Google Calendar sync** — schema supports it via `external_calendar_links`, surface "Connect calendar" affordance only
- **Per-staff workload heatmap** — Phase 2
- **Conflict detection** beyond simple overlap (over-capacity, prep-time conflicts) — Phase 2
- **Reviews stage UI** — collapsed under Completed in v1

---

## Design system — locked

Same tokens as Event Detail and the three acquisition arcs. Bay blue / coral / rose / gold / teal. Italic Cormorant for named entities; Barlow Condensed for labels; Barlow for body. EvntCue brand chrome with role pill on the right.

---

## Files attached with this prompt

- `EvntCue_Master_v26_7.html` (or later)
- `evntcue_workstation_event_detail_v1.html` — the destination
- `evntcue_orgnz_freemium_v1.html`, `evntcue_vndr_freemium_v1.html`, `evntcue_venu_freemium_v2.html` — locked acquisition arcs
- This handoff prompt
- Any prior Calendar/Pipeline drafts

## Deliverables for this session

- `evntcue_workstation_calendar_pipeline_v1.html` — three portal variants, both views per variant
- Schema-to-screen lineage map (Markdown) — first artifact
- Summary of done vs deferred
- Updated masterdoc with §85 sub-section reflecting Calendar/Pipeline decisions; revision log entry
- Handoff prompt for **Inquiry Triage** session (next in build order)

---

## Before you begin: the one-paragraph plan

After Step Zero, write me one paragraph describing the structure, the portal-variant logic, the day/week/month transition, the navigation to Event Detail, and what you'll defer.

Only after I say **"go"** do you start writing code.

---

## A note on the deeper architecture

The Calendar is where venue managers spend the second-most time in the workstation (after Event Detail). It's also where the *demo* of the product happens — when a venue manager pulls up EvntCue on a tablet to show a prospective client what their venue's booking pace looks like, they're showing the Calendar. So the Calendar must be both: an internal tool that feels powerful and a public-facing artifact that feels prestigious.

The compounding pattern: **the same data structure that runs the calendar runs the public availability widget on the venue's profile page**. A booking confirmed in the Calendar greys out the date on the public profile in real time. A hold released opens the date back up. The Calendar isn't a separate feature; it's the visible facet of the same `events`/`holds` schema that powers public discovery. Build to that compounding.

---

When you're ready: masterdoc first. Then locked surfaces. Then past conversations. Then schema-to-screen lineage. Then plan. Then build.
