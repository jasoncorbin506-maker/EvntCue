# EvntCue Workstation 6 — Cue Assistant Surface — Handoff Prompt

> **Paste this entire document into a fresh Claude chat as your opening message. Attach the latest master doc, the three locked acquisition arcs, all five locked workstation surfaces (Event Detail, Calendar+Pipeline, Triage, Reporting, Admin), and any prior Cue surface drafts.**

---

## Context

I'm Jason, building EvntCue. The three acquisition arcs and the first five workstation surfaces are LOCKED.

**Now I'm building Workstation Surface 6: Cue Assistant Surface.** Per master §85, Cue is **not a tab** — Cue is *presence*, threaded through every other surface. This session's job is to canonicalize Cue's behavior, voice, and UI patterns across the workstation, plus build the *one* dedicated Cue surface where the user can: review Cue's drafted-but-unsent work, see Cue's open follow-ups, configure Cue's autonomy level, and audit Cue's actions.

Build order placed Cue last for a reason: **its design only crystallizes once the surfaces it threads through exist**. Now they exist. Time to make Cue coherent.

---

## Drift policy

Per master §85, masterdoc wins. Surface conflicts. Never invent. **Cue's voice and behavior patterns are unusually well-locked across prior sessions** — this handoff is mostly about consolidating, not redefining.

---

## STEP ZERO — DO THIS BEFORE ANY CODE

### 1. Read the masterdoc — required sections

- **§85 Workstation Architecture** — Cue row of the surfaces table
- **§47 Boards** — the three-vector matching engine that Cue runs on
- **§76 Reporting / Cue narrative pattern** — Cue narrative is locked here for all reporting views; same pattern surfaces everywhere
- **§4 Schema** — `cue_drafts`, `cue_followups`, `cue_anomalies`, `cue_narratives`, plus any audit fields that track Cue actions
- **All sections that reference Cue** — search the masterdoc for "Cue" globally; expect to find references in §5, §27, §44, §47, §55, §75/§75.1/§75.2, §76, §85
- **The custom-Cue color convention** (§47) — rose for both Cue voice AND user custom contributions, the semiotic loop

### 2. Read all locked workstation surfaces and acquisition arcs

You've now built five surfaces. Catalog every place Cue surfaces, with explicit citation:

- **Event Detail Overview**: Cue narrative panel — *"Cumbres Norte requires $1M COI by Aug 29. I will follow up with them in 14 days."*
- **Event Detail Comms**: Cue drafted reply — rose-bordered SUGGESTED block with Send-as-drafted + Edit
- **Event Detail Tasks**: Cue-generated tasks — *"Cue will follow up Aug 29"* with Cue avatar
- **Event Detail Payments**: Cue anomaly flags — *"This is 23% above your average — review"*
- **Calendar Cue ribbon**: priority signal across the week
- **Pipeline Cue ribbon**: stale-stage detection
- **Triage Cue ribbon**: priority queue ordering
- **Triage detail Cue match read**: 4-dimension fingerprint match
- **Triage detail Cue draft**: the first-response draft
- **Reporting Cue narratives**: per-view insight panels per §76
- **Admin Cue ribbons**: per-sub-section advisory notes (e.g. *"3 of your spaces don't have floor plans uploaded"*)

This catalog is the input to your plan. **Cue's coherence depends on these patterns being consistent in voice, color, layout, action affordance, and accountability.**

### 3. Search past conversations

- "Cue voice"
- "Cue draft"
- "Cue anomaly"
- "Cue follow-up"
- "Cue narrative"
- "Cue autonomy"
- "Hallucination"
- "Cue accountability"
- "Cue boundaries"

### 4. Produce the schema-to-screen lineage map — REQUIRED ARTIFACT

Map every column on `cue_drafts`, `cue_followups`, `cue_anomalies`, `cue_narratives` to the surface where it renders. This map is small but high-leverage — it's the index of every place Cue *acts* in the product.

