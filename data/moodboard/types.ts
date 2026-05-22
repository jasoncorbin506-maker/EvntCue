/**
 * Mood Board chip taxonomy — type definitions.
 *
 * Per the Chunk B handoff (Backstage/chat-prompts/2026-05-22-moodboard-chunk-b-cc-handoff.md):
 * - Five chip groups: palette / material / mood / florals / typography
 * - Two render modes keyed by group: Palette = `paint` (paints canvas
 *   background with fabric color + texture overlay); other groups = `pin`
 *   (drops a swatch or typography pin on the corkboard).
 * - Per Lock 13 multi-event-type, chip palettes rotate per event category
 *   without privileging any culture in the architecture. Cultural sub-vocabs
 *   live in `data/moodboard/[category]/cultural/[tradition].ts` and are
 *   surfaced only when the user opts into a tradition via migration 024's
 *   cultural traditions picker.
 * - i18n: `labelEs` ships as a stub-equal-to-`labelEn` for Chunk B per the
 *   brief's "Spanish translation of chip labels" out-of-scope item. Per-portal
 *   Spanish pass when each portal wakes up.
 *
 * Source: vocabulary research at
 * ~/Desktop/Backstage/product/moodboard/moodboard-vocabulary-research.md
 */

/**
 * Top-level event categories per Lock 13 (master spec §83). Mirrors
 * `CategoryKey` in `data/budget-presets.ts` for cross-module consistency.
 */
export type EventCategory =
  | "wedding"
  | "corporate"
  | "nonprofit"
  | "public"      // public/cultural
  | "social";

/**
 * Fabric type for Palette chips. Each Palette chip carries one — the canvas
 * background renders the chip's `primaryColor` with a faint texture overlay
 * keyed off this value (CSS-generated for the common cases, tileable PNG
 * fallback at `public/textures/fabric/[type].png` for velvet/lace).
 */
export type FabricType =
  | "linen"
  | "silk"
  | "velvet"
  | "satin"
  | "cotton"
  | "organza"
  | "tulle"
  | "lace";

/**
 * Chip groups. Drawer renders them in a fixed order:
 * Palette · Mood · Material · Florals · Typography.
 */
export type ChipGroup =
  | "palette"
  | "material"
  | "mood"
  | "florals"
  | "typography";

/**
 * Render mode — keyed by group.
 * - `paint` = chip click sets `canvas_state.fabric`, repaints the board.
 *   Only Palette chips use this mode.
 * - `pin` = chip click drops a `mood_board_pins` row with `source = 'chip'`
 *   (added by migration 039). Renders as a swatch pin (small color tile +
 *   name + hex) for color-bearing chips, or as a typography specimen pin
 *   for Typography chips (display + body pairing on a Polaroid frame).
 */
export type ChipRenderMode = "paint" | "pin";

/**
 * Base chip shape — fields common to every chip group.
 */
export interface ChipBase {
  /** Stable identifier — used as the React key and as the chip_key in
   *  `mood_board_pins.tags`. snake-case-with-hyphens. */
  key: string;
  /** Display label in English. */
  labelEn: string;
  /** Display label in Spanish. Stubbed to `labelEn` per Chunk B scope; a
   *  per-portal pass fills this when each portal wakes up. */
  labelEs: string;
  /** Which group this chip lives in. */
  group: ChipGroup;
  /** Whether clicking paints the canvas or drops a pin. */
  renderAs: ChipRenderMode;
  /** Optional — categories where this chip should NOT appear (e.g., a
   *  "candlelight" mood chip might be banned from outdoor-daytime events
   *  if we get that granular). Most chips omit this. */
  bannedFor?: EventCategory[];
  /** Optional — categories where this chip should be in the default-visible
   *  top 6–12 even before any other chips are picked. */
  defaultFor?: EventCategory[];
  /** Optional — keys of other chips that this chip co-occurs with at a
   *  weighted boost. Drives the smart-suggestion engine's re-sort behavior
   *  (full engine is polish-pass; Chunk B ships the data only). */
  coOccurrence?: Record<string, number>;
}

/**
 * Palette chip — paint mode. Click sets the canvas fabric foundation.
 * One palette chip selected at a time per board.
 */
export interface PaletteChip extends ChipBase {
  group: "palette";
  renderAs: "paint";
  primaryColor: string;     // hex
  fabricType: FabricType;
  accentPalette: string[];  // hex accent colors for Cue prompt assembler + co-occurrence
}

/**
 * Material chip — pin mode. Drops a swatch pin with the material's
 * representative color + name.
 */
export interface MaterialChip extends ChipBase {
  group: "material";
  renderAs: "pin";
  swatchHex: string;
  promptSnippet?: string;
}

/**
 * Mood chip — pin mode. Drops a swatch pin colored to evoke the mood.
 */
export interface MoodChip extends ChipBase {
  group: "mood";
  renderAs: "pin";
  swatchHex: string;
  promptSnippet?: string;
}

/**
 * Florals chip — pin mode.
 */
export interface FloralsChip extends ChipBase {
  group: "florals";
  renderAs: "pin";
  swatchHex: string;
  promptSnippet?: string;
}

/**
 * Typography chip — pin mode, custom render (TypographyPin.tsx instead
 * of PinnedImage.tsx).
 *
 * Each chip is a font pairing (display + body) per Jason's 2026-05-21 decision.
 * Specimen text defaults to a generic editorial filler ("Maya & Liam" /
 * "April 17, 2027 · Stonewall Estate") — when the user's `events.name` +
 * `events.start_date` are available, those override the filler at render time.
 *
 * Font URLs use Google Fonts where possible. Foundry-licensed fonts (Tan
 * Pearl, Sangbleu Empire, Söhne, GT America) substitute to Google equivalents
 * documented in the chip data; a future paid-foundry swap is a one-line
 * change per chip.
 */
export interface TypographyChip extends ChipBase {
  group: "typography";
  renderAs: "pin";
  displayFont: string;       // CSS font-family value
  displayFontHref: string;   // Google Fonts <link> URL
  bodyFont: string;
  bodyFontHref: string;
  /** Optional — overrides the default specimen text. */
  specimenText?: {
    display: string;         // e.g., '"Maya & Liam"'
    body: string;            // e.g., 'April 17, 2027 · Stonewall Estate'
  };
  /** Optional — documents the foundry-licensed font this chip substitutes for. */
  substitutesFor?: string;
}

/**
 * Union of all chip variants.
 */
export type AnyChip =
  | PaletteChip
  | MaterialChip
  | MoodChip
  | FloralsChip
  | TypographyChip;

/**
 * Per-category palette — what `byCategory(eventCategory)` returns.
 */
export interface ChipPalette {
  category: EventCategory;
  palette: PaletteChip[];
  material: MaterialChip[];
  mood: MoodChip[];
  florals: FloralsChip[];
  typography: TypographyChip[];
  /** Per-event-type suggested-shot labels for the "Bring it in" drawer
   *  section. Per B-4. */
  suggestedUploads: SuggestedUpload[];
}

/**
 * Suggested upload — a semantic slot label that, when clicked, opens the
 * file picker and tags the resulting pin with the slot via
 * `mood_board_pins.tags`. Slot tags carry forward to Chunk D's Flux prompt
 * assembler.
 */
export interface SuggestedUpload {
  key: string;        // slot tag — written into mood_board_pins.tags
  labelEn: string;
  labelEs: string;
}
