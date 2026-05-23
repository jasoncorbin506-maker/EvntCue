import type { VndrCategoryKey } from "@/data/vndr-categories";

/**
 * SVG icons for the Stage 1 category chip grid. Ported verbatim from
 * 02_Locked_Prototypes/Vndr/evntcue_vndr_freemium_v1.html lines 804–847
 * (each .cat-card's inline SVG). Stored as a map so Stage1.tsx stays
 * focused on selection state — icons are pure presentation.
 *
 * All icons share viewBox "0 0 16 16" with currentColor + 1.2 stroke width
 * for a consistent line-art feel. The Stage 1 card sets `color: var(--coral)`
 * on the icon wrapper so the icon picks up coral on hover / selected.
 */
export const CATEGORY_ICONS: Record<VndrCategoryKey, React.ReactNode> = {
  photo: (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="2" y="4" width="12" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="8" cy="8.5" r="2.5" stroke="currentColor" strokeWidth="1.2" />
      <rect x="6" y="2.5" width="4" height="2" rx="0.5" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  ),
  florals: (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M8 2v4M8 14V8M5 5l3 3M11 5l-3 3M3 9l5-1M13 9l-5-1"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <circle cx="8" cy="6.5" r="2" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  ),
  audio: (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M3 11V7a5 5 0 0110 0v4M3 11h2v3H3v-3zM11 11h2v3h-2v-3z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  ),
  visual: (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M8 2L13 13H3L8 2z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <circle cx="8" cy="9" r="1.5" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  ),
  rentals: (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="2.5" y="6" width="11" height="7" rx="0.5" stroke="currentColor" strokeWidth="1.2" />
      <path
        d="M2 6L8 2l6 4"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  ),
  // 'dessert' icon removed 2026-05-23 (Lock 14 amendment) — Catr territory.
  beauty: (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="6" r="3" stroke="currentColor" strokeWidth="1.2" />
      <path
        d="M3 14c0-2.5 2.2-4.5 5-4.5s5 2 5 4.5"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  ),
  entertain: (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="3" y="3" width="10" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="6" cy="6" r="0.8" fill="currentColor" />
      <circle cx="10" cy="10" r="0.8" fill="currentColor" />
      <circle cx="10" cy="6" r="0.8" fill="currentColor" />
      <circle cx="6" cy="10" r="0.8" fill="currentColor" />
    </svg>
  ),
  transport: (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M2 11V8l1.5-3.5h9L14 8v3M2 11h12M2 11v2h2v-2M14 11v2h-2v-2"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  ),
};