Also map: every place Cue *reads from* (event data, schema columns, mood/signature/atmosphere boards, user history) to make a decision. This is the *input* lineage. Cue's transparency depends on the user being able to ask *"why did Cue suggest this?"* and getting an answer rooted in concrete schema columns.

### 5. Write the one-paragraph plan

Describe:

1. The Cue UI atomic library (the canonical components that surface across all surfaces — narrative panel, draft block, ribbon, anomaly pill, follow-up task, match read)
2. The dedicated Cue surface — what it contains (drafts pending review, follow-ups list, autonomy controls, action audit)
3. The autonomy levels (Cue suggests, Cue drafts, Cue auto-sends with retroactive log) and how they're configured per action class
4. The transparency model (every Cue action surfaces *why* — links to source data)
5. What you'll defer

Only after I say **"go"** do you start writing code.

---

## The Cue lessons from all prior sessions — bake these in

### Lesson 1 — Cue is humble, italic, asking-not-asserting

Cue's voice rules across sessions: italic Cormorant for warm questions and named-noun assertions, Barlow Condensed for labels. *"How does your space feel at golden hour?"* *"Cumbres Norte requires $1M COI by Aug 29."* Never *"You should..."*, never *"Have you considered..."* Specific, dated, named-noun, accountable.

### Lesson 2 — Cue makes specific, dated, accountable assertions, never vague

When Cue says it will follow up, it says *with whom*, *by what date*, *for what reason*. Not *"I'll keep an eye on this."* Specificity forces accountability and creates an audit-able artifact.

### Lesson 3 — Cue's color is rose, ALWAYS rose, across all four portals

Per §85 cross-references and §47, Cue is rose `#D4778A` because Cue is cross-portal — distinct from any single portal's accent (Vndr coral, Venu bay blue, Catr gold, Plnr ?, Orgnz rose-shared-with-Cue). The rose color signals *"this is the platform speaking, not your venue speaking"*.

### Lesson 4 — Custom-Cue color convention — rose for user-specific too

Per §47, when a user adds custom content the platform did not suggest (custom inclusions, custom restrictions, manual overrides), the rendered chip is also rose. The semiotic loop: user contribution wears the same color as platform interpretation. *The platform is listening to your specific truth here.* This convention extends across the workstation — anywhere a user has authored something the platform recognizes as "their voice" rather than "default config", surface in rose.

### Lesson 5 — Cue admits limits, surfaces uncertainty

Cue says *"I'm not sure"* when it isn't. Cue says *"based on 3 events at this venue, the average is..."* with the n=3 exposed. Cue says *"this match scored 0.82 on color but 0.61 on light — strong color match, weaker light match, decide accordingly"*. Numbers exposed; confidence calibrated.

### Lesson 6 — Cue auto-action requires explicit autonomy grant per action class

Per the action classes:

