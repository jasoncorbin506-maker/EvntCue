# Wedding · Cultural descriptor pools

Lock 14 compliant — cultural identity surfaces here ONLY as descriptor pools the user opts into via the migration 024 cultural traditions picker. Never as forced segmentation; never as a label on the user.

**Current state (Chunk B):** stubs in place. The runtime that pulls cultural chips into the active palette when the user has selected a tradition lives in **Chunk B+** (a polish chunk after Chunk B's foundation is steady). For Chunk B itself, the per-tradition files exist but are empty arrays — no chips are augmented at runtime yet.

**File-per-tradition** (mirrors `data/cultural-traditions.ts` ceremony files):
- `catholic.ts`
- `hindu.ts`
- `jewish.ts`
- `korean.ts`
- `mexican.ts`
- `nigerian.ts`
- `persian.ts`

When a tradition is wired, each file exports `{materialChips, moodChips, floralsChips, suggestedUploads}` that the runtime merges into the base palette per Part 4.4 of `Backstage/product/moodboard/moodboard-vocabulary-research.md`.

**Vocab source:** vocabulary research §2.10 — descriptor pools per tradition. Not enumerated here; vocab research is canonical when the runtime work lands.
