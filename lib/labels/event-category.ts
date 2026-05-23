/**
 * event_type (DB enum) → EventCategory (Lock 13 chip-vocabulary taxonomy).
 *
 * Per Lock 15 (translation layer): DB enum surfaces via this label module so
 * any new render-like / category-aware surface has one place to look up the
 * mapping. First caller: start-render-job.ts (Chunk D Step 3c). Second caller:
 * reroll-slot.ts (Chunk D Step 3e) — actually reuses the parent pin's prompt
 * snapshot so it doesn't need to re-resolve; included here anyway for the
 * downstream re-render and vendor-brief surfaces that will need it.
 *
 * The event_type enum has 21+ values (per migration 001 + extensions); this
 * collapses them to the 5 Lock 13 categories that the chip vocabulary covers.
 *
 * 'other' and unrecognized → 'wedding' — the most-populated chip catalog.
 * The fallback is deliberate: a category-less render is worse UX than a
 * confidently-wedding render, and Cue's prompt assembler tolerates it.
 */

import type { EventCategory } from "@/data/moodboard/types";

export function mapEventTypeToCategory(eventType: string): EventCategory {
  switch (eventType) {
    case "wedding":
    case "reception":
    case "rehearsal_dinner":
    case "engagement_party":
    case "bridal_shower":
      return "wedding";
    case "corporate_meeting":
    case "corporate_gala":
    case "conference":
    case "product_launch":
      return "corporate";
    case "fundraiser":
    case "gala":
      return "nonprofit";
    case "religious":
    case "ticketed":
      return "public";
    case "quinceanera":
    case "birthday":
    case "anniversary":
    case "baby_shower":
    case "graduation":
    case "reunion":
    case "private":
      return "social";
    default:
      return "wedding";
  }
}