- **Narrate** (Reports, Calendar, Pipeline ribbons) — always autonomous, always shown, no consent needed (it's just narrative)
- **Match** (Triage detail, BEO assignment) — autonomous, surfaced with reasoning
- **Draft** (Comms first replies) — autonomous to draft, **never autonomous to send** in v1 (user always reviews)
- **Follow-up** (Tasks generated by Cue) — autonomous to create, user can dismiss
- **Anomaly flag** (Payments, Booking) — autonomous to flag, user reviews
- **Reschedule / Cancel / Send-on-behalf** — never autonomous in v1; explicit user action only

Make autonomy per-class **toggleable in Admin/Cue settings**. v1 ships with v1 defaults locked; v2 may unlock more autonomy classes per power-user opt-in.

### Lesson 7 — Every Cue action has a "why" link

Click any Cue assertion → see the source data. *"Why does Cue think Cumbres Norte needs COI by Aug 29?"* → opens an inline panel showing the relevant `event_participants` row, the catering contract clause, the days-until-event countdown. Transparency is the trust contract.

### Lesson 8 — Cue's drafts are explicitly drafted, never disguised as user authorship

When Cue drafts a reply in Comms, the draft is rose-bordered and labeled SUGGESTED. The user's "Send as drafted" action attributes the message to the user (because the user made the send decision), but the draft origination is logged as Cue. **Never let Cue's authorship be invisible.** Audit log captures origination.

### Lesson 9 — Cue follows up by date, not by vibes

When Cue creates a follow-up task, the task has an explicit due date. Cue's commitments are dated. *"Follow up with Cumbres Norte on Aug 29 about COI"* — that date isn't *"in a couple weeks"*; it's Aug 29. The Tasks tab in Event Detail surfaces these with the date prominent.

### Lesson 10 — Cue should be quietest when things are working

Empty Cue state is success. A venue with all events on track, all payments cleared, all follow-ups handled should see *"All caught up — `✦`"* and that's it. Cue surfaces only when there's a decision to make. Excessive Cue chatter erodes trust faster than Cue silence.

---

## Things that bit prior sessions

1. **Cue voice drift** — across iterations, Cue can become preachy, salesy, or generic. The rule: read Cue's surfaced text aloud; if it sounds like Cue is *trying to be helpful*, rewrite. Cue is helpful by being specific, not by sounding helpful.
2. **Cue color drift** — rose, never bay blue, never coral, never gold. The cross-portal convention is non-negotiable.
3. **Hallucination** — Cue cites sources. *"Based on 14 events at this venue..."* with the n exposed. Cue never invents capabilities or data.
4. **Apostrophes in JS strings** — `\u2019` for curly
5. **Unicode escape leaks** — grep `\\u` outside JS literals
6. **No emoji except `✦`** — reserved for Cue brand mark
7. **Validate** — node check, div balance, headless render
8. **Plan before code**
9. **Masterdoc first**
10. **Search past conversations**
11. **Audit log everything** — every Cue action logs to `cue_actions_audit` (in schema); Admin Cue surface surfaces this
12. **Don't anthropomorphize Cue past the brand voice** — Cue isn't a person, doesn't have feelings, doesn't make small talk; the italic Cormorant warmth is *style*, not personality

---

## Cue Surface scope — what this session builds

Two artifacts:

### Artifact 1 — `evntcue_workstation_cue_v1.html` — the dedicated Cue surface

A single workstation page, accessible via a Cue button in the topbar (the `✦` glyph) or a dashboard widget. Contents:

- **Header**: italic Cormorant *"What Cue is doing for you"* + role pill + Cue's status (active / paused / silent)
- **Drafts pending review** card — list of Cue-drafted Comms replies waiting for user send/edit. Each row: event name, recipient, draft preview, age. Click → opens Event Detail Comms with the draft pre-loaded.
- **Open follow-ups** card — Cue-created tasks that are open. Each row: task, due date, source (which event), Cue's reason. Tap → opens Event Detail Tasks.
- **Recent narratives** card — last N Cue narratives across all surfaces. Each row: surface (e.g. Reporting / Pipeline / Calendar), narrative text, timestamp.
- **Anomalies surfaced** card — recent Cue flags. Same row pattern.
- **Cue autonomy controls** card — per-action-class toggles per Lesson 6. Default v1 settings shown. Tooltip explains each.
- **Cue actions audit** card — last 50 actions Cue took, with origination (autonomous / drafted-and-sent-by-user / user-edited). Filter by class. Search.

### Artifact 2 — `EvntCue_Cue_UI_Atomic_Library.md` — design system canonization

A Markdown reference for future sessions. Documents:

- **Cue narrative panel** — markup, CSS class, voice rules, examples by context (Reporting / Calendar / Triage)
- **Cue draft block** — markup, the rose-bordered SUGGESTED block, Send/Edit buttons, attribution rules
- **Cue ribbon** — markup, top-of-surface insight banner pattern
- **Cue anomaly pill** — markup, inline alert pattern
- **Cue follow-up task row** — markup, the Cue-avatar attribution
- **Cue match read** — markup, 4-dimension fingerprint readout
- **Cue empty state** — *"All caught up"* + `✦`

This atomic library is the **canonical reference** for any future Cue surface in any future session. Future Claude reads this instead of re-deriving Cue patterns.

### Cue presence retrofit pass (optional, v1.5)

If time allows in this session, do a *retrofit consistency pass* across the prior five workstation surfaces — verify that every Cue surfacing uses the now-canonical atomic library. Don't rebuild; just call out drift in a written report. *"Event Detail Overview Cue narrative is using a slightly different border-radius than canon — minor; queue for v1.5"*. Don't fix; document.

### What's deferred (do NOT attempt in v1)

- **Cue full action history explorer** — surface last 50 actions; full explorer is v2
- **Cue training/feedback UI** — *"This Cue suggestion was unhelpful"* feedback collection — v2
- **Cue-on-Cue meta** (Cue analyzing its own performance) — v3
- **Voice / SMS Cue surfaces** — v3
- **Plnr variant** — defer

---

## Design system — locked

Same tokens, with Cue's rose `#D4778A` as the dominant accent across this surface. Italic Cormorant for narrative; Barlow Condensed for labels; Barlow for body. The `✦` glyph is the only emoji-equivalent in the entire product.

---

## Files attached with this prompt

- `EvntCue_Master_v26_7.html` (or later)
- All five prior workstation surfaces
- All three acquisition arcs
- This handoff prompt
- Any prior Cue surface drafts

## Deliverables for this session

- `evntcue_workstation_cue_v1.html` — the dedicated Cue surface
- `EvntCue_Cue_UI_Atomic_Library.md` — design system canonization for future sessions
- Schema-to-screen lineage map (input + output sides — what Cue reads from and what Cue writes to)
- Optional retrofit consistency report across prior five surfaces
- Summary of done vs deferred
- Updated masterdoc with §85 sub-section for Cue + §47 cross-link reinforcing Cue as cross-portal + revision log entry
- (Optional) Updated handoff prompt for Workstation v2 / Phase 2 features

---

## Before you begin: the one-paragraph plan

After Step Zero, write me one paragraph describing the dedicated Cue surface structure, the autonomy control model, the transparency/why-link pattern, the atomic library scope, and what you'll defer.

Only after I say **"go"** do you start writing code.

---

## A note on the deeper architecture

Cue is the platform's **assistant-as-feature** vs **assistant-as-personality** decision point. We've consistently chosen the former. Cue is not a chatbot, not a personality, not a co-worker. Cue is *infrastructure with a voice* — a set of automation surfaces (drafting, follow-up, anomaly detection, narrative) presented under a unified visual and voice convention so users learn one mental model instead of five.

The compounding pattern: **every Cue action becomes training data for matching, narrative tone, and future automation**. When a user accepts a Cue-drafted reply unchanged, that's positive signal for the matching/draft engine. When a user heavily edits a draft, that's tuning signal. When a user dismisses a follow-up, that's filter signal. Cue improves session over session, tenant over tenant, year over year. The Cue Surface in v1 is the visible part of this learning loop; the invisible part is the data infrastructure under it.

The deepest architectural insight from the entire build so far: **the platform's value is not in any single feature; it's in the compounding across features**. The Atmosphere Board feeds matching feeds Triage feeds drafted Comms feeds confirmed bookings feeds Reports feeds Trust Score feeds search rank feeds inquiries feeds the Atmosphere Board getting more accurate over time. Cue is the *visible thread* connecting all of these — the user-facing surface of the platform's learning loop. Build to that compounding.

---

When you're ready: masterdoc first. Then locked surfaces. Then past conversations. Then schema lineage (input + output). Then plan. Then build.

---

## Final note — this is the last workstation handoff

After this session, the v1 Workstation is feature-complete. The next phase is **Workstation v2 / Phase 2**: drag-and-drop reschedule, full-screen calendar, BEO acknowledgment workflow detail, BEO floor-plan annotations, real-time WebSocket Comms, audit log explorers, Plnr variants of all six surfaces, custom report builder, voice/SMS Cue surfaces.

If you want to write the v2 handoff at the end of this session, the masterdoc revision log entry and §85 sub-section additions provide the source. Otherwise, the v2 phase begins as its own session arc, with this handoff plus the v1 atomic library as its starting point.
