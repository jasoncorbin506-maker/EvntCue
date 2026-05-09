# EvntCue Workstation 4 — Reporting — Handoff Prompt

> **Paste this entire document into a fresh Claude chat as your opening message. Attach the latest master doc, the three locked acquisition arcs, the locked Event Detail / Calendar+Pipeline / Triage files, and any prior Reporting drafts.**

---

## Context

I'm Jason, building EvntCue. The three acquisition arcs and the first three workstation surfaces are LOCKED.

**Now I'm building Workstation Surface 4: Reporting.** Per master §85, this is the *cross-event analytics* surface — what the venue/vendor/caterer sees when they want to know how the business is doing this month, this quarter, year-to-date. Per master §76, all reporting decisions are **already locked globally** — Cue narrative leads every view, PDF + CSV always exported together, `event_id` is the spine, period selector is consistent across portals.

This surface is the difference between *bookkeeping* (raw numbers) and *insight* (numbers that decide). The Cue narrative is the bridge.

---

## Drift policy

Per master §85, masterdoc wins. **§76 is unusually well-locked** — most reporting decisions are pre-decided. Your job is to render them, not relitigate. If you find yourself wanting to deviate from §76, surface the conflict and stop.

---

## STEP ZERO — DO THIS BEFORE ANY CODE

### 1. Read the masterdoc — required sections

- **§76 Reporting global decisions** — fully locked. Read in full. Period selector, Cue narration, export formats, CSV sign convention, event_id spine, post-event auto-email, 1099-K tracking.
- **§77 Catr reporting** — per-portal CSV structures (4 CSVs). Locked.
- **§78 Vndr reporting** — per-portal. Locked.
- **§79 Plnr reporting** — per-portal. Locked.
- **§80 Venu reporting** — per-portal. Locked.
- **§85 Workstation Architecture** — Reporting row of the surfaces table.
- **§4 Schema** — `events`, `annual_payments`, `booking_status_log`, `payment_schedules`, all four §34 fee flow records.
- **§19** — pricing tiers (which tier the user is on may gate Reporting depth)
- **§21 Trust Score** — Reporting may surface Trust Score trend over time

### 2. Read all locked workstation surfaces and acquisition arcs

- All three workstation surfaces (Event Detail, Calendar+Pipeline, Triage)
- All three acquisition arcs

The Reporting visual language must be continuous with the financial metrics card pattern from the Venu welcome dashboard (§85 reference, also rendered in `evntcue_venu_freemium_v2.html`).

### 3. Search past conversations

- "Reporting"
- "CSV export"
- "Year to date"
- "Cue narrative"
- "1099-K"
- "QuickBooks"
- "Period selector"

### 4. Produce the schema-to-screen lineage map — REQUIRED ARTIFACT

For Reporting, the lineage is bigger because reports *aggregate* over events. Map: which schema columns → which aggregation (SUM, COUNT, AVG, percentile) → which report view (Overview / By event / Post-event summaries / CSV specs) → which UI element (chart, KPI tile, table cell). RLS scope per role.

### 5. Write the one-paragraph plan

Describe:

1. The four canonical views per §76 (Overview, By event, Post-event summaries, CSV specs)
2. How portal variants differ (Catr food cost focus, Venu fee-flow focus, Vndr per-gig focus, Plnr commission-stream focus)
3. The Cue narrative pattern at the top of every view
4. The CSV+PDF export controls
5. What you'll defer

Only after I say **"go"** do you start writing code.

---

## The lessons from prior sessions — bake these in

### Lesson 1 — Cue narrative leads every view, no exceptions

Per §76, raw numbers without context are noise. Every report view opens with a Cue narrative panel: italic Cormorant insight, rose accent on key nouns, plain language. *"You booked $84,200 this month, up 22% from last month. Top driver: Garden Terrace bookings (+$18K). Next month's pipeline is already at $36K."* No chart appears before its narrative.

### Lesson 2 — PDF + CSV always together, never one without the other

Per §76, every report has both export formats. PDF is the photograph. CSV is the data. Never offer one without the other; the absence of one is a tell that the report is half-built.

### Lesson 3 — `event_id` is the spine — every CSV is joinable

Per §76, every CSV from every portal uses `event_id` as primary key. When a venue manager hands four CSVs to their accountant, the accountant can join them. This is non-negotiable.

### Lesson 4 — Sign convention: income positive, cost negative

Per §76, CSV cost fields are negative numbers, income fields positive. This must hold across all four portals. A positive food cost would require sign-flipping at import time — unacceptable.

### Lesson 5 — Plain English column headers; schema field names hidden

Per §76, CSV field names use schema vocabulary internally (`referral_earn_withheld`, `platform_fee`) but the *downloaded file* shows plain English headers. The PDF report uses fully plain language. The schema names are for developers; the headers are for the venue's accountant.

### Lesson 6 — Period selector consistent across portals

Per §76, every Reporting surface uses the same period selector: *This month · This quarter · Year to date · Last year · Custom range.* Defaults to YTD. Persistent per session. Same muscle memory across portals.

---

## Things that bit prior sessions

