# EvntCue Workstation Handoff Bundle — README

This bundle contains everything needed to build the six-surface EvntCue Workstation across multiple Claude sessions, with drift prevention as a first-class concern.

---

## What's in this bundle

| File | Purpose |
|---|---|
| `EvntCue_Master_v26_7_PATCHES.md` | Patch manifest taking masterdoc v26.6 → v26.7. Apply these changes to `EvntCue_Master_v26_6.html` before starting the first workstation session. Includes new §85 (Workstation Architecture) plus surgical patches to §19, §21, §34, §47, §70, §75.1, §20 revision log. |
| `EvntCue_Workstation_1_EventDetail_Handoff.md` | First workstation session. Builds the gravity well — the five-tab event record. |
| `EvntCue_Workstation_2_CalendarPipeline_Handoff.md` | Second session. Above-the-event navigation. |
| `EvntCue_Workstation_3_Triage_Handoff.md` | Third session. The inbox where new inquiries land. |
| `EvntCue_Workstation_4_Reporting_Handoff.md` | Fourth session. Cross-event analytics. Per master §76 (already locked). |
| `EvntCue_Workstation_5_Admin_Handoff.md` | Fifth session. Tenant config, users/roles, integrations, billing. |
| `EvntCue_Workstation_6_CueSurface_Handoff.md` | Sixth and final session. The dedicated Cue surface + atomic library canonization. |

---

## Workflow per session

1. **Apply masterdoc patches** if not already applied. Each session expects a current masterdoc.
2. **Open a fresh Claude chat.** Don't reuse the prior session's context.
3. **Paste the handoff prompt as your opening message.** Attach the masterdoc, the three locked acquisition arcs, all prior locked workstation surfaces, and any drafts.
4. **Wait for Step Zero.** Claude must read masterdoc, read prior surfaces, search past conversations, produce schema-to-screen lineage map, and write a one-paragraph plan **before** writing code.
5. **Say "go"** when the plan looks right. If it doesn't, push back — make Claude adjust before code.
6. **At session end**, Claude produces:
   - The HTML prototype
   - An updated masterdoc (`EvntCue_Master_v26_X.html` with new revision log entry and §85 sub-section)
   - The handoff prompt for the next session in build order
7. **Each next session uses the updated masterdoc.** This is the drift-prevention loop.

---

## Drift prevention — how this bundle works

Three mechanisms enforce consistency across sessions:

### 1. The masterdoc is the source of truth

Every handoff opens with: *"masterdoc wins. Surface conflicts. Never invent."* If Claude in session 4 disagrees with a decision made in session 1, Claude defers to the masterdoc, which captured that decision. If the masterdoc is silent, Claude surfaces the gap and asks rather than inventing.

### 2. Each handoff requires the schema-to-screen lineage map BEFORE code

Per master §85: *"Before drawing a rectangle in any workstation session, produce a schema-to-screen lineage map for that surface."* This is the brief that prevents the workstation from becoming a thousand small compromises against the schema. Every handoff lists this as a required artifact.

### 3. Each session updates the masterdoc

Decisions made in a session don't live only in that session's HTML. They get folded back into the masterdoc as updated §85 sub-sections, revision log entries, and (where appropriate) updates to other sections. The next session opens against the updated masterdoc, never against an outdated one.

---

## Build order — locked

The order is fixed, not flexible:

1. **Event Detail** — the gravity well. Other surfaces depend on it.
2. **Calendar + Pipeline** — above-the-event navigation. Click → Event Detail.
3. **Triage** — the inbox. Promote → Event Detail.
4. **Reporting** — aggregates over events. Drill-down → Event Detail.
5. **Admin / Settings** — configures the rules Event Detail follows.
6. **Cue Assistant Surface** — threads through everything; designs only crystallize once 1-5 exist.

Don't skip ahead. Don't parallelize. Each session's handoff assumes the prior surfaces are locked.

---

## What's NOT in this bundle

- The workstation HTML files themselves. Those get built session by session.
- The applied masterdoc HTML (`EvntCue_Master_v26_7.html`). The patch manifest captures what to change; you apply the changes to your local v26.6 file. (Or ask Claude in the first workstation session to apply the patches as part of Step Zero.)
- Pro v2 pricing decision ($199/mo · $169/mo annual is the *recommendation*, not a lock). That's a Jason decision before public launch.
- The Plnr variants of any workstation surface. Plnr is deferred to v2 across the board.

---

## When something goes wrong

If a session produces output that conflicts with the masterdoc:

1. Check the masterdoc — is the decision actually locked there?
2. If yes — instruct Claude to revise, citing the §
3. If no — surface the gap, decide explicitly, update the masterdoc with the new lock, then continue

If a session produces output that conflicts with prior locked surfaces:

1. Check the prior locked file — is the pattern explicit there?
2. Instruct Claude to revise to match
3. If the prior pattern was wrong, decide explicitly, update both files, and update the masterdoc with the lock change

If you're more than two sessions deep and feel like things are drifting:

1. Stop. Don't keep building.
2. Read the masterdoc front to back.
3. Read the workstation files in build order.
4. Identify the drift explicitly.
5. Update the masterdoc to lock the canonical answer.
6. Resume.

This bundle is built on the assumption that **drift is inevitable across multi-session work and the response is governance, not heroism.**

---

## Final note on Pro v2 pricing

The masterdoc patch (Patch 1, §19) recommends Pro v2 at $199/mo · $169/mo annual based on the v1 feature bundle being substantially heavier than the original $149 was set against. This is a *recommendation*, not a lock.

Decision required before public launch. Once locked, update §19 with the chosen number and the rationale. The Admin handoff (Workstation 5) builds the Billing surface; if pricing is locked by then, surface the actual numbers; if not, surface placeholders and note the dependency.

---

*Built across the v26.6 → v26.7 session arc. Three intakes locked: Orgnz, Vndr, Venu. Workstation phase begins now.*
