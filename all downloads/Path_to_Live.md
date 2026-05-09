# EvntCue — Path to Live, Step by Step

> **The honest version.** No more prototype detail work. You have a production codebase already started — finish it.

---

## Where you are right now

- ✅ Landing page live on Vercel
- ✅ Next.js 14 App Router project running locally
- ✅ Supabase connected (`lib/supabase.js`)
- ✅ Database schema deployed (82 tables, 148 RLS policies)
- ✅ Staff admin console scaffolded
- ✅ Three acquisition arc HTML prototypes done (these are now **design references**, not deliverables)
- ✅ Masterdoc v26.7 — the architectural source of truth

**Next critical step: finish auth so users can actually sign up.**

---

## The order — don't deviate

### Step 1 — Finish Google OAuth authentication
**Time: 30-60 minutes. Open a new Claude chat for this.**

Tell Claude:
> "I'm Jason. I have a Next.js 14 App Router project at `~/evntcue` connected to Supabase. The schema is deployed (82 tables incl. `users`, `tenants`, `tenant_users`). I need to finish Google OAuth: enable in Supabase, install `@supabase/ssr`, build login/signup page, auth callback route, and route protection middleware. Walk me through it."

Don't move on until you can sign in with Google and see your own user record in the Supabase users table.

### Step 2 — Role selection / onboarding gate
**Time: 2-3 hours. Same Claude chat or a new one.**

After login, the user picks a portal: Orgnz / Plnr / Vndr / Catr / Venu. This creates a `tenants` row + a `tenant_users` row linking them as owner. Then they land on a placeholder dashboard.

Reference: master §75, §75.1 for portal definitions.

### Step 3 — Convert ONE acquisition arc to real React
**Time: ~1 week. Pick Venu first.**

Open a fresh Claude chat with these attachments:
- `EvntCue_Master_v26_7.html`
- `evntcue_venu_freemium_v2.html` (the locked design reference)
- Your repo (or paste your `app/` folder structure)

Tell Claude:
> "I'm converting the locked Venu acquisition arc HTML prototype to production React in my Next.js 14 App Router project. The HTML is the design spec. Build it as Next.js pages + shadcn/ui components, wired to Supabase. The schema is deployed; use the existing tables (tenants, spaces, mood_boards, etc.). Follow the design exactly — this isn't redesign work, it's production conversion."

Validate as you go: can a real venue manager actually sign up, complete the 6-stage onboarding, and end up with a real `tenants` row + `spaces` rows + `mood_board_items` rows in Supabase? When yes, this step is done.

### Step 4 — Repeat Step 3 for Vndr, then Orgnz
**Time: ~2 days each (faster, pattern is now established).**

Same approach. Use `evntcue_vndr_freemium_v1.html` and `evntcue_orgnz_freemium_v1.html` as the design specs.

After this step: **all three portals can sign up real users.** That's a real product.

### Step 5 — Workstation: Event Detail first
**Time: ~2 weeks.**

Open a fresh Claude chat. Attach:
- `EvntCue_Master_v26_7.html`
- `EvntCue_Workstation_1_EventDetail_Handoff.md` (USE AS DESIGN SPEC, not as prototype build instructions)
- Your locked acquisition arcs as design language reference
- Your repo

Tell Claude:
> "Build Workstation Surface 1 (Event Detail) per the handoff brief, but as production React in my existing Next.js project — not as a standalone HTML prototype. The handoff describes the design; you build it as real components wired to the schema. Five tabs: Overview / BEO / Comms / Payments / Tasks. Three portal variants (Venu, Vndr, Catr). Plnr deferred."

### Step 6 — Workstations 2-6 in order
**Time: 2-4 weeks each, in order.**

Use the corresponding handoff doc as the design spec each time. Same pattern: production React, not HTML.

**Build order is locked. Don't skip ahead.**

1. ✅ Event Detail
2. Calendar + Pipeline
3. Inquiry Triage
4. Reporting
5. Admin / Settings
6. Cue Assistant Surface

### Step 7 — Stripe Connect integration
**Time: ~1 week.**

Per master §83 audit checklist: webhook idempotency, `SELECT FOR UPDATE` on payment writes, integer cents only, per-tenant Connect accounts. Run the audit before going live.

### Step 8 — Soft launch
**Time: depends.**

Onboard 5-10 real venues yourself. Watch for breaks. Fix. Then 50. Then open the gates.

---

## What I had wrong before

The "six workstation handoffs that produce HTML prototypes" plan was a category mistake. The handoffs are useful **as architectural design specs** — read them, follow their structural decisions. But the deliverable from each handoff session should be **production React code in your existing Next.js project**, not another standalone HTML file.

The HTML prototypes you already have (Orgnz, Vndr, Venu) are the *visual* reference. They're done. Don't build any more of them. Every workstation surface from here forward is real code that ships.

---

## Drift prevention rule (still applies)

Every production build session opens with the same 3 attachments:
- The masterdoc (currently `EvntCue_Master_v26_7.html`)
- The relevant locked design reference (acquisition HTML or workstation handoff)
- Your codebase

Drift is detected the same way: design diverges from masterdoc → masterdoc wins until written exception. The handoff bundle's drift policy carries forward into production. The masterdoc gets updated at the end of every session with what was decided.

---

## What you do NOT do next

- ❌ Build more HTML prototypes
- ❌ Refine prototype copy further
- ❌ Add more visual polish to the locked acquisition arcs
- ❌ Design Plnr-variant prototypes (Plnr is v2 across the board)
- ❌ Start the Cue Assistant Surface before the other 5 workstation surfaces exist

---

## What to do RIGHT NOW (today, if possible)

1. Open your terminal, navigate to your `~/evntcue` Next.js project
2. Run `npm run dev` — confirm it still works
3. Open a fresh Claude chat
4. Paste this opening message:
   > "I'm Jason from EvntCue. I have a Next.js 14 App Router project at `~/evntcue` with Supabase already connected and a 82-table schema deployed. I'm ready to finish Google OAuth authentication. Walk me through: enabling Google OAuth in Supabase dashboard, installing `@supabase/ssr`, creating the login page, the auth callback route, and route protection middleware. After this, I should be able to sign in to my own app for the first time."
5. Follow the steps. Don't stop until you can sign in.

That's the next 30-60 minutes. Everything else follows from getting auth working.

---

*The site goes live by writing production code. Prototype design is finished. Time to ship.*