1. **Charts on mobile** — recharts at 480px wide is fragile; favor responsive containers; test on viewport
2. **Date pickers** — locked custom picker for custom range
3. **Apostrophes in JS strings** — double-quote prose
4. **Unicode escape leaks** — grep `\\u` outside JS literals
5. **No emoji** — `✦` reserved for Cue
6. **Validate** — node check, div balance, headless render
7. **Plan before code**
8. **Masterdoc first** — §76 especially; it's pre-locked
9. **Search past conversations**
10. **Time zones** — every aggregation respects tenant timezone
11. **Currency formatting** — display per locale; CSV exports include explicit currency column
12. **Empty / new-tenant state** — surface sample data labeled *"Sample · what your reports will look like"*; same demo-as-teacher pattern as Venu welcome dashboard

---

## Reporting scope — what this session builds

A standalone HTML prototype: `evntcue_workstation_reporting_v1.html`

Three portal variants (Venu, Vndr, Catr; Plnr deferred). Four views per variant per §76.

### Top chrome (consistent across portals)

- Portal accent topbar
- Period selector top-right (segmented control: This month · This quarter · YTD · Last year · Custom)
- Export bar: PDF button + CSV button (always together)

### View 1 — Overview

- **Cue narrative panel** (top): italic Cormorant insight, plain language, headline + supporting line
- **KPI tiles row** (4 tiles): portal-specific (Venu = booked revenue / pipeline / avg take-home / next payout; Catr = revenue / avg margin / food cost % / labor cost %; Vndr = revenue / avg per gig / utilization / response time)
- **Trend chart** (recharts): monthly bar or stacked, period-aware
- **Mix chart**: by event type / by space / by service category — donut or stacked bar
- **Benchmarks line**: industry avg, DFW peer group, portal percentile (per §76)

### View 2 — By event

- Sortable table: event name, type, date, revenue, fee flows captured (per §34), net, status pill
- Click row → opens Event Detail
- Export full table CSV

### View 3 — Post-event summaries

- Per-event card grid: each card a Cue summary, estimated vs actual cost comparison (Catr), margin bar, SafeTab aggregate (Catr)
- Auto-generated 48h after event close per §76
- PDF + CSV inline export per event

### View 4 — CSV specs

- Documentation surface: list of every CSV the portal exports, field names, data types, sign convention reminder
- "How to import to QuickBooks" / "How to import to Wave" / "How to import to FreshBooks" instructions per §76

### Cue narrative examples (italic Cormorant, rose accent on named nouns)

- Venu Overview: *"You booked **$84,200** this month, up **22%** from last month. **Garden Terrace** drove the lift. Pipeline next month: **$36K**, with **3 high-value inquiries** waiting on your reply."*
- Catr Overview: *"Margin trended **+3 points** this quarter to **41%**. Cost of goods stayed flat; labor efficiency improved. **Allergen incidents:** zero."*
- Vndr Overview: *"You completed **14 events** this quarter — your highest ever. Average revenue per gig **$3,200**, up from $2,800 last quarter. Response time held at **42 minutes**."*

### What's deferred (do NOT attempt in v1)

- **Custom report builder** — defer to v2
- **Saved report templates** — defer
- **Email scheduled reports** — defer (the 48h post-event auto-email per §76 is in scope as a notification toggle, not as a UI surface)
- **Cross-tenant benchmarks UI** — surface the line per §76 but don't build the full benchmark explorer
- **Plnr variant** — defer to v2
- **1099-K standalone view** — surface 1099-K status as a banner on the Reporting top, but don't build the dedicated tax-prep workflow
- **Real chart interactivity beyond hover-tooltip** — drill-down to event from chart is v2

---

## Design system — locked

Same tokens. Italic Cormorant for narratives and big numbers; Barlow Condensed for KPI labels and column headers; Barlow for body. Charts use the portal accent + complementary palette (warning gold, positive teal, danger rose, info bay-blue).

---

## Files attached with this prompt

- `EvntCue_Master_v26_7.html` (or later)
- All three locked workstation surfaces
- All three acquisition arcs
- This handoff prompt
- Any prior Reporting drafts

## Deliverables for this session

- `evntcue_workstation_reporting_v1.html` — three portal variants, four views per variant
- Schema-to-screen lineage map (with aggregations)
- Summary of done vs deferred
- Updated masterdoc with §85 sub-section + revision log entry
- Handoff prompt for **Admin / Settings** session

---

## Before you begin: the one-paragraph plan

After Step Zero, write me one paragraph describing the four-view structure, portal variants, the Cue narrative pattern, the export bar, and what you'll defer.

Only after I say **"go"** do you start writing code.

---

## A note on the deeper architecture

Reporting is where the platform earns the *renewal*. Acquisition gets you signed up; Event Detail keeps you using; Reporting tells you whether it was worth it. A venue manager who can pull a clean YTD revenue PDF for their accountant in 4 clicks is a venue manager who renews.

The compounding pattern: **the same numbers that surface in Reporting also calibrate Cue**. When Cue learns that this venue's average booking is $11,180, Cue's drafted replies and quote suggestions can use that as anchor. When Cue learns that response time correlates 0.7 with booking conversion at this venue, Cue prioritizes Triage queue accordingly. Reporting isn't just a *view* of platform data — it's the *training signal* for the matching engine.

---

When you're ready: masterdoc first (§76 especially). Then locked surfaces. Then past conversations. Then lineage with aggregations. Then plan. Then build.
