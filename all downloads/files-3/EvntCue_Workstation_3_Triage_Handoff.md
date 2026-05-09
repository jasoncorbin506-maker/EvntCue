# EvntCue Workstation 3 — Inquiry Triage — Handoff Prompt

> **Paste this entire document into a fresh Claude chat as your opening message. Attach the latest master doc, the three locked acquisition arcs, the locked Event Detail file, the locked Calendar+Pipeline file, and any prior Triage drafts.**

---

## Context

I'm Jason, building EvntCue. The three acquisition arcs are LOCKED. Workstation Surfaces 1 (Event Detail) and 2 (Calendar + Pipeline) are shipped and locked.

**Now I'm building Workstation Surface 3: Inquiry Triage.** Per master §85, this is the *inbox* — the surface where new inquiries land, qualification badges sort them, Cue drafts the first response, and the venue manager promotes them to events.

This surface is what makes EvntCue different from PartySlate (where inquiries arrive cold) and HoneyBook (where qualification is the venue's manual job). Per the locked Venu hero copy: *"Stop chasing unvetted leads. EvntCue sends you booked clients — vetted, with deposits already in escrow."* Triage is where that promise gets delivered.

---

## Drift policy — read this first

Per master §85, masterdoc wins. Surface conflicts. Never invent. Defer to masterdoc when this handoff is silent.

---

## STEP ZERO — DO THIS BEFORE ANY CODE

### 1. Read the masterdoc — required sections

- **§85 Workstation Architecture** — Triage row of the surfaces table; how Triage feeds Event Detail
- **§4 Schema** — `inquiries`, `event_participants`, `cue_drafts`, plus the qualification fields on `inquiries` (`qualification_state`, `escrow_amount`, `quote_sent_at`, `deposit_cleared_at`)
- **§27 Venue confirmation gate** — defines the inquiry → quote → hold → confirmed lifecycle. Triage is where the first transition happens (inquiry → quote with Cue draft)
- **§47 Boards** — Mood Board / Signature Board / Atmosphere Board as Cue match input. Each inquiry's Mood Board (from Orgnz side) renders inline in Triage as the *why this match*
- **§76 Reporting** — Cue narrative pattern for triage prioritization
- **The four-state qualification taxonomy** (locked in Venu v2 acquisition arc):
  - **Ready to book** (teal) — Orgnz has deposit in escrow, ready to sign
  - **Quote sent** (bay blue) — Venu has quoted, Orgnz hasn't deposited yet, countdown showing
  - **Browsing only** (gold) — soft inquiry, no escrow
  - **Capacity mismatch** (rose) — auto-flagged, Cue suggests redirect

### 2. Read all locked workstation surfaces and acquisition arcs

- `evntcue_workstation_event_detail_v1.html` — locked. Where promoted inquiries land.
- `evntcue_workstation_calendar_pipeline_v1.html` — locked. Pipeline shows promoted inquiries flowing through stages.
- `evntcue_venu_freemium_v2.html` — the four-state taxonomy and the inquiry preview cards live here. Extend, don't redesign.
- The Vndr and Orgnz locked files for cross-portal continuity.

### 3. Search past conversations

- "Inquiry triage"
- "Qualification taxonomy"
- "Cue draft"
- "Browsing only"
- "Ready to book"
- "Cumbres Norte"
- "Capacity mismatch"

### 4. Produce the schema-to-screen lineage map — REQUIRED ARTIFACT

Markdown table. Every column on `inquiries`, `event_participants`, `cue_drafts`, and the inquiry-related fields on `events`, mapped to UI elements. RLS scope per role.

### 5. Write the one-paragraph plan

Describe:

1. The Triage list structure (filter chips by qualification state, sort by escrow value × days waiting)
2. The Triage detail/draft view (inquiry full content, Mood Board inline, Cue's drafted reply, send/edit/skip actions)
3. How "promote to event" works (creates `events` row, transitions Pipeline from New → Quoted, redirects to Event Detail)
4. Portal variants (Venu sees space inquiries; Vndr sees service inquiries; Catr sees menu inquiries; Plnr sees client inquiries)
5. What you'll defer

Only after I say **"go"** do you start writing code.

---

## The lessons from prior sessions — bake these in

### Lesson 1 — The qualification taxonomy is locked; don't introduce new states

The four states (Ready to book / Quote sent / Browsing only / Capacity mismatch) are canonical. Don't add a fifth. The taxonomy compresses every inquiry into a decision-ready signal: *"is this worth my time, and why?"* Adding states dilutes the compression.

### Lesson 2 — Cue drafts the FIRST reply, not every reply

Per the Venu hero promise, Cue drafts the *first* response — the one that moves the inquiry from new to quoted within minutes. Subsequent replies are venue-manager-driven. Cue surfaces in Comms (per Event Detail spec) for ongoing thread but doesn't auto-draft every message. Triage is the *first-response* surface.

### Lesson 3 — Sort by `escrow × days waiting`, not by recency alone

Recency-sorted inboxes train venue managers to reply to whoever shouted last. EvntCue's Triage sorts by *value × urgency* — an inquiry with $5K in escrow that's been waiting 3 days outranks a fresh inquiry with no escrow. Make this default sort visible and labeled (*"Sorted: priority"*); offer recency as toggle.

### Lesson 4 — The Mood Board renders inline in the inquiry detail

Per §47, Cue matches inquiries to venues using the four-dimension fingerprint (Color DNA, Atmosphere, Light & scale, Texture). When the venue manager taps an inquiry, the inquiry detail surfaces the Orgnz's Mood Board as a small grid + Cue's match read. *"This couple's Mood Board reads warm-saturated-honey-cream, like your Garden Terrace."* This is the trust signal that makes the Cue draft credible.

### Lesson 5 — Capacity mismatch with redirect is a feature, not an error

When an inquiry doesn't fit the venue (380 guests for a 220-seated space), Cue doesn't reject it — Cue suggests a redirect. *"Cohen bat mitzvah · 220 guests · Library — Cue suggests redirecting to Grand Ballroom."* The inquiry stays in Triage with a rose Capacity Mismatch tag and a one-tap redirect action. This converts mismatches into bookings instead of bounces.

---

## Things that bit prior sessions

1. **Date pickers** — locked custom picker if any date input
2. **Apostrophes in JS strings** — double-quote prose, `\u2019` for curly
3. **Unicode escape leaks** — grep `\\u` outside JS literals
4. **No emoji** — `✦` reserved for Cue
5. **Validate** — node check, div balance, headless render
6. **Plan before code**
7. **Masterdoc first**
8. **Search past conversations**
9. **Mobile-first 480px**
10. **Time zones, every event** — no naked UTC
11. **PII handling on inquiries** — Orgnz contact info is sensitive; respect RLS scope; don't render full email/phone until inquiry is quoted

---

## Triage scope — what this session builds

A standalone HTML prototype: `evntcue_workstation_triage_v1.html`

Three portal variants (Venu, Vndr, Catr; Plnr deferred). One canonical inbox with 6-8 sample inquiries spanning all four qualification states.

### Triage list view

- **Top bar**: portal accent (bay blue for Venu), filter chips (All / Ready to book / Quote sent / Browsing only / Capacity mismatch), sort toggle (Priority / Recency)
- **Cue ribbon**: *"3 inquiries with escrow waiting longer than 24 hours. I'll draft replies. You review and send."*
- **List rows** — each inquiry as a card:
  - Italic Cormorant name (Marisol & Diego, Henley corporate retreat, etc.)
  - Meta line: space + date + guest count
  - Qualification pill (color per state)
  - Escrow amount (italic Cormorant, bay blue) if applicable
  - Days waiting (Barlow Condensed, txt2)
  - Tap-target full row → opens detail/draft view
- **Empty state**: when no inquiries match filter, surface *"All caught up."* with the brand `✦` glyph and a Cue line *"Your fastest reply this week was 4 minutes — keep it up."*

### Triage detail / draft view (slides in from right on desktop, full-screen modal on mobile)

- **Header**: italic Cormorant Orgnz name + qualification pill + close X
- **Mood Board strip**: 6-8 thumbnail images from the Orgnz's Mood Board, horizontal scroll
- **Cue match read**: rose-bordered insight, 4-dimension match — *"This couple's Mood Board reads warm-saturated-honey-cream. Your Garden Terrace's Atmosphere Board reads warm-saturated-honey-cream. Strong match."*
- **Inquiry content**: date, guest count, budget range (from Orgnz capture), primary contact, message
- **Cue drafted reply**: rose-bordered block, *SUGGESTED:* eyebrow, draft text in italic Cormorant. Two buttons: primary "Send as drafted" + ghost "Edit"
- **Quick actions** below: Promote to event (creates event record, redirects to Event Detail) / Skip / Decline (with reason)

### Capacity Mismatch variant of the detail view

- Same structure but with **rose-bordered redirect block**: *"This guest count exceeds your Library capacity. Cue suggests redirecting to Grand Ballroom — same date available."*
- **Redirect with one tap**: button transitions the inquiry to a new space, regenerates the Cue draft, surfaces back in the list

### Cue presence

- **List Cue ribbon** at top of inbox (priority signal)
- **Detail Cue match read** (4-dimension fingerprint match)
- **Detail Cue draft** (the drafted reply itself)
- **Empty-state Cue line** (encouragement / response-time stat)

### What's deferred (do NOT attempt in v1)

- **Bulk operations** (multi-select, batch-decline) — v2
- **Auto-decline rules** (e.g. auto-decline inquiries below $X) — v2
- **Snooze / reminder** — v2
- **Cue's *second* drafted reply** based on Orgnz response — v2
- **Saved reply templates** — Cue handles drafting, templates are deferred
- **Plnr variant** — Plnrs see inquiries on a sourcing dashboard; full variant in v2

---

## Design system — locked

Same tokens. Italic Cormorant + Barlow Condensed + Barlow. Bay blue / coral / rose / gold / teal. EvntCue brand chrome.

---

## Files attached with this prompt

- `EvntCue_Master_v26_7.html` (or later)
- `evntcue_workstation_event_detail_v1.html`
- `evntcue_workstation_calendar_pipeline_v1.html`
- The three locked acquisition arcs
- This handoff prompt
- Any prior Triage drafts

## Deliverables for this session

- `evntcue_workstation_triage_v1.html` — three portal variants, list + detail/draft view
- Schema-to-screen lineage map
- Summary of done vs deferred
- Updated masterdoc with §85 sub-section + revision log
- Handoff prompt for **Reporting** session (next in build order)

---

## Before you begin: the one-paragraph plan

After Step Zero, write me one paragraph describing the list structure, the detail/draft pattern, the promote-to-event flow, the capacity-mismatch redirect, the Cue presence pattern, and what you'll defer.

Only after I say **"go"** do you start writing code.

---

## A note on the deeper architecture

Triage is where the platform *delivers* on the acquisition promise. The landing page said *"Stop chasing unvetted leads. We send you booked clients — vetted, with deposits already in escrow."* If Triage doesn't actually deliver inquiries that feel pre-qualified, the platform's pitch breaks. So Triage isn't just a feature; **it's the proof artifact of the entire marketplace's value proposition**.

The compounding pattern: **every inquiry that flows through Triage trains the matching engine**. Cue's match reads improve as more inquiries go through. The qualification states tighten as more deposits clear. The Trust Score component for response time gets calibrated against actual venue behavior here. Triage is the data engine of the entire matching marketplace, surfaced as a clean inbox.

---

When you're ready: masterdoc first. Then locked surfaces. Then past conversations. Then lineage. Then plan. Then build.
